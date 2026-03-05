import { CONFIG } from "./config.js";
import { getInstallationOctokit } from "./githubAppAuth.js";
import { assignIssueToCopilot } from "./copilotAssign.js";
import { auditLog } from "./audit.js";

function issueHasLabel(issue, labelName) {
  const labels = issue?.labels || [];
  return labels.some((l) => (typeof l === "string" ? l === labelName : l?.name === labelName));
}

function isTargetRepo(payload) {
  const owner = payload.repository?.owner?.login;
  const repo = payload.repository?.name;
  return owner === CONFIG.owner && repo === CONFIG.repo;
}

export async function handleWebhookEvent({ event, delivery, payload }) {
  if (!isTargetRepo(payload)) return;

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;

  const installationId = payload.installation?.id;
  if (!installationId) {
    auditLog({ level: "warn", action: "missing_installation", event, delivery });
    return;
  }

  const octokit = await getInstallationOctokit(installationId);

  // ---- ISSUES ----
  if (event === "issues") {
    const action = payload.action;
    const issue = payload.issue;
    if (!issue) return;

    const issueNumber = issue.number;

    const labeledCopilotTask =
      action === "labeled" && payload.label?.name === CONFIG.copilotLabel;

    const openedWithLabel = action === "opened" && issueHasLabel(issue, CONFIG.copilotLabel);

    if (!labeledCopilotTask && !openedWithLabel) return;

    auditLog({
      level: "info",
      action: "trigger_matched",
      event,
      delivery,
      repo: payload.repository.full_name,
      issueNumber,
      trigger: labeledCopilotTask ? "labeled" : "opened_with_label"
    });

    // 1) Comment (installation token)
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: issueNumber,
      body:
        "🤖 Orchestrator: assigning this issue to Copilot coding agent now.\n\n" +
        "- Trigger: `copilot-task`\n" +
        "- Rule: minimal localized changes, run tests, no new deps."
    });

    auditLog({ level: "info", action: "comment_posted", event, delivery, issueNumber });

    // 2) Assign Copilot (user token GraphQL)
    try {
      const result = await assignIssueToCopilot({ owner, repo, issueNumber });
      auditLog({
        level: "info",
        action: "copilot_assigned",
        event,
        delivery,
        issueNumber,
        copilotLogin: result.copilotLogin
      });

      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issueNumber,
        body: `✅ Assigned to Copilot (${result.copilotLogin}). Watch for the PR and iterate via PR comments.`
      });

      auditLog({ level: "info", action: "confirm_comment_posted", event, delivery, issueNumber });
    } catch (err) {
      auditLog({
        level: "error",
        action: "copilot_assign_failed",
        event,
        delivery,
        issueNumber,
        message: String(err?.message || err),
        stack: String(err?.stack || "")
      });

      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issueNumber,
        body:
          "❌ Failed to assign Copilot coding agent.\n\n" +
          `Error: ${String(err?.message || err)}\n\n` +
          "Check orchestrator /admin/last-error for details."
      });
    }

    return;
  }

  // ---- ISSUE COMMENTS ----
  if (event === "issue_comment") {
    if (payload.action !== "created") return;

    const body = payload.comment?.body || "";
    if (!body.trim().startsWith(CONFIG.runCommand)) return;

    const issueNumber = payload.issue?.number;
    if (!issueNumber) return;

    auditLog({
      level: "info",
      action: "command_trigger_matched",
      event,
      delivery,
      issueNumber
    });

    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner,
      repo,
      issue_number: issueNumber,
      body: "✅ `/copilot run` received. Assigning to Copilot coding agent."
    });

    try {
      const result = await assignIssueToCopilot({ owner, repo, issueNumber });

      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issueNumber,
        body: `✅ Assigned to Copilot (${result.copilotLogin}).`
      });

      auditLog({
        level: "info",
        action: "copilot_assigned",
        event,
        delivery,
        issueNumber,
        copilotLogin: result.copilotLogin
      });
    } catch (err) {
      auditLog({
        level: "error",
        action: "copilot_assign_failed",
        event,
        delivery,
        issueNumber,
        message: String(err?.message || err),
        stack: String(err?.stack || "")
      });

      await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
        owner,
        repo,
        issue_number: issueNumber,
        body:
          "❌ Failed to assign Copilot coding agent.\n\n" +
          `Error: ${String(err?.message || err)}\n\n` +
          "Check orchestrator /admin/last-error for details."
      });
    }
  }
}
