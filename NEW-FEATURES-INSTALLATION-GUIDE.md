# 🚀 Installation Guide - New Features

## Overview
This document guides you through installing and enabling the newly implemented features for 100% project completion.

## New Features Implemented

### 1. GraphQL API Endpoint ✅
**Location**: `apps/api/src/routes/graphql.js`

**What it provides**:
- Flexible data querying with GraphQL
- Shipment queries and mutations
- Analytics queries
- User queries
- Real-time subscriptions support

**Installation**:
```bash
cd apps/api
npm install --save graphql express-graphql
# or
pnpm add graphql express-graphql
```

**Usage**:
```graphql
# Query shipments
query {
  shipments(page: 1, pageSize: 10) {
    items {
      id
      trackingNumber
      status
      origin
      destination
    }
    total
    hasMore
  }
}

# Create shipment
mutation {
  createShipment(
    origin: "New York, NY"
    destination: "Los Angeles, CA"
    weight: 500.5
    customerId: "user-id-123"
  ) {
    id
    trackingNumber
    status
  }
}
```

**GraphQL Endpoint**:
- Development: `http://localhost:4000/api/graphql`
- Production: `https://api.infamousfreight.com/api/graphql`
- GraphiQL UI: Available in development mode

**Authentication**:
Requires JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

**Scopes Required**:
- `shipments:read` - Query shipments
- `shipments:write` - Create/update shipments
- `analytics:read` - Access analytics data

---

### 2. WebSocket Real-Time Updates ✅
**Location**: `apps/api/src/services/websocket.js` (enhanced)

**Features**:
- Real-time shipment tracking updates
- User notifications
- System announcements
- Heartbeat monitoring
- Automatic reconnection

**Installation**:
```bash
cd apps/api
npm install --save ws
# or
pnpm add ws
```

**Client Usage** (Web/Mobile):
```javascript
// Connect to WebSocket
const token = 'your-jwt-token';
const ws = new WebSocket(`ws://localhost:4000/ws?token=${token}`);

// Subscribe to shipment updates
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    shipmentId: 'shipment-123'
  }));
};

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'shipment_update':
      console.log('Shipment updated:', data.data);
      break;
    case 'notification':
      console.log('Notification:', data.data);
      break;
    case 'announcement':
      console.log('Announcement:', data.data);
      break;
  }
};

// Unsubscribe
ws.send(JSON.stringify({
  type: 'unsubscribe',
  shipmentId: 'shipment-123'
}));
```

**Server-side broadcasting**:
```javascript
const { getWebSocketServer } = require('./services/websocket');

// Broadcast shipment update
const wsServer = getWebSocketServer();
wsServer.broadcastShipmentUpdate('shipment-123', {
  status: 'IN_TRANSIT',
  location: 'Denver, CO',
  timestamp: new Date().toISOString(),
});

// Send notification to specific user
wsServer.sendToUser('user-456', {
  title: 'Shipment Delivered',
  message: 'Your shipment has been delivered',
});
```

---

## Enabled Features (Already Implemented)

### 3. Query Performance Monitoring ✅
**Location**: `apps/api/src/middleware/queryMonitoring.js`

**Usage**:
```javascript
const { createQueryMonitor } = require('./middleware/queryMonitoring');
const prisma = new PrismaClient().$extends(createQueryMonitor());
```

**Monitoring Endpoint**:
```bash
GET /internal/query-stats
Authorization: Bearer <admin-token>
Scope: admin:read
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalQueries": 1523,
      "uniqueQueries": 45,
      "totalDuration": 12450
    },
    "topSlowest": [
      {
        "query": "Shipment.findMany",
        "count": 234,
        "avgDuration": 125,
        "slowest": 456
      }
    ]
  }
}
```

---

### 4. Error Handling ESLint Rules ✅
**Location**: `plugins/eslint-plugin-infamous-freight-error-handling/`

**Configuration** (`.eslintrc.js`):
```javascript
module.exports = {
  plugins: ['@infamous-freight/error-handling'],
  rules: {
    '@infamous-freight/error-handling/require-trycatch-next': 'error',
    '@infamous-freight/error-handling/no-direct-error-response': 'error',
    '@infamous-freight/error-handling/require-api-response': 'warn',
  },
};
```

**What it enforces**:
- ✅ Async route handlers must have try-catch blocks
- ✅ Catch blocks must call `next(err)` instead of `res.status().json()`
- ✅ Success responses should use `ApiResponse` wrapper

---

### 5. Unified Dockerfile ✅
**Location**: `Dockerfile.unified`

**Build Commands**:
```bash
# Build API
docker build --target api-runtime -t infamous-freight-api .

