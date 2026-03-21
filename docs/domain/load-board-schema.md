# Load Board Domain Blueprint

## Purpose

This blueprint defines the canonical domain model for Infamous Freight's load board. It is intended to be implementation-ready for engineers designing relational tables, API contracts, events, validation rules, search indexes, and UI forms.

The design supports these freight offerings:

- Dry van
- Reefer
- Flatbed
- Power only
- Box truck
- Cargo van
- Hotshot
- Parcel
- Partial / LTL
- Oversized
- Hazmat
- Drayage
- Intermodal
- Last-mile delivery

This document does **not** prescribe code, framework, or storage engine. It defines the business objects, enumerations, ownership rules, field placement, validation expectations, and edge-case handling.

---

## 1. Domain Boundaries

### 1.1 What a `Load` represents
A `Load` is the commercial and operational record for a shipment opportunity or booked move being managed on the load board. It is the parent aggregate for:

- Customer-facing posting details
- Freight requirements
- Pricing and financial targets
- Pickup / delivery scheduling
- Compliance and special handling requirements
- Tracking expectations
- Related stops
- Related documents
- Assignment history
- Status history

A single `Load` may be:

- Uncovered and publicly/internal posted
- Tendered to one or more carriers
- Covered by an internal fleet asset or external carrier
- In transit with active tracking
- Completed, cancelled, or archived

### 1.2 What is **not** stored directly on `Load`
Do **not** overload the main `Load` record with repeated, historical, or stop-specific data. Those belong in child models:

- Each pickup, drop, terminal, rail ramp, port, or last-mile destination belongs in `LoadStop`
- Each uploaded file belongs in `LoadDocument`
- Each assignment or reassignment belongs in `LoadAssignment`
- Each lifecycle change belongs in `LoadStatusHistory`
- Each check call / GPS ping / tracking event belongs in a future tracking event model, not the main `Load`

---

## 2. Canonical Aggregate

The canonical load-board aggregate should contain at least these related concepts:

- `Load` (parent)
- `LoadStop` (1-to-many)
- `LoadDocument` (1-to-many)
- `LoadAssignment` (1-to-many, future-ready)
- `LoadStatusHistory` (1-to-many, future-ready)

Optional but strongly recommended future child models:

- `LoadTrackingEvent`
- `LoadQuote` or `LoadOffer`
- `LoadCommodityLine`
- `LoadAccessorial`
- `LoadReferenceNumber`
- `LoadEquipmentRequirement`
- `LoadComplianceCheck`

---

## 3. Main `Load` Model

The main `Load` model should contain only fields that apply to the whole shipment or are needed for list/search/filter operations.

### 3.1 Identity and tenancy

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `id` | UUID | Yes | System-generated primary identifier |
| `tenant_id` | UUID | Yes | Required on every load; primary ownership boundary |
| `owning_company_id` | UUID | Yes | Company or operating entity that owns the load record |
| `business_unit_id` | UUID | No | Optional subdivision for enterprise tenants |
| `created_by_user_id` | UUID | Yes | User who created the load |
| `updated_by_user_id` | UUID | No | Last modifying user |
| `created_at` | timestamp | Yes | Audit field |
| `updated_at` | timestamp | Yes | Audit field |
| `archived_at` | timestamp | No | Soft archive marker |
| `deleted_at` | timestamp | No | Soft delete marker if used |

### 3.2 Core references

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `load_number` | string | Yes | Human-readable unique number within tenant |
| `customer_load_number` | string | No | Customer-provided reference |
| `external_posting_id` | string | No | Link to marketplace posting or external source |
| `source_system` | enum/string | No | TMS, manual, EDI, API, marketplace, etc. |
| `reference_numbers` | child model preferred | No | Keep only a compact summary on `Load`; detailed list belongs in child records |

### 3.3 Commercial ownership and parties

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `customer_account_id` | UUID | No | Shipper, broker customer, or house account |
| `bill_to_account_id` | UUID | No | Party responsible for billing |
| `brokerage_rep_user_id` | UUID | No | Internal rep handling brokerage side |
| `dispatch_team_id` | UUID | No | Team currently responsible |
| `mode_of_service_owner` | enum | Yes | `brokered`, `asset`, `hybrid` |

