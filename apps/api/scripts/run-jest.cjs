#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

function buildJestArgs(rawArgs) {
  const filteredArgs = rawArgs.filter((arg) => arg !== '--');

  // Default to in-band execution for CI/local stability, while still allowing explicit override flags.
  const hasExplicitRunInBandSetting = filteredArgs.some((arg) =>
    arg === '-i' || /^--runInBand(?:=(?:true|false))?$/i.test(arg)
  );

  return hasExplicitRunInBandSetting ? filteredArgs : ['--runInBand', ...filteredArgs];
}

function run() {
  const rawArgs = process.argv.slice(2);
  const jestArgs = buildJestArgs(rawArgs);

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
}

if (require.main === module) {
  run();
}

module.exports = { buildJestArgs };
