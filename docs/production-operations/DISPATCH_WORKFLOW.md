# Dispatch Workflow

## Purpose

This workflow defines how Infamous Freight coordinates a shipment from carrier assignment through final delivery confirmation.

## Pre Pickup

- Confirm carrier identity.
- Confirm driver contact.
- Confirm truck and trailer details.
- Confirm pickup address.
- Confirm appointment time.
- Confirm commodity, weight, and handling notes.

## Pickup

- Confirm driver arrival.
- Confirm freight is loaded.
- Confirm bill of lading is received.
- Record departure time.

## In Transit

- Confirm driver location updates.
- Confirm estimated arrival time.
- Notify the shipper about delays.
- Document any exceptions.

## Delivery

- Confirm driver arrival.
- Confirm unloading status.
- Collect signed proof of delivery.
- Notify shipper when delivery is complete.

## Closeout

- Save proof of delivery.
- Update shipment status.
- Send invoice package.
- Schedule shipper follow up.

---

## Shipment Tracking Workflow

### Shipment Statuses

| Internal Status | Customer-Facing Label   | Trigger                                      |
|-----------------|-------------------------|----------------------------------------------|
| `booked`        | Shipment Booked         | Load is created and carrier is confirmed.    |
| `assigned`      | Carrier Assigned        | Driver and truck details are confirmed.      |
| `picked_up`     | Picked Up               | Bill of lading is received and driver departs. |
| `in_transit`    | In Transit              | Driver provides first location update.       |
| `delayed`       | Delayed                 | ETA changes by more than two hours.          |
| `exception`     | Exception               | Damage, refusal, or other incident reported. |
| `delivered`     | Delivered               | Signed proof of delivery is collected.       |
| `closed`        | Closed                  | POD is saved and invoice package is sent.    |

### Dispatcher Update Process

1. Open the load record in the dispatch board.
2. Select the new status from the status dropdown.
3. Add an internal note describing the reason for the update (required for `delayed` and `exception` statuses).
4. Save the update. The system records the timestamp, dispatcher ID, and new status.
5. Only users with the `dispatcher` or `admin` role may update shipment status.

### Customer Visibility Rules

- Statuses `booked`, `picked_up`, `in_transit`, `delayed`, `exception`, and `delivered` are visible to the customer on their tracking page.
- The `assigned` status is internal only and is not shown to customers.
- The `closed` status is shown to customers as **Delivered** until the invoice is paid.
- Internal notes entered by dispatchers are never shown to customers.
- Customer-facing status messages use the **Customer-Facing Label** column from the table above.

### Exception and Delay Messaging

**Delay process:**
1. Dispatcher updates the load status to `delayed`.
2. Dispatcher enters the revised ETA and a brief reason in the internal notes.
3. An automated SMS notification is sent to the shipper contact using the template: _"Your shipment [LOAD ID] is running behind schedule. Updated ETA: [NEW ETA]. Contact your dispatcher for details."_
4. Dispatcher calls or emails the shipper to confirm receipt.

**Exception process:**
1. Dispatcher updates the load status to `exception`.
2. Dispatcher documents the nature of the exception (damage, refusal, accident, etc.) in the internal notes.
3. Dispatcher notifies the shipper and carrier immediately by phone.
4. Dispatcher opens an incident report and attaches any photos or documents.
5. Operations manager reviews the exception within one hour of logging.

### Test Load Status Update

A test load status update must be run before this workflow is considered verified. Record the test result in `PRODUCTION_READINESS_EVIDENCE.md` under the Tracking Evidence section.

Steps for the test:
1. Create a test load with status `booked`.
2. Advance the status to `assigned`, `picked_up`, `in_transit`, and `delivered` using the API endpoint `POST /api/workflows/loads/:loadId/tracking-updates`.
3. Confirm each status change is recorded in the data store with the correct timestamp.
4. Confirm the customer-visible status updates match the rules above.
5. Log the test load ID and result in `PRODUCTION_READINESS_EVIDENCE.md`.