### 3.4 Operational classification

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `status` | enum | Yes | Current lifecycle status; see status catalog |
| `load_mode` | enum | Yes | Primary move type; see load modes |
| `equipment_type` | enum | Yes | Primary required equipment; see equipment catalog |
| `equipment_detail` | string | No | Freeform supplemental detail, e.g. `53' air-ride dry van` |
| `is_partial` | boolean | Yes | Whether load can share capacity |
| `is_ltl` | boolean | Yes | LTL handling flag |
| `is_team_required` | boolean | Yes | Required for team drivers |
| `is_hazmat` | boolean | Yes | High-signal filter field |
| `is_oversized` | boolean | Yes | High-signal filter field |
| `is_refrigerated` | boolean | Yes | High-signal filter field |
| `is_high_value` | boolean | Yes | Used for security / insurance workflows |
| `is_drop_trailer` | boolean | Yes | Important for dry van / reefer / power only |
| `is_live_load` | boolean | No | Nullable if not yet known |
| `is_live_unload` | boolean | No | Nullable if not yet known |
| `requires_escort` | boolean | No | Oversize requirement |
| `requires_twic` | boolean | No | Port / drayage / secure terminal requirement |
| `requires_tanker_endorsement` | boolean | No | Rare but possible if hazmat or bulk support expands |

### 3.5 Freight summary

These fields belong on `Load` because they are commonly filtered, searched, quoted, and displayed in load-board cards.

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `commodity_description` | string | Yes | Board-safe summary of freight |
| `commodity_category` | enum/string | No | Consumer goods, produce, steel, machinery, retail parcel, etc. |
| `piece_count` | integer | No | Total pieces across shipment |
| `package_type` | enum/string | No | Pallets, cartons, crates, drums, loose, containers |
| `total_weight_lb` | decimal | No | Total shipment weight |
| `total_length_ft` | decimal | No | Important for hotshot / oversize |
| `total_volume_cuft` | decimal | No | Helpful for parcel, cargo van, box truck, LTL |
| `linear_feet` | decimal | No | Important for partial / LTL / flatbed |
| `load_bar_count` | integer | No | Optional securement summary |
| `pallet_count` | integer | No | Common planning field |
| `handling_unit_count` | integer | No | Broader than pallets |
| `declared_value_amount` | decimal(12,2) | No | Security, claims, insurance |
| `temperature_min_f` | decimal | No | Reefer only |
| `temperature_max_f` | decimal | No | Reefer only |
| `temperature_setpoint_f` | decimal | No | Reefer only; canonical target |
| `temperature_control_mode` | enum | No | `continuous`, `start_stop`, `protect_from_freeze`, `protect_from_heat` |
| `hazmat_un_number` | string | No | Populate when hazmat |
| `hazmat_class` | string | No | Populate when hazmat |
| `hazmat_packing_group` | string | No | Populate when hazmat |
| `nmfc_class` | string | No | Especially useful for LTL |

### 3.6 Timing and service windows

Load-level timing fields are for the overall shipment. Exact stop appointments belong on `LoadStop`.

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `shipment_date` | date | No | Commercial ship date |
| `first_pickup_window_start` | timestamp | No | Derived from earliest pickup stop for filtering |
| `first_pickup_window_end` | timestamp | No | Derived field for board display |
| `final_delivery_window_start` | timestamp | No | Derived from final delivery stop |
| `final_delivery_window_end` | timestamp | No | Derived field for board display |
| `transit_deadline_at` | timestamp | No | Hard service deadline |
| `posting_expires_at` | timestamp | No | When posting should be hidden |
| `must_deliver_by_at` | timestamp | No | SLA-critical deadline |

### 3.7 Geography and lane summary

Use summary lane fields on `Load` for search, pricing, and matching. Detailed addresses live on `LoadStop`.

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `origin_city` | string | No | Derived from first pickup stop |
| `origin_state` | string | No | Derived |
| `origin_postal_code` | string | No | Derived, if appropriate |
| `origin_country_code` | string | No | Derived |
| `destination_city` | string | No | Derived from final delivery stop |
| `destination_state` | string | No | Derived |
| `destination_postal_code` | string | No | Derived |
| `destination_country_code` | string | No | Derived |
| `origin_market_area` | string | No | Search clustering |
| `destination_market_area` | string | No | Search clustering |
| `loaded_distance_miles` | decimal | No | Planned loaded miles |
| `empty_distance_miles` | decimal | No | Optional positioning estimate |
| `route_distance_source` | enum/string | No | Manual, map service, rating engine |

### 3.8 Pricing and rate fields

