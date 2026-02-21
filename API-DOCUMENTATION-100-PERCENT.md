# INFAMOUS FREIGHT PLATFORM - FULL API DOCUMENTATION

**Generated**: Feb 14, 2025 **Version**: 1.0.0 **Status**: Production Ready

---

## 🔗 LOAD BOARD API ENDPOINTS

### Authentication

All endpoints require JWT token in Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

Required scopes are noted per endpoint.

---

## 📦 LOADS API

### 1. Search Loads Across All Boards

**Endpoint**: `GET /api/loads/search`

**Scopes Required**: `loads:search`

**Query Parameters**: | Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------| | source | string | no |
Load board source | `dat`, `truckstop`, `convoy`, `all` (default) | | pickupCity
| string | no | Pickup city name | `Dallas` | | pickupState | string | no |
Pickup state code | `TX` | | dropoffCity | string | no | Delivery city name |
`Houston` | | dropoffState | string | no | Delivery state code | `TX` | |
maxMiles | number | no | Maximum distance | `500` (default) | | minRate | number
| no | Minimum rate per mile | `1.50` | | equipmentType | string | no | Vehicle
type | `Dry Van` | | hazmat | boolean | no | Hazmat materials | `false`
(default) | | pageSize | number | no | Results per page | `50` (max 500) | |
page | number | no | Page number | `1` (default) |

**Request Example**:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:4000/api/loads/search?pickupCity=Dallas&dropoffCity=Houston&minRate=1.50&pageSize=50"
```

**Response Success** (200 OK):

```json
{
  "success": true,
  "data": {
    "loads": [
      {
        "id": "DAT-12345",
        "source": "dat",
        "externalId": "12345",
        "pickupCity": "Dallas",
        "pickupState": "TX",
        "pickupZip": "75001",
        "pickupDate": "2025-02-15",
        "dropoffCity": "Houston",
        "dropoffState": "TX",
        "dropoffZip": "77001",
        "miles": 245,
        "weight": 42000,
        "length": 53,
        "commodity": "Electronics",
        "rate": 1.25,
        "rateType": "per_mile",
        "equipmentType": "Dry Van",
        "postedTime": "2025-02-14T10:30:00Z",
        "postedAgo": 30,
        "loads": 4,
        "shipper": {
          "name": "ABC Logistics",
          "phone": "972-555-0100",
          "location": "Dallas, TX"
        },
        "pickup": {
          "city": "Dallas",
          "state": "TX",
          "zip": "75001",
          "date": "2025-02-15"
        },
        "dropoff": {
          "city": "Houston",
          "state": "TX",
          "zip": "77001"
        },
        "details": {
          "hazmat": false,
          "temperature": null,
          "comments": "Non hazmat, freight only",
          "brokerFee": 100
        },
        "score": 92
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 245,
      "totalPages": 5
    }
  }
}
```

**Response Error** (400/401/500):

```json
{
  "success": false,
  "error": "Validation failed: minRate must be a number"
}
```

---

### 2. Get Load Details

**Endpoint**: `GET /api/loads/:id`

**Scopes Required**: `loads:read`

**URL Parameters**: | Parameter | Type | Required | Description |
|-----------|------|----------|-------------| | id | string | yes | Load ID
(e.g., `DAT-12345`) |

**Request Example**:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:4000/api/loads/DAT-12345"
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "DAT-12345",
    "source": "dat",
    "externalId": "12345",
    "pickupCity": "Dallas",
    "pickupState": "TX",
    "pickupZip": "75001",
    "pickupDate": "2025-02-15",
    "dropoffCity": "Houston",
    "dropoffState": "TX",
    "dropoffZip": "77001",
    "miles": 245,
    "weight": 42000,
    "length": 53,
    "commodity": "Electronics",
    "rate": 1.25,
    "rateType": "per_mile",
    "equipmentType": "Dry Van",
    "postedTime": "2025-02-14T10:30:00Z",
    "postedAgo": 30,
    "loads": 4,
    "shipper": {
      "name": "ABC Logistics",
      "phone": "972-555-0100",
      "location": "Dallas, TX"
    },
    "pickup": {
      "city": "Dallas",
      "state": "TX",
      "zip": "75001",
      "date": "2025-02-15"
    },
    "dropoff": {
      "city": "Houston",
      "state": "TX",
      "zip": "77001"
    },
    "details": {
      "hazmat": false,
      "temperature": null,
      "comments": "Non hazmat, freight only",
      "brokerFee": 100
    },
    "score": 92
  }
}
```

**Response Error** (404):

```json
{
  "success": false,
  "error": "Load not found"
}
```

---

### 3. Place Bid on Load

**Endpoint**: `POST /api/loads/:id/bid`

**Scopes Required**: `loads:bid`

**URL Parameters**: | Parameter | Type | Required | Description |
|-----------|------|----------|-------------| | id | string | yes | Load ID
(e.g., `DAT-12345`) |

**Request Body**:

```json
{
  "phone": "+1-555-123-4567",
  "comments": "Ready to pickup immediately"
}
```

**Body Parameters**: | Parameter | Type | Required | Description |
|-----------|------|----------|-------------| | phone | string | yes | Driver's
contact phone (min 10 chars) | | comments | string | no | Additional notes (max
500 chars) |

**Request Example**:

```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1-555-123-4567","comments":"Ready now"}' \
  "http://localhost:4000/api/loads/DAT-12345/bid"
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "bidId": "BID-98765",
    "loadId": "DAT-12345",
    "status": "placed",
    "timestamp": "2025-02-14T11:45:30Z",
    "message": "Your bid has been submitted to the shipper"
  }
}
```

**Response Error** (400 - Missing profile):

```json
{
  "success": false,
  "error": "No driver profile found"
}
```

**Response Error** (400 - Invalid phone):

```json
{
  "success": false,
  "error": "Validation failed: phone must be at least 10 characters"
}
```

---

### 4. Get Load Board Statistics

**Endpoint**: `GET /api/loads/stats/summary`

**Scopes Required**: `loads:read`

**Request Example**:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:4000/api/loads/stats/summary"
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "totalLoads": 136500,
    "avgRate": 1.25,
    "avgMiles": 287,
    "loads": [
      {
        "source": "dat",
        "count": 60000
      },
      {
        "source": "truckstop",
        "count": 40000
      },
      {
        "source": "convoy",
        "count": 36500
      }
    ]
  }
}
```

---

## 🚀 INTEGRATION EXAMPLES

### JavaScript/TypeScript (Web & Mobile)

```typescript
import type { ApiResponse } from "@infamous-freight/shared";

