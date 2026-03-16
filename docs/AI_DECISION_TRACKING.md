# AI Decision Tracking API

## Overview

The AI Decision Tracking API provides endpoints for recording, managing, and
gathering feedback on AI-driven decisions within the Infæmous Freight platform.
This system enables tracking of AI agent decisions (such as billing audits and
compliance checks) and collecting human feedback to improve model accuracy.

## Database Schema

### AiDecision Model

Represents an AI agent's decision on a specific invoice or task.

```prisma
model AiDecision {
  id             String   @id @default(cuid())
  organizationId String
  invoiceId      String
  agent          String   // billing_audit, compliance, etc
  decision       String   // approve | dispute
  confidence     Float    // 0.0 to 1.0
  rationale      Json     // Structured reasoning
  createdAt      DateTime @default(now())
  feedback       AiFeedback?

  @@index([organizationId, agent])
}
```

### AiFeedback Model

Captures human feedback on AI decisions for continuous improvement.

```prisma
model AiFeedback {
  id           String   @id @default(cuid())
  aiDecisionId String   @unique
  outcome      String   // correct | false_positive | missed
  notes        String?
  createdAt    DateTime @default(now())
  aiDecision   AiDecision @relation(fields: [aiDecisionId], references: [id])
}
```

## API Endpoints

All endpoints require JWT authentication with appropriate scopes.

### 1. List AI Decisions

```
GET /api/ai-decisions
```

**Query Parameters:**

- `organizationId` (optional) - Filter by organization
- `agent` (optional) - Filter by agent name
- `invoiceId` (optional) - Filter by invoice

**Required Scope:** `ai:decisions:read`

**Response:**

```json
{
  "ok": true,
  "decisions": [
    {
      "id": "cld1x...",
      "organizationId": "org-123",
      "invoiceId": "inv-456",
      "agent": "billing_audit",
      "decision": "approve",
      "confidence": 0.95,
      "rationale": {
        "reason": "Invoice matches purchase order",
        "factors": ["amount_match", "vendor_verified"]
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "feedback": null
    }
  ]
}
```

### 2. Get Single Decision

```
GET /api/ai-decisions/:id
```

**Required Scope:** `ai:decisions:read`

**Response:**

```json
{
  "ok": true,
  "decision": {
    "id": "cld1x...",
    "organizationId": "org-123",
    "invoiceId": "inv-456",
    "agent": "billing_audit",
    "decision": "approve",
    "confidence": 0.95,
    "rationale": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "feedback": {
      "id": "clf2y...",
      "outcome": "correct",
      "notes": "Decision was accurate",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

### 3. Create Decision

```
POST /api/ai-decisions
```

**Required Scope:** `ai:decisions:write`

**Rate Limit:** 20 requests per minute

**Request Body:**

```json
{
  "organizationId": "org-123",
  "invoiceId": "inv-456",
  "agent": "billing_audit",
  "decision": "approve",
  "confidence": 0.95,
  "rationale": {
    "reason": "Invoice matches purchase order",
    "factors": ["amount_match", "vendor_verified"]
  }
}
```

**Validation Rules:**

- `organizationId`: 1-100 characters, required
- `invoiceId`: 1-100 characters, required
- `agent`: 1-100 characters, required
- `decision`: Must be "approve" or "dispute", required
- `confidence`: Number between 0 and 1, required
- `rationale`: JSON object, optional (defaults to {})

**Response:** 201 Created with decision object

### 4. Add Feedback

```
POST /api/ai-decisions/:id/feedback
```

**Required Scope:** `ai:decisions:write`

**Request Body:**

```json
{
  "outcome": "correct",
  "notes": "Decision was accurate and helpful"
}
```

**Validation Rules:**

- `outcome`: Must be "correct", "false_positive", or "missed", required
- `notes`: String, optional

**Error Cases:**

- 404: Decision not found
- 409: Feedback already exists for this decision

**Response:** 201 Created with feedback object

### 5. Get Feedback

```
GET /api/ai-decisions/:id/feedback
```

**Required Scope:** `ai:decisions:read`

**Response:**

```json
{
  "ok": true,
  "feedback": {
    "id": "clf2y...",
    "aiDecisionId": "cld1x...",
    "outcome": "correct",
    "notes": "Decision was accurate",
    "createdAt": "2024-01-02T00:00:00.000Z",
    "aiDecision": { ... }
  }
}
```

### 6. Update Feedback

```
PATCH /api/ai-feedback/:id
```

**Required Scope:** `ai:decisions:write`

**Request Body:**

```json
{
  "outcome": "false_positive",
  "notes": "Updated assessment"
}
```

**Response:** 200 OK with updated feedback object

## Security

### Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Scopes

- `ai:decisions:read` - View decisions and feedback
- `ai:decisions:write` - Create/update decisions and feedback

### Rate Limiting

- General endpoints: 100 requests per 15 minutes
- AI decision creation: 20 requests per minute

## Usage Examples

### JavaScript/Node.js

```javascript
const API_BASE_URL = "http://localhost:4000/api";
const token = "your-jwt-token";

