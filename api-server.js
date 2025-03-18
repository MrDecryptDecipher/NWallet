import express from 'express';
import cors from 'cors';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const distDir = path.join(__dirname, '..', 'NFTGen', 'dist');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://3.111.22.56:5174',  // Nwallet frontend
      'http://3.111.22.56:5175',  // NFTGen frontend
      'http://localhost:5174',
      'http://localhost:5175'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-NFTGEN-Session', 'X-NFTGEN-Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Monitoring stats
const stats = {
  startTime: Date.now(),
  requests: 0,
  errors: 0,
  lastError: null
};

// Retry configuration
const retryConfig = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2
};

// Retry mechanism
async function withRetry(operation, context = '') {
  let lastError;
  let delay = retryConfig.delay;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt}/${retryConfig.maxAttempts} failed for ${context}:`, error);
      
      if (attempt < retryConfig.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= retryConfig.backoff;
      }
    }
  }
  
  stats.errors++;
  stats.lastError = {
    message: lastError.message,
    context,
    timestamp: new Date().toISOString()
  };
  
  throw lastError;
}

// Define GraphQL schema
const typeDefs = `#graphql
  enum OrderDirection {
    asc
    desc
  }

  type NFT {
    id: ID!
    name: String!
    description: String
    image: String
    owner: String!
    fractions: [Fraction]
    royalties: [Royalty]
    createdAt: String
  }

  type Fraction {
    id: ID!
    percentage: Float!
    owner: String!
  }

  type Royalty {
    id: ID!
    percentage: Float!
    recipient: String!
  }

  type Transfer {
    id: ID!
    from: String!
    to: String!
    tokenId: String!
    timestamp: String!
    transactionHash: String
    nft: NFT
  }

  input TransferOrderBy {
    field: String!
    direction: OrderDirection!
  }

  type Query {
    nfts(owner: String!): [NFT]!
    transfers(
      address: String!
      orderBy: TransferOrderBy
    ): [Transfer]!
  }
