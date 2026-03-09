export const vercelConfig = {
  rootDirectory: "apps/web",
  installCommand: "corepack enable && pnpm install --frozen-lockfile",
  buildCommand: "pnpm -r --filter @infamous/shared build && pnpm --filter web build",
  outputDirectory: ".next",
  nodeVersion: "24.x",
  region: "iad1",
};
