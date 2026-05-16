# Mentor IB Phase 2 Task Pack v1

**Date:** 2026-04-10
**Status:** Broad but execution-usable Phase 2 task pack for future AI agents
**Scope:** tutor application and listing quality, deeper tutor management, lesson-linked trust and continuity, richer internal operations, richer messaging behavior, and conditional growth/scaling work after the core product is stable

## 1. Why This Document Exists

Mentor IB now has:

- an active Phase 1 MVP execution pack
- a bounded Phase 1.5 pack
- a master backlog index
- a decision index for routing implementation work to the right source docs

What still needs definition is the next layer after the core product loop is stable:

**Which product areas belong in Phase 2, and which of them are concrete enough to implement versus only concrete enough to reserve?**

Phase 2 matters because it is where the product stops being only:

- first match
- first booking
- first conversation

and starts becoming a stronger operating system for:

- tutor supply and approval
- tutor quality and visibility
- post-lesson continuity
- internal trust and moderation work
- selected scale and growth pressures

At the same time, this phase should not pretend that every later idea is equally ready.

This document exists to keep Phase 2 broad where it should stay broad, and specific where the current docs pack is already strong enough to support implementation.

## 2. How To Use This Pack

Use this pack after the relevant Phase 1 and Phase 1.5 foundations are stable enough to support it.

The workflow is:

1. confirm whether the Phase 2 need is product-driven, operationally necessary, or threshold-triggered
2. open this pack to find the right Phase 2 lane
3. use `docs/planning/agent-implementation-decision-index-v1.md` to confirm source docs
4. use `docs/planning/implementation-task-template-v1.md` when a task needs tracker-grade expansion
5. keep any route, DTO, or policy change inside approved boundaries rather than inventing a new subsystem

This pack is intentionally broader than Phase 1 and Phase 1.5.

That is not a bug.

It reflects the fact that some Phase 2 work is already well-defined, while some should remain conditional until real implementation or usage reveals the right shape.

## 3. Phase 2 Entry Conditions

Phase 2 should begin only when the relevant earlier foundations exist in a usable form.

Required baseline:

- shared student and tutor route families are stable
- tutor public profile and booking foundations exist
- messages and lessons exist as shared continuity objects
- tutor operations are usable enough to support real tutor workflows
- compare and tutor students are either implemented or intentionally deferred with the underlying objects still stable

Additional practical triggers:

- tutor supply growth now requires a real application and approval workflow
- tutors need clearer control over listing quality, credentials, and public media
- real lessons create pressure for reviews or post-lesson continuity records
- message volume or support pressure justifies richer message behavior
- internal operations become too manual to stay outside the product
- browse-search or query latency crosses the approved thresholds

Do not start threshold-triggered growth work just because it is listed here.

Start it when the trigger exists.

## 4. What Phase 2 Covers

Phase 2 is the first broader product-expansion phase.

Its expected areas are:

- tutor application and approval flow
- deeper tutor profile and listing management
- credential, public media, and intro video management
- lesson-linked reviews and trust expansion
- post-lesson reports and continuity signals
- richer messaging behavior
- internal tutor-review and moderation operations
- growth or scaling work only when thresholds justify it

## 5. Phase 2 Non-Goals

Phase 2 should not include by default:

- native mobile apps
- custom video meeting infrastructure
- a full payout or billing platform
- a giant generic admin suite
- a broad data warehouse or BI program
- automatic self-optimizing ranking
- a mandatory Algolia migration
- file attachments in messaging unless a dedicated product need is approved
- broad SEO route expansion by default

## 6. Status And Priority Vocabulary

Use:

- `ready`: concrete enough to implement when it becomes active priority
- `draft`: valid and useful, but still needs sharper interaction, route, or sequencing choices
- `planned`: intentionally reserved and should only start when a trigger condition exists
- `done`: implemented and verified

Priority:

- `P1`: major Phase 2 product expansion work
- `P2`: important operational or quality work
- `P3`: conditional growth or scaling work

## 7. Planning Posture For Phase 2

Unlike Phase 1, this pack should not force fake certainty.

The practical rule is:

- keep user-facing supply and trust work relatively concrete
- keep internal operations and richer communication work more provisional unless the team is actively entering that lane
- keep growth and scaling work conditional, not default

If a task depends on a route that is not yet explicitly approved in the route map, keep it as `draft` until that route decision is made or revised deliberately.

## 8. Execution Waves

Use this as the default order.

## 8.1 Wave 1: Tutor supply and listing quality

Goal:

- make tutor onboarding, profile quality, and listing readiness feel deliberate, supportive, and reviewable

## 8.2 Wave 2: Trust and continuity expansion

Goal:

- extend the product beyond one-off lessons through reviews, reports, and stronger trust surfaces

## 8.3 Wave 3: Privileged operations and richer communication

Goal:

- support internal admin review and trust work, and expand messaging only where the product now clearly benefits

## 8.4 Wave 4: Growth and scaling

Goal:

- respond to real performance or growth pressure without prematurely locking the product into heavier infrastructure

## 9. Parallel Work Rule

Parallel work is allowed only when the write scopes are meaningfully disjoint.

Good parallel examples:

- tutor application UX work and lesson-review domain work
- internal moderation queue planning and public tutor media pipeline work
- threshold monitoring work and user-facing Phase 2 UI work

Bad parallel examples:

- two agents editing the same tutor application state model
- review publication work before review eligibility and moderation boundaries are settled
- Algolia-readiness work mixed with active matching logic changes

## 10. Task Pack Table

**This table is sorted by execution order, not by workstream.** Tasks on the same step can run in parallel. Complete all tasks in a step before moving to the next step.

| Step | Task id | Status | Priority | Wave | Short title |
| --- | --- | --- | --- | --- | --- |
| 1 | `P2-APPLY-001` | `ready` | `P1` | 1 | Tutor application staged flow and readiness experience |
| 1 | `P2-TRUST-001` | `ready` | `P1` | 2 | Lesson-linked review capture and publication flow |
| 1 | `P2-REPORT-001` | `ready` | `P1` | 2 | Lesson reports and post-lesson continuity surfaces |
| 1 | `P2-DS-MENU-001` | `ready` | `P1` | 3 | Popover, Menu, OverflowMenuTrigger primitives + Chip pressed state |
| 1 | `P2-NOTIF-PREF-001` | `ready` | `P2` | 2 | Notification preferences and channel controls |
| 2 | `P2-MSG-001` | `ready` | `P2` | 3 | Rich messaging behaviors wave |
| 2 | `P2-APPLY-002` | `ready` | `P2` | 1 | Internal tutor review queue and approval decisions |
| 2 | `P2-PROFILE-001` | `ready` | `P1` | 1 | Tutor profile editor and listing publication controls |
| 2 | `P2-GROW-001` | `ready` | `P2` | 4 | Public tutor search page powered by Algolia |
| 3 | `P2-MEDIA-001` | `draft` | `P1` | 1 | Tutor credential, media, and intro video management |
| 3 | `P2-OPS-001` | `draft` | `P2` | 3 | Admin trust and report-management internal surfaces |
| 3 | `P2-OPS-003` | `draft` | `P2` | 3 | Admin reference-data and policy broadcast management |
| 4 | `P2-OPS-002` | `draft` | `P2` | 3 | Admin user detail and finance intervention surfaces |
| 4 | `P2-DISPUTE-001` | `draft` | `P2` | 3 | Lesson-issue internal review and dispute resolution surface |
| 5 | `P2-DSR-001` | `draft` | `P2` | 3 | Data subject request implementation |
| 6 | `P2-QUALITY-001` | `ready` | `P2` | 4 | Phase 2 verification and operational hardening pass |

## 11. Detailed Tasks

This pack intentionally mixes `ready`, `draft`, and `planned` tasks.

That is the correct posture for Phase 2.

## 11.1 `P2-APPLY-001` Tutor application staged flow and readiness experience

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P1-AUTH-002`, `P1-DATA-001`, `P1-DATA-002`, `P1-TUTOR-001`

**Goal**

Implement the staged tutor application flow so becoming a tutor feels confidence-building, finite, and clearly tied to future booking readiness rather than to a giant back-office form.

**Required source docs**

- `docs/wireframes/wireframes-tutor-core-v1.md`
- `docs/visual-design/hi-fi-key-screen-comps-wave2-v1.html`
- `docs/design-system/component-specs-phase2-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/data/tutor-listing-readiness-model-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md` (section 8.2 — application statuses)

**Scope**

- `/tutor/apply`
- staged application sections
- progress and readiness language
- save-and-resume behavior
- pending-review state and `changes_requested` return flow
- readiness checklist reflecting 6-gate listing model
- preview-public-profile handoff where applicable
- draft and submit mutations through approved boundaries

**Out of scope**

- internal review queue
- payout or tax collection
- public SEO growth work for tutor acquisition explainers

**Acceptance criteria**

- one major task is presented at a time
- progress language feels supportive, not bureaucratic
- pending-review state is informative rather than dead
- the flow stores real application state rather than temporary UI-only progress

**Verification**

- application flow review against wireframes and hi-fi
- responsive and accessibility review
- mutation-boundary review

## 11.2 `P2-APPLY-002` Internal tutor review queue and approval decisions

**Status:** `ready`
**Priority:** `P2`
**Wave:** 1
**Depends on:** `P2-APPLY-001`

**Goal**

Implement the internal tutor-review surface and decision workflow so application approval, rejection, and request-for-changes actions are explicit, auditable, and capability-gated. The decision flow must move applicants between the canonical `tutor_profiles.application_status` values (`submitted` ↔ `under_review` ↔ `changes_requested` ↔ `approved`/`rejected`) and, on approval, flip the tutor's `user_roles.role_status` from `pending` to `active` so the tutor can exercise the role.

**Required source docs**

- `docs/architecture/admin-and-moderation-architecture-v1.md` (§§ 6, 7, 8, 9, 10, 15 — internal capability families, internal route boundary, dual-layer auth, queue architecture, tutor approval architecture, internal notes)
- `docs/data/auth-and-authorization-matrix-v1.md` (§§ 8.6, 10.10 — internal admin routes; `tutor_application_reviews` and `admin_action_logs` table-family rules)
- `docs/data/data-dto-and-query-boundary-map-v1.md` (§§ 9, 21 — query owner table; admin/moderation `D7` DTO rules)
- `docs/data/api-and-server-action-contracts-v1.md` (§§ 6, 8, 14, 21, 22 — Server Action golden path, boundary errors, abuse contract, observability)
- `docs/architecture/route-layout-implementation-map-v1.md` (§§ 7.7, 9.7 — internal family; internal layout responsibilities)
- `docs/data/database-enum-and-status-glossary-v1.md` (§§ 8.2 `tutor_profiles.application_status`, 13.4 `tutor_application_reviews.review_status`)
- `docs/data/database-rls-boundaries-v1.md` (internal-only table RLS posture)
- `docs/data/migration-conventions-v1.md` and `docs/data/database-change-review-checklist-v1.md` (migration shape and review checklist)
- `docs/data/drizzle-schema-and-query-conventions-v1.md` (module schema declaration conventions)
- `docs/data/tutor-listing-readiness-model-v1.md` (approval as the gate that unblocks downstream listing readiness — must not be conflated with listing publication)
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md` (notification enqueue boundary for the existing `tutor_application_reviewed` kind)
- `docs/architecture/canonical-value-ownership-map-v1.md` (canonical-value ownership for statuses and reference-backed labels used in the queue UI)
- `docs/design-system/agent-ui-rules.md` and `docs/design-system/component-specs-phase2-v1.md` (DS-first rules; reuse `Popover`, `Menu`, `OverflowMenuTrigger`, `Chip` from `P2-DS-MENU-001` for action menus and filter chips)

**Scope**

