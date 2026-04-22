#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const apiDir = path.join(repoRoot, 'apps', 'api');
const apiPackageJson = path.join(apiDir, 'package.json');

if (!fs.existsSync(apiDir) || !fs.statSync(apiDir).isDirectory()) {
  console.error('Missing apps/api workspace directory');
  process.exit(1);
}

if (!fs.existsSync(apiPackageJson)) {
  console.error('Missing apps/api/package.json');
  process.exit(1);
}
