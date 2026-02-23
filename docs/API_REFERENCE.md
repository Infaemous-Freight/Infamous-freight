# API Specification

**Base URL:**  
`/api/v1`

**Authentication:**
- JWT access token
- Refresh token rotation
- 15-minute expiration
- 7-day refresh cycle

---

## Auth Routes

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /auth/logout`

---

## Load Routes

- `GET /loads`
- `POST /loads`
- `GET /loads/:id`
- `PUT /loads/:id`
- `DELETE /loads/:id`

**Middleware:**
- Tenant enforcement
- Role validation
- Audit logging

---

## Broker Routes

- `GET /brokers`
- `POST /brokers`
- `PUT /brokers/:id`

---

## Invoice Routes

- `POST /invoices/generate/:load_id`
- `GET /invoices/:id`
- `GET /invoices/status/:load_id`