`;

// Define resolvers with retry mechanism
const resolvers = {
  Query: {
    nfts: async (_, { owner }) => {
      return withRetry(async () => {
        const files = await fsPromises.readdir(dataDir);
        const nftFiles = files.filter(f => f.startsWith('nft_'));
        const nfts = [];
        
        for (const file of nftFiles) {
          const data = JSON.parse(await fsPromises.readFile(path.join(dataDir, file), 'utf8'));
          if (data.owner.toLowerCase() === owner.toLowerCase()) {
            // Add missing fields with default values
            data.fractions = data.fractions || [];
            data.royalties = data.royalties || [];
            data.createdAt = data.createdAt || new Date().toISOString();
            nfts.push(data);
          }
        }
        
        return nfts;
      }, 'Query.nfts');
    },
    transfers: async (_, { address, orderBy }) => {
      return withRetry(async () => {
        const files = await fsPromises.readdir(dataDir);
        const transferFiles = files.filter(f => f.startsWith('transfer_'));
        let transfers = [];
        
        for (const file of transferFiles) {
          const data = JSON.parse(await fsPromises.readFile(path.join(dataDir, file), 'utf8'));
          if (data.from.toLowerCase() === address.toLowerCase() || 
              data.to.toLowerCase() === address.toLowerCase()) {
            // Add missing fields with default values
            data.transactionHash = data.transactionHash || data.id;
            data.nft = data.nft || null;
            transfers.push(data);
          }
        }

        if (orderBy) {
          const direction = orderBy.direction.toLowerCase() === 'desc' ? -1 : 1;
          transfers.sort((a, b) => {
            const aVal = a[orderBy.field];
            const bVal = b[orderBy.field];
            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
            return 0;
          });
        }
        
        return transfers;
      }, 'Query.transfers');
    }
  }
};

// Environment variables
const PORT = process.env.PORT || 5177;
const WS_PORT = process.env.WS_PORT || 5176;
const NFTGEN_PORT = process.env.NFTGEN_PORT || 5175;
const NIJA_WALLET_PORT = process.env.NIJA_WALLET_PORT || 5174;
const WS_HOST = process.env.WS_HOST || '3.111.22.56';

// WebSocket client for communicating with WS server
let wsClient = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;

// Connect to WebSocket server
const connectToWsServer = () => {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    console.log('WebSocket connection already exists');
    return;
  }

  const wsUrl = `ws://${WS_HOST}:${WS_PORT}/ws`;
  console.log('Connecting to WebSocket server at:', wsUrl);
  
  wsClient = new WebSocket(wsUrl);
  
  wsClient.on('open', () => {
    console.log('Connected to WebSocket server');
    reconnectAttempts = 0; // Reset attempts on successful connection
    // Send initial handshake
    wsClient.send(JSON.stringify({
      type: 'HANDSHAKE',
      service: 'api-server'
    }));
  });
  
  wsClient.on('close', () => {
    console.log('Disconnected from WebSocket server');
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`Attempting reconnect in ${RECONNECT_INTERVAL/1000}s... (Attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
      setTimeout(connectToWsServer, RECONNECT_INTERVAL);
      reconnectAttempts++;
    } else {
      console.log('Max reconnection attempts reached. Please check the WebSocket server status.');
    }
  });
  
  wsClient.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log(`WebSocket server at ${wsUrl} not ready`);
    }
  });

  wsClient.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);
      
      switch (message.type) {
        case 'WELCOME':
          console.log('Received welcome message from WebSocket server');
          break;
          
        case 'INITIAL_DATA':
          console.log('Received initial data from WebSocket server');
          break;
          
        case 'TRANSACTION_UPDATE':
          handleTransactionUpdate(message.data);
          break;
          
        case 'BALANCE_UPDATE':
          handleBalanceUpdate(message.data);
          break;
          
        default:
          console.log('Received message of type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
};

// Initialize WebSocket connection with delay
setTimeout(connectToWsServer, 2000);

// Create Express app
const app = express();

// Request logging middleware
app.use((req, res, next) => {
  stats.requests++;
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Configure CORS
app.use(cors(corsOptions));
app.use(express.json());

// Provider injection middleware
app.use((req, res, next) => {
  // Only inject on HTML requests
  if (!req.path.endsWith('.html') && req.path !== '/') {
    return next();
  }

  // Read the HTML file
  const htmlPath = path.join(distDir, 'index.html');
  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return next();
    }

    // Inject provider script before closing body tag
    const script = `
      <script>
        // Initialize Nija Wallet provider
        window.ethereum = {
          isNijaWallet: true,
          name: 'Nija Wallet',
          userAgent: 'Nija Wallet/1.0.0',
          
          // Request handler
          request: async function({ method, params = [] }) {
            try {
              const response = await fetch('/api/v1/request', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-NFTGen-Session': localStorage.getItem('nija_session') || '',
                  'X-NFTGen-Origin': window.location.origin
                },
                body: JSON.stringify({ method, params })
              });
              
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
              }
              
              return await response.json();
            } catch (error) {
              console.error('Provider request failed:', error);
              throw error;
            }
          },
          
          // Event handling
          _events: new Map(),
          on: function(event, callback) {
            if (!this._events.has(event)) {
              this._events.set(event, new Set());
            }
            this._events.get(event).add(callback);
            
            // If this is an accounts request, trigger it immediately
            if (event === 'accountsChanged') {
              this.request({ method: 'eth_accounts' })
                .then(accounts => callback(accounts))
                .catch(console.error);
            }
          },
          
          removeListener: function(event, callback) {
            if (this._events.has(event)) {
              this._events.get(event).delete(callback);
            }
          },
          
          _emit: function(event, ...args) {
            if (this._events.has(event)) {
              this._events.get(event).forEach(callback => {
                try {
                  callback(...args);
                } catch (error) {
                  console.error('Error in event handler:', error);
                }
              });
            }
          }
        };

        // Initialize provider
        window.dispatchEvent(new Event('ethereum#initialized'));
      </script>
    `;

    // Insert script before closing body tag
    html = html.replace('</body>', script + '</body>');
    res.send(html);
  });
});

// Session verification middleware
const verifySession = async (req, res, next) => {
  const session = req.headers['x-nftgen-session'];
  const origin = req.headers['x-nftgen-origin'];
  
  if (!session || !origin) {
    return res.status(401).json({ error: 'Missing session or origin header' });
  }
  
  try {
    const sessionFile = path.join(dataDir, `session_${session}.json`);
    const sessionData = JSON.parse(await fsPromises.readFile(sessionFile, 'utf8'));
    
    if (sessionData.origin !== origin) {
      return res.status(401).json({ error: 'Invalid session origin' });
    }
    
    const now = Date.now();
    if (now - sessionData.lastAccess > 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Update last access time
    sessionData.lastAccess = now;
    await fsPromises.writeFile(sessionFile, JSON.stringify(sessionData));
    
    req.session = sessionData;
    next();
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(401).json({ error: 'Invalid session' });
  }
};

// Create session endpoint
app.post('/api/session/create', async (req, res) => {
  try {
    const { address, chainId, origin } = req.body;
    
    if (!address || !chainId || !origin) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['address', 'chainId', 'origin']
      });
    }
    
    const sessionId = Math.random().toString(36).substring(2, 15);
    const sessionData = {
      id: sessionId,
      address,
      chainId,
      origin,
      timestamp: Date.now(),
      lastAccess: Date.now()
    };
    
    await fsPromises.writeFile(
      path.join(dataDir, `session_${sessionId}.json`),
      JSON.stringify(sessionData)
    );
    
    // Construct NFTGen redirect URL
    const nftgenUrl = new URL(origin);
    nftgenUrl.searchParams.set('nija_session', sessionId);
    
    res.json({ 
      sessionId,
      redirectUrl: nftgenUrl.toString()
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle provider requests
app.post('/api/v1/request', verifySession, async (req, res) => {
  try {
    const { method, params = [] } = req.body;
    
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return res.json([req.session.address]);
        
      case 'eth_chainId':
        return res.json(req.session.chainId);
        
      case 'eth_sendTransaction':
        // Forward to WebSocket server
        if (wsClient?.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'TRANSACTION',
            sessionId: req.session.id,
            params: params[0]
          }));
          return res.json({ pending: true });
        }
        throw new Error('WebSocket server not connected');
        
      case 'eth_getBalance':
        // Forward balance request to WebSocket server
        if (wsClient?.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: 'GET_BALANCE',
            sessionId: req.session.id,
            address: params[0]
          }));
          return res.json({ pending: true });
        }
        throw new Error('WebSocket server not connected');
        
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    console.error('Request error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get wallet address endpoint
app.get('/api/wallet/address', verifySession, (req, res) => {
  console.log('Wallet address request:', {
    session: req.headers['x-nftgen-session'],
    origin: req.headers['x-nftgen-origin'],
    headers: req.headers
  });
  
  res.json({ address: req.session.address });
});

// JSON-RPC endpoint
app.post('/rpc', async (req, res) => {
  try {
    const { method, params, id } = req.body;
    
    // Get session from headers
    const session = req.headers['x-nftgen-session'];
    let sessionData;
    
    if (session) {
      try {
        const sessionFile = path.join(dataDir, `session_${session}.json`);
        sessionData = JSON.parse(await fsPromises.readFile(sessionFile, 'utf8'));
      } catch (error) {
        console.error('Error reading session:', error);
      }
    }

    // Handle JSON-RPC methods
    switch (method) {
      case 'eth_chainId':
        return res.json({
          jsonrpc: '2.0',
          id,
          result: '0xaa36a7' // Sepolia chain ID
        });
      
      case 'net_version':
        return res.json({
          jsonrpc: '2.0',
          id,
          result: '11155111' // Sepolia network ID
        });
      
      case 'eth_accounts':
        if (sessionData?.address) {
          return res.json({
            jsonrpc: '2.0',
            id,
            result: [sessionData.address]
          });
        }
        return res.json({
          jsonrpc: '2.0',
          id,
          result: []
        });

      case 'eth_getNetwork':
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            chainId: 11155111,
            name: 'sepolia'
          }
        });

      case 'eth_getBlockNumber':
        return res.json({
          jsonrpc: '2.0',
          id,
          result: '0x0' // Placeholder block number
        });

      case 'eth_getBalance':
        if (params?.[0]) {
          return res.json({
            jsonrpc: '2.0',
            id,
            result: '0x0' // Placeholder balance
          });
        }
        break;

      case 'eth_call':
      case 'eth_estimateGas':
      case 'eth_gasPrice':
      case 'eth_getCode':
      case 'eth_getTransactionCount':
        return res.json({
          jsonrpc: '2.0',
          id,
          result: '0x0' // Placeholder result for basic methods
        });
      
      default:
        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method ${method} not found`
          }
        });
    }
  } catch (error) {
    console.error('RPC error:', error);
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    });
  }
});