These are canonical commercial fields for a load board. Keep a single normalized rate summary on `Load`; detailed quotes and revisions belong in child tables later.

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `currency_code` | string | Yes | Usually `USD`, but do not hardcode |
| `customer_rate_amount` | decimal(12,2) | No | What customer pays |
| `carrier_rate_amount` | decimal(12,2) | No | Target or booked carrier pay |
| `all_in_buy_amount` | decimal(12,2) | No | Includes planned accessorials on buy side |
| `all_in_sell_amount` | decimal(12,2) | No | Includes planned accessorials on sell side |
| `fuel_surcharge_amount` | decimal(12,2) | No | Separate if needed |
| `accessorial_amount` | decimal(12,2) | No | Planned or included accessorial total |
| `target_margin_amount` | decimal(12,2) | No | Planning field |
| `target_margin_percent` | decimal(5,2) | No | Planning field |
| `offer_floor_amount` | decimal(12,2) | No | Lowest acceptable buy |
| `offer_ceiling_amount` | decimal(12,2) | No | Ceiling for dynamic pricing/tendering |
| `rate_type` | enum | Yes | `flat`, `per_mile`, `per_stop`, `hourly`, `linehaul_plus_accessorials`, `parcel_zone`, `drayage_move` |
| `posted_rate_amount` | decimal(12,2) | No | Amount shown on board |
| `book_now_rate_amount` | decimal(12,2) | No | Instant-book amount if supported |
| `estimated_cost_per_mile` | decimal(8,4) | No | Internal analytics |
| `posted_rate_per_mile` | decimal(8,4) | No | Derived, not always exact |

### 3.9 Tracking and execution requirements

These fields belong on `Load` because they define top-level expectations.

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `tracking_requirement_level` | enum | Yes | `none`, `check_call`, `mobile_gps`, `eld_gps`, `telematics_api`, `milestone_only` |
| `tracking_interval_minutes` | integer | No | Required when recurring GPS/check call expected |
| `tracking_provider_preference` | enum/string | No | MacroPoint, Trucker Tools, internal app, ELD API |
| `tracking_must_start_by_stop_sequence` | integer | No | Usually before first loaded movement |
| `photo_proof_required` | boolean | Yes | POD/photo requirement |
| `signature_proof_required` | boolean | Yes | Delivery signature expectation |
| `seal_number_required` | boolean | Yes | For secure loads |
| `check_call_required` | boolean | Yes | Operational fallback |
| `geofence_arrival_required` | boolean | Yes | Advanced tracking feature |

### 3.10 Compliance and risk fields

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `insurance_minimum_cargo_amount` | decimal(12,2) | No | Tender qualification |
| `insurance_minimum_liability_amount` | decimal(12,2) | No | Tender qualification |
| `carrier_safety_rating_minimum` | enum/string | No | If tendering externally |
| `requires_food_grade_trailer` | boolean | No | Dry van / reefer use case |
| `requires_air_ride` | boolean | No | Fragile freight |
| `requires_straps` | boolean | No | Flatbed securement |
| `requires_tarps` | boolean | No | Flatbed securement |
| `requires_chains` | boolean | No | Heavy haul securement |
| `requires_edge_protectors` | boolean | No | Securement detail |
| `requires_lumper` | boolean | No | Cost/accessorial planning |
| `requires_customs_clearance` | boolean | No | Border / intermodal support |
| `requires_bonded_carrier` | boolean | No | Customs / international support |
| `requires_hazmat_certification` | boolean | No | Explicit tender gate |
| `hazmat_emergency_contact` | string | No | Required for hazmat workflows |
| `permit_required` | boolean | No | Oversize / overweight support |
| `permit_status` | enum | No | `not_required`, `pending`, `approved`, `rejected`, `expired` |
| `security_level` | enum | No | `standard`, `high_value`, `sealed`, `team_secure`, `escort_required` |

### 3.11 Notes and operational metadata

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `board_notes` | string | No | Safe-to-display posting note |
| `internal_notes` | string | No | Not visible externally |
| `driver_instructions` | string | No | Execution guidance |
| `special_handling_notes` | string | No | Hazmat, reefer, flatbed, retail, etc. |
| `search_tags` | string array / tag child model | No | Fast filtering |
| `custom_fields_json` | JSON object | No | Tenant-specific extension point |

---

## 4. `LoadStop` Child Model

`LoadStop` represents every operational stop. A stop may be a pickup, dropoff, transfer, terminal, rail ramp, drayage port, cross-dock, relay, or final-mile handoff.

### 4.1 Why stops are child records
The following data must **not** live directly on `Load` because it can vary by stop:

- Appointment windows
- Exact addresses
- Contact names and phone numbers
- Stop instructions
- Seal exchange
- Container details per stop
- Arrival / departure actual timestamps
- Stop-specific references
- Stop-specific temperature or securement instructions

