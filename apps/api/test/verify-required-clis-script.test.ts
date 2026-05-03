import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('verify-required-clis.sh', () => {
  const sourceScript = path.resolve(__dirname, '..', '..', '..', 'scripts', 'verify-required-clis.sh');

  function createMinimalPath(tmp: string): string {
    const binDir = path.join(tmp, 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    fs.symlinkSync('/usr/bin/dirname', path.join(binDir, 'dirname'));
    return binDir;
  }

  it('fails when required CLIs are missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-clis-missing-'));
    const scriptDir = path.join(tmp, 'scripts');
    fs.mkdirSync(scriptDir, { recursive: true });

    const scriptPath = path.join(scriptDir, 'verify-required-clis.sh');
    fs.copyFileSync(sourceScript, scriptPath);
    fs.chmodSync(scriptPath, 0o755);

    const result = spawnSync('/usr/bin/bash', [scriptPath], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, PATH: createMinimalPath(tmp) },
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('flyctl missing');
    expect(result.stderr).toContain('supabase missing');
    expect(result.stderr).toContain('stripe missing');
    expect(result.stderr).toContain('gh missing');
    expect(result.stderr).toContain('netlify missing');
    expect(result.stderr).toContain('docker missing');
  });

  it('passes when required CLIs exist in .tools/bin', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-clis-present-'));
    const toolsDir = path.join(tmp, '.tools', 'bin');
    const scriptDir = path.join(tmp, 'scripts');
    fs.mkdirSync(toolsDir, { recursive: true });
    fs.mkdirSync(scriptDir, { recursive: true });

    for (const tool of ['flyctl', 'supabase', 'stripe', 'gh', 'netlify', 'docker']) {
      const toolPath = path.join(toolsDir, tool);
      fs.writeFileSync(toolPath, '#!/usr/bin/env bash\nexit 0\n');
      fs.chmodSync(toolPath, 0o755);
    }

    const scriptPath = path.join(scriptDir, 'verify-required-clis.sh');
    fs.copyFileSync(sourceScript, scriptPath);
    fs.chmodSync(scriptPath, 0o755);

    const result = spawnSync('/usr/bin/bash', [scriptPath], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, PATH: createMinimalPath(tmp) },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('All required Infamous Freight tools are installed.');
  });

  it('warns when jq is missing but still passes', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-clis-no-jq-'));
    const toolsDir = path.join(tmp, '.tools', 'bin');
    const scriptDir = path.join(tmp, 'scripts');
    fs.mkdirSync(toolsDir, { recursive: true });
    fs.mkdirSync(scriptDir, { recursive: true });

    for (const tool of ['flyctl', 'supabase', 'stripe', 'gh', 'netlify', 'docker']) {
      const toolPath = path.join(toolsDir, tool);
      fs.writeFileSync(toolPath, '#!/usr/bin/env bash\nexit 0\n');
      fs.chmodSync(toolPath, 0o755);
    }

    const scriptPath = path.join(scriptDir, 'verify-required-clis.sh');
    fs.copyFileSync(sourceScript, scriptPath);
    fs.chmodSync(scriptPath, 0o755);

    const result = spawnSync('/usr/bin/bash', [scriptPath], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, PATH: '/usr/bin:/bin' },
    });

    expect(result.status).toBe(0);
    expect(
      result.stderr.includes('jq missing (recommended') ||
      result.stdout.includes('jq found (recommended)')
    ).toBe(true);
    expect(result.stdout).toContain('All required Infamous Freight tools are installed.');
  });
});
