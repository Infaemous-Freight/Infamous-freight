# Copilot Coding Agent Autonomous Pipeline

This document defines the production workflow for autonomous issue-to-PR delivery in Infæmous Freight.

## Pipeline Overview

1. Manus standardizes the task (triage + scoped issue body)
2. GitHub Issue becomes source of truth
3. Copilot Coding Agent is assigned and opens/updates PR
4. GitHub Actions `PR Checks` validates typecheck, lint, and tests
5. Human reviewer performs required review and approves workflow run if prompted
6. Merge when checks + review are green

## Required Repository Controls

- Keep `.github/copilot-instructions.md` up to date so agent behavior stays repo-native.
- Require branch protection on `main`:
  - at least one approving review
  - required status checks (including `PR Checks / validate`)
  - block direct pushes

## Issue Intake Standard

Use `.github/ISSUE_TEMPLATE/copilot_task.yml` for agent work.

Required fields:
- in-scope file list
- out-of-scope boundaries
- acceptance criteria
- failure evidence/log snippets
- preferred execution order

Recommended labels:
- `copilot-task`
- `needs-triage`
- `ci-failing`
- `ready-for-review`

## PR Iteration Loop

Comment directly on the Copilot PR with narrowly scoped instructions, for example:

- `@copilot fix only the remaining failing suites; do not refactor`
- `@copilot update __tests__/setup.js to add missing mocks; rerun tests`
- `@copilot handle Prisma P2002 as 409 conflict in shipments route`

## "Approve and run workflows" Gate

Some Copilot-authored PRs may require maintainer approval before workflows run.
This is expected.

Before approval, do a quick diff sanity pass:
- no workflow tampering
- no suspicious dependency additions
- no secrets exposure

## CI Failure Summarizer

`PR Checks` includes a `summarize-on-fail` job that posts a PR comment with next steps whenever validation fails.
Use that comment as the next Copilot task target and rerun tests locally with the same commands used in CI (for example, `pnpm test` at the repo root or a per-package run such as `pnpm --filter apps/web test`).

## Operating Procedure (Tests Failing)

1. In Manus, run `/infamous-freight-test-fixer`
2. Paste `jest-output.txt` (or first failure chunk)
3. Use Manus outputs:
   - triage summary
   - Copilot-ready issue body
   - review checklist
4. Create issue from `Copilot Task` template and assign Copilot
5. Review PR, approve workflow run when safe, iterate by comments
6. Merge once checks + review are green
