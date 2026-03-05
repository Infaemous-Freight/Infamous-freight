export const CONFIG = {
  owner: "MrMiless44",
  repo: "Infamous-freight",

  // triggers
  copilotLabel: "copilot-task",
  runCommand: "/copilot run",

  // Copilot agent login (GitHub docs say suggestedActors returns copilot-swe-agent when enabled)
  copilotLogin: "copilot-swe-agent",

  // default branch to use in agentAssignment (must match repo default; some users report default-branch coupling)
  baseRef: "main"
};
