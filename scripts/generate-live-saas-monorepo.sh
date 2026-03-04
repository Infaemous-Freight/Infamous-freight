#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-infamous-freight}"
mkdir -p "$REPO_NAME"
cd "$REPO_NAME"

cat > package.json <<JSON
{
  "name": "$REPO_NAME",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down"
  },
  "devDependencies": {
    "turbo": "^2.0.14",
    "typescript": "^5.6.3",
    "prettier": "^3.3.3"
  }
}
JSON

cat > pnpm-workspace.yaml <<'YAML'
packages:
  - "apps/*"
  - "packages/*"
YAML

cat > turbo.json <<'JSON'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] }
  }
}
JSON

cat > docker-compose.yml <<'YAML'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: infamous
      POSTGRES_PASSWORD: infamous
      POSTGRES_DB: infamous
    ports: ["5432:5432"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
YAML

mkdir -p packages/shared/src
cat > packages/shared/package.json <<'JSON'
{
  "name": "@infamous/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": { "zod": "^3.23.8" }
}
JSON

cat > packages/shared/src/index.ts <<'TS'
import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string(),
  PLATFORM_FEE_BPS: z.coerce.number().default(300)
});

export const WebEnvSchema = z.object({ NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000') });
export const MobileEnvSchema = z.object({ EXPO_PUBLIC_API_URL: z.string().default('http://localhost:4000') });
TS

mkdir -p apps/api/src/{routes,middleware,lib,services,workers} apps/api/prisma
cat > apps/api/package.json <<'JSON'
{
  "name": "@infamous/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "worker": "tsx watch src/workers/index.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@infamous/shared": "workspace:*",
    "@prisma/client": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "bullmq": "^5.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": { "prisma": "^5.20.0", "tsx": "^4.19.2", "typescript": "^5.6.3", "@types/express": "^4.17.21", "@types/jsonwebtoken": "^9.0.6" }
}
JSON

cat > apps/api/.env.example <<'ENV'
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://infamous:infamous@localhost:5432/infamous
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_super_secret_change_me
PLATFORM_FEE_BPS=300
ENV

cat > apps/api/prisma/schema.prisma <<'PRISMA'
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

enum UserRole { OWNER ADMIN BROKER DISPATCHER CARRIER_ADMIN DRIVER SHIPPER FINANCE READONLY }
enum LoadStatus { POSTED BOOKED IN_TRANSIT DELIVERED INVOICED PAID }
enum EquipmentType { DRYVAN REEFER FLATBED POWERONLY STEPDECK }

model Organization {
  id String @id @default(cuid())
  name String
  users User[]
  loads Load[]
}

model User {
  id String @id @default(cuid())
  orgId String
  email String
  role UserRole
  passwordHash String
  org Organization @relation(fields: [orgId], references: [id])
  @@unique([orgId, email])
}

model Load {
  id String @id @default(cuid())
  orgId String
  originCity String
  originState String
  destCity String
  destState String
  equipment EquipmentType
  pickupAt DateTime
  rateCents Int
  status LoadStatus @default(POSTED)
  org Organization @relation(fields: [orgId], references: [id])
}
PRISMA

cat > apps/api/src/lib/prisma.ts <<'TS'
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
TS

cat > apps/api/src/env.ts <<'TS'
import 'dotenv/config';
import { EnvSchema } from '@infamous/shared';
export const env = EnvSchema.parse(process.env);
TS

cat > apps/api/src/middleware/auth.ts <<'TS'
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

declare global { namespace Express { interface Request { user?: { sub: string; orgId: string; role: string; email: string } } } }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('authorization');
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing bearer token' });
  try {
    req.user = jwt.verify(auth.slice(7), env.JWT_SECRET) as any;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
TS

cat > apps/api/src/routes/auth.routes.ts <<'TS'
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../env.js';

export const authRoutes = Router();

authRoutes.post('/register', async (req, res) => {
  const { orgName, email, password } = req.body ?? {};
  const org = await prisma.organization.create({ data: { name: orgName } });
  const user = await prisma.user.create({ data: { orgId: org.id, email, role: 'OWNER', passwordHash: await bcrypt.hash(password, 12) } });
  const token = jwt.sign({ sub: user.id, orgId: org.id, role: user.role, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ org, user: { id: user.id, email: user.email, role: user.role }, token });
});

authRoutes.post('/login', async (req, res) => {
  const { orgId, email, password } = req.body ?? {};
  const user = await prisma.user.findFirst({ where: { orgId, email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, orgId: user.orgId, role: user.role, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});
TS

cat > apps/api/src/routes/loads.routes.ts <<'TS'
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const loadsRoutes = Router();
loadsRoutes.use(requireAuth);

loadsRoutes.get('/', async (req, res) => {
  const loads = await prisma.load.findMany({ where: { orgId: req.user!.orgId }, orderBy: { pickupAt: 'desc' } });
  res.json(loads);
});

loadsRoutes.post('/', async (req, res) => {
  const load = await prisma.load.create({ data: { ...req.body, orgId: req.user!.orgId, pickupAt: new Date(req.body.pickupAt), rateCents: Number(req.body.rateCents), status: 'POSTED' } });
  res.json(load);
});
TS

cat > apps/api/src/index.ts <<'TS'
import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { authRoutes } from './routes/auth.routes.js';
import { loadsRoutes } from './routes/loads.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/loads', loadsRoutes);
app.listen(env.PORT, () => console.log(`[api] http://localhost:${env.PORT}`));
TS

cat > apps/api/src/seed.ts <<'TS'
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma.js';

const main = async () => {
  const org = await prisma.organization.create({ data: { name: 'Infamous Freight Demo' } });
  await prisma.user.create({ data: { orgId: org.id, email: 'owner@infamous.test', role: 'OWNER', passwordHash: await bcrypt.hash('password123', 12) } });
  console.log({ orgId: org.id, email: 'owner@infamous.test', password: 'password123' });
};

main().finally(async () => prisma.$disconnect());
TS

cat > apps/api/src/workers/index.ts <<'TS'
console.log('[worker] BullMQ worker scaffold ready.');
TS

mkdir -p apps/web/app/{login,register,loads,lib}
cat > apps/web/package.json <<'JSON'
{ "name": "@infamous/web", "private": true, "scripts": { "dev": "next dev -p 3000" }, "dependencies": { "next": "14.2.18", "react": "18.3.1", "react-dom": "18.3.1", "@infamous/shared": "workspace:*" } }
JSON
cat > apps/web/.env.example <<'ENV'
NEXT_PUBLIC_API_URL=http://localhost:4000
ENV
cat > apps/web/app/lib/api.ts <<'TS'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export const apiFetch = (path: string, init?: RequestInit) => fetch(`${API_URL}${path}`, init);
TS
cat > apps/web/app/layout.tsx <<'TSX'
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
TSX
cat > apps/web/app/page.tsx <<'TSX'
export default function Page() { return <main style={{ padding: 20 }}>INFAMOUS FREIGHT web app is ready.</main>; }
TSX

mkdir -p apps/mobile/lib
cat > apps/mobile/package.json <<'JSON'
{ "name": "@infamous/mobile", "private": true, "scripts": { "dev": "expo start" }, "dependencies": { "expo": "~51.0.32", "react": "18.3.1", "react-native": "0.74.5", "@infamous/shared": "workspace:*" } }
JSON
cat > apps/mobile/.env.example <<'ENV'
EXPO_PUBLIC_API_URL=http://localhost:4000
ENV
cat > apps/mobile/App.tsx <<'TSX'
import { SafeAreaView, Text } from 'react-native';
export default function App() { return <SafeAreaView><Text>Infamous Freight Driver</Text></SafeAreaView>; }
TSX

cat > README.md <<'MD'
# Infamous Freight Live SaaS Monorepo Generator Output

## Included
- API: Express + Prisma + Postgres
- Worker scaffold: BullMQ + Redis
- Web: Next.js shell pages
- Mobile: Expo shell app
- Infra: docker-compose for Postgres + Redis

## Quick start
```bash
pnpm i
pnpm db:up
cp apps/api/.env.example apps/api/.env
pnpm --filter @infamous/api prisma:migrate
pnpm --filter @infamous/api seed
pnpm --filter @infamous/api dev
pnpm --filter @infamous/web dev
```
MD

echo "✅ Full monorepo scaffold created at ./$REPO_NAME"
