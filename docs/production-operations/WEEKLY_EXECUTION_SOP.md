# Weekly Execution SOP

Use this SOP to keep Infamous Freight's recurring operations moving on a weekly cadence. Each day has one primary task, a clear output, a trigger, a reusable template, evidence requirements, and a done/not-done checkpoint.

## Weekly task map

| Day | Weekly task | Output |
| --- | --- | --- |
| Sunday | Backup | Files, CRM, finance, and ops data saved |
| Monday | Report | Weekly KPI / ops report sent |
| Tuesday | Leads | New prospects collected and qualified |
| Wednesday | Posts | Content and social updates published |
| Thursday | Invoices | Client and vendor invoices issued or checked |
| Friday | Digest | Weekly summary, wins, issues, and next actions sent |

## Operating rules

- Run the assigned task once per day before adding optional work.
- Use the daily template below so the result can be reviewed quickly.
- Mark each task as `Done`, `Blocked`, or `Skipped` before end of day.
- Attach evidence for every `Done` task and an owner plus next action for every `Blocked` task.
- Never paste secrets, private keys, customer payment data, or raw credentials into reports, prompts, tickets, or chat.
- Escalate blocked billing, compliance, backup, or production-health items the same day.
- Open a GitHub issue when a task repeats, blocks revenue, affects production health, or needs engineering follow-up.

## Single-page weekly tracker

Copy this tracker into the weekly operating channel or the `Weekly operations review` issue. Keep links sanitized and do not include secret values.

| Day | Task | Trigger | Evidence link | Status | Owner | Escalation needed? |
| --- | --- | --- | --- | --- | --- | --- |
| Sunday | Backup | Start of week |  | Not started |  | No |
| Monday | Report | First business day |  | Not started |  | No |
| Tuesday | Leads | Sales pipeline block |  | Not started |  | No |
| Wednesday | Posts | Content publishing block |  | Not started |  | No |
| Thursday | Invoices | Billing review block |  | Not started |  | No |
| Friday | Digest | End-of-week closeout |  | Not started |  | No |

## Issue routing

Use the existing GitHub templates when the weekly loop creates follow-up work:

- Use `.github/ISSUE_TEMPLATE/weekly_operations_review.md` for the full weekly closeout.
- Use `.github/ISSUE_TEMPLATE/operations_task.md` for one-off operations follow-up.
- Use `.github/ISSUE_TEMPLATE/automation_opportunity.md` when a repeated manual task should become a script, dashboard, workflow, or AI-assisted process.
- Use incident or production-blocker templates for production health, billing, security, compliance, or customer-impacting failures.

## Escalation rules

Escalate the same day when any of these are true:

- Backup evidence is missing for production-critical files, CRM data, finance records, or ops data.
- A report shows production health degradation, failed deploys, billing failures, auth anomalies, or unresolved incidents.
- Lead collection risks spam, scraping abuse, unauthorized data use, or brand damage.
- Published content includes unverified claims, customer-identifying details, or unapproved assets.
- Invoices are blocked by missing PODs, disputed charges, payment failures, or accounting-system issues.
- Friday digest contains an ownerless next action or a repeated blocker from a prior week.

## Sunday — Backup

**Trigger:** Start of week or after the final Friday digest is reviewed.

**Checklist:**

- Confirm production files and operational exports are backed up.
- Confirm CRM, lead, and customer records are exported or synchronized.
- Confirm finance exports are saved without exposing secret values or payment credentials.
- Confirm active ops data needed for dispatch, billing, and follow-up is recoverable.
- Record backup location, timestamp, scope, and any missing sources.

**Template:**

```text
Sunday Backup
Status: Done / Blocked / Skipped
Backup timestamp:
Systems covered: files / CRM / finance / ops
Evidence link:
Missing sources:
Restore-risk notes:
Owner:
Next action:
```

**Done checkpoint:** Backup evidence is recorded and any missing source has a named owner and next action.

## Monday — Report

**Trigger:** First business day of the week.

**Checklist:**

- Review prior-week KPIs for quotes, loads, dispatch activity, billing, driver usage, and AI usage where available.
- Review production health, deploy status, failed workflows, and incident notes.
- Summarize top risks, top wins, and operational bottlenecks.
- Send the weekly KPI / ops report to the owner or operating channel.

**Template:**

```text
Monday Weekly Report
Status: Done / Blocked / Skipped
Reporting period:
Evidence link:
KPI highlights:
Ops wins:
Risks / blockers:
Production-health notes:
Recommended actions:
Owner:
```

