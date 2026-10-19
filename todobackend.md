# Backend implementation backlog

**In progress**. Current frontend/demo contracts are implemented locally, but this is a production-backend handoff. Individual events replace organization workspaces; annual subscriptions belong to organizer accounts. PRD.md and ARCHITECTURE.md define the consolidated baseline as of 18 October 2026. Typed frontend contracts and clients exist; backend services, API handlers, migrations, authentication and storage remain unimplemented. Only `/api/health` currently exists. No production credentials or data are needed to exercise frontend error states.

## Frontend integration contract, 2026-10-05

Canonical types: `src/contracts/account.ts`, `src/contracts/event.ts`. Feature services include `TODO(backend)` method, endpoint, request and response annotations. Responses are JSON unless 204. Failures use `{error:{code:string,fields?:Record<string,string>}}`; field keys match forms. Clients time out after 15 seconds and never substitute mocks.

| Endpoint | Request | Expected success |
| --- | --- | --- |
| `GET /api/auth/session` | HttpOnly cookie | `Session`, or 401 guest |
| `POST /api/auth/login` | `{email,password}` | `Session`, secure cookie |
| `POST /api/auth/register/:role` | Role-specific multipart payload/files, defined in the role-registration table below | `{session:Session|null,verificationRequired:boolean}`, role and approval enforced |
| `POST /api/auth/logout` | `{}` | 204 after revocation, idempotent |
| `POST /api/auth/password/forgot` | `{email}` | `{message}`, neutral for unknown/existing email |
| `POST /api/auth/password/reset` | `{token,password}` | `{message}`, revoke old sessions |
| `POST /api/auth/verification/resend` | `{email}` | `{message}`, neutral and throttled |
| `POST /api/auth/verification/confirm` | `{token}` | Verified `Session`, cookie |
| `POST /api/accounts/onboarding` | `{completed:true}` | `Session` with onboarding complete |
| `PATCH /api/profile` | `{displayName:string|null}` | Updated `Session` for current account |
| `GET /api/events` | Cookie | `{items:EventRecord[]}`, authorized records only |
| `POST /api/events` | `EventInput`, `Idempotency-Key` | `EventRecord` in DRAFT |
| `GET /api/events/:id` | Cookie | Authorized `EventRecord` |
| `PATCH /api/events/:id` | `{...EventInput,revision}` | Updated `EventRecord`, 409 on conflict |
| `POST /api/events/:id/assets` | Multipart `slot,file`, `Idempotency-Key` | `{id,url,name}` after image acceptance |

`Session` contains account ID/email/nullable display name, emailVerified, onboardingComplete and ISO expiresAt. Never return credentials or cookie secrets. Credentials are transient form state only. Accounts have user/organizer/sponsor roles and approval status; participant, committee and manager relations remain event-scoped. Email/password verification is approved for frontend; provider, email delivery and hashing remain separate work.

`EventInput` contains title/category/summary, nullable ISO UTC startsAt/endsAt, Asia/Jakarta timezone, venue, nullable capacity/registration period, module flags and branding asset references. Title requires 3–100 characters. The DTO can represent incomplete historical DRAFT records, but the current new-event frontend requires complete setup before submission. Do not reintroduce partial-draft quick-save. Paired schedules/windows must be chronological; registration closes by event start. Existing Prisma requires non-null times, so an approved schema change is required before implementing these endpoints. Never supply fake dates.

Asset uploads must not change event revision; attaching references in PATCH does. Otherwise the frontend sequence needs a revised concurrency contract. Idempotent create/upload retries must replay canonical results. Frontend retains successful event/asset IDs after partial failures; failed PATCH never claims the complete form is saved. Server owns orphan cleanup and asset authorization. Legacy browser draft copies are ignored; no restore, transfer or persisted signup draft feature remains.

Release blockers: backend origin/CSRF checks, membership, hashing, session/token expiry policy, abuse limits, privacy/consent wording, deletion/export, retention, image quotas/normalization/storage and operational APIs. Frontend guards and mocked browser tests prove none of these.

## Release blockers

