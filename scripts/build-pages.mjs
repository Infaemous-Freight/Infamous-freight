#!/usr/bin/env node

/**
 * Build script for GitHub Pages deployment
 * Builds the Next.js web app as a static export and copies to ./dist
 */

import { execSync } from "child_process";
import { cpSync, mkdirSync, rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const webAppDir = join(rootDir, "apps/web");
const distDir = join(rootDir, "dist");

console.log("🚀 Building GitHub Pages site...\n");

// Clean dist directory
console.log("🧹 Cleaning dist directory...");
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

// Set environment for static export
process.env.NODE_ENV = "production";
try {
  // Build shared package first (if needed)
  const sharedDir = join(rootDir, "src/packages/shared");
  if (existsSync(join(sharedDir, "package.json"))) {
    console.log("📦 Building shared package...");
    execSync("pnpm run build", {
      cwd: sharedDir,
      stdio: "inherit",
      env: { ...process.env },
    });
  }

  // Build web app with static export
  console.log("\n📦 Building Next.js app with static export...");

  // Temporarily modify next.config.mjs to use static export
  const configPath = join(webAppDir, "next.config.mjs");
  const configBackup = join(webAppDir, "next.config.mjs.backup");

  // Backup original config
  if (existsSync(configPath)) {
    cpSync(configPath, configBackup);
  }

  // Build with export output
  process.env.GITHUB_PAGES_BUILD = "true";
  execSync("pnpm run build", {
    cwd: webAppDir,
    stdio: "inherit",
    env: { ...process.env },
  });

  // Restore original config
  if (existsSync(configBackup)) {
    cpSync(configBackup, configPath);
    rmSync(configBackup);
  }

  // Copy Next.js output to dist
  console.log("\n📁 Copying build output to dist...");
  const nextOutDir = join(webAppDir, "out");
  if (existsSync(nextOutDir)) {
    cpSync(nextOutDir, distDir, { recursive: true });
    console.log("✅ Static site copied to ./dist");
  } else {
    console.error("❌ Error: Next.js out directory not found");
    process.exit(1);
  }

  // Create .nojekyll file for GitHub Pages
  const nojekyllPath = join(distDir, ".nojekyll");
  execSync(`touch ${nojekyllPath}`);
  console.log("✅ Created .nojekyll file");

  console.log("\n✨ Build complete! Site is ready in ./dist\n");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}
