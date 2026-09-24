# Genesis + Gemini Integration

## Purpose

Genesis is the tenant-scoped AI operations assistant for Infamous Freight. Gemini is integrated as an API-side provider so the browser never receives the Gemini API key.

## Runtime path

Browser -> Netlify /api proxy -> Fly.io Express API -> Genesis policy/context layer -> Google Gemini API

The API retrieves tenant-scoped operational records before sending context to Gemini. Gemini is not given database credentials and cannot directly execute billing or dispatch mutations.

## Environment

Required on the API runtime:

- GEMINI_API_KEY - Google AI Studio / Gemini API key.
- GEMINI_MODEL - optional; defaults to gemini-3.8-flash.

Never put GEMINI_API_KEY in apps/web, Vite VITE_* variables, GitHub source, or client-side code.

Google's current JavaScript SDK is @google/genai, and Google's current documentation recommends the Interactions API for agentic, stateful, multimodal workflows.

## Endpoint

POST /api/genesis/chat

Authenticated operator request:

{ "message": "Show me loads that need attention." }

The API returns a tenant-scoped Genesis response plus the Gemini interaction ID for observability.

## Guardrails

Genesis must:

1. Stay tenant-scoped.
2. Treat supplied operational data as authoritative only for the fields actually present.
3. Never invent freight rates, ETA, HOS, tracking, carrier, or payment facts.
4. Require explicit operator confirmation before irreversible or financially consequential actions.
5. Keep Stripe credentials and payment operations behind the API.
6. Keep authoritative HOS/ELD decisions behind connected compliance integrations.

## Provider strategy

Keep Genesis provider-neutral. Gemini is the first added provider, while the existing OpenAI dependency can remain available for workloads where OpenAI is preferred. A future provider router can select a provider by task without changing the web/mobile contract.

## Suggested production task routing

- Freight operations chat: Gemini.
- Structured quote analysis: provider-neutral JSON contract.
- Payment/billing mutations: deterministic server code + Stripe APIs, never free-form model authority.
- Voice: keep ElevenLabs/voice transport separate from the reasoning provider.
- Compliance: deterministic validation plus authoritative ELD data.

## Validation

After setting the API environment, run:

- pnpm install
- pnpm run typecheck
- pnpm run test
- pnpm run build
- production smoke test for POST /api/genesis/chat

The Gemini API key must be present only in the API runtime environment.