- [ ] Decide authentication, recovery, required profile fields, account deletion, and retention in PRD/architecture before collecting personal data.
- [ ] Enforce organizer access through event-scoped membership, never a body-supplied organizer/account ID. Enforce account eligibility plus event ownership/assigned-manager relations; do not hard-code organizer identity or restore organization/workspace selection.
- [ ] Implement event ownership/manager assignment and account subscription persistence. Organization/workspace creation and membership are removed product requirements. Define who may reuse event branding without inventing an organization workspace model.
- [x] Record the narrowly approved logo-upload frontend exception in PRD/architecture. Proposal, portfolio and evidence uploads remain deferred; their URL flows do not change. Server storage remains unimplemented.
- [ ] Choose image/object storage, hosting region, cost/quotas, deletion/retention, and delivery policy through an explicitly approved infrastructure task. Supabase currently provides PostgreSQL through Prisma only; Storage/Auth must not be assumed configured.
- [ ] Coordinate schema, migrations, shared DTOs, and dependencies separately. Do not make independent cross-feature edits.

## Event API and frontend mapping

| Proposed operation | Input/output expectations | Required behavior |
| --- | --- | --- |
| List organizer events | Authorized owner/assigned-manager event context; event summaries and persisted counts | Return only accessible events; pagination; truthful empty/error/loading states |
| Create completed unpublished event (`POST /api/events`) | Title, description/category, schedule/timezone, venue/delivery mode, capacity, registration window, modules | Validate all fields server-side; return canonical ID, DRAFT state, revision and timestamps |
| Read/update unpublished event (`GET/PATCH /api/events/:id`) | Authorized event ID, revision, editable fields | Reject foreign-event access, stale revisions, invalid schedule and unauthorized module changes |
| Attach branding | Organizer display name, event/organizer asset references, ordered sponsor-display entries | Verify ownership of every asset and relationship; sponsor logo placement is not a sponsorship agreement |
| Upload image | Authorized event and slot: event, organizer, or sponsor-display entry | Return asset ID/status only after validated storage succeeds; no arbitrary remote URL fetch |
| Delete/replace image | Authorized asset reference/revision | Atomically replace references; garbage-collect unreferenced originals/thumbnails under retention policy |
| Publish explicit transition | Event ID, current revision | Require complete details, ready images, module prerequisites and current single-event or account-subscription coverage; published details stay locked |
| Close/archive | Explicit lifecycle action | Enforce approved DRAFT → PUBLISHED → CLOSED → ARCHIVED transitions and publish/edit rules |

Current frontend same-day schedule is WIB; capacity range is 1–100,000. Overnight/multi-day support needs separate agreement. Category values and optional paired registration periods are specified by the frontend contract above. Do not treat the legacy local UI format as an API DTO. Entry scan requires registration; selecting a module does not activate its service.

## Image upload safety

- [ ] Require authentication and event ownership/manager authorization before accepting bytes or issuing scoped upload credentials. Apply request limits, per-event/account quotas and rate limits.
- [ ] Initial frontend permits PNG, JPEG, WebP, maximum 2 MB each and 4096 × 4096 pixels, up to six sponsor-display entries. Repeat limits server-side; inspect magic bytes and decode, not filename or client MIME alone. Reject unsupported/empty/corrupt/multiple payloads safely.
- [ ] Bound decoder memory/pixel count, normalize/re-encode accepted raster images, strip EXIF/location metadata, preserve appropriate transparency, create bounded thumbnails. SVG and GIF are not accepted in this version.
- [ ] Use generated object names; original filename is untrusted metadata. Never expose credentials in object URLs, client bundles, responses, logs, or QR.
- [ ] Keep pending uploads quarantined/private. Public event branding may become public only under the approved publication/delivery policy. Return safe URLs/asset IDs rather than privileged storage access.
- [ ] Require the organizer to have rights to display logos; define removal/support process. Do not auto-populate third-party logos or invent sponsor relationships.
- [ ] Clean up aborted/rejected/orphaned uploads and replaced assets. Prevent deletion of a reused organization asset still referenced by another authorized event.
- [ ] Keep sponsor display names/order separate from `SponsorOrganization`, prospects, agreements, benefits and verification. Agree minimal integration contracts rather than importing sponsorship internals.

## Frontend integration and failure contract

