type EnforcementAction = {
  id: string;
  [key: string]: unknown;
};

const actions = new Map<string, EnforcementAction>();

export function createEnforcementAction(
  id: string,
  action: EnforcementAction,
): EnforcementAction {
  if (action.id !== id) {
    throw new Error(
      `Enforcement action id mismatch: parameter id "${id}" does not match action.id "${action.id}"`,
    );
  }
  if (actions.has(id)) {
    throw new Error(`Duplicate enforcement action id: ${id}`);
  }

  actions.set(id, action);
  return action;
}
