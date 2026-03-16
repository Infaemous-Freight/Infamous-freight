# API Testing Guide - Infæmous Freight Enterprises

**Live Production API**: `https://infamous-freight-api.fly.dev`

This guide provides step-by-step instructions for testing the API endpoints
manually using curl.

---

## ⚡ Quick Test

### 1. Health Check (No Auth Required)

```bash
curl https://infamous-freight-api.fly.dev/api/health
```

**Expected Response** (200 OK):

```json
{
  "uptime": 3600,
  "timestamp": 1702756800000,
  "status": "ok",
  "database": "connected"
}
```

---

## 🔐 Authentication Setup

### Generate a Test JWT Token

For testing authenticated endpoints, generate a JWT token:

```bash
# Option 1: Use Node.js to generate
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  sub: 'test-user-123',
  email: 'test@example.com',
  role: 'admin',
  scopes: ['users:read', 'users:write', 'ai:command', 'billing:*', 'voice:*']
}, 'your-jwt-secret-here');
console.log(token);
"

# Option 2: Use Python
python3 -c "
import jwt
import json
token = jwt.encode({
    'sub': 'test-user-123',
    'email': 'test@example.com',
    'role': 'admin',
    'scopes': ['users:read', 'users:write', 'ai:command']
}, 'your-jwt-secret-here', algorithm='HS256')
print(token)
"
```

**Store token for reuse**:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📝 Endpoint Testing

### Users Endpoints

#### List All Users

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://infamous-freight-api.fly.dev/api/users
```

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role (user|admin|driver)

**Example with filters**:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users?page=1&limit=5&role=admin"
```

#### Search Users

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?q=john&page=1&limit=10"
```

**Query Parameters**:

- `q`: Search query (searches email and name)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `role`: Filter by role (user|admin|driver)
- `sortBy`: Sort field (name|email|createdAt, default: createdAt)
- `order`: Sort order (asc|desc, default: desc)

**Examples**:

```bash
# Search for "john" in email/name
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?q=john"

# Search admins only
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?q=admin&role=admin"

# Search sorted by name ascending
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?sortBy=name&order=asc"
```

#### Get User by ID

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://infamous-freight-api.fly.dev/api/users/user-id-here
```

#### Create User

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "John Doe",
    "password": "secure-password-123",
    "role": "user"
  }' \
  https://infamous-freight-api.fly.dev/api/users
```

**Required Fields**:

- `email`: User email (must be unique)
- `name`: Full name
- `password`: Password (minimum 8 characters)
- `role`: user|admin|driver (default: user)

#### Update User

```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "role": "admin"
  }' \
  https://infamous-freight-api.fly.dev/api/users/user-id-here
```

#### Delete User

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  https://infamous-freight-api.fly.dev/api/users/user-id-here
```

---

### Shipments Endpoints

#### List All Shipments

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://infamous-freight-api.fly.dev/api/shipments
```

**Query Parameters**:

- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending|in-transit|delivered|cancelled)

#### Get Shipment by ID

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://infamous-freight-api.fly.dev/api/shipments/shipment-id-here
```

#### Create Shipment

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "TRACK-001-2025",
    "origin": "123 Main St, New York, NY",
    "destination": "456 Oak Ave, Los Angeles, CA",
    "status": "pending",
    "driverId": "driver-123"
  }' \
  https://infamous-freight-api.fly.dev/api/shipments
```

---

### AI Endpoints

#### Execute AI Command

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "optimize",
    "payload": {
      "shipments": [
        {
          "id": "s1",
          "origin": "NY",
          "destination": "LA",
          "weight": 500
        }
      ],
      "constraints": {
        "maxHours": 12,
        "maxWeight": 5000
      }
    }
  }' \
  https://infamous-freight-api.fly.dev/api/ai/command
```

**Required**:

- `command`: AI command name
- `payload`: Command-specific data

---

### Voice Endpoints

#### Ingest Voice

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@voice-file.m4a" \
  https://infamous-freight-api.fly.dev/api/voice/ingest
```

**Expected Headers in Response**:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1702756800
```

---

## ✅ Response Examples

### Successful Response (200 OK)

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "email": "john@example.com",
        "name": "John Doe",
        "role": "admin",
        "createdAt": "2025-01-01T10:00:00Z",
        "updatedAt": "2025-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation Error",
  "requestId": "req-12345",
  "timestamp": "2025-01-01T10:00:00Z",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Rate Limited Response (429)

