import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('verify-required-clis.sh', () => {
  const sourceScript = path.resolve(__dirname, '..', '..', '..', 'scripts', 'verify-required-clis.sh');

  it('fails when required CLIs are missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-clis-missing-'));
    const scriptDir = path.join(tmp, 'scripts');
    fs.mkdirSync(scriptDir, { recursive: true });

    const scriptPath = path.join(scriptDir, 'verify-required-clis.sh');
    fs.copyFileSync(sourceScript, scriptPath);
    fs.chmodSync(scriptPath, 0o755);

    const result = spawnSync('bash', [scriptPath], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, PATH: '/usr/bin:/bin' },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('flyctl missing');
    expect(result.stderr).toContain('supabase missing');
    expect(result.stderr).toContain('stripe missing');
  });

  it('passes when required CLIs exist in .tools/bin', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-clis-present-'));
    const toolsDir = path.join(tmp, '.tools', 'bin');
    const scriptDir = path.join(tmp, 'scripts');
    fs.mkdirSync(toolsDir, { recursive: true });
    fs.mkdirSync(scriptDir, { recursive: true });

    for (const tool of ['flyctl', 'supabase', 'stripe']) {
      const toolPath = path.join(toolsDir, tool);
      fs.writeFileSync(toolPath, '#!/usr/bin/env bash\nexit 0\n');
      fs.chmodSync(toolPath, 0o755);
    }

    const scriptPath = path.join(scriptDir, 'verify-required-clis.sh');
    fs.copyFileSync(sourceScript, scriptPath);
    fs.chmodSync(scriptPath, 0o755);

    const result = spawnSync('bash', [scriptPath], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, PATH: '/usr/bin:/bin' },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('All required Infamous Freight tools are installed.');
  });
});
