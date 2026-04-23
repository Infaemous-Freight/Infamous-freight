# Contributing to Infamous Freight

Thanks for contributing.

## Ground rules

- Keep changes focused and reviewable.
- Prefer small pull requests over large mixed changes.
- Do not commit secrets, tokens, or private customer data.
- Update docs when behavior, setup, or environment requirements change.
- Add or extend tests when you add backend behavior.

## Branch naming

Use clear branch names:

- `feature/<name>`
- `fix/<name>`
- `chore/<name>`
- `docs/<name>`

Examples:

- `feature/load-alerts`
- `fix/fly-port-config`
- `chore/ci-hardening`
- `docs/readme-refresh`

## Commit style

Conventional Commits are preferred.

Examples:

- `feat: add broker credit lookup endpoint`
- `fix: correct api health route`
- `docs: update local setup steps`
- `chore: add ci workflow`

## Local development checklist

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start local infrastructure:

```bash
docker-compose up -d postgres redis
```

4. Generate Prisma client and run local database setup:

```bash
npm run db:setup
```

5. Start the application:

```bash
npm run dev
```

## Before opening a pull request

Run the standard validation steps:

```bash
npm run lint
npm run test
npm run build
```

If your change touches database behavior, also verify Prisma generation and migrations locally.

## Pull request expectations

A good pull request should include:

- a clear summary of what changed
- why the change was needed
- any environment variable updates
- screenshots for UI changes when relevant
- notes about deployment or migration impact when relevant

## Documentation expectations

If you change any of the following, update the docs in the same pull request:

- setup steps
- required environment variables
- deployment commands
- ports, domains, or API prefixes
- authentication or billing behavior

## Security expectations

- Never commit `.env` files.
- Never commit real API keys.
- Sanitize logs and screenshots before sharing.
- Treat customer, carrier, driver, and payment data as sensitive.