### 4.2 Canonical fields

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `id` | UUID | Yes | Primary identifier |
| `load_id` | UUID | Yes | Parent load |
| `tenant_id` | UUID | Yes | Must match parent load tenant |
| `sequence_number` | integer | Yes | 1-based ordered stop sequence |
| `stop_type` | enum | Yes | `pickup`, `delivery`, `relay`, `terminal`, `port`, `rail_ramp`, `cross_dock`, `yard`, `return`, `handoff` |
| `stop_role` | enum | Yes | `origin`, `intermediate`, `destination` |
| `facility_name` | string | No | Warehouse/store/port name |
| `address_line_1` | string | Yes | Street address |
| `address_line_2` | string | No | Additional address |
| `city` | string | Yes | City |
| `state_province` | string | No | State/province |
| `postal_code` | string | No | ZIP/postal |
| `country_code` | string | Yes | ISO country code |
| `latitude` | decimal | No | Optional geolocation |
| `longitude` | decimal | No | Optional geolocation |
| `timezone` | string | No | Important for appointment calculations |
| `contact_name` | string | No | Stop contact |
| `contact_phone` | string | No | Stop contact |
| `contact_email` | string | No | Stop contact |
| `appointment_required` | boolean | Yes | Stop rule |
| `appointment_status` | enum | No | `not_required`, `pending`, `scheduled`, `confirmed`, `missed`, `reschedule_required` |
| `window_start_at` | timestamp | No | Earliest service time |
| `window_end_at` | timestamp | No | Latest service time |
| `scheduled_at` | timestamp | No | Exact appointment, if known |
| `arrived_at` | timestamp | No | Actual arrival |
| `departed_at` | timestamp | No | Actual departure |
| `completed_at` | timestamp | No | Stop completion |
| `reference_number` | string | No | PU#, DO#, appt#, container#, etc. |
| `stop_instructions` | string | No | Operational instructions |
| `is_live_load` | boolean | No | Stop-specific override |
| `is_live_unload` | boolean | No | Stop-specific override |
| `pallet_count` | integer | No | If stop-specific |
| `weight_change_lb` | decimal | No | For partial / multi-pick / multi-drop |
| `temperature_setpoint_f` | decimal | No | Reefer override at stop if needed |
| `requires_lumper` | boolean | No | Stop-specific accessorial expectation |
| `detention_free_minutes` | integer | No | Stop-specific detention rules |
| `sort_order_key` | string | No | Optional route optimization support |
| `created_at` | timestamp | Yes | Audit |
| `updated_at` | timestamp | Yes | Audit |

### 4.3 Stop-specific extensions by freight type

Additional stop-level fields are often needed for specialized moves:

- **Drayage / intermodal**: `port_code`, `terminal_code`, `container_number`, `container_size`, `container_type`, `last_free_day`, `outgate_at`, `ingate_at`, `pickup_number`
- **Retail / last-mile / parcel**: `delivery_service_level`, `residential_flag`, `liftgate_required`, `inside_delivery_required`, `call_ahead_required`, `recipient_name`
- **Oversize / flatbed**: `loading_side`, `crane_required`, `forklift_required`, `dock_type`, `securement_notes`
- **Hazmat**: `placard_required`, `segregation_notes`, `emergency_contact_on_site`

---

## 5. `LoadDocument` Child Model

`LoadDocument` stores metadata for files attached to a load. Actual binary storage can live in object storage.

### 5.1 Canonical fields

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `id` | UUID | Yes | Primary identifier |
| `load_id` | UUID | Yes | Parent load |
| `tenant_id` | UUID | Yes | Must match parent load tenant |
| `document_type` | enum | Yes | See document catalog below |
| `document_status` | enum | Yes | `pending`, `uploaded`, `verified`, `rejected`, `expired`, `superseded` |
| `storage_uri` | string | Yes | Canonical object location |
| `file_name` | string | Yes | Original name or display name |
| `mime_type` | string | No | e.g. PDF, JPG, PNG |
| `file_size_bytes` | integer | No | Useful for validation |
| `uploaded_by_user_id` | UUID | No | Uploader |
| `source` | enum/string | No | Driver app, broker ops, EDI, API, email ingest |
| `visibility` | enum | Yes | `internal`, `customer_visible`, `carrier_visible`, `driver_visible` |
| `stop_id` | UUID | No | Attach to a specific stop when relevant |
| `assignment_id` | UUID | No | Attach to a specific carrier/driver assignment |
| `effective_at` | timestamp | No | For permits or insurance artifacts |
| `expires_at` | timestamp | No | For expiring docs |
| `verified_by_user_id` | UUID | No | Verifier |
| `verified_at` | timestamp | No | Verification timestamp |
| `metadata_json` | JSON object | No | OCR fields, extracted refs, etc. |
| `created_at` | timestamp | Yes | Audit |
| `updated_at` | timestamp | Yes | Audit |

### 5.2 Document types to support

At minimum:

