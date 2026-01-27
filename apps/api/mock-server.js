// Mock API Server - Runs without database
// Located at: /workspaces/Infamous-freight-enterprises/api/mock-server.js

const http = require('http');

const PORT = process.env.API_PORT || 4000;
const HOST = '0.0.0.0';

// Mock data
const mockShipments = [
    { id: 1, trackingNumber: 'IFE-001', status: 'IN_TRANSIT', origin: 'Los Angeles', destination: 'New York' },
    { id: 2, trackingNumber: 'IFE-002', status: 'DELIVERED', origin: 'Chicago', destination: 'Miami' },
    { id: 3, trackingNumber: 'IFE-003', status: 'PENDING', origin: 'Seattle', destination: 'Boston' }
];

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;

    // Health check endpoint
    if (url === '/api/health' || url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: Date.now(),
            database: 'mock',
            mode: 'development',
            message: 'Infamous Freight API - Mock Mode'
        }));
        return;
    }

    // Shipments endpoint
    if (url.startsWith('/api/shipments')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: mockShipments,
            count: mockShipments.length
        }));
        return;
    }

    // Root endpoint
    if (url === '/' || url === '/api') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: 'Infamous Freight Enterprises API',
            version: '2.1.0',
            mode: 'mock',
            status: 'running',
            endpoints: {
                health: '/api/health',
                shipments: '/api/shipments'
            }
        }));
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, HOST, () => {
    console.log('🚀 Infamous Freight API (Mock Mode) running on http://%s:%d', HOST, PORT);
    console.log('✅ Health check: http://localhost:%d/api/health', PORT);
    console.log('✅ Shipments: http://localhost:%d/api/shipments', PORT);
    console.log('📝 Mode: Development (No database required)');
});

server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