- [ ] Agree feature-scoped input/output/error DTOs in `src/contracts` under separate approval. Errors should distinguish field validation, 401/403, not found, stale revision (409), oversize (413), unsupported media (415), throttling (429), and recoverable server/storage failure.
- [ ] Implement authenticated completed-event creation and unpublished editing. There is no IndexedDB draft fallback, save/restore/delete UI or partial-draft feature to carry forward.
- [ ] Do not read, upload, migrate or delete legacy browser copies implicitly. Current form input stays in memory only; completed records are server-owned in production.
- [ ] Handle independent upload progress, cancellation, retry, offline failure and partial success without discarding valid fields/images. Disable publication while assets are pending; do not mark a draft remotely saved until confirmed.
- [ ] Prevent duplicate creation/uploads on retries through idempotency and canonical asset/event IDs. Enforce optimistic concurrency for simultaneous organizers.
- [ ] Fetch real persisted authorized event records/counts. Keep fixture examples separate and never infer agreement, ticket issuance or evidence verification from frontend presentation.

## Acceptance tests before real use

- [ ] Unauthorized and foreign-event accounts cannot list, read, edit, upload, publish or delete another event/asset.
- [ ] Cross-event asset IDs and body-supplied ownership cannot bypass access checks.
- [ ] Concurrent updates return a conflict without silently overwriting someone else's changes.
- [ ] Upload tests cover MIME spoofing, wrong signatures, corrupt/decompression-bomb images, empty/oversized files, excessive dimensions, unsupported SVG/GIF, quota/rate violations and EXIF stripping.
- [ ] Replace/delete/retry cannot leak objects or delete still-referenced organizational assets.
- [ ] Publication rejects incomplete schedules/windows, pending assets and inconsistent module settings; local state alone cannot authorize it.
- [ ] Network/storage failures, quota exhaustion and page reload retain current in-memory input on failure and preserve existing service records with truthful feedback, without claiming an unsaved form survives reload.
- [ ] Run boundaries, lint, typecheck, build, service/route authorization tests, migration checks and actual browser integration against configured environments. Review secrets/logs and data region before deployment.

## Current frontend support

### Operational contracts added after the original integration, 2026-10-06

**In progress**. The following is a backend handoff, not a claim that server routes exist. The later rules below supersede the earlier simplified registration and summary table. Shared DTOs are in `participation.ts`, `committee.ts`, and `sponsor-offer.ts`; feature services validate responses and carry endpoint annotations. Every private endpoint requires a verified, active account of the appropriate role and event-scoped authorization. Never trust body-supplied owner ids or frontend guards.