interface Load {
  id: string;
  source: string;
  pickupCity: string;
  dropoffCity: string;
  miles: number;
  rate: number;
  // ... full load properties
}

// Search loads
async function searchLoads(filters: {
  pickupCity?: string;
  dropoffCity?: string;
  minRate?: number;
}) {
  const params = new URLSearchParams();
  if (filters.pickupCity) params.append("pickupCity", filters.pickupCity);
  if (filters.dropoffCity) params.append("dropoffCity", filters.dropoffCity);
  if (filters.minRate) params.append("minRate", filters.minRate.toString());

  const response = await fetch(
    `${process.env.API_BASE_URL}/api/loads/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  const result: ApiResponse<{
    loads: Load[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data.loads;
}

// Get load details
async function getLoadDetails(loadId: string) {
  const response = await fetch(
    `${process.env.API_BASE_URL}/api/loads/${loadId}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  const result: ApiResponse<Load> = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}

// Place bid
async function placeBid(loadId: string, phone: string, comments?: string) {
  const response = await fetch(
    `${process.env.API_BASE_URL}/api/loads/${loadId}/bid`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        comments,
      }),
    },
  );

  const result: ApiResponse<{ bidId: string }> = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}
```

### React Hook Example (Mobile App)

```typescript
import { useQuery, useMutation } from '@react-query';

