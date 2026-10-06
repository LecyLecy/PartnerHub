# PartnerHub product context

<!-- impeccable:product-schema 1 -->

## Platform

web

## Source of truth

This is a design-facing summary of `PRD.md`, not a replacement. `ARCHITECTURE.md` and `prisma/schema.prisma` govern implementation.

## Users

Campus organizations, youth communities, and small recurring-event teams. The initial dashboard serves organizers preparing and monitoring an event.

## Product Purpose

Connect event setup, consented reusable participant registration, committee recruitment, optional opaque QR entry, and sponsor benefit evidence. Sponsorship accountability is the differentiator.

## Operating Context

Teams currently coordinate through forms, spreadsheets, and chat. The first complete product flow is intended for a Venture Creation demonstration. Actual demand, revenue, and completion-time improvements are not validated.

## Capabilities and Constraints

Connected frontend integration is **In progress**: landing, email/password accounts, verification, recovery, onboarding, dashboard, settings and event create/detail/edit use real routes and typed services. Production workspace lists only API records, with no synthetic fallback. The four-stage event editor retains validation, module configuration, poster/page preview and uploaded organizer/event/sponsor-display identity. Explicit local-copy save/restore/delete remains available for complete legacy drafts, including logos and v1 text-draft compatibility. API failures retain input and never claim success. No account, event, storage, ticket, check-in or sponsorship backend is delivered. Contracts/release blockers: `todobackend.md`.

Accounts have one role chosen at registration (user, organizer, sponsor company); organizer and sponsor accounts need admin approval. Event-level roles stay event-scoped. QR data is opaque. Payments, document uploads, chat, matching, marketplace and task management are deferred. Approved frontend account flow requires email/password verification and emailed recovery, with optional display name. Backend provider, lifetimes, retention/deletion/consent and hosting remain release decisions. Logo storage is In progress. Supabase is PostgreSQL through Prisma, not configured Auth, Storage or browser database access.

## Brand Commitments

Name: PartnerHub. User-approved direction: navy blue, bold/creative campus character, larger text, and an interactive event-draft flow. UI copy is Indonesian; technical documentation remains English. Demo data must be visibly identified, not presented as actual event activity. The initial restrained admin dashboard was rejected and is not the visual authority for the revision.

## Evidence on Hand

`PRD.md`, architecture documents, current schema, and existing `assets/partnerhub-logo.svg`. No real event dataset, sponsor names, testimonials, or usage metrics are available.

## Product Principles

- Protect one complete event flow before broad feature expansion.
- Separate reusable profile data from event-specific answers.
- Keep feature ownership isolated and backend modules server-only.
- Show implemented behavior honestly; label incomplete product flows In progress.

## Accessibility & Inclusion

The workspace prototype must support keyboard navigation, readable contrast, reduced motion, and responsive desktop, tablet, and mobile layouts.
