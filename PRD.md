# PartnerHub Product Requirements Document

## Product summary

PartnerHub is a web-based event operations workspace for campus organizations, youth communities, and small event organizers that run recurring events. It connects event setup, reusable participant registration, committee recruitment, QR attendance, and sponsorship management in one system.

The first version must prove one complete event flow at the Venture Creation booth. PartnerHub is not a national ticket marketplace, payment processor, generic CRM, or full HR system.

## Problem and hypotheses

Small and medium event teams often split work across forms, spreadsheets, chat groups, ticket tools, and personal sponsorship files. This can lead to repeated data entry, unclear application status, weak committee handovers, slow check-in, missed sponsor follow-ups, and scattered evidence of delivered sponsor benefits.

These remain hypotheses until direct research is completed:

- Organizers find a connected workspace more useful than separate tools.
- Participants value reusing consented profile data across events.
- Committee applicants and organizers value structured division choices and application status.
- QR entry improves check-in speed and clarity.
- Sponsorship tracking and benefit evidence improve organizer accountability.
- Organizations that run recurring events are willing to pay for the combined workflow.

## Target users

| User | Primary job | First-version value |
| --- | --- | --- |
| Event organizer | Prepare and monitor an event | One workspace for setup, registration, committee applications, attendance, and sponsorship progress |
| Committee applicant | Apply for an event role and understand the result | Division preferences, event-specific questions, and visible application status |
| Committee member | Support event operations after acceptance | Event membership recorded without creating a permanent global role |
| Participant | Register without re-entering the same basic information | Reusable consented profile plus event-specific questions and QR ticket |
| Gate staff | Record attendance reliably | Immediate result for valid, duplicate, invalid, or wrong-event QR scans |
| Sponsor or partner | Understand an event and its promised benefits | Structured package, agreement status, commitments, and post-event evidence |

## Product positioning

PartnerHub helps a team prepare, run, and learn from an event. Ticketing is one operational module, not the entire product. Sponsorship management is the main differentiator because it connects event records with sponsor follow-up, commitments, and proof.

The first market is BEM, Himpunan, UKM, campus committees, youth communities, and small organizers that run recurring events. Professional organizers, concerts, festivals, seminars, workshops, sports communities, charity events, and national communities are later segments to validate.

## Product principles

- Protect one complete event lifecycle before adding broad feature coverage.
- Collect only profile data the account holder agrees to reuse.
- Each account has one account role chosen at registration: user, organizer, or sponsor company (owner decision, 2026-10-05). This supersedes the earlier "no permanent account classification" rule. Event-level roles (committee membership, gate staff) remain event-scoped and are not account roles.
- Never encode personal data, database identifiers, or credentials in a QR payload.
- Make attendance configurable. The first prototype supports no scan or entry scan; exit scan remains deferred.
- Keep sponsorship as an accountable workflow, not a speculative marketplace.
- Label unfinished behavior **In progress** and never present planned work as implemented.

## First-version scope

### Included

1. Organizer creates and publishes an event page with title, schedule, venue or delivery mode, description, capacity, and registration window.
2. Participant creates or signs in to an account and controls reusable profile details.
3. Organizer creates event-specific participant registration questions.
4. Participant registers, confirms consent, completes event-specific questions, and receives an opaque QR ticket.
5. Organizer creates committee divisions and event-specific application questions.
6. Applicant chooses preferred divisions, submits an application, and can see its status.
7. Organizer can shortlist, invite to interview, accept, or reject a committee application.
8. Accepted applicant becomes a committee member for that event only.
9. Organizer can disable attendance or use entry-only QR scanning with duplicate-scan protection.
10. Organizer tracks sponsorship campaigns, organization prospects, proposals, follow-up status, promised benefits, and evidence URLs.
11. Dashboard shows persisted counts for registration, committee applications, entry attendance, and sponsorship progress.

### Deferred until after validation

- Ticket tiers, discount codes, waitlists, automated reminders, and payment gateway.
- Exit scans, certificates, attendance export, and hardware integrations.
- Committee task boards, schedules, and shifts.
- Sponsor analytics, curated matching, and automatic matching notifications.
- Document uploads. Proposal, portfolio, and evidence remain URLs. User-uploaded event, organizer, and sponsor-display logos are now an approved frontend requirement; production image storage is **In progress**.
- Real-time chat, broad notification system, and managed sponsorship sales.
- Public marketplace, ticket resale, complex refunds, and full accounting.

## Primary workflows

### Organizer prepares an event