// Hook to search loads
export function useLoadSearch(filters: any) {
  return useQuery(
    ['loads', filters],
    () => searchLoads(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );
}

// Hook to place bid
export function usePlaceBid() {
  return useMutation(
    ({ loadId, phone, comments }: any) =>
      placeBid(loadId, phone, comments),
    {
      onSuccess: () => {
        toast.success('Bid placed successfully!');
        // Refetch loads after successful bid
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    }
  );
}

// Usage in component
function LoadsList() {
  const [filters, setFilters] = useState({});
  const { data: loads, isLoading } = useLoadSearch(filters);
  const { mutate: placeBid } = usePlaceBid();

  return (
    <FlatList
      data={loads}
      renderItem={({ item: load }) => (
        <LoadCard
          load={load}
          onBid={() => placeBid({
            loadId: load.id,
            phone: driverPhone,
          })}
        />
      )}
    />
  );
}
```

---

## 🔐 AUTHENTICATION

### Getting JWT Token

See `/docs/authentication.md` for OAuth2 flow details.

Token includes:

- `sub`: User ID
- `email`: User email
- `role`: User role (driver, shipper, admin)
- `scope`: Authorized scopes (space-separated)

### Required Scopes

| Endpoint                | Scope          |
| ----------------------- | -------------- |
| GET /api/loads/search   | `loads:search` |
| GET /api/loads/:id      | `loads:read`   |
| POST /api/loads/:id/bid | `loads:bid`    |
| GET /api/loads/stats    | `loads:read`   |

### Rate Limits

| Endpoint     | Limit          |
| ------------ | -------------- |
| Search Loads | 100/15 minutes |
| Get Details  | 200/15 minutes |
| Place Bid    | 20/1 minute    |
| Stats        | 100/15 minutes |

---

## ❌ ERROR RESPONSES

All errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 400  | Bad request (validation failed)      |
| 401  | Unauthorized (invalid/missing token) |
| 403  | Forbidden (insufficient scopes)      |
| 429  | Rate limit exceeded                  |
| 500  | Server error                         |

---

## 📊 DATA MODELS

### Load Object

```typescript
interface Load {
  // Identification
  id: string; // Unique ID (e.g., "DAT-12345")
  source: string; // Load board source ("dat", "truckstop", "convoy")
  externalId: string; // ID in external system

  // Pickup
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  pickupDate: string; // ISO date

  // Delivery
  dropoffCity: string;
  dropoffState: string;
  dropoffZip: string;

  // Freight
  miles: number;
  weight: number; // lbs
  length: number; // feet
  commodity: string;
  equipmentType: string; // "Dry Van", "Reefer", etc
  loads: number; // Number of pallets/units

  // Pricing
  rate: number;
  rateType: string; // "per_mile", "per_load"

  // Timing
  postedTime: string; // ISO timestamp
  postedAgo: number; // Minutes ago

  // Shipper
  shipper: {
    name: string;
    phone: string;
    location: string;
  };

  // Details
  details: {
    hazmat: boolean;
    temperature?: string;
    comments?: string;
    brokerFee?: number;
  };

  // AI Ranking
  score: number; // 0-100, higher is better
}
```

---

## 🧪 TESTING

### Mock Load Data Available

If no API credentials configured, all endpoints return realistic mock data:

```bash
# Returns mock loads without API keys
curl http://localhost:4000/api/loads/search

# Example mock response:
{
  "success": true,
  "data": {
    "loads": [
      {
        "id": "DAT-mock-001",
        "pickupCity": "Dallas",
        "dropoffCity": "Houston",
        "miles": 245,
        "rate": 1.25,
        "score": 92
      }
    ]
  }
}
```

### Testing with cURL

```bash
# 1. Get token (replace with your auth endpoint)
TOKEN=$(curl -X POST http://localhost:4000/v1/auth/login \
  -d "email=driver@example.com&password=password" | jq -r '.data.token')

# 2. Search loads
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/loads/search?pickupCity=Dallas"

# 3. Get load details
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/loads/DAT-mock-001"

# 4. Place bid
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1-555-123-4567"}' \
  "http://localhost:4000/api/loads/DAT-mock-001/bid"
```

---

## 📞 SUPPORT

For API issues:

1. Check `/api/health` endpoint for service status
2. Review logs: `docker logs infamous-freight-api`
3. Verify JWT token: decode at jwt.io
4. Check rate limits in response headers
5. Verify API credentials in `.env`

---

**Last Updated**: Feb 14, 2025 **API Version**: 1.0.0 **SDK Availability**:
TypeScript, JavaScript, Python (coming soon)
