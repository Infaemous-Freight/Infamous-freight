# Phase 2 Avatar System - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS API SERVER                                   │
│                      (apps/api/src/server.js)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  MIDDLEWARE STACK                                                │       │
│  │  ├─ Authentication (authenticate via JWT)                        │       │
│  │  ├─ Rate Limiting (limiters.general, limiters.voice)            │       │
│  │  └─ Scope Validation (requireScope)                             │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  STATIC FILE SERVING (Express.static)                           │       │
│  ├──────────────────────────────────────────────────────────────────┤       │
│  │  GET /uploads/:userId/:filename                                  │       │
│  │      → apps/api/public/uploads/{userId}/{filename}                   │       │
│  │                                                                  │       │
│  │  GET /avatars/main/:filename                                    │       │
│  │      → apps/web/public/avatars/main/{filename}                       │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │  AVATAR ROUTES (/v1/avatars, /api/avatars)                     │       │
│  │  (apps/api/src/avatars/routes.ts)                                    │       │
│  ├──────────────────────────────────────────────────────────────────┤       │
│  │  PUBLIC ENDPOINTS:                                              │       │
│  │  └─ GET /system                                                 │       │
│  │     └─ Reads manifest from apps/web/public/avatars/main/             │       │
│  │     └─ Returns Phase 1 system avatars (no auth)                │       │
│  │                                                                  │       │
│  │  AUTHENTICATED USER ENDPOINTS:                                  │       │
│  │  ├─ GET /me                                                     │       │
│  │  │  └─ Lists user's avatars from store                          │       │
│  │  ├─ POST /me/upload                                             │       │
│  │  │  └─ Multipart upload → apps/api/public/uploads/{userId}/          │       │
│  │  │  └─ Updates store with metadata                              │       │
│  │  ├─ POST /me/select/:filename                                   │       │
│  │  │  └─ Sets avatar as active in store                           │       │
│  │  └─ DELETE /me/:filename                                        │       │
│  │     └─ Removes avatar from store + disk                         │       │
│  │                                                                  │       │
│  │  ADMIN ENDPOINTS:                                               │       │
│  │  └─ GET /stats (scope: admin)                                   │       │
│  │     └─ Returns store statistics                                 │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
         │                          │                         │
         ▼                          ▼                         ▼
    ┌─────────────┐         ┌──────────────────┐     ┌──────────────────┐
    │  MULTER     │         │  STORE SERVICE   │     │  STATIC FILES    │
    │ (Upload)    │         │  (JSON Persist)  │     │   (Express)      │
    ├─────────────┤         ├──────────────────┤     ├──────────────────┤
    │ • Validate  │         │ • Load from disk │     │ apps/api/public/      │
    │   MIME type │         │ • Cache in memory│     │   uploads/       │
    │ • Check     │         │ • Atomic writes  │     │   {userId}/      │
    │   file size │         │ • Auto-init      │     │     {file}       │
    │ • Sanitize  │         │ • Error recovery │     │                  │
    │   filename  │         └──────────────────┘     │ apps/web/public/      │
    │ • Create    │                                  │   avatars/main/  │
    │   per-user  │                                  │     manifest.json│
    │   dirs      │                                  │     main-01.png  │
    └─────────────┘                                  │     main-02.png  │
         │                                           │     main-03.png  │
         ▼                                           │     main-04.png  │
    ┌─────────────┐                                  └──────────────────┘
    │  DISK       │
    │ STORAGE     │
    ├─────────────┤
    │ Avatars     │
    │ organized   │
    │ by user ID  │
    └─────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      SUPPORTING MODULES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────┐   ┌─────────────────────────────────────┐   │
