# Infamous Freight GitHub App Webhook Service

This service receives GitHub App webhook events and orchestrates Copilot assignment for issues in `MrMiless44/Infamous-freight`.

## Features

- Verifies webhook authenticity with `X-Hub-Signature-256` HMAC SHA-256 over the raw request body.
- Trigger gates:
  - label gate: `copilot-task`
  - command gate: `/copilot run`
- Posts a starting comment using the app installation token.
- Assigns the issue to Copilot (`copilot-swe-agent`) using a user token via GraphQL.

## Setup

1. Copy `.env.example` to `.env` and populate values.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run locally:

   ```bash
   npm run start
   ```

## Endpoints

- `POST /github/webhook`
- `GET /health`
