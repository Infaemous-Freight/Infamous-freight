# GitHub Control Room

This directory contains the governance, automation, and operational configuration for the **Infamous Freight** repository.

It defines how the repository behaves in terms of CI/CD, issue intake, security checks, and contribution workflows.

Think of this directory as the **control room** for the repository.

---

## Canonical Contents

### workflows/

Location of all GitHub Actions pipelines.

These workflows automate core repository operations such as:

- continuous integration
- build validation
- test execution
- security scanning
- deployment pipelines
- repository health checks

---

### ISSUE_TEMPLATE/

Structured issue templates used when creating new issues.

These ensure contributors provide useful information and help automation tools like **Copilot** and **Codex** understand tasks clearly.

Templates include:

- bug reports
- feature requests
- workflow failure reports
- AI coding tasks
- release checklists

---

### CODEOWNERS

Defines ownership of parts of the codebase.

GitHub automatically requests review from maintainers when files change.

---

### dependabot.yml

Configuration for **Dependabot**.

Dependabot scans the repository for outdated or vulnerable dependencies and creates pull requests to update them.

---

### codeql-config.yml

Configuration for GitHub **CodeQL security analysis**.

CodeQL scans the codebase for security vulnerabilities and unsafe patterns.

---

## Operational Philosophy

Infrastructure should enforce discipline automatically.

The repository uses automation to ensure:

- builds always validate
- dependencies remain secure
- issues follow structured formats
- reviewers are automatically assigned
- releases follow checklists
