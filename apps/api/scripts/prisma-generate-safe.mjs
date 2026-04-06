import { spawnSync } from 'node:child_process';

const args = ['generate', '--no-engine', '--schema=prisma/schema.prisma'];
const env = {
  ...process.env,
  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING:
    process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING ?? '1',
};

const result = spawnSync('prisma', args, {
  stdio: 'pipe',
  encoding: 'utf8',
  env,
  shell: true,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const isEngineFetch403 =
  output.includes('Failed to fetch the engine file') && output.includes('403 Forbidden');

if (isEngineFetch403) {
  console.warn(
    '[api prisma:generate] Prisma engine download unavailable (403). Skipping generate for offline compatibility.',
  );
  process.exit(0);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.error) {
  throw result.error;
}

process.exit(1);
