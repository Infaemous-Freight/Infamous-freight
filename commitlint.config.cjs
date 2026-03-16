/**
 * Commitlint Configuration
 * Enforces Conventional Commits standard
 *
 * Format: type(scope): subject
 *
 * Types:
 * - feat: A new feature
 * - fix: A bug fix
 * - docs: Documentation only changes
 * - style: Changes that do not affect the meaning of the code
 * - refactor: A code change that neither fixes a bug nor adds a feature
 * - perf: A code change that improves performance
 * - test: Adding missing tests or correcting existing tests
 * - chore: Changes to the build process or auxiliary tools
 * - ci: Changes to our CI configuration files and scripts
 * - revert: Reverts a previous commit
 *
 * Examples:
 * - feat(api): add user authentication endpoint
 * - fix(web): resolve button styling issue on mobile
 * - docs: update README with setup instructions
 * - refactor(shared): extract common validation utilities
 */

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci", "revert"],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};
