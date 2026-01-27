async function chatStub(req) {
    const last = [...(req.messages || [])].reverse().find((m) => m.role === "user")?.content || "";
    const text =
        "Genesis (stub): " +
        (last.trim()
            ? `I received: "${last.trim()}". Next best action: state one objective and I will produce a step-by-step plan.`
            : "Say something and I will respond as Genesis.");

    return { provider: "stub", model: "stub-v1", text };
}

module.exports = { chatStub };
