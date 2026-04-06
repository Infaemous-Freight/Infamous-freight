# SSH Hardening Runbook

This runbook provides a repeatable OpenSSH hardening path for Linux hosts used by Infamous Freight operations.

## Included assets

- Host-local hardening script: `scripts/ops/harden-ssh.sh`
- Fly remote execution wrapper: `scripts/ops/harden-ssh-over-fly.sh`
- Ansible playbook for fleet rollout: `infra/deploy/ansible/ssh-hardening.yml`

## Baseline policy enforced

- Public key auth enabled
- Password + keyboard-interactive auth disabled
- Root login disabled
- SSH forwarding/tunneling disabled
- Verbose auth logging enabled
- `AllowUsers` enforced from explicit allow-list

## Safety features

- **Dry-run by default** (`--apply` required to enforce)
- Backs up `/etc/ssh/sshd_config` to `/etc/ssh/backup`
- Validates config with `sshd -t` before service reload
- Lockout guard (requires current user in `ALLOW_USERS` unless `--force`)
- Supports Debian/Ubuntu (`ssh`) and RHEL-family (`sshd`) service naming

## 1) Single-host execution (recommended first)

```bash
# Dry-run first
ALLOW_USERS="deployer ops" ./scripts/ops/harden-ssh.sh

# Apply changes
ALLOW_USERS="deployer ops" ./scripts/ops/harden-ssh.sh --apply
```

## 2) Fleet rollout with Ansible

```bash
ansible-playbook -i inventory.ini infra/deploy/ansible/ssh-hardening.yml \
  -e "ssh_allow_users=['deployer','ops']"
```

Notes:
- Set host groups/inventory according to your environment.
- Ensure the SSH user Ansible connects as is included in `ssh_allow_users` before the play reloads SSH, or stage the rollout only where you have an out-of-band access path (for example, console or bastion recovery) to avoid locking out automation.
- Roll out in batches and verify access before expanding scope.

## 3) Fly-host execution

Use only for Fly-hosted infrastructure machines where OpenSSH is managed by you.

```bash
# Dry-run on remote machine
./scripts/ops/harden-ssh-over-fly.sh \
  --app infra-bastion --machine <machine-id> \
  --allow-users "deployer ops"

# Apply on remote machine
./scripts/ops/harden-ssh-over-fly.sh \
  --app infra-bastion --machine <machine-id> \
  --allow-users "deployer ops" --apply
```

## Rollback

If validation fails, the host script attempts automatic rollback by removing drop-ins and restoring the backed-up `sshd_config`.

Manual rollback example:

```bash
sudo rm -f /etc/ssh/sshd_config.d/99-hardening.conf /etc/ssh/sshd_config.d/99-allowusers.conf
sudo cp /etc/ssh/backup/sshd_config.<timestamp>.bak /etc/ssh/sshd_config
sudo sshd -t && sudo systemctl reload ssh || sudo systemctl reload sshd
```

## Operational guidance

- Keep your current SSH session open while testing a new login path.
- Validate bastion access and automation accounts before broad rollout.
- Treat `AllowUsers` as an access-control boundary and review regularly.