**Done checkpoint:** Weekly KPI / ops report is sent, archived, and linked to any follow-up tasks.

## Tuesday — Leads

**Trigger:** Weekly sales pipeline build block.

**Checklist:**

- Collect new shipper, carrier, broker, or partner prospects from approved sources.
- Qualify prospects against lane fit, commodity fit, contactability, and operational value.
- Add qualified leads to the CRM or approved tracking sheet.
- Tag lead source, priority, next follow-up date, and owner.
- Avoid scraping abuse, spam, or unauthorized data collection.

**Template:**

```text
Tuesday Leads
Status: Done / Blocked / Skipped
New leads collected:
Qualified leads:
Evidence link:
Disqualified leads and reason:
Highest-priority prospects:
CRM / tracker updated: Yes / No
Follow-up owner:
```

**Done checkpoint:** Qualified prospects are recorded with owner, source, priority, and next follow-up.

## Wednesday — Posts

**Trigger:** Weekly content publishing block.

**Checklist:**

- Choose the weekly content theme, such as dispatch reliability, shipment visibility, compliance, billing, or shipper education.
- Draft posts for approved channels.
- Verify claims, customer references, images, and brand tone before publishing.
- Publish or schedule updates.
- Record published links and any engagement follow-up.

**Template:**

```text
Wednesday Posts
Status: Done / Blocked / Skipped
Theme:
Channels:
Published / scheduled links:
Evidence link:
Assets used:
Claims reviewed: Yes / No
Engagement follow-up:
```

**Done checkpoint:** Content is published or scheduled, and links are recorded for the Friday digest.

## Thursday — Invoices

**Trigger:** Weekly billing review block.

**Checklist:**

- Review client invoices due to be issued.
- Review vendor or carrier invoices requiring approval or dispute.
- Confirm POD, rate confirmation, accessorials, and payment terms before invoicing.
- Check for Stripe, accounting, or webhook failures without exposing secret values.
- Record unpaid, disputed, or blocked invoices with next action.

**Template:**

```text
Thursday Invoices
Status: Done / Blocked / Skipped
Client invoices issued:
Vendor invoices checked:
Evidence link:
Blocked / disputed invoices:
Payment-system notes:
Missing documents:
Owner:
Next action:
```

**Done checkpoint:** Invoices are issued or checked, and every exception has an owner and next action.

## Friday — Digest

**Trigger:** End-of-week closeout.

**Checklist:**

- Summarize completed work from Sunday through Thursday.
- List wins, issues, unresolved blockers, and next actions.
- Include published links, KPI highlights, invoice exceptions, and lead follow-ups.
- Identify one improvement to automate, document, or turn into a repo task.
- Send the weekly digest to the owner or operating channel.

**Template:**

```text
Friday Digest
Status: Done / Blocked / Skipped
Wins:
Issues:
Evidence link:
Leads / sales follow-up:
Posts / content links:
Invoice exceptions:
Backup / restore notes:
Next actions:
Automation opportunity:
Owner:
```

**Done checkpoint:** Weekly summary is sent, next actions are assigned, and one repeatable improvement is captured.

## Weekly closeout review

At the end of Friday, answer these questions:

1. Which daily task was missed or blocked?
2. What customer, revenue, compliance, or production risk needs owner attention?
3. What should become a checklist, script, dashboard, issue, or automation next week?
4. What evidence should be linked in the next Monday report?

## Automation checklist

Use this checklist before turning the weekly loop into automation:

- [ ] Calendar reminders exist for Sunday through Friday tasks.
- [ ] Each reminder links to this SOP and the weekly tracker.
- [ ] Evidence is stored in an approved location with no secrets or raw credentials.
- [ ] The Monday report uses approved KPI sources and identifies missing data instead of guessing.
- [ ] The Tuesday lead workflow respects source terms, consent rules, and anti-spam requirements.
- [ ] The Wednesday content workflow requires claim, customer-reference, and asset approval before publishing.
- [ ] The Thursday invoice workflow checks PODs, rate confirmations, accessorials, and payment-system exceptions.
- [ ] The Friday digest links wins, issues, blockers, and next actions to owners.
- [ ] Repeated blockers are opened with the automation opportunity template.
- [ ] Any production, billing, auth, compliance, or backup failure has a rollback or manual fallback.

## Automation backlog candidates

- Calendar reminders for each weekday task.
- A lightweight weekly report generator using approved KPI sources.
- A digest template that pulls links from posts, leads, invoices, backups, and production-health notes.
- Backup verification evidence attached to the weekly closeout.
- A dashboard that shows missed tasks, blockers, owners, and overdue next actions.
