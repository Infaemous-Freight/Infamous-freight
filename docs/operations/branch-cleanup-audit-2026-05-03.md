# Branch hygiene audit — 2026-05-03

- Source issue: [#1798](https://github.com/Infaemous-Freight/Infamous-freight/issues/1798)
- Related launch-control: [#1781](https://github.com/Infaemous-Freight/Infamous-freight/issues/1781)
- Snapshot taken: 2026-05-03 (UTC)
- Default branch: `main`

> **Status — audit only.** No branches were deleted by this PR. Per the issue's
> safety rules, deletion of stale branches requires explicit owner approval
> against the preserve / delete lists below.

## Methodology

1. Enumerated every remote branch via the GitHub Branches API (paginated) and
   reconciled against a local mirror fetched with
   `git fetch --unshallow` followed by
   `git fetch origin '+refs/heads/*:refs/remotes/origin/*'`.
2. Cross-referenced head refs against open pull requests (`state=open`) to
   identify branches attached to active work.
3. Classified each non-`main` branch as **merged** vs **unmerged** by running
   `git merge-base --is-ancestor <branch-sha> origin/main`. A branch counts as
   merged only when its tip commit is reachable from `origin/main` (this is
   conservative — squash-merged branches whose tip never appeared on `main`
   are reported as unmerged and routed to review, not delete).
4. Branches whose names match release / production / deployment roles are
   preserved without inspection.

## Final branch count

| Metric | Count |
|---|---|
| Total branches (including `main`) | 227 |
| Non-`main` branches | 226 |
| Branches attached to open PRs (preserve) | 5 |
| Merged into `main` (ancestor of `origin/main`) | 21 |
| Unmerged (commits not in `main`) | 205 |
| Unknown SHA at snapshot time (review) | 0 |
| **Confirmed safe to delete** | 21 |

## Safety rules (from issue #1798)

- Do **not** delete `main`.
- Do **not** delete branches attached to open PRs.
- Do **not** delete release, production, or deployment branches without owner confirmation.
- Do **not** delete branches with unmerged commits unless explicitly approved.

## Preserve list — open PRs

These branches MUST NOT be deleted. They are the head refs of open pull requests at the snapshot time.

| Branch | PR | Head SHA | Status vs `main` |
|---|---|---|---|
| `billing/payment-method-configuration` | #1780 | `82d725a` | unmerged |
| `copilot/confirm-quote-intake-workflow` | #1794 | `ed35bd6` | unmerged |
| `copilot/fix-health-endpoints-verification` | #1799 | `dfd1f95` | unmerged |
| `copilot/review-and-clean-stale-branches` | #1798 | `1e0f712` | unmerged |
| `flyio-new-files` | #1779 | `aa7cb9e` | unmerged |

## Preserve list — other reserved branches

| Branch | Reason |
|---|---|
| `main` | Default / production branch — never delete. |
| `flyio-new-files` | Deployment-tooling branch (also has open PR #1779). |

## Confirmed safe-to-delete list

All branches below meet **all** of the following:

- Tip commit is an ancestor of `origin/main` (fully merged with no extra commits).
- No open pull request is using the branch as its head ref.
- Branch name does not match a release / production / deployment role.

| Branch | Head SHA |
|---|---|
| `copilot/ai-failure-analysis` | `978dc2c` |
| `copilot/audit-infamous-freight-again` | `01deb29` |
| `copilot/audit-infamous-freight` | `ef8289e` |
| `copilot/fix-route-calculation-error` | `ed7fadc` |
| `copilot/improve-markdown-rendering` | `93b9a3c` |
| `copilot/infamous-freight-recommendations` | `09f929c` |
| `copilot/rebase-branch` | `fd1d142` |
| `copilot/sbom-runtime-build-split-rebased` | `caf5668` |
| `copilot/update-auto-ci-cd-workflow` | `978dc2c` |
| `copilot/update-auto-self-healing-workflow` | `978dc2c` |
| `copilot/update-checks-for-commit-53e1b9d-another-one` | `53e1b9d` |
| `copilot/update-commit-references` | `e3d08d2` |
| `copilot/update-dependabot-automerge-workflow` | `978dc2c` |
| `copilot/update-netlify-mcp-deploy-command` | `58d3543` |
| `github-advanced-security/debug-flow-issues` | `7bd1495` |
| `github-advanced-security/fix-build-issues` | `7bd1495` |
| `github-advanced-security/fix-database-connection-issue` | `7bd1495` |
| `github-advanced-security/fix-issue-in-github-actions` | `64354d4` |
| `github-advanced-security/link-access-job-info` | `1b77f5e` |
| `github-advanced-security/update-dependency-version` | `bbcc1a1` |
| `github-advanced-security/update-freight-calculation-logic` | `1b77f5e` |

### Plain text — `safe-to-delete.txt`

```text
copilot/ai-failure-analysis
copilot/audit-infamous-freight-again
copilot/audit-infamous-freight
copilot/fix-route-calculation-error
copilot/improve-markdown-rendering
copilot/infamous-freight-recommendations
copilot/rebase-branch
copilot/sbom-runtime-build-split-rebased
copilot/update-auto-ci-cd-workflow
copilot/update-auto-self-healing-workflow
copilot/update-checks-for-commit-53e1b9d-another-one
copilot/update-commit-references
copilot/update-dependabot-automerge-workflow
copilot/update-netlify-mcp-deploy-command
github-advanced-security/debug-flow-issues
github-advanced-security/fix-build-issues
github-advanced-security/fix-database-connection-issue
github-advanced-security/fix-issue-in-github-actions
github-advanced-security/link-access-job-info
github-advanced-security/update-dependency-version
github-advanced-security/update-freight-calculation-logic
```

## Review list — DO NOT delete without owner approval

Branches below are **unmerged** (their tip commit is not reachable from `main`).
Per the safety rules they require explicit owner approval before any deletion.
Many are exploratory `codex/*`, `chatgpt/*`, `copilot/*`, `chore/*`, `fix/*`,
or `github-advanced-security/*` branches that may carry work that was never
merged, was squash-merged (tip not in `main`), or was abandoned.

<details>
<summary>Expand review list</summary>

| Branch | Head SHA | Status |
|---|---|---|
| `chatgpt/launch-readiness-pass-20260405` | `8e0aadb` | unmerged |
| `chatgpt/stripe-billing-unify-2026-04-08` | `863bf90` | unmerged |
| `chatgpt/supabase-web-cutover` | `7a2273b` | unmerged |
| `chore/docker-rebuild` | `9df077a` | unmerged |
| `chore/env-provision-upload-20260408` | `19abff2` | unmerged |
| `chore/repo-hardening` | `9802e5f` | unmerged |
| `codex/infamous-add-deployment-scripts-and-documentation-2026-05-01` | `253fbc1` | unmerged |
| `codex/infamous-add-infamous-freight-tools-2026-05-01` | `739d34f` | unmerged |
| `codex/infamous-add-paypal-and-ad-integration-2026-05-01` | `591b75f` | unmerged |
| `codex/infamous-create-txt-record-for-hostname-2026-05-01` | `8f269ef` | unmerged |
| `codex/infamous-define-freight-monetization-strategy-2026-05-01` | `fe01e55` | unmerged |
| `codex/infamous-document-fly.io-deployment-process-2026-05-01` | `08a0354` | unmerged |
| `codex/infamous-document-process-for-obtaining-environment-variables-2026-05-02` | `2927c0b` | unmerged |
| `codex/infamous-fix-docker-image-not-found-error-2026-05-02` | `0e0c06d` | unmerged |
| `codex/infamous-fix-issues-from-codex-review-for-pr-#1305-2026-04-10` | `e688deb` | unmerged |
| `codex/infamous-fix-missing-files-in-docker-build-2026-04-18` | `9c2a8c0` | unmerged |
| `codex/infamous-fix-repo-workflow-2026-04-29` | `9cd7dd1` | unmerged |
| `codex/infamous-fix-typescript-errors-and-tests-2026-03-31` | `a32d870` | unmerged |
| `codex/infamous-fix-unknown-env-config-warning-2026-04-06` | `59570aa` | unmerged |
| `codex/infamous-fix-usage-tracking-error-handling-2026-03-31` | `090a638` | unmerged |
| `codex/infamous-identify-sentry-project-configuration-2026-04-30` | `86b74de` | unmerged |
| `codex/infamous-install-all-dependencies-for-repo-2026-04-22` | `8c31111` | unmerged |
| `codex/infamous-install-ansible-playbook-and-shellcheck-2026-04-06` | `eacc982` | unmerged |
| `codex/infamous-install-docker-cli-2026-04-23-ea70qa` | `8ba307d` | unmerged |
| `codex/infamous-install-docker-cli-2026-04-23` | `67120f7` | unmerged |
| `codex/infamous-install-node_modules-2026-04-08` | `a30d46b` | unmerged |
| `codex/infamous-integrate-sentry-for-error-handling-2026-04-08` | `a766609` | unmerged |
| `codex/infamous-locate-deployment-30108a05e0ccbd98f00a1a4fb5978a05-2026-04-25` | `791ec75` | unmerged |
| `codex/infamous-locate-project-prj_v9ykx8ggdq4vdhudsxlyezopm6mg-2026-04-08` | `11a9c36` | unmerged |
| `codex/infamous-migrate-to-pnpm-across-repo-2026-04-22` | `b3cee9f` | unmerged |
| `codex/infamous-prepare-infamous-freight-for-production-launch-2026-04-08` | `1a3689c` | unmerged |
| `codex/infamous-provide-recommendations-2026-04-17-f3i8xj` | `21ae6bf` | unmerged |
| `codex/infamous-provide-recommendations-2026-04-17-wdib84` | `8250771` | unmerged |
| `codex/infamous-provide-recommendations-2026-04-17-wje466` | `0d6278a` | unmerged |
| `codex/infamous-provide-recommendations-2026-04-17-yds6m5` | `8260e8a` | unmerged |
| `codex/infamous-provide-recommendations-2026-04-17` | `5dbff2c` | unmerged |
| `codex/infamous-provide-ubuntu-installation-instructions-2026-04-21` | `2cb9b0f` | unmerged |
| `codex/infamous-review-github-repo-and-compile-recommendations-2026-04-22` | `ea1e27e` | unmerged |
| `codex/infamous-review-recommendations-for-infamous-freight-2026-04-30` | `3c0d07e` | unmerged |
| `codex/infamous-review-repository-for-updates-2026-04-08` | `8aee4b4` | unmerged |
| `codex/infamous-run-build-and-test-steps-2026-04-29-bd03f2` | `0dfef01` | unmerged |
| `codex/infamous-run-build-and-test-steps-2026-04-29` | `3add123` | unmerged |
| `codex/infamous-run-netlify-mcp-with-site-id-2026-04-30-lvu1er` | `5fe4e5e` | unmerged |
| `codex/infamous-run-netlify-mcp-with-site-id-2026-04-30` | `eef2254` | unmerged |
| `codex/infamous-set-up-development-environment-2026-04-06` | `36655e4` | unmerged |
| `codex/infamous-set-up-multi-stage-docker-build-2026-04-07` | `cb48388` | unmerged |
| `codex/infamous-task-title-2026-04-18-0hlhhi` | `d9459e5` | unmerged |
| `codex/infamous-task-title-2026-04-18-2b6uun` | `6ebbbc0` | unmerged |
| `codex/infamous-task-title-2026-04-18-pdxqmp` | `65682c4` | unmerged |
| `codex/infamous-task-title-2026-04-18` | `f5a1343` | unmerged |
| `codex/infamous-task-title-2026-04-19` | `c95959e` | unmerged |
| `codex/infamous-test-repository-setup-2026-04-08-h4om6j` | `b670564` | unmerged |
| `codex/infamous-troubleshoot-netlify-command-failures-2026-04-07` | `665cafe` | unmerged |
| `codex/infamous-update-all-requirements-to-latest-version-2026-04-29` | `a35a484` | unmerged |
| `codex/infamous-update-ci/cd-workflow-for-deployment-2026-04-29-cvqcz3` | `1aface5` | unmerged |
| `codex/infamous-update-ci/cd-workflow-for-deployment-2026-04-29` | `6cca9c6` | unmerged |
| `codex/infamous-update-dns-and-domain-settings-for-netlify-2026-04-30` | `881d12e` | unmerged |
| `codex/infamous-update-fly-machine-by-id-2026-04-29-7v2p2x` | `77c16e2` | unmerged |
| `codex/infamous-update-fly-machine-by-id-2026-04-29-h6ylo8` | `391d604` | unmerged |
| `codex/infamous-update-fly-machine-by-id-2026-04-29` | `46af686` | unmerged |
| `codex/infamous-update-readme-content-2026-04-08` | `811f609` | unmerged |
| `codex/integrate-supabase-postgres-url-into-infamous-freight` | `9456d51` | unmerged |
| `codex/make-github-main-branch-green` | `c687313` | unmerged |
| `codex/recommendations-feature` | `ffcc8ee` | unmerged |
| `codex/resolve-codeql-default-setup-conflict` | `3902546` | unmerged |
| `codex/tmp-rebase-pr-1552-on-main-2026-04-25` | `b4a6b07` | unmerged |
| `codex/update-commit-reference-link` | `f74874a` | unmerged |
| `codex/update-infantus-freight-api` | `874c69c` | unmerged |
| `codex/update-pnpm-version-to-10-15-0` | `8b93e63` | unmerged |
| `conflict_210326_0052` | `6ffb35b` | unmerged |
| `conflict_210326_0059` | `10bc664` | unmerged |
| `copilot/add-ci-cd-pipeline-enhancements` | `438c8d8` | unmerged |
| `copilot/add-ci-jobs-html-validation` | `e981bf8` | unmerged |
| `copilot/add-data-validation-rules` | `7ac98ec` | unmerged |
| `copilot/add-improvements-to-infra-freight` | `552f28e` | unmerged |
| `copilot/add-nvmrc-and-package-json-updates` | `4135376` | unmerged |
| `copilot/add-pnpm-lock-file` | `2cfcb3b` | unmerged |
| `copilot/add-production-rate-limits` | `39ed501` | unmerged |
| `copilot/add-upload-deploy-artifact` | `2084e74` | unmerged |
| `copilot/add-workflow-alerts-mvp` | `3844a3a` | unmerged |
| `copilot/address-review-feedback-ci-stability` | `51a906d` | unmerged |
| `copilot/address-review-feedback` | `f010ad3` | unmerged |
| `copilot/assign-driver-based-on-efficiency` | `806af3f` | unmerged |
| `copilot/audit-and-optimize-repo` | `cf92919` | unmerged |
| `copilot/audit-infamous-freight-100` | `ce65187` | unmerged |
| `copilot/audit-repository-and-validation` | `b4aba3d` | unmerged |
| `copilot/build-and-deploy-github-pages` | `1b50267` | unmerged |
| `copilot/build-deploy-github-pages` | `4f5153d` | unmerged |
| `copilot/build-dispatch-board-shipment-tracking` | `be948ce` | unmerged |
| `copilot/build-jwt-authentication-system` | `60f2175` | unmerged |
| `copilot/build-quote-request-to-load-workflow` | `16d323b` | unmerged |
| `copilot/build-quote-request-workflow` | `fb7c276` | unmerged |
| `copilot/chore-delete-stale-remote-branches` | `ec4127f` | unmerged |
| `copilot/complete-production-readiness-evidence` | `b763c47` | unmerged |
| `copilot/configure-production-secrets` | `fadbf3a` | unmerged |
| `copilot/confirm-carrier-onboarding-workflow` | `fa81871` | unmerged |
| `copilot/confirm-document-retention-process` | `1275d4f` | unmerged |
| `copilot/enable-github-pages-main` | `104988e` | unmerged |
| `copilot/enhance-documentation-ci-cd` | `a7c2858` | unmerged |
| `copilot/fix-all-repos-issues` | `9cc9fca` | unmerged |
| `copilot/fix-application-error` | `a13167f` | unmerged |
| `copilot/fix-bug-in-shipping-module` | `7121a00` | unmerged |
| `copilot/fix-check-suite-errors` | `eca4663` | unmerged |
| `copilot/fix-checks-issues` | `440dd7f` | unmerged |
| `copilot/fix-ci-cd-security-issues` | `e29d530` | unmerged |
| `copilot/fix-ci-test-issues` | `2d2426f` | unmerged |
| `copilot/fix-commit-check-issues` | `464a906` | unmerged |
| `copilot/fix-container-loading-issue` | `6cca9c6` | unmerged |
| `copilot/fix-deploy-yml-broken-code` | `689dce2` | unmerged |
| `copilot/fix-dns-resolution-issues` | `d543f43` | unmerged |
| `copilot/fix-docker-port-runtime-mismatch` | `55a74fb` | unmerged |
| `copilot/fix-dual-js-ts-entry-points` | `152c9ad` | unmerged |
| `copilot/fix-harden-deployment-pipeline-again` | `bc93900` | unmerged |
| `copilot/fix-invoice-processing-error` | `fe01e55` | unmerged |
| `copilot/fix-issue-with-freight-logging` | `e310adc` | unmerged |
| `copilot/fix-issue-with-payment-processing` | `4b0e140` | unmerged |
| `copilot/fix-memory-leak-issue` | `3c0d07e` | unmerged |
| `copilot/fix-mocks-paths-prisma-guards` | `57f2428` | unmerged |
| `copilot/fix-order-processing-error` | `fe01e55` | unmerged |
| `copilot/fix-order-processing-issue` | `81db5ba` | unmerged |
| `copilot/fix-payment-processing-bug` | `591b75f` | unmerged |
| `copilot/fix-pnpm-version-mismatch` | `71ebcaa` | unmerged |
| `copilot/fix-retrieve-shipment-issue` | `696c2c5` | unmerged |
| `copilot/fix-runtime-error-in-invoice-module` | `e5a1923` | unmerged |
| `copilot/fix-typo-in-documentation-again` | `0e0c06d` | unmerged |
| `copilot/fix-typo-in-documentation` | `7dcfd79` | unmerged |
| `copilot/fix-typo-in-readme-again` | `c808e7e` | unmerged |
| `copilot/fix-typo-in-readme` | `88b703e` | unmerged |
| `copilot/fix-user-authentication-issue` | `aa7cb9e` | unmerged |
| `copilot/improve-dependabot-automation` | `1ffc7be` | unmerged |
| `copilot/improve-documentation-structure` | `505bed0` | unmerged |
| `copilot/launch-staging-validation-production-migration-che` | `4cdb425` | unmerged |
| `copilot/mvp-build-carrier-approval-workflow` | `8d6b865` | unmerged |
| `copilot/mvp-build-pod-upload-invoice-workflow` | `1104c4d` | unmerged |
| `copilot/optimize-maintainability-security` | `a6c5145` | unmerged |
| `copilot/platform-wide-enterprise-hardening` | `bc4d6c9` | unmerged |
| `copilot/provide-production-readiness-evidence` | `d88e0af` | unmerged |
| `copilot/recommendations-for-improvement` | `b3af394` | unmerged |
| `copilot/reconcile-frontend-behavior` | `470c622` | unmerged |
| `copilot/reference-checks-update` | `dcc281f` | unmerged |
| `copilot/reference-github-action-run-73515665537` | `a56521e` | unmerged |
| `copilot/reference-github-run-73515665121` | `971f2a7` | unmerged |
| `copilot/replace-header-trusted-role-checks` | `ea96868` | unmerged |
| `copilot/resolve-open-pull-requests` | `f722451` | unmerged |
| `copilot/restructure-repository-for-monorepo` | `8386d13` | unmerged |
| `copilot/review-code-quality-ci-cd` | `020af69` | unmerged |
| `copilot/run-end-to-end-freight-workflow-test` | `657fcd4` | unmerged |
| `copilot/setup-hardening-for-infamous-freight` | `a612fa0` | unmerged |
| `copilot/split-runtime-sbom-from-build-artifacts` | `2134a03` | unmerged |
| `copilot/trigger-mvp-quote-workflow-validation` | `47e3145` | unmerged |
| `copilot/update-authentication-methods` | `86b74de` | unmerged |
| `copilot/update-branch-1700` | `f3b6de7` | unmerged |
| `copilot/update-branch-1708` | `391d604` | unmerged |
| `copilot/update-cargo-handling-system` | `252ca40` | unmerged |
| `copilot/update-checks-for-commit-53e1b9d-again` | `3ea014b` | unmerged |
| `copilot/update-checks-for-commit-53e1b9d` | `e370e48` | unmerged |
| `copilot/update-checks-for-commit-deeb815` | `041163d` | unmerged |
| `copilot/update-ci-workflow` | `a25481d` | unmerged |
| `copilot/update-commentary-formatting` | `58c7f6b` | unmerged |
| `copilot/update-customer-shipping-details` | `866f8a7` | unmerged |
| `copilot/update-documentation-for-api-endpoints` | `23cca1c` | unmerged |
| `copilot/update-documentation-for-api` | `55742ed` | unmerged |
| `copilot/update-documentation-for-installation` | `0c3c2e2` | unmerged |
| `copilot/update-documentation-for-repo` | `49cde0d` | unmerged |
| `copilot/update-documentation` | `b204649` | unmerged |
| `copilot/update-freight-enterprise-data` | `2a1d705` | unmerged |
| `copilot/update-freight-invoice-format` | `00bbde6` | unmerged |
| `copilot/update-freight-management-system-again` | `b76ab77` | unmerged |
| `copilot/update-freight-management-system` | `7d09d3d` | unmerged |
| `copilot/update-infamous-freight-safely` | `4a5121d` | unmerged |
| `copilot/update-landing-page-design` | `cc1312a` | unmerged |
| `copilot/update-page-header-text` | `40973ac` | unmerged |
| `copilot/update-permissions-settings` | `4176821` | unmerged |
| `copilot/update-pnpm-version-to-10-15-0` | `cadd52d` | unmerged |
| `copilot/update-pr-template` | `aa7cb9e` | unmerged |
| `copilot/update-project-dependencies` | `cc1312a` | unmerged |
| `copilot/update-readme-file-again` | `9897b4c` | unmerged |
| `copilot/update-readme-file-another-one` | `c6340f2` | unmerged |
| `copilot/update-readme-for-clarity` | `cc1312a` | unmerged |
| `copilot/update-readme-with-contribution-guidelines` | `f898982` | unmerged |
| `copilot/update-readme-with-sample-data` | `5a83d89` | unmerged |
| `copilot/update-repo-config-to-match-production` | `a823196` | unmerged |
| `copilot/update-run-configuration` | `1ef769d` | unmerged |
| `copilot/update-transportation-logic` | `7cec1e3` | unmerged |
| `copilot/update-user-authentication` | `fc105f3` | unmerged |
| `copilot/validate-approved-quote-workflow-tests` | `186f5e9` | unmerged |
| `copilot/validate-pagination-parameters` | `9162c73` | unmerged |
| `docs/local-infra-readme` | `acecbd2` | unmerged |
| `docs/products-overview` | `3c258af` | unmerged |
| `feat/launch-readiness-pack` | `8e0aadb` | unmerged |
| `fix-netlify-next-build` | `170a88d` | unmerged |
| `fix/ai-workers-hardening` | `69945bf` | unmerged |
| `fix/ci-pnpm-and-secret-gating` | `8a087db` | unmerged |
| `fix/web-build-blockers-apr20-2026` | `8c910d4` | unmerged |
| `github-advanced-security/fix-pr-1541-issues` | `1a87ba8` | unmerged |
| `github-advanced-security/fix-typo-in-documentation` | `61ab93a` | unmerged |
| `infamous-reliability-agents` | `bce36b1` | unmerged |
| `local-infra-smoke` | `4b1cc3a` | unmerged |
| `update-toolchain` | `472eb94` | unmerged |
| `vercel/install-vercel-web-analytics-mxvtxf` | `061c9d2` | unmerged |

</details>

## Recommended deletion procedure (owner-executed)

After owner approval of the **safe-to-delete** list above, the deletions can be
performed from a workstation with `gh` authenticated against this repository:

```bash
# 1. Save the approved list (one branch name per line) as safe-to-delete.txt.

# 2. Dry run — print what would be deleted.
while read -r b; do echo "would delete: $b"; done < safe-to-delete.txt

# 3. Execute.
while read -r b; do
  gh api -X DELETE "repos/Infaemous-Freight/Infamous-freight/git/refs/heads/$b"
done < safe-to-delete.txt
```

After deletion, refresh this audit by re-running the snapshot procedure to
record the new branch count.