| Endpoint | Contract and backend requirement |
| --- | --- |
| `GET /api/public/events/:id/registration-form` | Published event's price, payment note, questions and default marker; approved participant access |
| `GET/PUT /api/events/:id/registration-form` | Owner only; price 0 is free; priced event needs payment instructions and payment-proof image question; up to ten validated questions with stable ids, order and choices; edits do not rewrite stored answer labels |
| `POST /api/public/events/:id/registration-images` | Participant upload before submitting answers, scoped validated raster URL; authorize target event, private proof access, orphan cleanup, quotas and retention; not public logo storage |
| `POST /api/public/events/:id/registrations` | `{answers}` validated against that event's form, registration period, publication and capacity; free starts REGISTERED, paid starts PENDING; PartnerHub does not process payment |
| `GET /api/events/:id/registrants` | Owner only; display name, reference, registration status, nullable rejection note, immutable answer labels, qrIssued, nullable checkedInAt; no account email/phone or secret |
| `POST /api/events/:id/registrants/:registrationId/decision` | `{decision:CONFIRM\|REJECT,note:null\|string}`; owner and same-event registration; only PENDING can move; confirm atomically rechecks capacity; reject permits a fresh registration/proof; optional reason max 200 characters; notify participant; never arbitrary status replacement |
| `GET /api/events/:id/qr` | Owner-only delivery counts: eventTitle, eventPublished, registered, issued; count REGISTERED only |
| `POST /api/events/:id/qr/send` | Published event owner; require registration/attendance modules and issue missing secrets only for REGISTERED; retry-safe; notify participants once; server generates high-entropy secrets, stores hashes, never sends secrets in list DTOs |
| `GET /api/me/registrations/:id/qr` | Participant's own REGISTERED and issued ticket only, with current registration and attendance modules enabled; return `{payload:PH1.secret}`; pending/rejected/cancelled never receive QR; define secure retrieval/storage design before production |
| `POST /api/events/:id/ticket-scans` | `{payload}` strict PH1 format; owner/authorized manager or accepted same-event committee only; enabled registration and attendance required; opaque hash lookup of issued REGISTERED ticket; transactional ENTRY/EXIT, stable retry timestamps and least-privilege committee response |
| `GET /api/events/:id/attendance` | Owner only; AttendanceBoard with attendanceEnabled and checked-in registrants, no account contact fields or secret; paginate production lists |
| `GET /api/committee/openings` | Approved participants, published open recruitment only |
| `POST /api/committee/openings/:id/applications` | Validate divisions, motivation and answers; one active application per opening; portfolio remains a URL |
| `GET /api/me/committee-applications` | Own applications, stage/status, selections and organizer note only |
| `GET /api/events/:id/committee` | Owner-only opening and applicant board including allowed explicit transitions |
| `PUT /api/events/:id/committee/opening` | Owner only; configure 0 to 5 stable ordered stages, divisions and opening; preserve active application history |
| `POST /api/events/:id/committee/applications/:id/decision` | Owner only, same-event applicant; enforce allowed stage/accept/reject moves; organizer note and participant notification; no arbitrary status |
| `GET /api/sponsors/directory` | Event organizer access; minimal approved company id, companyName, industry, never private verification documents |
| `GET/POST /api/events/:id/sponsor-offers` | Owner-only outgoing requests; POST published event and approved sponsor, validate support category/message/amount/proposal URL; no duplicate open request; notify target sponsor |
| `GET /api/sponsor/offers` | Approved sponsor's own received requests only |
| `POST /api/sponsor/offers/:id/response` | Target approved sponsor only; accept/decline a SENT request once; notify event owner; acceptance materializes one shared agreement in the demo, not verified benefits |
| `GET /api/events/:id/sponsor-proposals` | Owner-only incoming proposals, newest first, sponsorName added; foreign/missing event 404; no private account fields |
| `GET/POST /api/sponsor/proposals` | Own proposal list or published-event submission by approved sponsor; validate category, offer, amountLabel; initial SENT. Local organizer review uses POST /api/events/:id/sponsor-proposals/:id/decision; production remains pending. |
| `GET /api/sponsor/sponsorships` | Sponsor's own agreements and benefits; VERIFIED requires the approved organizer evidence-review transition, never frontend assertion |
| `GET /api/organizer/summary` | Owner event counts include REGISTERED participants, committee applications and accepted offers/proposals; no placeholder metrics; do not count pending/rejected/cancelled as registered |

#### Registration, tickets and attendance invariants

- [ ] Model PENDING, REGISTERED, REJECTED, CANCELLED explicitly. Block duplicate PENDING and REGISTERED submissions, permit a new submission after rejection. Atomic confirmation and free registration must enforce capacity under concurrent requests. Decide pending reservation policy before production; demo pending submissions do not count as admitted participants.
- [ ] Store payment proof privately with event-owner-only delivery. Bound image decode/storage, strip metadata, forbid arbitrary remote fetch and cross-event asset reuse. Answers may intentionally contain personal data; minimize collection and establish consent, retention and deletion before real use. Never copy sensitive proof to QR, exported secret, logs, or public event assets.
- [ ] Store only a cryptographic hash for ticket lookup, compare securely and rate limit attempts. Resolve secure secret retrieval for the participant before production (a hash cannot reconstruct the QR). Never log scan bodies or raw secrets; use no-store on private ticket/result responses, CSRF protection and secure authenticated sessions.
- [ ] Scan validates current authorized owner/manager or accepted same-event committee and enabled modules before disclosing detail. Malformed, unknown and other-event tickets disclose no participant information; inactive tickets cannot record entry. Disabled-module inspection/scanning is refused; do not restore inspection-only access. Committee receives no answers, proof, notes, contact details, QR secret or bulk registrant list. Issued entry persists if module is later disabled; do not silently erase attendance.
- [ ] Record ENTRY with a unique registration/kind constraint and atomic transaction/upsert. Repeat scans, concurrent gates and retries after response loss return ALREADY_RECORDED and the original server timestamp, not an error or a second record. Failure must never claim presence when commit did not happen. ENTRY_EXIT is current local behavior: require prior entry, reject disabled exit, and retain the first exit timestamp. Offline synchronization and public ticket lookup remain out of scope.
- [ ] Keep registration, scan and attendance reads consistent and event-scoped. Decide treatment of a later-cancelled registration with historical entry; preserve audit history rather than silently rewriting it. Record minimal authorized operator/event/timestamp audit metadata without the ticket secret or proof image.
- [ ] Enforce committee moves against current server state and stage history, including concurrent decisions and edits to recruitment. Notify once after commit; user-visible selection path must match persisted state.
- [ ] Sponsor requests and sponsor-initiated proposals remain distinct. Authorized offer/proposal acceptance materializes a shared agreement in the demo through ensureAgreement. Production must make this retry-safe and transactional. Acceptance or sponsor-display logos never verify benefit delivery; evidence needs a separate explicit review. Proposal, portfolio and evidence attachments remain URLs. Two-way rule-based matching is current demo behavior; real AI, automatic matching notifications, chat and real payment processing are deferred.
- [ ] Notifications are account-scoped, derive from committed decisions/delivery and tolerate retry without duplicate notices. Define delivery/read-state retention and deletion; mock notifications are not email delivery.
- [ ] Add unauthorized-role, pending-account, foreign-event, inactive/unissued ticket, malformed-token, concurrent scan, duplicate confirmation, capacity race, storage failure, proof privacy and retry-after-commit tests. Verify log redaction and production builds without demo modules. Configure real services before accepting real data.
- [ ] Run a fresh dependency audit before production and coordinate any compatibility-checked upgrade separately. Earlier audit findings are historical, not a statement of the current dependency tree. Never force-upgrade as part of documentation or unrelated feature work.

