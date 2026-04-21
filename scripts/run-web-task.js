#!/usr/bin/env node
const { execSync } = require('child_process');

const task = process.argv[2];
const extraArgs = process.argv.slice(3);

if (!task) {
  console.error('Usage: node scripts/run-web-task.js <task> [-- <args...>]');
  process.exit(1);
}

const isPnpm = (process.env.npm_execpath || '').includes('pnpm');
const cmd = isPnpm
  ? `pnpm --dir apps/web run ${task}`
  : `npm --prefix apps/web run ${task}`;

const fullCmd = extraArgs.length > 0 ? `${cmd} -- ${extraArgs.join(' ')}` : cmd;
execSync(fullCmd, { stdio: 'inherit' });
