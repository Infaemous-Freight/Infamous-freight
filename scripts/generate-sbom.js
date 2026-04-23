#!/usr/bin/env node
/**
 * generate-sbom.js
 *
 * Reads the root package-lock.json and produces three categorised SBOM views:
 *
 *   sbom/runtime.json        — packages required at runtime (no `dev` flag)
 *   sbom/build-ci.json       — development / build / CI-only packages (`dev: true`)
 *   sbom/license-unknowns.json — any package whose lockfile entry has no `license` field
 *
 * Usage:
 *   node scripts/generate-sbom.js [--output-dir <dir>]
 *
 * The output directory defaults to `sbom/` relative to the repo root.
 * Pass --output-dir /some/path to override.
 *
 * Exit codes:
 *   0 — success (unknown-license report is informational only, not an error)
 *   1 — fatal error (e.g. lockfile not found)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { outputDir: path.join(__dirname, '..', 'sbom') };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--output-dir' && argv[i + 1]) {
      args.outputDir = argv[++i];
    }
  }
  return args;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------------------
// Load lockfile
// ---------------------------------------------------------------------------

const repoRoot = path.join(__dirname, '..');
const lockfilePath = path.join(repoRoot, 'package-lock.json');

if (!fs.existsSync(lockfilePath)) {
  console.error('ERROR: package-lock.json not found at', lockfilePath);
  process.exit(1);
}

const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
const allPackages = lockfile.packages || {};

// ---------------------------------------------------------------------------
// Classify packages
// ---------------------------------------------------------------------------

// Workspace packages are our own source — skip them from the dependency views.
const WORKSPACE_PREFIXES = ['apps/', 'node_modules/@infamous-freight/'];

function isWorkspace(pkgPath) {
  return (
    pkgPath === '' ||
    WORKSPACE_PREFIXES.some((prefix) => pkgPath.startsWith(prefix))
  );
}

const runtime = [];
const buildCi = [];
const licenseUnknowns = [];

for (const [pkgPath, info] of Object.entries(allPackages)) {
  if (isWorkspace(pkgPath)) continue;

  // Strip the leading `node_modules/` to get a clean package name
  const name = pkgPath.replace(/^node_modules\//, '');
  const version = info.version || '';
  const license = info.license || null;
  const resolved = info.resolved || null;
  const isDev = info.dev === true;

  const entry = { name, version, license, resolved, dev: isDev };

  if (isDev) {
    buildCi.push(entry);
  } else {
    runtime.push(entry);
  }

  if (!license) {
    licenseUnknowns.push({
      name,
      version,
      resolved,
      category: isDev ? 'build-ci' : 'runtime',
      triageStatus: 'needs-review',
    });
  }
}

// Sort all views alphabetically by package name
const byName = (a, b) => a.name.localeCompare(b.name);
runtime.sort(byName);
buildCi.sort(byName);
licenseUnknowns.sort(byName);

// ---------------------------------------------------------------------------
// Build output documents
// ---------------------------------------------------------------------------

const generatedAt = new Date().toISOString();

const runtimeDoc = {
  _meta: {
    description: 'Runtime application dependencies — packages that ship with or directly support the running API or web application.',
    generatedAt,
    lockfileVersion: lockfile.lockfileVersion,
    sourcePackageCount: runtime.length,
  },
  packages: runtime,
};

const buildCiDoc = {
  _meta: {
    description: 'Build / CI / development-only dependencies — packages used only to compile, test, lint, or deploy.',
    generatedAt,
    lockfileVersion: lockfile.lockfileVersion,
    sourcePackageCount: buildCi.length,
  },
  packages: buildCi,
};

const licenseUnknownsDoc = {
  _meta: {
    description: 'Packages whose lockfile entry contains no `license` field. Each entry must be manually triaged per docs/SBOM-POLICY.md §5.',
    generatedAt,
    lockfileVersion: lockfile.lockfileVersion,
    unresolvedCount: licenseUnknowns.length,
  },
  packages: licenseUnknowns,
};

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const { outputDir } = parseArgs(process.argv);
ensureDir(outputDir);

const runtimePath = path.join(outputDir, 'runtime.json');
const buildCiPath = path.join(outputDir, 'build-ci.json');
const unknownsPath = path.join(outputDir, 'license-unknowns.json');

writeJson(runtimePath, runtimeDoc);
writeJson(buildCiPath, buildCiDoc);
writeJson(unknownsPath, licenseUnknownsDoc);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('SBOM generation complete.');
console.log(`  Runtime packages   : ${runtime.length}  → ${runtimePath}`);
console.log(`  Build/CI packages  : ${buildCi.length}  → ${buildCiPath}`);
console.log(`  Missing-license    : ${licenseUnknowns.length}  → ${unknownsPath}`);

if (licenseUnknowns.length > 0) {
  console.log('\nPackages with no license metadata in lockfile (triage required):');
  licenseUnknowns.forEach((p) => {
    console.log(`  [${p.category}] ${p.name}@${p.version}`);
  });
  console.log('\nSee docs/SBOM-POLICY.md §5 and docs/SBOM-LICENSE-TRIAGE.md for triage outcomes.');
}
