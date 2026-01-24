/**
 * AI Synthetic Client
 * Provides AI inference with fallback to synthetic responses
 * Supports OpenAI, Anthropic, and synthetic modes
 */

const Sentry = require("@sentry/node");
const { logger } = require("../middleware/logger");

class AISyntheticClient {
  constructor(provider = "synthetic") {
    this.provider = process.env.AI_PROVIDER || provider;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Process AI command
   * @param {string} command - Command text
   * @param {string} userId - User ID for context
   * @returns {Promise<object>} AI response
   */
  async processCommand(command, userId) {
    try {
      const startTime = Date.now();

      // Determine which provider to use
      if (this.provider === "openai") {
        return await this.processWithOpenAI(command, userId);
      } else if (this.provider === "anthropic") {
        return await this.processWithAnthropic(command, userId);
      } else {
        return await this.processSynthetic(command, userId);
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: "aiSyntheticClient" },
        contexts: { ai: { command, userId, provider: this.provider } },
      });
      throw error;
    }
  }

  /**
   * Process with OpenAI
   */
  async processWithOpenAI(command, userId) {
    try {
      const OpenAI = require("openai");
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: command,
          },
        ],
        max_tokens: 500,
      });

      return {
        provider: "openai",
        result: response.choices[0].message.content,
        metadata: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      logger.warn({ error: error.message }, 'OpenAI failed, falling back to synthetic');
      return this.processSynthetic(command, userId);
    }
  }

  /**
   * Process with Anthropic
   */
  async processWithAnthropic(command, userId) {
    try {
      const Anthropic = require("@anthropic-ai/sdk");
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const response = await client.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: command,
          },
        ],
      });

      return {
        provider: "anthropic",
        result: response.content[0].text,
        metadata: {
          model: response.model,
          usage: response.usage,
        },
      };
    } catch (error) {
      logger.warn({ error: error.message }, 'Anthropic failed, falling back to synthetic');
      return this.processSynthetic(command, userId);
    }
  }

  /**
   * Process with synthetic response (fallback/testing)
   */
  async processSynthetic(command, userId) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate synthetic response based on command keywords
    let result = "Command processed successfully";

    if (command.toLowerCase().includes("shipment")) {
      result = "Shipment tracking initiated. Current status: In Transit";
    } else if (command.toLowerCase().includes("track")) {
      result = "Tracking information retrieved. ETA: 2 hours";
    } else if (command.toLowerCase().includes("status")) {
      result = "Status check complete. All systems operational";
    } else if (command.toLowerCase().includes("help")) {
      result =
        'Available commands: track, shipment, status, help. Use "track [id]" to track a shipment.';
    }

    return {
      provider: "synthetic",
      result,
      metadata: {
        model: "synthetic-v1",
        userId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Check provider availability
   */
  async checkProviderAvailability() {
    const status = {
      synthetic: true,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      active: this.provider,
    };

    return status;
  }
}

module.exports = new AISyntheticClient();
