# Codex CLI Configuration

This directory contains configuration for the [Codex CLI](https://github.com/openai/codex) AI coding assistant.

## Setup

1. **Copy the template:**

   ```bash
   cp config.toml.example config.toml
   ```

2. **Customize your settings** in `config.toml`:
   - Model preferences (e.g., `gpt-4o`, `o1`)
   - Execution policies (strict, permissive, auto-approve)
   - Auto-approve commands for trusted operations
   - MCP servers for external integrations

3. **Sign in to Codex:**

   ```bash
   codex
   # Select "Sign in with ChatGPT" for your Plus/Pro/Team/Edu/Enterprise plan
   ```

## Project Context

The template includes workspace-specific settings that help Codex understand this project:

- **Tech Stack**: Node.js, Next.js, TypeScript, PostgreSQL, Prisma, Express, React Native
- **Architecture**: pnpm monorepo with `apps/api/`, `apps/web/`, `apps/mobile/`, `packages/shared/`
- **Ignore Patterns**: Excludes build artifacts, node_modules, logs

## Usage

### Interactive Mode

```bash
codex
# Or press Ctrl+Shift+C in VS Code
```

### Non-Interactive Mode

```bash
codex exec "implement user authentication"
codex exec --help
```

### VS Code Tasks

- Terminal → Run Task → "Codex: Start"
- Terminal → Run Task → "Codex: Exec (prompt)"

## Documentation

- [Codex Getting Started](https://github.com/openai/codex/blob/main/docs/getting-started.md)
- [Configuration Guide](https://github.com/openai/codex/blob/main/docs/config.md)
- [Execpolicy Quickstart](https://github.com/openai/codex/blob/main/docs/execpolicy.md)
- [Project Quick Reference](../QUICK_REFERENCE.md#codex-cli)

## Notes

- `config.toml` is gitignored to keep personal settings local
- The devcontainer auto-installs Codex CLI via `.devcontainer/postStartCommand.sh`
- Keyboard shortcuts are defined in `.vscode/keybindings.json`