- `rate_confirmation`
- `bol`
- `pod`
- `invoice`
- `lumper_receipt`
- `scale_ticket`
- `weight_ticket`
- `hazmat_paperwork`
- `permit`
- `escort_confirmation`
- `reefer_temp_log`
- `pickup_photo`
- `delivery_photo`
- `damage_photo`
- `carrier_packet`
- `insurance_certificate`
- `customs_document`
- `drayage_release`
- `interchange_receipt`
- `container_notice`
- `other`

---

## 6. Future-Ready `LoadAssignment` Concept

Assignments must be modeled as a separate child entity even if the initial product only allows a single active assignee. This avoids corrupting history when loads are re-covered.

### 6.1 Assignment use cases

- Internal fleet dispatch to a driver or truck
- External carrier tender and acceptance
- Reassignment after fall-off
- Covering power-only vs trailer-provided combinations
- Multiple sequential assignees across the life of a load

### 6.2 Canonical fields

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `id` | UUID | Yes | Primary identifier |
| `load_id` | UUID | Yes | Parent load |
| `tenant_id` | UUID | Yes | Must match parent load tenant |
| `assignment_type` | enum | Yes | `internal_driver`, `internal_truck`, `carrier`, `owner_operator`, `delivery_partner` |
| `assigned_carrier_id` | UUID | No | External carrier |
| `assigned_driver_user_id` | UUID | No | Internal or contracted driver |
| `assigned_vehicle_id` | UUID | No | Tractor, straight truck, van |
| `assigned_trailer_id` | UUID | No | Trailer if relevant |
| `status` | enum | Yes | `proposed`, `offered`, `accepted`, `dispatched`, `in_progress`, `completed`, `rejected`, `removed`, `fall_off` |
| `is_primary` | boolean | Yes | Only one active primary assignment at a time |
| `assigned_at` | timestamp | Yes | Assignment timestamp |
| `accepted_at` | timestamp | No | Acceptance timestamp |
| `unassigned_at` | timestamp | No | Removal timestamp |
| `unassignment_reason` | enum/string | No | Fall off, customer cancel, no-show, safety, pricing |
| `pay_amount` | decimal(12,2) | No | Assignment-specific agreed compensation |
| `rate_confirmation_document_id` | UUID | No | Linked document |
| `notes` | string | No | Assignment-specific notes |
| `created_by_user_id` | UUID | Yes | Audit |
| `created_at` | timestamp | Yes | Audit |
| `updated_at` | timestamp | Yes | Audit |

### 6.3 Active assignment rule

A load may have many assignments historically, but only one **active primary execution assignment** at a time. The main `Load` record may store a convenience field such as `active_assignment_id`, but the source of truth remains the assignment table.

---

## 7. Future-Ready `LoadStatusHistory` Concept

The main `Load.status` holds only the current lifecycle state. Every transition must also be written to a history table.

### 7.1 Canonical fields

| Field | Type / Shape | Required | Notes |
|---|---|---:|---|
| `id` | UUID | Yes | Primary identifier |
| `load_id` | UUID | Yes | Parent load |
| `tenant_id` | UUID | Yes | Must match parent load tenant |
| `from_status` | enum | No | Nullable for initial creation |
| `to_status` | enum | Yes | New status |
| `reason_code` | enum/string | No | Trigger reason |
| `note` | string | No | Human explanation |
| `changed_by_user_id` | UUID | No | User or service actor |
| `changed_by_actor_type` | enum | Yes | `user`, `system`, `api`, `integration`, `customer`, `carrier` |
| `changed_at` | timestamp | Yes | Effective time |
| `stop_id` | UUID | No | If tied to stop milestone |
| `assignment_id` | UUID | No | If tied to assignment action |
| `metadata_json` | JSON object | No | Raw event payload |

### 7.2 Required behavior

- Every status mutation on `Load.status` should create a corresponding history record
- History must be append-only
- System-generated updates and user-generated updates should be distinguishable
- History should support timeline UI and SLA analytics

---

## 8. Status Catalog

The platform should use a controlled status catalog rather than arbitrary free text.

### 8.1 Recommended top-level load statuses

1. `draft` - created but not ready to post or tender
2. `pending_review` - operational/compliance review in progress
3. `posted` - visible on board and available for coverage
4. `tendering` - being offered to one or more carriers
5. `covered` - accepted by a carrier/driver but not yet dispatched
6. `dispatched` - execution instructions sent
7. `at_pickup` - carrier arrived at first live pickup or pickup event underway
8. `picked_up` - freight in possession
9. `in_transit` - en route between loaded stops
10. `at_delivery` - arrived at final or active delivery stop
11. `delivered` - freight delivered successfully
12. `completed` - paperwork and financial completion done
13. `exception` - issue requiring intervention
14. `on_hold` - intentionally paused
15. `cancelled` - cancelled before completion
16. `tonu` - truck ordered not used
17. `fall_off` - carrier or driver backed out after coverage
18. `expired` - posting expired without coverage
19. `archived` - closed and hidden from active operations

