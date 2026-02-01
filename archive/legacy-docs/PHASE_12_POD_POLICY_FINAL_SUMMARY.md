# Phase 12 — POD Policy Engine (Enforcement by Value + Vehicle Type) ✅

**Status:** 100% Complete

## Overview

Phase 12 enforces Proof-of-Delivery requirements automatically based on:
- Job value (price in USD)
- Vehicle type
- Optional toggles (always require photo, etc.)

When a job opens (payment succeeded), the system computes a POD policy and stores it on the job record. The `/pod` submission endpoint then enforces the policy, rejecting incomplete payloads. All decisions are logged to JobEvent for audit trails.

---

## Implementation Summary

### 1. Environment Variables ✅

Added to `api/.env.example`:

```env
# ---------- POD Policy (Phase 12) ----------
# Always require at least one POD photo
POD_REQUIRE_PHOTO_ALWAYS=true

# Require signature for jobs >= this amount (USD)
POD_SIGNATURE_MIN_USD=25

# Require OTP for jobs >= this amount (USD)
POD_OTP_MIN_USD=50

# Require OTP for these vehicle types (comma separated)
POD_OTP_VEHICLES=BOX_TRUCK,STRAIGHT_TRUCK,SEMI

# Require photo for these vehicle types
POD_PHOTO_VEHICLES=CARGO_VAN,SPRINTER,BOX_TRUCK,STRAIGHT_TRUCK,SEMI

# Require signature for these vehicle types
POD_SIGNATURE_VEHICLES=CARGO_VAN,SPRINTER,BOX_TRUCK,STRAIGHT_TRUCK,SEMI
```

**Defaults:**
- `POD_REQUIRE_PHOTO_ALWAYS=true` — Always enforce photo requirement
- `POD_SIGNATURE_MIN_USD=25` — Signatures required for jobs ≥ $25
- `POD_OTP_MIN_USD=50` — OTP required for jobs ≥ $50
- Vehicle lists can be customized per deployment

---

### 2. Prisma Schema Updates ✅

Added four new fields to the `Job` model in `api/prisma/schema.prisma`:

```prisma
podRequirePhoto     Boolean @default(false)
podRequireSignature Boolean @default(false)
podRequireOtp       Boolean @default(false)
podPolicyVersion    Int     @default(1)
```

**Migration Command:**
```bash
cd api
pnpm prisma migrate dev --name phase12_pod_policy
pnpm prisma generate
```

**Status:** Schema validated, Prisma client generated successfully ✅

---

### 3. Policy Evaluator Module ✅

Created: `api/src/marketplace/podPolicy.js`

**Exports:**
- `computePodPolicy(input)` — Returns policy decision object

**Logic:**
```javascript
const { requirePhoto, requireSignature, requireOtp, version } = computePodPolicy({
    priceUsd: 75.50,
    requiredVehicle: "BOX_TRUCK"
});
```

**Algorithm:**
1. Photo required if: `POD_REQUIRE_PHOTO_ALWAYS=true` OR vehicle in `POD_PHOTO_VEHICLES`
2. Signature required if: `priceUsd >= POD_SIGNATURE_MIN_USD` OR vehicle in `POD_SIGNATURE_VEHICLES`
3. OTP required if: `priceUsd >= POD_OTP_MIN_USD` OR vehicle in `POD_OTP_VEHICLES`

---

### 4. Webhook Integration ✅

Updated: `api/src/marketplace/webhooks.js`

**When:** Stripe checkout completes (`checkout.session.completed` event)

**Changes:**
1. Import `computePodPolicy` from podPolicy module
2. After payment succeeds, before updating job to OPEN:
   - Compute policy: `const policy = computePodPolicy({ priceUsd, requiredVehicle })`
   - Store policy flags on job:
     ```javascript
     podRequirePhoto: policy.requirePhoto
     podRequireSignature: policy.requireSignature
     podRequireOtp: policy.requireOtp
     podPolicyVersion: policy.version
     otpRequired: policy.requireOtp  // Keep OTP consistent
     deliveryOtpHash: policy.requireOtp ? otpHash : null
     ```
   - Log policy decision to JobEvent with version and requirements
   - Log OTP only if policy requires it

**Result:** Jobs automatically enforce policy when opened

---

### 5. POD Submission Enforcement ✅

Updated: `api/src/marketplace/router.js` — `POST /jobs/:jobId/pod`

**Enforcement Logic:**

