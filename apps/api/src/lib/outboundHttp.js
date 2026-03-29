const dns = require("node:dns").promises;
const net = require("node:net");
const { env } = require("../config/env");

const DEFAULT_ALLOWLIST = env.outboundHttpAllowlist?.length
  ? env.outboundHttpAllowlist
  : ["api.open-meteo.com", "open-meteo.com", "hooks.slack.com"];
const BLOCK_PRIVATE = env.outboundHttpBlockPrivate !== false;
const DEFAULT_TIMEOUT_MS = env.outboundHttpTimeoutMs || 8000;

function isPrivateIp(ip) {
  if (!ip) return false;
  if (ip === "127.0.0.1" || ip === "::1") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("169.254.")) return true; // link-local
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // unique local IPv6
  if (ip.startsWith("fe80")) return true; // link-local IPv6
  return false;
}

function hostAllowed(hostname) {
  return DEFAULT_ALLOWLIST.some((allowed) => {
    const normalized = allowed.trim().toLowerCase();
    if (!normalized) return false;
    if (hostname === normalized) return true;
    return hostname.endsWith(`.${normalized}`);
  });
}

async function resolveAddresses(hostname) {
  try {
    const records = await dns.lookup(hostname, { all: true });
    return records.map((record) => record.address).filter(Boolean);
  } catch (error) {
    throw new Error(`DNS resolution failed for ${hostname}: ${error.message}`, { cause: error });
  }
}

async function assertSafeDestination(parsedUrl) {
  if (!parsedUrl?.protocol || !["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Blocked outbound request: protocol must be http or https");
  }
  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("Blocked outbound request: credentials in URL are not allowed");
  }

  const hostname = parsedUrl.hostname?.toLowerCase();
  if (!hostname) {
    throw new Error("Blocked outbound request: hostname missing");
  }

  if (!hostAllowed(hostname)) {
    throw new Error(`Blocked outbound request: host ${hostname} is not in allowlist`);
  }

  if (!BLOCK_PRIVATE) return;

  // If hostname is already an IP, check directly; otherwise resolve all A/AAAA
  const ipType = net.isIP(hostname);
  const addresses = ipType ? [hostname] : await resolveAddresses(hostname);
  const privateIp = addresses.find((addr) => isPrivateIp(addr));
  if (privateIp) {
    throw new Error(`Blocked outbound request: resolved to private address ${privateIp}`);
  }
}

function buildSignal(userSignal, controller) {
  if (!userSignal) return controller.signal;
  if (userSignal.aborted) {
    controller.abort(userSignal.reason);
    return controller.signal;
  }
  const abortListener = () => controller.abort(userSignal.reason);
  userSignal.addEventListener("abort", abortListener, { once: true });
  return controller.signal;
}

async function safeFetch(url, options = {}) {
  const parsedUrl = typeof url === "string" ? new URL(url) : url;
  await assertSafeDestination(parsedUrl);

  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: userSignal, ...rest } = options;
  const controller = new AbortController();
  const signal = buildSignal(userSignal, controller);

  const timeout = setTimeout(() => {
    controller.abort(new Error("Outbound request timed out"));
  }, timeoutMs);

  try {
    const response = await fetch(parsedUrl, {
      redirect: rest.redirect || "error",
      ...rest,
      signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function getOutboundAllowlist() {
  return [...DEFAULT_ALLOWLIST];
}

module.exports = {
  safeFetch,
  getOutboundAllowlist,
  isPrivateIp,
};
