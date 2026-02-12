# ADR-0006: Synthetic AI Engine Fallback

## Status

Accepted

## Context

The platform includes AI features for route optimization, shipment analysis, and natural language command processing. These features rely on external AI providers:

- OpenAI GPT models
- Anthropic Claude models

Challenges with external AI dependencies:

- API keys required for development (cost barrier for new developers)
- Rate limits during high traffic
- Service outages affect functionality
- Testing requires real API calls (slow, expensive)
- CI/CD pipeline failures when API is down

We needed a strategy to maintain development velocity and system reliability without always depending on paid external services.

## Decision

We implemented a **synthetic AI engine fallback** that simulates AI responses when external providers are unavailable or not configured.

**Architecture** (`apps/api/src/services/aiSyntheticClient.js`):

```javascript
const AI_PROVIDER = process.env.AI_PROVIDER || "synthetic";

async function sendCommand(command, payload) {
  try {
    // Try configured provider
    switch (AI_PROVIDER) {
      case "openai":
        if (!process.env.OPENAI_API_KEY) throw new Error("No API key");
        return await sendToOpenAI(command, payload);

      case "anthropic":
        if (!process.env.ANTHROPIC_API_KEY) throw new Error("No API key");
        return await sendToAnthropic(command, payload);

      case "synthetic":
      default:
        return generateSyntheticResponse(command, payload);
    }
  } catch (error) {
    // Fallback to synthetic on any failure
    logger.warn("AI provider failed, using synthetic fallback", { error });
    return generateSyntheticResponse(command, payload);
  }
}

function generateSyntheticResponse(command, payload) {
  // Deterministic responses based on command
  const responses = {
    "shipment.optimize": {
      provider: "synthetic",
      text: "Suggested route: [A → B → C]. Estimated time: 4.5 hours",
      confidence: 0.85,
    },
    "shipment.analyze": {
      provider: "synthetic",
      text: "Analysis complete. 3 shipments delayed, 12 on schedule.",
      confidence: 0.9,
    },
  };

  return (
    responses[command] || {
      provider: "synthetic",
      text: `Simulated response for ${command}`,
      confidence: 0.75,
    }
  );
}
```

**Configuration** (`.env`):

```bash
# Use real AI providers
AI_PROVIDER=openai  # or 'anthropic'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Use synthetic (default if keys missing)
AI_PROVIDER=synthetic
# No API keys needed
```

**Response format** (consistent across all providers):

```javascript
{
  provider: 'openai' | 'anthropic' | 'synthetic',
  text: 'AI-generated response text',
  confidence: 0.0-1.0,
  metadata: { /* provider-specific */ }
}
```

## Rationale

**Why synthetic fallback:**

- Zero-cost local development
- Fast deterministic responses for testing
- No external dependencies during CI/CD
- Graceful degradation during provider outages
- New developers productive immediately

**Why not alternatives:**

| Approach           | Pros             | Cons                                  |
| ------------------ | ---------------- | ------------------------------------- |
| Mock AI in tests   | Simple           | Doesn't help development              |
| Require API keys   | Real AI          | Blocks new devs, costs money          |
| Offline AI model   | Fully functional | Large download, hardware requirements |
| Synthetic fallback | ✅ Best balance  | Responses aren't intelligent          |

**Synthetic vs. Offline AI:**

- Synthetic: ~50 lines of code, instant setup
- Offline (e.g., llama.cpp): ~5GB download, GPU beneficial, complex setup
- Trade-off: Acceptable for development/testing, use real AI in production

## Consequences

**Positive:**

- ✅ New developers onboard without API keys
- ✅ CI/CD pipeline never blocked by AI provider issues
- ✅ Fast test execution (no network calls)
- ✅ Predictable responses for test assertions
- ✅ Zero cost for development environments
- ✅ Easy to add new synthetic responses

**Negative:**

- ❌ Synthetic responses not intelligent (fixed templates)
- ❌ Can't validate real AI integration without API keys
- ❌ Developers must remember to test with real AI before deployment
- ❌ Risk of divergence between synthetic and real responses

**Mitigations:**

```javascript
// Tests can target specific providers
describe("AI Integration", () => {
  it("should handle OpenAI responses", async () => {
    process.env.AI_PROVIDER = "openai";
    // Test real OpenAI if key available, skip otherwise
  });

  it("should fallback to synthetic gracefully", async () => {
    process.env.AI_PROVIDER = "synthetic";
    const response = await aiClient.sendCommand("test", {});
    expect(response.provider).toBe("synthetic");
  });
});
```

**Production safeguards:**

```javascript
// Warn if using synthetic in production
if (process.env.NODE_ENV === "production" && AI_PROVIDER === "synthetic") {
  logger.warn("⚠️  Running with synthetic AI in production!");
  // Consider: throw error to prevent accidental production deploy
}
```

## Implementation Details

**Synthetic response templates:**

```javascript
const SYNTHETIC_RESPONSES = {
  "shipment.optimize": (payload) => {
    const shipmentCount = payload.shipments?.length || 0;
    return {
      provider: "synthetic",
      text: `Analyzed ${shipmentCount} shipments. Optimal route reduces distance by 15%.`,
      confidence: 0.85,
      suggestions: ["Consolidate pickups", "Adjust delivery order"],
    };
  },

  "voice.transcribe": (payload) => ({
    provider: "synthetic",
    text: "Simulated transcription of audio",
    confidence: 0.9,
  }),
};
```

**Retry logic with fallback:**

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) {
        // Final retry failed, use synthetic
        return generateSyntheticResponse();
      }
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

## Future Enhancements

If synthetic responses become insufficient:

1. **Cached responses**: Store real AI responses, replay in dev
2. **Offline AI model**: Integrate llama.cpp or similar for local inference
3. **Provider rotation**: Try OpenAI → Anthropic → Synthetic
4. **Smart fallback**: Use synthetic for simple commands, require real AI for complex ones

## Related

- [ADR-0001: Monorepo Architecture](0001-monorepo-architecture.md)
- [.env.example](../../.env.example) - AI provider configuration
- [apps/api/src/services/aiSyntheticClient.js](../../apps/api/src/services/aiSyntheticClient.js) - Implementation
