# Codex PR Command Pack

Use these ready-to-paste PR comments to drive Codex review/fix loops efficiently.

## 1) Trigger a fresh Codex review

```text
@codex review
```

## 2) Tell Codex to address all feedback

```text
@codex address that feedback
```

## 3) Stronger "fix all" command

```text
@codex address all review feedback on this pull request. Fix the issues directly in code where appropriate, preserve existing behavior unless a change is required by the review, and keep patches minimal, safe, and production-ready. Prioritize correctness, tests, auth/security, Prisma/database safety, and CI stability. After changes, summarize exactly what was fixed.
```

## 4) If CI/tests are failing

```text
@codex fix the failing CI and test issues on this pull request first. Prioritize the top repeating failures, keep patches minimal, and avoid unrelated refactors. Focus on mocks, auth/RBAC middleware compatibility, Prisma guards, path/import issues, and test stability. After updating the PR, summarize the root causes and the exact files changed.
```

## 5) Backend/auth/API focused

```text
@codex review backend, auth, and API changes carefully. Address any issues involving middleware behavior, scope/permission checks, request validation, Prisma usage, error handling, and security regressions. Apply the smallest safe patch set and summarize the fixes clearly.
```

## 6) Frontend/web focused

```text
@codex review the frontend changes for correctness, regressions, typing issues, accessibility, loading/error states, and API integration safety. Address any review feedback with minimal changes and summarize what was fixed.
```

## 7) Scope Codex to review comments only

```text
@codex address only the existing review feedback on this pull request. Do not perform unrelated refactors or cleanup. Keep changes narrowly scoped to the review comments and preserve current architecture unless a fix requires otherwise.
```

## 8) Target one class of problems

### Auth / RBAC

```text
@codex address the auth and RBAC review comments only. Focus on validateScope, hasScope, hasAllScopes, middleware compatibility, permission checks, and safe defaults in tests and runtime.
```

### Prisma / database

```text
@codex address the Prisma and database review comments only. Focus on Prisma client safety, guards, transactions, null handling, schema compatibility, and test/runtime stability.
```

### Tests / mocks

```text
@codex address the test and mocking feedback only. Focus on missing mocks, setup compatibility, brittle assertions, import path mismatches, and runInBand stability.
```

### CI / workflows

```text
@codex address the CI and workflow feedback only. Focus on GitHub Actions failures, environment assumptions, test sequencing, dependency setup, and deterministic execution.
```

## 9) Best all-in-one command for this repo

```text
@codex address all review feedback on this PR and prioritize CI stability. Keep patches minimal and production-safe. Focus first on the highest-impact issues: failing tests, broken mocks, auth/RBAC compatibility, Prisma guard issues, import/path problems, and any security-sensitive review comments. Avoid unrelated refactors. After updating the PR, provide a concise summary of:
1. root causes,
2. exact files changed,
3. tests fixed,
4. any remaining risks or follow-ups.
```

## 10) Human maintainer reply after Codex updates

```text
Addressed the review feedback and narrowed the fixes to the reported issues.

Summary:
- fixed the highest-impact review items first
- prioritized CI/test stability
- kept the patch set minimal
- avoided unrelated refactors

Please re-review the updated changeset.
```

## 11) Maintainer checklist comment

```text
Review pass checklist:
- [ ] Codex review triggered
- [ ] review comments addressed
- [ ] failing CI issues prioritized
- [ ] tests re-run
- [ ] no unrelated refactors introduced
- [ ] ready for re-review
```

## 12) If Codex is too vague

```text
@codex address all current review comments with concrete code changes. Do not just summarize the issues. Update the PR directly, keep the patch set minimal, and prioritize deterministic fixes over speculative refactors. Validate auth/RBAC behavior, Prisma safety, test setup compatibility, and CI reliability. Then post a file-by-file summary of what changed.
```

## 13) If Codex keeps thrashing

```text
@codex stop broad refactoring and address only the existing review comments. Apply the smallest safe patch for each comment, preserve behavior where possible, and prioritize green CI over cleanup. Do not rename files, reorganize modules, or change architecture unless required to resolve a specific comment.
```

## 14) Recommended execution order

**Step A — ask for review if needed**

```text
@codex review
```

**Step B — tell it to fix everything important**

Use the stronger "fix all" command from **Section 9 – Stronger "fix all" command**.

**Step C — if needed, narrow to test failures only**

Use the CI/test-focused command from **Section 4 – If CI/tests are failing**.

**Step D — re-review**

```text
@codex review
```

## 15) Ultra-compact command pack

```text
@codex review

@codex address all review feedback on this PR and prioritize CI stability. Keep patches minimal and production-safe. Focus first on failing tests, broken mocks, auth/RBAC compatibility, Prisma guard issues, import/path problems, and security-sensitive comments. Avoid unrelated refactors. Summarize root causes, files changed, tests fixed, and remaining risks.

@codex review
```

## 16) What must be provided to do real fixes

The onboarding banner is not actual review feedback. To generate a concrete patch plan, you still need to provide inline review comments or the PR review summary.

Once those are available, you can ask for:
- an exact patch plan,
- ready-to-paste Codex instructions,
- likely code fixes,
- and human PR responses per comment.
