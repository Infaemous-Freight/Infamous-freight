#!/usr/bin/env bash
set -euo pipefail

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks not installed; skipping local secret scan." >&2
  echo "Install: https://github.com/gitleaks/gitleaks#installing" >&2
  exit 0
fi

echo "Running gitleaks pre-commit scan..."
gitleaks protect --staged --verbose
