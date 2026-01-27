/** Chat message and result types for AI providers */

/**
 * @typedef {{ role: "system" | "user" | "assistant"; content: string }} ChatMessage
 * @typedef {{ messages: ChatMessage[]; temperature?: number }} ChatRequest
 * @typedef {{ provider: "stub" | "openai" | "anthropic"; model: string; text: string }} ChatResult
 */

module.exports = {};