### 8.2 Status design notes

- `delivered` is the operational completion milestone
- `completed` is the administrative completion milestone
- `exception` should not replace the last operational state; some systems may also track an exception flag separately
- `tonu` is distinct from `cancelled` for brokerage settlement and analytics

---

## 9. Equipment Type Catalog

The canonical equipment list must support the required freight types while remaining extensible.

### 9.1 Recommended equipment types

- `dry_van_53`
- `dry_van_48`
- `reefer_53`
- `reefer_48`
- `flatbed_48`
- `flatbed_53`
- `step_deck`
- `double_drop`
- `lowboy`
- `rgn`
- `conestoga`
- `power_only`
- `box_truck_26`
- `box_truck_24`
- `cargo_van`
- `sprinter_van`
- `hotshot_40`
- `hotshot_30`
- `container_chassis_20`
- `container_chassis_40`
- `container_chassis_45`
- `intermodal_container`
- `straight_truck`
- `parcel_route_vehicle`
- `courier_car`
- `other`

### 9.2 Equipment rule guidance

- `equipment_type` should capture the primary required vehicle/trailer combination
- Use boolean flags or a supplemental requirement child record for secondary needs such as tarps, liftgate, pallet jack, team, air-ride, food-grade, or TWIC
- Do not create ad hoc tenant strings for canonical matching unless also mapped to a normalized value

---

## 10. Load Mode Catalog

`load_mode` is different from equipment. It describes the operational movement pattern.

### 10.1 Recommended load modes

- `ftl` - full truckload
- `partial` - partial truckload
- `ltl` - less-than-truckload
- `parcel` - parcel / small package
- `final_mile` - last-mile delivery workflow
- `power_only` - tractor only, trailer supplied elsewhere
- `drayage` - short-haul port/terminal container movement
- `intermodal` - rail + truck or containerized multimodal movement
- `hotshot` - expedited small-deck movement
- `expedited` - urgent service without implying equipment type
- `dedicated_route` - recurring route execution
- `oversize` - heavy haul / permit-driven move

### 10.2 Mode/equipment examples

- Reefer produce load: `load_mode = ftl`, `equipment_type = reefer_53`
- Retail final-mile route: `load_mode = final_mile`, `equipment_type = box_truck_26`
- Port container pull: `load_mode = drayage`, `equipment_type = container_chassis_40`
- Machinery move needing permits: `load_mode = oversize`, `equipment_type = step_deck` or `lowboy`

---

## 11. Field Placement Rules

This section is the implementation guide for what belongs where.

### 11.1 Keep on `Load`
Keep on the main `Load` model if the field is:

- Needed for board cards, search, sorting, or pricing
- A shipment-wide attribute that should not vary by stop
- The current value of a mutable state (current status, current active assignment summary)
- Required for tenant-level analytics and filtering

Examples:

- `status`
- `load_mode`
- `equipment_type`
- `is_hazmat`
- `is_refrigerated`
- `posted_rate_amount`
- `carrier_rate_amount`
- `origin_city` / `destination_city`
- `first_pickup_window_start` / `final_delivery_window_end`
- `tracking_requirement_level`

### 11.2 Keep on `LoadStop`
Put on `LoadStop` if the field can differ by stop or can occur multiple times:

- Facility names and addresses
- Appointment windows
- Contact info
- Actual arrival/departure timestamps
- Pickup or delivery numbers
- Port / terminal / container details
- Stop instructions
- Stop-specific lumper, detention, temperature, or securement details

### 11.3 Keep on `LoadDocument`
Put on `LoadDocument` if the field describes a file or proof artifact:

- PODs
- BOLs
- Rate confirmations
- Hazmat paperwork
- Permits
- Photos
- Reefer temperature logs

### 11.4 Keep on history/assignment child models
Put in child models if the data is time-based or repeatable:

- Every prior status
- Every prior assignee
- Every rejected tender
- Every rate confirmation revision
- Every tracking ping/check call

---

## 12. Tenant Ownership and Access Rules

These rules are mandatory for multi-tenant correctness.

### 12.1 Ownership invariants

- Every `Load`, `LoadStop`, `LoadDocument`, `LoadAssignment`, and `LoadStatusHistory` record must carry `tenant_id`
- Child records must always inherit the same `tenant_id` as the parent load
- A child record must never be attachable to a load in another tenant
- `load_number` only needs to be unique within a tenant unless business requirements say global uniqueness

