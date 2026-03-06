#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_READMES = [
  "ai/README.md",
  "@compliance/README.md",
  "compliance/README.md",
  "docker/README.md",
  "deploy/README.md",
  "infrastructure/README.md",
  "k6/README.md",
  "monitoring/README.md",
  "observability/README.md",
  "ops/README.md",
  "payments/README.md",
  "services/README.md",
];

let failed = false;

for (const rel of REQUIRED_READMES) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(path.dirname(abs)) && !fs.existsSync(abs)) {
    console.error(`❌ Missing required README: ${rel}`);
    failed = true;
  } else if (fs.existsSync(abs)) {
    console.log(`✅ ${rel}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log("README coverage check passed.");
