import { randomUUID } from 'crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import type { NextFunction, Request, Response } from 'express';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import {
  evaluateAiCoreDecision,
  getAiCorePublicDisclosure,
  INFAMOUS_FREIGHT_AI_CORE_VERSION,
  INFAMOUS_FREIGHT_AI_SYSTEM_PROMPT,
  normalizeAiCoreText,
} from './ai-core';

type ChatRole = 'system' | 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatCompletionStream = AsyncIterable<ChatCompletionChunk>;

type ChatCompletionClient = {
  chat: {
    completions: {
      create: (
        body: {
          model: string;
          messages: ChatMessage[];
          stream: true;
          max_completion_tokens: number;
        },
        options?: { signal?: AbortSignal },
      ) => Promise<ChatCompletionStream>;
    };
  };
};

type AiChatRouterOptions = {
  createClient?: () => ChatCompletionClient;
  model?: string;
  timeoutMs?: number;
};

const CHAT_SYSTEM_PROMPT = `
${INFAMOUS_FREIGHT_AI_SYSTEM_PROMPT}

Public site assistant mode:
- Help visitors understand Infamous Freight services, quote requests, shipment tracking, carrier onboarding, driver applications, pricing workflows, documents, and operational workflows.
- Keep answers practical, concise, and focused on freight logistics.
- Use this disclosure when relevant: ${getAiCorePublicDisclosure()}
`.trim();

const DEFAULT_MODEL = 'gpt-5.2';
const DEFAULT_TIMEOUT_MS = 25_000;
const HISTORY_LIMIT = 20;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_TOTAL_MESSAGE_CHARS = 12_000;
const MAX_COMPLETION_TOKENS = 700;
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_RATE_LIMIT_MAX_REQUESTS = 20;

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (!rawValue) return fallback;

  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;

  const message = value as Partial<ChatMessage>;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0
  );
}

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  const cappedMessages = messages
    .filter(isChatMessage)
    .slice(-HISTORY_LIMIT)
    .map((message) => ({
      role: message.role,
      content: normalizeAiCoreText(message.content, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.length > 0);

  let totalChars = 0;
  const withinTotalCap: ChatMessage[] = [];

  for (const message of cappedMessages.reverse()) {
    totalChars += message.content.length;
    if (totalChars > MAX_TOTAL_MESSAGE_CHARS) break;
    withinTotalCap.unshift(message);
  }

  return withinTotalCap;
}

function getLastUserMessage(messages: ChatMessage[]): ChatMessage | undefined {
  return [...messages].reverse().find((message) => message.role === 'user');
}

function writeSseEvent(res: Response, data: unknown, event?: string) {
  if (event) {
    res.write(`event: ${event}\n`);
  }
  res.write(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`);
}

function createDefaultClient(): ChatCompletionClient {
  return new OpenAI() as unknown as ChatCompletionClient;
}

export function createAiChatRouter(options: AiChatRouterOptions = {}) {
  const router = Router();
  const createClient = options.createClient ?? createDefaultClient;
  const model = options.model ?? process.env.AI_CHAT_MODEL?.trim() ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? getPositiveIntegerEnv('AI_CHAT_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
  const chatLimiter = rateLimit({
    windowMs: CHAT_RATE_LIMIT_WINDOW_MS,
    max: CHAT_RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
  });

  router.get('/api/chat/policy', (_req: Request, res: Response) => {
    res.status(200).json({
      data: {
        core: 'Genesis AI Core',
        version: INFAMOUS_FREIGHT_AI_CORE_VERSION,
        disclosure: getAiCorePublicDisclosure(),
        blockedAutonomousActions: [
          'quotes',
          'bookings',
          'dispatch',
          'carrier approval',
          'compliance verification',
          'billing/account changes',
        ],
      },
    });
  });

  router.post('/api/chat', chatLimiter, async (req: Request, res: Response, next: NextFunction) => {
    const messages = sanitizeMessages(req.body?.messages);
    const lastUserMessage = getLastUserMessage(messages);

    if (!lastUserMessage) {
      res.status(400).json({
        error: 'missing_messages',
        message: 'At least one user message is required.',
        requestId: req.requestId,
      });
      return;
    }

    const decision = evaluateAiCoreDecision({
      text: lastUserMessage.content,
      mode: 'public_assistant',
    });

    const policyContext: ChatMessage = {
      role: 'system',
      content: `AI Core policy context: risk=${decision.riskLevel}; humanReviewRequired=${decision.requiresHumanReview}; reasons=${decision.reasons.join(', ')}; blockedActions=${decision.blockedActions.join(', ') || 'none'}.`,
    };

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);
    const requestId = req.requestId ?? randomUUID();

    try {
      const stream = await createClient().chat.completions.create(
        {
          model,
          messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, policyContext, ...messages],
          stream: true,
          max_completion_tokens: MAX_COMPLETION_TOKENS,
        },
        { signal: abortController.signal },
      );

      res.status(200);
      res.setHeader('content-type', 'text/event-stream; charset=utf-8');
      res.setHeader('cache-control', 'no-cache, no-transform');
      res.setHeader('connection', 'keep-alive');
      res.setHeader('x-content-type-options', 'nosniff');
      res.setHeader('x-ai-core-version', INFAMOUS_FREIGHT_AI_CORE_VERSION);
      res.setHeader('x-ai-human-review-required', String(decision.requiresHumanReview));
      res.setHeader('x-ai-risk-level', decision.riskLevel);
      res.flushHeaders?.();

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          writeSseEvent(res, { content });
        }
      }

      writeSseEvent(res, '[DONE]');
      res.end();
    } catch (error) {
      if (res.headersSent) {
        writeSseEvent(res, { message: 'The assistant response was interrupted.', requestId }, 'error');
        res.end();
        return;
      }

      if (abortController.signal.aborted) {
        res.status(504).json({
          error: 'chat_timeout',
          message: 'The assistant took too long to respond. Please try again.',
          requestId,
        });
        return;
      }

      const providerConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.NETLIFY_AI_GATEWAY_KEY);
      if (!providerConfigured) {
        res.status(503).json({
          error: 'chat_not_configured',
          message: 'The assistant is not configured for this environment.',
          requestId,
        });
        return;
      }

      next(error);
    } finally {
      clearTimeout(timeout);
    }
  });

  return router;
}
