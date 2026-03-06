#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const ROOT = process.cwd();

const ALLOWED_TOP_LEVEL = new Set([
  ".codex",
  ".devcontainer",
  ".github",
  ".gitignore",
  ".gitleaks.toml",
  ".husky",
  ".npmrc",
  ".nvmrc",
  ".prettierignore",
  ".prettierrc",
  ".security",
  ".vscode",
  "@compliance",
  "ARCHITECTURE.md",
  "CONSOLIDATION_PLAN.md",
  "LICENSE",
  "OWNERSHIP.md",
  "README.md",
  "REPO_MAP.md",
  "ai",
  "apps",
  "compliance",
  "configs",
  "deploy",
  "docker",
  "docs",
  "e2e",
  "eslint-rules",
  "examples",
  "infrastructure",
  "k6",
  "k8s",
  "load-tests",
  "media",
  "monitoring",
  "nginx",
  "observability",
  "ops",
  "package.json",
  "packages",
  "payments",
  "plugins",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "public",
  "scripts",
  "services",
  "supabase",
  "terraform",
  "tests",
  "tools",
  "tsconfig.json",
  "validation-data",
  "Infamous-Freight-Firebase-Studio",
  "infamous-freight-copilot-orchestrator",
  "infamous-freight-gh-app",
  "my-neon-app",
]);

const README_REQUIRED_DIRS = [
  "ai",
  "@compliance",
  "compliance",
  "deploy",
  "docker",
  "infrastructure",
  "k6",
  "load-tests",
  "monitoring",
  "observability",
  "ops",
  "payments",
  "services",
  "tests",
  "e2e",
  "Infamous-Freight-Firebase-Studio",
  "infamous-freight-copilot-orchestrator",
  "infamous-freight-gh-app",
  "my-neon-app",
];

const OWNERSHIP_REQUIRED_DIRS = [
  "apps",
  "packages",
  "ai",
  "@compliance",
  "compliance",
  "docker",
  "deploy",
  "infrastructure",
  "k8s",
  "terraform",
  "nginx",
  "supabase",
  "monitoring",
  "observability",
  "ops",
  "tests",
  "e2e",
  "k6",
  "load-tests",
  "payments",
  "services",
  "configs",
  "scripts",
  "plugins",
  "eslint-rules",
  "Infamous-Freight-Firebase-Studio",
  "infamous-freight-copilot-orchestrator",
  "infamous-freight-gh-app",
  "my-neon-app",
];

const DEPRECATED_ROOTS = {
  compliance: "@compliance",
  "load-tests": "k6",
};

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function listTopLevel() {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .map((d) => d.name)
    .filter((name) => name !== ".git");
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function checkAllowedTopLevel() {
  const entries = listTopLevel();
  const unknown = entries.filter((name) => !ALLOWED_TOP_LEVEL.has(name));

  if (unknown.length > 0) {
    fail(
      `Unknown top-level entries detected: ${unknown.join(
        ", ",
      )}. Update scripts/repo-structure-check.mjs, OWNERSHIP.md, and REPO_MAP.md before adding new roots.`,
    );
  } else {
    pass("No unexpected top-level roots found");
  }
}

function checkReadmes() {
  for (const dir of README_REQUIRED_DIRS) {
    if (!exists(dir)) continue;

    const readme = path.join(dir, "README.md");
    if (!exists(readme)) {
      fail(`Missing required README: ${readme}`);
    } else {
      pass(`README present: ${readme}`);
    }
  }
}

function checkOwnership() {
  if (!exists("OWNERSHIP.md")) {
    fail("OWNERSHIP.md is missing");
    return;
  }

  const ownership = readText("OWNERSHIP.md");

  for (const dir of OWNERSHIP_REQUIRED_DIRS) {
    if (!exists(dir)) continue;

    if (!ownership.includes(`\`${dir}\``) && !ownership.includes(`- \`${dir}`)) {
      fail(`OWNERSHIP.md does not mention required root: ${dir}`);
    } else {
      pass(`Ownership documented: ${dir}`);
    }
  }
}

function gitChangedFiles() {
  try {
    const out = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function checkDeprecatedRootsUsage() {
  const changed = gitChangedFiles();
  if (changed.length === 0) {
    pass("No staged changes to deprecated roots");
    return;
  }

  for (const [deprecatedRoot, targetRoot] of Object.entries(DEPRECATED_ROOTS)) {
    const violating = changed.filter((file) => file.startsWith(`${deprecatedRoot}/`));
    if (violating.length > 0) {
      fail(
        `Deprecated root "${deprecatedRoot}" has staged changes: ${violating.join(
          ", ",
        )}. Move new work to "${targetRoot}" or update the consolidation plan intentionally.`,
      );
    } else {
      pass(`No staged changes in deprecated root: ${deprecatedRoot}`);
    }
  }
}

function main() {
  console.log("==> Repository structure check");
  checkAllowedTopLevel();
  checkReadmes();
  checkOwnership();
  checkDeprecatedRootsUsage();

  if (process.exitCode && process.exitCode !== 0) {
    console.error("Repository structure check failed.");
    process.exit(process.exitCode);
  }

  console.log("Repository structure check passed.");
}

main();
