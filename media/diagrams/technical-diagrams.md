# System Architecture Diagram - Infæmous Freight Enterprises

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js]
        MOBILE[Mobile App<br/>React Native/Expo]
        API_CLIENT[API Clients<br/>Third-party]
    end
    
    subgraph "API Gateway"
        NGINX[NGINX<br/>Load Balancer]
        RATE_LIMIT[Rate Limiter<br/>100/15min]
    end
    
    subgraph "Application Layer"
        API1[API Server 1<br/>Express.js<br/>SJC]
        API2[API Server 2<br/>Express.js<br/>IAD]
        API3[API Server 3<br/>Express.js<br/>LHR]
        WORKER[Background Workers<br/>Bull Queues]
    end
    
    subgraph "Services"
        AUTH[Auth Service<br/>JWT+Scope]
        AI[AI Service<br/>GPT-4/Claude]
        WEBHOOK[Webhook Service<br/>HMAC-SHA256]
        ANALYTICS[Analytics Service<br/>Business Intelligence]
        PAYMENT[Payment Service<br/>Stripe/PayPal]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary)]
        REDIS[(Redis<br/>Cache/Queue)]
        S3[(S3/R2<br/>Storage)]
    end
    
    subgraph "External Services"
        SENTRY[Sentry<br/>Error Tracking]
        DATADOG[Datadog<br/>APM/Monitoring]
        STRIPE[Stripe API]
        OPENAI[OpenAI API]
    end
    
    %% Connections
    WEB --> NGINX
    MOBILE --> NGINX
    API_CLIENT --> NGINX
    
    NGINX --> RATE_LIMIT
    RATE_LIMIT --> API1
    RATE_LIMIT --> API2
    RATE_LIMIT --> API3
    
    API1 --> AUTH
    API1 --> AI
    API1 --> WEBHOOK
    API1 --> ANALYTICS
    API1 --> PAYMENT
    
    API2 --> AUTH
    API3 --> AUTH
    
    API1 --> PG
    API2 --> PG
    API3 --> PG
    
    API1 --> REDIS
    API2 --> REDIS
    API3 --> REDIS
    
    WORKER --> REDIS
    WORKER --> PG
    
    API1 --> S3
    
    API1 --> SENTRY
    API1 --> DATADOG
    
    PAYMENT --> STRIPE
    AI --> OPENAI
    
    %% Styling
    classDef clientStyle fill:#06B6D4,stroke:#0891B2,stroke-width:2px,color:#FFFFFF
    classDef apiStyle fill:#1E3A8A,stroke:#1E40AF,stroke-width:2px,color:#FFFFFF
    classDef serviceStyle fill:#F97316,stroke:#EA580C,stroke-width:2px,color:#FFFFFF
    classDef dataStyle fill:#10B981,stroke:#059669,stroke-width:2px,color:#FFFFFF
    classDef externalStyle fill:#9CA3AF,stroke:#6B7280,stroke-width:2px,color:#111827
    
    class WEB,MOBILE,API_CLIENT clientStyle
    class API1,API2,API3,WORKER apiStyle
    class AUTH,AI,WEBHOOK,ANALYTICS,PAYMENT serviceStyle
    class PG,REDIS,S3 dataStyle
    class SENTRY,DATADOG,STRIPE,OPENAI externalStyle
```

## Architecture Components

### Client Layer
- **Web App:** Next.js 14 with TypeScript, deployed on Vercel
- **Mobile App:** React Native/Expo, iOS and Android
- **API Clients:** Third-party integrations via REST API

### API Gateway
- **NGINX:** Load balancer and reverse proxy
- **Rate Limiter:** Token bucket algorithm (100 req/15min general)

### Application Layer
- **API Servers:** 3 regions (San Jose, Virginia, London)
- **Background Workers:** Bull queues for async processing

### Services
- **Auth:** JWT with scope-based authorization
- **AI:** OpenAI GPT-4 or Anthropic Claude
- **Webhooks:** HMAC-SHA256 signing
- **Analytics:** Real-time business intelligence
- **Payments:** Stripe and PayPal integration

### Data Layer
- **PostgreSQL:** Primary relational database
- **Redis:** Caching and queue backing
- **S3/R2:** Object storage for files

### External Services
- **Sentry:** Error tracking and monitoring
- **Datadog:** APM and observability
- **Stripe:** Payment processing
- **OpenAI:** AI capabilities

---

# Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant Auth
    participant DB
    participant Worker
    participant Webhook
    
    User->>Web: Create Shipment Request
    Web->>API: POST /api/shipments
    API->>Auth: Validate JWT Token
    Auth-->>API: Token Valid + Scopes
    API->>DB: Insert Shipment Record
    DB-->>API: Shipment Created (ID: 123)
    API->>Redis: Cache Shipment
    API->>Worker: Queue Notification Job
    API-->>Web: 201 Created + Shipment Data
    Web-->>User: Success Message
    
    Worker->>DB: Fetch User Preferences
    Worker->>Webhook: Send shipment.created Event
    Webhook->>External: POST https://client.com/webhooks
    External-->>Webhook: 200 OK
    Worker->>DB: Log Webhook Delivery
```

