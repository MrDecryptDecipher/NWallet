import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the HTTP server
const PORT = 5176;
const server = http.createServer((req, res) => {
  // Basic HTTP response for health checks
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'nija-wallet-ws' }));
    return;
  }
  
  // Default response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Nija Wallet WebSocket Server');
});

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

// Store connected clients
const clients = new Set();

console.log(`Starting Nija Wallet WebSocket server on port ${PORT}`);

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`New WebSocket connection from ${ip}`);
  
  // Add client to the set
  clients.add(ws);
  
  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Nija Wallet WebSocket Server',
    timestamp: Date.now()
  }));
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Handle different message types
      if (data.type === 'heartbeat') {
        ws.send(JSON.stringify({
          type: 'heartbeat-response',
          timestamp: Date.now()
        }));
      } else if (data.type === 'activity-sync') {
        // Save the activity to localStorage if in browser context
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(`nftgen_tx_${data.data.hash}`, JSON.stringify(data.data));
            localStorage.setItem('nftgen_latest_activity', JSON.stringify(data.data));
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        }
        
        // Broadcast to all connected clients
        broadcastMessage({
          type: 'activity-update',
          data: data.data,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log(`WebSocket connection from ${ip} closed`);
    clients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error from ${ip}:`, error);
    clients.delete(ws);
  });
});

// Broadcast message to all connected clients
function broadcastMessage(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN state
      client.send(messageStr);
    }
  });
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Nija Wallet WebSocket server running at http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint available at ws://0.0.0.0:${PORT}/ws`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Is the server already running?`);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}); 