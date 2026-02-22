// apps/api/production-server.js - Production-Ready API with Database Persistence
/* global URLSearchParams */
const http = require("http");
const { generateToken, authenticate } = require("./auth");
const { validateShipment, sanitize, validateEmail } = require("./validation");
const logger = require("./logger");
const Cache = require("./cache");
const RateLimiter = require("./rateLimit");
const db = require("./database");
const { metricsMiddleware, metricsHandler, trackCache } = require("./metrics");

// Polyfill URLSearchParams for older Node versions
if (typeof URLSearchParams === "undefined") {
  const { URLSearchParams: USP } = require("url");
  globalThis.URLSearchParams = USP;
}

const PORT = process.env.API_PORT || 4000;
const HOST = "0.0.0.0";

// Initialize cache and rate limiter
const cache = new Cache(5000); // 5 second TTL
const limiter = new RateLimiter(60000, 100); // 100 requests per minute

// Database is now used instead of mock data
// db.shipments contains all persistent data

const startTime = Date.now();

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.connection.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
}

function setCORSHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

function parseUrl(url) {
  const [path, query] = url.split("?");
  const match = path.match(/^\/api\/shipments(?:\/(\d+))?$/);
  return {
    path,
    isShipments: !!match,
    id: match ? parseInt(match[1]) : null,
    params: query ? Object.fromEntries(new URLSearchParams(query)) : {},
  };
}