---

# CI/CD Pipeline Diagram

```mermaid
graph LR
    A[Git Push] --> B{Branch?}
    B -->|main| C[Production Pipeline]
    B -->|develop| D[Staging Pipeline]
    B -->|PR| E[Test Pipeline]
    
    C --> F[Run Tests]
    F --> G[Build Docker Images]
    G --> H[Deploy to Staging]
    H --> I{Health Check}
    I -->|Pass| J[Deploy to Production]
    I -->|Fail| K[Rollback]
    J --> L[Post-Deploy Tests]
    L --> M{Success?}
    M -->|Yes| N[Complete ✓]
    M -->|No| K
    
    K --> O[Restore Previous Version]
    O --> P[Notify Team]
    
    D --> F
    E --> F
    F -->|Fail| Q[Block Merge]
    
    style N fill:#10B981,color:#FFFFFF
    style K fill:#EF4444,color:#FFFFFF
    style Q fill:#FBBF24,color:#111827
```

---

# Database Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ SHIPMENT : creates
    USER ||--o{ PAYMENT : makes
    USER {
        uuid id PK
        string email UK
        string name
        string role
        jsonb fcmTokens
        timestamp createdAt
        timestamp updatedAt
    }
    
    SHIPMENT ||--o{ TRACKING_EVENT : has
    SHIPMENT ||--|| PAYMENT : requires
    SHIPMENT }o--|| DRIVER : assigned_to
    SHIPMENT {
        uuid id PK
        string reference UK
        uuid userId FK
        uuid driverId FK
        string status
        jsonb origin
        jsonb destination
        decimal weight
        jsonb dimensions
        timestamp estimatedDelivery
        timestamp createdAt
        timestamp updatedAt
    }
    
    DRIVER ||--o{ SHIPMENT : handles
    DRIVER {
        uuid id PK
        string name
        string license
        string vehicle
        string phone
        boolean available
        timestamp createdAt
    }
    
    TRACKING_EVENT {
        uuid id PK
        uuid shipmentId FK
        string status
        jsonb location
        string notes
        timestamp timestamp
    }
    
    PAYMENT {
        uuid id PK
        uuid userId FK
        uuid shipmentId FK
        decimal amount
        string currency
        string status
        string provider
        string transactionId
        timestamp paidAt
        timestamp createdAt
    }
    
    WEBHOOK_EVENT {
        uuid id PK
        string event
        jsonb payload
        string signature
        int retryCount
        string status
        timestamp createdAt
    }
```

---

# Shipment Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> Pending: Create Shipment
    Pending --> Confirmed: User Confirms
    Pending --> Cancelled: User Cancels
    
    Confirmed --> Assigned: Assign Driver
    Assigned --> PickedUp: Driver Picks Up
    
    PickedUp --> InTransit: En Route
    InTransit --> InTransit: Location Updates
    InTransit --> Delayed: Delay Detected
    Delayed --> InTransit: Resume
    
    InTransit --> OutForDelivery: Near Destination
    OutForDelivery --> Delivered: Delivery Complete
    
    Delivered --> [*]
    Cancelled --> [*]
    
    note right of InTransit
        Real-time GPS tracking
        Webhook notifications
        ETA updates
    end note
    
    note right of Delivered
        Signature capture
        Photo proof
        Customer rating
    end note
```

---

# Security Architecture

```mermaid
graph TD
    subgraph "Defense in Depth"
        A[Client Request] --> B[WAF/DDoS Protection<br/>Cloudflare]
        B --> C[Rate Limiting<br/>Token Bucket]
        C --> D[JWT Authentication<br/>RS256]
        D --> E[Scope Authorization<br/>shipments:read]
        E --> F[Input Validation<br/>express-validator]
        F --> G[Parameterized Queries<br/>Prisma ORM]
        G --> H[Encrypted Storage<br/>AES-256]
        H --> I[Audit Logging<br/>All Actions]
    end
    
    subgraph "Security Tools"
        J[Semgrep SAST]
        K[Snyk Scanning]
        L[NPM Audit]
        M[Trivy Container Scan]
        N[Gitleaks Secret Scan]
    end
    
    J --> O[Security Dashboard]
    K --> O
    L --> O
    M --> O
    N --> O
    
    O --> P{Critical<br/>Vulnerability?}
    P -->|Yes| Q[Block Deployment]
    P -->|No| R[Allow Deployment]
    
    style Q fill:#EF4444,color:#FFFFFF
    style R fill:#10B981,color:#FFFFFF
```

---

These diagrams can be rendered using:
- **GitHub Markdown:** Automatically renders Mermaid
- **VS Code:** Mermaid Preview extension
- **Mermaid Live Editor:** https://mermaid.live
- **Documentation Sites:** Docusaurus, Vitepress, etc.
