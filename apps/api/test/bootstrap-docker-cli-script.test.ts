import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

describe('bootstrap-docker-cli.sh', () => {
  const sourceScript = path.resolve(__dirname, '..', '..', '..', 'scripts', 'bootstrap-docker-cli.sh');

  it('exits successfully when .tools/bin/docker already exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bootstrap-docker-cli-'));
    const scriptsDir = path.join(tmp, 'scripts');
    const toolsDir = path.join(tmp, '.tools', 'bin');
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(toolsDir, { recursive: true });

    const scriptPath = path.join(scriptsDir, 'bootstrap-docker-cli.sh');
    fs.copyFileSync(sourceScript, scriptPath);
    fs.chmodSync(scriptPath, 0o755);

    const dockerPath = path.join(toolsDir, 'docker');
    fs.writeFileSync(dockerPath, '#!/usr/bin/env bash\necho "Docker version test"\n');
    fs.chmodSync(dockerPath, 0o755);

    const result = spawnSync('bash', [scriptPath], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, PATH: '/usr/bin:/bin' },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Docker version test');
  });
});