Design handoff: sponsor dialogs now separate labelled support facts, message and footer actions; this is presentation only, with no new sponsorship state. Scanner requires HTTPS/localhost for camera and uses jsQR locally; selected QR images are not server uploads. UI and demo verification do not prove real authorization, database concurrency or deployment readiness.

Implemented frontend: connected account/recovery/verification/onboarding/settings pages, session-aware navigation, guarded dashboard, route-based event create/detail/edit and typed services. Editor retains four stages, raster validation, replace/remove and live preview. No local-copy save/restore/delete or persisted signup draft remains; legacy copies are ignored. Remote actions succeed only when APIs confirm them. Production workspace has no synthetic records or fallback. Publishing and operational modules work in the explicit browser-local demo; production services remain In progress.

## Role registration, approval and demo mode (2026-10-05)

**In progress**. Frontend contracts are in `src/contracts/account.ts` and `src/contracts/participation.ts`. Each service function carries a `TODO(backend)` comment with the same detail. Nothing below exists on the server yet.

`Session.account` now has `role` (`user | organizer | sponsor`) and `status` (`active | pending_verification | rejected`). User accounts become `active` after email verification. Organizer and sponsor accounts stay `pending_verification` until an admin approves them. The admin tool itself is not part of this frontend task.

| Endpoint | Request | Success | Errors and rules |
| --- | --- | --- | --- |
| `POST /api/auth/register/user` | multipart: `role`, `payload` (JSON `UserRegistration`) | 201 `{session, verificationRequired}` | 409 `EMAIL_TAKEN`, 422 `{error:{code,fields}}`, 429 |
| `POST /api/auth/register/organizer` | multipart: `role`, `payload` (`OrganizerRegistration`), `logo?`, `document` | 201, status `pending_verification` | 409 `EMAIL_TAKEN`, 413, 415, 422, 429 |
| `POST /api/auth/register/sponsor` | multipart: `role`, `payload` (`SponsorRegistration`), `logo`, `document` | 201, status `pending_verification` | same as above; repeat work-email domain, NIB and NPWP checks |
| `GET /api/accounts/me/verification` | cookie | `{status, submittedAt, summary[], documents[{label,name}], reviewNote}` | never return document contents; 401 signed out |
| `GET /api/public/events` | No application login | `{items: PublicEvent[]}` published discovery only | Minimize public data; hide registrant counts and omit empty sponsor lists. Private actions remain guarded. |
| `POST /api/public/events/:id/registrations` | `{answers}` | 201 `MyRegistration` | 409 `ALREADY_REGISTERED` or `EVENT_FULL`; transaction for capacity and duplicates; user role only |
| `GET /api/me/registrations` | cookie | `{items: MyRegistration[]}` | current account only; `ticketReference` is opaque, never the QR secret |
| `GET /api/me/notifications` | cookie | `{items:[{id,title,body,createdAt,read}]}` | current account only |
| `GET /api/organizer/summary` | cookie | `{events:[{eventId,title,status,registered,capacity}]}` | own events only; `registered` excludes cancelled |
| `GET/POST /api/sponsor/proposals` | `{eventId,category,offer,amountLabel\|null}` | `Proposal` with status `SENT` | approved sponsor only; event must be published; 422 `{fields:{offer}}` |
| `GET /api/sponsor/sponsorships` | cookie | `{items: Sponsorship[]}` | own agreements only; benefit `VERIFIED` only after organizer review |

