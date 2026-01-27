const OpenAI = require("openai");
const { env } = require("../../config/env");

async function chatOpenAI(req) {
    if (!env.openaiApiKey) throw new Error("OPENAI_API_KEY missing");
    const client = new OpenAI({ apiKey: env.openaiApiKey });

    const out = await client.chat.completions.create({
        model: env.openaiModel || "gpt-4.1-mini",
        messages: req.messages,
        temperature: req.temperature ?? 0.4,
    });

    const text = out.choices?.[0]?.message?.content || "";
    return { provider: "openai", model: env.openaiModel || "gpt-4.1-mini", text };
}

module.exports = { chatOpenAI };
