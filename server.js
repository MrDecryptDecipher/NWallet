import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create Express app for health endpoint
const app = express();

// Configure CORS
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check if origin matches our allowed patterns
    const allowedOrigins = [
      'http://3.111.22.56:5174',
      'http://3.111.22.56:5175',
      'http://localhost:5174',
      'http://localhost:5175'
    ];
    
    const allowed = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
    
    if (allowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked for origin:', origin);
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'X-NFTGen-Version',
    'X-NFTGen-Origin',
    'X-NFTGen-Session',
    'X-NFTGen-Method'
  ],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add CORS preflight handler
app.options('*', cors(corsOptions));

// Add response headers middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const allowed = corsOptions.origin(origin, (err, isAllowed) => isAllowed);
    if (allowed) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
      res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', corsOptions.maxAge.toString());
    }
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Session storage
const sessions = new Map();

// Helper function to verify session with improved validation
const verifySession = (session, origin) => {
  if (!session) return null;
  
  try {
    // First check memory
    let sessionData = sessions.get(session);
    
    // If not in memory, try to load from storage
    if (!sessionData) {
      const sessionFile = path.join(dataDir, `session_${session}.json`);
      if (fs.existsSync(sessionFile)) {
        sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        // Cache in memory
        sessions.set(session, sessionData);
      }
    }

    if (!sessionData) {
      return null;
    }

    // Check expiration
    if (Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
      // Clean up expired session
      sessions.delete(session);
      const sessionFile = path.join(dataDir, `session_${session}.json`);
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
      }
      return null;
    }

    // Verify origin if provided
    if (origin && sessionData.origin && origin !== sessionData.origin) {
      console.warn(`Origin mismatch: ${origin} vs ${sessionData.origin}`);
      return null;
    }

    // Update timestamp and last access
    sessionData.timestamp = Date.now();
    sessionData.lastAccess = Date.now();
    sessions.set(session, sessionData);
    
    // Update file storage asynchronously
    const sessionFile = path.join(dataDir, `session_${session}.json`);
    fs.promises.writeFile(sessionFile, JSON.stringify(sessionData))
      .catch(err => console.error('Error updating session file:', err));

    return sessionData;
  } catch (error) {
    console.error('Error in session verification:', error);
    return null;
  }
};

// Store session data from localStorage equivalent
const syncSessionsFromStorage = () => {
  try {
    const sessionFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('session_'));
    sessionFiles.forEach(file => {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      sessions.set(data.session, data);
    });
  } catch (error) {
    console.error('Error syncing sessions:', error);
  }
};

// Initialize sessions
syncSessionsFromStorage();

