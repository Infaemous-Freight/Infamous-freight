# Linear Tooling Integration Runbook

This runbook completes baseline setup for **INF-3: Connect your tools** so the team can use Linear as the operating layer for daily repository work.

## Goal

Enable a reliable workflow where:

1. Pull requests and commits are linked to Linear issues.
2. Team members can create/reference issues from connected tools.
3. Core integrations are configured for day-to-day operations.

## 1) Connect Primary Git Provider (GitHub ↔ Linear)

1. In Linear, open **Settings → Integrations → GitHub**.
2. Install the Linear GitHub app for the `Infamous-freight` repository.
3. Grant repository access to the engineering organization.
4. In Linear project settings, ensure the project uses issue identifiers such as `INF-123`.

### Validation

- Open any PR and include `INF-<number>` in title or body.
- Confirm the linked issue appears in the PR timeline inside Linear.
- Confirm commits containing `INF-<number>` appear in the Linear issue activity feed.

## 2) Enable Slack (Optional but Recommended)

If Slack will be used for issue capture or thread sync:

1. In Linear, open **Settings → Integrations → Slack**.
2. Authorize the workspace and choose allowed channels.
3. Enable channel actions for creating or linking Linear issues.
4. In Slack, pin the issue-creation shortcut in the engineering channel.

### Validation

- Create a Linear issue from Slack using the shortcut.
- Link an existing Linear issue in a Slack thread.
- Confirm bi-directional references are visible from both Slack and Linear.

## 3) Enable Agent/Automation Integrations

1. Ensure the account used for Codex agent operations is connected in ChatGPT connector settings.
2. Re-tag `@Codex` on the target Linear issue after connector authorization.
3. Confirm automation agents can read issue context and post status updates.

### Validation

- Agent can read issue title/description/comments from Linear context.
- Agent posts actionable output back to the issue thread.

## 4) Repository Policy for Linkability

To keep PRs and commits traceable, this repository now enforces:

- PR title or body must contain a Linear issue key (`INF-123`).
- At least one commit in the PR must contain a Linear issue key (`INF-123`).

See `.github/workflows/linear-linking.yml`, `.github/scripts/validate-linear-linking.mjs`, and `.github/pull_request_template.md`.

## Definition of Done Checklist (INF-3)

- [ ] GitHub connected to Linear and verified with a test PR.
- [ ] Slack connected (if used) and verified with issue create/link actions.
- [ ] Agent connector linked and verified with a successful `@Codex` run.
- [ ] PR/commit linking guardrails active in CI.
- [ ] Team has this runbook for repeatable setup and onboarding.
