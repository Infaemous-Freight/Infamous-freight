# Enterprise Architecture Diagram (Visual Spec)

Use this render-ready blueprint in Lucid, Draw.io, or PowerPoint.

```
                    ┌────────────────────┐
                    │   Mobile (Expo)    │
                    └────────┬───────────┘
                             │
        ┌────────────────────▼─────────────────────┐
        │              Web (Next.js)               │
        └──────────────┬───────────────┬──────────┘
                       │               │
              ┌────────▼────────┐  ┌───▼─────────────┐
              │ API Gateway     │  │ Voice Interface │
              └────────┬────────┘  └───┬─────────────┘
                       │               │
                ┌──────▼───────────────▼───────┐
                │     AI Command Layer          │
                │  (OpenAI / Anthropic / NLP)   │
                └──────┬───────────────┬───────┘
                       │               │
              ┌────────▼────────┐ ┌────▼──────────┐
              │ Core API (Node) │ │ AI Simulation │
              └────────┬────────┘ └────┬──────────┘
                       │               │
           ┌───────────▼───────────────▼─────────────┐
           │        Data Layer                         │
           │ PostgreSQL | Redis | Event Store         │
           └───────────┬─────────────────────────────┘
                       │
        ┌──────────────▼───────────────┐
        │ Observability (OTEL + Logs)   │
        └──────────────────────────────┘
```
