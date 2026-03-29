/**
 * AI Voice Command Service
 * Handles speech-to-text, natural language processing, and voice command execution
 */

const OpenAI = require("openai");
const { Anthropic } = require("@anthropic-ai/sdk");
const { logger } = require("../middleware/logger");

class AIVoiceService {
  constructor() {
    this.openai = null;
    this.anthropic = null;

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    // Supported languages for voice commands
    this.supportedLanguages = [
      "en",
      "es",
      "fr",
      "de",
      "pt",
      "zh",
      "ja",
      "ko",
      "ar",
      "hi",
      "ru",
      "it",
    ];

    // Voice command intents
    this.intents = {
      check_status: ["status", "where is", "location", "tracking"],
      create_shipment: ["create", "new shipment", "book load"],
      update_status: ["update", "mark as", "change status"],
      call_dispatch: ["call", "contact", "talk to dispatch"],
      navigation: ["navigate", "directions", "route to"],
      reports: ["report", "show me", "analytics"],
      help: ["help", "assist", "how do i"],
    };
  }

  /**
   * Convert speech audio to text using OpenAI Whisper
   */
  async speechToText(audioBuffer, language = "en") {
    try {
      if (!this.openai) {
        logger.warn("OpenAI not configured, using mock transcription");
        return this.mockTranscription(audioBuffer);
      }

      // Create a File object from buffer (Whisper requires file-like input)
      const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: language,
        response_format: "json",
      });

      logger.info("Speech transcribed", {
        text: transcription.text,
        language,
        duration: audioBuffer.length,
      });