### 12.2 Write restrictions

- Only users/services acting within the owning tenant may create or mutate a load
- Child records may only be inserted if their `tenant_id` matches the parent load's `tenant_id`
- Cross-tenant document links, assignment links, and status events are forbidden
- If carriers or customers get portal access, they should see only a scoped projection, not unrestricted load rows

### 12.3 External sharing pattern

If a tenant shares a load with an external carrier or customer:

- Keep canonical ownership on the original tenant's `Load`
- Represent external visibility through share/tender/junction tables or scoped access tokens
- Do not clone the load into another tenant unless there is an explicit replication architecture

---

## 13. Tracking Requirements by Freight Type

### 13.1 Default guidance

- **Dry van / flatbed FTL**: at least `check_call` or `mobile_gps`
- **Reefer**: `mobile_gps` plus temperature compliance capture where available
- **Hazmat**: higher scrutiny, usually `mobile_gps` or `eld_gps`, plus proof/document requirements
- **Last-mile / parcel**: milestone-based proof of delivery, photo/signature, recipient confirmation
- **Drayage / intermodal**: milestone tracking around ingate/outgate, container release, terminal events
- **Oversize**: milestone + proactive exception reporting; escort and permit milestones may matter more than frequent pings

### 13.2 Tracking-related derived milestones

Future eventing should support:

- `tracking_started`
- `tracking_lost`
- `eta_updated`
- `geofence_arrival`
- `geofence_departure`
- `temp_out_of_range`
- `container_outgated`
- `container_ingated`
- `proof_of_delivery_received`

---

## 14. Compliance Requirements by Freight Type

### 14.1 Hazmat
Required or commonly needed fields:

- `is_hazmat = true`
- `hazmat_un_number`
- `hazmat_class`
- `hazmat_packing_group`
- `requires_hazmat_certification = true`
- hazmat paperwork in `LoadDocument`
- emergency contact details
- placard / segregation notes at stop level if needed

### 14.2 Refrigerated
Required or commonly needed fields:

- `is_refrigerated = true`
- `temperature_setpoint_f` or min/max range
- `temperature_control_mode`
- possible continuous-run requirement
- optional reefer temp log documents
- stop-level overrides when freight changes or split-temp behavior is added later

### 14.3 Flatbed / oversize
Required or commonly needed fields:

- securement fields such as straps, chains, tarps
- dimensions and weight sufficient for permit evaluation
- `permit_required`
- `requires_escort`
- loading-side or crane/forklift notes on stops

### 14.4 Drayage / intermodal
Required or commonly needed fields:

- container/chassis requirements
- port/terminal stop types
- TWIC requirements
- ingate/outgate timestamps
- container numbers and release numbers
- last free day / demurrage-sensitive dates

### 14.5 Last-mile / parcel
Required or commonly needed fields:

- residential/commercial distinction
- service level / delivery promise
- photo and signature proof requirements
- call-ahead, inside delivery, liftgate fields
- recipient contact and attempt outcomes at stop level

---

## 15. Edge Cases and How the Model Should Handle Them

### 15.1 Refrigerated edge cases

1. **Temperature range instead of exact setpoint**
   - Use `temperature_min_f` and `temperature_max_f`
   - Leave `temperature_setpoint_f` nullable if shipper gives only a range

2. **Protect-from-freeze loads**
   - `is_refrigerated = true`
   - `temperature_control_mode = protect_from_freeze`
   - Temperature may be a minimum threshold, not a cooling setpoint

3. **Multi-stop reefer with different handling at a later stop**
   - Shipment-wide target on `Load`
   - Stop-specific override on `LoadStop` only when needed

4. **Reefer requiring temp log at delivery**
   - Store requirement on `Load`
   - Actual artifact belongs in `LoadDocument` as `reefer_temp_log`

### 15.2 Flatbed edge cases

1. **Flatbed with tarps optional at posting time**
   - Keep `requires_tarps` nullable or false until confirmed
   - Do not force a guessed value

2. **Conestoga acceptable instead of standard flatbed**
   - Use normalized `equipment_type` for primary preference
   - Add acceptable alternates in a future equipment-requirement child table or tags

3. **Over-dimensional but not legally oversize in all states**
   - Track true dimensions on `Load`
   - `is_oversized` should reflect operational permit reality for the intended route, not only raw dimensions

### 15.3 Hazmat edge cases

1. **Hazmat flag known but class unknown at creation time**
   - Allow `is_hazmat = true` with hazmat detail fields temporarily nullable
   - Mark for review with `pending_review` or an exception workflow

