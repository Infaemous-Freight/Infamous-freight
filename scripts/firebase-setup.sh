#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v firebase >/dev/null 2>&1; then
  echo "❌ firebase CLI not found. Install it with: pnpm add -g firebase-tools"
  echo "   or: npm install -g firebase-tools"
  exit 1
fi

if [[ ! -f firebase.json ]]; then
  echo "⚠️  firebase.json not found in repo root: $ROOT_DIR"
  echo "Creating a minimal local emulator config..."
  cat > firebase.json <<'JSON'
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true, "port": 4001 }
  }
}
JSON
fi

if [[ ! -f .firebaserc ]]; then
  echo "⚠️  .firebaserc not found in repo root: $ROOT_DIR"
  echo "Creating local-only Firebase project alias..."
  cat > .firebaserc <<'JSON'
{
  "projects": {
    "default": "demo-infamous-freight"
  }
}
JSON
fi

echo "✅ Firebase local emulator configuration ready."
echo "Run: ./scripts/start-firebase-emulator.sh"
