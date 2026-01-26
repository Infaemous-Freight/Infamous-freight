import { execSync } from "node:child_process";
import fs from "node:fs";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
}

function lastTag() {
  try {
    return sh("git describe --tags --abbrev=0");
  } catch {
    return null;
  }
}

function commitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  return sh(`git log ${range} --pretty=%s%n%b---END---`)
    .split("---END---")
    .map((s) => s.trim())
    .filter(Boolean);
}

function bumpType(messages) {
  const joined = messages.join("\n");
  if (/BREAKING CHANGE/i.test(joined) || /!:/g.test(joined)) return "major";
  if (messages.some((m) => /^feat(\(.+\))?:/i.test(m))) return "minor";
  return "patch";
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Invalid version: ${version}`);
  return { major: +match[1], minor: +match[2], patch: +match[3] };
}

function nextVersion(current, type) {
  const v = parseVersion(current);
  if (type === "major") return `${v.major + 1}.0.0`;
  if (type === "minor") return `${v.major}.${v.minor + 1}.0`;
  return `${v.major}.${v.minor}.${v.patch + 1}`;
}

const pkgPath = "package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const current = (pkg.version || "0.1.0").replace(/^v/, "");

const tag = lastTag();
const messages = commitsSince(tag);
const type = bumpType(messages);
const next = nextVersion(current, type);

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log(`Bumped version ${current} -> ${next} (${type})`);
