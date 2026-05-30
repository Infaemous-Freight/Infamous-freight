import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('Netlify Function auth signing key', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');

  it('accepts SUPABASE_JWT_SECRET without requiring JWT_SECRET', () => {
    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'tsx',
        '-e',
        `import { createToken, verifyToken } from './netlify/functions/lib/auth.ts';
void (async () => {
  const token = await createToken({ sub: 'user-123', email: 'dispatcher@example.com', name: 'Test Dispatcher', role: 'dispatcher' });
  const payload = await verifyToken(token);
  if (payload?.sub !== 'user-123' || payload?.role !== 'dispatcher') process.exit(1);
})();`,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          PATH: process.env.PATH,
          SUPABASE_JWT_SECRET: 'test-supabase-jwt-secret',
        },
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });
});