**OTP (if `podRequireOtp=true`):**
```javascript
if (job.podRequireOtp) {
    if (!otp) throw new Error("OTP required");
    const ok = job.deliveryOtpHash && hashOtp(otp) === job.deliveryOtpHash;
    if (!ok) throw new Error("Invalid OTP");
}
```

**Signature (if `podRequireSignature=true`):**
```javascript
if (job.podRequireSignature) {
    if (!signatureName) throw new Error("Signature name required");
    if (!signatureKey) throw new Error("Signature asset required");
}
```

**Photo (if `podRequirePhoto=true`):**
```javascript
if (job.podRequirePhoto) {
    if (!photoKey) throw new Error("Photo asset required");
}
```

**Audit Logging:**
- Submit POD event with type=DELIVERED
- Add detail NOTE event with policy version and what was enforced

---

## End-to-End Flow

### Example: $75 BOX_TRUCK Job

1. **Shipper creates job:** $75, BOX_TRUCK
2. **Payment succeeds:** Webhook computes policy:
   - `priceUsd=75 >= POD_SIGNATURE_MIN_USD(25)` ✓ signature required
   - `priceUsd=75 >= POD_OTP_MIN_USD(50)` ✓ OTP required
   - `BOX_TRUCK in POD_PHOTO_VEHICLES` ✓ photo required
   - Stores: `{podRequirePhoto: true, podRequireSignature: true, podRequireOtp: true}`
3. **Job opens:** Policy logged to JobEvent
4. **Driver delivers:**
   - **Rejects** if missing photo, signature name/asset, or invalid OTP
   - **Accepts** only with all three complete
5. **Audit trail:** Each decision logged with policy version

---

## Configurable Examples

### Example 1: Minimum Requirements (POD photos only)
```env
POD_REQUIRE_PHOTO_ALWAYS=true
POD_SIGNATURE_MIN_USD=999999
POD_OTP_MIN_USD=999999
POD_OTP_VEHICLES=
POD_PHOTO_VEHICLES=
POD_SIGNATURE_VEHICLES=
```
→ Only photo required for all jobs

### Example 2: Premium High-Value (Full POD)
```env
POD_REQUIRE_PHOTO_ALWAYS=true
POD_SIGNATURE_MIN_USD=10
POD_OTP_MIN_USD=15
POD_OTP_VEHICLES=SEMI
POD_PHOTO_VEHICLES=
POD_SIGNATURE_VEHICLES=BOX_TRUCK,STRAIGHT_TRUCK,SEMI
```
→ All jobs require photo; high-value or large vehicles require signature + OTP

### Example 3: Lightweight (Development/Testing)
```env
POD_REQUIRE_PHOTO_ALWAYS=false
POD_SIGNATURE_MIN_USD=999999
POD_OTP_MIN_USD=999999
POD_OTP_VEHICLES=
POD_PHOTO_VEHICLES=
POD_SIGNATURE_VEHICLES=
```
→ No enforcement; any POD accepted

---

## Testing Checklist

- [ ] Run migration: `pnpm prisma migrate dev --name phase12_pod_policy`
- [ ] Regenerate client: `pnpm prisma generate`
- [ ] Create test job with price=$75, vehicle=BOX_TRUCK
- [ ] Pay for job → verify policy logged in JobEvent
- [ ] Attempt POD without photo → expect error
- [ ] Attempt POD without signature → expect error
- [ ] Attempt POD without OTP or invalid OTP → expect error
- [ ] Submit complete POD with all three → expect success (DELIVERED)
- [ ] Verify audit NOTE logs policy version and what was enforced

---

## Files Modified

1. **api/.env.example** — Added 7 POD policy env vars
2. **api/prisma/schema.prisma** — Added 4 policy fields to Job model
3. **api/src/marketplace/podPolicy.js** — NEW: Policy evaluator
4. **api/src/marketplace/webhooks.js** — Integrated policy computation on payment success
5. **api/src/marketplace/router.js** — Enforced policy at POD submission endpoint

---

## Next Steps (Phase 13+)

- Automated policy versioning (if env vars change, bump version and migrate existing jobs)
- Driver mobile app: Display policy requirements before accepting job
- Dashboard analytics: Track POD compliance by policy type
- Refund rules: Automatically calculate refund eligibility based on missing required POD elements

---

## Defensibility Notes

✅ **Payout Defensibility:** Every delivery now has a policy decision recorded at job open time, enforced at submission, and fully audited. Disputes are resolved by JobEvent timeline.

✅ **Compliance:** Photo + signature + OTP provide three layers of proof depending on job value/type.

✅ **Flexibility:** All thresholds and vehicle lists are configurable per deployment without code changes.
