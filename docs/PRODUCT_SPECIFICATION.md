# Product Specification

## V1 – Revenue Engine

### 1. Load Management

**Fields:**
- `load_id`
- `tenant_id`
- `broker_id`
- `pickup_location`
- `delivery_location`
- `rate`
- `mileage`
- `status`
- `driver_id`
- `created_at`
- `updated_at`

**Statuses:**
- Draft
- Dispatched
- In Transit
- Delivered
- Invoiced
- Paid

---

### 2. Broker Database

**Fields:**
- `broker_id`
- `company_name`
- `mc_number`
- `credit_score`
- `average_payment_days`
- `blacklisted` (boolean)

**Trust Score Algorithm:**

Score = weighted average of:
- Payment history
- External credit rating
- User reports

---

### 3. Invoice Automation

**Trigger:**  
When load status → Delivered

**Process:**
- Generate PDF
- Store in S3
- Mark `invoice_sent_at`
- Begin payment tracking timer

---

### 4. Role-Based Access Control

**Roles:**
- Owner
- Dispatcher
- Driver
- Admin

**Permission Matrix:**

| Feature | Owner | Dispatcher | Driver |
|---|---|---|---|
| Create Load | ✅ | ✅ | ❌ |
| Edit Load | ✅ | ✅ | ❌ |
| View Assigned Load | ✅ | ✅ | ✅ |
| View Financials | ✅ | ❌ | ❌ |

---

## V2 – Intelligence Layer

### AI Lane Profitability Predictor

**Inputs:**
- Lane history
- Fuel cost
- Detention time
- Broker reliability
- Seasonality

**Output:**
- Expected net profit
- Risk score
- Recommendation (Accept / Negotiate / Decline)

---

### Fuel Optimization Engine
- Pull regional diesel pricing
- Calculate optimal fuel stops
- Display route map with cost projections

---

## V3 – Enterprise
- Subdomain per fleet
- SSO (SAML/OAuth)
- API access tokens
- White-label dashboard
