# Contributing to Infamous Freight Enterprises

Thank you for your interest in contributing! This guide will help you get started.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## 🚀 Getting Started

### Prerequisites

- Node.js 20.0.0+
- pnpm 9.15.0 (required - enforced by packageManager field)
- PostgreSQL 15+ (or Docker)
- Git

### Initial Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Infamous-freight-enterprises.git
   cd Infamous-freight-enterprises
   ```

2. **Run Setup**

   ```bash
   ./setup.sh
   ```

   This will:
   - Install pnpm if needed
   - Install all dependencies
   - Build shared package
   - Setup environment template
   - Configure git hooks

3. **Configure Environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start Development**

   ```bash
   pnpm dev  # Starts all services
   ```

## 💻 Development Workflow

### Monorepo Structure

This project uses pnpm workspaces. Key commands:

```bash
# Start all services
pnpm dev

# Start specific service
pnpm api:dev
pnpm web:dev

# Run tests
pnpm test

# Build all
pnpm build

# Lint and format
pnpm lint
pnpm format
```

### Working with Services

**API Service** (`/api`)

```bash
cd api
pnpm dev              # Start dev server
pnpm test             # Run tests
pnpm prisma:studio    # Open database GUI
```

**Web Service** (`/web`)

```bash
cd web
pnpm dev              # Start Next.js
pnpm build            # Production build
```

**Shared Package** (`/src/packages/shared`)

```bash
cd packages/shared
pnpm build            # Build TypeScript
pnpm dev              # Watch mode
```

After changing shared package:

```bash
pnpm --filter @infamous-freight/shared build
```

### AI Coding Assistant

The devcontainer includes **Codex CLI** for AI-assisted development:

```bash
codex                 # Interactive AI coding agent
codex exec "task"     # Non-interactive mode
```

**VS Code Integration:**

- Run Task: Terminal → Run Task → "Codex: Start"
- Keyboard: `Ctrl+Shift+C` for interactive mode

### Creating a Branch

Follow this naming convention:

- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring
- `test/description` - Adding tests
- `chore/description` - Maintenance tasks

```bash
git checkout -b feat/your-feature-name
```

## 📏 Code Standards

### Code Quality

All code must pass automated checks:

- ✅ ESLint (no errors)
- ✅ Prettier formatting
- ✅ TypeScript compilation (for TS files)
- ✅ All tests passing
- ✅ Code coverage ≥84%

These run automatically on commit via Husky hooks.

### Testing Requirements

**Coverage Thresholds** (enforced in CI):

- Branches: ≥75%
- Functions: ≥80%
- Lines: ≥84%
- Statements: ≥84%

**Before submitting a PR:**

1. Run full test suite: `cd api && pnpm test`
2. Check coverage: `cd api && pnpm test:coverage`
3. Review uncovered code - is it intentional? See [COVERAGE_GAPS.md](./docs/COVERAGE_GAPS.md)

**Writing Tests:**

- Follow patterns in [TESTING.md](./docs/TESTING.md)
- Test happy paths AND error scenarios
- Mock external dependencies (Stripe, OpenAI, etc.)
- Use descriptive test names
- Clear mocks between tests

**When to Skip Tests:**
See [COVERAGE_GAPS.md](./docs/COVERAGE_GAPS.md) for guidance on:

- Process signal handlers
- Database connection failures
- External API retry logic

### Commit Messages

We use **Conventional Commits**:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance
- `ci`: CI/CD changes

**Examples:**

```bash
git commit -m "feat(api): add user authentication endpoint"
git commit -m "fix(web): resolve button styling issue"
git commit -m "docs: update README with setup instructions"
```

### Code Style

- Use **Prettier** for formatting (auto-format on save)
- Use **ESLint** for code quality
- Follow existing patterns in the codebase
- Add JSDoc comments for public APIs
- Keep functions small and focused

### TypeScript Guidelines

For TypeScript code (shared package, web):

- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Export types from shared package

Example:

```typescript
import { User, ShipmentStatus } from "@infamous-freight/shared";

