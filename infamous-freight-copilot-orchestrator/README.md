# Infæmous Freight Copilot Orchestrator (GitHub App + Webhook)

This service listens to GitHub webhooks for `MrMiless44/Infamous-freight` and:
- Assigns issues to Copilot coding agent when:
  - label `copilot-task` is added, OR
  - a comment starts with `/copilot run`
- Posts audit comments to the issue
- Exposes admin/debug endpoints (Bearer token protected)

## Requirements
- A GitHub App installed on the target repo
- Webhook secret configured on the App and in env `GITHUB_WEBHOOK_SECRET`
- App permissions:
  - Issues: Read & Write
  - Pull requests: Read & Write (optional but useful)
  - Metadata: Read
- Webhook events:
  - issues
  - issue_comment
  - (optional) pull_request / check_suite

## Environment variables
See `.env.example`.

## Local run
```bash
npm install
cp .env.example .env
# fill values
node src/server.js
```

## Admin endpoints
All require:
`Authorization: Bearer $ADMIN_BEARER_TOKEN`
- `GET /admin/health`
- `GET /admin/stats`
- `GET /admin/events?limit=50`
- `GET /admin/last-error`

## Webhook endpoint
- `POST /github/webhook`
- Requires valid `X-Hub-Signature-256` for the raw body

## Triggers
- Add label: `copilot-task` to an issue
- Or comment: `/copilot run`

## Notes
- Copilot assignment uses GitHub GraphQL with feature header:
  `GraphQL-Features: issues_copilot_assignment_api_support`
- Copilot actor is discovered via `suggestedActors` and expected login:
  `copilot-swe-agent`
- The orchestrator is conservative: minimal scope, auditable comments, idempotency.

## Fly.io deploy (example)
```bash
fly auth login
fly launch --no-deploy

fly secrets set \
  GITHUB_WEBHOOK_SECRET="..." \
  GITHUB_APP_ID="..." \
  GITHUB_PRIVATE_KEY_PEM="$(cat private-key.pem)" \
  GITHUB_COPILOT_USER_TOKEN="ghp_..." \
  ADMIN_BEARER_TOKEN="..."

fly deploy
```
