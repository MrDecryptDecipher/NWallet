import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'data');

// Create Express app and HTTP server
const app = express();
const server = createServer(app);

// Environment variables
const WS_PORT = process.env.WS_PORT || 5176;
const NFTGEN_PORT = process.env.NFTGEN_PORT || 5175;
const NIJA_WALLET_PORT = process.env.NIJA_WALLET_PORT || 5174;
const WS_HOST = process.env.WS_HOST || '3.111.22.56';

const corsOptions = {
  origin: [
    'http://3.111.22.56:5174',  // Nwallet frontend
    'http://3.111.22.56:5175',  // NFTGen frontend
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Configure CORS
app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    wsPort: WS_PORT,
    nftgenPort: NFTGEN_PORT,
    nijaWalletPort: NIJA_WALLET_PORT,
    connections: clients.size
  });
});

// Create WebSocket server with more detailed configuration
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// Store connected clients with metadata
const clients = new Map();

// Watch for file changes in data directory
const watcher = chokidar.watch(dataDir, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const clientId = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  
  console.log(`Client connected - ID: ${clientId}, IP: ${clientIp}`);
  
  // Store client metadata
  clients.set(ws, {
    id: clientId,
    ip: clientIp,
    connectedAt: timestamp,
    lastPing: timestamp,
    service: null
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'WELCOME',
    clientId,
    message: 'Connected to Nija Wallet WebSocket server',
    timestamp
  }));
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'INITIAL_DATA',
    data: {
      serverTime: timestamp,
      clientCount: clients.size,
      wsPort: WS_PORT,
      nftgenPort: NFTGEN_PORT,
      nijaWalletPort: NIJA_WALLET_PORT
    }
  }));
  
  // Handle messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Received message from ${clientId}:`, message.type);
      
      const client = clients.get(ws);
      client.lastPing = Date.now();
      
      switch (message.type) {
        case 'HANDSHAKE':
          client.service = message.service;
          console.log(`Client ${clientId} identified as ${message.service}`);
          break;
          
        case 'TRANSACTION':
          // Broadcast transaction to all API servers
          broadcastToService('api-server', {
            type: 'TRANSACTION_UPDATE',
            data: message.params,
            timestamp: Date.now()
          });
          break;
          
        case 'PING':
          ws.send(JSON.stringify({
            type: 'PONG',
            timestamp: Date.now()
          }));
          break;
          
        default:
          console.log(`Unknown message type from ${clientId}:`, message.type);
      }
    } catch (error) {
      console.error(`Error processing message from ${clientId}:`, error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    const client = clients.get(ws);
    console.log(`Client disconnected - ID: ${client.id}, Service: ${client.service}`);
    clients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    const client = clients.get(ws);
    console.error(`WebSocket error for client ${client.id}:`, error);
  });
});

// Broadcast message to specific service type
function broadcastToService(service, message) {
  for (const client of clients.keys()) {
    if (client.service === service) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        clients.delete(client);
      }
    }
  }
}

// Watch for file changes
watcher.on('add', (path) => broadcastUpdate('ACTIVITY_ADDED', path));
watcher.on('change', (path) => broadcastUpdate('ACTIVITY_UPDATED', path));
watcher.on('unlink', (path) => broadcastUpdate('ACTIVITY_REMOVED', path));

// Broadcast updates to all connected clients
function broadcastUpdate(type, filePath) {
  try {
    const activities = getActivities();
    const message = JSON.stringify({ type, data: activities });
    
    clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  } catch (error) {
    console.error('Error broadcasting update:', error);
  }
}

// Get all activities
function getActivities() {
  try {
    const files = fs.readdirSync(dataDir);
    return files
      .filter(file => file.startsWith('nftgen_tx_'))
      .map(file => {
        const content = fs.readFileSync(join(dataDir, file), 'utf8');
        return JSON.parse(content);
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error reading activities:', error);
    return [];
  }
}

// Start server
server.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`WebSocket server listening on port ${WS_PORT}`);
  console.log(`WebSocket endpoint available at ws://0.0.0.0:${WS_PORT}/ws`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${WS_PORT} is already in use. Please check if another instance is running.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
}); 