2. **Mixed hazmat / non-hazmat stops**
   - Keep shipment-level hazmat flags true
   - Stop-level instructions can refine handling or segregation requirements

3. **Hazmat documents replaced after rejection**
   - Never overwrite history in place without traceability
   - Supersede prior `LoadDocument` record using `document_status = superseded`

### 15.4 Multi-stop edge cases

1. **Multiple pickups and multiple deliveries**
   - Every location is its own `LoadStop`
   - Use `sequence_number` as the source of route order
   - Derive origin/destination summary from first and last operational stops

2. **Same facility used twice**
   - Create separate stop rows for each event instance
   - Do not collapse by address

3. **Cross-dock or relay event**
   - Model as `stop_type = cross_dock` or `relay`
   - Keep execution timestamps on the stop record

4. **Load partially delivered while remaining freight continues**
   - Parent `Load.status` can remain `in_transit` until final delivery
   - Stop completion is recorded at stop level

### 15.5 Oversize edge cases

1. **Permit pending at posting time**
   - `permit_required = true`
   - `permit_status = pending`
   - Keep load postable only if operations policy allows it

2. **Escort needed only in certain states**
   - Keep high-level `requires_escort = true`
   - Put route/state details in notes or future permit child tables

3. **Dimensions change after shipper correction**
   - Update current load fields
   - Record history through status/note/audit trail as needed
   - If permits were already issued, trigger compliance review workflow

---

## 16. Derived / Denormalized Fields Recommended on `Load`

These fields should typically be derived from child data for performance and search:

- `origin_city`, `origin_state`, `origin_country_code`
- `destination_city`, `destination_state`, `destination_country_code`
- `first_pickup_window_start`, `first_pickup_window_end`
- `final_delivery_window_start`, `final_delivery_window_end`
- `active_assignment_id`
- `stop_count`
- `pickup_stop_count`
- `delivery_stop_count`
- `has_documents`
- `has_pod`
- `has_rate_confirmation`
- `latest_status_changed_at`

These should be maintained deterministically and never treated as the sole source of truth if the child rows disagree.

---

## 17. Validation Rules

### 17.1 Minimum creation requirements
A load should not move beyond `draft` unless it has at least:

- tenant ownership fields
- current status
- load mode
- equipment type
- commodity description
- at least one pickup stop
- at least one delivery stop

### 17.2 Conditional requirements

- If `is_hazmat = true`, require hazmat review fields before dispatch
- If `is_refrigerated = true`, require temperature control data before dispatch
- If `is_oversized = true`, require dimensions and permit evaluation before dispatch
- If `load_mode = drayage` or `intermodal`, require at least one `port` or `rail_ramp` style stop when operationally applicable
- If `load_mode = final_mile` or `parcel`, require proof-of-delivery expectations and recipient-facing stop data

### 17.3 Integrity rules

- A load must have at least 2 operational stops for normal pickup/delivery moves, unless parcel batching is represented differently by product design
- `sequence_number` must be unique within a load
- Exactly one current `status` on `Load`; unlimited historical statuses in `LoadStatusHistory`
- At most one active primary assignment per load
- Child `tenant_id` must equal parent `tenant_id`

---

## 18. Engineer Handoff: Recommended Implementation Order

1. Define canonical enumerations for status, load mode, equipment type, document type, tracking requirement, and permit status
2. Implement `Load` with tenant-safe ownership and the required summary/search fields
3. Implement `LoadStop` with ordered sequencing and appointment fields
4. Implement `LoadDocument` with typed document metadata and storage references
5. Implement `LoadAssignment` and `LoadStatusHistory` as append-friendly child models even if the first UI does not expose full history
6. Add derived summary fields on `Load` for origin/destination, windows, stop counts, and active assignment
7. Add validation rules for refrigerated, hazmat, oversize, drayage/intermodal, and final-mile workflows
8. Add audit/event hooks so future tracking, pricing, and exception systems can plug in without changing the core schema shape

---

## 19. Final Canonical Summary

If an engineer needs the shortest possible implementation summary:

- `Load` holds the current, shipment-wide, board-searchable truth
- `LoadStop` holds every stop-specific operational fact
- `LoadDocument` holds every document/proof artifact metadata record
- `LoadAssignment` preserves carrier/driver/truck assignment history and current coverage state
- `LoadStatusHistory` preserves every lifecycle transition
- Every record is tenant-owned, tenant-scoped, and child records must inherit the parent tenant
- Specialized freight requirements are modeled primarily as normalized flags and fields on `Load`, with location-specific operational details on `LoadStop`

This blueprint is the canonical starting point for Infamous Freight's load board domain model.