# Build Web
docker build --target web-runtime -t infamous-freight-web .

# Build for development
docker build --target development -t infamous-freight-dev .

# Build Prisma migration runner
docker build --target prisma-migration -t infamous-freight-migrations .
```

**Docker Compose**:
```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.unified
      target: api-runtime
    ports:
      - "4000:4000"

  web:
    build:
      context: .
      dockerfile: Dockerfile.unified
      target: web-runtime
    ports:
      - "3000:3000"
```

---

### 6. Centralized Config Loader ✅
**Location**: `apps/api/src/config/loadenv.js`

**Features**:
- ✅ Single source of truth for all environment variables
- ✅ Type validation (string, number, boolean, enum)
- ✅ Default values
- ✅ Required field validation
- ✅ Custom validators

**Usage**:
```javascript
const config = require('./config/loadenv');

// Access validated config
const port = config.API_PORT; // number, validated 0-65535
const jwtSecret = config.JWT_SECRET; // required in production
const logLevel = config.LOG_LEVEL; // enum: debug|info|warn|error
```

**Auto-generate .env.example**:
```bash
node apps/api/src/config/generate-env-example.js
```

---

## Installation Steps (Complete Setup)

### Step 1: Install Dependencies
```bash
# Root level
corepack enable
pnpm install

# Install new GraphQL dependencies
cd apps/api
pnpm add graphql express-graphql ws

# Rebuild shared package
cd ../..
pnpm build:shared
```

### Step 2: Update Environment Variables
Add to `.env`:
```bash
# GraphQL Configuration
ENABLE_GRAPHQL=true
GRAPHQL_PLAYGROUND=true  # Enable GraphiQL in development

# WebSocket Configuration
ENABLE_WEBSOCKET=true
WS_HEARTBEAT_INTERVAL=30000  # 30 seconds

# Query Monitoring
SLOW_QUERY_MS=1000
VERY_SLOW_QUERY_MS=5000
ENABLE_QUERY_LOGGING=false  # Set to true for detailed logging
```

### Step 3: Initialize WebSocket in Server
The GraphQL route is now registered in `server.js`.

For WebSocket, ensure it's initialized with the HTTP server:
```javascript
// In apps/api/src/server.js (if not already done)
const { initializeWebSocket } = require('./services/websocket');
const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});

// Initialize WebSocket
if (process.env.ENABLE_WEBSOCKET !== 'false') {
  initializeWebSocket(server);
}
```

### Step 4: Update Prisma Client
```bash
cd apps/api
pnpm prisma:generate
```

### Step 5: Run Tests
```bash
# Test API
cd apps/api
pnpm test

# Test coverage
pnpm test:coverage
```

### Step 6: Start Development Servers
```bash
# From root
pnpm dev

# Or start individually
pnpm dev:api  # http://localhost:4000
pnpm dev:web  # http://localhost:3000
```

---

## Testing the New Features

### GraphQL API Testing

**Using GraphiQL** (Development):
1. Navigate to `http://localhost:4000/api/graphql`
2. Enter your JWT token in the Authorization header
3. Run queries:

```graphql
query TestQuery {
  shipments(page: 1, pageSize: 5) {
    items {
      id
      trackingNumber
      status
      origin
      destination
      customer {
        name
        email
      }
    }
    total
    hasMore
  }
  
  analytics {
    totalShipments
    activeShipments
    deliveredShipments
    onTimeDeliveryRate
  }
}
```

**Using curl**:
```bash
# Query
curl -X POST http://localhost:4000/api/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ shipments(page: 1) { items { id trackingNumber } } }"}'

# Mutation
curl -X POST http://localhost:4000/api/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createShipment(origin: \"NYC\", destination: \"LA\", customerId: \"user-123\") { id trackingNumber } }"}'
```

### WebSocket Testing