      return {
        text: transcription.text,
        language: language,
        confidence: 0.95, // Whisper doesn't provide confidence, estimate high
      };
    } catch (error) {
      logger.error({ error }, "Speech-to-text error");
      throw new Error("Failed to transcribe audio", { cause: error });
    }
  }

  /**
   * Analyze command intent and extract entities
   */
  async analyzeCommand(text, userId, context = {}) {
    try {
      // Detect intent
      const intent = this.detectIntent(text);

      // Extract entities using AI
      const entities = await this.extractEntities(text, intent);

      // Build command structure
      const command = {
        originalText: text,
        intent: intent,
        entities: entities,
        userId: userId,
        context: context,
        timestamp: new Date().toISOString(),
        confidence: entities.confidence || 0.8,
      };

      logger.info("Command analyzed", { intent, entities: Object.keys(entities) });

      return command;
    } catch (error) {
      logger.error({ error }, "Command analysis error");
      throw new Error("Failed to analyze command", { cause: error });
    }
  }

  /**
   * Execute voice command and return result
   */
  async executeCommand(command) {
    try {
      const { intent, entities, userId } = command;

      logger.info("Executing voice command", { intent, userId });

      switch (intent) {
        case "check_status":
          return await this.handleCheckStatus(entities, userId);

        case "create_shipment":
          return await this.handleCreateShipment(entities, userId);

        case "update_status":
          return await this.handleUpdateStatus(entities, userId);

        case "call_dispatch":
          return await this.handleCallDispatch(entities, userId);

        case "navigation":
          return await this.handleNavigation(entities, userId);

        case "reports":
          return await this.handleReports(entities, userId);

        case "help":
          return await this.handleHelp(entities, userId);

        default:
          return {
            success: false,
            message: "I didn't understand that command. Can you try again?",
            suggestions: ["Check shipment status", "Create new shipment", "Get directions"],
          };
      }
    } catch (error) {
      logger.error({ error }, "Command execution error");
      return {
        success: false,
        message: "Sorry, I couldn't complete that action. Please try again.",
        error: error.message,
      };
    }
  }

  /**
   * Generate voice response (text-to-speech)
   */
  async textToSpeech(text, voice = "alloy", language = "en") {
    try {
      if (!this.openai) {
        logger.warn("OpenAI not configured, skipping TTS");
        return null;
      }

      const mp3 = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        input: text,
        speed: 1.0,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());

      logger.info("Text-to-speech generated", {
        textLength: text.length,
        voice,
        audioSize: buffer.length,
      });

      return buffer;
    } catch (error) {
      logger.error({ error }, "Text-to-speech error");
      return null;
    }
  }

  // ========== Private Helper Methods ==========

  detectIntent(text) {
    const lowerText = text.toLowerCase();

    for (const [intent, keywords] of Object.entries(this.intents)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return intent;
      }
    }

    return "unknown";
  }

  async extractEntities(text, intent) {
    // Use AI to extract structured data from text
    if (!this.anthropic && !this.openai) {
      return this.mockEntityExtraction(text, intent);
    }

    try {
      const prompt = `Extract key entities from this voice command: "${text}"
Intent: ${intent}

Return JSON with relevant fields like: shipmentId, status, location, date, etc.`;

      let response;
      if (this.anthropic) {
        const result = await this.anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        });
        response = result.content[0].text;
      } else if (this.openai) {
        const result = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        });
        response = result.choices[0].message.content;
      }

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { rawText: text };
    } catch (error) {
      logger.error({ error }, "Entity extraction error");
      return { rawText: text };
    }
  }

  async handleCheckStatus(entities, userId) {
    const { shipmentId, trackingNumber } = entities;

    if (!shipmentId && !trackingNumber) {
      return {
        success: false,
        message: "I need a shipment ID or tracking number to check status.",
        requiresInput: true,
      };
    }

    // Query shipment status from database
    // This would integrate with your shipments service
    return {
      success: true,
      message: `Shipment ${shipmentId || trackingNumber} is in transit. Current location: Chicago, IL. ETA: 2 hours.`,
      data: {
        shipmentId: shipmentId || trackingNumber,
        status: "IN_TRANSIT",
        location: "Chicago, IL",
        eta: "2 hours",
      },
    };
  }

  async handleCreateShipment(entities, userId) {
    const { origin, destination, weight, cargo } = entities;

    if (!origin || !destination) {
      return {
        success: false,
        message: "I need both pickup and delivery locations to create a shipment.",
        requiresInput: true,
        missing: ["origin", "destination"],
      };
    }

    return {
      success: true,
      message: `New shipment created from ${origin} to ${destination}. Your shipment ID is SH-${Date.now()}.`,
      data: {
        shipmentId: `SH-${Date.now()}`,
        origin,
        destination,
        status: "PENDING",
      },
    };
  }

  async handleUpdateStatus(entities, userId) {
    const { shipmentId, status } = entities;

    return {
      success: true,
      message: `Shipment ${shipmentId} status updated to ${status}.`,
      data: { shipmentId, status },
    };
  }

  async handleCallDispatch(entities, userId) {
    return {
      success: true,
      message: "Connecting you with dispatch now. Hold on.",
      action: "initiate_call",
      data: { phoneNumber: process.env.DISPATCH_PHONE || "+1-800-FREIGHT" },
    };
  }

  async handleNavigation(entities, userId) {
    const { destination } = entities;

    return {
      success: true,
      message: `Starting navigation to ${destination}.`,
      action: "start_navigation",
      data: { destination },
    };
  }

  async handleReports(entities, userId) {
    const { reportType, timePeriod } = entities;

    return {
      success: true,
      message: `Generating ${reportType || "summary"} report for ${timePeriod || "this week"}.`,
      action: "generate_report",
      data: { reportType, timePeriod },
    };
  }

  async handleHelp(entities, userId) {
    return {
      success: true,
      message:
        "I can help you with: checking shipment status, creating shipments, updating status, navigation, and reports. What would you like to do?",
      suggestions: [
        "Check status of shipment 12345",
        "Create a new shipment",
        "Navigate to delivery address",
        "Show me this week's reports",
      ],
    };
  }

  // Mock implementations for when AI services are unavailable
  mockTranscription(audioBuffer) {
    return {
      text: "Check status of shipment 12345",
      language: "en",
      confidence: 0.7,
      mock: true,
    };
  }

  mockEntityExtraction(text, intent) {
    // Simple regex-based extraction for testing
    const entities = { rawText: text };

    // Extract numbers (could be shipment IDs)
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      entities.shipmentId = numbers[0];
    }

    // Extract status keywords
    const statusMatch = text.match(/(delivered|in transit|pending|picked up)/i);
    if (statusMatch) {
      entities.status = statusMatch[0].toUpperCase().replace(" ", "_");
    }

    return entities;
  }
}

// Export singleton instance
module.exports = new AIVoiceService();
