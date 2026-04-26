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
| 1 | `P2-REPORT-001` | `draft` | `P1` | 2 | Lesson reports and post-lesson continuity surfaces |
| 1 | `P2-MSG-001` | `draft` | `P2` | 3 | Rich messaging behaviors wave |
| 1 | `P2-NOTIF-PREF-001` | `draft` | `P2` | 2 | Notification preferences and channel controls |
| 2 | `P2-APPLY-002` | `draft` | `P2` | 1 | Internal tutor review queue and approval decisions |
| 2 | `P2-PROFILE-001` | `draft` | `P1` | 1 | Tutor profile editor and listing publication controls |
| 2 | `P2-GROW-001` | `planned` | `P3` | 4 | Public browse search scaling and external search activation path |
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

**Status:** `draft`
**Priority:** `P2`
**Wave:** 1
**Depends on:** `P2-APPLY-001`

**Goal**

Implement the internal tutor-review surface and decision workflow so application approval, rejection, credential review, and request-for-changes actions are explicit, auditable, and capability-gated.

**Required source docs**

- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md` (section 8.2 — canonical `changes_requested` status)

**Scope**

- `/internal/tutor-reviews`
- review queue and detail surface
- credential review cues
- approve, reject, and request-changes actions using the canonical `changes_requested` application status
- application audit trail expectations

**Out of scope**

- broad support or finance tooling
- generalized internal dashboard sprawl

**Acceptance criteria**

- internal access is capability-gated and explicit
- review decisions are modeled as state transitions, not hidden edits
- applicants receive only shaped status and next-step information
- internal notes remain internal

**Verification**

- authorization and DTO review
- state-transition and audit review

## 11.3 `P2-PROFILE-001` Tutor profile editor and listing publication controls

**Status:** `draft`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P2-APPLY-001`

**Goal**

Implement deeper tutor profile management so tutors can improve listing quality, manage public-facing content, and understand how profile completeness affects readiness and visibility.

**Required source docs**

- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/foundations/ux-object-model.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/tutor-listing-readiness-model-v1.md`

**Scope**

- tutor profile editor DTO and service boundary
- publication-status and preview controls
- public versus private field separation
- profile-quality or readiness guidance reflecting the 6-gate listing readiness model
- clear indication of which profile fields affect listing gates

**Out of scope**

- route-family invention without an explicit route-map revision
- duplicating public and private tutor models
- generic CMS behavior

**Acceptance criteria**

- tutors edit through a role-safe profile editor DTO
- public and private fields stay explicitly separated
- publication or listability controls do not expose internal moderation state
- profile quality guidance feels like coaching, not punishment

**Verification**

- DTO and ownership review
- route-boundary review before implementation if a new route is required

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

**Status:** `draft`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-LESS-001`, `P15-STUD-002`

**Goal**

Implement post-lesson reporting and continuity surfaces so lessons build visible academic momentum rather than disappearing into history.

**Required source docs**

- `docs/research/ui-ux-research-two-sided-ecosystem.md`
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`

**Scope**

- tutor-authored lesson report flow
- student-visible continuity or next-step surface where approved
- report status and sharing posture
- report hooks from lesson detail and tutor-student continuity views

**Out of scope**

- AI-authored educational summaries by default
- institutional report export systems
- public exposure of lesson reports

**Acceptance criteria**

- reports are framed as continuity, not paperwork
- visibility rules are explicit and privacy-safe
- report content stays tied to lessons and next actions
- the system remains one shared continuity model across tutor and student contexts

**Verification**

- visibility and retention review
- lesson-detail continuity review

## 11.7 `P2-MSG-001` Rich messaging behaviors wave

**Status:** `draft`
**Priority:** `P2`
**Wave:** 3
**Depends on:** `P1-MSG-002`

**Goal**

Add the first richer messaging behaviors that materially improve conversation feel without turning Mentor IB into a generic chat product.

**Required source docs**

- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`

**Scope**

- reactions
- typing indicator
- online presence
- better conversation filtering or search if usage justifies it

**Out of scope**

- file attachments
- native mobile push
- community or multi-party chat

**Acceptance criteria**

- richer message behavior remains phase-appropriate and does not break access boundaries
- presence and typing are additive convenience, not an access loophole
- privacy and logging posture remain explicit
- message UX still feels tied to tutoring relationships and lesson context

**Verification**

- RLS and access review
- Realtime/privacy review
- phased-scope review against the message architecture

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

**Status:** `draft`
**Priority:** `P2`
**Wave:** 2
**Depends on:** `P1-NOTIF-001`

**Goal**

Implement user-facing notification preferences so students and tutors can control which notification types they receive and through which channels, without losing critical operational notifications.

**Required source docs**

- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`

**Scope**

- notification preference surface in student and tutor settings
- per-category opt-in/opt-out for non-critical notifications
- channel selection where multiple channels exist (in-app, email)
- critical operational notifications remain mandatory and non-dismissable (booking confirmations, payment receipts, lesson cancellations, dispute outcomes)
- preference persistence and immediate effect on notification dispatch

**Out of scope**

- push notifications (no native mobile in Phase 2)
- per-conversation mute controls (covered by P2-MSG-001 if needed)
- notification scheduling or digest mode

**Acceptance criteria**

- users can manage notification preferences from their settings
- non-critical notifications respect user channel preferences
- critical notifications are clearly marked as mandatory and cannot be disabled
- preference changes take effect immediately for subsequent notifications
- defaults are sensible (all channels on) and explicit

**Verification**

- notification category and criticality review
- preference persistence and dispatch review
- critical notification bypass review

## 11.14 `P2-GROW-001` Public browse search scaling and external search activation path

**Status:** `planned`
**Priority:** `P3`
**Wave:** 4
**Depends on:** measurable browse-search or performance trigger

**Goal**

Respond to real browse-search scale pressure by activating the approved search-scaling path without changing the product's matching-first architecture.

**Required source docs**

- `docs/architecture/search-platform-decision-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`

**Scope**

- evidence-based threshold review
- browse-search adapter or export activation path
- public discovery record parity checks
- conditional external search activation for public browse only

**Out of scope**

- changing matching ownership
- making Algolia mandatory before the trigger exists
- mixing browse-search infrastructure with ranking logic

**Acceptance criteria**

- the trigger condition is explicit and measurable before work begins
- matching remains internal and application-owned
- public search DTO and projection contracts remain stable
- no user-facing search rewrite is required if the adapter changes

**Verification**

- threshold evidence review
- contract-parity review

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
