import { mkdtempSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

describe('sync-authorized-key.sh', () => {
  const scriptPath = path.resolve(__dirname, '../../../scripts/ops/sync-authorized-key.sh');
  const sshPublicKey =
    'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCPyyxRDWUwSHYqLXqLZ+lKPs/qvzkTEFJxrfir0mTdvitjLS7jsibyCil4iLyf2JYpsIAx1b39s/v4ukx5Vo6TyHsBNjt0O5uMtI5UVzZjhToBH89XKv9LI7yF9NWkK63bOOJ7gvTiAQVdWy9Y6icTd+FaJq9d6tNcPJKumQ9w+rJUD1/bnXlGNyIBU3NUW6dQr6ptqXIHee3La3UIhq45yJU6XosfVSAGSZGsIUO/6oLvc2CzXolZNC9uRVR+qeor16np/IlMRQaO9Z2zUmgB4Hvyy5TIAZlCCM5Oy4JSg18dd0sIuXp13t2LRbkwqqiVIt7s45m2RHjEk4bHvu3y5oslgo0KIQ4B+cMZMHBw7bLgfYPJqDyyID0HSc9ODrr2AOY4EExmpdlAh+LT1CqNm8z/WVvyoulGP/SbRA0SydtAB16V8ghbDbKjvwF1WDE9kwI2wihDccqx4G7iE2flZ1o43yHvukY5z8HCKPKO+zDupvzWwE70fTj/WXQHAupftoGIYhyKoycNtOfAJICrRheu0fWwPzoV8v15pHOkXaPNeF7h2m7BS3aGp+e/PJpXiMr1C3cZhgVTdUC7+e9k7AMQQMnz97HXuNWU65uTdNguLdKo076WN9AuYkZebL0vq/ILwu6VgldpWYtR6DJ1na9DmmG6xiZ2OhoPWBlduQ==';

  it('adds key when fingerprint matches', () => {
    const homeDir = mkdtempSync(path.join(tmpdir(), 'if-ssh-ok-'));
    const result = spawnSync(scriptPath, [], {
      env: {
        ...process.env,
        HOME: homeDir,
        KEY_ID: 'ops-key-2026-04-30-01',
        SSH_PUBLIC_KEY: sshPublicKey,
        EXPECTED_SHA256: 'ENq3sUhcnOq79ETLvC9RN2Ltb/+52cXTGFaFWPicxsA',
      },
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    const authorizedKeys = readFileSync(path.join(homeDir, '.ssh', 'authorized_keys'), 'utf8');
    expect(authorizedKeys).toContain(sshPublicKey);
  });



  it('is idempotent and does not duplicate keys', () => {
    const homeDir = mkdtempSync(path.join(tmpdir(), 'if-ssh-idem-'));
    const env = {
      ...process.env,
      HOME: homeDir,
      KEY_ID: 'ops-key-2026-04-30-01',
      SSH_PUBLIC_KEY: sshPublicKey,
      EXPECTED_SHA256: 'ENq3sUhcnOq79ETLvC9RN2Ltb/+52cXTGFaFWPicxsA',
    };

    const first = spawnSync(scriptPath, [], { env, encoding: 'utf8' });
    const second = spawnSync(scriptPath, [], { env, encoding: 'utf8' });

    expect(first.status).toBe(0);
    expect(second.status).toBe(0);

    const authorizedKeys = readFileSync(path.join(homeDir, '.ssh', 'authorized_keys'), 'utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0);

    expect(authorizedKeys).toHaveLength(1);
    expect(authorizedKeys[0]).toBe(sshPublicKey);
  });

  it('loads values from ENV_FILE', () => {
    const homeDir = mkdtempSync(path.join(tmpdir(), 'if-ssh-envfile-'));
    const envFile = path.join(homeDir, 'ssh-key.env');
    require('fs').writeFileSync(
      envFile,
      [
        'KEY_ID=ops-key-2026-04-30-01',
        `SSH_PUBLIC_KEY="${sshPublicKey}"`,
        'EXPECTED_SHA256=ENq3sUhcnOq79ETLvC9RN2Ltb/+52cXTGFaFWPicxsA',
      ].join('\n'),
      'utf8'
    );

    const result = spawnSync(scriptPath, [], {
      env: {
        ...process.env,
        HOME: homeDir,
        ENV_FILE: envFile,
      },
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    const authorizedKeys = readFileSync(path.join(homeDir, '.ssh', 'authorized_keys'), 'utf8');
    expect(authorizedKeys).toContain(sshPublicKey);
  });

  it('fails when fingerprint does not match', () => {
    const homeDir = mkdtempSync(path.join(tmpdir(), 'if-ssh-bad-'));
    const result = spawnSync(scriptPath, [], {
      env: {
        ...process.env,
        HOME: homeDir,
        KEY_ID: 'ops-key-2026-04-30-01',
        SSH_PUBLIC_KEY: sshPublicKey,
        EXPECTED_SHA256: 'INVALID_FINGERPRINT',
      },
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Fingerprint mismatch');
  });
});