1. Organizer signs in through the protected organizer flow.
2. Organizer creates an event and enters its public details, capacity, registration period, and attendance mode.
3. Organizer configures participant questions, committee divisions, and committee questions as needed.
4. System keeps the event in `DRAFT` until publish criteria pass.
5. Organizer publishes the event. The public event page and enabled application flows become available.

### Participant registration and ticket

1. Participant opens the public event page and signs in or creates an account.
2. System rejects registration before opening, after closing, or once capacity is reached.
3. Participant reviews reusable profile data, accepts the event consent, and answers event-specific questions.
4. System creates one event registration and one opaque ticket secret.
5. Participant receives a ticket reference and QR payload. The payload contains no profile data.

### Committee recruitment

1. Applicant opens the event's committee recruitment page and signs in.
2. Applicant chooses one or more preferred divisions and answers event-specific questions.
3. Organizer reviews the application and moves it through allowed states.
4. Applicant sees the current result.
5. Acceptance creates an event-scoped committee membership.

### Entry attendance

1. Gate staff opens the protected scanning screen for an event with entry attendance enabled.
2. System verifies the ticket secret, event, registration status, and attendance mode.
3. First valid entry creates one check-in record.
4. A repeated valid scan returns `already checked in` without creating another record.
5. Invalid, cancelled, or wrong-event tickets return a safe error without profile detail.

### Sponsorship tracking

1. Organizer creates a campaign inside the event workspace.
2. Organizer records sponsor organizations, package or proposal URLs, stage, and next follow-up date.
3. When an organization agrees, the organizer records promised benefits.
4. Organizer adds evidence URLs after delivery and verifies each benefit.
5. Campaign closes only after incomplete benefits have been reviewed.

## Functional requirements

### Approved connected frontend flow, 2026-10-05

**In progress**. The owner approved frontend account/workspace/event integration and shared route/layout/style changes. Backend, API handlers, Prisma, dependencies and environment files are excluded from this task. This section supersedes the earlier browser-only navigation and unresolved frontend authentication direction.

- Authentication UI uses email/password and email verification. New passwords contain 12–128 characters. Email is required; display name is optional. No phone, student identity or permanent account classification is requested.
- Flow: landing, register, verification, onboarding, dashboard; login returns to an allowlisted internal destination. Recovery uses an emailed single-use token and reset returns to login. Logout requires confirmed server revocation before claiming success.
- Session state comes from an HttpOnly-cookie API, never browser token/password storage. Frontend guards are navigation controls, not security. Backend must enforce account and event membership on every request.
- Dashboard lists only API-returned events. Create/detail/edit use real routes. Saving a titled draft may omit schedule/location/capacity; provided values must be valid. Publication and operational modules remain **In progress**.
- Forms retain input on failure; expose validation, loading and success feedback; warn about unsaved editor changes. Local draft restoration is explicit and browser-wide legacy storage is not account isolation.
- Backend authentication provider, email delivery, session lifetime, rate limits, deletion/retention periods and reusable-profile consent wording remain release blockers. No real account data should be collected before these decisions and services are implemented.

Acceptance evidence must distinguish test-only mocked API responses from real backend availability. No production mock fallback is allowed.

### Committee recruitment and organizer-initiated sponsor requests, 2026-10-06

**In progress** (frontend only). The owner approved these flows for the committee and sponsorship frontends, the shared contracts, navigation, and the demo backend. Backend, Prisma schema, and migrations are excluded and remain release blockers.

- Organizer opens a committee recruitment for a published event: description, 1 to 12 unique divisions, and one optional event-specific question. The organizer can close or reopen it.
- A user (account role `user`) sees open recruitments at `/committee`, chooses one or more divisions, writes a motivation (at least 20 characters), and answers the optional question. One active application per recruitment.
- Organizer reviews applicants at `/events/:id/committee` and moves each application only through allowed states: `SUBMITTED` to `SHORTLISTED` or `REJECTED`; `SHORTLISTED` to `INTERVIEW`, `ACCEPTED`, or `REJECTED`; `INTERVIEW` to `ACCEPTED` or `REJECTED`. Accepting requires a note with the next steps (for example joining the committee WhatsApp group, a meeting time, or a link). The frontend only offers the moves the service lists as allowed.
- The applicant sees the current status and the organizer note under "Lamaran saya" and receives an in-app notification for each decision. Accepted applicants see the note as "Langkah berikutnya". Email delivery is not part of this flow.
- Organizers can also start sponsorship: at `/events/:id/sponsors` an organizer sends a request to a verified sponsor company for a published event (category, message, optional value, optional https proposal URL). The sponsor sees it under "Permintaan dari penyelenggara", receives a notification, and accepts or declines once. The organizer is notified of the answer. The sponsor directory exposes only company name and industry.
- Sponsor-initiated proposals (`/sponsor/proposals/new`) remain. The two directions are separate records; accepting a request does not yet create a `SponsorBenefit`. That link needs a backend decision.
- Not included: file uploads (proposal and evidence stay URLs), chat, automatic matching, payments, and committee membership records beyond the accepted status. Account role rules are unchanged: event-level committee membership is not an account role.
- Open backend decisions: how an accepted request becomes a sponsorship record, retention of applicant answers, and whether `WITHDRAWN` is offered to applicants.

