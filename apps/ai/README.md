# AI Role Scaffolding

## Overview

This directory contains the scaffolding for AI agent roles in Infamous Freight Enterprise. Each role is designed as a modular, auditable component with clear boundaries and contracts.

## Directory Structure

```
ai/
├── README.md                  # This file
├── contracts/                 # Shared interfaces and types
│   └── index.ts
├── observability/             # Logging and monitoring
│   └── logger.ts
├── dispatch/                  # Dispatch Operator AI
│   └── index.ts
├── driver-coach/              # Driver Coach AI
│   └── index.ts
├── fleet-intel/               # Fleet Intelligence AI
│   └── index.ts
└── customer-ops/              # Customer Ops AI
    └── index.ts
```

## Role Contracts

Each AI role implements the `RoleContract` interface, which defines:

- **Role metadata**: Name, version, capabilities
- **Decision handler**: Main decision-making function
- **Guardrails**: Boundary checks before execution
- **Audit logging**: Decision and confidence tracking
- **Override handling**: Human override mechanisms

## Core Concepts

### Decision Flow

```
Input → Role Handler → Confidence Check → Guardrails → Execute or Escalate → Log Decision
```

### Confidence Scores

- **0.0 - 0.7**: Low confidence → Always escalate to human
- **0.7 - 0.85**: Medium confidence → Execute with notification
- **0.85 - 1.0**: High confidence → Auto-execute

### Guardrails

Guardrails are pre-execution checks that prevent:

- Boundary violations (accessing forbidden data)
- Policy violations (actions outside defined scope)
- Safety violations (actions that could cause harm)

### Audit Trail

Every decision generates an audit log with:

- Timestamp and unique decision ID
- Input context and parameters
- Confidence score and reasoning
- Action taken or escalated
- Outcome (success, failure, override)

## Usage Example

```typescript
import { dispatchRole } from "./dispatch";
import { RoleContext } from "./contracts";

// Create context for decision
const context: RoleContext = {
  userId: "user-123",
  requestId: "req-456",
  timestamp: new Date(),
  metadata: {
    shipmentId: "ship-789",
    priority: "high",
  },
};

// Execute AI decision
const result = await dispatchRole.decide(
  {
    action: "assign-driver",
    parameters: {
      shipmentId: "ship-789",
      availableDrivers: ["driver-1", "driver-2"],
    },
  },
  context,
);

// Check result
if (result.requiresHumanReview) {
  // Escalate to human dispatcher
  await escalateToHuman(result);
} else {
  // Execute recommended action
  await executeAction(result.recommendation);
}
```

## Integration Points

### With API Layer

AI roles are invoked through the API layer:

```
API Endpoint → Authentication → Authorization → AI Role Dispatcher → Specific Role
```

### With Database

AI roles access data through:

- Prisma ORM for structured data
- Read-only views where possible
- Audit logging for all data access

### With External Services

AI roles may integrate with:

- OpenAI/Anthropic for LLM inference
- Weather APIs for route optimization
- Traffic APIs for delay prediction
- Notification services for alerts

## Development Guidelines

### Adding a New Role

1. Create directory: `ai/new-role/`
2. Implement `RoleContract` interface
3. Define role-specific guardrails
4. Set appropriate confidence thresholds
5. Add comprehensive audit logging
6. Write unit tests for decision logic
7. Document role boundaries in `docs/ai-boundaries.md`

### Testing

Each role should have:

- Unit tests for decision logic
- Integration tests with guardrails
- Confidence score validation tests
- Audit log verification tests

### Monitoring

Monitor these metrics for each role:

- Decision volume per hour
- Confidence score distribution
- Override rate
- Execution time
- Error rate
- Guardrail violation attempts

## Security Considerations

- **No direct data access**: Roles access data through controlled interfaces
- **Audit everything**: Every decision and data access is logged
- **Fail secure**: On error, escalate to human rather than auto-execute
- **Principle of least privilege**: Roles only access data they need
- **Human override**: Humans can always override AI decisions

## Deployment

AI roles are:

- Deployed with the API service
- Versioned independently
- Can be disabled/enabled per environment
- Can have role-specific rate limits

## Roadmap

### Phase 1 (Current): Scaffolding

- ✅ Define role contracts
- ✅ Create directory structure
- ✅ Implement basic logging
- 🔄 Create placeholder roles

### Phase 2: Core Implementation

- Implement dispatch operator decision logic
- Add LLM integration for complex decisions
- Implement confidence scoring models
- Add comprehensive guardrails

### Phase 3: Advanced Features

- Multi-role coordination
- Learning from human overrides
- Adaptive confidence thresholds
- Proactive recommendations

### Phase 4: Production Readiness

- Load testing at scale
- Chaos engineering for failure modes
- Security audit and penetration testing
- Performance optimization

## Contributing

When contributing to AI roles:

1. Follow TypeScript best practices
2. Add comprehensive JSDoc comments
3. Include unit tests for new features
4. Update audit logging for new decision types
5. Document any new guardrails or boundaries
6. Get security review for data access changes

## Questions?

Contact the AI team:

- **Technical questions**: ai-dev@infamousfreight.com
- **Security concerns**: security@infamousfreight.com
- **Product questions**: product@infamousfreight.com

---

**Last Updated:** December 28, 2025  
**Version:** 1.0  
**Maintained by:** AI Engineering Team
