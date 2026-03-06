#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

mkdir -p docs

write_readme_if_missing() {
  local dir="$1"
  local file="$dir/README.md"

  if [[ -f "$file" ]]; then
    echo "Keeping existing $file"
    return 0
  fi

  cat > "$file" <<EOF2
# $(basename "$dir")

TODO: document the purpose, ownership, entrypoints, runtime expectations, and operational rules for \`$dir\`.
EOF2

  echo "Created $file"
}

for dir in \
  ai \
  @compliance \
  compliance \
  docker \
  deploy \
  infrastructure \
  k8s \
  terraform \
  nginx \
  supabase \
  monitoring \
  observability \
  ops \
  tests \
  e2e \
  k6 \
  load-tests \
  services \
  payments \
  configs \
  scripts \
  plugins \
  examples \
  media \
  Infamous-Freight-Firebase-Studio \
  infamous-freight-copilot-orchestrator \
  infamous-freight-gh-app \
  my-neon-app
do
  if [[ -d "$dir" ]]; then
    write_readme_if_missing "$dir"
  fi
done
