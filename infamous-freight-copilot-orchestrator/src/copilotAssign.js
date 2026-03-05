import { request } from "@octokit/request";
import { CONFIG } from "./config.js";

const FEATURES_HEADER = "issues_copilot_assignment_api_support";

/**
 * Uses a USER token (PAT or GitHub App user-to-server token) for Copilot assignment.
 * GitHub docs describe API-based assignment in their Copilot PR creation docs.
 */
export async function assignIssueToCopilot({ owner, repo, issueNumber }) {
  const token = process.env.GITHUB_COPILOT_USER_TOKEN;
  if (!token) throw new Error("Missing GITHUB_COPILOT_USER_TOKEN");

  // 1) Discover Copilot actor from suggestedActors and get issue id
  const q = `
    query($owner:String!, $repo:String!, $issueNumber:Int!) {
      repository(owner:$owner, name:$repo) {
        id
        suggestedActors(capabilities:[CAN_BE_ASSIGNED], first: 100) {
          nodes {
            __typename
            login
            ... on Bot { id }
            ... on User { id }
          }
        }
        issue(number: $issueNumber) { id title }
      }
    }
  `;

  const r = await request("POST /graphql", {
    headers: {
      authorization: `Bearer ${token}`,
      "GraphQL-Features": FEATURES_HEADER
    },
    query: q,
    owner,
    repo,
    issueNumber
  });

  const repoId = r.data.repository.id;
  const issueId = r.data.repository.issue.id;

  const actors = r.data.repository.suggestedActors.nodes || [];
  const copilot = actors.find((a) => a.login === CONFIG.copilotLogin);

  if (!copilot?.id) {
    throw new Error(
      `Copilot actor not found in suggestedActors. Expected login: ${CONFIG.copilotLogin}. ` +
      `Is Copilot coding agent enabled for this repo and your plan?`
    );
  }

  // 2) Assign Copilot via replaceActorsForAssignable + agentAssignment
  const m = `
    mutation($assignableId:ID!, $actorIds:[ID!]!, $repoId:ID!, $baseRef:String!, $customInstructions:String!) {
      replaceActorsForAssignable(input:{
        assignableId:$assignableId,
        actorIds:$actorIds,
        agentAssignment:{
          targetRepositoryId:$repoId,
          baseRef:$baseRef,
          customInstructions:$customInstructions
        }
      }) {
        assignable { id }
      }
    }
  `;

  const instructions =
    "Follow .github/copilot-instructions.md and Infamous Freight PR Rules. " +
    "Keep changes minimal, run tests, and do not add dependencies.";

  await request("POST /graphql", {
    headers: {
      authorization: `Bearer ${token}`,
      "GraphQL-Features": FEATURES_HEADER
    },
    query: m,
    assignableId: issueId,
    actorIds: [copilot.id],
    repoId,
    baseRef: CONFIG.baseRef,
    customInstructions: instructions
  });

  return { ok: true, copilotLogin: CONFIG.copilotLogin };
}
