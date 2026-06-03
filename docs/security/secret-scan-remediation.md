# Secret Scan Remediation Runbook

Use this runbook when GitGuardian, GitHub secret scanning, gitleaks, or another scanner reports a secret in a branch, pull request, or repository history.

## Immediate rule

Do not merge the pull request until the finding is remediated and the scan passes.

Removing a secret from the final file tree is not enough if the secret exists in one of the commits in the pull request. Secret scanners review history and diffs, so exposed credentials must be treated as compromised.

## 1. Identify the finding without exposing it

Open the scanner result in the GitHub check details or vendor dashboard and record only non-secret metadata:

- scanner name
- detector type, for example `Stripe Secret Key`, `GitHub Token`, `Postgres URI`, or `Generic High Entropy Secret`
- file path
- commit SHA
- line number if provided
- whether the secret is active, revoked, or unknown

Never paste the raw secret into GitHub comments, issues, PR descriptions, logs, screenshots, or chat.

## 2. Revoke and rotate first

Before rewriting history, revoke or rotate the credential in the owning provider:

- GitHub tokens: revoke token in GitHub settings.
- Stripe keys or webhook secrets: rotate in Stripe dashboard and update deployment secrets.
- Supabase keys/JWT secrets/database URLs: rotate in Supabase or the backing database provider and update deployment secrets.
- Fly tokens: revoke in Fly.io and create a replacement token if needed.
- Netlify tokens: revoke in Netlify and replace GitHub Actions secrets if needed.
- OpenAI/API tokens: revoke in the provider dashboard and update managed secret stores.

Update only managed secret stores such as GitHub Actions secrets, Netlify environment variables, Fly secrets, Supabase secrets, or local `.env` files. Do not commit the new value.

## 3. Clean the PR history

For a forked or long-lived branch, the safest path is usually to create a fresh clean branch from the current base and replay only safe changes.

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b security/clean-pr-history
```

Then copy or cherry-pick only the safe commits/files. If the PR has many commits or the secret is in old history, prefer manually applying the final safe patch instead of cherry-picking the contaminated commits.

If history rewrite is unavoidable, use a dedicated history-cleaning tool from a local operator workstation:

```bash
# Example only. Replace the path/pattern with the exact scanner finding.
git filter-repo --path path/to/contaminated-file --invert-paths
```

or use BFG Repo-Cleaner when appropriate. After rewriting history, force-push only the affected branch, not `main`:

```bash
git push --force-with-lease origin security/clean-pr-history
```

## 4. Re-scan locally before pushing

Run at least one local scan before updating the pull request:

```bash
pnpm run env:check:frontend
pnpm run env:check:supabase-client
```

If available, also run:

```bash
gitleaks detect --source . --redact --no-git
```

For full history checks on the branch, use:

```bash
gitleaks detect --source . --redact
```

## 5. Update the pull request safely

After the clean branch is pushed:

- confirm the secret scan passes,
- confirm CI passes,
- add a short PR note that the credential was rotated and history was cleaned,
- do not include the secret value or screenshots showing it.

Safe PR wording:

```text
Secret scan remediation completed. The exposed credential was revoked/rotated in the owning provider, contaminated branch history was removed, and the branch was re-scanned with redaction enabled. No secret value is included in this PR comment.
```

## 6. If the finding is a false positive

Only mark a finding as false positive when the scanner details clearly show that the value is not a credential and cannot grant access.

Accepted false-positive evidence may include:

- documented test fixture with fake value,
- placeholder such as `<set-in-dashboard>`,
- obviously invalid local example such as `postgresql://user:password@localhost:5432/app`,
- revoked token with no active access.

Prefer adding scanner allowlist comments/config only for stable fake fixtures. Do not allowlist unknown high-entropy strings without review.

## 7. Post-remediation checklist

- [ ] Credential revoked or rotated.
- [ ] Managed deployment secret updated if needed.
- [ ] Secret removed from current files.
- [ ] Secret removed from PR history or replaced with a clean branch.
- [ ] Local redacted scan passed.
- [ ] GitGuardian/GitHub check passed.
- [ ] PR comment avoids raw secret values.
- [ ] Incident noted in launch/security evidence if production credentials were involved.
