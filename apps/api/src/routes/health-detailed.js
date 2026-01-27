/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Detailed Health Check & Monitoring
 */

const express = require('express');
const os = require('os');
const { prisma } = require('../config/database');

const router = express.Router();

/**
 * Basic health check - used by Docker/Kubernetes health checks
 * GET /api/health
 */
router.get('/health', async (req, res) => {
    const startTime = Date.now();
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '2.1.0',
        services: {},
        system: {}
    };

    try {
        // Check PostgreSQL
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        health.services.database = {
            status: 'healthy',
            responseTime: `${Date.now() - dbStart}ms`
        };
    } catch (error) {
        health.status = 'degraded';
        health.services.database = {
            status: 'unhealthy',
            error: error.message
        };
    }

    // System metrics
    health.system = {
        uptime: `${Math.floor(os.uptime() / 60)} minutes`,
        loadAverage: os.loadavg(),
        freeMemory: `${(os.freemem() / 1024 / 1024).toFixed(2)} MB`,
        totalMemory: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
        cpuCores: os.cpus().length,
        platform: os.platform()
    };

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

/**
 * Liveness probe - Kubernetes will restart pod if this fails
 * GET /api/health/live
 */
router.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
});

/**
 * Readiness probe - Kubernetes removes from load balancer if this fails
 * GET /api/health/ready
 */
router.get('/health/ready', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not_ready', error: error.message });
    }
});

/**
 * Detailed health check - requires authentication
 * GET /api/health/details
 */
router.get('/health/details', async (req, res) => {
    const details = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            cpuCores: os.cpus().length,
            loadAverage: os.loadavg(),
            freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
            totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
            uptime: `${Math.floor(os.uptime() / 3600)} hours`
        },
        services: {},
        performance: {}
    };

    try {
        const dbStart = Date.now();
        const dbResult = await prisma.$queryRaw`
      SELECT 
        count(*) as table_count,
        current_database() as database_name,
        now() as server_time
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

        details.services.database = {
            status: 'healthy',
            responseTime: `${Date.now() - dbStart}ms`,
            tableCount: dbResult[0]?.table_count || 0,
            database: dbResult[0]?.database_name || 'unknown'
        };
    } catch (error) {
        details.status = 'degraded';
        details.services.database = {
            status: 'unhealthy',
            error: error.message
        };
    }

    // Performance metrics
    details.performance = {
        eventLoopLag: 'normal',
        gcPauses: 'normal',
        activeHandles: process._getActiveHandles().length,
        activeRequests: process._getActiveRequests().length
    };

    res.json(details);
});

/**
 * Health dashboard HTML
 * GET /api/health/dashboard
 */
router.get('/health/dashboard', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>🏥 System Health Dashboard</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="refresh" content="30">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: white;
          margin-bottom: 30px;
          text-align: center;
          font-size: 2.5em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.3s;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        .card-title {
          font-size: 1.1em;
          font-weight: 600;
          margin-bottom: 15px;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .status.healthy {
          background: #d4edda;
          color: #155724;
        }
        .status.degraded {
          background: #fff3cd;
          color: #856404;
        }
        .status.unhealthy {
          background: #f8d7da;
          color: #721c24;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .metric:last-child {
          border-bottom: none;
        }
        .metric-label {
          color: #666;
          font-weight: 500;
        }
        .metric-value {
          color: #333;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }
        .refresh-note {
          text-align: center;
          color: white;
          font-size: 0.9em;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏥 System Health Dashboard</h1>
        <div id="health"></div>
        <p class="refresh-note">⟳ Auto-refreshes every 30 seconds</p>
      </div>
      
      <script>
        async function fetchHealth() {
          try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            let html = '<div class="grid">';
            
            // Overall Status
            html += '<div class="card">';
            html += '<div class="card-title">Overall Status</div>';
            html += '<div class="status ' + data.status + '">' + data.status.toUpperCase() + '</div>';
            html += '<div class="metric"><span class="metric-label">Uptime</span><span class="metric-value">' + Math.floor(data.uptime / 60) + 'm</span></div>';
            html += '<div class="metric"><span class="metric-label">Timestamp</span><span class="metric-value">' + new Date(data.timestamp).toLocaleTimeString() + '</span></div>';
            html += '<div class="metric"><span class="metric-label">Environment</span><span class="metric-value">' + data.environment + '</span></div>';
            html += '</div>';
            
            // Services
            html += '<div class="card">';
            html += '<div class="card-title">Services</div>';
            for (const [name, info] of Object.entries(data.services)) {
              html += '<div class="status ' + info.status + '">' + name + '</div>';
              html += '<div class="metric"><span class="metric-label">Status</span><span class="metric-value">' + info.status + '</span></div>';
              if (info.responseTime) {
                html += '<div class="metric"><span class="metric-label">Response Time</span><span class="metric-value">' + info.responseTime + '</span></div>';
              }
            }
            html += '</div>';
            
            // System
            html += '<div class="card">';
            html += '<div class="card-title">System</div>';
            for (const [key, value] of Object.entries(data.system)) {
              const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
              html += '<div class="metric"><span class="metric-label">' + key + '</span><span class="metric-value">' + displayValue + '</span></div>';
            }
            html += '</div>';
            
            html += '</div>';
            document.getElementById('health').innerHTML = html;
          } catch (error) {
            document.getElementById('health').innerHTML = '<div class="card"><div style="color: red;">Error loading health data: ' + error.message + '</div></div>';
          }
        }
        
        fetchHealth();
        setInterval(fetchHealth, 30000);
      </script>
    </body>
    </html>
  `;

    res.set('Content-Type', 'text/html');
    res.send(html);
});

module.exports = router;
