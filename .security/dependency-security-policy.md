# Dependency Security Policy

Infæmous Freight relies on open source packages.

All dependencies must be monitored for vulnerabilities.

---

# Tools

- Dependabot
- CodeQL
- npm audit
- pnpm audit

---

# Update Policy

Critical vulnerabilities:
patch within 24 hours.

High severity:
patch within 72 hours.

Medium severity:
patch during next sprint.

Low severity:
scheduled update.

---

# Supply Chain Protection

- lockfile required
- pinned versions for critical packages
- automated dependency PRs
- review before merge
