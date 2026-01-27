// Mock Web Server - Simple frontend
// Located at: /workspaces/Infamous-freight-enterprises/web/mock-server.js

const http = require('http');

const PORT = process.env.WEB_PORT || 3000;
const HOST = '0.0.0.0';
const API_URL = process.env.API_URL || 'http://localhost:4000';

const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Infamous Freight Enterprises</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      font-size: 2.5rem;
      margin-bottom: 10px;
      text-align: center;
    }
    .subtitle {
      color: #666;
      text-align: center;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .status-card {
      background: #f7f7f7;
      padding: 20px;
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    .status-card h3 {
      color: #333;
      font-size: 1rem;
      margin-bottom: 10px;
    }
    .status-card .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #667eea;
    }
    .success { color: #10b981 !important; }
    .info { color: #3b82f6 !important; }
    .btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      width: 100%;
      margin-top: 20px;
      transition: background 0.3s;
    }
    .btn:hover {
      background: #5568d3;
    }
    .shipments {
      margin-top: 30px;
    }
    .shipment-item {
      background: #f7f7f7;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .badge-transit { background: #fef3c7; color: #92400e; }
    .badge-delivered { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #e0e7ff; color: #3730a3; }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚚 Infamous Freight</h1>
    <p class="subtitle">Enterprise Logistics Platform</p>
    
    <div class="status-grid">
      <div class="status-card">
        <h3>System Status</h3>
        <div class="value success">✅ Running</div>
      </div>
      <div class="status-card">
        <h3>Active Shipments</h3>
        <div class="value info" id="shipment-count">Loading...</div>
      </div>
      <div class="status-card">
        <h3>API Status</h3>
        <div class="value" id="api-status">Checking...</div>
      </div>
      <div class="status-card">
        <h3>Uptime</h3>
        <div class="value info" id="uptime">--</div>
      </div>
    </div>

    <button class="btn" onclick="loadShipments()">🔄 Refresh Shipments</button>

    <div class="shipments" id="shipments-container">
      <h3 style="margin-bottom: 15px;">Recent Shipments</h3>
      <div id="shipments-list">Loading shipments...</div>
    </div>

    <div class="footer">
      <p>© 2026 Infamous Freight Enterprises • All Rights Reserved</p>
      <p style="margin-top: 5px;">Running in Development Mode</p>
    </div>
  </div>

  <script>
    const API_URL = '${API_URL}';
    
    async function checkAPIHealth() {
      try {
        const response = await fetch(API_URL + '/api/health');
        const data = await response.json();
        document.getElementById('api-status').className = 'value success';
        document.getElementById('api-status').textContent = '✅ Online';
        document.getElementById('uptime').textContent = Math.floor(data.uptime) + 's';
        return true;
      } catch (err) {
        document.getElementById('api-status').className = 'value';
        document.getElementById('api-status').textContent = '❌ Offline';
        return false;
      }
    }
    
    async function loadShipments() {
      const container = document.getElementById('shipments-list');
      container.innerHTML = '<p>Loading...</p>';
      
      try {
        const response = await fetch(API_URL + '/api/shipments');
        const result = await response.json();
        
        if (result.success && result.data) {
          document.getElementById('shipment-count').textContent = result.count;
          
          container.innerHTML = result.data.map(shipment => {
            let badgeClass = 'badge-pending';
            if (shipment.status === 'IN_TRANSIT') badgeClass = 'badge-transit';
            if (shipment.status === 'DELIVERED') badgeClass = 'badge-delivered';
            
            return \`
              <div class="shipment-item">
                <div>
                  <strong>\${shipment.trackingNumber}</strong><br>
                  <small>\${shipment.origin} → \${shipment.destination}</small>
                </div>
                <span class="badge \${badgeClass}">\${shipment.status}</span>
              </div>
            \`;
          }).join('');
        }
      } catch (err) {
        container.innerHTML = '<p style="color: #ef4444;">Failed to load shipments. Is the API running?</p>';
      }
    }
    
    // Initialize
    checkAPIHealth();
    loadShipments();
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
      checkAPIHealth();
      loadShipments();
    }, 10000);
  </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    // Health check
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', service: 'web' }));
        return;
    }

    // Serve HTML
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlPage);
});

server.listen(PORT, HOST, () => {
    console.log('🌐 Infamous Freight Web running on http://%s:%d', HOST, PORT);
    console.log('✅ Open in browser: http://localhost:%d', PORT);
    console.log('📝 Mode: Development (Mock frontend)');
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
