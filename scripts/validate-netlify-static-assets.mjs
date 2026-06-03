import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const netlifyTomlPath = join(repoRoot, 'netlify.toml');
const webDistPath = join(repoRoot, 'apps', 'web', 'dist');
const indexPath = join(webDistPath, 'index.html');
const assetsPath = join(webDistPath, 'assets');

const fail = (message, details = []) => {
  console.error(`\nNetlify static asset validation failed: ${message}`);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exitCode = 1;
};

const readText = (path) => readFileSync(path, 'utf8');

const walk = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

if (!existsSync(netlifyTomlPath)) {
  fail('Missing netlify.toml');
} else {
  const netlifyToml = readText(netlifyTomlPath);
  const forbiddenAssetRedirects = [
    /from\s*=\s*["']\/assets\/\*\.js["']/,
    /from\s*=\s*["']\/assets\/\*\.mjs["']/,
    /from\s*=\s*["']\/assets\/\*\.css["']/,
  ];

  const matchedForbiddenRedirect = forbiddenAssetRedirects.find((pattern) => pattern.test(netlifyToml));
  if (matchedForbiddenRedirect) {
    fail('netlify.toml contains a forced static asset redirect that can block Vite bundles', [
      `Matched pattern: ${matchedForbiddenRedirect}`,
      'Do not redirect /assets/*.js, /assets/*.mjs, or /assets/*.css to /404.',
    ]);
  }

  if (!/publish\s*=\s*["']apps\/web\/dist["']/.test(netlifyToml)) {
    fail('Netlify publish directory is not apps/web/dist');
  }

  if (!/command\s*=\s*["']pnpm run build:web["']/.test(netlifyToml)) {
    fail('Netlify build command is not pnpm run build:web');
  }
}

if (!existsSync(webDistPath)) {
  fail('Missing apps/web/dist. Run pnpm run build:web before validating static assets.');
} else {
  if (!existsSync(indexPath)) {
    fail('Missing built apps/web/dist/index.html');
  }

  if (!existsSync(assetsPath)) {
    fail('Missing built apps/web/dist/assets directory');
  }

  if (existsSync(indexPath) && existsSync(assetsPath)) {
    const indexHtml = readText(indexPath);
    const builtFiles = walk(assetsPath).map((file) => file.replace(webDistPath, '').replaceAll('\\', '/'));
    const jsAssets = builtFiles.filter((file) => /\.(js|mjs)$/.test(file));
    const cssAssets = builtFiles.filter((file) => file.endsWith('.css'));
    const referencedAssets = [...indexHtml.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/g)].map((match) => match[1]);

    if (jsAssets.length === 0) {
      fail('Built assets directory contains no JavaScript bundle');
    }

    if (referencedAssets.length === 0) {
      fail('Built index.html does not reference any /assets/ files', [
        'This can leave production serving only the static shell.',
      ]);
    }

    const missingReferencedAssets = referencedAssets
      .map((asset) => asset.startsWith('/') ? asset : `/${asset}`)
      .filter((asset) => !existsSync(join(webDistPath, asset)));

    if (missingReferencedAssets.length > 0) {
      fail('Built index.html references missing static assets', missingReferencedAssets.slice(0, 10));
    }

    console.log('Netlify static asset validation passed.');
    console.log(`JavaScript bundles: ${jsAssets.length}`);
    console.log(`CSS bundles: ${cssAssets.length}`);
    console.log(`Index asset references: ${referencedAssets.length}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
