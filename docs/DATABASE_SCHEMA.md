# Database Schema (PostgreSQL)

## `users`
- `id` (UUID)
- `tenant_id` (UUID)
- `role`
- `email`
- `password_hash`
- `created_at`

## `tenants`
- `id`
- `company_name`
- `subscription_tier`
- `created_at`

## `loads`
- `id`
- `tenant_id`
- `broker_id`
- `driver_id`
- `rate`
- `mileage`
- `status`
- `created_at`

## `brokers`
- `id`
- `tenant_id`
- `company_name`
- `credit_score`

## `invoices`
- `id`
- `tenant_id`
- `load_id`
- `amount`
- `status`
- `due_date`
- `paid_at`

---

## Indexes
- `tenant_id` on all major tables
- `status` index on `loads`
- `due_date` index on `invoices`
