# Task Card 01 — Authentication

## Objective
Deliver production-ready authentication with registration, login, refresh rotation, logout, and current-user lookup.

## Scope
- Prisma user + session persistence
- Password hashing with bcrypt
- JWT access tokens
- Refresh-token rotation and revocation
- Auth middleware for protected routes
- Request validation and sanitized responses

## Done When
- User can register
- User can login
- Bad credentials are rejected
- `/api/auth/me` returns the current user
- Password hash is never exposed
- Refresh rotates/extends a valid session
- Logout revokes the active session