### Workspace and event frontend

#### Production frontend direction, 2026-10-05

The owner clarified that PartnerHub is intended for real use across multiple organizations, not a single organization's branded demo. Current authorization is frontend event/workspace only; backend implementation is recorded in `todobackend.md`. The existing synthetic examples must not populate the default workspace or impersonate the organizer's records. Connection, publication, authorization, and server storage remain **In progress**, not silently successful local actions.

User-uploaded visual identity is part of event preparation: optional event logo, organizer name/logo, and up to six named sponsor-display entries with optional logos. A name is required when an organizer logo is used and for each sponsor entry. Sponsorship commitments/prospects remain a separate feature, not implied by a logo placement.

Frontend acceptance: native file selection plus drag/drop; PNG/JPEG/WebP up to 2 MB and 4096 pixels per axis; reject empty, unsupported, corrupt, oversized, and multiple files without replacing the current valid image. Preview uses contain sizing, user-provided names, replacement/removal, and poster/page modes. SVG and GIF are excluded. These are browser guardrails, not a substitute for backend inspection and image normalization.

One browser-only draft with its logo blobs can be explicitly saved/restored/deleted using IndexedDB. Existing v1 text-only localStorage drafts remain readable. No logo request leaves the browser and no server upload is claimed. Browser storage is not organization membership, shared-device isolation, durable backup, or production persistence. Users may delete local content after use; backend ownership, lifecycle, and retention must be resolved before release.

The historical criteria below describe the earlier implementation and are superseded where this section differs: the editor now has four stages including visual identity; default workspace is empty; browser draft saving includes logos. Product-wide auth/privacy decisions remain unchanged.

#### Earlier workspace implementation (superseded where noted)

**In progress**. After rejecting the initial admin-style dashboard, the user approved a bolder campus-program workspace, larger typography, and a usable frontend event-draft flow. Navy is retained with self-hosted display/body typography and a warm-yellow primary action. Workspace records remain explicitly labelled synthetic data. The prototype does not satisfy FR-01 authorization/publishing or FR-11 persisted counts.

UI acceptance criteria:

- A persistent notice identifies sample events, sponsor labels, and figures as demo data with no database connection.
- Organizer can search/filter/select synthetic events and inspect the selected event's contextual information or sponsorship preview.
- A preview selector exposes demo, empty, loading, and simulated error states without pretending to contact a server.
- Organizer can enter title/category/optional description, choose same-day WIB schedule, location, capacity, and registration/committee/entry/sponsorship modules in a three-stage draft flow.
- Event preview updates while typing. Field errors preserve input and explain missing title, invalid date, reversed time, or invalid capacity. Entry-scan configuration requires registration.
- Save explicitly stores one versioned draft in this browser only. Re-saving replaces the prior local draft. Restore validates stored shape/version; deletion requires confirmation and preserves current form input. Storage failures do not discard the form. The draft survives workspace-view switches, but reload requires explicit restoration.
- Only non-personal event planning fields may be stored. A shared-device user should delete the local draft after use. Retention is browser storage until overwritten, explicitly deleted, or cleared by the browser; this is not an account retention policy.
- Desktop, tablet, and mobile layouts preserve keyboard access, visible focus, readable contrast, and native dialog Escape behavior.
- Body and form text is 16px or larger at default text size; supporting labels are 14px or larger and primary controls at least 48px high. The rejected tiny-label/sidebar/statistics/table composition is not retained.
- No personal profile fields, real sponsor identities, ticket secrets, backend mutations, publication, or deferred product services are collected or implemented.