│  │  apps/api/src/auth/userId.ts    │   │  apps/api/src/config/env.ts            │   │
│  ├────────────────────────────┤   ├─────────────────────────────────────┤   │
│  │ Utilities:                 │   │ Environment Validation:             │   │
│  │ • getUserId(req)           │   │ • AVATAR_UPLOAD_DIR                │   │
│  │ • requireUserId(req)       │   │ • AVATAR_MAX_FILE_SIZE_MB          │   │
│  │ • getUser(req)             │   │ • AVATAR_ALLOWED_TYPES             │   │
│  │                             │   │ • AVATAR_DATA_STORE                │   │
│  │ Extracts JWT sub claim:    │   │ • RATE_LIMIT_AVATAR_WINDOW_MS      │   │
│  │ Authorization header       │   │ • RATE_LIMIT_AVATAR_MAX            │   │
│  │ → Bearer token → JWT       │   │                                    │   │
│  │ → Extract sub              │   │ All with defaults, Zod validated   │   │
│  └────────────────────────────┘   └─────────────────────────────────────┘   │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  apps/api/src/avatars/store.ts                                             │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ JSON Persistence Layer:                                               │ │
│  │ • initializeStore()     → Load/create store from disk                 │ │
│  │ • getUserAvatars()      → List user's avatars                         │ │
│  │ • getSelectedAvatar()   → Get active avatar                           │ │
│  │ • addAvatar()           → Insert new avatar metadata                  │ │
│  │ • selectAvatar()        → Mark as active (atomic)                     │ │
│  │ • deleteAvatar()        → Remove from store                           │ │
│  │ • getStoreStats()       → Aggregate statistics                        │ │
│  │                                                                        │ │
│  │ Atomic Writes Pattern:                                                │ │
│  │ • Write to temp file (.avatars.tmp)                                   │ │
│  │ • Atomic rename (temp → final)                                        │ │
│  │ • Cleanup on error                                                    │ │
│  │                                                                        │ │
│  │ Store Format (apps/api/data/avatars.json):                                 │ │
│  │ {                                                                      │ │
│  │   "version": "1.0.0",                                                 │ │
│  │   "createdAt": "2025-01-17T...",                                      │ │
│  │   "avatars": [                                                        │ │
│  │     {                                                                 │ │
│  │       "userId": "uuid",                                               │ │
│  │       "uploadedAt": "2025-01-17T...",                                 │ │
│  │       "fileName": "userId/avatar-timestamp-random.ext",               │ │
│  │       "fileSize": 12345,                                              │ │
│  │       "mimeType": "image/jpeg",                                       │ │
│  │       "selected": true                                                │ │
│  │     }                                                                 │ │
│  │   ]                                                                   │ │
│  │ }                                                                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIAGRAMS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  UPLOAD FLOW:                                                               │
│  ───────────                                                                │
│  Client                Express            Multer          Store    Disk    │
│    │                    │                   │              │        │      │
│    ├──POST /me/upload──>│                   │              │        │      │
│    │ (multipart/form)   │                   │              │        │      │
│    │                    ├──validate auth───>│              │        │      │
│    │                    │<─────────OK────────              │        │      │
│    │                    ├──save file───────────────────────────────>│      │
│    │                    │<─────────file path────────────────────────     │      │
│    │                    ├─add to store─────────────────────>│        │      │
│    │                    │<────────OK───────────────────────┤        │      │
│    │<─{"avatar":{...}}──┤                                  │        │      │
│    │                    │                                  │        │      │
│                                                                               │
│  SELECT FLOW:                                                               │
│  ────────────                                                               │
│  Client                Express            Store            Disk             │
│    │                    │                  │                │               │
│    ├─POST /me/select──>│                  │                │               │
│    │  :filename        │                  │                │               │
│    │                   ├─find & mark────>│                │               │
│    │                   │<─avatar---------┤                │               │
│    │                   ├─atomic write──────────────────────>               │
│    │<─{"avatar":{...}}─┤                  │                │               │
│    │                   │                  │                │               │
│                                                                               │
│  RETRIEVE FLOW:                                                             │
│  ──────────────                                                             │
│  Client                Express       Store (JSON)                           │
│    │                    │              │                                    │
│    ├──GET /me────────>│              │                                     │
│    │                   ├─getUserAvatars──>│                                 │
│    │                   │<─[avatars]──────┤                                 │
│    │<─{"avatars":[],"selected":{...}}───┤                                 │
│    │                   │                  │                                │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Request Flow Example

```javascript
// Client sends JWT in header
GET /v1/avatars/me
Authorization: Bearer eyJhbGc...

   ↓

// Express middleware chain
1. limiters.general  → Rate limit (100 per 15min)
2. authenticate      → Verify JWT → req.user = { sub: "user-id", ...}
3. Router matching   → /v1/avatars → avatarsRouter

   ↓

// Handler (routes.ts)
router.get("/me", limiters.general, authenticate, async (req, res) => {
  const userId = getUserId(req)        // Extract from req.user.sub
  const avatars = await getUserAvatars(userId)  // Query store
  res.json({ avatars, selected })     // Return results
})

   ↓

// Store service (store.ts)
async function getUserAvatars(userId) {
  await ensureInitialized()            // Load from disk if needed
  return store.avatars.filter(a => a.userId === userId)
}

   ↓

// Response
{
  "success": true,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "avatars": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "uploadedAt": "2025-01-17T10:30:00.000Z",
      "fileName": "123e4567-e89b-12d3-a456-426614174000/avatar-12345-abcd.jpg",
      "fileSize": 45678,
      "mimeType": "image/jpeg",
      "selected": true
    }
  ],
  "selected": { /* ... */ },
  "timestamp": "2025-01-17T10:35:00.000Z"
}
```

## File Structure Summary

```
apps/api/src/
├── avatars/
│   ├── routes.ts           ← Express routes (6 endpoints)
│   ├── store.ts            ← JSON persistence
│   └── MOUNT_SNIPPET.ts    ← Integration guide
├── auth/
│   └── userId.ts           ← JWT utilities
├── config/
│   └── env.ts              ← Environment validation
├── public/
│   └── uploads/            ← User avatars (created dynamically)
│       ├── {userId-1}/
│       │   ├── avatar-12345-abcd.jpg
│       │   └── avatar-67890-efgh.jpg
│       └── {userId-2}/
│           └── avatar-99999-ijkl.png
└── data/
    └── avatars.json        ← Store persistence

apps/web/public/
└── avatars/
    └── main/
        ├── manifest.json   ← Phase 1 config (no auth)
        ├── main-01.png     ← Infinity Operator
        ├── main-02.png     ← Crimson Neural
        ├── main-03.png     ← Golden Sphinx Core
        └── main-04.png     ← Genesis Oracle
```

---

**System Ready for Phase 1 Image Placement**
