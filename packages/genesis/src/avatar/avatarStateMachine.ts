export function createAvatarStateMachine(defaultState: "idle" | "suggesting" | "alert" | "critical") {
  return { state: defaultState, message: "", updatedAt: Date.now() };
}

export function transitionAvatar(
  _current: { state: string; message?: string; updatedAt: number },
  state: "idle" | "suggesting" | "alert" | "critical",
  message: string | undefined,
  now: number,
) {
  return { state, message, updatedAt: now };
}