async function handleRequest(req, res) {
  const startReqTime = Date.now();

  // Apply metrics middleware
  metricsMiddleware(req, res, () => { });

  try {
    // Rate limiting
    const ip = req.socket.remoteAddress;
    if (!limiter.isAllowed(ip)) {
      logger.warn("Rate limit exceeded", { ip });
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Too many requests. Please try again later." }));
      return;
    }

    // Security headers
    setSecurityHeaders(res);
    setCORSHeaders(res);

    // Handle OPTIONS
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const { path, isShipments, id, params } = parseUrl(req.url);

    // Metrics endpoint (public)
    if (path === "/api/metrics" || path === "/metrics") {
      await metricsHandler(req, res);
      return;
    }

    // Public endpoints
    if (path === "/api/health" || path === "/health") {
      const cacheKey = "health-check";
      let data = cache.get(cacheKey);

      if (!data) {
        data = {
          status: "ok",
          uptime: Math.floor((Date.now() - startTime) / 1000),
          timestamp: Date.now(),
          database: "connected",
          mode: process.env.NODE_ENV || "development",
          message: "Infamous Freight API - Production Ready",
        };
        cache.set(cacheKey, data);
        trackCache(false);
      } else {
        trackCache(true);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
      logger.info("Health check", { status: "ok", ip });
      return;
    }

    // Auth endpoint (public)
    if (req.method === "POST" && path === "/api/auth/login") {
      const body = await getBody(req);
      const data = JSON.parse(body);

      // Validate email
      if (!validateEmail(data.email)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid email format" }));
        return;
      }

      // Mock authentication (in production, check against database)
      if (data.email === "admin@example.com" && data.password === "password123") {
        const token = generateToken("user-123", data.email, "admin");
        logger.info("User logged in", { email: data.email, role: "admin" });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            token,
            user: { id: "user-123", email: data.email, role: "admin" },
          }),
        );
        return;
      }

      logger.warn("Failed login attempt", { email: data.email });
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid credentials" }));
      return;
    }

    // Protected endpoints - require authentication
    let user = null;
    if (path === "/api" || isShipments) {
      // All shipment endpoints require authentication
      user = authenticate(req, res);
      if (!user) {
        return; // Auth failed, response already sent
      }
    }

    // API info endpoint
    if (path === "/api" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          name: "Infamous Freight Enterprises API",
          version: "3.0.0",
          mode: "production",
          status: "running",
          endpoints: {
            auth: { post: "/api/auth/login" },
            health: { get: "/api/health" },
            shipments: {
              get: "/api/shipments",
              post: "/api/shipments",
              getById: "/api/shipments/:id",
              put: "/api/shipments/:id",
              delete: "/api/shipments/:id",
            },
          },
          features: ["JWT Auth", "Rate Limiting", "Caching", "Validation", "Logging", "CRUD"],
        }),
      );
      return;
    }

    // Shipments endpoints
    if (isShipments) {
      // GET /api/shipments/:id - Get single shipment
      if (req.method === "GET" && id) {
        const cacheKey = `shipment:${id}`;
        let shipment = cache.get(cacheKey);

        if (!shipment) {
          shipment = db.getShipment(id);
          if (!shipment) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Shipment not found" }));
            return;
          }
          cache.set(cacheKey, shipment);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: shipment }));
        logger.info("Retrieved shipment from database", { id, user: user?.sub });
        return;
      }

      // GET /api/shipments - List with filtering, sorting, pagination
      if (req.method === "GET") {
        const cacheKey = `shipments:${JSON.stringify(params)}`;
        let result = cache.get(cacheKey);

        if (!result) {
          // Use database instead of mock data
          const dbResult = db.getShipments({
            page: params.page || 1,
            limit: params.limit || 10,
            status: params.status,
            search: params.search,
            sortBy: params.sortBy || "createdAt",
            order: params.order || "desc",
          });

          result = {
            success: true,
            data: dbResult.data,
            pagination: dbResult.pagination,
          };

          cache.set(cacheKey, result);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
        logger.debug("Listed shipments from database", {
          page: params.page,
          limit: params.limit,
          count: result.data.length,
        });
        return;
      }

      // POST /api/shipments - Create shipment
      if (req.method === "POST") {
        const body = await getBody(req);
        const data = JSON.parse(body);

        const errors = validateShipment(data);
        if (errors.length > 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Validation failed", details: errors }));
          logger.warn("Shipment creation validation failed", { errors });
          return;
        }

        try {
          const newShipment = db.createShipment({
            trackingNumber: sanitize(data.trackingNumber),
            status: data.status || "PENDING",
            origin: sanitize(data.origin),
            destination: sanitize(data.destination),
            weight: data.weight || 0,
            value: data.value || 0,
            createdBy: user?.sub || "anonymous",
          });

          cache.clear(); // Invalidate cache

          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, data: newShipment }));
          logger.info("Shipment created in database", { id: newShipment.id, user: user?.sub });
        } catch (err) {
          if (err.message.includes("already exists")) {
            res.writeHead(409, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Tracking number already exists" }));
          } else {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to create shipment" }));
          }
          logger.error("Shipment creation failed", { error: err.message });
        }
        return;
      }

      // PUT /api/shipments/:id - Update shipment
      if (req.method === "PUT" && id) {
        const body = await getBody(req);
        const data = JSON.parse(body);

        try {
          const updates = {};
          if (data.status && ["PENDING", "IN_TRANSIT", "DELIVERED"].includes(data.status)) {
            updates.status = data.status;
          }
          if (data.origin) updates.origin = sanitize(data.origin);
          if (data.destination) updates.destination = sanitize(data.destination);
          if (data.weight !== undefined) updates.weight = data.weight;
          if (data.value !== undefined) updates.value = data.value;

          const updated = db.updateShipment(id, updates);
          cache.clear(); // Invalidate cache

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, data: updated }));
          logger.info("Shipment updated in database", { id, user: user?.sub });
        } catch (err) {
          if (err.message.includes("not found")) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Shipment not found" }));
          } else {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to update shipment" }));
          }
          logger.error("Shipment update failed", { error: err.message });
        }
        return;
      }

      // DELETE /api/shipments/:id - Delete shipment
      if (req.method === "DELETE" && id) {
        try {
          const deleted = db.deleteShipment(id);
          if (!deleted) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Shipment not found" }));
            return;
          }

          cache.clear(); // Invalidate cache

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, message: "Shipment deleted", deleted }));
          logger.info("Shipment deleted", { id, user: user?.sub });
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Failed to delete shipment" }));
          logger.error("Shipment deletion failed", { error: err.message, id });
        }
        return;
      }
    }

    // 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  } catch (err) {
    logger.error("Request error", { error: err.message, stack: err.stack });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  } finally {
    const duration = Date.now() - startReqTime;
    logger.debug("Request completed", {
      method: req.method,
      path: req.url,
      status: res.statusCode,
      duration,
    });
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  logger.info("🚀 Infamous Freight API (Production) running", {
    host: HOST,
    port: PORT,
    features: ["JWT Auth", "Rate Limiting", "Caching", "Validation", "Logging"],
    endpoints: {
      health: `http://localhost:${PORT}/api/health`,
      auth: `http://localhost:${PORT}/api/auth/login`,
      shipments: `http://localhost:${PORT}/api/shipments`,
    },
  });
});

server.on("error", (err) => {
  logger.error("Server error", { error: err.message });
  process.exit(1);
});

process.on("SIGINT", () => {
  logger.info("📝 Server shutting down gracefully...");
  server.close(() => {
    logger.info("✅ Server closed");
    process.exit(0);
  });
});

module.exports = server;
