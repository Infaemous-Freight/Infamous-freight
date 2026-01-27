const Anthropic = require("@anthropic-ai/sdk");
const { env } = require("../../config/env");

function toAnthropic(messages) {
    const system = messages.find((m) => m.role === "system")?.content || "";
    const rest = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: [{ type: "text", text: m.content }] }));
    return { system, messages: rest };
}

async function chatAnthropic(req) {
    if (!env.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY missing");
    const client = new Anthropic({ apiKey: env.anthropicApiKey });

    const { system, messages } = toAnthropic(req.messages || []);

    const out = await client.messages.create({
        model: env.anthropicModel || "claude-3-5-sonnet-latest",
        system,
        max_tokens: 800,
        temperature: req.temperature ?? 0.4,
        messages,
    });

    const text = out.content?.[0]?.type === "text" ? out.content[0].text : "";
    return { provider: "anthropic", model: env.anthropicModel || "claude-3-5-sonnet-latest", text };
}

module.exports = { chatAnthropic };