- `/internal/tutor-reviews` queue list page and `/internal/tutor-reviews/[applicationId]` detail page
- internal layout (`src/app/internal/layout.tsx`) and `/internal/tutor-reviews` pages perform server-side dual-layer authorization: the actor must hold an active `admin` row in `user_roles`; unauthorized actors render `not_found` per the boundary error contract, not a visible forbidden page
- new internal-only table `tutor_application_reviews` (per glossary §13.4) holding one review record per tutor application transition, with: `id`, `tutor_profile_id`, `reviewer_app_user_id`, `review_status` (`queued`/`under_review`/`changes_requested`/`approved`/`rejected`), `reviewer_note` (visible to applicant when status is `changes_requested` or `rejected`), `internal_note` (never exposed to the applicant), `created_at`, `updated_at`, plus indexes that support the queue filters and the tutor-history view; RLS enabled with internal-only access and no anon/auth role access
- queue list surface: filter by review status (default `queued` + `under_review`), basic sort (oldest submission first), pagination, and a counter chip per status; rows must show only D7 admin DTO fields (applicant display name, submitted-at, current status, last-reviewer summary) and link to the detail surface
- detail surface: read-only summary of the applicant's submitted application data composed from the existing tutor application read path (no new cross-domain join in the page), plus a per-row history of prior review events for that applicant
- explicit Server Actions for the three decision transitions: `claimForReview` (queued → under_review), `requestChanges` (under_review → changes_requested, requires `reviewer_note`), `approveApplication` (under_review → approved), `rejectApplication` (under_review → rejected, requires `reviewer_note`); each action: validates the actor has admin capability, validates the source state via a small state-machine helper, writes a new `tutor_application_reviews` row, updates `tutor_profiles.application_status` in the same transaction, and on `approveApplication` flips the tutor's `user_roles.role_status` from `pending` to `active` (use the existing service-role write path consistent with `applySetupRoleSelection`)
- notification fan-out: on each terminal or applicant-visible transition (`changes_requested`, `approved`, `rejected`) enqueue the existing `tutor_application_reviewed` notification kind through the approved notification boundary; the applicant-facing payload exposes only the new status and the public `reviewer_note` (never `internal_note`)
- audit posture: every decision is captured as a new `tutor_application_reviews` row (the table is the audit trail for this domain — no separate `admin_action_logs` write is added in this task)
- module placement: schema in `src/modules/tutors/review-schema.ts` (or extend `src/modules/tutors/schema.ts`); domain command + query services in `src/modules/tutors/application-review-service.ts` and `src/modules/tutors/application-review.ts`; DTO types kept distinct from the applicant-facing application DTOs
- UI primitives: action menus must consume `OverflowMenuTrigger` + `Menu`; filter chips must consume `Chip` with the `pressed` state; no route-local icons, flags, or ad hoc menu CSS; reference-backed labels (e.g., subject names shown in the detail view) flow through `src/modules/reference/**` loaders

**Out of scope**

