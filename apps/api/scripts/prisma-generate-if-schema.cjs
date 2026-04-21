const { existsSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');

if (!existsSync(schemaPath)) {
  console.log('Skipping Prisma generate: prisma/schema.prisma not found in apps/api.');
  process.exit(0);
}

const result = spawnSync('npx', ['prisma', 'generate'], { stdio: 'inherit', shell: true });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
