# Phase 2 Avatar System - Integration Complete ✅

## Summary

The Phase 2 user avatar system has been **successfully integrated** into the Express API server at `/api/src/server.js`.

## What Was Added

### 1. **Static File Serving** (Lines 113-114)

```javascript
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use(
  "/avatars/main",
  express.static(path.join(__dirname, "../../apps/web/public/avatars/main")),
);
```

- `/uploads` → Serves user-uploaded avatars from `apps/api/public/uploads/`
- `/avatars/main` → Serves Phase 1 system defaults from `apps/web/public/avatars/main/`

### 2. **Avatar Routes** (Lines 117-118)

```javascript
app.use("/v1/avatars", avatarsRouter);
app.use("/api/avatars", avatarsRouter); // Legacy support
```

Both paths map to the same router for backwards compatibility.

### 3. **New Files Created** (5 core files)

| File                        | Purpose                                |
| --------------------------- | -------------------------------------- |
| `apps/api/src/avatars/routes.ts` | Express route handlers (6 endpoints)   |
| `apps/api/src/avatars/store.ts`  | JSON persistence layer (atomic writes) |
| `apps/api/src/auth/userId.ts`    | JWT token extraction utilities         |
| `apps/api/src/config/env.ts`     | Environment validation with Zod        |
| `apps/api/data/avatars.json`     | Store initialization file              |

### 4. **Directories Created**

```
apps/api/public/uploads/         ← User avatar storage (per-user subdirs)
apps/api/data/                   ← Store directory
apps/api/src/avatars/            ← Avatar routes & store
apps/api/src/auth/               ← Auth utilities
apps/api/src/config/             ← Config & env validation
```

## API Endpoints

### Public (No Auth Required)

- `GET /v1/avatars/system` - Get Phase 1 system avatars

### User Endpoints (Auth Required)

- `GET /v1/avatars/me` - Get user's avatars
- `POST /v1/avatars/me/upload` - Upload new avatar (scope: `user:avatar`)
- `POST /v1/avatars/me/select/:filename` - Set as active
- `DELETE /v1/avatars/me/:filename` - Delete avatar

### Admin Endpoints (Auth + Admin Scope)

- `GET /v1/avatars/stats` - Get store statistics

## Features

✅ JWT authentication via `getUserId(req)`
✅ Scope-based authorization (`user:avatar`, `admin`)
✅ Multer file upload with validation (5MB max, JPEG/PNG/WebP)
✅ Per-user storage (prevents cross-user access)
✅ Atomic JSON writes (prevents corruption)
✅ Rate limiting (20 uploads per 15 minutes)
✅ Auto-initialization of store on first load
✅ Static file serving for uploads and Phase 1 defaults

## Environment Variables (in .env)

```
AVATAR_UPLOAD_DIR=apps/api/public/uploads
AVATAR_MAX_FILE_SIZE_MB=5
AVATAR_ALLOWED_TYPES=image/jpeg,image/png,image/webp
AVATAR_DATA_STORE=apps/api/data/avatars.json
RATE_LIMIT_AVATAR_WINDOW_MS=15
RATE_LIMIT_AVATAR_MAX=20
```

## Next Steps

### ✏️ Phase 1: Add System Avatar Images

Copy 4 PNG files to `apps/web/public/avatars/main/`:

```
apps/web/public/avatars/main/
├── main-01.png  (Infinity Operator)
├── main-02.png  (Crimson Neural)
├── main-03.png  (Golden Sphinx Core)
└── main-04.png  (Genesis Oracle)
```

The manifest at `apps/web/public/avatars/main/manifest.json` already defines these.

### ✏️ Phase 2: Install Dependencies

If not already installed:

```bash
pnpm add multer zod @types/multer
```

### ✏️ Phase 3: Test Endpoints

```bash
# Get system avatars (no auth)
curl http://localhost:4000/v1/avatars/system

# Get user avatars (with JWT)
curl -H "Authorization: Bearer <token>" http://localhost:4000/v1/avatars/me

# Upload avatar
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/avatar.jpg" \
  http://localhost:4000/v1/avatars/me/upload

# Select avatar
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:4000/v1/avatars/me/select/avatar-12345-abcd.jpg
```

### ✏️ Phase 4: Deploy

```bash
git add apps/api/src/avatars apps/api/src/auth apps/api/src/config apps/api/public/uploads apps/api/data apps/web/public/avatars/main apps/api/src/server.js
git commit -m "feat: Phase 2 avatar system (user uploads + system defaults + static serving)"
git push origin main
```

## Technical Details

### Storage Architecture

- **Phase 1:** Static files served from `apps/web/public/avatars/main/` (no auth required)
- **Phase 2:** Dynamic uploads to `apps/api/public/uploads/{userId}/` (authenticated users)
- **Persistence:** JSON store at `apps/api/data/avatars.json` with atomic writes

### Security

- JWT authentication required for user operations
- Per-user storage prevents unauthorized access
- File type validation (MIME type + extension)
- File size limits (5MB default)
- Rate limiting (20 uploads/15min per user)
- Scope-based access control

### Data Safety

- Atomic writes using temp files (prevents corruption)
- Auto-recovery if store is corrupted
- Per-user subdirectories for isolation
- CI-safe JSON persistence

## Related Files

- Integration guide: `apps/api/src/avatars/MOUNT_SNIPPET.ts`
- Phase 1 manifest: `apps/web/public/avatars/main/manifest.json`
- Server entry point: `apps/api/src/server.js` (lines 113-118)
- Security middleware: `apps/api/src/middleware/security.js` (authenticate, requireScope)

---

**Status:** ✅ Ready for testing and Phase 1 image placement
