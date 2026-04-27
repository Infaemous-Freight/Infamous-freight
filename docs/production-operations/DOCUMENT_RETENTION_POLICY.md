# Document Retention Policy

## Purpose

This policy defines how Infamous Freight stores, names, retains, and controls access to freight documents in order to meet regulatory, operational, and audit requirements.

## Required Documents

The following documents must be collected and retained for every load:

| Document | Description |
|---|---|
| Rate Confirmation | Signed rate confirmation from carrier before dispatch |
| Bill of Lading (BOL) | Issued at pickup; signed by shipper and carrier |
| Proof of Delivery (POD) | Signed delivery receipt collected after delivery |
| Carrier W-9 | Tax identification form from every carrier |
| Broker-Carrier Agreement | Signed agreement before first dispatch |
| Certificate of Insurance (COI) | Current auto liability and cargo insurance |
| Shipper Agreement | Signed agreement before first shipment |
| Invoice | Customer invoice for each completed load |
| Carrier Payment Record | Remittance detail for each carrier payment |

## Storage Location

All documents are stored digitally in the Infamous Freight document management system.

- **Primary storage:** Supabase Storage bucket `freight-documents` (private, access-controlled)
- **Database reference:** Each uploaded file is linked to a record in the `documents` table with `load_id`, `carrier_id`, or `customer_id`
- **Folder structure:**

```
freight-documents/
  loads/
    {load_id}/
      bol/
      pod/
      rate-confirmation/
      invoices/
  carriers/
    {carrier_id}/
      w9/
      agreements/
      insurance/
  customers/
    {customer_id}/
      agreements/
```

## Naming Convention

Files must follow this naming convention:

```
{DOCUMENT_TYPE}-{LOAD_OR_ENTITY_ID}-{YYYYMMDD}.{ext}
```

Examples:

| File | Example Name |
|---|---|
| Bill of Lading | `BOL-LOAD-20240515-001.pdf` |
| Proof of Delivery | `POD-LOAD-20240515-001.pdf` |
| Rate Confirmation | `RATECON-LOAD-20240515-001.pdf` |
| Carrier W-9 | `W9-CARRIER-12345-20240101.pdf` |
| Broker-Carrier Agreement | `BCA-CARRIER-12345-20240101.pdf` |
| Certificate of Insurance | `COI-CARRIER-12345-20240101.pdf` |
| Shipper Agreement | `SA-CUSTOMER-67890-20240101.pdf` |
| Invoice | `INV-LOAD-20240515-001.pdf` |

## Retention Period

| Document Type | Retention Period | Basis |
|---|---|---|
| Bill of Lading | 7 years | FMCSA 49 CFR 371.3 |
| Proof of Delivery | 7 years | FMCSA 49 CFR 371.3 |
| Rate Confirmation | 7 years | FMCSA 49 CFR 371.3 |
| Broker-Carrier Agreement | 7 years from last transaction | FMCSA 49 CFR 371.3 |
| Shipper Agreement | 7 years from last transaction | FMCSA 49 CFR 371.3 |
| Certificate of Insurance | 3 years after policy expiry | Internal policy |
| W-9 | 7 years | IRS record-keeping guidance |
| Invoice | 7 years | IRS record-keeping guidance |
| Carrier Payment Record | 7 years | IRS record-keeping guidance |

Documents are not deleted before the retention period expires. After the retention period, documents are reviewed and purged in a documented annual purge cycle.

## Access Control

| Role | Permissions |
|---|---|
| Operations owner / Admin | Full read, write, upload, download, delete |
| Dispatcher | Read and upload for assigned loads |
| Carrier | Upload only (COI, W-9 during onboarding) |
| Shipper / Customer | Download for their own load documents only |
| Finance | Read access for invoices and payment records |

**Access control owner:** Operations Manager (Infamous Freight)

Access is managed through role-based permissions in the application. Document storage credentials are stored as environment secrets and are not exposed to end users.

## Backup Process

- Supabase performs automated daily backups of the database and storage bucket.
- Critical documents (BOL, POD, Rate Confirmation) are retained in the `freight-documents` Supabase bucket and are covered by the Supabase point-in-time recovery window.
- A secondary backup of all documents is performed via a scheduled export job that saves files to a separate, access-controlled cloud backup destination.
- Backup integrity is verified monthly by the operations owner.
- The backup verification procedure is documented in `docs/BACKUP_RESTORE_VERIFICATION.md`.

## Compliance Checklist Update

When the document retention process is operational, record evidence in:

`docs/production-operations/PRODUCTION_READINESS_EVIDENCE.md` → Document Retention Evidence section

Update the compliance checklist item **Document retention process** to confirmed status.
