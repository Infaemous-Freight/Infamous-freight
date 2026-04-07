# AI Repo Workers

This repository includes a narrow-worker AI automation scaffold designed to support normal GitHub flow without granting autonomous merge rights.

## Included workers

1. **Issue Triage Worker**
2. **PR Reviewer**
3. **Test Gap Worker**
4. **Docs Sync Worker**
5. **Release Worker**

## Design rules

- advisory-first: comments, summaries, and artifacts before write actions
- no direct writes to protected branches
- human approval remains in the loop
- optional write actions stay disabled until the workflows earn trust

## Files added

```text
/workers
  /issue-triage
  /pr-review
  /test-gap
  /docs-sync
  /release
/shared
  config.py
  github_client.py
  llm.py
  models.py
  policy.py
  repo_tools.py
  utils.py
/.github/workflows
  ai-issue-triage.yml
  ai-pr-review.yml
  ai-docs-sync.yml
  ai-release-worker.yml
/tests/ai_workers
  conftest.py
  test_repo_tools.py
requirements-ai-workers.txt
```

## Required repository secret

- `OPENAI_API_KEY`

## Optional repository variables

- `OPENAI_MODEL` default `gpt-4o-mini`
- `ENABLE_ISSUE_LABELS` default `false`
- `ENABLE_DRAFT_RELEASE` default `false`
- `DEFAULT_CODEOWNERS_TEAM` optional fallback owner
- `WORKER_MAX_PR_FILES` default `60`
- `WORKER_MAX_PATCH_CHARS` default `6000`

## Rollout order

1. Issue Triage
2. PR Reviewer
3. Test Gap
4. Docs Sync
5. Release Worker

Keep label writes and draft release creation disabled until the comment-only outputs prove useful.

## Notes for this monorepo

- The existing release automation remains the source of truth for shipping.
- `ai-release-worker.yml` is advisory by default and does not replace `.github/workflows/release.yml`.
- The worker code is intentionally kept outside the pnpm workspaces to avoid coupling it to application runtime paths.

## Local validation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-ai-workers.txt
pytest -q tests/ai_workers
```
