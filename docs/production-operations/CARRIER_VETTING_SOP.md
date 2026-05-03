# Carrier Vetting SOP

## Carrier Packet Document List

The following documents must be collected and verified before a carrier is approved:

1. Signed broker-carrier agreement
2. W-9 form
3. Certificate of Insurance (COI) – auto liability and cargo coverage
4. FMCSA authority confirmation (active MC and DOT numbers)
5. Equipment list (type, count of trucks and trailers)

All documents must be on file before a carrier is assigned to any load.

## Vetting Steps

1. Confirm MC and DOT numbers.
2. Confirm active authority.
3. Confirm insurance.
4. Confirm cargo coverage.
5. Confirm auto liability coverage.
6. Collect W-9.
7. Collect signed broker-carrier agreement.
8. Verify equipment type.
9. Verify operating states.
10. Confirm dispatcher and driver contact.
11. Review safety history.
12. Confirm factoring or payment instructions.
13. Approve carrier before dispatch.

## Broker-Carrier Agreement Process

1. Send the Infamous Freight broker-carrier agreement to the carrier via email or the carrier portal.
2. The carrier reviews and returns a signed copy.
3. Verify that the legal entity name on the agreement matches the MC/DOT authority record.
4. File the signed agreement in the carrier's record folder under the path:
   `documents/carrier-packets/<MC_NUMBER>_agreement.pdf`
5. Source of truth for the agreement template: `templates/broker-carrier-agreement/`.

## W-9 Collection Process

1. Request a completed IRS Form W-9 from the carrier during onboarding.
2. Confirm the legal name and EIN on the W-9 match the FMCSA authority record.
3. Store the W-9 at: `documents/w9/<EIN>.pdf`
4. Do not dispatch the carrier until the W-9 is on file.
5. If the carrier uses a factoring company, collect W-9 from the factoring company as well.

## Insurance Collection Process

1. Request a Certificate of Insurance (COI) naming **Infamous Freight LLC** as the certificate holder.
2. Minimum required coverage:
   - Auto liability: **$1,000,000** per occurrence
   - Cargo coverage: **$100,000** per occurrence
3. Confirm the effective and expiration dates. Insurance must be active at the time of dispatch.
4. Verify that the insured name on the COI matches the carrier's legal entity name.
5. Store the COI at: `documents/coi/<MC_NUMBER>_coi.pdf`
6. Set a calendar reminder 30 days before the COI expiration date to request a renewal.
7. A carrier with expired insurance must be moved to **Expired** status immediately.

## Carrier Approval Criteria

A carrier may be approved only when all of the following conditions are met:

- Active FMCSA authority (no pending revocation or out-of-service order)
- Safety rating is Satisfactory or Conditional (Unsatisfactory is disqualifying)
- Out-of-service rate is within acceptable FMCSA industry averages
- Valid auto liability insurance ($1,000,000 minimum) on file
- Valid cargo insurance ($100,000 minimum) on file
- Signed broker-carrier agreement on file
- W-9 on file
- No red flags identified during vetting
- Approval granted by the Operations Manager

## Carrier Statuses

| Status    | Definition |
|-----------|------------|
| **Pending**  | Carrier application received; document collection is in progress; carrier is not yet approved for dispatch. |
| **Approved** | All required documents are collected and verified; carrier has passed vetting; carrier may be assigned to loads. |
| **Rejected** | Carrier failed one or more approval criteria or exhibited red flags; carrier may not be used. |
| **Expired**  | A previously approved carrier's insurance or authority has lapsed; carrier is suspended from dispatch until documents are renewed and re-verified. |

Status changes must be logged in the carrier record with the date and the name of the Operations Manager who made the change.

## Storage Location and Retention

| Document | Storage Path | Naming Convention |
|----------|-------------|-------------------|
| Carrier packet (full) | `documents/carrier-packets/` | `<MC_NUMBER>_packet_<YYYY-MM-DD>.pdf` |
| Broker-carrier agreement | `documents/carrier-packets/` | `<MC_NUMBER>_agreement.pdf` |
| W-9 | `documents/w9/` | `<EIN>.pdf` |
| Certificate of Insurance | `documents/coi/` | `<MC_NUMBER>_coi.pdf` |

- **Retention period:** Retain all carrier documents for a minimum of **3 years** from the last date of dispatch or the end of the business relationship, whichever is later.
- **Access:** Only Operations team members and authorized administrators may access carrier documents.
- **Backup:** Documents are backed up as part of the platform's standard backup process. See `BACKUP_RESTORE_VERIFICATION.md` for details.

## Approval Owner

The **Operations Manager** is responsible for final carrier approval and status changes. No carrier may be moved from Pending to Approved without the Operations Manager's sign-off.

## Red Flags

- New authority with no history
- Insurance mismatch
- Company name mismatch
- Email domain mismatch
- Refusal to provide documents
- Poor communication
- Repeated contact changes