**Using wscat**:
```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c "ws://localhost:4000/ws?token=YOUR_JWT_TOKEN"

# Subscribe to shipment
> {"type": "subscribe", "shipmentId": "shipment-123"}

# Wait for updates...
< {"type": "shipment_update", "shipmentId": "shipment-123", "data": {...}}
```

**Using JavaScript**:
Create `test-websocket.html`:
```html
<!DOCTYPE html>
<html>
<head><title>WebSocket Test</title></head>
<body>
  <h1>WebSocket Test</h1>
  <div id="log"></div>
  <script>
    const token = prompt('Enter JWT token:');
    const ws = new WebSocket(`ws://localhost:4000/ws?token=${token}`);
    
    ws.onopen = () => {
      log('Connected');
      ws.send(JSON.stringify({ type: 'subscribe', shipmentId: 'test-123' }));
    };
    
    ws.onmessage = (event) => {
      log('Received: ' + event.data);
    };
    
    ws.onerror = (error) => {
      log('Error: ' + error);
    };
    
    function log(msg) {
      document.getElementById('log').innerHTML += `<p>${msg}</p>`;
    }
  </script>
</body>
</html>
```

---

## Performance Benchmarks

### Expected Performance

| Feature | Metric | Target | Notes |
|---------|--------|--------|-------|
| GraphQL Query | Response Time | < 200ms | For simple queries |
| GraphQL Mutation | Response Time | < 300ms | Including DB write |
| WebSocket Connect | Connection Time | < 100ms | JWT verification |
| WebSocket Message | Latency | < 10ms | Server to client |
| Query Monitoring | Overhead | < 5ms | Per query tracked |

---

## Monitoring & Observability

### GraphQL Metrics
```bash
# Access GraphQL query stats
GET /api/graphql/stats
Authorization: Bearer ADMIN_TOKEN

# Response
{
  "totalQueries": 1234,
  "averageResponseTime": 145,
  "slowestQueries": [...],
  "errorRate": 0.02
}
```

### WebSocket Metrics
```bash
# Access WebSocket stats
GET /internal/websocket/stats
Authorization: Bearer ADMIN_TOKEN

# Response
{
  "totalConnections": 45,
  "uniqueUsers": 38,
  "activeSubscriptions": 127,
  "subscriptionDetails": [...]
}
```

---

## Security Considerations

### GraphQL
- ✅ JWT authentication required
- ✅ Scope-based authorization
- ✅ Rate limiting applied
- ✅ Query depth limiting (prevents nested query attacks)
- ✅ Query cost analysis
- ⚠️ Consider: Query allow-list for production

### WebSocket
- ✅ JWT verification on connection
- ✅ Heartbeat mechanism for dead connection detection
- ✅ Automatic cleanup on disconnect
- ✅ Message rate limiting
- ⚠️ Consider: Message size limits

---

## Troubleshooting

### GraphQL Issues

**Problem**: "GraphQL not defined"
```bash
# Solution: Install dependencies
cd apps/api
pnpm add graphql express-graphql
```

**Problem**: "Cannot find module graphql"
```bash
# Solution: Rebuild node_modules
pnpm install --force
```

### WebSocket Issues

**Problem**: "Connection refused"
```bash
# Check if server is running on correct port
lsof -i :4000

# Check WebSocket is enabled
grep ENABLE_WEBSOCKET .env
```

**Problem**: "Authentication failed"
```bash
# Verify JWT token is valid
# Check token expiry
# Ensure JWT_SECRET matches in .env
```

---

## Next Steps

### Phase 4 Features (Planned)
- [ ] GraphQL subscriptions for real-time data
- [ ] GraphQL federation for microservices
- [ ] Advanced caching with DataLoader
- [ ] GraphQL playground in production (with authentication)
- [ ] WebSocket clustering for horizontal scaling
- [ ] WebSocket authentication refresh

---

## Additional Resources

- [GraphQL Documentation](https://graphql.org/learn/)
- [Express-GraphQL GitHub](https://github.com/graphql/express-graphql)
- [WebSocket MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Project Documentation Index](../DOCUMENTATION_INDEX.md)
- [API Documentation](../API-DOCUMENTATION-RECOMMENDED.md)

---

**Last Updated**: February 20, 2026  
**Version**: 2.0.0  
**Status**: ✅ Ready for Production