// Add non-versioned wallet address endpoint for backward compatibility
app.get('/api/wallet/address', (req, res) => {
  try {
    const session = req.headers['x-nftgen-session'];
    const origin = req.headers['x-nftgen-origin'];
    
    console.log('Legacy wallet address request:', {
      session: session ? session.substring(0, 8) + '...' : null,
      origin,
      headers: req.headers
    });
    
    const sessionData = verifySession(session, origin);
    
    if (!sessionData) {
      return res.status(401).json({ 
        error: 'Invalid session',
        details: 'Session not found or expired'
      });
    }

    if (!sessionData.address) {
      return res.status(404).json({ 
        error: 'No wallet address found',
        details: 'No address associated with this session'
      });
    }

    res.json({ address: sessionData.address });
  } catch (error) {
    console.error('Error in legacy wallet address endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update the endpoints to use improved session validation
app.post('/api/v1/wallet/address', (req, res) => {
  try {
    const session = req.headers['x-nftgen-session'];
    const origin = req.headers['x-nftgen-origin'];
    
    console.log('Wallet address request:', {
      session: session ? session.substring(0, 8) + '...' : null,
      origin,
      headers: req.headers
    });
    
    const sessionData = verifySession(session, origin);
    
    if (!sessionData) {
      return res.status(401).json({ 
        error: 'Invalid session',
        details: 'Session not found or expired. Please reconnect to Nija Wallet.',
        debug: {
          session: session ? session.substring(0, 8) + '...' : null,
          origin,
          timestamp: Date.now()
        }
      });
    }

    if (!sessionData.address) {
      return res.status(404).json({ 
        error: 'No wallet address found',
        details: 'No address associated with this session. Please reconnect to Nija Wallet.',
        debug: {
          session: session ? session.substring(0, 8) + '...' : null,
          sessionData: { ...sessionData, session: undefined }
        }
      });
    }

    res.json([sessionData.address]);
  } catch (error) {
    console.error('Error in wallet address endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.post('/api/v1/network/chain', (req, res) => {
  try {
    const session = req.headers['x-nftgen-session'];
    const sessionData = verifySession(session);
    
    if (!sessionData) {
      return res.status(401).json({ 
        error: 'Invalid session',
        details: 'Session not found or expired'
      });
    }

    res.json({ chainId: sessionData.chainId || '0x1' });
  } catch (error) {
    console.error('Error in chain ID endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Add session verification endpoint
app.post('/api/v1/session/verify', (req, res) => {
  try {
    const session = req.headers['x-nftgen-session'];
    const origin = req.headers['x-nftgen-origin'];
    
    console.log('Session verification request:', {
      session: session ? session.substring(0, 8) + '...' : null,
      origin,
      headers: req.headers
    });
    
    const sessionData = verifySession(session, origin);
    
    if (!sessionData) {
      return res.status(401).json({
        error: 'Invalid session',
        details: 'Session not found or expired',
        debug: {
          session: session ? session.substring(0, 8) + '...' : null,
          origin,
          timestamp: Date.now()
        }
      });
    }
    
    res.json({
      valid: true,
      address: sessionData.address,
      chainId: sessionData.chainId,
      expiresIn: 24 * 60 * 60 * 1000 - (Date.now() - sessionData.timestamp)
    });
  } catch (error) {
    console.error('Error in session verification:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Add session store endpoint
app.post('/api/v1/session/store', (req, res) => {
  try {
    const { session, address, chainId } = req.body;
    const origin = req.headers['x-nftgen-origin'];
    
    if (!session || !address) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Both session and address are required'
      });
    }

    // Store session data
    const sessionData = {
      session,
      address,
      chainId: chainId || '0x1',
      timestamp: Date.now(),
      origin,
      lastAccess: Date.now()
    };

    // Store in memory
    sessions.set(session, sessionData);
    
    // Store in file system
    const sessionFile = path.join(dataDir, `session_${session}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData));

    res.json({ 
      success: true,
      session: session,
      expiresIn: 24 * 60 * 60 * 1000,
      data: sessionData
    });
  } catch (error) {
    console.error('Error storing session:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Add session creation endpoint
app.post('/api/session/create', (req, res) => {
  try {
    const { address, chainId, origin } = req.body;
    
    if (!address || !chainId || !origin) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'address, chainId, and origin are required'
      });
    }

    const session = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessionData = {
      session,
      address,
      chainId,
      origin,
      timestamp: Date.now(),
      lastAccess: Date.now()
    };

    // Store in memory
    sessions.set(session, sessionData);

    // Store in file system
    const sessionFile = path.join(dataDir, `session_${session}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData));

    res.json({ 
      session,
      address,
      chainId,
      origin
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start HTTP server
const httpPort = 5174;
app.listen(httpPort, '0.0.0.0', () => {
  console.log(`HTTP server started on port ${httpPort}`);
});

// Track connected clients
const clients = new Set();

// Create WebSocket server
const wss = new WebSocketServer({ 
  port: 5176, 
  path: '/ws',
  clientTracking: true
});

console.log('WebSocket server started on port 5176');

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`New WebSocket connection from ${ip}`);
  
  // Add to clients set
  clients.add(ws);
  
  // Setup heartbeat
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Nija Wallet WebSocket Server',
    timestamp: Date.now()
  }));

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data.type);
      
      if (data.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeat-response',
          timestamp: Date.now()
        }));
      } else if (data.type === 'activity-sync') {
        // Store the activity
        if (data.data) {
          // Save to localStorage equivalent
          const activityKey = `nftgen_tx_${data.data.hash}`;
          fs.writeFileSync(
            path.join(dataDir, `${activityKey}.json`),
            JSON.stringify(data.data)
          );
          
          // Broadcast to all clients
          const broadcastMsg = JSON.stringify({
            type: 'activity-update',
            data: data.data,
            timestamp: Date.now()
          });
          
          clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
              client.send(broadcastMsg);
            }
          });
          
          console.log('Activity synced and broadcast:', data.data.hash);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client ${ip} disconnected`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error from ${ip}:`, error);
    clients.delete(ws);
  });
});

// Heartbeat interval to check dead connections
const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) {
      clients.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  clearInterval(interval);
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
}); 