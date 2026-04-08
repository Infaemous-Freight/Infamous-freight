import { cp, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const srcRoot = path.resolve("src");
const distRoot = path.resolve("dist");

const forceCjsCopies = new Set([
  "middleware/advancedSecurity.js",
  "middleware/logger.js",
  "middleware/rbac.js",
  "middleware/validation.js",
  "lib/rateLimitMetrics.js",
]);

async function copyJsFiles(currentDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      await copyJsFiles(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    const relativePath = path.relative(srcRoot, fullPath);
    const tsSourcePath = fullPath.slice(0, -3) + ".ts";
    const tsSourceExists = await stat(tsSourcePath).then((file) => file.isFile()).catch(() => false);
    const forceCjs = forceCjsCopies.has(relativePath);
    const shouldCopyAsCjs = tsSourceExists || forceCjs;

    if (forceCjs) {
      const jsDestination = path.join(distRoot, relativePath);
      await mkdir(path.dirname(jsDestination), { recursive: true });
      await cp(fullPath, jsDestination);
    }

    const destinationRelativePath = shouldCopyAsCjs
      ? relativePath.slice(0, -3) + ".cjs"
      : relativePath;

    const destination = path.join(distRoot, destinationRelativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(fullPath, destination);
  }
}

const srcStats = await stat(srcRoot).catch(() => null);
if (!srcStats?.isDirectory()) {
  process.exit(0);
}

await copyJsFiles(srcRoot);