// Wallet connect endpoint
app.post('/api/wallet/connect', async (req, res) => {
  try {
    const origin = req.headers.origin;
    if (!origin) {
      return res.status(400).json({ error: 'Missing origin header' });
    }

    // Get Ethereum address from data directory
    const walletDataPath = path.join(dataDir, 'wallet_data.json');
    let ethAddress;
    try {
      const walletData = JSON.parse(await fsPromises.readFile(walletDataPath, 'utf8'));
      ethAddress = walletData.ethereumAddress;
    } catch (error) {
      console.error('Error reading wallet data:', error);
      return res.status(400).json({ error: 'No Ethereum wallet address found. Please initialize your wallet first.' });
    }

    if (!ethAddress) {
      return res.status(400).json({ error: 'No Ethereum wallet address found. Please initialize your wallet first.' });
    }

    // Generate session token
    const sessionToken = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();

    // Create session data with chainId
    const sessionData = {
      id: sessionToken,
      origin,
      timestamp,
      lastAccess: timestamp,
      chainId: '0xaa36a7', // Sepolia chain ID
      address: ethAddress
    };

    // Save session data
    await fsPromises.writeFile(
      path.join(dataDir, `session_${sessionToken}.json`),
      JSON.stringify(sessionData)
    );

    // Return connection details with proper RPC URL
    res.json({
      address: sessionData.address,
      rpcUrl: `http://${WS_HOST}:${PORT}/rpc`,
      sessionToken,
      chainId: sessionData.chainId
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

// Add endpoint to save wallet data
app.post('/api/wallet/save', async (req, res) => {
  try {
    const { ethereumAddress, solanaAddress } = req.body;
    if (!ethereumAddress && !solanaAddress) {
      return res.status(400).json({ error: 'No wallet addresses provided' });
    }

    const walletDataPath = path.join(dataDir, 'wallet_data.json');
    let walletData = {};
    
    // Read existing data if it exists
    try {
      walletData = JSON.parse(await fsPromises.readFile(walletDataPath, 'utf8'));
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
    }

    // Update with new data
    if (ethereumAddress) walletData.ethereumAddress = ethereumAddress;
    if (solanaAddress) walletData.solanaAddress = solanaAddress;

    // Save updated data
    await fsPromises.writeFile(walletDataPath, JSON.stringify(walletData));

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving wallet data:', error);
    res.status(500).json({ error: 'Failed to save wallet data' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    wsConnected: wsClient?.readyState === WebSocket.OPEN
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [{
    // Monitoring plugin
    requestDidStart(requestContext) {
      const start = Date.now();
      return {
        willSendResponse(requestContext) {
          const duration = Date.now() - start;
          console.log(`GraphQL ${requestContext.operation?.operation || 'query'} ${duration}ms`);
        },
        didEncounterErrors(requestContext) {
          stats.errors++;
          stats.lastError = {
            message: requestContext.errors?.[0]?.message,
            context: 'graphql',
            timestamp: new Date().toISOString()
          };
        }
      };
    }
  }]
});

// Start Apollo Server and Express
const startServer = async () => {
  try {
    await server.start();
    
    // Apply Apollo middleware
    app.use('/graphql', 
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token })
      })
    );
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server listening on port ${PORT}`);
      console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please check if another instance is running.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();