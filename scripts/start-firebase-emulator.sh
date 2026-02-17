#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v firebase >/dev/null 2>&1; then
  echo "❌ firebase CLI not found."
  echo "Install (workspace-safe): pnpm dlx firebase-tools@latest firebase --version"
  echo "Alternatively, install globally: npm install -g firebase-tools"
  echo "You can also run: ${ROOT_DIR}/scripts/firebase-setup.sh"
  exit 1
fi

if [[ ! -f firebase.json || ! -f .firebaserc ]]; then
  echo "ℹ️  Firebase config files are missing. Running setup first..."
  "${ROOT_DIR}/scripts/firebase-setup.sh"
fi

echo "🚀 Starting Firebase emulators from $ROOT_DIR"
exec firebase emulators:start
