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

const toolVersionEntries = new Map();
for (const rawLine of toolVersions.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) {
    continue;
  }

  const [name, value] = line.split(/\s+/);
  if (name && value) {
    toolVersionEntries.set(name, value);
  }
}

const nodeToolValue = toolVersionEntries.get("nodejs");
if (!nodeToolValue) {
  fail('Missing "nodejs" runtime in .tool-versions.');
}

if (majorFromVersion(nodeToolValue) !== expectedNodeMajor) {
  fail(`Node version mismatch. .tool-versions nodejs=${nodeToolValue}, .nvmrc=${nvmrc}.`);
}

const pnpmToolValue = toolVersionEntries.get("pnpm");
if (!pnpmToolValue) {
  fail('Missing "pnpm" runtime in .tool-versions.');
}

const packageManagerVersion = String(pkg.packageManager).split("@")[1] ?? "";
if (pnpmToolValue !== packageManagerVersion) {
  fail(
    `pnpm version mismatch. .tool-versions pnpm=${pnpmToolValue}, packageManager=${pkg.packageManager}.`,
  );
}

const pythonToolValue = toolVersionEntries.get("python");
if (!pythonToolValue) {
  fail('Missing "python" runtime in .tool-versions.');
}

if (majorFromVersion(pythonToolValue) !== majorFromVersion(pythonVersion)) {
  fail(
    `Python version mismatch. .tool-versions python=${pythonToolValue}, .python-version=${pythonVersion}.`,
  );
}

if (fs.existsSync(path.join(root, "ai/Dockerfile"))) {
  const aiDockerfile = readFile("ai/Dockerfile");
  const pythonBaseImage = aiDockerfile.match(/FROM\s+python:(\d+(?:\.\d+)?)/i)?.[1];
  if (pythonBaseImage && majorFromVersion(pythonBaseImage) !== majorFromVersion(pythonVersion)) {
    fail(
      `Python version mismatch. ai/Dockerfile python=${pythonBaseImage}, .python-version=${pythonVersion}.`,
    );
  }
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

if (fs.existsSync(path.join(root, "fly.toml"))) {
  const rootFlyToml = readFile("fly.toml");
  const rootBuildContext = rootFlyToml.match(/^\s*context\s*=\s*"([^"]+)"/m)?.[1];
  const rootDockerfile = rootFlyToml.match(/^\s*dockerfile\s*=\s*"([^"]+)"/m)?.[1];

  if (rootBuildContext && rootBuildContext !== ".") {
    fail(`fly.toml build.context must be "." for root API deploys.`);
  }

  if (rootDockerfile && rootDockerfile !== "Dockerfile.api") {
    fail(`fly.toml build.dockerfile must be "Dockerfile.api".`);
  }
}

if (fs.existsSync(path.join(root, ".devcontainer/Dockerfile"))) {
  const devcontainerDockerfile = readFile(".devcontainer/Dockerfile");
  const devcontainerNode = devcontainerDockerfile.match(/javascript-node:1-(\d+)-bookworm/i)?.[1];
  if (devcontainerNode && devcontainerNode !== expectedNodeMajor) {
    fail(
      `Node version mismatch. .devcontainer/Dockerfile javascript-node:1-${devcontainerNode}-bookworm, .nvmrc=${nvmrc}.`,
    );
  }

  const dockerfilePnpm = devcontainerDockerfile.match(/corepack prepare pnpm@([^\s]+)\s+--activate/i)?.[1];
  const packageManagerVersion = String(pkg.packageManager).split("@")[1] ?? "";
  if (dockerfilePnpm && dockerfilePnpm !== packageManagerVersion) {
    fail(
      `pnpm version mismatch. .devcontainer/Dockerfile pnpm=${dockerfilePnpm}, packageManager=${pkg.packageManager}.`,
    );
  }
}

if (fs.existsSync(path.join(root, ".devcontainer/init.sh"))) {
  const devcontainerInit = readFile(".devcontainer/init.sh");
  const initPnpmVersions = [...devcontainerInit.matchAll(/pnpm@([0-9.]+)/g)].map((m) => m[1]);
  const packageManagerVersion = String(pkg.packageManager).split("@")[1] ?? "";
  for (const initPnpmVersion of initPnpmVersions) {
    if (initPnpmVersion !== packageManagerVersion) {
      fail(
        `pnpm version mismatch. .devcontainer/init.sh pnpm=${initPnpmVersion}, packageManager=${pkg.packageManager}.`,
      );
    }
  }
}

if (fs.existsSync(path.join(root, "apps/web/fly.toml"))) {
  const webFlyToml = readFile("apps/web/fly.toml");
  const rootFlyToml = fs.existsSync(path.join(root, "fly.toml")) ? readFile("fly.toml") : "";
  const topWebFlyToml = fs.existsSync(path.join(root, "fly.web.toml")) ? readFile("fly.web.toml") : "";

  const webAppMatch = webFlyToml.match(/^\s*app\s*=\s*['"]([^'"]+)['"]/m);
  const rootAppMatch = rootFlyToml.match(/^\s*app\s*=\s*['"]([^'"]+)['"]/m);
  if (webAppMatch && rootAppMatch && webAppMatch[1] === rootAppMatch[1]) {
    fail(
      `apps/web/fly.toml app (${webAppMatch[1]}) must differ from root fly.toml app (${rootAppMatch[1]}).`,
    );
  }
  const topWebAppMatch = topWebFlyToml.match(/^\s*app\s*=\s*['"]([^'"]+)['"]/m);
  if (webAppMatch && topWebAppMatch && webAppMatch[1] !== topWebAppMatch[1]) {
    fail(
      `apps/web/fly.toml app (${webAppMatch[1]}) must match fly.web.toml app (${topWebAppMatch[1]}).`,
    );
  }

  const contextMatch = webFlyToml.match(/^\s*context\s*=\s*"([^"]+)"/m);
  if (contextMatch && contextMatch[1] !== "../..") {
    fail(`apps/web/fly.toml build.context must be \"../..\" for monorepo Docker builds.`);
  }

  const dockerfileMatch = webFlyToml.match(/^\s*dockerfile\s*=\s*"([^"]+)"/m);
  if (dockerfileMatch && dockerfileMatch[1] !== "apps/web/Dockerfile") {
    fail(`apps/web/fly.toml build.dockerfile must be \"apps/web/Dockerfile\".`);
  }
}

if (expectedNodeMajor !== currentNodeMajor) {
  warn(
    `Node runtime mismatch for this shell. .nvmrc=${nvmrc}, runner node=${process.versions.node}. Use nvm before pnpm install/build commands.`,
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
