#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

mkdir -p docs/engineering

KEEP_FILES=(
  ".github/CODEOWNERS"
  ".github/CONTRIBUTING.md"
  ".github/README.md"
  ".github/SECURITY.md"
  ".github/dependabot.yml"
  ".github/codeql-config.yml"
  ".github/pull_request_template.md"
  ".github/branch-protection-rules.json"
  ".github/copilot-instructions.md"
  ".github/AGENTS.md"
)

is_keep_file() {
  local candidate="$1"
  for item in "${KEEP_FILES[@]}"; do
    if [[ "$candidate" == "$item" ]]; then
      return 0
    fi
  done
  return 1
}

find .github -maxdepth 1 -type f \( -name "*.md" -o -name "*.txt" \) | while read -r file; do
  if is_keep_file "$file"; then
    echo "Keeping $file"
    continue
  fi

  target="docs/engineering/$(basename "$file")"
  if [[ -e "$target" ]]; then
    echo "Skipping $file because $target already exists"
    continue
  fi

  echo "Moving $file -> $target"
  git mv "$file" "$target"
done

echo "✅ Cleanup complete"
