# Required Local CLIs

Infamous Freight deployment, validation, and operations scripts expect these CLIs to be available:

- `flyctl`
- `supabase`
- `stripe`
- `gh` (GitHub CLI)
- `netlify`
- `docker`

Recommended (installed by bootstrap when missing):

- `jq`

> Note: automatic `jq` bootstrap install currently targets Linux runners/workstations.

## Install

From the repository root:

```bash
pnpm run tools:install
```

`tools:install` is an alias for the canonical setup command:

```bash
pnpm run setup:clis
```

The installer writes local binaries to:

```text
.tools/bin
```

## Add `.tools/bin` to PATH

If the installer prints a command like this, run it before continuing:

```bash
export PATH=".tools/bin:$PATH"
```

For a persistent setup, add the absolute repo path to your shell profile, for example:

```bash
export PATH="/path/to/Infamous-freight/.tools/bin:$PATH"
```

Other repo scripts use `command -v` to locate these tools, so the binaries must either be globally installed or available in `.tools/bin`.

## Verify

```bash
pnpm run tools:verify
```

Expected result:

```text
All required Infamous Freight tools are installed.
```

If any tool is missing, rerun:

```bash
pnpm run tools:install
```