const user: User = {
  id: "1",
  email: "user@example.com",
  name: "John Doe",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Using Shared Package

Import common code from `@infamous-freight/shared`:

```javascript
// In API (JavaScript)
const { HTTP_STATUS, formatCurrency } = require("@infamous-freight/shared");

// In Web (TypeScript)
import { User, formatDate, SHIPMENT_STATUSES } from "@infamous-freight/shared";
```

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm test

# With coverage
pnpm test:coverage

# Specific service
pnpm --filter api test
pnpm --filter web test

# E2E tests
pnpm e2e
```

### Writing Tests

- Write tests for new features
- Maintain or improve coverage
- Follow existing test patterns
- Use descriptive test names

**Example:**

```javascript
describe("User API", () => {
  it("should create a new user", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ email: "test@example.com", name: "Test User" });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("test@example.com");
  });
});
```

## 📝 Pull Request Process

### Before Submitting

1. ✅ All tests pass locally
2. ✅ Code is linted and formatted
3. ✅ Branch is up to date with `main`
4. ✅ Commit messages follow conventions
5. ✅ Documentation updated if needed

### Submitting PR

1. **Push your branch**

   ```bash
   git push origin feat/your-feature
   ```

2. **Create Pull Request**
   - Use a clear, descriptive title
   - Follow PR template
   - Reference related issues
   - Add screenshots if UI changes

3. **PR Title Format**

   ```
   feat: add user profile page
   fix: resolve authentication bug
   ```

4. **Wait for CI**
   - All GitHub Actions must pass
   - Code coverage must not decrease
   - Security checks must pass

5. **Code Review**
   - Address reviewer feedback
   - Keep discussion professional
   - Update based on suggestions

6. **Merge**
   - Maintainer will merge when approved
   - Squash and merge is default

## 📁 Project Structure

```
infamous-freight-enterprises/
├── api/                    # Backend API service
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   └── middleware/    # Express middleware
│   └── prisma/            # Database schema
├── web/                   # Next.js frontend
│   ├── pages/            # Routes and pages
│   ├── components/       # React components
│   └── hooks/            # Custom hooks
├── mobile/               # React Native app
├── packages/
│   └── shared/           # Shared code
│       ├── src/
│       │   ├── types.ts      # Common types
│       │   ├── utils.ts      # Utility functions
│       │   └── constants.ts  # App constants
└── e2e/                  # E2E tests
```

### Key Files

- `pnpm-workspace.yaml` - Monorepo configuration
- `.lintstagedrc` - Pre-commit hook config
- `eslint.config.js` - ESLint configuration
- `.env.example` - Environment template

## 🐛 Reporting Issues

When reporting issues:

- Use issue templates
- Provide reproduction steps
- Include environment details
- Add relevant logs/screenshots

## 💡 Getting Help

- 📖 Read [Documentation Index](DOCUMENTATION_INDEX.md)
- 📚 Check [Migration Guide](MIGRATION_GUIDE.md)
- 🔍 Search existing issues
- 💬 Ask in discussions

## � Troubleshooting

### pnpm Version Management

This project uses **Corepack** to automatically manage pnpm versions. The required version is specified in `package.json` (`pnpm@7.5.1`).

**If pnpm is not found:**

```bash
corepack enable
corepack prepare pnpm@7.5.1 --activate
```

**If you see "Failed to switch pnpm":**

```bash
# Install Corepack first
sudo npm install -g corepack --force

# Then enable and prepare pnpm
corepack enable
corepack prepare pnpm@7.5.1 --activate
```

**Pre-commit hooks failing with pnpm error:**

- Ensure Corepack is enabled: `corepack enable`
- Verify pnpm version: `pnpm --version` (should be 7.5.1)
- If still failing, try: `git commit --no-verify` as a workaround while debugging

### Other Common Issues

**Module not found: @infamous-freight/shared**

```bash
pnpm --filter @infamous-freight/shared build
```

**Port already in use**

```bash
lsof -ti:3001 | xargs kill -9  # API port
lsof -ti:3000 | xargs kill -9  # Web port
```

**Dependency issues**

```bash
# Clean and reinstall everything
pnpm clean
pnpm install
```

## �📚 Additional Resources

- [README.md](README.md) - Project overview
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference
- [IMPROVEMENTS_COMPLETE.md](IMPROVEMENTS_COMPLETE.md) - Recent changes

## 🎉 Thank You

Your contributions help make this project better for everyone!
