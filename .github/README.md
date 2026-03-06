# GitHub Control Room

This directory contains GitHub-facing repository governance and automation.

## Canonical contents
- `workflows/` — CI, security, and automation
- `ISSUE_TEMPLATE/` — structured issue intake
- `CODEOWNERS` — ownership and review routing
- `dependabot.yml` — dependency update automation
- `codeql-config.yml` — CodeQL scan scope
- `pull_request_template.md` — PR quality checklist
- `branch-protection-rules.json` — tracked branch protection intent
- `CONTRIBUTING.md` — contributor workflow guidance

## Keep `.github/` focused
Only files that GitHub reads directly, or docs tightly related to GitHub repo operations, should live here.

Move general engineering status docs, audits, rollout notes, and project writeups to:
- `docs/engineering/`
- `docs/security/`
- `docs/operations/`