| ID | Requirement | Acceptance signal |
| --- | --- | --- |
| FR-01 | Create and publish a valid event through an authorized organizer flow | Unauthorized requests fail and invalid schedules cannot publish |
| FR-02 | Store reusable profile data only with account-holder consent | Profile fields can be reviewed and consent is recorded |
| FR-03 | Allow one account to hold different event-scoped roles | No global participant, committee, or organizer classification is required |
| FR-04 | Accept participant registration only while the event is published, the window is open, and capacity remains | Extra, duplicate, or late registration is rejected server-side |
| FR-05 | Generate a unique opaque ticket reference and secret | QR contains no personal or database data |
| FR-06 | Record entry once per registration when attendance is enabled | Repeat scan is idempotent and disabled attendance rejects scans |
| FR-07 | Capture committee division preferences and event-specific answers | Application preserves choices and validated answers |
| FR-08 | Enforce committee application transitions | Arbitrary status replacement is rejected |
| FR-09 | Create event membership only from an accepted application | Rejected or pending applications cannot become memberships |
| FR-10 | Track sponsor prospects, follow-ups, commitments, and evidence URLs | Stage and evidence validation is enforced |
| FR-11 | Display operational counts from persisted data | Counts exclude cancelled registrations and duplicate scans |

## State model

| Entity | Planned states |
| --- | --- |
| Event | `DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED` |
| Registration | `REGISTERED`, `CANCELLED` |
| Committee application | `SUBMITTED`, `SHORTLISTED`, `INTERVIEW`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| Sponsor prospect | `PLANNED`, `CONTACTED`, `NEGOTIATING`, `AGREED`, `DECLINED` |
| Sponsor benefit | `PLANNED`, `VERIFIED` |

## Data and privacy boundaries

The broader Venture Creation concept now requires accounts and reusable profiles. This replaces the earlier anonymous-only product direction. The implementation must still minimize personal data.

- Required identity and authentication fields need a final privacy and authentication decision before implementation.
- Name, email, phone number, student identity, portfolio, dietary needs, and other event data must be collected only when necessary and with clear consent.
- Reusable profile fields must be separate from event-specific answers.
- Organizers must not receive unrelated profile data.
- QR payloads must remain opaque and must never contain profile fields.
- Logs must not contain passwords, authentication tokens, ticket secrets, or full QR payloads.
- Retention, profile deletion, and account recovery rules are **In progress**.

## Venture Creation validation

The current opportunity assessment is 15 out of 20. This is a reasoned working score, not proof of demand or traction. No owned interview dataset, pilot result, paid usage, or revenue result currently validates the expanded concept.

Research targets, not achieved results:

- Interview 5 to 10 organizers or committee leaders about their latest event workflow.
- Ask 5 participants to test profile reuse, event registration, and QR handoff.
- Test the committee application flow with applicants and at least one organizer.
- Run a small QR entry test covering valid, duplicate, invalid, and wrong-event scans.
- Review sponsorship tracking and reporting with an organizer or sponsor contact.
- Record completion time, errors, confusion, willingness to switch, and willingness to pay.

## Business model hypotheses

The revenue model remains provisional:

- Organizer subscription for organizations that run recurring events.
- Per-event plan for one-off organizers.
- Premium sponsor reporting when sponsors value structured results and evidence.
- Sponsorship success fee only when PartnerHub's contribution is measurable and terms are agreed in advance.
- Ticket transaction fee only after payments, refunds, compliance, and support are ready.

The project must not claim achieved revenue. A previous aspiration of approximately Rp100 million annual revenue remains a hypothesis.

## Challenge review

| Risk or missing edge case | Product decision |
| --- | --- |
| Scope grows into a full event suite | Protect the first booth flow and defer tasks, payments, chat, matching, and marketplace work |
| Account data increases privacy risk | Minimize fields, record consent, separate reusable profile data from event answers, and define deletion before production |
| Two people take the final capacity slot | Enforce capacity in one database transaction |
| One account registers twice | Enforce one active registration per account and event |
| Committee application skips review states | Allow explicit transitions in feature logic only |
| QR screenshot is reused | Use opaque ticket secret and one entry record per registration |
| Wrong-event or forged QR is scanned | Verify event and secret hash and return a generic failure |
| Sponsor evidence link disappears or is private | Keep benefit unverified until the organizer reviews the URL |
| Sponsor matching creates a two-sided marketplace problem | Defer matching and notifications until both sides are validated |
| Existing tools are good enough | Compare real current workflows against the prototype and measure switching intent |

## Open decisions

- Backend authentication provider, credential/session/token policies and organizer membership authorization. Frontend email/password, verification and emailed recovery are approved above.
- Minimum reusable profile fields and exact consent wording.
- Data retention, export, and deletion periods.
- Supported custom question types and which answers may be reusable.
- Whether the first demo uses self-service accounts or prepared demo accounts.
- Hosting provider and data region.
