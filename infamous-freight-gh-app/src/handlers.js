import { assignIssueToCopilot } from "./copilotAssign.js";
import { getInstallationOctokit } from "./githubAppAuth.js";

const TARGET_OWNER = "MrMiless44";
const TARGET_REPO = "Infamous-freight";

function hasLabel(payload, expectedLabel) {
  return (payload.issue?.labels || []).some((label) => {
    if (typeof label === "string") return label === expectedLabel;
    return label?.name === expectedLabel;
  });
}

async function postIssueComment(octokit, { owner, repo, issueNumber, body }) {
  await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: issueNumber,
    body
  });
}

export async function handleWebhookEvent({ event, payload }) {
  const owner = payload.repository?.owner?.login;
  const repo = payload.repository?.name;

  if (owner !== TARGET_OWNER || repo !== TARGET_REPO) return;

  const installationId = payload.installation?.id;
  if (!installationId) return;

  const octokit = await getInstallationOctokit(installationId);

  if (event === "issues") {
    const action = payload.action;
    const issueNumber = payload.issue?.number;

    if (!issueNumber) return;

    const shouldRun =
      (action === "labeled" && payload.label?.name === "copilot-task") ||
      (action === "opened" && hasLabel(payload, "copilot-task"));

    if (!shouldRun) return;

    await postIssueComment(octokit, {
      owner,
      repo,
      issueNumber,
      body:
        "🤖 Auto-orchestrator: assigning this issue to Copilot coding agent. " +
        "CI will gate changes; keep scope tight and follow repo instructions."
    });

    await assignIssueToCopilot({ owner, repo, issueNumber });
    return;
  }

  if (event === "issue_comment") {
    if (payload.action !== "created") return;

    const commentBody = payload.comment?.body || "";
    if (!commentBody.trim().startsWith("/copilot run")) return;

    const authorAssociation = payload.comment?.author_association;
    const isTrustedAuthor =
      authorAssociation === "OWNER" ||
      authorAssociation === "MEMBER" ||
      authorAssociation === "COLLABORATOR";

    if (!isTrustedAuthor) return;

    if (!hasLabel(payload, "copilot-task")) return;
    const issueNumber = payload.issue?.number;
    if (!issueNumber) return;

    await postIssueComment(octokit, {
      owner,
      repo,
      issueNumber,
      body: "✅ /copilot run received. Assigning to Copilot coding agent now."
    });

    await assignIssueToCopilot({ owner, repo, issueNumber });
  }
}
