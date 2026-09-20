# PartnerHub Product Requirements Document

## Product summary

PartnerHub is an event operations workspace for campus organizations, youth communities, and small event teams. It brings event setup, anonymous registration, QR entry attendance, and sponsorship benefit tracking into one focused workflow.

First release proves one event lifecycle well. It does not attempt to become a marketplace, payment platform, or all-purpose event suite.

## Problem and hypotheses

Event teams often split work across forms, spreadsheets, chat, ticket tools, and personal contact lists. Sponsor proposals, follow-ups, promised benefits, and proof then become difficult to recover for next event.

These are hypotheses to validate, not established facts:

- Teams lose time reconciling event and sponsorship information across tools.
- One event workspace improves visibility of registrations, entry attendance, and sponsor commitments.
- Sponsors value clear benefit evidence after event.

## Product principles

- One event lifecycle before broad feature coverage.
- No personal-name prompt, personal profile, account classification, or password flow in MVP.
- Public registration collects only explicit consent and event-specific non-identifying answers.
- QR codes identify tickets, never people.
- Sponsorship tracking is differentiator, not full sponsor marketplace.
- Unfinished feature is labelled **In progress**, never implied complete.

## Supported contexts

| Context | Job to complete | MVP value |
| --- | --- | --- |
| Event workspace | Prepare event and see operational progress | One source for event, registration, entry, and sponsorship data |
| Public attendee | Receive ticket without personal account | Short registration and opaque QR ticket |
| Event gate | Validate ticket at entry | Fast, repeat-safe check-in result |
| Sponsorship workflow | Track organization prospects, commitments, and proof | Clear follow-up and benefit evidence |

## MVP scope

### Included

1. Prepared event workspace through seeded or protected setup flow.
2. Event draft, publication, closure, and archive states.
3. Public event page with capacity and registration-window checks.
4. Anonymous registration, consent capture, and opaque QR ticket creation.
5. Entry scan with duplicate-scan protection.
6. Sponsorship campaign, organization prospect, benefit commitment, and evidence URL tracking.
7. Small operational summary for registrations, entry scans, and benefit progress.

### Deferred

- Payment, refunds, ticket tiers, promo codes, and settlement.
- Personal accounts, passwords, profiles, contact-person records, and recovery.
- Committee recruitment, task assignment, shifts, chat, notifications, email delivery, and file uploads.
- Public self-service event creation, sponsor matching, analytics, marketplace, and hardware integration.
- Exit scans and certificates. Model allows later extension; MVP ships entry only.

## Primary workflows

### Event preparation

1. Team creates or receives prepared event workspace.
2. Team enters title, schedule, venue or delivery mode, capacity, and registration window.
3. System keeps event in `DRAFT` until publish criteria pass.
4. System returns management secret once. Team stores it; it is never displayed again.
5. Team publishes event. Public page becomes available.

### Anonymous registration and ticket

1. Visitor opens public event page.
2. System rejects registration before opening, after closing, or once capacity is reached.
3. Visitor accepts event consent and answers configured non-identifying questions.
4. System creates registration plus ticket reference and opaque QR secret.
5. Visitor receives ticket reference and QR payload. No personal name is requested or encoded.

### Entry attendance

1. Gate screen scans ticket payload.
2. System verifies ticket secret and event state.
3. First valid entry creates check-in record.
4. Repeated valid scan returns `already checked in` without another record.
5. Invalid, cancelled, or wrong-event ticket returns safe error without private detail.

### Sponsorship tracking

1. Team opens campaign inside event workspace.
2. Team lists sponsor organizations, web links, stage, and next follow-up date.
3. When organization agrees, team records benefit commitments.
4. Team attaches public evidence URLs and verifies each benefit.
5. Campaign closes only after team reviews incomplete benefits.

## Functional requirements

| ID | Requirement | Acceptance signal |
| --- | --- | --- |
| FR-01 | Create and edit event using workspace secret | Invalid secret cannot access management endpoint |
| FR-02 | Publish only valid event with future end time and valid registration window | Invalid state returns validation error |
| FR-03 | Allow anonymous registration only while event published, window open, capacity remains | Extra or late registration rejected server-side |
| FR-04 | Generate opaque, unique ticket reference and secret | QR contains no personal or database data |
| FR-05 | Record entry once per ticket | Repeat scan is idempotent |
| FR-06 | Track campaign prospects and benefit evidence URLs | Stage and evidence validation enforced |
| FR-07 | Display operational counts from persisted data | Counts exclude cancelled registrations and duplicate scans |

## Data and privacy boundaries

MVP stores event, ticket, attendance, sponsor-organization, and evidence data. It must not request or persist personal name, password, personal profile, personal phone number, or account classification.

Show event consent text before anonymous registration. Custom questions are limited to approved selection inputs in MVP. Free-text questions require later privacy decision.

## Validation measures

Targets for research, not achieved results:

- Five organizer interviews identify current workflow and pain points.
- Five test participants complete anonymous registration and QR handoff.
- Small entry-scan test covers valid, duplicate, and invalid scans.
- One sponsorship workflow review assesses benefit-proof usefulness.

## Challenge review: edge cases and scope cuts

| Risk or missing edge case | Product decision |
| --- | --- |
| Capacity race from two simultaneous registrations | Enforce capacity in database transaction, not UI only |
| Link shared after registration closes | Server checks window on every registration request |
| QR screenshot reused | Ticket secret opaque; check-in single-use per entry |
| Wrong-event or forged QR | Verify event and secret hash; return generic invalid-ticket response |
| Sponsor proof link disappears or private | Keep URL unverified until team marks benefit verified |
| Team loses management secret | Manual recovery in MVP; no recovery flow yet |
| Over-engineering risk | No payments, files, notifications, accounts, or generic form builder |

## Open decisions

- Exact consent wording and retention period.
- Event setup protection method for non-demo deployment.
- Whether entry-only attendance is enough after prototype validation.
- Hosting provider and data region.
