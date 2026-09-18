# Infamous Freight SaaS Product Specification

Updated 2026-09-17.

## Product position

Infamous Freight is an AI-powered freight operations SaaS/web application. The SaaS layer provides recurring software access to shippers, freight operators, carriers, and dispatch organizations. Freight brokerage/marketplace activity is a separate operating model and must not be represented as active until the applicable legal, authority, contract, insurance, and payment requirements are satisfied.

## Core users

- Shipper: request quotes, approve freight, track shipments, receive PODs, manage invoices.
- Operator/dispatcher: manage quotes, loads, assignments, exceptions, tracking, documents, billing, and audit history.
- Carrier: maintain company profile and compliance documents, view/request eligible loads, manage assignments.
- Driver: execute assigned load steps from mobile, update status, upload BOL/POD, report exceptions.
- Administrator: organization, users, roles, billing, integrations, security, and audit controls.
- Genesis AI: cross-role operational assistant with bounded execution and authorization controls.

## SaaS navigation

Dashboard, Quotes, Loads, Dispatch, Tracking, Carriers, Drivers, Compliance, Invoices, Payments, Analytics, Genesis AI, Settings.

Mobile navigation: Home, Loads, Dispatch, Messages, Genesis.

## Primary workflows

### Shipper
Request quote -> review quote -> approve -> load created -> carrier assigned -> tracking -> delivery -> POD -> invoice -> payment.

### Operator
Intake -> quote -> load -> carrier verification -> assignment -> dispatch -> tracking -> exception handling -> delivery/POD -> invoice -> reconciliation.

### Carrier
Onboard -> authority/insurance/document verification -> eligible load discovery -> request/accept -> assignment -> dispatch -> pickup -> in transit -> delivery -> POD.

### Driver
Assigned load -> pickup instructions -> check-in -> status updates -> navigation -> exception reporting -> BOL/POD -> delivered.

## Revenue model

### SaaS subscriptions

- Starter: $99/month
- Professional: $249/month
- Enterprise: $499+/month
- Carrier Pro: $29/month
- Carrier Pro+: $79/month

These are product configuration defaults. Live Stripe Price IDs are authoritative once a production Stripe account is connected.

### Freight and service revenue

Freight transaction fees, dispatch fees, or carrier settlement economics may be enabled only after Infamous Freight's actual legal operating model is selected and the required contracts, authority, financial responsibility, insurance, tax, and payment controls are verified.

## Genesis operating contract

Genesis can:
1. Explain
2. Collect information
3. Recommend
4. Prepare
5. Execute only actions for which the authenticated user and organization have granted authority

Binding quote commitments, booking, carrier approval, dispatch assignment, freight payment, refunds, account changes, and other material actions require explicit authorized execution and an auditable event.

Genesis must never treat estimated HOS as authoritative, approve an unverified carrier, invent freight availability, or silently move money.

## Production gates

The SaaS product is not considered fully live until all of these are evidenced:

- Current main commit deployed to canonical production.
- Production database migration state verified.
- Authentication and organization isolation verified.
- Subscription checkout and webhook reconciliation verified in live Stripe.
- Invoice/payment ledger reconciles to provider events.
- Carrier onboarding and compliance source verification completed for the selected operating model.
- Dispatch assignment, realtime shipment events, POD, and audit history verified.
- Mobile driver workflow verified before live driver operations.
- Security headers, secrets scanning, dependency/security checks, and rollback evidence captured.

## Current release posture

The repository contains the SaaS foundation and pricing architecture. The canonical Netlify production deploy is older than the current main branch, and the connected Stripe accounts are test-mode only. Therefore this specification describes the target SaaS product; it does not claim that every module is currently production-live.

## Product principle

One shared freight record should connect the shipper web experience, operator command center, carrier workspace, driver mobile workflow, financial ledger, realtime tracking, and Genesis AI.
