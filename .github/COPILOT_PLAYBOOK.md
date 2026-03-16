# Infæmous Freight — Copilot Playbook

This playbook defines how GitHub Copilot (and Copilot Coding Agent) should be used in the Infæmous Freight monorepo. It exists to ensure that all AI-assisted work is scoped, reviewable, and safe.

---

## 1. When to Use Copilot

| Use Case | Appropriate? |
|---|---|
| Implementing a well-defined feature from a scoped issue | ✅ Yes |
| Writing unit or integration tests for existing code | ✅ Yes |
| Applying a dependency update (Dependabot PR) | ✅ Yes |
| Fixing a CI workflow failure | ✅ Yes |
| Syncing documentation with recent code changes | ✅ Yes |
| Large architectural refactors | ⚠️ Human-led only |
| Security-sensitive changes (auth, RBAC, RLS) | ⚠️ Human review required |
| Infrastructure / Terraform / Kubernetes changes | ⚠️ Human-led only |
| Secrets management | ❌ Never |

---

## 2. Issue Tasking Guidelines

Before assigning an issue to Copilot:

- **Scope the issue tightly.** One issue = one concern.
- **Specify affected files or workspaces** where possible.
- **Describe the expected outcome**, not just the problem.
- Use the appropriate issue template:
  - `01_dependency_refresh.yml` — for dependency updates
  - `02_docs_sync.yml` — for documentation drift
  - `03_ci_fix.yml` — for broken CI workflows
  - `copilot_task.yml` — for general implementation tasks

---

## 3. PR Review Requirements for Copilot-Generated Code

Every PR produced by Copilot **must** be reviewed by a human before merging.

### Reviewer Checklist

- [ ] The PR is scoped to the issue it addresses — no unrelated changes.
- [ ] All sections of the PR template are filled in.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` passed.
- [ ] No secrets, credentials, or tokens were added.
- [ ] No raw SQL queries were introduced (Prisma only).
- [ ] Tenant isolation is preserved in any database queries.
- [ ] Auth and RBAC logic was not modified unless the issue required it.
- [ ] New endpoints include input validation and unit tests.
- [ ] Follow-up issues were opened for out-of-scope concerns.

---

## 4. Workspace Boundaries

Copilot must respect these workspace rules:

| Workspace | Notes |
|---|---|
| `apps/api` | Express + Prisma. ESM. No raw SQL. Follow middleware stack. |
| `apps/web` | Next.js 14. SSR. No secrets on the client. |
| `apps/mobile` | React Native + Expo. No web-only APIs. |
| `packages/shared` | Domain types, Zod schemas, constants only. Rebuild after changes. |
| `.github/` | Workflows, templates, and config. Do not alter as a side-effect. |
| `k8s/`, `terraform/`, `deploy/` | Infrastructure — human-led only. |

---

## 5. Validation Commands

Always run the following before marking a PR ready for review:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If `packages/shared` was changed:

```bash
pnpm --filter @infamous/shared build
```

---

## 6. Security Rules (Non-Negotiable)

- **Never** commit secrets, API keys, or tokens.
- **Never** bypass authentication or authorization middleware.
- **Never** add queries that are not tenant-scoped.
- **Never** use raw SQL — use Prisma exclusively.
- **Never** expose sensitive data in logs or API responses.

---

## 7. Escalation

If Copilot cannot complete a task within the defined scope without making architectural decisions or touching security-sensitive code, it should:

1. Open a follow-up issue describing the blocker.
2. Leave the PR in draft with a comment explaining what human input is needed.
3. Not attempt to work around the limitation autonomously.
