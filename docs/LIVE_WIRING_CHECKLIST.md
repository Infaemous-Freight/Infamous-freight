## 🔗 Live Wiring Checklist

Transform Infamous Freight from demo-backed to live-data operational platform.

**Status:** In progress — targets `/loads`, `/dispatch`, `/quotes` wiring.

---

## Route-by-Route Wiring Map

### `/loads` — Load Board

| Item | Current State | Target | Status |
|------|---------------|--------|--------|
| **Data source** | Demo array in component | API: `GET /api/loads` | 🚧 In progress |
| **API endpoint exists** | ❌ No | ✅ Required | 📋 Planned |
| **Frontend wiring** | ❌ Mock data hardcoded | ✅ Live service calls | 📋 Planned |
| **Filters** (status, carrier, date) | ❌ Not functional | ✅ API-backed filtering | 📋 Planned |
| **Pagination** | ❌ Not implemented | ✅ Offset/limit | 📋 Planned |
| **Error handling** | ⚠️ Partial | ✅ Full error boundaries | 📋 Planned |
| **Loading states** | ⚠️ Partial | ✅ Skeleton loaders | 📋 Planned |
| **Empty state** | ⚠️ Partial | ✅ Friendly messaging | 📋 Planned |
| **Tenant isolation** | ⚠️ Not verified | ✅ User data only | 📋 Planned |

**Acceptance criteria:**
- ✅ API returns real loads from database
- ✅ Frontend fetches and displays live data
- ✅ Filters/sorting work against live data
- ✅ No demo data in production builds
- ✅ CI passes, no console errors

---

### `/dispatch` — Shipment Status & Dispatch Board

| Item | Current State | Target | Status |
|------|---------------|--------|--------|
| **Data source** | Demo shipments in component | API: `GET /api/shipments` | 🚧 In progress |
| **Shipment list endpoint** | ❌ No | ✅ Required | 📋 Planned |
| **Shipment detail endpoint** | ❌ No | ✅ Required | 📋 Planned |
| **Event timeline endpoint** | ❌ No | ✅ `GET /api/shipments/:id/events` | 📋 Planned |
| **Status update endpoint** | ❌ No | ✅ `POST /api/shipments/:id/status` | 📋 Planned |
| **Exception detection** | ❌ Mock only | ✅ Real incident data | 📋 Planned |
| **Real-time updates** | ❌ Not implemented | ✅ WebSocket or polling | 📋 Planned |
| **Frontend wiring** | ❌ Mock data hardcoded | ✅ Live service calls | 📋 Planned |
| **Map integration** | ⚠️ Partial | ✅ Live driver locations | 📋 Planned |

**Acceptance criteria:**
- ✅ API returns real shipments from database
- ✅ Timeline displays real shipment events
- ✅ Exception queue populated from incidents
- ✅ Operators can manually update status
- ✅ No demo data in production builds
- ✅ CI passes, no console errors

---

### `/quotes` — Quote Management

| Item | Current State | Target | Status |
|------|---------------|--------|--------|
| **Data source** | Demo quotes in component | API: `GET /api/quotes` | 🚧 In progress |
| **API endpoint exists** | ❌ No | ✅ Required | 📋 Planned |
| **Frontend wiring** | ❌ Mock data hardcoded | ✅ Live service calls | 📋 Planned |
| **Status filtering** | ❌ Not functional | ✅ API-backed filtering | 📋 Planned |
| **Assign carrier endpoint** | ❌ No | ✅ `POST /api/quotes/:id/assign` | 📋 Planned |
| **Genesis recommendations** | ❌ Not shown | ✅ AI summary inline | 📋 Planned |
| **Error handling** | ⚠️ Partial | ✅ Full error boundaries | 📋 Planned |
| **Loading states** | ⚠️ Partial | ✅ Skeleton loaders | 📋 Planned |
| **Empty state** | ⚠️ Partial | ✅ Friendly messaging | 📋 Planned |
| **Tenant isolation** | ⚠️ Not verified | ✅ User quotes only | 📋 Planned |

**Acceptance criteria:**
- ✅ API returns real quotes from database
- ✅ Frontend fetches and displays live data
- ✅ Status filtering works
- ✅ Carrier assignment works
- ✅ No demo data in production builds
- ✅ CI passes, no console errors

---

## Implementation Order

1. **Loads wiring** (lowest risk, highest impact)
   - Simple data model
   - No real-time complexity
   - Unblocks dispatch wiring

2. **Dispatch wiring** (medium complexity)
   - Depends on shipment tracking model
   - Requires event timeline logic
   - Foundation for real-time updates

3. **Quotes wiring** (medium complexity)
   - Depends on Genesis assist (separate task)
   - Simpler than dispatch
   - Can run in parallel

---

## Definition of Done (Per Feature)

Each wiring task is complete when:

- ✅ **Code committed** to feature branch
- ✅ **API endpoint verified** (GET, POST, filtering, pagination)
- ✅ **Frontend integration verified** (service calls, rendering, errors)
- ✅ **Live data tested** (at least 1 real record visible)
- ✅ **Demo data removed** (no hardcoded fallbacks in production)
- ✅ **Tenant isolation verified** (users see only their data)
- ✅ **Error states tested** (network errors, empty, timeouts)
- ✅ **Accessibility checked** (keyboard, screen reader, ARIA)
- ✅ **CI gates pass** (lint, typecheck, test, build)
- ✅ **PR reviewed** and approved
- ✅ **Evidence documented** (screenshots, logs, or test runs)

---

## Tracking Progress

Update this table as work completes:

| Feature | Branch | API | Frontend | Status | Evidence |
|---------|--------|-----|----------|--------|----------|
| Loads | `feature/wire-loads-api` | 🚧 | 🚧 | In progress | — |
| Dispatch | `feature/wire-dispatch-api` | 🚧 | 🚧 | Pending | — |
| Quotes | `feature/wire-quotes-api` | 🚧 | 🚧 | Pending | — |

---

## Key Decision: Demo Data vs. Live Data

**Policy:**
- Remove demo data from production builds (`VITE_ENABLE_DEMO_DATA=false`)
- Keep demo data **only** in local dev (`VITE_ENABLE_DEMO_DATA=true` in `.env.local`)
- Never hardcode fallbacks to demo arrays
- Always prefer API fetch → error state over demo data

**Example (❌ WRONG):**
```typescript
const [loads, setLoads] = useState(demoLoads); // Don't do this
```

**Example (✅ RIGHT):**
```typescript
const [loads, setLoads] = useState<Load[]>([]);
useEffect(() => {
  fetchLoads()
    .then(setLoads)
    .catch(err => setError(err)); // Error state, no fallback to demo
}, []);
```

---

## See Also

- [`docs/NEXT_SPRINT_PUBLIC_REVENUE_LIVE_OPS.md`](./NEXT_SPRINT_PUBLIC_REVENUE_LIVE_OPS.md) — Sprint roadmap
- [`docs/API_ROUTE_MAP.md`](./API_ROUTE_MAP.md) — Current API endpoints
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — PR workflow
