const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const GITHUB_API_URL = "https://api.github.com";

const processedDeliveries = new Map();
const DELIVERY_TTL_MS = 1000 * 60 * 60;
const DELIVERY_CACHE_MAX = 2000;

function verifyGithubSignature(rawBody, signature, secret) {
  if (!Buffer.isBuffer(rawBody) || !signature || !secret) {
    return false;
  }

  const digest = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  return (
    signatureBuffer.length === digestBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, digestBuffer)
  );
}

function pruneProcessedDeliveries(now = Date.now()) {
  for (const [id, ts] of processedDeliveries.entries()) {
    if (now - ts > DELIVERY_TTL_MS) {
      processedDeliveries.delete(id);
    }
  }

  if (processedDeliveries.size > DELIVERY_CACHE_MAX) {
    const entries = Array.from(processedDeliveries.entries()).sort((a, b) => a[1] - b[1]);
    const overflow = processedDeliveries.size - DELIVERY_CACHE_MAX;
    for (let i = 0; i < overflow; i += 1) {
      processedDeliveries.delete(entries[i][0]);
    }
  }
}

function markDeliveryProcessed(deliveryId) {
  if (!deliveryId) {
    return false;
  }

  const alreadySeen = processedDeliveries.has(deliveryId);
  processedDeliveries.set(deliveryId, Date.now());
  pruneProcessedDeliveries();
  return alreadySeen;
}

function shouldAssignCopilot({ event, action, payload }) {
  if (!payload?.repository?.name || !payload?.repository?.full_name) {
    return false;
  }

  const repoName = payload.repository.name.toLowerCase();
  const repoFullName = payload.repository.full_name.toLowerCase();
  const scopeLock = (process.env.GITHUB_AUTOPILOT_REPO_ALLOWLIST || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (scopeLock.length > 0 && !scopeLock.includes(repoName) && !scopeLock.includes(repoFullName)) {
    return false;
  }

  if (event === "issues" && ["opened", "labeled", "edited", "reopened"].includes(action)) {
    const labels = payload.issue?.labels || [];
    return labels.some((label) => label?.name?.toLowerCase() === "copilot-task");
  }

  if (event === "issue_comment" && action === "created") {
    const body = payload.comment?.body || "";
    return body.trim().toLowerCase().startsWith("/copilot run");
  }

  return false;
}

function createGithubAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY_PEM;

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    },
    privateKey,
    { algorithm: "RS256" },
  );
}

async function createInstallationToken(installationId) {
  const appJwt = createGithubAppJwt();
  const response = await axios.post(
    `${GITHUB_API_URL}/app/installations/${installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      timeout: 10000,
    },
  );

  return response.data.token;
}

async function githubRequest(token, method, path, data) {
  const response = await axios({
    method,
    url: `${GITHUB_API_URL}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "infamous-freight-github-app",
    },
    data,
    timeout: 10000,
  });

  return response.data;
}

function detectCopilotAssignee(assignees) {
  return assignees.find((assignee) => {
    const login = assignee?.login?.toLowerCase() || "";
    const isCopilotLogin =
      login === "github-copilot[bot]" ||
      login === "github-copilot" ||
      login.includes("copilot");
    return isCopilotLogin;
  });
}

async function assignCopilotToIssue(payload) {
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const issueNumber = payload.issue.number;
  const installationId = payload.installation?.id;

  if (!installationId) {
    throw new Error("Missing installation.id in webhook payload");
  }

  const token = await createInstallationToken(installationId);

  const assignees = await githubRequest(token, "get", `/repos/${owner}/${repo}/assignees`);
  const copilot = detectCopilotAssignee(assignees);
  if (!copilot?.login) {
    throw new Error("Copilot assignee could not be found in repository assignees");
  }

  await githubRequest(token, "post", `/repos/${owner}/${repo}/issues/${issueNumber}/assignees`, {
    assignees: [copilot.login],
  });

  await githubRequest(token, "post", `/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    body: [
      "Assigned to Copilot coding agent via GitHub App automation.",
      "",
      "Use `/copilot run` to re-trigger assignment if needed.",
    ].join("\n"),
  });

  return { copilotLogin: copilot.login };
}

module.exports = {
  assignCopilotToIssue,
  markDeliveryProcessed,
  shouldAssignCopilot,
  verifyGithubSignature,
};
