// vercel.config.ts
// Source-of-truth config for Infæmous Freight (monorepo + pnpm + Next.js)

export type FreightVercelConfig = {
  rootDirectory: string;
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  nodeVersion: string;
  region: string;
};

export const vercelConfig: FreightVercelConfig = {
  // Where Next.js lives
  rootDirectory: 'apps/web',

  // Deterministic installs
  installCommand: 'corepack enable && pnpm install --frozen-lockfile',

  // Build shared first, then web
  buildCommand:
    'corepack enable && pnpm install --frozen-lockfile && pnpm -r --filter @infamous-freight/shared build && pnpm --filter web build',

  // Next.js output when rootDirectory is apps/web
  outputDirectory: '.next',

  // Hard pin to avoid random “Node upgraded” failures
  nodeVersion: '20.x',

  // Choose one region; iad1 matches your prior logs & is solid
  region: 'iad1',
};
