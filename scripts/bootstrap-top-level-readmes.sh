#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

create_readme_if_missing() {
  local dir="$1"
  local file="$dir/README.md"

  if [[ ! -d "$dir" ]]; then
    return 0
  fi

  if [[ -f "$file" ]]; then
    echo "Keeping existing $file"
    return 0
  fi

  cat > "$file" <<MARKER
# $(basename "$dir")

## Purpose
TODO

## Owns
TODO

## Does not own
TODO

## Runbook / entrypoints
TODO

## Owner
TODO
MARKER

  echo "Created $file"
}

for dir in \
  ai \
  @compliance \
  compliance \
  docker \
  deploy \
  infrastructure \
  k6 \
  monitoring \
  observability \
  ops \
  payments \
  services \
  tests \
  e2e \
  Infamous-Freight-Firebase-Studio \
  infamous-freight-copilot-orchestrator \
  infamous-freight-gh-app \
  my-neon-app

do
  create_readme_if_missing "$dir"
done
