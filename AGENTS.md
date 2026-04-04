# AGENTS.md

## Environment setup (required before install/build)
For this repository, always initialize the runtime in each new shell session before running `pnpm install` or any `pnpm ... build` command:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.15.0 --activate
node -v
pnpm -v
```

Expected versions:
- `node -v` => `v24.x`
- `pnpm -v` => `10.x` (currently `10.15.0`)