```json
{
  "success": false,
  "error": "Too Many Requests",
  "requestId": "req-12345",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

**Headers**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1702756860  (Unix timestamp when limit resets)
```

---

## 🔄 Complete Workflow Example

### 1. Register New User

```bash
# Create user
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "name": "John Driver",
    "password": "password123",
    "role": "driver"
  }' \
  https://infamous-freight-api.fly.dev/api/users)

# Extract user ID
USER_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "Created user: $USER_ID"
```

### 2. Create Shipment for Driver

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"trackingNumber\": \"TRACK-$RANDOM\",
    \"origin\": \"New York\",
    \"destination\": \"Los Angeles\",
    \"driverId\": \"$USER_ID\",
    \"status\": \"pending\"
  }" \
  https://infamous-freight-api.fly.dev/api/shipments
```

### 3. Search for Drivers

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://infamous-freight-api.fly.dev/api/users/search?role=driver&page=1&limit=5"
```

### 4. Update Shipment Status

```bash
SHIPMENT_ID="shipment-123"
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-transit"
  }' \
  https://infamous-freight-api.fly.dev/api/shipments/$SHIPMENT_ID
```

---

## 🧪 Automated Testing with curl

### Run All Tests

```bash
#!/bin/bash
set -e

API="https://infamous-freight-api.fly.dev"
TOKEN="your-jwt-token-here"

echo "Testing API endpoints..."

# Test 1: Health check
echo "✓ Health check"
curl -s $API/api/health | jq .

# Test 2: List users
echo "✓ List users"
curl -s -H "Authorization: Bearer $TOKEN" $API/api/users | jq '.data.pagination'

# Test 3: Search users
echo "✓ Search users"
curl -s -H "Authorization: Bearer $TOKEN" "$API/api/users/search?q=test" | jq '.data'

# Test 4: Create user
echo "✓ Create user"
USER=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test-$(date +%s)@example.com\", \"name\": \"Test User\", \"password\": \"pass123\"}" \
  $API/api/users)
echo $USER | jq '.data.id'

echo "All tests passed! ✅"
```

**Save as `test-api.sh`**:

```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📊 Performance Metrics

**Expected Response Times** (from production):

| Endpoint            | Method | Time   |
| ------------------- | ------ | ------ |
| `/api/health`       | GET    | <50ms  |
| `/api/users`        | GET    | <200ms |
| `/api/users/search` | GET    | <300ms |
| `/api/users`        | POST   | <500ms |
| `/api/ai/command`   | POST   | <5s    |

**Rate Limits**:

| Endpoint Type  | Limit | Window |
| -------------- | ----- | ------ |
| General        | 100   | 15 min |
| Authentication | 5     | 15 min |
| AI Commands    | 20    | 1 min  |
| Billing        | 30    | 15 min |

---

## 🐛 Troubleshooting

### "Unauthorized" (401)

**Cause**: Missing or invalid JWT token

**Fix**:

```bash
# Ensure token is set
echo $TOKEN

# If empty, regenerate it
export TOKEN="new-jwt-token-here"

# Verify token has required scopes
# Example: scopes: ['users:read', 'users:write']
```

### "Forbidden" (403)

**Cause**: Token lacks required scope for endpoint

**Fix**: Include required scope in JWT token generation:

```bash
# For /api/users/search, need 'users:read' scope
# For /api/users (POST), need 'users:write' scope
# For /api/ai/command, need 'ai:command' scope
```

### "Too Many Requests" (429)

**Cause**: Rate limit exceeded

**Fix**: Check `X-RateLimit-Reset` header

```bash
curl -s -H "Authorization: Bearer $TOKEN" $API/api/users -i | grep X-RateLimit
```

Wait until reset timestamp, then retry.

### "Not Found" (404)

**Cause**: Resource doesn't exist

**Fix**: Verify resource ID is correct

```bash
# List all users to find valid IDs
curl -H "Authorization: Bearer $TOKEN" $API/api/users | jq '.data.users[].id'
```

---

## 📚 Additional Resources

- [API Reference](API_REFERENCE.md) - Full endpoint documentation
- [Deployment Runbook](DEPLOYMENT_RUNBOOK.md) - Deployment guide
- [Architecture Guide](README.md) - Project architecture
- [Contributing Guide](CONTRIBUTING.md) - Development workflow

---

**Last Updated**: December 16, 2025  
**API Version**: v1  
**Status**: Production (Fly.io)