// Create a decision
async function createDecision() {
  const response = await fetch(`${API_BASE_URL}/ai-decisions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organizationId: "org-123",
      invoiceId: "inv-456",
      agent: "billing_audit",
      decision: "approve",
      confidence: 0.95,
      rationale: {
        reason: "Invoice matches purchase order",
      },
    }),
  });

  const result = await response.json();
  return result.decision;
}

// Add feedback
async function addFeedback(decisionId) {
  const response = await fetch(
    `${API_BASE_URL}/ai-decisions/${decisionId}/feedback`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outcome: "correct",
        notes: "Decision was accurate",
      }),
    },
  );

  const result = await response.json();
  return result.feedback;
}
```

### cURL

```bash
# Create decision
curl -X POST http://localhost:4000/api/ai-decisions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-123",
    "invoiceId": "inv-456",
    "agent": "billing_audit",
    "decision": "approve",
    "confidence": 0.95,
    "rationale": {"reason": "Invoice verified"}
  }'

# List decisions
curl -X GET "http://localhost:4000/api/ai-decisions?agent=billing_audit" \
  -H "Authorization: Bearer $TOKEN"

# Add feedback
curl -X POST http://localhost:4000/api/ai-decisions/cld1x.../feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": "correct",
    "notes": "Decision was accurate"
  }'
```

## Database Migration

To apply the schema changes to your database:

```bash
cd apps/api
npx prisma migrate deploy
```

For development with migration creation:

```bash
cd apps/api
npx prisma migrate dev --name add_ai_decision_and_feedback_models
```

## Testing

Run the test suite:

```bash
cd apps/api
npm test -- routes.ai.decisions.test.js
```

The test suite includes:

- Authentication and authorization tests
- Input validation tests
- CRUD operation tests
- Edge case handling
- Error scenario coverage

## Integration with Shared Package

The types are available in the shared package:

```typescript
import { AiDecision, AiFeedback } from "@infamous-freight/shared";

const decision: AiDecision = {
  id: "cld1x...",
  organizationId: "org-123",
  invoiceId: "inv-456",
  agent: "billing_audit",
  decision: "approve",
  confidence: 0.95,
  rationale: { reason: "Verified" },
  createdAt: new Date(),
};
```

## Swagger Documentation

API documentation is available at:

```
http://localhost:4000/api/docs
```

Look for the "AI Decisions" tag in the Swagger UI.

## Best Practices

1. **Decision Recording**: Record every AI decision immediately after generation
2. **Confidence Scoring**: Always include confidence scores for model monitoring
3. **Rationale**: Provide structured, parseable rationale for decision
   explainability
4. **Feedback Loop**: Collect feedback on a representative sample of decisions
5. **Monitoring**: Track decision accuracy over time using the feedback outcomes

## Future Enhancements

Potential additions to consider:

- Bulk decision creation endpoint
- Analytics endpoints for decision accuracy metrics
- Decision reversal tracking
- Model version tracking
- A/B testing support
