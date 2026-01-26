export type EnforcementLevel = "notice" | "restriction" | "suspension" | "termination";

export interface EnforcementAction {
  id: string;
  userId: string;
  level: EnforcementLevel;
  reason: string;
  createdAt: string;
}

const actions = new Map<string, EnforcementAction>();

export function createEnforcementAction(
  id: string,
  userId: string,
  level: EnforcementLevel,
  reason: string,
): EnforcementAction {
  const action: EnforcementAction = {
    id,
    userId,
    level,
    reason,
    createdAt: new Date().toISOString(),
  };

  actions.set(id, action);
  return action;
}

export function getEnforcementActionsForUser(userId: string): EnforcementAction[] {
  return Array.from(actions.values()).filter((action) => action.userId === userId);
}

export function triggerEnforcementWorkflow(
  userId: string,
  reason: string,
  level: EnforcementLevel = "restriction",
): EnforcementAction {
  const id = `enf_${Date.now()}_${actions.size + 1}`;
  return createEnforcementAction(id, userId, level, reason);
}
