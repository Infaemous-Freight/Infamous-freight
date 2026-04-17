#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const forwardedArgs = process.argv.slice(2);
const sanitizedArgs = [];
let forceSingleWorker = false;

for (const arg of forwardedArgs) {
  if (arg === '--runInBand') {
    forceSingleWorker = true;
    continue;
  }

  sanitizedArgs.push(arg);
}

const vitestArgs = [
  'run',
  'src/**/*.test.ts',
];

if (forceSingleWorker && !sanitizedArgs.some((arg) => arg.startsWith('--maxWorkers'))) {
  vitestArgs.push('--maxWorkers=1');
}

vitestArgs.push(...sanitizedArgs);

const result = spawnSync('vitest', vitestArgs, { stdio: 'inherit', shell: true });

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
