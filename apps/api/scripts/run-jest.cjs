#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const rawArgs = process.argv.slice(2);
const filteredArgs = rawArgs.filter((arg) => arg !== '--');

const hasRunInBand = filteredArgs.some(
  (arg) => arg === '-i' || arg === '--runInBand' || arg.startsWith('--runInBand=')
);
const jestArgs = hasRunInBand ? filteredArgs : ['--runInBand', ...filteredArgs];

const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(process.execPath, [jestBin, ...jestArgs], {
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.error) {
  throw result.error;
}

if (result.signal) {
  process.kill(process.pid, result.signal);
  return;
}
process.exit(1);
