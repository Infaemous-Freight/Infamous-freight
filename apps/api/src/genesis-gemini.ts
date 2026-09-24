const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

const GENESIS_SYSTEM_INSTRUCTION = [
  'You are Genesis, the AI operations assistant for Infamous Freight.',
  'You support freight quoting, dispatch, shipment visibility, billing operations, customer communication, and operational analysis.',
  'Never invent shipment, carrier, pricing, payment, compliance, or tracking facts. Use only supplied system context.',
  'Treat HOS/ELD information as non-authoritative unless an authoritative integration is explicitly marked connected.',
  'Do not authorize payments, refunds, load assignments, cancellations, or other irreversible actions on your own.',
  'For irreversible or financially consequential actions, explain the proposed action and require explicit operator confirmation.',
  'Keep tenant data isolated. Never reveal information from another tenant.',
  'Be concise, operational, and action-oriented.',
].join(' ');

export type GenesisContext = {
  tenantId: string;
  role?: string;
  loads?: unknown[];
  shipments?: unknown[];
  drivers?: unknown[];
  billing?: unknown;
};

type GeminiInteractionResponse = {
  id?: string;
  output_text?: string;
  error?: { message?: string };
};

export async function askGenesisWithGemini(input: string, context: GenesisContext) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error('gemini_api_key_required');
    error.name = 'GeminiConfigurationError';
    throw error;
  }

  const safeContext = {
    role: context.role ?? 'operator',
    loads: context.loads ?? [],
    shipments: context.shipments ?? [],
    drivers: context.drivers ?? [],
    billing: context.billing ?? null,
  };

  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: [
        GENESIS_SYSTEM_INSTRUCTION,
        '',
        'Tenant-scoped operational context (do not infer beyond this data):',
        JSON.stringify(safeContext),
        '',
        'Operator request: ' + input.trim().slice(0, 8000),
      ].join('\n'),
    }),
  });

  const payload = (await response.json()) as GeminiInteractionResponse;

  if (!response.ok) {
    const error = new Error(payload.error?.message || 'gemini_request_failed');
    error.name = 'GeminiRequestError';
    throw error;
  }

  return {
    provider: 'google-gemini',
    model: DEFAULT_MODEL,
    interactionId: payload.id ?? null,
    output: payload.output_text ?? '',
  };
}
