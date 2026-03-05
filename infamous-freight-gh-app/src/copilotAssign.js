import { request } from "@octokit/request";

const COPILOT_LOGIN = "copilot-swe-agent";
const FEATURES_HEADER = "issues_copilot_assignment_api_support";

export async function assignIssueToCopilot({ owner, repo, issueNumber }) {
  const token = process.env.GITHUB_COPILOT_USER_TOKEN;

  if (!token) {
    throw new Error("Missing GITHUB_COPILOT_USER_TOKEN");
  }

  const discoveryQuery = `
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
        issue(number: $issueNumber) {
          id
        }
      }
    }
  `;

  const discovery = await request("POST /graphql", {
    headers: {
      authorization: `Bearer ${token}`,
      "GraphQL-Features": FEATURES_HEADER
    },
    owner,
    repo,
    issueNumber,
    query: discoveryQuery
  });

  const repository = discovery.data.repository;
  const issueId = repository?.issue?.id;

  if (!issueId) {
    throw new Error(`Issue #${issueNumber} not found for ${owner}/${repo}`);
  }

  const copilotActor = (repository?.suggestedActors?.nodes || []).find(
    (actor) => actor?.login === COPILOT_LOGIN && actor?.id
  );

  if (!copilotActor?.id) {
    throw new Error(`Copilot actor ${COPILOT_LOGIN} not found in suggestedActors`);
  }

  const assignMutation = `
    mutation($assignableId:ID!, $actorIds:[ID!]!, $repoId:ID!) {
      replaceActorsForAssignable(input: {
        assignableId: $assignableId,
        actorIds: $actorIds,
        agentAssignment: {
          targetRepositoryId: $repoId,
          baseRef: "main",
          customInstructions: "Follow repo copilot instructions. Keep changes minimal and run tests."
        }
      }) {
        assignable {
          id
        }
      }
    }
  `;

  await request("POST /graphql", {
    headers: {
      authorization: `Bearer ${token}`,
      "GraphQL-Features": FEATURES_HEADER
    },
    query: assignMutation,
    assignableId: issueId,
    actorIds: [copilotActor.id],
    repoId: repository.id
  });

  return { assigned: true, copilotLogin: COPILOT_LOGIN };
}
