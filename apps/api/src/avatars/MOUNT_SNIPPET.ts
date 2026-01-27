/**
 * INTEGRATION GUIDE - Phase 2 Avatar System
 *
 * The avatar system has been successfully integrated into api/src/server.js
 *
 * ✅ WHAT'S ALREADY DONE:
 *
 * 1. Static File Serving (lines ~108-109 in server.js)
 *    - /uploads → api/public/uploads (user avatar storage)
 *    - /avatars/main → web/public/avatars/main (Phase 1 system defaults)
 *
 * 2. Avatar Routes Mounted (lines ~108-111 in server.js)
 *    - /v1/avatars (primary)
 *    - /api/avatars (legacy support)
 *
 * 3. Data Store (api/data/avatars.json)
 *    - CI-safe JSON persistence
 *    - Atomic writes with temp file pattern
 *    - Auto-initialization on first load
 *
 * 4. Authentication Integration
 *    - JWT extraction via getUserId(req)
 *    - Scope-based access control (user:avatar scope required)
 *    - Reuses existing security middleware from api/src/middleware/security.js
 *
 * ================================================================================
 *
 * 📋 ENDPOINT DOCUMENTATION:
 *
 * Phase 1: System Avatars (Public)
 * ────────────────────────────────
 * GET /v1/avatars/system
 * Get Phase 1 default system avatars (no auth required)
 * Returns: manifest.json from web/public/avatars/main/
 *
 * Phase 2: User Avatars (Auth Required - Scopes: user:avatar)
 * ────────────────────────────────────────────────────────────
 *
 * GET /v1/avatars/me
 * Get all avatars for authenticated user
 * Response: { avatars, selected, userId }
 *
 * POST /v1/avatars/me/upload
 * Upload new avatar (multipart/form-data)
 * Form Field: avatar (file, required)
 * File Constraints:
 *   - Max size: 5 MB (AVATAR_MAX_FILE_SIZE_MB)
 *   - Allowed types: image/jpeg, image/png, image/webp
 * Response: { avatar, url }
 *
 * POST /v1/avatars/me/select/:filename
 * Set avatar as active (deselects others)
 * URL Param: filename (from upload response)
 * Response: { avatar, url }
 *
 * DELETE /v1/avatars/me/:filename
 * Delete uploaded avatar
 * URL Param: filename
 * Response: { success }
 *
 * Admin Only:
 * ──────────
 * GET /v1/avatars/stats (scope: admin)
 * Get store statistics (total avatars, users, store size)
 * Response: { stats: { totalAvatars, totalUsers, storeSize } }
 *
 * ================================================================================
 *
 * 🔧 ENVIRONMENT VARIABLES (in .env):
 *
 * AVATAR_UPLOAD_DIR=api/public/uploads
 * AVATAR_MAX_FILE_SIZE_MB=5
 * AVATAR_MAX_DIMENSIONS=2048x2048
 * AVATAR_ALLOWED_TYPES=image/jpeg,image/png,image/webp
 * AVATAR_DATA_STORE=api/data/avatars.json
 * RATE_LIMIT_AVATAR_WINDOW_MS=15
 * RATE_LIMIT_AVATAR_MAX=20
 *
 * ================================================================================
 *
 * 📁 FILE STRUCTURE:
 *
 * api/src/
 *   └── avatars/
 *       ├── routes.ts           ← Express route handlers (mounted at /v1/avatars)
 *       └── store.ts            ← JSON persistence layer (api/data/avatars.json)
 *   └── auth/
 *       └── userId.ts           ← JWT token extraction (getUserId, requireUserId)
 *   └── config/
 *       └── env.ts              ← Environment validation with Zod
 *   └── public/
 *       └── uploads/            ← User avatar storage (per-user subdirs)
 *   └── data/
 *       └── avatars.json        ← Store persistence (atomic writes)
 *
 * web/public/
 *   └── avatars/
 *       └── main/
 *           ├── manifest.json   ← Phase 1 system defaults
 *           ├── main-01.png     ← Infinity Operator
 *           ├── main-02.png     ← Crimson Neural
 *           ├── main-03.png     ← Golden Sphinx Core
 *           └── main-04.png     ← Genesis Oracle
 *
 * ================================================================================
 *
 * 🚀 TESTING (cURL Examples):
 *
 * 1. Get system avatars (no auth):
 *    curl http://localhost:4000/v1/avatars/system
 *
 * 2. Get user avatars (requires JWT):
 *    curl -H "Authorization: Bearer <token>" http://localhost:4000/v1/avatars/me
 *
 * 3. Upload avatar (requires JWT + scope user:avatar):
 *    curl -X POST \\
 *      -H "Authorization: Bearer <token>" \\
 *      -F "avatar=@/path/to/avatar.jpg" \\
 *      http://localhost:4000/v1/avatars/me/upload
 *
 * 4. Select avatar:
 *    curl -X POST \\
 *      -H "Authorization: Bearer <token>" \\
 *      http://localhost:4000/v1/avatars/me/select/avatar-12345-abcd.jpg
 *
 * 5. Get stats (requires scope admin):
 *    curl -H "Authorization: Bearer <admin-token>" \\
 *      http://localhost:4000/v1/avatars/stats
 *
 * ================================================================================
 *
 * 🔐 SECURITY DETAILS:
 *
 * - Authentication: JWT tokens (via authenticate middleware)
 * - Authorization: Scope-based (user:avatar for uploads, admin for stats)
 * - File Upload: Validated MIME types, file size limits, multer configuration
 * - Storage: Per-user subdirectories prevent cross-user access
 * - Data Persistence: Atomic writes with temp files prevent corruption
 * - Rate Limiting: 20 avatars per 15 minutes per user
 *
 * ================================================================================
 *
 * ✨ NEXT STEPS:
 *
 * 1. Copy Phase 1 Avatar Images:
 *    Place these files in web/public/avatars/main/:
 *    - main-01.png (Infinity Operator)
 *    - main-02.png (Crimson Neural)
 *    - main-03.png (Golden Sphinx Core)
 *    - main-04.png (Genesis Oracle)
 *
 * 2. Update .env File:
 *    Ensure all AVATAR_* variables are set (or use defaults above)
 *
 * 3. Install Dependencies (if needed):
 *    pnpm add multer zod @types/multer
 *
 * 4. Test Endpoints:
 *    Use cURL examples above to verify system and user avatar operations
 *
 * 5. Deploy to Production:
 *    git add api/src/avatars api/src/auth api/src/config api/public/uploads api/data
 *    git commit -m "feat: Phase 2 avatar system (user uploads + system defaults)"
 *    git push origin main
 *
 * ================================================================================
 */

export const INTEGRATION_COMPLETE = true;
