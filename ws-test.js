import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:5176', {
    headers: {
        'Origin': 'http://localhost:5174',
        'User-Agent': 'Mozilla/5.0'
    }
});

ws.on('open', () => {
    console.log('Connected to WebSocket server');
    
    // Test message
    ws.send(JSON.stringify({
        type: 'PING',
        data: { timestamp: Date.now() }
    }));
});

ws.on('message', (data) => {
    console.log('Received:', data.toString());
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', () => {
    console.log('Disconnected from WebSocket server');
});

// Keep the connection alive for a few seconds
setTimeout(() => {
    ws.close();
    process.exit(0);
}, 5000); 