Rules the backend must enforce itself, because the frontend guard is navigation only:

- [ ] Check `role`, `status`, email verification and ownership on every request. Organizer and sponsor accounts under review must get 403 on private event/proposal actions. Guest-readable discovery/detail does not require approval or application login.
- [ ] Private data (registrants, proposals, tickets, notifications, statistics) is readable only by its owner. Public event data may be read without application login; never expose private registration/proposal data through it.
- [ ] Verification documents (KTP, legality documents, NIB, NPWP) are sensitive personal or company data. Store privately and encrypted, admin-only access, inspect magic bytes and decode, limit size (logo 2 MB, document 5 MB), define retention and deletion before real use. Never log them or put them in a response.
- [ ] Re-validate everything the client validates: phone normalization to `+62`, password policy (12 to 128 characters, at least 3 character classes, not derived from the email), NIB 13 digits, NPWP 15 or 16 digits, URL format, and that sponsor work emails are not free-mail domains. The client free-domain list is incomplete and only a UX hint.
- [ ] Define the admin approval flow (approve, reject with `reviewNote`, re-submit) and notify the applicant. A schema change for account role, status and verification data needs separate approval.
- [ ] Return the same neutral response for existing and new emails where enumeration matters. The register endpoints currently need `409 EMAIL_TAKEN` for a usable form, so decide between this UX and enumeration risk, then rate limit.
- [ ] Review Terms/Privacy for real operations before collecting personal data. Current product-style copy is not evidence of legal approval. Links belong in the footer only, not sidebars.

Demo mode: `NEXT_PUBLIC_PARTNERHUB_DEMO=1` at build time swaps the HTTP layer for an in-browser mock in `src/mocks/demo`. It is not a backend and not security. Normal non-demo builds leave the variable unset or 0; the explicit classroom build uses build:demo. Demo credentials are never production authentication. Demo credentials are public (`DemoPass-2026!` on `*@partnerhub.test`) and only work in such a build.

## Current publication billing and public/QR handoff, 18 October 2026

- [ ] Implement owner-account annual subscriptions and per-event orders using src/contracts/billing.ts. Preserve Starter Rp149.000/event or Rp699.000/year, Growth Rp499.000/event or Rp1.499.000/year and single-event upgrade Rp350.000. Limits are 300/3 and 1.500/10 per event, owner included.
- [ ] Complete setup stores a private unpublished event without an order. Publish only after readiness and verified purchase or qualifying annual coverage. Recheck owner, current term, capacity, manager count and event end at mutation. No per-event charge or zero-value transaction when subscription covers upload.
- [ ] Confirm annual order atomically, one calendar-year term, no stacking/auto-renew/mid-term annual upgrade. Pin coverage on successful publication; preserve published rights through event end plus 30 days.
- [ ] Preserve old eventBilling and exact historical amounts. Add account subscription storage without reactivating removed organization annual rights or deleting operational records.
- [ ] Provide guest-readable event detail as well as catalog, omit empty sponsor lists and do not render registrant totals. Define minimized public DTOs before release.
- [ ] Provide own read-only registration receipt at GET /api/me/registrations/:id, without secrets or other participants.
- [ ] Provide accepted committee scanning at /me/committee/:id/scan through the shared scanner contract. Check current accepted membership and module flags on every request; do not grant organizer administration.
- [ ] Production proof storage/retrieval, secret retrieval, CSRF/session guarantees, rate limits, concurrency and retention remain release blockers. Local unit/browser evidence is not a security guarantee.
