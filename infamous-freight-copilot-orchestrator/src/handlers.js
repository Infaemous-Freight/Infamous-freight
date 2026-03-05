import { CONFIG } from "./config.js";
import { getInstallationOctokit } from "./githubAppAuth.js";
import { assignIssueToCopilot } from "./copilotAssign.js";

function issueHasLabel(issue, labelName) {
  const labels = issue?.labels || [];
  return labels.some((l) => (typeof l === "string" ? l === labelName : l?.name === labelName));
}

export async function handleWebhookEvent({ event, payload }) {
  const owner = payload.repository?.owner?.login;
  const repo = payload.repository?.name;

  if (owner !== CONFIG.owner || repo !== CONFIG.repo) return;

  const installationId = payload.installation?.id;
  if (!installationId) return;

  const octokit = await getInstallationOctokit(installationId);

  // ---- ISSUES ----
  if (event === "issues") {
    const action = payload.action;
    const issue = payload.issue;
    if (!issue) return;

    const issueNumber = issue.number;

    const labeledCopilotTask =
      action === "labeled" && payload.label?.name === CONFIG.copilotLabel;

    const openedWithLabel =
      action === "opened" && issueHasLabel(issue, CONFIG.copilotLabel);

    if (!labeledCopilotTask && !openedWithLabel) return;

    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: issueNumber,
      body:
        "🤖 Orchestrator: assigning this issue to Copilot coding agent now.\n\n" +
        "- Trigger: `copilot-task` label\n" +
        "- Rule: keep diff minimal, run tests, no new deps."
    });

    const result = await assignIssueToCopilot({ owner, repo, issueNumber });

    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: issueNumber,
      body: `✅ Assigned to Copilot (${result.copilotLogin}). Watch for the PR and iterate via PR comments.`
    });

    return;
  }

  // ---- ISSUE COMMENTS ----
  if (event === "issue_comment") {
    if (payload.action !== "created") return;

    const body = payload.comment?.body || "";
    if (!body.trim().startsWith(CONFIG.runCommand)) return;

    const issue = payload.issue;
    // Ignore comments on pull requests; this handler is for issues only.
    if (!issue || issue.pull_request) return;

    const issueNumber = issue.number;
    if (!issueNumber) return;

    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: issueNumber,
      body: "✅ `/copilot run` received. Assigning to Copilot coding agent."
    });

    const result = await assignIssueToCopilot({ owner, repo, issueNumber });

    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: issueNumber,
      body: `✅ Assigned to Copilot (${result.copilotLogin}).`
    });
  }
}
