# Contributing to Infamous Freight

Thank you for your interest in contributing to Infamous Freight.

We welcome contributions that improve the platform, documentation, workflows, developer experience, and long-term architecture.

## Ways to Contribute

You can contribute by helping with:

- bug fixes
- feature development
- documentation improvements
- workflow and CI/CD enhancements
- UI/UX improvements
- architecture discussions
- API design suggestions
- test coverage improvements

## Before You Start

Please review the following before contributing:

- open Issues
- open Pull Requests
- GitHub Discussions
- project documentation

This helps avoid duplicate work and keeps contribution flow clean.

## Contribution Process

1. Fork the repository.
2. Create a new branch from the appropriate base branch.
3. Make focused changes.
4. Write clear commit messages.
5. Run relevant checks locally.
6. Open a pull request with a clear description.

## Branch Naming Suggestions

Use descriptive branch names such as:

```text
feature/load-board-ranking
fix/auth-token-refresh
docs/readme-update
chore/ci-hardening
```

## Pull Request Guidelines

Pull requests should:

- have a clear and specific title
- explain what changed
- explain why the change was made
- stay focused on one logical improvement
- include testing notes when applicable
- avoid unrelated refactors unless necessary

## Code Quality Expectations

Contributions should aim for:

- readable code
- consistent structure
- strong typing where applicable
- minimal complexity
- maintainable abstractions
- safe handling of configuration and secrets

## Security Requirements

Do not commit:

- API keys
- tokens
- passwords
- credentials
- .env files with sensitive data

If you discover a security issue, do not post it publicly in an issue or discussion thread. Report it privately by emailing `security@infamousfreight.com` as described in `SECURITY.md`.

## Documentation

If your change affects behavior, setup, architecture, or developer workflow, update the relevant documentation alongside the code.

## Testing

Before submitting a pull request, run the relevant checks for the areas you changed, such as:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If the repository uses scoped commands, run the appropriate workspace-level checks as well.

## Discussions First for Big Changes

For major architecture changes or new platform directions, open a GitHub Discussion first before implementing large changes. This keeps the repo from mutating into a random code jungle.

## Review Process

All contributions are reviewed before merging. Feedback may include requests for:

- code cleanup
- documentation updates
- tests
- scope reduction
- architectural alignment

## Licensing

By contributing to this repository, you agree that your contributions will be licensed under the same MIT License that governs this project.

## Questions

For questions, use GitHub Discussions or open an issue if the topic is actionable and specific.

Thanks for helping build Infamous Freight.
