# Infæmous Freight / Get Truck'N - Product Requirements Document

## Overview
AI-powered freight marketplace MVP connecting shippers with carriers. Built with React, FastAPI, MongoDB, Stripe, and OpenAI integrations.

## User Personas
1. **Shippers** - Post freight loads, accept bids, manage bookings
2. **Carriers** - Browse loads, submit bids, manage routes/preferences
3. **Drivers** - View assignments, track location, upload documents

## Core Requirements

### Authentication & Profiles
- [x] JWT-based email/password authentication
- [x] Role-based access (shipper/carrier/driver/admin)
- [x] Profile management with DOT/MC numbers
- [x] Verified carrier badges (paid feature)
- [x] Rating system (1-5 stars + comments)

### Load Management
- [x] Create/edit/view loads
- [x] Advanced search & filtering (state, equipment, rate range, dates)
- [x] Premium/featured listings
- [x] Status tracking (draft → posted → booked → in_transit → delivered)

### Bidding System
- [x] Carriers submit competitive bids
- [x] Shippers view/accept/reject bids
- [x] Auto-reject other bids when one accepted

### Booking & Assignments
- [x] One-click booking from accepted bid
- [x] Assignment tracking with escrow status
- [x] Platform fee calculation (2.5%)

### Messaging System
- [x] Per-load message threads
- [x] Real-time updates (WebSocket)
- [x] AI-powered thread summarization (OpenAI GPT-4o-mini)

### Carrier Tools
- [x] Lane preferences (save preferred routes)
- [x] Auto-matched loads based on preferences
- [x] Rate calculator (distance + profit estimation)
- [x] Market analytics (hot lanes, avg rates by equipment)

### Documents & Tracking
- [x] File upload (BOL, POD, insurance certificates)
- [x] GPS tracking pings
- [x] Location history

### Payments (Stripe)
- [x] Premium listing packages (7-day, 30-day boost)
- [x] Verified carrier badge purchase
- [x] Transaction history
- [x] Payment escrow (hold until delivery)

### Dispute Resolution
- [x] File disputes on assignments
- [x] Dispute status tracking (open → in_review → resolved)
- [x] Escrow holds on active disputes

## What's Implemented (Feb 2026)

### Backend (100% Complete)
- FastAPI server with all CRUD endpoints
- JWT authentication with bcrypt password hashing
- MongoDB collections for all entities
- OpenAI integration via Emergent LLM key
- Stripe integration for payments
- WebSocket support for real-time messaging
- File upload handling (base64 encoded)

### Frontend (95% Complete)
- React with React Router DOM
- Industrial dark theme (Cyber-Noir design)
- All pages: Home, Auth, Dashboard, Loads, Messages, Calculator, Analytics, Payments, Profile, Assignments

### Integrations
- OpenAI GPT-4o-mini for thread summarization
- Stripe for payment processing (test mode)
- WebSocket for real-time updates

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Core auth flow
- [x] Load CRUD
- [x] Bidding system
- [x] Booking flow
- [x] Messaging

### P1 (High) - Done
- [x] AI summarization
- [x] Rate calculator
- [x] Lane preferences
- [x] Analytics dashboard
- [x] Payment packages

### P2 (Medium) - Done
- [x] Document upload
- [x] GPS tracking
- [x] Rating system
- [x] Dispute resolution
- [x] Verified carrier badges

### P3 (Future)
- [ ] Email notifications (SendGrid/Resend)
- [ ] Mobile PWA optimization
- [ ] Real-time bid notifications
- [ ] Load board map view
- [ ] Automated rate recommendations (ML)
- [ ] Multi-stop loads
- [ ] Team/fleet management
- [ ] Invoice generation
- [ ] Integration with ELD providers

## Technical Architecture
- **Frontend**: React 19, TailwindCSS, shadcn/ui components
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Database**: MongoDB (collections: users, loads, bids, assignments, messages, threads, documents, ratings, disputes, tracking_pings, payment_transactions, thread_summaries)
- **Auth**: JWT tokens with 72-hour expiration
- **Payments**: Stripe Checkout with webhook handling
- **AI**: OpenAI via emergentintegrations library

## Next Tasks
1. Add email notifications for key events
2. Implement push notifications for mobile
3. Build map-based load board view
4. Add automated rate suggestions based on market data