- broad support or finance tooling, or any generalized internal dashboard expansion
- credential file review actions and credential-status transitions (`tutor_credentials.review_status` workflow) — owned by `P2-MEDIA-001`
- payout readiness or `public_listing_status` mutation from this surface (`approved` only unlocks the listing readiness gate; flipping to `listed` is owned by the tutor or by `P2-OPS-002`/`P2-PROFILE-001`)
- finer-grained internal capability roles beyond the existing `admin` row in `user_roles` (the architecture's capability separation is acknowledged but is a later refactor; this task uses `admin` as the sole gate)
- a separate `admin_action_logs` table, generalized moderation case schema, or shared internal queue infrastructure — owned by `P2-OPS-001`
- realtime updates to the queue (page refresh / cache revalidate is sufficient)
- bulk actions, assignment/claim semantics beyond a single reviewer per `under_review` transition, or reviewer reassignment workflows

**Acceptance criteria**

- the `/internal/*` routes deny access to non-admins via a server-side check at the page boundary and render `not_found` rather than `403` or a visible internal shell
- `tutor_application_reviews` exists with the canonical `review_status` set from glossary §13.4, has RLS enabled, and is only writable by service-role/server paths
- review decisions are modeled as explicit state transitions; an attempt to drive an illegal transition (e.g., approving an application not in `under_review`) returns a `conflict` error and does not mutate state
- on `approveApplication`, both `tutor_profiles.application_status = 'approved'` and the tutor's `user_roles.role_status = 'active'` are updated atomically; on failure neither side is updated
- on `changes_requested` and `rejected`, a `reviewer_note` is required; on all applicant-visible transitions the `tutor_application_reviewed` notification is enqueued and the payload never carries `internal_note`
- the applicant-facing application status surface (existing P2-APPLY-001 read path) reflects the new state and reviewer note without exposing internal-only fields, audit history, or reviewer identity
- queue list and detail DTOs are `D7`-shaped: no raw rows, no `app_user_id` leaks beyond what the admin scope already permits, no credential file contents, no message bodies
- DS-first holds: no new route-local card/chip/panel/icon CSS or inline SVGs; menus and chips reuse the `P2-DS-MENU-001` primitives; if a new shared variant is required, the design-system inventory and (if applicable) tokens cheatsheet are updated in the same commit
- copy is supportive and operational, not adversarial; rejection and changes-requested templates point applicants to the next concrete step

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest unit tests cover: the state-machine helper (allowed/disallowed transitions), the approve-and-grant-role atomicity, and the notification payload shape (no `internal_note` leak)
- Supabase DB tests cover: RLS on `tutor_application_reviews` (admin-only read/write, anon/auth denied) and the migration shape per the change-review checklist
- manual privilege check: signing in as a non-admin renders `not_found` for both queue and detail routes; signing in as an admin can drive a sample applicant through `claim → request_changes → re-submit → approve` and through `claim → reject`
- DTO leak review: both queue and detail responses inspected to confirm `internal_note`, raw reviewer email, and unrelated tutor records are absent
- no `pnpm test:e2e` required (no public route surface or auth-entry surface is touched); call this out in the final report

## 11.3 `P2-PROFILE-001` Tutor profile editor and listing publication controls

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P2-APPLY-001`

**Goal**

Implement the post-approval tutor profile editor and the tutor-owned publication controls so an `approved` tutor can keep their public-facing profile current, see exactly which profile fields gate listing readiness, and flip their public listing between `not_listed` ↔ `listed` (and to/from a self-`paused` state) — without re-using the application flow as a permanent editing surface and without exposing any internal moderation state.

The tutor application flow (`P2-APPLY-001`) is the pre-approval onboarding surface. After approval, the same content (`headline`, `bio`, `hourly_rate_minor`, `currency_code`, `pricing_summary`, `tutor_subject_capabilities`, `tutor_language_capabilities`, `schedule_policies.timezone`) must be editable through a dedicated editor that uses the same domain mutation paths, the same validation, and the same DS primitives, but is shaped for ongoing edits rather than staged submission. This task also adds the tutor-owned listing-publication action so the readiness checklist's terminal step (going live) is a real user action rather than a passive side effect.

**Required source docs**

- `docs/data/data-dto-and-query-boundary-map-v1.md` (§§ 8.6 D5 tutor-private DTO, 9 query owner table — “Public tutor profile” row stays D1, “tutor profile setup state” lives behind D5)
- `docs/foundations/ux-object-model.md` (§ 3.7 `TutorProfile` two-mode rule: public consumption mode and owner edit mode share one object)
- `docs/design-system/design-system-spec-final-v1.md` (Panel/Section/Card/Chip/StatusBadge usage; `ChecklistPanel` for readiness)
- `docs/design-system/component-specs-phase2-v1.md` (§ 11 `ChecklistPanel` — tutor wrapper used for the readiness checklist; reuse the same primitives the apply page already consumes)
- `docs/design-system/component-specs-core-v1.md` (Panel/Section/Card/Chip/StatusBadge/Avatar/Icon/Flag — no new variants needed)
- `docs/design-system/agent-ui-rules.md` (DS-first; no route-local card/chip/panel/icon/flag CSS; icons via `src/components/ui/icon.tsx`, flags via `src/components/ui/flag.tsx`; copy discipline)
- `docs/architecture/file-and-media-architecture-v1.md` (separation of M1 private verification assets, M2 public profile media, M3 derived trust proof, M4 external video references — this task does **not** ship the media surfaces themselves; it only confirms which fields stay out of the editor and are owned by `P2-MEDIA-001`)
- `docs/data/data-ownership-boundary-map-v1.md` (§§ 9 `tutor_profiles` ownership, 10 tutor capability/credential ownership — owner edit through controlled mutation paths; admin paths separate)
- `docs/data/tutor-listing-readiness-model-v1.md` (§§ 4 gates 1–6, 5.2 listing-status values, 5.3 gate failure after listing, 7 readiness checklist — canonical contract for the editor’s readiness panel and the publish/pause control)
- `docs/data/database-enum-and-status-glossary-v1.md` (§§ 8.1 `profile_visibility_status`, 8.2 `application_status`, 8.3 `public_listing_status`, 15.3 `payout_account_status` — canonical enum values)
- `docs/data/auth-and-authorization-matrix-v1.md` (§§ around `tutor_profiles`, `tutor_subject_capabilities`, `tutor_language_capabilities` write paths — owning tutor through controlled mutation paths; admin paths separate)
- `docs/data/database-rls-boundaries-v1.md` (RLS posture for tutor-owned tables; no new tables in this task)
- `docs/data/drizzle-schema-and-query-conventions-v1.md` (module schema and repository conventions — reuse `src/modules/tutors/schema.ts`)
- `docs/data/api-and-server-action-contracts-v1.md` (§§ 6 Server Action golden path, 8 boundary errors, 14 cache revalidation — “tutor profile edit revalidates public tutor profile path and relevant public tutor tags”)
- `docs/architecture/route-layout-implementation-map-v1.md` (§ 7.6 tutor family — `/tutor/profile` fits the explicit operational pattern alongside `/tutor/apply`, `/tutor/overview`; § 16 reserved-later note for tutor profile management is now activated)
- `docs/architecture/canonical-value-ownership-map-v1.md` (canonical-value ownership for statuses; reference-backed labels for subjects/focus areas/languages flow through `src/modules/reference/**`)
- `docs/foundations/cross-role-journey-inventory-v1.md` (J-TUT-016 tutor profile/credential/media management; J-INT-005 admin-owned `paused`/`delisted` flows that the editor must reflect read-only)

**Existing repo anchors to reuse (do not duplicate or fork)**

- `src/modules/tutors/schema.ts` — `tutor_profiles`, `tutor_subject_capabilities`, `tutor_language_capabilities`, `schedule_policies`, `tutor_meeting_preferences` already exist; no migrations needed.
- `src/modules/tutors/application.ts` — `TutorApplicationDraftInput`, `validateTutorApplicationDraft`, `buildResolvedCapabilityPairs`, `parseHourlyRateMajor`, `formatHourlyRateMajor`, `evaluateTutorProfileMinimum` (via `listing-readiness.ts`), `buildApplicationOptions`. These are the authoritative validators and option builders for the editor; the new profile-editor service must wrap them, not reimplement them.
- `src/modules/tutors/listing-readiness.ts` — reuse `evaluateTutorProfileMinimum` for gate 2.
- `src/modules/tutors/tutor-overview.ts` — already computes gate state for the overview readiness module; the editor's readiness panel must read from the same domain function and not recompute gates independently.
- `src/app/tutor/apply/actions.ts` + `apply-form.tsx` — same input shape; the editor's Server Actions reuse the same validation and the same Supabase service-role write path, but mutate without ever touching `application_status`.
- `src/components/ui` primitives (`Panel`, `Section`, `Card`, `Chip`, `StatusBadge`, `Avatar`, `Icon`, `Flag`, `InlineNotice`, `getButtonClassName`) and `src/components/continuity` (`PersonSummary`).
- `src/app/(public)/tutors/[slug]/page.tsx` — the “preview public profile” link target. The editor’s preview action must open this existing route in a new tab and must not bypass `evaluateTutorProfileIndexability`.

**Scope**

- New tutor route `src/app/tutor/profile/page.tsx` (server component) at `/tutor/profile`, plus `actions.ts`, `profile-form.tsx` (client component), and a route-local `profile.module.css` aligned with the apply page’s structure. The page:
  - resolves auth + account exactly like `src/app/tutor/apply/page.tsx` (Supabase `getUser` → `ensureAuthAccount` → role/restriction gates → redirect to setup/sign-in as needed)
  - requires the tutor to hold `application_status === "approved"`; tutors with any other application status are redirected to `/tutor/apply` with a brief explanation `InlineNotice` left on `/tutor/apply` (no new copy on profile)
  - renders a `Panel`-led editor (DS-first, no route-local card/panel CSS) for the public-content fields and a `ChecklistPanel`-based readiness summary that mirrors `/tutor/apply` post-approval but reflects the **current** profile state rather than the application draft
  - exposes a single tutor-owned “Publish public listing” / “Pause public listing” / “Resume public listing” action driven by `public_listing_status` (see publication transitions below)
  - exposes a “Preview public profile” secondary action linking to `/tutors/${publicSlug}` in a new tab, only when `publicSlug` exists
- New domain module entry points in `src/modules/tutors`:
  - `tutor-profile-editor.ts` (query): `getTutorProfileEditor(account)` returns a `D5` DTO shaped for the owner-edit mode, composed from the existing application reads (reuses `loadActiveReferenceSubjects/FocusAreas/Languages`, `buildApplicationOptions`, capability + language + schedule-policy + meeting-preference loaders). DTO fields: current values, validation options, current `application_status`, current `public_listing_status`, `publicSlug`, per-gate state from `buildReadinessGates` (same function used by `tutor-overview.ts`), the read-only admin-hold reason when `public_listing_status` is `paused`/`delisted` (status enum + tutor-facing copy from `tutor-listing-readiness-model-v1.md` § 5.2), and an `applicantVisibleReviewerNote: null` (this surface never shows reviewer notes — they belong on `/tutor/apply`).
  - `tutor-profile-editor-service.ts` (command): two Server Actions, called from the new `actions.ts`:
    - `updateTutorProfile(input)` — validates with the existing `validateTutorApplicationDraft` (renamed wrapper acceptable, but reuse the implementation), writes through the same service-role path the apply action uses, and updates `tutor_profiles.headline/bio/hourly_rate_minor/currency_code/pricing_summary`, plus replaces `tutor_subject_capabilities` and `tutor_language_capabilities` rows. Does **not** touch `application_status`. On approved + listed profiles, the action runs gate evaluation (`evaluateTutorProfileMinimum` + the same gate composition used in `application.ts`) and, if any gate that was previously passing now fails, auto-flips `public_listing_status` from `listed` → `not_listed` in the same transaction and enqueues the existing tutor-listing notification (see notification section). It never auto-flips to `paused`/`delisted` (those are admin-only per `J-INT-005`).
    - `setTutorListingPublication(action)` — accepts one of three intents: `publish`, `self_pause`, `resume`. Transitions are:
      - `publish`: `not_listed` → `listed`, allowed only when **all six gates pass** (gate 1 application approved, gate 2 profile minimum complete, gate 3 schedule set, gate 4 meeting link configured, gate 5 payout ready, gate 6 no admin hold). When the listing already auto-evaluates to `eligible` per `tutor-listing-readiness-model-v1.md` § 5.2, the action immediately promotes to `listed`. Failing gates return a `conflict` boundary error with the failing gate keys; the page surfaces the same `ChecklistPanel` items as remaining work.
      - `self_pause`: `listed` → `not_listed` (do **not** invent a new `self_paused` enum value; `paused`/`delisted` remain admin-owned per `J-INT-005` and the glossary §8.3 definitions). The tutor-facing label can be “Paused by you” but the stored value is `not_listed`. Add a `self_paused_at` timestamp column on `tutor_profiles` to distinguish tutor-initiated unlisting from gate failure — see migration note below.
      - `resume`: `not_listed` (self-paused) → `listed` if all gates pass; otherwise the action returns `conflict` with the remaining gate keys.
      - Any transition while `public_listing_status` is `paused` or `delisted` (admin hold) returns `conflict` and renders the existing admin-hold copy from the readiness model § 5.2.
  - Both actions wrap writes in a single transaction, call `revalidatePath('/tutors/[slug]', 'page')` (and the existing tutor public tag if used), and `revalidatePath('/tutor/profile')` + `/tutor/overview` on success.
- One **small** migration in `supabase/migrations/` adding `self_paused_at timestamptz null` to `tutor_profiles` and an index `tutor_profiles_self_paused_at_idx`; no enum changes, no new tables. Update `src/modules/tutors/schema.ts` to mirror the column. Include a Supabase DB test covering RLS write authority (owner write only via service role; anon/auth blocked).
- DTO and copy:
  - Editor DTO is `D5` (tutor private). It must **not** carry `internal_note`, `tutor_application_reviews` rows, admin reviewer identity, raw `tutor_credentials.review_status`, or unrelated tutors' data.
  - Public consumption stays `D1` via the existing `getPublicTutorProfileBySlug` path; this task does not change the public DTO shape.
  - Tutor-facing copy comes verbatim from the readiness-model § 5.2 messages for paused/delisted; supportive (coaching) tone for missing gates; no internal moderation language.
- Readiness panel uses the same `buildReadinessGates` output already used by `/tutor/apply` and `/tutor/overview`, rendered via `ChecklistPanel` from the design system. Each item must clearly indicate which gate it represents (“Profile minimum”, “Schedule set”, “Meeting link”, “Payouts ready”, plus the admin-hold row only when active per `application.ts:723-739`). Items deep-link with `Link` to the owning surface: profile-minimum → editor section anchor on the same page; schedule → `/tutor/schedule`; meeting → `/tutor/schedule` (meeting preference editor — already there); payouts → `/tutor/earnings`.
- Notification integration: when `setTutorListingPublication` transitions `not_listed` → `listed` or `listed` → `not_listed` (tutor-initiated), enqueue an in-app notification through the existing notification boundary used by `P1-NOTIF-001`/`P1-NOTIF-002` (`tutor_listing_status_changed` kind — reuse if it exists; if not present, this task adds the kind to the existing kinds enum and queues a tutor-only payload `{ status, reason: "self" | "gate_regression", missingGateKeys: [...] }`; verify whether the kind exists before adding). Auto-flip due to gate regression (from `updateTutorProfile`) uses `reason: "gate_regression"` and includes the failing gate keys.
- DS-first verification: no route-local card/chip/panel/icon CSS or inline SVGs. Icons via `src/components/ui/icon.tsx`; flags via `src/components/ui/flag.tsx`. Reference-backed labels (subjects, focus areas, languages) flow through `src/modules/reference/**` loaders.

**Out of scope**

- credential, public media, and intro-video editing surfaces — owned entirely by `P2-MEDIA-001` (this task only ensures the editor leaves their fields untouched and links out where appropriate)
- review queue, admin pause/delist actions, internal note surfacing — owned by `P2-APPLY-002` (already shipped) and `P2-OPS-001`/`P2-OPS-002`
- payout onboarding UI or Stripe Connect flow changes — owned by `P1-TUTOR-005` and later `P2-OPS-002`
- schedule and availability editing — owned by the existing `/tutor/schedule` surface; the readiness panel deep-links there
- a separate public/private tutor-profile model — the canonical object is one row in `tutor_profiles` with two read shapes; do not introduce a parallel “published draft” model
- generic CMS-like blocks, rich text, or arbitrary attachments
- automatic transitions to/from admin-owned `paused`/`delisted` (those remain admin-only per `J-INT-005`)
- `profile_visibility_status` mutations beyond keeping it in sync with publication (the column predates this task and is not the discovery gate; `public_listing_status` is)
- introducing a new `self_paused` enum value on `public_listing_status` (kept as `not_listed` + `self_paused_at` timestamp)
- new search/discovery work — this task only revalidates the existing public tutor route on changes
- introducing internal `/api/*` endpoints for editor data; reads stay in the Server Component, writes stay in Server Actions
- new design-system primitives — this task must compose only existing DS components

**Acceptance criteria**

- `/tutor/profile` exists, is gated to `application_status === "approved"` (any other status redirects to `/tutor/apply`), respects all account-state redirects already enforced by `/tutor/apply`, and renders a DS-composed editor with a readiness `ChecklistPanel` and a single publication-control action.
- The editor DTO is `D5` and carries no internal moderation state (`internal_note`, reviewer identity, `tutor_application_reviews` rows, or `tutor_credentials.review_status`).
- `updateTutorProfile` validates with the same rules `/tutor/apply` already uses (`validateTutorApplicationDraft`), writes through the same service-role path, and never mutates `application_status`. Subject + language capability replacements happen in a single transaction with the profile update.
- After a successful `updateTutorProfile` on a `listed` profile that now fails any of gates 2–4 (profile minimum, schedule set, meeting link), `public_listing_status` auto-flips to `not_listed` in the same transaction and the gate-regression notification is enqueued; the public route is revalidated. Auto-flip never crosses into `paused`/`delisted`.
- `setTutorListingPublication("publish")` succeeds only when all six gates currently pass; otherwise it returns `conflict` with the failing gate keys and the UI surfaces those gates as next steps in the checklist. The transition is `not_listed` → `listed` (no intermediate `eligible` state stored in the row beyond what `tutor-listing-readiness-model-v1.md` § 5.2 already describes — `eligible` remains the transient evaluation result).
- `setTutorListingPublication("self_pause")` transitions `listed` → `not_listed` and writes `self_paused_at = now()`. `setTutorListingPublication("resume")` clears `self_paused_at` and re-publishes if gates pass.
- While `public_listing_status` is `paused` or `delisted`, both Server Actions return `conflict`; the UI displays the readiness-model § 5.2 tutor-facing message read-only and offers no “Resume” button.
- Successful writes revalidate `/tutors/[slug]`, `/tutor/profile`, and `/tutor/overview` (and any existing tutor public cache tag); the next public-profile fetch reflects the change.
- The migration adds only `self_paused_at` + its index to `tutor_profiles`, has RLS unchanged from the existing posture (owner-readable, service-role write), and ships with a DB test confirming anon/authenticated cannot write `self_paused_at` directly.
- DS-first holds: no new route-local card/chip/panel/icon CSS, no inline SVGs, no new DS primitives; the page composes existing `Panel`/`Section`/`Card`/`Chip`/`StatusBadge`/`ChecklistPanel`/`Icon`/`Flag` primitives. `pnpm lint:arch` passes.
- Reference-backed labels (subjects, focus areas, languages) come from `src/modules/reference/**` loaders, not route-local arrays.
- Copy is coaching, supportive, and avoids internal language; admin-hold rows reuse the canonical strings from the readiness model.
- Tutors with `application_status` other than `approved` cannot reach the editor; tutors with `approved` but failing gates can save edits but cannot publish.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest unit tests cover: (a) the publish/self-pause/resume state machine including all `conflict` cases, (b) the auto-flip-on-regression path in `updateTutorProfile` (verify both the status flip and the notification payload’s `missingGateKeys`), (c) DTO leak check ensuring `getTutorProfileEditor` never carries reviewer notes, internal notes, or unrelated tutors’ rows, (d) admin-hold lockout (any tutor action while `paused`/`delisted` returns `conflict`).
- Supabase DB test covers: migration shape per `database-change-review-checklist-v1.md`, RLS on the new column (owner read OK; anon/auth write denied), and the existing `tutor_profiles` RLS posture is preserved.
- `pnpm test:e2e` is **not** required (no public route, auth entry, `robots.ts`, or `sitemap.ts` change). Call this out explicitly in the final report.
- Manual smoke (documented in the report):
  - sign in as a tutor with `application_status = approved` and all six gates passing → publish → public profile is reachable at `/tutors/${slug}` and `public_listing_status = listed`
  - same tutor → self-pause → public profile becomes unavailable and `self_paused_at` is set
  - same tutor → resume → public profile is reachable again
  - sign in as an approved tutor missing meeting link → publish returns `conflict` and the checklist highlights “Meeting link configured”
  - sign in as a tutor with `application_status = changes_requested` → `/tutor/profile` redirects to `/tutor/apply`
  - admin pauses listing via the existing admin path → tutor sees the canonical paused message on `/tutor/profile` and both Server Actions return `conflict`

## 11.4 `P2-MEDIA-001` Tutor credential, media, and intro video management

**Status:** `draft`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P2-APPLY-001`, `P2-PROFILE-001`

**Goal**

Implement the tutor-side management flow for credential evidence, public profile media, and external intro video references, with clear separation between private verification inputs and public trust outputs.

**Required source docs**

- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`

**Scope**

- private credential upload and management
- public media asset management
- external intro video reference management
- review/publication-state handling where required

**Out of scope**

- raw credential files on public tutor pages
- native video hosting
- broad asset-library features

**Acceptance criteria**

- credential evidence and public trust proof remain separate concepts
- public media and intro video references follow the approved visibility rules
- accessibility expectations for public video embeds are respected
- storage and review posture stay explicit and secure

**Verification**

- media visibility review
- storage and access review
- public-surface exposure review

## 11.5 `P2-TRUST-001` Lesson-linked review capture and publication flow

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-LESS-001`, `P1-TUTOR-002`

**Goal**

Implement the lesson-linked tutor review flow so public review and rating signals come from real lesson relationships and follow moderation, publication, and aggregate-trust rules.

**Required source docs**

- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/data/tutor-reliability-thresholds-v1.md`

**Scope**

- eligible review submission flow
- review moderation/publication state
- public rating aggregate refresh boundary
- role-safe public review and trust presentation inputs

**Out of scope**

- tutor-to-student public reviews
- fake or open-profile reviews
- exposing internal reliability or moderation details publicly

**Acceptance criteria**

- reviews are tied to real lesson relationships
- publication state is explicit and moderation-aware
- public rating is derived, not hardcoded in UI
- new tutors are not unfairly penalized by trust presentation

**Verification**

- eligibility and publication review
- public trust-surface review
- compliance and privacy review

## 11.6 `P2-REPORT-001` Lesson reports and post-lesson continuity surfaces

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-LESS-001`, `P15-STUD-002`

**Goal**

Implement post-lesson reporting and continuity surfaces so lessons build visible academic momentum rather than disappearing into history. The tutor authors a private continuity record per completed lesson, optionally shares it with the student, and the student can acknowledge it. Reports stay framed as continuity, not paperwork.

**Required source docs**

- `docs/research/ui-ux-research-two-sided-ecosystem.md` (§10.9 recommended report structure; §11 shared component strategy)
- `docs/foundations/service-blueprint-two-sided.md` (§8 stages 8–11, continuity rules)
- `docs/data/database-schema-outline-v1.md` (§12.4 `lesson_reports`)
- `docs/data/database-enum-and-status-glossary-v1.md` (§11.3 `lesson_reports.report_status`)
- `docs/data/database-rls-boundaries-v1.md` (§9.5 `lesson_reports`)
- `docs/data/auth-and-authorization-matrix-v1.md` (§10.5 `lesson_reports`)
- `docs/data/data-ownership-boundary-map-v1.md` (§13 lessons ownership)
- `docs/data/data-retention-erasure-field-map-v1.md` (§22 `lesson_reports`)
- `docs/architecture/privacy-and-data-retention-architecture-v1.md` (§11.2 lesson reports, §19.1 logging)
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md` (§11.6 tutor activation events)

**Scope**

Data layer:

- Create `lesson_reports` table per schema outline §12.4 with columns: `id`, `lesson_id` (unique), `report_status`, `goal_summary`, `coverage_summary`, `student_confidence_signal`, `next_steps_summary`, `student_visible_at`, `acknowledged_at`, `submitted_at`, `shared_at`, `created_at`, `updated_at`.
- Declare `reportStatuses` enum: `due`, `drafted`, `submitted`, `shared`, `acknowledged` (matches glossary §11.3).
- Migration ordered after `20260514140000_lesson_review_trust_baseline.sql`.
- Drizzle table declaration in `src/modules/lessons/schema.ts` (lesson domain owns reports per ownership map row 266).
- RLS policy: tutor full owner read/write; student read only when `student_visible_at IS NOT NULL`; admin allowed via internal client.
- `due` is implicit: no row pre-creation. The first tutor write creates a row in `drafted`. A completed lesson with no row is treated as "report due, not yet drafted" in derived DTO state.

Domain + DTO layer:

- `src/modules/lessons/lesson-reports.ts` (or equivalent module file) owning:
  - `getLessonReportForTutor(account, lessonId)` — tutor full view.
  - `getLessonReportForStudent(account, lessonId)` — shaped DTO that returns `null` unless `student_visible_at IS NOT NULL`.
  - Server actions: `saveLessonReportDraft`, `submitLessonReport`, `shareLessonReport`, `acknowledgeLessonReport`.
- Extend `StudentLessonDetailDto` and `TutorLessonDetailDto` with a `report` field carrying the report DTO + eligibility flags (`isEligibleToDraft`, `isEligibleToShare`, `isEligibleToAcknowledge`, `isLocked`).
- Eligibility rules:
  - Tutor drafting/submitting/sharing opens once `lesson_status = 'completed'` and `completed_at IS NOT NULL`.
  - Tutor edits allowed in `drafted` and `submitted`. Content locks in `shared` and `acknowledged` (no in-task amendment flow).
  - Student acknowledge available in `shared` only; flips status to `acknowledged` (idempotent, no-op if already acknowledged).

Route surfaces (no new routes):

- `/tutor/lessons/[id]`: "Lesson recap" Panel that supports drafting/submitting/sharing depending on state. Reuses `Panel`, `Section`, `StatusBadge` primitives and the existing `lesson-actions-client.tsx` form pattern.
- `/lessons/[id]` (student): "Lesson recap from your tutor" Panel renders only when `student_visible_at IS NOT NULL`. Includes Acknowledge action when status = `shared`.
- `/tutor/students/[studentProfileId]`: "Recent recaps" Section listing the last N (recommend ≤5) shared recaps for that student, each linking into the originating tutor lesson detail. No new route segment.

Notifications + analytics:

- Add notification type `lesson_report_shared` (in-app only; recipient is the lesson student). Emit at `shareLessonReport` boundary. Reuse existing notifications lifecycle wiring.
- Emit analytics events `lesson_report_submitted` and `lesson_report_shared`. Event properties must not include free-text body (per privacy doc §19.1) — only lesson id reference, role, lesson state, subject category.

Tests:

- Vitest unit tests for state-machine eligibility transitions (`due` → `drafted` → `submitted` → `shared` → `acknowledged`; illegal transitions rejected).
- DB test under `supabase/tests/` covering RLS: tutor read/write, student blocked until `student_visible_at` set, student read after share.
- Server-action authorization tests in `src/test/**` covering: non-tutor cannot write; non-student cannot acknowledge; admin read passes via internal client.

**Out of scope**

- AI-authored educational summaries.
- Institutional or PDF report export systems.
- Public exposure of any lesson-report field.
- Standalone `/lessons/[id]/report` or `/tutor/lessons/[id]/report` routes (the recap lives inside lesson detail).
- `lesson_report_due` reminder jobs or scheduled-email nudges.
- Editing or amendment flow after `shared` (locked this wave).
- Cross-lesson aggregate recap views (e.g. a student "all my recaps" hub).
- Email or push delivery of `lesson_report_shared` (in-app notification only this wave).
- Logging or analytics capture of free-text report content.
- Changes to `lesson_issue_cases` or any other adjacent lesson surface.

**Acceptance criteria**

- A tutor on a `completed` lesson can draft, submit, share, and edit (until shared) a lesson recap from the lesson detail page.
- A student sees the recap on `/lessons/[id]` only after the tutor shares it; never before.
- Acknowledge flips status to `acknowledged` exactly once; clicking twice is a no-op.
- A student on a `completed` lesson with no shared recap sees no recap panel and no leakage of the existence of an unfinished draft.
- Public surfaces, sitemap, robots, marketing routes, and notifications never carry report free-text content.
- RLS denies a non-participant any read or write of `lesson_reports`, including when the recap is shared (only the lesson student gets read).
- `lesson_report_submitted` and `lesson_report_shared` analytics events fire with no free-text body in properties.
- Tutor `/tutor/students/[studentProfileId]` shows at most 5 most recent shared recaps for that student with deep links into the originating lesson detail.
- Existing `LessonSummary`, `PersonSummary`, `Panel`, `Section`, and `StatusBadge` primitives are reused. No new route-local card or panel CSS is introduced for the recap surface beyond what the existing `lesson-detail.module.css` patterns allow.
- The full state machine and visibility rules are covered by automated tests.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- `pnpm lint:arch`.
- `pnpm test` covering: state-machine transitions, server-action authorization, RLS DB tests.
- Manual DTO and visibility review across the two lesson-detail routes and the tutor-students detail route.
- Privacy review: confirm no recap free-text reaches logs, analytics events, notifications, or non-participant surfaces.
- Retention check: confirm migration aligns with `data-retention-erasure-field-map-v1.md` §22 (no auto-public exposure; redaction path remains feasible).

**Implementation notes**

- The lesson `report` field on existing detail DTOs is the integration point: do not add a parallel report fetcher to page files.
- Continuity wording: "Lesson recap" on UI surfaces, not "report." The schema name stays `lesson_reports` for canonical alignment.
- The `due` value is exposed only as a derived view-model flag for the tutor surface; it should not be persisted as a row state.
- Use existing notification lifecycle helpers in `src/modules/notifications/lifecycle.ts`; do not introduce a parallel dispatch path.

## 11.6a `P2-DS-MENU-001` Popover, Menu, OverflowMenuTrigger primitives + Chip pressed state

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-DS-FOUND-001-C`, `P1-DS-FOUND-001-E`

**Goal**

Add the missing design-system primitives needed by wave-3 communication and admin surfaces: an anchored `Popover`, a composable `Menu` built on top of it, an `OverflowMenuTrigger` icon button, and a `pressed`/`selected` state on the existing `Chip` primitive. This is a DS foundation task, not a feature task; it ships primitives only, with no route-level consumers.

**Required source docs**

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/component-inventory-v1.md`
- `docs/design-system/tokens-cheatsheet-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`

**Scope**

Primitives:

- `src/components/ui/popover.tsx` + `popover.module.css`: anchored floating surface with controlled (`open`, `onOpenChange`) and uncontrolled APIs. Required behavior: render through a portal to `document.body`, anchor against a `triggerRef`, close on `Escape`, close on outside click, trap focus inside while open, restore focus to the trigger on close, expose `aria-haspopup` / `aria-expanded` wiring helpers for the trigger, support placements `bottom-start`, `bottom-end`, `top-start`, `top-end` with viewport-collision flip. No animation framework — use existing motion tokens for a short transform+opacity transition.
- `src/components/ui/menu.tsx` + `menu.module.css`: composed on top of `Popover`. Exports `Menu`, `MenuItem`, `MenuSeparator`. Items accept `icon?: IconKey`, `tone?: "default" | "destructive"`, `disabled?: boolean`, `onSelect: () => void`. Required behavior: arrow-key navigation between items, `Home`/`End` jumps, type-ahead focus by first letter, `Enter`/`Space` activates and closes the menu, `Escape` closes without activation, ARIA role `menu` with `menuitem` children, items render through `Icon` from `src/components/ui/icon.tsx` for the optional leading glyph (no inline SVGs).
- `src/components/ui/overflow-menu-trigger.tsx`: icon button that wraps a `Button` (size `compact`, variant `ghost` or equivalent — confirm from `button.tsx`) with the lucide `more-horizontal` (or `more-vertical`, configurable via prop) icon. Composes with `Menu` via the controlled API. Exposes `aria-label` as a required prop so consumers must label the trigger contextually ("Conversation options", "Lesson options", etc.).
- Chip pressed state: extend `src/components/ui/chip.tsx` with a `pressed?: boolean` prop and matching CSS module rule. Pressed state must be visually distinct from each existing tone without redefining tones, and must set `aria-pressed` on the rendered element when the chip is interactive (i.e. when `onClick` is provided). Non-interactive chips ignore the prop.

Type exports:

- Export `PopoverProps`, `MenuProps`, `MenuItemProps`, `OverflowMenuTriggerProps` from `src/components/ui/index.ts`, alongside existing `ChipProps` etc.
- Update the existing `Chip` type export so `pressed` is part of `ChipProps`.

Docs:

- Update `docs/design-system/component-inventory-v1.md` with rows for `Popover`, `Menu`, `OverflowMenuTrigger`, and the pressed-state addition to `Chip`. Each row follows the existing format (component name, file, variants, consumers, notes); consumers column may say "introduced in `P2-DS-MENU-001`, no consumers yet" — that is the expected initial state.
- Update `docs/design-system/tokens-cheatsheet-v1.md` only if new tokens are introduced (z-index for portal layer, elevation/shadow for popover surface). Prefer reusing existing tokens; if a new token is needed, define it in the same commit per the DS-first rule.

Out-of-scope reuse note:

- This task ships the primitives. Wave-3 features (`P2-MSG-001`, future `P2-OPS-001` action menus) consume them. No consumer wiring lands here.

**Out of scope**

- Any route-level adoption of `Popover` / `Menu` / `OverflowMenuTrigger`. Adoption ships with the consuming feature task.
- A combobox, listbox, or autocomplete primitive — those are separate primitives even though they share floating-layer concerns. Defer until a feature task needs them.
- A modal `Dialog` primitive (focus trap + portal patterns overlap, but the API and visual contract are different). Defer until a feature task needs one.
- Tooltip primitive (also floating-layer; defer until a feature task needs one).
- Replacing existing inline menu-like UI in current routes. This task does not migrate any existing surface.
- New tone additions to `Chip` beyond the pressed state.

**Acceptance criteria**

- `Popover`, `Menu`, `OverflowMenuTrigger` are exported from `src/components/ui/index.ts` and render correctly in isolation (verified by unit test, since no route consumes them yet).
- Keyboard model passes: opening with `Enter`/`Space` on the trigger; closing with `Escape` returns focus to the trigger; outside click closes; arrow keys cycle items; `Home`/`End` jump to first/last; type-ahead focus works.
- ARIA attributes are correct: trigger has `aria-haspopup="menu"` and `aria-expanded` reflecting open state; menu surface has `role="menu"`; items have `role="menuitem"`; destructive items still expose their action via the same role (tone is visual only).
- Portal rendering avoids stacking issues with existing route chrome (`AppFrame`); a z-index/elevation token is documented in `tokens-cheatsheet-v1.md` if introduced.
- `Chip` with `pressed` renders a visually distinct state and emits `aria-pressed` when interactive; non-interactive chips do not emit `aria-pressed`.
- `docs/design-system/component-inventory-v1.md` carries new rows for all three new primitives and an updated row for `Chip`; if any token landed, `docs/design-system/tokens-cheatsheet-v1.md` is updated in the same commit.
- No route files under `src/app/**` are modified by this task.
- `pnpm lint:arch` passes with no new violations.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- `pnpm lint:arch`.
- `pnpm test` covering: `Popover` open/close + focus restore; `Menu` keyboard navigation, type-ahead, and item selection; `OverflowMenuTrigger` ARIA wiring; `Chip` pressed state visual class application and `aria-pressed` rendering.
- Manual cross-browser smoke (Chrome + Safari) of a story-shaped harness page if one exists; if none exists, gate this on a single unit-test mount that exercises the keyboard model. Do not add a Storybook dependency for this task.
- `pnpm test:e2e` is not required (this task does not touch public route rendering, robots, or sitemap).

**Implementation notes**

- Do not add a floating-positioning library (Floating UI, Popper, etc.) unless the manual collision-flip logic becomes unwieldy. If one is genuinely required, stop and escalate per the "stop and escalate" rule before installing — the frozen baseline does not include one.
- Mirror the API style of existing DS components (`Chip`, `Card`, `Section`): named exports, controlled `className` pass-through, props typed in the same file, CSS variables consumed from `src/styles/globals.css`.
- The `Menu` keyboard model should match the W3C APG menu pattern. Reference the existing accessibility architecture doc for any role-attribute conventions.
- For the icon glyph in `OverflowMenuTrigger`, register the lucide icon key in `src/components/ui/icon.tsx` if not already present, in the same commit. Never inline an SVG.

## 11.7 `P2-MSG-001` Rich messaging behaviors wave

**Status:** `ready`
**Priority:** `P2`
**Wave:** 3
**Depends on:** `P1-MSG-002`, `P2-DS-MENU-001`

**Goal**

Add the first richer messaging behaviors on top of the existing P1 message domain so conversations feel responsive and expressive without turning Mentor IB into a generic chat product. This wave delivers: message reactions (durable), typing indicator (ephemeral), online presence (ephemeral), lightweight conversation list filtering, and per-conversation mute/archive controls wired to the existing `conversation_participants` flags.

**Required source docs**

- `docs/architecture/message-architecture-v1.md` (§7.2, §9, §10, §11)
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md` (§8.5 new-message channel rule; §13.3 presence/typing rule; §15.2 phase 1.5 alignment)
- `docs/data/database-schema-outline-v1.md` (§13.6 reserved `message_reactions`)
- `docs/data/database-rls-boundaries-v1.md` (§9.6 messaging tables; §12.2 conversation channel rule; §12.4 policy-complexity rule)
- `docs/data/auth-and-authorization-matrix-v1.md` (§9.8 conversations/messages/blocks/reports)
- `docs/data/privacy-policy-data-inventory-handoff-v1.md` (no message bodies in logs/analytics; messaging stays `P4`)
- `docs/data/database-enum-and-status-glossary-v1.md` (for the new `message_reaction_keys` enum)
- `docs/data/migration-conventions-v1.md` (migration ordering and naming)
- `docs/design-system/agent-ui-rules.md` (no route-local chip/icon CSS; reactions UI must reuse DS primitives)
- `docs/design-system/component-inventory-v1.md` (extend if a new primitive lands)

**Scope**

Data layer:

- Create `message_reactions` table (lesson/message domain, owned alongside `messages` in `src/modules/messages/schema.ts`) with columns: `id` (uuid PK), `message_id` (FK `messages.id` on delete cascade), `reactor_app_user_id` (FK `app_users.id` on delete cascade), `reaction_key` (text enum), `created_at`, `updated_at`.
- Declare a `messageReactionKeys` enum in `src/modules/messages/constants.ts` with the fixed set `["thumbs_up", "heart", "laugh", "celebrate", "thinking", "clap"]`. The DB column stores the canonical string key, not raw unicode. Rendering maps key → glyph via a DS-owned helper.
- Uniqueness: one reaction per (`message_id`, `reactor_app_user_id`). Switching reaction is an UPDATE, not insert-of-second-row. Re-clicking the same key removes the row (toggle off).
- Indexes: `uniqueIndex("message_reactions_message_reactor_key").on(message_id, reactor_app_user_id)`, `index("message_reactions_message_idx").on(message_id)`.
- New migration file ordered after `20260514150000_lesson_reports_baseline.sql` (use the next available `YYYYMMDDHHMMSS` slot per `migration-conventions-v1.md`); name suggestion `*_message_reactions_baseline.sql`.
- RLS policy on `message_reactions` (Type B per §9.6 boundary): SELECT — actor is a participant of the conversation that owns `message_id`; INSERT/UPDATE/DELETE — actor is the `reactor_app_user_id` AND a participant of that conversation AND the message is not in `removed` state AND no active `user_blocks` row exists between the reactor and the message author. Apply `with check` mirroring `using`. Service-role bypass via the existing service-role client for shaped reads only.
- No new tables for typing or presence. Typing and presence are Supabase Realtime channel features only.

Domain + DTO layer:

- Add `src/modules/messages/reactions.ts` exporting:
  - `toggleMessageReaction(account, { messageId, reactionKey })` → result type aligned with `MessageSendResult` (`ok` / `not_found` / `forbidden` / `validation_failed` / `rate_limited` / `temporary_failure`), with the participant + block + status checks already used in `src/modules/messages/send.ts`.
  - `loadReactionsForMessages(messageIds, accountId)` returning `Map<messageId, ReactionSummary>` where `ReactionSummary = { counts: Record<MessageReactionKey, number>, myReactionKey: MessageReactionKey | null, total: number }`.
- Extend `ThreadMessageDto` in `src/modules/messages/conversations.ts` with `reactions: ReactionSummary` (defaulting to `{ counts: {}, myReactionKey: null, total: 0 }`). Reactions are loaded inside `getConversationThreadForActor` in the same Supabase round-trip batch already used for reply targets, to avoid N+1.
- Extend `ConversationListItemDto` with `filterFlags: { hasUnread: boolean; isMuted: boolean; isArchived: boolean }`. `hasUnread` derives from `unreadCount > 0`; `isMuted`/`isArchived` are already on the participant row.
- New server action `toggleReactionAction` in `src/modules/messages/actions.ts` following the same `useFormState` / FormData shape as `sendMessageAction`. Rate-limit reactions with the same window helper used for sends (a separate counter scoped to reactions, threshold suggestion: 30/min — confirm during implementation).
- New server actions `setConversationMutedAction` and `setConversationArchivedAction` writing the existing `conversation_participants.is_muted` / `is_archived` columns. Participant check enforced server-side, identical to read paths.

Realtime layer:

- Add `src/lib/supabase/realtime.ts` helper that returns a Supabase browser client and a typed `joinConversationChannel(conversationId)` function. Channel name: `conversation:<conversationId>` (private). The helper must not be imported from server modules.
- Configure Supabase Realtime authorization (RLS on `realtime.messages` per §12.2 / §12.4) so a connection may only `read` / `presence` / `broadcast` on a `conversation:<id>` topic when the authenticated user has a row in `conversation_participants` for that conversation. Authorization SQL ships in the same migration as the `message_reactions` table.
- Typing: `broadcast` event `typing` with payload `{ actorRole: ParticipantRole, ts: number }`. Auto-expire client-side after 4s with no follow-up. Never persisted.
- Presence: standard Supabase `presence` track per channel join; payload `{ actorRole, since: ISO timestamp }`. The DTO surface exposes a derived `counterpart.isOnline: boolean` on `ConversationListItemDto` and `MessageThreadDto` only when the channel is joined; server-rendered initial state is `false`.
- New message arrival, reaction add/remove, and conversation-state changes (mute/archive flips) emit `broadcast` events on the same private channel so live clients can refresh without polling. The canonical store remains Postgres; broadcast carries IDs only, never message bodies or reaction details that aren't already in the recipient's RLS scope.

Route surfaces (no new routes):

- `/messages` and `/tutor/messages`:
  - Conversation list gains a chip-row filter: `All`, `Unread`, `Muted`, `Archived` (single-select, defaults to `All`). Counterpart-name substring filter via an input that filters in-memory over the already-loaded `ConversationListItemDto[]`. No new query parameters in this wave; filter state is client-side only.
  - Each conversation row gets a kebab/overflow trigger for mute/unmute and archive/unarchive, reusing the DS overflow primitive.
  - When `isMuted`, the list row mutes its unread badge styling (no count emphasis); when `isArchived`, the row only renders under the `Archived` filter.
- Thread view (server-rendered shell, client island for live behavior):
  - Each message hover/long-press exposes a reaction trigger that opens a 6-glyph picker mapped from `messageReactionKeys`. Tapping a key toggles the user's reaction.
  - Below each message, render a compact reaction summary chip per non-zero key with its count; the user's selected key is visually emphasized. Tapping the chip toggles the same reaction.
  - Typing indicator renders at the bottom of the thread above the composer when the counterpart has emitted `typing` within the last 4s.
  - Counterpart header shows an "Online" presence dot only when the counterpart is currently tracked in the channel's presence state.

Notifications + analytics:

- No new notification types. Reactions and presence/typing must not generate `Notification` rows or emails. The existing `new_message` notification path stays unchanged.
- New analytics events (no free-text payload, per privacy doc §13/§19): `message_reaction_toggled` with properties `{ conversationId, messageId, reactionKey, action: "added" | "removed" | "switched" }`; `conversation_muted_toggled` with `{ conversationId, action }`; `conversation_archived_toggled` with `{ conversationId, action }`. No presence/typing analytics events (they would re-leak ephemeral activity).
- Observability: extend `logMessagesEvent` callsites in [src/modules/messages/observability.ts](src/modules/messages/observability.ts) for reaction add/remove and mute/archive flips. Log payload contains only IDs and counts; never message body or reaction glyph context.

Tests:

- Vitest unit tests in `src/test/modules/messages/`:
  - `reactions.toggle.test.ts` — toggle on/off, switch key, non-participant denied, blocked counterpart denied, removed message denied, validation for unknown `reaction_key`.
  - `conversations.reactions-shape.test.ts` — `getConversationThreadForActor` returns the correct `ReactionSummary` for messages and survives mixed-author reaction sets.
  - `mute-archive.actions.test.ts` — participant required; idempotent toggle; analytics event payload shape.
- DB tests under `supabase/tests/`:
  - `message_reactions_rls.sql` — participant can insert/select/delete own reaction; non-participant denied across all four verbs; blocker/blocked pair denied on insert; removed-message reaction insert denied.
  - `realtime_conversation_channel.sql` — authorization SQL allows participants to subscribe to `conversation:<id>` private topic and denies non-participants. If `realtime.messages` policies are exercised, follow `database-test-conventions-v1.md` patterns for that surface.
- Playwright is not required for this task. If a smoke is added later, gate it on a seeded conversation with two participants.

**Out of scope**

- File attachments and image upload in messages.
- Message edit/delete UX from the composer (status field exists; UX not in this wave).
- Server-side message-body search (Postgres FTS). The filter row is metadata + counterpart name only.
- Native mobile push notifications, browser push, or any new outbound channel.
- Notification preferences UI (owned by `P2-NOTIF-PREF-001`).
- Community or multi-party chat / group conversations.
- Tutor cold-outreach changes (architecture rule §4.1 stays untouched).
- Reaction packs, custom emoji upload, or animated reactions.
- Persisted typing/presence (durable rows or last-seen timestamps).
- Per-message read receipts beyond the existing `message_reads` model.
- Internal moderation surfaces for reactions (covered by `P2-OPS-001` if needed).
- Cross-conversation search hub or unified inbox views.

**Acceptance criteria**

- A participant on an active conversation can react to any non-removed message with one of the six fixed keys; re-clicking the same key removes the reaction; clicking a different key switches it; only one reaction per message per user persists.
- A non-participant cannot read, insert, update, or delete a `message_reactions` row for a conversation they do not belong to, verified by RLS DB test.
- A blocked relationship denies reaction insert in both directions, mirroring the message-send block rule.
- The thread DTO returns reactions in the same payload as messages with no N+1 query against `message_reactions`.
- The conversation list filter chips (`All`, `Unread`, `Muted`, `Archived`) and counterpart-name input narrow the visible list without changing what the server returns.
- Toggling mute on a conversation suppresses unread badge emphasis on the list row and does not change `unreadCount` math; toggling archive moves the row under the `Archived` filter.
- Joining a thread subscribes to the `conversation:<id>` private Realtime channel; non-participants cannot subscribe (Realtime authorization SQL covers this).
- The counterpart's online dot reflects Realtime Presence state and is `false` on first server render.
- A typing event from the counterpart shows the typing indicator within ~1s and clears within ~4s of the last event.
- Reaction add/remove triggers a broadcast event on the conversation channel; live thread state refreshes from canonical data (not from broadcast payload) when a reaction changes.
- No new `Notification` row, no email, and no analytics event carries message body, reaction glyph context outside the canonical key, or counterpart name as free text.
- `logMessagesEvent` callsites for reactions and mute/archive contain only IDs and counts; verified by code review and a unit test that asserts the logged shape.
- The full reaction toggle state machine and visibility rules are covered by automated tests.
- No route-local SVGs, chips, or CSS land in messaging route files; reaction glyphs, filter chips, and overflow menus all resolve to existing DS primitives (icon → `src/components/ui/icon.tsx`, filter chip → DS chip primitive; if a new primitive is required, `docs/design-system/component-inventory-v1.md` is updated in the same commit).

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- `pnpm lint:arch`.
- `pnpm test` covering: reaction toggle state machine, thread DTO shape with reactions, mute/archive action authorization, analytics payload shape.
- DB tests: `message_reactions` RLS suite; Realtime channel authorization suite.
- `pnpm test:e2e` is not required unless the human asks for a smoke flow; this task does not touch public route rendering, robots, or sitemap.
- Realtime/privacy review: confirm typing and presence are Realtime-only and produce no durable rows, no `Notification` rows, and no logged or analytics payload.
- RLS and access review: walk through participant / non-participant / blocked-pair cases for `message_reactions` and the `conversation:<id>` private topic.
- Phased-scope review against the message architecture: confirm the wave matches §7.2 (phase 1.5 features) plus the existing schema reservations in §9.4, without introducing attachments, push, or moderation surfaces deferred to `P2-OPS-001`.

**Implementation notes**

- The existing `MessageThreadDto` already batches reply-target lookups; piggy-back reactions onto the same batch step in `getConversationThreadForActor` rather than adding a new fetch function on the page.
- The `messageReactionKeys` enum is the canonical contract: routes never inline the literal strings or glyph mapping. Glyph mapping lives next to the DS icon helper.
- Use the existing `sendConversationMessage` participant + block + active-status checks as the model for `toggleMessageReaction`. Do not duplicate the block-lookup logic; extract a small shared helper in `src/modules/messages/send.ts` (or a new `src/modules/messages/access.ts`) and reuse from both call sites.
- Reaction rate-limit counter uses the same `RATE_LIMIT_WINDOW_MS` shape as `send.ts` for consistency; separate counters per surface.
- Realtime client wiring lives in a single client island under `src/components/messages/`; do not subscribe from multiple components on the same screen (§12.4 policy-complexity rule).
- Broadcast payloads are IDs only. The thread refresh path re-reads from the canonical DTO when a broadcast arrives, matching message-architecture §10.1.
- The conversation list filter is intentionally client-side: it operates over the already-loaded participant-scoped list so it cannot leak rows the server would have hidden.
- Mute/archive UI consumes the `OverflowMenuTrigger` + `Menu` primitives delivered by `P2-DS-MENU-001`. Filter chips consume `Chip` with the `pressed` state delivered by the same task. The reaction picker on each message consumes `Popover` (the picker is a button row inside a popover, not a `Menu`, because reactions are not menu items in the ARIA sense — they are toggle buttons; `role="group"` with `aria-label="React with"` is the recommended ARIA wrapper).

## 11.8 `P2-OPS-001` Admin trust and report-management internal surfaces

**Status:** `draft`
**Priority:** `P2`
**Wave:** 3
**Depends on:** `P1-MSG-002`, `P2-APPLY-002`

**Goal**

Implement the first internal admin trust surfaces so abuse reports, blocks, and trust workflows are handled inside clear privileged boundaries rather than ad hoc manual processes.

**Required source docs**

- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/sql-function-and-trigger-boundaries-v1.md`
- `docs/data/lesson-issue-and-dispute-model-v1.md`

**Scope**

- `/internal/moderation`
- report queue and case handling
- block/report review context
- lesson-issue case review for conflicting claims (disputes in `under_review` state require admin resolution)
- trust-case lifecycle visibility
- explicit internal action boundaries
- refund and payout consequence execution from resolved disputes

**Out of scope**

- one giant internal everything-app
- generalized customer-support tooling
- automated trust judgments without explicit review policy

**Acceptance criteria**

- internal trust surfaces stay inside privileged route and DTO boundaries
- actions are auditable and stateful
- sensitive fields are more restricted than ordinary support data
- block and report workflows remain consistent with the message and trust architectures
- lesson-issue review outcomes can trigger the approved refund, payout, and notification paths

**Verification**

- privilege and DTO review
- trust state-transition review

## 11.9 `P2-OPS-002` Admin user detail and finance intervention surfaces

**Status:** `draft`
**Priority:** `P2`
**Wave:** 3
**Depends on:** `P1-DATA-001`, `P1-TUTOR-005`, `P2-OPS-001`

**Goal**

Implement the internal admin user-detail and finance-intervention surfaces so account restrictions, payout holds, and case-driven user support can be handled through explicit internal tools.

**Required source docs**

- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`

**Scope**

- `/internal/users/[id]`
- account state and role-safe internal user detail
- payout hold or finance-anomaly intervention record
- shaped internal action history

**Out of scope**

- raw database browsing
- bulk support queue tooling

**Acceptance criteria**

- admins can inspect and act on user-state issues through scoped DTOs
- payout or finance interventions remain auditable and explicit
- internal pages follow the approved 404 rule for unauthorized access

**Verification**

- DTO and privilege review
- finance-intervention state review

## 11.10 `P2-OPS-003` Admin reference-data and policy broadcast management

**Status:** `draft`
**Priority:** `P2`
**Wave:** 3
**Depends on:** `P1-DATA-005`, `P2-APPLY-002`

**Goal**

Implement the internal admin surface for managing canonical reference data and publishing policy broadcasts so shared vocabularies and legal updates are not maintained through ad hoc code edits.

**Required source docs**

- `docs/data/reference-data-governance-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

**Scope**

- `/internal/reference-data`
- admin CRUD for subjects, subject focus areas, languages, countries, meeting providers, and video media providers
- policy broadcast publish action for terms or privacy updates
- audit trail expectations for internal changes

**Out of scope**

- localization management
- broad CMS ambitions

**Acceptance criteria**

- shared product vocabularies can be managed inside the internal admin surface
- reference changes remain canonical and auditable
- publishing a policy update can trigger the approved email, in-app, and post-login notice flow

**Verification**

- reference-data workflow review
- legal-broadcast workflow review

## 11.11 `P2-DISPUTE-001` Lesson-issue internal review and dispute resolution surface

**Status:** `draft`
**Priority:** `P2`
**Wave:** 3
**Depends on:** `P1-LESS-002`, `P2-OPS-001`

**Goal**

Implement the internal admin surface for reviewing and resolving lesson-issue disputes that reach `under_review` state, so conflicting participant claims are resolved through explicit, auditable decisions rather than ad hoc manual processes.

**Required source docs**

- `docs/data/lesson-issue-and-dispute-model-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/tutor-reliability-thresholds-v1.md`
- `docs/planning/phase1-payment-scope-decision-v1.md`

**Scope**

- `/internal/disputes`
- dispute queue filtered by `under_review` state
- side-by-side view of both participant claims and evidence
- resolution actions: uphold student claim, uphold tutor claim, split, dismiss
- consequence execution: refund trigger, payout adjustment, reliability penalty application
- resolution audit trail

**Out of scope**

- auto-resolved disputes (handled by the lesson-issue model automatically)
- public-facing dispute UI beyond what the lesson-issue flow already provides
- legal arbitration tooling

**Acceptance criteria**

- disputes in `under_review` state appear in a prioritized internal queue
- admins can review both sides before making a resolution decision
- resolution triggers the correct refund, payout, and reliability consequences per the lesson-issue model
- all resolution actions are auditable and stateful
- resolved disputes notify both participants of the outcome

**Verification**

- consequence-correctness review against the lesson-issue model
- privilege and DTO review
- notification delivery review

## 11.12 `P2-DSR-001` Data subject request implementation

**Status:** `draft`
**Priority:** `P2`
**Wave:** 3
**Depends on:** `P1-DATA-001`, `P2-OPS-002`

**Goal**

Implement the data subject request workflow so access, erasure, and portability requests are handled through explicit internal tooling with correct field-level retention and erasure behavior.

**Required source docs**

- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`

**Scope**

- `/internal/dsr`
- DSR intake and tracking queue
- access request: generate portable data export per the field inventory
- erasure request: execute field-level erasure per the retention-erasure field map
- request lifecycle: received → in_progress → completed or rejected
- audit trail for all DSR actions
- statutory deadline tracking

**Out of scope**

- self-service account deletion in Phase 2 (may be Phase 3)
- automated bulk anonymization
- cross-border legal routing

**Acceptance criteria**

- DSR requests are tracked with explicit status and statutory deadlines
- access exports include all fields marked as subject-accessible in the privacy inventory
- erasure correctly nullifies or pseudonymizes fields per the retention-erasure map without breaking referential integrity
- financial and legal-hold records are preserved per retention policy
- all DSR actions are auditable

**Verification**

- field-level erasure review against the retention-erasure map
- data export completeness review against privacy inventory
- referential integrity review after erasure

## 11.13 `P2-NOTIF-PREF-001` Notification preferences and channel controls

**Status:** `ready`
**Priority:** `P2`
**Wave:** 2
**Depends on:** `P1-NOTIF-001`, `P1-NOTIF-002`, `P1-ACCOUNT-001`

**Goal**

Implement user-facing notification preferences so students and tutors can opt out of non-critical notification categories per channel from a single shared `/settings` surface, while critical operational notifications keep dispatching by policy. The architecture rule from `background-jobs-and-notifications-architecture-v1.md` §8.7 ("required transactional notifications send by policy; optional engagement notifications can arrive later as a separate preference layer") is the framing — this task ships that "separate preference layer" without expanding into a complex preference center.

**Required source docs**

- `docs/architecture/background-jobs-and-notifications-architecture-v1.md` (§8.5 channel rule, §8.7 preference posture, §8.9 legal-update visibility)
- `docs/architecture/message-architecture-v1.md` (§13.1 message-notification scope; new-message stays in-app only and is owned by the messaging surface — preferences UI must not expose chat toggles)
- `docs/data/database-schema-outline-v1.md` (§15 notification family — preference table is a sibling of `notifications` / `notification_deliveries`)
- `docs/data/database-rls-boundaries-v1.md` (notification family RLS pattern; owner-read/owner-write applies to preferences)
- `docs/data/auth-and-authorization-matrix-v1.md` (§10.8 notification-table read/write posture)
- `docs/data/api-and-server-action-contracts-v1.md` (server-action mutation pattern for owner-scoped settings writes)
- `docs/architecture/privacy-and-data-retention-architecture-v1.md` (logging boundaries — preference toggles must not log identifying content)
- `docs/design-system/agent-ui-rules.md` (DS-first: reuse `Panel`, `Section`, `Switch`/`Toggle` patterns; no route-local card or chip CSS)
- `docs/architecture/canonical-value-ownership-map-v1.md` (category catalog lives in the notifications module, not in `src/modules/reference/**`, because it is a notification-domain vocabulary, not a cross-surface reference vocabulary)

**Scope**

Data layer:

- New table `notification_preferences` (migration ordered after `20260515120000_message_reactions_baseline.sql`) with columns:
  - `id uuid primary key default gen_random_uuid()`
  - `app_user_id uuid not null references app_users(id) on delete cascade`
  - `notification_category text not null` — references the optional-category enum declared below (CHECK constraint, not a Postgres enum, mirroring the existing `notification_type` text-with-CHECK pattern in `notifications`)
  - `in_app_enabled boolean not null default true`
  - `email_enabled boolean not null default true`
  - `created_at`, `updated_at timestamptz not null default now()`
  - `unique (app_user_id, notification_category)`
- RLS policies (anon denied; authenticated owner read/insert/update; admin via internal service-role only):
  - `select using (auth.uid() = app_user_id)`
  - `insert with check (auth.uid() = app_user_id)`
  - `update using (auth.uid() = app_user_id) with check (auth.uid() = app_user_id)`
  - no `delete` policy — rows are upserted, never removed by the user; account deletion cascades.
- Drizzle table declaration in `src/modules/notifications/schema.ts` (notifications module owns it; do not add a parallel `preferences/` module).
- Default behavior is row-absence-equals-enabled — explicit rows are only written when the user changes a switch. A missing row resolves to "both channels on" for that category.

Constants and category catalog:

- Extend `src/modules/notifications/constants.ts` with:
  - `notificationCategories` — the user-facing groupings; each maps to a stable slug used as the row's `notification_category` value. Recommended set (final wording is task-locked):
    - `lesson_reminders` → covers `upcoming_lesson_reminder`
    - `reviews` → covers `review_submitted`
    - `tutor_application_updates` → covers `tutor_application_submitted`, `tutor_application_reviewed`
    - `lesson_recaps` → covers `lesson_report_shared` (in-app channel only; email toggle is hidden or disabled for this category since `lesson_report_shared` is in-app-only per `P2-REPORT-001`)
  - `MANDATORY_NOTIFICATION_TYPES` — the set that always dispatches regardless of preference state and is **not** user-toggleable. Must include: `lesson_request_submitted`, `lesson_accepted`, `lesson_declined`, `lesson_request_expired`, `lesson_updated`, `lesson_issue_acknowledgement`, `lesson_issue_resolution`, `payout_processed`, `policy_notice_updated`.
  - `NOTIFICATION_TYPE_TO_CATEGORY` — single source-of-truth map from each `NotificationType` to either a `notificationCategory` (optional) or `null` (mandatory). `new_message` maps to `null` for the purposes of this table because per-conversation mute is owned by `P2-MSG-001` and the preferences UI never exposes it.

Enforcement at dispatch boundaries:

- Add `resolveNotificationDispatchPolicy(appUserId, notificationType)` in `src/modules/notifications/preferences.ts` returning `{ inAppEnabled: boolean; emailEnabled: boolean; isMandatory: boolean }`. Reads the row (if any) via the service-role client; mandatory types short-circuit to `{ inAppEnabled: true, emailEnabled: true, isMandatory: true }`.
- Wire enforcement at exactly two existing boundaries — do not introduce a third:
  - `createNotification(...)` in `src/modules/notifications/service.ts`: when `inAppEnabled === false` for the resolved category, return `null` (no row written) and emit a structured `logEmailEvent`-style log entry (`notification_in_app_skipped`) carrying only `notification_type`, `notification_category`, `app_user_id` — never title, body, or object names.
  - `scheduleNotificationEmailDelivery(...)` in `src/modules/notifications/email-delivery.ts`: when `emailEnabled === false`, return `{ outcome: "skipped", reason: "channel_disabled_by_preference" }` before enqueuing the job. The existing `isEmailEligibleNotificationType` channel rule continues to apply first (e.g. `new_message` and `lesson_report_shared` stay in-app-only regardless of preference state).
- `upsertNewMessageNotification` is **not** modified — per-conversation mute lives on `conversation_notification_state` and is owned by `P2-MSG-001`.

Server action:

- `src/app/(account)/settings/notification-preference-actions.ts` exporting `updateNotificationPreference({ category, channel, enabled })`:
  - Zod-validates `category` against `notificationCategories` and `channel` against `{ "in_app" | "email" }`.
  - Rejects if `category` is not in the catalog or if the (category, channel) combination is one the UI cannot reach (e.g. `email` channel for `lesson_recaps`).
  - Uses the supabase client bound to the authenticated user (not the service-role client) so RLS enforces ownership end-to-end.
  - Upserts on `(app_user_id, notification_category)` and updates only the targeted boolean column.
  - `revalidatePath("/settings")` on success.
- No new route handler under `/api/*`; this is a server action consumed by the settings form.

Route surface (no new routes):

- Extend `/settings` (`src/app/(account)/settings/page.tsx`) with a second `Panel title="Notification preferences"` rendered below the existing Profile panel. Layout is one `Section` per category showing the category label, a short description, and two channel switches (`In-app`, `Email`). Categories whose email channel is unsupported render the email switch as visually disabled with a one-line helper ("This category is delivered in-app only.").
- A separate top-level `Section` titled "Always sent" lists the mandatory categories as static text (e.g. "Booking confirmations · Payment receipts · Lesson cancellations · Dispute outcomes · Legal updates") so users see *why* certain notifications never appear in the toggle grid. Wording stays generic — no per-type toggle.
- New client component `src/app/(account)/settings/notification-preferences-form.tsx` rendering the switches. Uses the existing form-state pattern from `settings-form.tsx`. Switches are optimistic-disabled while the action is pending; on error, the switch reverts and an inline error message renders using the existing form-error pattern.
- Reuse `Panel`, `Section`, `Switch` (or `Toggle`, depending on what already exists in `src/components/ui/`). If a `Switch` primitive does not yet exist, extend the design system in the same task per the DS-first rule and update `docs/design-system/component-inventory-v1.md`. Do not introduce a route-local toggle component.

DTO + read path:

- `getNotificationPreferenceSnapshot(appUserId)` in `src/modules/notifications/preferences.ts` returns `{ [category]: { in_app_enabled, email_enabled } }` defaulted to `{ in_app_enabled: true, email_enabled: true }` for missing rows. Used by the settings page server component to hydrate the form.
- The shape is a flat record keyed by `notificationCategory`. Do not expose the underlying row IDs to the client.

Privacy and logging:

- No notification title, body, object id, counterpart name, or `notification_type` shows up in analytics or email-event logs for the new skip-reason. The dispatch-skip log line carries only `app_user_id`, `notification_type`, `notification_category`, and the reason string.
- Preference rows are user-owned data — include them in account deletion via the existing `ON DELETE CASCADE` on `app_users.id` (covered by the FK declaration).

Tests:

- Vitest unit tests in `src/test/modules/notifications/`:
  - `preferences.resolve.test.ts` — `resolveNotificationDispatchPolicy` returns `isMandatory: true` for every entry in `MANDATORY_NOTIFICATION_TYPES`; defaults to enabled when no row exists; respects stored false; unknown notification type maps to `isMandatory: true` (safe default).
  - `preferences.dispatch.test.ts` — with a stubbed preference of `in_app_enabled = false` for `reviews`, `createNotification` for `review_submitted` returns `null` and emits the skip log; mandatory `lesson_accepted` still creates a row in the same scenario.
  - `preferences.email.test.ts` — with `email_enabled = false` for `lesson_reminders`, `scheduleNotificationEmailDelivery` returns `{ outcome: "skipped", reason: "channel_disabled_by_preference" }` for `upcoming_lesson_reminder` and is unaffected for `lesson_accepted`.
  - `preferences.action.test.ts` — `updateNotificationPreference` rejects unknown category, rejects the email channel for in-app-only categories, and upserts correctly on first call vs. update.
- DB test under `supabase/tests/database/smoke/notification_preferences_baseline.test.sql`:
  - Schema shape, FK, unique constraint, defaults, and the four RLS verbs: owner select/insert/update allowed; non-owner select/insert/update denied; anonymous denied across all verbs.
- Playwright is not required for this task. The settings page is already covered by the logged-in smoke; if a new e2e is added later, gate it on a seeded `app_user` and assert one toggle round-trip.

**Out of scope**

- push notifications (browser or native mobile) — explicitly deferred by `message-architecture-v1.md` §13.2.
- per-conversation mute and archive controls — owned by `P2-MSG-001`; the new settings panel must not expose chat toggles.
- digest mode, quiet hours, scheduling windows, or per-day delivery rules — explicitly deferred by §8.7 and §13.2.
- toggling **any** mandatory category (booking lifecycle, payment, payout, legal, dispute outcomes) — these stay non-dismissable by design.
- preference management for admin/internal users beyond the standard owner-scoped flow (admins use the same settings panel as their `app_user`).
- a separate `/settings/notifications` route — the panel lives inside `/settings` per the route topology.
- changes to `notification_types` or `notification_deliveries`.
- editing notification body templates or email copy.
- analytics on preference changes (event taxonomy work happens in `P2-OPS-003` if needed).

**Acceptance criteria**

- A logged-in student or tutor sees a "Notification preferences" panel under `/settings` with one row per optional category and two channel switches per row.
- Toggling a switch persists immediately through the server action, survives a hard reload, and is scoped to the acting `app_user` (verified by RLS DB test).
- A `lesson_accepted` notification continues to create both an in-app row and an email job even when *all* optional preferences are off — verified by `preferences.dispatch.test.ts` and `preferences.email.test.ts`.
- A `review_submitted` notification with `in_app_enabled = false` for the `reviews` category does **not** create a `notifications` row; the existing realtime/bell surface receives nothing for that event.
- A `upcoming_lesson_reminder` with `email_enabled = false` for `lesson_reminders` does **not** enqueue an email job; the in-app row still appears if the in-app switch stays on.
- The "Always sent" section visibly enumerates the mandatory categories so users understand which notifications they cannot disable.
- The `lesson_recaps` row renders with the email switch visually disabled and a helper line explaining that the category is in-app-only this wave.
- `new_message` notifications are unaffected by this task; the panel does not expose any chat-related toggle.
- A non-owner cannot read or write another user's preferences (RLS DB test covers all four verbs).
- No notification title, body, object id, counterpart name, or chat content leaks into the new skip-reason logs.
- No route-local `.card`, `.chip`, `.panel`, or toggle CSS is introduced; primitives come from `src/components/ui/**`.

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- `pnpm lint:arch`.
- `pnpm test` covering the four Vitest specs above plus the existing notification suite (no regressions on lifecycle dispatch).
- Local DB test: `pnpm supabase db reset` then run the new `notification_preferences_baseline.test.sql` smoke alongside the existing notification family smoke.
- Manual settings-page review on both a student and a tutor account: toggle each switch, hard-reload, confirm persistence, confirm the "Always sent" section copy.
- Dispatch review: trigger an in-scope optional notification (e.g. submit a review while logged in as the tutor) with the relevant switch off and confirm no in-app row appears; flip the switch back on and confirm the next event reaches the bell.

**Implementation notes**

- Default-on, row-absent semantics let us ship the feature without backfill migrations. Do not pre-populate rows for existing users.
- The category catalog is the **only** place where notification-type → category mapping lives. Lifecycle helpers in `src/modules/notifications/lifecycle.ts` must not duplicate the mapping; they call into the central dispatch helpers which already own enforcement.
- Mandatory enforcement is a code-level rule (`MANDATORY_NOTIFICATION_TYPES`), not a row flag. A future task that needs to make a mandatory type optional must change the constant and add a category — never store a "mandatory" boolean per user.
- Reuse `src/modules/notifications/email-delivery.ts` skip-reason taxonomy by adding `channel_disabled_by_preference` next to the existing `channel_in_app_only`. Do not introduce a parallel skip surface.
- If a `Switch`/`Toggle` primitive does not exist in `src/components/ui/`, extending the DS is in scope for this task per the DS-first rule; update `component-inventory-v1.md` in the same commit. If one already exists, reuse it as-is.

## 11.14 `P2-GROW-001` Public tutor search page powered by Algolia

**Status:** `ready`
**Priority:** `P2`
**Wave:** 4
**Depends on:** `P2-PROFILE-001` (tutor profile editor and publication controls — provides the canonical `listed` / `public_visible` / `approved` state used to populate the Algolia index)

**Architectural note — supersedes prior platform direction**

The earlier recommendation in `docs/architecture/search-platform-decision-v1.md` to use a Postgres-first browse search is explicitly overridden for this task. Algolia is the live backend for the public tutor search page from day one. Matching (`/match`, `/results`) remains internal, Postgres-backed, and application-owned — Algolia is **only** used for the public tutor search/browse surface. Update `search-platform-decision-v1.md` in the same change to reflect this product decision.

**Goal**

Introduce a public-facing tutor search page at `/tutors` where any visitor (logged-out, student, or tutor) can search and filter tutors using a typo-tolerant Algolia-backed index. Add navigation to this page across all student-facing surfaces and the public header. Index public tutor data into Algolia from the tutor profile lifecycle so listing/unlisting/suspension stay in sync.

**Required source docs**

- `docs/architecture/search-platform-decision-v1.md` (will be amended by this task)
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/security-architecture-v1.md` (Algolia search-only key posture, secured API keys)
- `docs/architecture/configuration-and-governance-architecture-v1.md` (env handling, vendor config)
- `docs/data/reference-data-governance-v1.md` (subject / language / level filter vocabularies)
- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/component-specs-core-v1.md` (`MatchRow` variants, including the `browse` variant)
- `docs/design-system/component-inventory-v1.md`
- `docs/design-system/tokens-cheatsheet-v1.md`

**Scope**

Routing and topology

- new route `/tutors` (index) in the `(public)` route group, sibling to existing `/tutors/[slug]`
- public route family, SEO route class A (indexable base page, query-string variants `noindex` via metadata — follow the SEO posture used by existing public pages)
- add to `src/lib/routing/navigation.ts`:
  - `public` family: add `{ href: "/tutors", label: "Find Tutors" }` near the top (after Home)
  - `student` family: add `{ href: "/tutors", label: "Browse" }` so the link appears on every student page through `AppFrame`
- no changes to `tutor`, `account`, `setup`, `auth`, or `internal` nav entries
- update `src/app/sitemap.ts` to include `/tutors`

Search module (new `src/modules/search/`)

- `algolia-server.ts`: server-only admin client factory using `ALGOLIA_ADMIN_API_KEY`. Never imported into client bundles.
- `algolia-search-client.ts`: browser-safe client using `NEXT_PUBLIC_ALGOLIA_APP_ID` + `NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY`.
- `public-tutor-record.ts`: canonical `PublicTutorSearchRecord` DTO and `buildPublicTutorSearchRecord(profile, related, reviewSummary)` builder. Only public-safe fields (display name, public slug, headline, subjects, languages, level coverage, country flag code, hourly/trial price + currency, average rating, review count, lessons taught, examiner-badge flag, intro-video presence, next-availability hint if cheaply derivable, `updated_at`). No private application answers, no contact details, no internal trust signals, no moderation data.
- `public-tutor-indexer.ts`: idempotent `upsertPublicTutorRecord(tutorId)` and `removePublicTutorRecord(tutorId)`. The upsert reads from the same canonical sources used by `src/modules/tutors/public-profile.ts` and is only callable from server contexts.
- `index-settings.ts`: declarative Algolia index settings (searchable attributes, attributes for faceting, ranking, custom ranking on `reviewCount` / `averageRating`, typo tolerance). A `scripts/algolia-apply-settings.ts` script applies settings from this declaration so the configuration is checked into the repo, not configured in the dashboard.

Index synchronization

- hook tutor profile lifecycle so the index stays consistent:
  - on transition into `application_status = approved` AND `profile_visibility_status = public_visible` AND `public_listing_status = listed` → `upsertPublicTutorRecord`
  - on any transition that leaves that triple (admin hold, tutor pause/delist, suspension, profile edit losing eligibility) → `removePublicTutorRecord`
  - on profile content edits while still listed → `upsertPublicTutorRecord` to refresh the record
- wire these calls inside `src/modules/tutors/tutor-profile-editor-service.ts` and the admin approval pathway in `src/modules/tutors/application-review-service.ts` (do not introduce a separate webhook layer)
- failures from Algolia must not roll back the underlying profile transition; log and surface through the existing error reporting path used by other server actions

UI

- server-rendered `/tutors` page using `AppFrame` and the existing public layout
- search bar uses the DS `TextField` primitive
- filter rail uses the DS `Chip` primitive with the `pressed` state added in `P2-DS-MENU-001` for active filters; filter options for subject, language, and IB level pulled from `src/modules/reference/discovery.ts` (no route-local arrays)
- result list uses `MatchRow` with the `browse` variant. If the `browse` variant is not yet implemented in `src/components/continuity/match-row.tsx`, extend the component (and update `docs/design-system/component-inventory-v1.md` accordingly in the same commit) — do not create a route-local card.
- empty state uses the existing `ScreenState` continuity primitive
- pagination is handled by Algolia (page-based, not infinite scroll)
- the search experience is client-rendered after first paint (using `algoliasearch` directly from the public module — implement query/facet/pagination state with React state + URL search params; do **not** add `react-instantsearch` or any other heavier package unless explicitly approved); the page shell itself is a Server Component
- query string is the source of truth (`q`, `subject`, `language`, `level`, `page`) so deep links and SSR-first paint remain stable
- icons through `src/components/ui/icon.tsx`; flags through `src/components/ui/flag.tsx`; money formatting through `src/modules/pricing/**`

Environment variables (add to `.env.example` with empty values and document in the task report)

- `NEXT_PUBLIC_ALGOLIA_APP_ID` — Algolia application ID, safe to expose in the browser bundle
- `NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY` — search-only API key restricted to the public tutors index; safe to expose
- `NEXT_PUBLIC_ALGOLIA_TUTORS_INDEX` — index name (e.g. `tutors_prod` / `tutors_preview` / `tutors_dev`)
- `ALGOLIA_ADMIN_API_KEY` — server-only admin key used by the indexer and the settings script; must never be imported into client code
- all four go through the existing typed env module; missing required server vars must fail server actions clearly, not silently

Telemetry

- emit PostHog events `public_tutor_search_performed`, `public_tutor_search_filter_changed`, and `public_tutor_search_result_clicked` per `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`

SEO

- `/tutors` base page is indexable with descriptive metadata and structured data consistent with existing public pages
- any URL with non-empty `q` / `page` / filter params renders with `robots: noindex, follow` to avoid indexing of every filter permutation

**Out of scope**

- changing the matching-first product model: `/match` and `/results` continue to use internal Postgres-backed matching; Algolia is never queried by the matching pipeline
- ranking, fit scoring, availability overlap computation, trust calculations
- adding `react-instantsearch` or any other Algolia UI library
- a backfill admin UI — a one-shot rebuild script is in scope but a long-term admin surface is not
- compare / saved / shortlist behavior changes (these already exist on `/results` and `/saved`)
- tutor-side or admin-side search surfaces
- internationalized or geo-aware filtering beyond the existing reference vocabularies

**Acceptance criteria**

- `/tutors` renders publicly with a working Algolia-backed search and at least subject, language, and IB-level filters using shared reference vocabularies
- `MatchRow browse` variant is used for results; no route-local card / chip / panel CSS introduced
- "Find Tutors" / "Browse" link is present in both the public top nav and every student-family page through `AppFrame`
- the Algolia index is populated and kept in sync by `src/modules/search/public-tutor-indexer.ts`; toggling a tutor's listing status in the profile editor results in the record appearing or disappearing from search within one round-trip
- only public-safe fields appear in the index; no application answers, contact details, internal trust signals, or moderation data
- the four env vars exist in `.env.example` and runtime fails cleanly when server-side vars are missing
- search-only key is the only Algolia key shipped to the browser; admin key is never imported into client bundles
- `src/modules/search/index-settings.ts` defines settings declaratively and `scripts/algolia-apply-settings.ts` can re-apply them
- `docs/architecture/search-platform-decision-v1.md` is amended to record the Algolia-direct decision for public browse
- `docs/design-system/component-inventory-v1.md` (and `tokens-cheatsheet-v1.md` if tokens changed) is updated in the same commit if `MatchRow browse` or any DS primitive is extended

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm lint:arch`
- `pnpm test`
- `pnpm test:e2e` (route covers a public page, navigation, and `sitemap.ts` changes)
- manual: with Algolia credentials in `.env.local`, run the settings script, run the indexer on a seeded tutor, visit `/tutors`, exercise search, filters, pagination, and a result-click handoff into `/tutors/[slug]`
- manual: toggle `public_listing_status` on a tutor through the profile editor and confirm the Algolia record is added/removed
- bundle inspection: confirm `ALGOLIA_ADMIN_API_KEY` does not appear in any client chunk

**Required manual steps**

- create the Algolia application and the three indexes (`tutors_dev`, `tutors_preview`, `tutors_prod`) in the Algolia dashboard
- create a search-only API key restricted to the appropriate index name, and copy the admin API key
- populate `.env.local` with the four variables above
- run `pnpm tsx scripts/algolia-apply-settings.ts` once per environment to seed index settings
- run the one-shot rebuild script against the dev index to backfill from existing eligible tutor profiles
- add the same four variables to the Vercel project (Preview + Production), with admin key marked server-only

## 11.15 `P2-QUALITY-001` Phase 2 verification and operational hardening pass

**Status:** `ready`
**Priority:** `P2`
**Wave:** 4
**Depends on:** all implemented Phase 2 tasks

**Goal**

Run the final Phase 2 verification pass across application state safety, internal privilege boundaries, trust publication rules, richer messaging privacy posture, and any threshold-triggered scaling changes.

**Required source docs**

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`

**Scope**

- final cross-lane verification
- unresolved risk and blocker summary
- operational readiness for any newly added privileged or public-facing Phase 2 surfaces
- DS adherence audit: confirm no route-local `.card`, `.chip`, or `.panel`-style CSS, no inline SVGs outside `src/components/ui/**`, no route-local copies of shared reference vocabularies, and no new `Intl.NumberFormat` or currency-code literals outside `src/modules/pricing/**`; if drift is found, raise a sub-task with an `-A` suffix on the offending feature task before marking the phase done

**Out of scope**

- new Phase 3 product ideation
- unrelated refactor work

**Acceptance criteria**

- privilege-sensitive routes and mutations have explicit verification outcomes
- public trust or media surfaces are reviewed for correctness and exposure safety
- any conditional growth work is justified by evidence
- unresolved blockers are named clearly rather than hidden
- the DS adherence audit produced either a clean result or named follow-up sub-tasks against specific feature tasks

**Verification**

- checklist-driven review across the named source docs

## 12. Task Drafting Rules For Follow-Up

If a `draft` task becomes the active build priority:

- confirm whether route changes are already approved or need an explicit route-map revision
- expand it through `docs/planning/implementation-task-template-v1.md`
- keep the workstream coherent instead of mixing multiple Phase 2 lanes together

If a `planned` task becomes necessary:

- first document the trigger condition
- then promote it to `draft` or `ready`

## 13. What Should Happen Next

After this Phase 2 pack:

1. treat the canonical phase task-pack set as complete
2. keep Phase 1 as the active implementation source unless priorities explicitly shift
3. create any new planning artifact only if execution reveals a real navigation or coordination problem

## 14. Final Recommendation

Mentor IB should treat this pack as the broad expansion map for the first post-MVP platform phase.

The operating model is:

- Wave 1 strengthens tutor supply and listing quality
- Wave 2 turns lessons into stronger trust and continuity objects
- Wave 3 adds internal operating discipline and selectively richer communication
- Wave 4 responds to real scaling pressure without abandoning the match-first architecture

That keeps Phase 2 ambitious enough to matter, while still protecting the project from generic marketplace sprawl and premature infrastructure complexity.
