#!/usr/bin/env bash
# Infamous Freight — SBOM generation script
#
# Follows the policy defined in docs/SBOM-POLICY.md.
#
# Usage:
#   ./scripts/generate-sbom.sh [output-dir]
#
# Default output-dir: sbom/ at the repo root.
#
# Outputs:
#   sbom/sbom-full.spdx.json      raw SPDX SBOM (all packages)
#   sbom/runtime-direct.txt       runtime direct dependency names
#   sbom/buildci-direct.txt       build/CI/dev direct dependency names
#   sbom/license-unknowns.txt     packages with NOASSERTION or missing license
#
# Requirements:
#   - Node >= 20 and npm >= 10  (for `npm sbom --sbom-format spdx`)
#   - jq                         (for license-unknowns extraction; optional)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$REPO_ROOT/sbom}"
SBOM_FILE="$OUT_DIR/sbom-full.spdx.json"

echo "=== Infamous Freight SBOM generation ==="
echo "Repo root : $REPO_ROOT"
echo "Output    : $OUT_DIR"
echo ""

mkdir -p "$OUT_DIR"
cd "$REPO_ROOT"

# ── Step 1: Generate full SPDX SBOM ─────────────────────────────────────────
echo "[1/4] Generating full SPDX SBOM..."
npm sbom --sbom-format spdx --json > "$SBOM_FILE"
echo "  Written: $SBOM_FILE"
if command -v jq >/dev/null 2>&1; then
  TOTAL=$(jq '.packages | length' "$SBOM_FILE")
else
  TOTAL=$(node -e 'const fs = require("fs"); const sbom = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.stdout.write(String(Array.isArray(sbom.packages) ? sbom.packages.length : 0));' "$SBOM_FILE")
fi
echo "  Total packages in SBOM: $TOTAL"
echo ""

# ── Step 2: Collect runtime direct dependencies ──────────────────────────────
echo "[2/4] Collecting runtime direct dependencies..."
RUNTIME_FILE="$OUT_DIR/runtime-direct.txt"
node - "$REPO_ROOT" "$RUNTIME_FILE" <<'EOF'
const fs = require('fs');
const [,, repoRoot, outFile] = process.argv;
const workspaces = ['apps/api', 'apps/web'];
const names = new Set();
for (const ws of workspaces) {
  try {
    const pkg = JSON.parse(fs.readFileSync(`${repoRoot}/${ws}/package.json`, 'utf8'));
    for (const name of Object.keys(pkg.dependencies || {})) names.add(name);
  } catch { /* skip missing workspace */ }
}
fs.writeFileSync(outFile, [...names].sort().join('\n') + '\n');
process.stdout.write(`  Runtime direct deps: ${names.size}\n`);
EOF
echo "  Written: $RUNTIME_FILE"
echo ""

# ── Step 3: Collect build/CI/dev direct dependencies ────────────────────────
echo "[3/4] Collecting build/CI/dev direct dependencies..."
BUILDCI_FILE="$OUT_DIR/buildci-direct.txt"
node - "$REPO_ROOT" "$BUILDCI_FILE" <<'EOF'
const fs = require('fs');
const [,, repoRoot, outFile] = process.argv;
const workspaces = ['apps/api', 'apps/web'];
const names = new Set();
for (const ws of workspaces) {
  try {
    const pkg = JSON.parse(fs.readFileSync(`${repoRoot}/${ws}/package.json`, 'utf8'));
    for (const name of Object.keys(pkg.devDependencies || {})) names.add(name);
  } catch { /* skip missing workspace */ }
}
fs.writeFileSync(outFile, [...names].sort().join('\n') + '\n');
process.stdout.write(`  Build/CI direct deps: ${names.size}\n`);
EOF
echo "  Written: $BUILDCI_FILE"
echo ""

# ── Step 4: Flag NOASSERTION / missing license entries ──────────────────────
echo "[4/4] Checking for NOASSERTION / unknown licenses..."
if command -v jq &>/dev/null; then
  UNKNOWNS_FILE="$OUT_DIR/license-unknowns.txt"
  jq -r '
    .packages[]
    | select(
        (.licenseConcluded == "NOASSERTION"
         or .licenseConcluded == null
         or .licenseConcluded == "")
        and .name != "NOASSERTION"
        and (.name | startswith("SPDXRef-") | not)
      )
    | "\(.name)@\(.versionInfo // "unknown")  license=\(.licenseConcluded // "MISSING")"
  ' "$SBOM_FILE" | sort -u > "$UNKNOWNS_FILE"
  COUNT=$(wc -l < "$UNKNOWNS_FILE" | tr -d ' ')
  echo "  Packages with unknown/missing license: $COUNT"
  echo "  Written: $UNKNOWNS_FILE"
  if [ "$COUNT" -gt 0 ]; then
    echo ""
    echo "  NOTE: Review these entries against docs/SBOM-LICENSE-TRIAGE.md"
    echo "        before marking a review complete."
  fi
else
  echo "  jq not found — skipping license-unknown extraction."
  echo "  Install jq and re-run, or inspect sbom-full.spdx.json manually."
fi

echo ""
echo "=== Done ==="
echo "Review outputs in: $OUT_DIR"
echo "See docs/SBOM-POLICY.md §9 for the pre-close checklist."
