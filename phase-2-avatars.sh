#!/bin/bash
# Phase 2 — User Avatar System (Local Mode + JSON Store)
# Copy/paste from repo root and run: bash phase-2-avatars.sh

set -euo pipefail

PHASE(){ echo ""; echo "===================="; echo "PHASE $1 — $2"; echo "===================="; }
OK(){ echo "✅ $1"; }
WARN(){ echo "⚠️  $1"; }
DIE(){ echo "❌ $1"; exit 1; }

PHASE "2" "API: User avatars (upload/list/select) — LOCAL mode + JSON store"

# --- Preflight ---
[ -d "api" ] || DIE "Missing ./api folder (run from repo root)"
command -v pnpm >/dev/null 2>&1 || DIE "pnpm not found"

# --- Install dependencies ---
pnpm -C api add multer cors zod
pnpm -C api add -D @types/multer @types/cors
OK "Installed deps: multer, cors, zod"

# --- Create directories ---
mkdir -p api/src/{avatars,auth,config} api/public/uploads api/data
OK "Created directories"

# --- Auth helper (demo mode — replace with real auth later) ---
cat > api/src/auth/userId.ts <<'AUTHTS'
/**
 * Demo auth hook. Replace with real JWT/session auth later.
 * For Phase 2 testing: pass x-user-id header
 */
export function getUserId(req: any): string {
  return String(req.headers["x-user-id"] ?? "demo-user");
}
AUTHTS
OK "Created auth/userId.ts"

# --- Environment config ---
cat > api/src/config/env.ts <<'ENVTS'
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  AVATAR_STORAGE: z.literal("local").default("local"),
});

export const env = EnvSchema.parse(process.env);
ENVTS
OK "Created config/env.ts"

# --- JSON Store (CI-safe persistence) ---
cat > api/src/avatars/store.ts <<'STORETS'
import fs from "fs";
import path from "path";

export type StoredAvatar = {
  id: string;
  ownerUserId: string;
  name: string;
  imageUrl: string;
  createdAt: string;
};

export type AvatarSelection =
  | { type: "system"; systemId: string }
  | { type: "user"; avatarId: string };

type StoreShape = {
  avatars: StoredAvatar[];
  selections: Record<string, AvatarSelection>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "avatars.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ avatars: [], selections: {} }, null, 2),
      "utf-8"
    );
  }
}

function read(): StoreShape {
  ensure();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as StoreShape;
}

function write(s: StoreShape) {
  ensure();
  fs.writeFileSync(DATA_FILE, JSON.stringify(s, null, 2), "utf-8");
}

export function listUserAvatars(ownerUserId: string) {
  return read().avatars.filter((a) => a.ownerUserId === ownerUserId);
}

export function createUserAvatar(a: Omit<StoredAvatar, "createdAt">) {
  const s = read();
  const created: StoredAvatar = { ...a, createdAt: new Date().toISOString() };
  s.avatars.push(created);
  write(s);
  return created;
}

export function getSelection(userId: string): AvatarSelection | null {
  return read().selections[userId] ?? null;
}

export function setSelection(userId: string, sel: AvatarSelection) {
  const s = read();
  s.selections[userId] = sel;
  write(s);
  return sel;
}
STORETS
OK "Created avatars/store.ts"

# --- API Routes ---
cat > api/src/avatars/routes.ts <<'ROUTESTS'
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { z } from "zod";
import { getUserId } from "../auth/userId";
import {
  createUserAvatar,
  getSelection,
  listUserAvatars,
  setSelection,
  type AvatarSelection,
} from "./store";

export const avatarsRouter = Router();

function userId(req: any): string {
  return getUserId(req);
}

/** GET /v1/avatars/system — Phase 1 defaults */
avatarsRouter.get("/system", (_req, res) => {
  res.json({
    featured: [
      { id: "main-01", name: "Infinity Operator", imageUrl: "/avatars/main/main-01.png" },
      { id: "main-02", name: "Crimson Neural", imageUrl: "/avatars/main/main-02.png" },
      { id: "main-03", name: "Golden Sphinx Core", imageUrl: "/avatars/main/main-03.png" },
      { id: "main-04", name: "Genesis Oracle", imageUrl: "/avatars/main/main-04.png" },
    ],
  });
});

/** Local uploads directory */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },
});

/** POST /v1/avatars/me/upload — Upload user avatar */
avatarsRouter.post("/me/upload", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const uid = userId(req);
    const imageUrl = `/uploads/${req.file.filename}`;
    const avatarId = crypto.randomUUID();

    const created = createUserAvatar({
      id: avatarId,
      ownerUserId: uid,
      name: req.body.name || "My Avatar",
      imageUrl,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/** GET /v1/avatars/me — List user avatars + current selection */
avatarsRouter.get("/me", (req, res) => {
  const uid = userId(req);
  const avatars = listUserAvatars(uid);
  const selection = getSelection(uid);

  res.json({
    avatars,
    selection,
  });
});

/** POST /v1/avatars/me/select — Select system or user avatar */
avatarsRouter.post("/me/select", (req, res) => {
  const uid = userId(req);
  const SelectSchema = z.union([
    z.object({ type: z.literal("system"), systemId: z.string() }),
    z.object({ type: z.literal("user"), avatarId: z.string() }),
  ]);

  const result = SelectSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.message });
  }

  const selection: AvatarSelection = result.data;
  setSelection(uid, selection);

  res.json({ selection });
});

export default avatarsRouter;
ROUTESTS
OK "Created avatars/routes.ts"

# --- Mount snippet (to be added to main API server) ---
cat > api/src/avatars/MOUNT_SNIPPET.ts <<'SNIPPETS'
/**
 * Add this to your main API server (api/src/server.ts or similar):
 *
 * import { avatarsRouter } from "./avatars/routes";
 * import cors from "cors";
 *
 * const app = express();
 *
 * // Enable CORS
 * app.use(cors({ origin: process.env.CORS_ORIGINS?.split(",") || "*" }));
 *
 * // JSON & form parsing
 * app.use(express.json());
 * app.use(express.urlencoded({ extended: true }));
 *
 * // Serve uploaded files
 * app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
 * app.use("/avatars/main", express.static(path.join(__dirname, "../../web/public/avatars/main")));
 *
 * // Avatar routes
 * app.use("/v1/avatars", avatarsRouter);
 */
SNIPPETS
OK "Created avatars/MOUNT_SNIPPET.ts"

# --- Git stage for Phase 2 ---
git add api/src/avatars api/src/auth api/src/config api/public/uploads api/data 2>/dev/null || true
OK "Staged Phase 2 files"

PHASE "2" "COMPLETE"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Add to api/src/server.ts (see MOUNT_SNIPPET.ts):"
echo "   import { avatarsRouter } from './avatars/routes';"
echo "   app.use('/v1/avatars', avatarsRouter);"
echo ""
echo "2. Test endpoints:"
echo "   GET  http://localhost:3001/v1/avatars/system"
echo "   GET  http://localhost:3001/v1/avatars/me (with header: x-user-id: test-user)"
echo "   POST http://localhost:3001/v1/avatars/me/upload (multipart: file + name)"
echo "   POST http://localhost:3001/v1/avatars/me/select"
echo ""
echo "3. Commit:"
echo "   git commit -m 'feat: Phase 2 user avatars (local mode + JSON store)'"
echo "   git push origin main"
echo ""
echo "✅ Phase 2 ready!"
