#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

const envPairs = [
  ['.env.example', '.env'],
  [path.join('apps', 'api', '.env.example'), path.join('apps', 'api', '.env')],
  [path.join('apps', 'web', '.env.example'), path.join('apps', 'web', '.env')],
];

for (const [sourceRelative, targetRelative] of envPairs) {
  const source = path.join(repoRoot, sourceRelative);
  const target = path.join(repoRoot, targetRelative);

  if (!fs.existsSync(source)) {
    console.warn(`Skipping ${targetRelative}: missing ${sourceRelative}`);
    continue;
  }

  if (fs.existsSync(target)) {
    console.log(`Keeping existing ${targetRelative}`);
    continue;
  }

  fs.copyFileSync(source, target);
  console.log(`Created ${targetRelative} from ${sourceRelative}`);
}

console.log('Installing dependencies with npm install...');
const install = spawnSync('npm', ['install'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (install.status !== 0) {
  process.exit(install.status ?? 1);
}
