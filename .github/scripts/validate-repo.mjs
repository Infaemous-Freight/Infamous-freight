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
const majorFromVersion = (value) => String(value).trim().replace(/^v/, "").split(".")[0];

if (!fs.existsSync(path.join(root, ".nvmrc"))) {
  fail("Missing .nvmrc at repository root.");
}

if (!fs.existsSync(path.join(root, ".tool-versions"))) {
  fail("Missing .tool-versions at repository root.");
}

if (!fs.existsSync(path.join(root, ".python-version"))) {
  fail("Missing .python-version at repository root.");
}

if (!fs.existsSync(path.join(root, "pnpm-lock.yaml"))) {
  fail("Missing pnpm-lock.yaml. Reproducible installs require a committed lockfile.");
}

if (!fs.existsSync(path.join(root, "package.json"))) {
  fail("Missing root package.json.");
}

const nvmrc = readFile(".nvmrc").trim();
const toolVersions = readFile(".tool-versions");
const pythonVersion = readFile(".python-version").trim();
const pkg = readJson("package.json");
const expectedNodeMajor = majorFromVersion(nvmrc);

if (!pkg.packageManager) {
  fail('Root package.json must define "packageManager", for example "pnpm@10.33.0".');
}

if (!String(pkg.packageManager).startsWith("pnpm@")) {
  fail(`Expected packageManager to use pnpm, got: ${pkg.packageManager}`);
}

if (!pkg.engines?.node) {
  fail("Root package.json must define engines.node.");
}

if (!pkg.engines?.pnpm) {
  fail("Root package.json must define engines.pnpm.");
}

const currentNodeMajor = process.versions.node.split(".")[0];

if (expectedNodeMajor !== majorFromVersion(pkg.engines.node)) {
  fail(`Node engine mismatch. .nvmrc=${nvmrc}, package.json engines.node=${pkg.engines.node}.`);
}

const toolVersionLine = (name) =>
  toolVersions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${name} `));

const nodeToolVersion = toolVersionLine("nodejs");
if (!nodeToolVersion) {
  fail('Missing "nodejs" runtime in .tool-versions.');
}

const nodeToolValue = nodeToolVersion.split(/\s+/)[1] ?? "";
if (majorFromVersion(nodeToolValue) !== expectedNodeMajor) {
  fail(`Node version mismatch. .tool-versions nodejs=${nodeToolValue}, .nvmrc=${nvmrc}.`);
}

const pnpmToolVersion = toolVersionLine("pnpm");
if (!pnpmToolVersion) {
  fail('Missing "pnpm" runtime in .tool-versions.');
}

const pnpmToolValue = pnpmToolVersion.split(/\s+/)[1] ?? "";
const packageManagerVersion = String(pkg.packageManager).split("@")[1] ?? "";
if (pnpmToolValue !== packageManagerVersion) {
  fail(
    `pnpm version mismatch. .tool-versions pnpm=${pnpmToolValue}, packageManager=${pkg.packageManager}.`,
  );
}

const pythonToolVersion = toolVersionLine("python");
if (!pythonToolVersion) {
  fail('Missing "python" runtime in .tool-versions.');
}

const pythonToolValue = pythonToolVersion.split(/\s+/)[1] ?? "";
if (majorFromVersion(pythonToolValue) !== majorFromVersion(pythonVersion)) {
  fail(
    `Python version mismatch. .tool-versions python=${pythonToolValue}, .python-version=${pythonVersion}.`,
  );
}

for (const versionFile of [".node-version", "apps/web/.node-version"]) {
  if (!fs.existsSync(path.join(root, versionFile))) {
    continue;
  }

  const fileVersion = readFile(versionFile).trim();
  if (majorFromVersion(fileVersion) !== expectedNodeMajor) {
    fail(`Node version mismatch. ${versionFile}=${fileVersion}, .nvmrc=${nvmrc}.`);
  }
}

for (const netlifyFile of [
  "netlify.toml",
  "apps/web/netlify.toml",
  "apps/web/.netlify/netlify.toml",
]) {
  if (!fs.existsSync(path.join(root, netlifyFile))) {
    continue;
  }

  const match = readFile(netlifyFile).match(/NODE_VERSION\s*=\s*"([^"]+)"/);
  if (match && majorFromVersion(match[1]) !== expectedNodeMajor) {
    fail(`Node version mismatch. ${netlifyFile} NODE_VERSION=${match[1]}, .nvmrc=${nvmrc}.`);
  }
}

if (expectedNodeMajor !== currentNodeMajor) {
  fail(`Node version mismatch. .nvmrc=${nvmrc}, runner node=${process.versions.node}.`);
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
