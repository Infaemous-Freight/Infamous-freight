#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const fail = (message) => {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
};

const warn = (message) => {
  console.warn(`\n⚠️ ${message}\n`);
};

const root = process.cwd();

const readFile = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readJson = (file) => JSON.parse(readFile(file));

if (!fs.existsSync(path.join(root, ".nvmrc"))) {
  fail("Missing .nvmrc at repository root.");
}

if (!fs.existsSync(path.join(root, "pnpm-lock.yaml"))) {
  fail("Missing pnpm-lock.yaml. Reproducible installs require a committed lockfile.");
}

if (!fs.existsSync(path.join(root, "package.json"))) {
  fail("Missing root package.json.");
}

const nvmrc = readFile(".nvmrc").trim();
const pkg = readJson("package.json");

if (!pkg.packageManager) {
  fail('Root package.json must define "packageManager", for example "pnpm@9.15.0".');
}

if (!String(pkg.packageManager).startsWith("pnpm@")) {
  fail(`Expected packageManager to use pnpm, got: ${pkg.packageManager}`);
}

if (!pkg.engines?.node) {
  fail('Root package.json must define engines.node.');
}

if (!pkg.engines?.pnpm) {
  fail('Root package.json must define engines.pnpm.');
}

const nodeMajorFromNvmrc = nvmrc.replace(/^v/, "").split(".")[0];
const currentNodeMajor = process.versions.node.split(".")[0];

if (nodeMajorFromNvmrc !== currentNodeMajor) {
  fail(
    `Node version mismatch. .nvmrc=${nvmrc}, runner node=${process.versions.node}.`
  );
}

const requiredScripts = ["lint", "typecheck", "test", "build"];
for (const script of requiredScripts) {
  if (!pkg.scripts?.[script]) {
    fail(`Root package.json is missing required script: ${script}`);
  }
}

const expectedDirs = ["apps", "packages", ".github"];
for (const dir of expectedDirs) {
  if (!fs.existsSync(path.join(root, dir))) {
    warn(`Expected directory not found: ${dir}`);
  }
}

console.log("✅ Repository validation passed.");
