const { env } = require("../config/env");
const { chatStub } = require("./providers/stub");
const { chatOpenAI } = require("./providers/openai");
const { chatAnthropic } = require("./providers/anthropic");

async function chat(req) {
    try {
        if (env.aiProvider === "openai") return await chatOpenAI(req);
        if (env.aiProvider === "anthropic") return await chatAnthropic(req);
        return await chatStub(req);
    } catch (e) {
        const fallback = await chatStub(req);
        return {
            ...fallback,
            text: `Genesis: provider failed (${e?.message || "error"}). Falling back.\n\n${fallback.text}`,
        };
    }
}

module.exports = {
    chat,
};
