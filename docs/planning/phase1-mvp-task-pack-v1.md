# Mentor IB Phase 1 MVP Task Pack v1

**Date:** 2026-04-10
**Status:** Implementation-ready Phase 1 MVP task pack for future AI agents
**Scope:** concrete Phase 1 workstreams, execution waves, task dependencies, and implementation-ready task definitions for the first product slice

## 1. Why This Document Exists

Mentor IB now has:

- the approved design and architecture pack
- the agent implementation decision index
- the implementation task template
- the master backlog index

What was still needed was the first actual execution pack:

**Which concrete tasks should be implemented for Phase 1 MVP, in what order, and with what scope boundaries?**

Without a Phase 1 task pack, implementation can drift into:

- working on whichever page feels easiest
- building UI before shared foundations
- building routes before auth and data boundaries
- creating large tasks that mix unrelated concerns
- duplicating student and tutor work instead of reusing shared systems
- agents blocking each other with overlapping write scopes

This document exists to prevent that.

## 2. How To Use This Pack

Use this pack for actual implementation planning and execution.

The workflow is:

1. open this pack to find the next ready Phase 1 task
2. use `docs/planning/agent-implementation-decision-index-v1.md` to confirm source docs
3. use `docs/planning/implementation-task-template-v1.md` if a task needs to be copied into a tracker or expanded
4. implement one task at a time or parallelize only tasks with disjoint write scopes
5. move later waves only when earlier dependencies are satisfied

This pack is not the place to redefine architecture.

It is the first concrete build plan.

## 3. What Phase 1 MVP Covers

Phase 1 MVP should prove the core loop:

1. student lands on the product
2. student defines an IB learning need
3. student receives and evaluates tutor matches
4. student views a tutor profile and books
5. student and tutor communicate and track lessons
6. tutor manages the first operational surfaces

Primary routes and surfaces:

- `/`
- `/match`
- `/results`
- `/tutors/[slug]`
- `/book/[context]`
- `/messages`
- `/lessons`
- `/tutor/overview`
- `/tutor/lessons`
- `/tutor/schedule`
- `/tutor/messages`

Supporting public routes included in Phase 1:

- `/how-it-works`
- `/trust-and-safety`
- `/support`
- `/become-a-tutor`

## 4. Phase 1 Non-Goals

Phase 1 should not include:

- `/compare`
- `/tutor/students`
- `/tutor/apply`
- full tutor application review operations
- reactions, typing indicators, or online presence
- messaging file uploads
- direct in-app video hosting
- speculative growth infrastructure beyond what the approved architecture already requires
- broad admin/moderation tooling beyond what is needed to safely support Phase 1 data and trust boundaries

## 5. Status And Priority Vocabulary

Use:

- `ready`: implementation-ready now
- `draft`: useful, but should be split or clarified before implementation
- `blocked`: waiting on dependency or missing setup
- `done`: implemented and verified

Priority:

- `P0`: foundational blocker
- `P1`: core Phase 1 user-value work
- `P2`: important support and hardening work inside Phase 1

## 6. Execution Waves

Use this as the default order.

## 6.1 Wave 1: Foundations and product entry

Goal:

- create the shared shell, auth entry, baseline schema, and public route foundation that later work depends on

## 6.2 Wave 2: Match, discovery, and booking path

Goal:

- make the student conversion path real from landing to booking request

## 6.3 Wave 3: Shared continuity objects

Goal:

- make messages and lessons usable as shared student/tutor objects

## 6.4 Wave 4: Tutor operations and quality gates

Goal:

- make the tutor operational path usable and finish Phase 1 verification, observability, and release-ready checks

## 7. Parallel Work Rule

Parallel work is allowed only when write scopes are meaningfully disjoint.

Good parallel examples:

- public route content work and schema foundation work
- design primitive implementation and server/data module implementation
- tutor operational screens and public marketing route polish

Bad parallel examples:

- two agents editing the same domain service or schema files
- route implementation before the DTO or auth boundary is settled
- booking flow and lesson lifecycle logic in the same files without ownership split

## 8. Task Pack Table

**This table is sorted by execution order, not by workstream.** Tasks on the same step can run in parallel. Complete all tasks in a step before moving to the next step.

| Step | Task id | Status | Priority | Wave | Short title |
| --- | --- | --- | --- | --- | --- |
| 1 | `P1-FOUND-001` | `ready` | `P0` | 1 | App shell and route-family skeleton |
| 1 | `P1-DATA-001` | `ready` | `P0` | 1 | Identity, account, and profile schema baseline |
| 2 | `P1-FOUND-002` | `ready` | `P0` | 1 | Design tokens and primitive component baseline |
| 2 | `P1-SEO-001` | `ready` | `P0` | 1 | SEO and AI discoverability foundations |
| 2 | `P1-AUTH-001` | `ready` | `P0` | 1 | Magic link and Google sign-in entry with callback flow |
| 2 | `P1-JOBS-001` | `ready` | `P0` | 1 | Background job and async task infrastructure |
| 2 | `P1-DATA-002` | `ready` | `P0` | 1 | Tutor profile, trust, and availability schema baseline |
| 2 | `P1-DATA-004` | `ready` | `P0` | 1 | Conversation and message schema baseline |
| 3 | `P1-FOUND-003` | `ready` | `P1` | 1 | Shared continuity anchors and common screen states |
| 3 | `P1-AUTH-002` | `ready` | `P0` | 1 | Role selection and authenticated setup routing |
| 3 | `P1-AUTH-003` | `ready` | `P1` | 1 | Google provider safety and branded auth-email setup |
| 3 | `P1-DATA-003` | `ready` | `P0` | 1 | Learning need, match, lesson, and booking schema baseline |
| 3 | `P1-DATA-005` | `ready` | `P1` | 1 | Notification, delivery, and legal-notice schema baseline |
| 4 | `P1-PUBLIC-001` | `ready` | `P1` | 1 | Public marketing route shell set |
| 4 | `P1-FOUND-004` | `ready` | `P1` | 1 | Timezone auto-detection and local-time display convention |
| 5 | `P1-PUBLIC-002` | `ready` | `P1` | 2 | Home route implementation |
| 5 | `P1-PUBLIC-003` | `ready` | `P1` | 2 | Public tutor profile route and SEO surface |
| 5 | `P1-MATCH-001` | `ready` | `P1` | 2 | Match flow route implementation |
| 5 | `P1-ACCOUNT-001` | `ready` | `P1` | 2 | Shared account routes and legal-notice surfaces |
| 5a | `P1-DS-FOUND-001-A` | `done` | `P1` | 4 | Icon/flag libraries and DS-first enforcement docs (foundation, run before remaining feature work) |
| 5b | `P1-QUALITY-003` | `ready` | `P1` | 4 | Architectural-rule lint and pre-commit guardrails (foundation, protects all subsequent commits) |
| 5c | `P1-DS-FOUND-001-B` | `ready` | `P1` | 4 | DB-backed reference copy and fallback removal (foundation, removes constants subsequent routes might consume) |
| 5d | `P1-DS-FOUND-001-C` | `ready` | `P1` | 4 | DS expansion and continuity-component naming reconciliation (foundation, primitives subsequent routes will consume) |
| 6 | `P1-MATCH-002` | `ready` | `P1` | 2 | Results route and match result cards |
| 6 | `P1-BOOK-001` | `ready` | `P1` | 2 | Booking context route and booking request action |
| 6 | `P1-ACCOUNT-002` | `ready` | `P1` | 2 | Account profile editing — name and preferred language |
| 7 | `P1-MSG-001` | `ready` | `P1` | 3 | Shared conversation list and message thread routes |
| 7 | `P1-LESS-001` | `ready` | `P1` | 3 | Shared lessons route and lesson summary/detail surfaces |
| 7 | `P1-ACCOUNT-003` | `ready` | `P1` | 2 | Account avatar upload |
| 7 | `P1-NOTIF-001` | `ready` | `P1` | 3 | In-app lifecycle notifications and legal-update notice flow |
| 8 | `P1-MSG-002` | `ready` | `P1` | 3 | Message send, unread state, and notification hooks |
| 8 | `P1-LESS-002` | `ready` | `P1` | 3 | Lesson actions: join, calendar, cancellation, and issue reporting |
| 8 | `P1-NOTIF-002` | `ready` | `P1` | 3 | Transactional email delivery and branded email templates |
| 9 | `P1-TUTOR-001` | `ready` | `P1` | 4 | Tutor overview route |
| 9 | `P1-TUTOR-003` | `ready` | `P1` | 4 | Tutor schedule route |
| 10 | `P1-TUTOR-002` | `ready` | `P1` | 4 | Tutor lessons route |
| 10 | `P1-TUTOR-004` | `ready` | `P1` | 4 | Tutor messages route using shared conversation system |
| 10 | `P1-TUTOR-005` | `ready` | `P1` | 4 | Tutor earnings route and payout-readiness flow |
| 11 | `P1-QUALITY-001` | `ready` | `P2` | 4 | Observability, analytics, and safe logging baseline |
| 12 | `P1-DS-FOUND-001-D1` | `ready` | `P1` | 4 | Public route family DS adoption (cleans up pre-rule routes) |
| 12 | `P1-DS-FOUND-001-D2` | `ready` | `P1` | 4 | Student route family DS adoption (cleans up pre-rule routes) |
| 12 | `P1-DS-FOUND-001-D3` | `ready` | `P1` | 4 | Tutor route family DS adoption (cleans up pre-rule routes) |
| 12 | `P1-DS-FOUND-001-D4` | `ready` | `P1` | 4 | Account and setup route family DS adoption (cleans up pre-rule routes) |
| 12 | `P1-DS-FOUND-001-D5` | `ready` | `P1` | 4 | Internal route family DS adoption (cleans up pre-rule routes) |
| 13 | `P1-DS-FOUND-001-E` | `ready` | `P1` | 4 | Component inventory and tokens cheatsheet |
| 14 | `P1-QUALITY-002` | `ready` | `P2` | 4 | Phase 1 release and verification checklist pass |

## 9. Detailed Tasks

Each task below is intentionally shorter than the full task template, but it already contains the minimum required structure for implementation.

## 9.1a `P1-JOBS-001` Background job and async task infrastructure

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-DATA-001`

**Goal**

Create the background job infrastructure needed by booking expiry, payment capture, notification delivery, payout processing, and trust snapshot refresh so async work has a durable, observable, and idempotent execution model from day one.

**Required source docs**

- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/planning/phase1-payment-scope-decision-v1.md`

**Scope**

- `job_runs` table and job status lifecycle
- `webhook_events` table with verification and processing status
- Vercel Cron route for scheduled job execution
- Next.js `after()` pattern for post-response lightweight work
- job deduplication via idempotency keys
- Stripe webhook receiver route with signature verification
- dead-letter logging for permanently failed jobs

**Out of scope**

- Vercel Queues or external job queue services
- complex retry backoff strategies beyond simple linear retry

**Acceptance criteria**

- background jobs can be dispatched, tracked, and retried through a durable model
- Stripe webhooks are received, verified, deduplicated, and processed idempotently
- Vercel Cron can trigger scheduled jobs such as booking expiry checks and trust snapshot refresh
- job failures are logged with enough context for diagnosis
- `after()` is used only for short post-response work under 100ms

**Verification**

- job lifecycle and idempotency review
- webhook handler verification and deduplication review

## 9.1b `P1-SEO-001` SEO and AI discoverability foundations

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-FOUND-001`

**Goal**

Create the shared SEO and AI discoverability infrastructure so Phase 1 public routes launch with correct metadata, structured data, sitemap, robots configuration, and AI-search readiness from day one.

**Required source docs**

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/planning/seo-foundation-task-pack-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`

**Scope**

- route classification system (Class A indexable, Class B non-indexable, Class C authenticated)
- shared metadata generation using Next.js App Router metadata APIs
- `robots.txt` with correct crawl rules for public versus product routes
- dynamic sitemap generation for Phase 1 public pages
- JSON-LD structured data helpers for `Organization`, `BreadcrumbList`, and `ProfilePage`
- preview deployment noindex enforcement via `X-Robots-Tag` or meta robots
- canonical URL generation for public routes
- Open Graph and social sharing metadata defaults
- entity clarity signals for AI discoverability (who, how, why)

**Out of scope**

- subject or service landing pages (Phase 1.5)
- editorial content calendar
- Search Console setup (operational, not code)

**Acceptance criteria**

- every Phase 1 public route has correct metadata generated through the approved system
- Class B and Class C routes are noindex
- sitemap includes only quality-gated public pages
- JSON-LD is server-rendered, validated, and matches visible page content
- preview deployments default to noindex
- structured data does not mark up hidden, fake, or placeholder content
- AI discoverability is addressed through strong SEO fundamentals, not separate hacks

**Verification**

- metadata and structured data review against the metadata matrix
- robots and sitemap validation
- public-route SEO acceptance checklist pass

## 9.1 `P1-FOUND-001` App shell and route-family skeleton

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** none

**Goal**

Create the shared Next.js App Router shell, route groups, root layout, section layouts, and baseline loading/error boundaries so the product starts as one ecosystem instead of fragmented route islands.

**Required source docs**

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/planning/implementation-baseline-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/architecture-discussion-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

**Scope**

- root app layout and global boundaries
- public, auth, setup, account, student, tutor, and internal route-group structure
- baseline section layouts and navigation shell placeholders
- route-family ownership utilities if needed

**Out of scope**

- final page content for feature routes
- full auth logic
- final data fetching

**Acceptance criteria**

- route groups exist for the approved Phase 1 topology
- one shared app shell is used rather than separate student and tutor apps
- loading and error boundaries exist in the expected top-level places
- route layout structure matches the approved route-layout map

**Verification**

- route tree review against the route-layout doc
- manual navigation sanity check across top-level route families

## 9.2 `P1-FOUND-002` Design tokens and primitive component baseline

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-FOUND-001`

**Goal**

Implement the approved design-token foundations and first primitive component set so Phase 1 routes can be built from the shared system rather than one-off local UI.

**Required source docs**

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/planning/implementation-baseline-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`

**Scope**

- typography, color, spacing, surface, radius, shadow, and breakpoint tokens
- core primitives such as button, input, textarea, select, panel, badge, avatar, tabs, inline notice
- baseline state tokens and state styling

**Out of scope**

- feature-specific composites
- one-off page wrappers

**Acceptance criteria**

- approved tokens exist in code and are reusable
- primitive components cover the minimum set required by the Phase 1 screens
- accessibility basics such as focus visibility and form semantics are handled in the primitives

**Verification**

- component review against the design-system spec
- responsive and focus-state manual review

## 9.3 `P1-FOUND-003` Shared continuity anchors and common screen states

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P1-FOUND-002`

**Goal**

Create the shared continuity objects and cross-screen presentation patterns that appear in both student and tutor experiences, including shared empty, loading, and error states.

**Required source docs**

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/planning/implementation-readiness-pack-v1.md`

**Scope**

- need summary bar
- lesson summary
- person summary
- context chip row
- shared empty/loading/error state patterns

**Out of scope**

- route-specific business logic

**Acceptance criteria**

- continuity anchors are reusable across student and tutor routes
- common states do not need to be re-authored per page
- components preserve one shared ecosystem language

**Verification**

- component reuse review across at least two route families

## 9.4 `P1-AUTH-001` Magic link and Google sign-in entry with callback flow

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-FOUND-001`

**Goal**

Implement the sign-in entry surface and callback handling for magic link and Google login so both existing and new users land in the shared auth flow.

**Required source docs**

- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`

**Scope**

- `/auth/sign-in`
- `/auth/callback`
- minimal auth verify state route if required
- sign-in entry UI for magic link and Google

**Out of scope**

- role selection after first sign-in
- full account settings

**Acceptance criteria**

- both sign-in methods use the shared app auth path
- auth callback behavior is handled through the approved route boundary
- existing users can continue toward normal app access
- new users can be recognized for setup routing

**Verification**

- manual sign-in flow review for both entry methods
- callback route behavior review

## 9.5 `P1-AUTH-002` Role selection and authenticated setup routing

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-AUTH-001`, `P1-DATA-001`

**Goal**

Implement the first authenticated setup step where a new user chooses learning or teaching and is routed into the correct shared-mode starting point.

**Required source docs**

- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/foundations/ux-object-model.md`

**Scope**

- `/setup/role`
- role selection Server Action
- post-auth routing for users missing app profile state

**Out of scope**

- broader onboarding questionnaires
- tutor application workflow

**Acceptance criteria**

- new users are routed to role setup
- role selection creates app-level product state, not only UI state
- returning users skip setup when profile state already exists

**Verification**

- manual first-login and returning-user routing checks

## 9.6 `P1-DATA-001` Identity, account, and profile schema baseline

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** none

**Goal**

Create the baseline identity and shared profile schema needed for authenticated product use, including account ownership, role state, and core profile references.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

**Scope**

- `app_users`
- role/profile linkage tables or fields
- shared account state needed by setup and auth routing
- initial RLS decisions and migration discipline

**Out of scope**

- tutor profile detail fields
- lessons, messages, or matching objects

**Acceptance criteria**

- the shared identity model is represented in the app schema
- product roles are app-level state
- RLS and ownership posture are explicit

**Verification**

- migration review
- database test decision recorded

## 9.7 `P1-DATA-002` Tutor profile, trust, and availability schema baseline

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-DATA-001`

**Goal**

Create the tutor data foundations needed for the public tutor profile, trust proof display, and availability/booking previews.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`

**Scope**

- tutor profile source tables
- approved public profile fields
- trust proof source fields or records
- availability and schedule-policy foundations
- public-safe DTO foundations and projection inputs

**Out of scope**

- tutor application review workflow
- certificate upload UI

**Acceptance criteria**

- tutor public and private profile data are clearly separated
- public-safe fields for tutor discovery are explicit
- availability data can support booking previews without leaking private scheduling details

**Verification**

- DTO and public exposure review
- schema ownership review

## 9.8 `P1-DATA-003` Learning need, match, lesson, and booking schema baseline

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-DATA-001`, `P1-DATA-002`

**Goal**

Create the shared data foundations for student learning needs, matching results, lesson/booking lifecycle, booking-linked payment authorization and capture, and schedule-linked continuity.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`

**Scope**

- learning needs
- match result or candidate representation
- lesson and booking state tables
- lesson issue case records for no-show and failed-lesson handling
- payment authorization and capture records linked to bookings
- schedule-linked lesson snapshots
- booking mutation idempotency boundary

**Out of scope**

- advanced ranking tuning
- compare route

**Acceptance criteria**

- learning need and lesson objects follow the shared product object model
- booking state has a clear source of truth
- booking-linked payment state has a clear source of truth
- lesson issue state has a clear source of truth separate from abuse reports
- lesson snapshots preserve historical meaning where needed

**Verification**

- schema review
- idempotency review
- database test decision recorded

## 9.9 `P1-DATA-004` Conversation and message schema baseline

**Status:** `ready`
**Priority:** `P0`
**Wave:** 1
**Depends on:** `P1-DATA-001`

**Goal**

Create the conversation and message schema foundations for one-to-one tutor-student messaging, unread state, block/report support, and future Realtime delivery.

**Required source docs**

- `docs/architecture/message-architecture-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/architecture/security-architecture-v1.md`

**Scope**

- conversations
- conversation participants or membership model
- messages
- unread/read state foundations
- block/report support records if needed for Phase 1 routes

**Out of scope**

- reactions
- typing indicators
- attachments

**Acceptance criteria**

- one-to-one conversation ownership is explicit
- participant access can be enforced through the approved boundaries
- unread state is representable without UI-only hacks

**Verification**

- schema and DTO boundary review
- message privacy and logging review

## 9.10 `P1-PUBLIC-001` Public marketing route shell set

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P1-FOUND-001`, `P1-FOUND-002`

**Goal**

Implement the shared public route shell and baseline page structure for the supporting marketing routes so Phase 1 has a coherent public surface and SEO posture.

**Required source docs**

- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

**Scope**

- `/how-it-works`
- `/trust-and-safety`
- `/support`
- `/become-a-tutor`
- shared public page shell and metadata ownership pattern

**Out of scope**

- home page hero implementation
- tutor profile route

**Acceptance criteria**

- the supporting public routes use the shared public shell
- route-level metadata ownership is in place
- pages are indexable or non-indexable according to the approved route class

**Verification**

- public route checklist review
- metadata and route ownership review

## 9.11 `P1-PUBLIC-002` Home route implementation

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-PUBLIC-001`, `P1-FOUND-003`

**Goal**

Implement the Phase 1 home route using the approved hi-fi direction, the shared design system, and the approved matching-first positioning.

**Required source docs**

- `docs/visual-design/hi-fi-key-screen-comps-v1.html`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/research/ui-ux-research-fresh-start.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`

**Scope**

- `/`
- hero, trust framing, core CTA flow, and supporting content blocks
- signed-in student continuation state on the same home route
- route metadata and structured data as applicable

**Out of scope**

- match flow internals
- tutor profile route details

**Acceptance criteria**

- home page follows the approved visual and product direction
- route communicates the matching-first proposition rather than a generic marketplace feel
- signed-in students can resume from the home route without being dropped into a blank public-only experience
- public-route SEO acceptance basics are satisfied

**Verification**

- manual visual review against the hi-fi comp
- public-route checklist review

## 9.12 `P1-PUBLIC-003` Public tutor profile route and SEO surface

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-DATA-002`, `P1-PUBLIC-001`

**Goal**

Implement the public tutor profile route using only approved public-safe data, with correct metadata, structured data, public media behavior, and booking handoff entry.

**Required source docs**

- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`

**Scope**

- `/tutors/[slug]`
- public tutor DTO consumption
- trust proof display
- public media and video reference handling
- booking CTA entry points

**Out of scope**

- full booking route
- tutor private editing

**Acceptance criteria**

- the route renders only approved public tutor data
- metadata and structured data derive from public-safe fields
- private credential or operational fields are not exposed
- the route can hand off into booking

**Verification**

- public DTO review
- public-route checklist review
- manual content exposure review

## 9.13 `P1-MATCH-001` Match flow route implementation

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-DATA-003`, `P1-AUTH-002`, `P1-FOUND-003`

**Goal**

Implement the match flow route where a student defines a learning need and the system can move toward results using the approved matching-first UX.

**Required source docs**

- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/wireframes/wireframes-student-core-v1.md`
- `docs/visual-design/hi-fi-key-screen-comps-v1.html`
- `docs/data/api-and-server-action-contracts-v1.md`

**Scope**

- `/match`
- learning-need capture UI
- form validation and submission boundary
- match flow step structure and continuity anchors

**Out of scope**

- final ranking optimization
- compare route

**Acceptance criteria**

- student can define a learning need through the approved UI pattern
- route uses the shared continuity anchors and one-ecosystem language
- submission follows the approved Server Action boundary

**Verification**

- form validation review
- responsive route review

## 9.14 `P1-MATCH-002` Results route and match result cards

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-MATCH-001`, `P1-DATA-003`, `P1-DATA-002`

**Goal**

Implement the results route that shows fit-based tutor matches, reuses shared card patterns, and supports evaluation handoff into tutor profiles and booking.

**Required source docs**

- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/component-specs-phase2-v1.md`

**Scope**

- `/results`
- result list layout
- match row or result card patterns
- sorting/filter presentation only if already covered by Phase 1 design docs

**Out of scope**

- external search provider integration
- compare route

**Acceptance criteria**

- results use approved match DTOs and shared presentation patterns
- route does not read raw database rows directly
- results support clear handoff to tutor profile and booking

**Verification**

- results DTO review
- route and card manual review

## 9.15 `P1-BOOK-001` Booking context route and booking request action

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-PUBLIC-003`, `P1-DATA-003`, `P1-DATA-002`

**Goal**

Implement the booking context route and the first booking request action so a student can move from evaluation into a real request with correct auth, validation, idempotency, tutor/student context, and booking-time payment authorization.

**Required source docs**

- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/architecture-discussion-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`

**Scope**

- `/book/[context]`
- booking context read DTO
- booking request Server Action
- request-time payment authorization via Stripe Checkout
- acceptance-time capture handoff boundary
- cache and redirect behavior after booking request

**Out of scope**

- advanced rescheduling
- complex pricing systems
- reminder scheduling

**Acceptance criteria**

- booking route resolves the correct context safely
- booking action uses the approved mutation boundary
- unauthorized or invalid actors cannot create booking requests
- booking request creates an authorization hold without requiring the student to monitor tutor approval manually
- tutor acceptance can capture the existing authorization
- tutor decline or request expiry can release the authorization cleanly
- request expiry timing and release behavior are explicit in the booking boundary
- booking request result is minimal and route-safe

**Verification**

- booking action auth and validation review
- idempotency review

## 9.16 `P1-MSG-001` Shared conversation list and message thread routes

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-DATA-004`, `P1-FOUND-003`

**Goal**

Implement the shared conversation list and thread UI for the student-side messages route using the approved shared message architecture and DTO boundaries.

**Required source docs**

- `docs/architecture/message-architecture-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/security-architecture-v1.md`

**Scope**

- `/messages`
- conversation list shell
- thread view
- block and report entry points inside the thread experience
- empty and selected states

**Out of scope**

- reactions
- typing indicators
- tutor-specific route chrome

**Acceptance criteria**

- the route uses shared message objects and shared conversation shell patterns
- only participant-scoped DTOs are used
- empty, loading, and denied-access states are explicit
- unauthorized thread access resolves through the approved 404 posture
- student-started conversation rules remain compatible with the shared tutor reply flow

**Verification**

- DTO exposure review
- manual participant-access review

## 9.17 `P1-MSG-002` Message send, unread state, and notification hooks

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-MSG-001`

**Goal**

Implement the message send mutation, unread-state updates, and the first notification hooks for new message activity.

**Required source docs**

- `docs/architecture/message-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

**Scope**

- send message Server Action
- unread state updates
- minimal in-app new-message notification trigger
- safe logging and audit posture

**Out of scope**

- reactions
- typing indicators
- presence

**Acceptance criteria**

- non-participants cannot send messages
- message body is persisted through the approved domain boundary
- unread state updates correctly for the participant model
- new-message activity stays inside the chat and in-app notification model for MVP
- notification hooks do not leak message body into logs or analytics

**Verification**

- auth and validation review
- messaging privacy review

## 9.18 `P1-LESS-001` Shared lessons route and lesson summary/detail surfaces

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-DATA-003`, `P1-FOUND-003`

**Goal**

Implement the shared lessons route for the student side, including lesson list and lesson detail summary surfaces built on participant-scoped DTOs.

**Required source docs**

- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/security-architecture-v1.md`

**Scope**

- `/lessons`
- lesson cards and lesson detail summaries
- participant-scoped lesson state display
- lesson issue entry and issue-status display for eligible lesson states

**Out of scope**

- calendar export
- advanced lesson reporting
- internal review tooling for lesson issues

**Acceptance criteria**

- lessons route uses role-safe lesson DTOs
- lesson state language matches the approved system
- meeting links and sensitive lesson details remain participant-private
- eligible lesson detail surfaces provide a clear `Report issue` entry without treating chat as the fallback operational system

**Verification**

- lesson DTO review
- manual role-safety review

## 9.19 `P1-TUTOR-001` Tutor overview route

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DATA-002`, `P1-DATA-003`, `P1-FOUND-003`

**Goal**

Implement the tutor overview route as the first tutor operational dashboard using shared lesson, schedule, and person summary objects rather than a separate back-office model.

**Required source docs**

- `docs/planning/implementation-readiness-pack-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/foundations/ux-object-model.md`

**Scope**

- `/tutor/overview`
- key metrics and next-actions view
- summary panels built from shared objects

**Out of scope**

- tutor students route
- application workflow

**Acceptance criteria**

- overview route uses shared components and shared object language
- route does not feel like a separate product from the student experience
- tutor summary data is role-scoped and DTO-safe

**Verification**

- visual/system consistency review
- DTO review

## 9.20 `P1-TUTOR-002` Tutor lessons route

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-LESS-001`

**Goal**

Implement the tutor-side lessons route using the shared lesson domain with tutor-scoped presentation and operations context.

**Required source docs**

- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`

**Scope**

- `/tutor/lessons`
- tutor lesson list and detail views
- tutor-facing request accept or decline actions that are already in Phase 1 scope
- clear pending, confirmed, expired, cancelled, and issue-state language

**Out of scope**

- tutor students route
- advanced reporting

**Acceptance criteria**

- tutor lessons reuse the shared lesson object model
- tutor-specific route chrome does not introduce a second UI system
- role-safe tutor lesson DTOs are used
- tutor can review and act on pending requests without leaving the shared lesson hub

**Verification**

- cross-role UI consistency review
- DTO review

## 9.21 `P1-TUTOR-003` Tutor schedule route

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DATA-002`, `P1-DATA-003`

**Goal**

Implement the tutor schedule route for viewing and editing availability/schedule posture needed by Phase 1 booking operations.

**Required source docs**

- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

**Scope**

- `/tutor/schedule`
- availability and schedule policy reads
- availability update mutation boundary where needed for Phase 1
- default meeting-link settings needed for lesson operations

**Out of scope**

- external calendar sync
- advanced calendar conflict tooling

**Acceptance criteria**

- tutor can view and update the basic schedule/availability model
- updates follow the approved Server Action boundary
- schedule UI matches the approved shared schedule patterns
- default meeting-link settings are captured through the approved tutor-owned boundary

**Verification**

- schedule mutation review
- manual availability update check

## 9.22 `P1-TUTOR-004` Tutor messages route using shared conversation system

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-MSG-001`, `P1-MSG-002`

**Goal**

Implement the tutor-side messages route using the same shared conversation and thread system as the student route, with tutor route chrome only.

**Required source docs**

- `docs/architecture/message-architecture-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

**Scope**

- `/tutor/messages`
- route shell and tutor-mode chrome
- reuse of shared conversation/thread components

**Out of scope**

- separate tutor-only messaging objects

**Acceptance criteria**

- tutor messages route reuses the shared messaging system
- only role-appropriate route chrome differs from the student route
- no duplicate data model or component family is introduced

**Verification**

- shared component reuse review
- route consistency review

## 9.23 `P1-QUALITY-001` Observability, analytics, and safe logging baseline

**Status:** `ready`
**Priority:** `P2`
**Wave:** 4
**Depends on:** core data and route foundations

**Goal**

Implement the minimum Phase 1 observability, telemetry, and safe logging posture so the MVP can be diagnosed and measured without violating privacy or mixing audit with analytics.

**Required source docs**

- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`
- `docs/architecture/security-architecture-v1.md`

**Scope**

- baseline telemetry hooks for approved product events
- safe logging boundaries
- core operational signals for jobs, webhooks, and failures where relevant to Phase 1

**Out of scope**

- broad analytics expansion
- optional growth tooling not needed by MVP

**Acceptance criteria**

- approved telemetry and logging paths are present for core Phase 1 flows
- message bodies, learning need free text, meeting links, and payment details are excluded from logs and analytics
- audit and analytics remain separate concerns

**Verification**

- telemetry and log review against architecture docs

## 9.24 `P1-QUALITY-002` Phase 1 release and verification checklist pass

**Status:** `ready`
**Priority:** `P2`
**Wave:** 4
**Depends on:** all user-facing Phase 1 tasks

**Goal**

Run the final Phase 1 verification pass across routing, accessibility, SEO, DTO safety, privacy-sensitive exposure, testing expectations, and release readiness.

**Required source docs**

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

**Scope**

- final checklist pass for Phase 1 routes and core mutations
- unresolved blocker identification
- release-readiness summary

**Out of scope**

- new feature work
- post-MVP optimization backlog

**Acceptance criteria**

- each Phase 1 route or system has an explicit verification outcome
- unresolved blockers are named rather than hidden
- the MVP release state can be reviewed from one summary pass

**Verification**

- checklist-driven review across the approved quality docs

## 9.25 `P1-AUTH-003` Google provider safety and branded auth-email setup

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P1-AUTH-001`

**Goal**

Implement the provider-side and callback-safety parts of shared authentication so Google sign-in, magic links, redirect handling, and branded auth emails are configured through one explicit boundary instead of scattered setup decisions.

**Required source docs**

- `docs/architecture/architecture-discussion-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/security-architecture-v1.md`

**Scope**

- Google provider configuration expectations
- callback and return-path allowlist behavior
- failure-state handling for expired links and provider callback errors
- branded auth email setup boundary for Supabase-managed auth emails

**Out of scope**

- account settings
- app-originated transactional email templates

**Acceptance criteria**

- Google and magic-link flows still converge into one shared auth path
- redirect and callback behavior is restricted to approved return paths
- auth failure states are shaped and explicit
- auth emails are treated as branded Mentor IB auth surfaces, not ignored provider defaults

**Verification**

- Google callback safety review
- auth email and error-state review

## 9.26 `P1-DATA-005` Notification, delivery, and legal-notice schema baseline

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P1-DATA-001`

**Goal**

Create the data foundations for in-app notifications, outbound delivery tracking, and legal-notice visibility so lifecycle communication does not become an ad hoc side effect.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

**Scope**

- notification source tables
- notification delivery tracking
- legal-notice version and receipt records
- async job visibility objects where they are part of the notification boundary

**Out of scope**

- final email copy
- push notifications

**Acceptance criteria**

- in-app notifications remain the canonical product object
- email delivery is tracked separately from canonical notification state
- legal updates can be shown and later proven as seen or acknowledged

**Verification**

- schema review
- notification object-boundary review

## 9.27 `P1-ACCOUNT-001` Shared account routes and legal-notice surfaces

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-AUTH-002`, `P1-DATA-001`, `P1-DATA-005`, `P1-FOUND-003`

**Goal**

Implement the shared account routes so student and tutor use the same account shell for settings, notifications, privacy, billing history, and required legal updates.

**Required source docs**

- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

**Scope**

- `/settings`
- `/notifications`
- `/privacy`
- `/billing`
- post-login legal-update notice surface

**Out of scope**

- tutor operational earnings route
- advanced preference center

**Acceptance criteria**

- shared account routes work for both student and tutor without splitting the UI system
- Notifications clearly separate product notifications from tutor-student chat
- legal updates are visible outside the bell surface through the approved post-login notice pattern
- unauthorized account-route access follows the approved 404 posture where applicable

**Verification**

- shared-account route review
- legal-notice visibility review

## 9.28 `P1-FOUND-004` Timezone auto-detection and local-time display convention

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P1-AUTH-001`, `P1-DATA-001`

**Goal**

Implement the shared timezone infrastructure so every time-bearing surface in the product displays dates and times in the user's local timezone, with silent auto-detection on the client and a clear inline explanation pattern to avoid confusion between participants in different timezones.

**Required source docs**

- `docs/data/database-schema-outline-v1.md` (section 7.7 — timezone rule)
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

**Scope**

- client-side timezone auto-detection using the `Intl` API
- silent persist of detected timezone to `app_users.timezone` on sign-in or when the detected value changes
- a shared date/time formatting utility (`src/lib/datetime`) that always converts UTC storage values to the user's local timezone for display
- an inline timezone explanation pattern (e.g. "All times shown in your local timezone") for surfaces where timezone ambiguity could cause confusion (booking, lessons, schedule)
- timezone is NOT displayed as an editable setting — it is auto-detected and updated silently

**Out of scope**

- timezone as a user-editable setting field
- per-object timezone override UI
- recurring schedule timezone management (owned by `P1-TUTOR-003`)

**Acceptance criteria**

- every time-bearing surface uses the shared formatting utility instead of ad hoc date formatting
- the user's timezone is detected and persisted without requiring manual input
- booking, lesson, and schedule surfaces include a brief timezone explanation where ambiguity is possible
- UTC storage rule is preserved — no local-time storage anywhere

**Verification**

- cross-surface time-display consistency review
- timezone detection and persistence review

## 9.29 `P1-ACCOUNT-002` Account profile editing — name and preferred language

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-ACCOUNT-001`, `P1-DATA-001`

**Goal**

Add editable name and preferred language fields to the `/settings` page so users can update their display name and language preference from the shared account surface.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`

**Scope**

- editable full name field on `/settings` with inline validation
- editable preferred language field on `/settings` (select from the `languages` reference table)
- server action for account profile update with authorization and input validation
- repository function to update `app_users.full_name` and `app_users.preferred_language_code`
- remove email and timezone from the visible settings display (email is not editable, timezone is auto-detected by `P1-FOUND-004`)

**Out of scope**

- email editing (requires Supabase Auth flow, not a simple field update)
- timezone editing (auto-detected, not user-editable)
- avatar editing (separate task `P1-ACCOUNT-003`)
- tutor-specific profile fields (owned by `P2-PROFILE-001`)
- using preferred language to filter matching results (future product decision)

**Acceptance criteria**

- users can update their display name and preferred language from `/settings`
- the language selector shows options from the `languages` reference table
- input validation prevents empty names and invalid language codes
- changes are persisted immediately and reflected on next page load
- the server action enforces authentication and ownership

**Verification**

- settings form review
- server action auth and validation review

## 9.30 `P1-ACCOUNT-003` Account avatar upload

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-ACCOUNT-002`

**Goal**

Add avatar upload to the `/settings` page so users can set a profile image beyond what was imported from Google OAuth, using Supabase Storage for file hosting.

**Required source docs**

- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`

**Scope**

- Supabase Storage public bucket for user avatars (bucket setup is a manual prerequisite)
- avatar upload component on `/settings`
- image validation: file type (JPEG, PNG, WebP), max file size, minimum dimensions
- server action to upload image to Supabase Storage and update `app_users.avatar_url`
- avatar preview and replace flow

**Out of scope**

- server-side image resizing or cropping (use client-side constraints for MVP)
- tutor credential or media uploads (owned by `P2-MEDIA-001`)
- CDN or image optimization pipeline beyond Supabase Storage defaults

**Acceptance criteria**

- users can upload, preview, and replace their avatar from `/settings`
- uploaded avatars are stored in a public Supabase Storage bucket with a predictable path convention
- invalid files are rejected with clear error messages before upload
- the avatar URL is persisted to `app_users.avatar_url` and reflected across the product

**Verification**

- upload and replace flow review
- file validation review
- storage access and path convention review

## 9.31 `P1-NOTIF-001` In-app lifecycle notifications and legal-update notice flow

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-DATA-005`, `P1-BOOK-001`, `P1-LESS-001`, `P1-ACCOUNT-001`

**Goal**

Implement the in-app notification generation and read-state flows for Phase 1 lifecycle events so important product updates appear in one consistent bell-centered system.

**Required source docs**

- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/foundations/cross-role-journey-inventory-v1.md`

**Scope**

- create notifications for lesson request submitted, accepted, declined, expired, cancelled or rescheduled, reminder, lesson issue acknowledgement, lesson issue resolution, payout readiness or payout hold, and legal update publication
- notification list rendering support for `/notifications`
- read-state mutation boundary
- post-login legal-update notice trigger

**Out of scope**

- push notifications
- notification preferences center

**Acceptance criteria**

- Phase 1 lifecycle events produce consistent in-app notifications
- chat-message notifications remain separate from the rest of the bell-based product notifications
- legal updates are visible after login and remain accessible later in Notifications

**Verification**

- notification object review
- route and read-state review

## 9.32 `P1-NOTIF-002` Transactional email delivery and branded email templates

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-NOTIF-001`

**Goal**

Implement the first transactional email pipeline so important Phase 1 lifecycle events reach users by email with branded Mentor IB templates, while keeping chat messages out of email.

**Required source docs**

- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`

**Scope**

- Resend-backed app email service
- branded email template system
- lesson lifecycle emails
- payout and legal-update emails
- delivery tracking hooks

**Out of scope**

- marketing campaigns
- digest emails
- sending new chat-message emails

**Acceptance criteria**

- Phase 1 system notifications that require email have branded Mentor IB templates
- emails use safe summaries and link back to authenticated product surfaces for detail
- new message alerts do not email message content in MVP
- delivery attempts are trackable through the approved notification-delivery boundary

**Verification**

- template review
- email delivery and privacy review

## 9.33 `P1-LESS-002` Lesson actions: join, calendar, cancellation, and issue reporting

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-LESS-001`, `P1-BOOK-001`

**Goal**

Implement the participant lesson actions that turn lesson detail into a real operational surface instead of a read-only status page.

**Required source docs**

- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/foundations/cross-role-journey-inventory-v1.md`

**Scope**

- join-lesson action and meeting-link status handling
- add-to-calendar deep link and `.ics` entry
- participant cancellation and reschedule boundaries for the approved policy
- lesson issue reporting from lesson detail

**Out of scope**

- recurring calendar sync
- internal dispute resolution tooling

**Acceptance criteria**

- lesson detail exposes the correct next action for the lesson state
- cancellation confirms the policy outcome before the action completes
- tutor-fault and student-fault lesson actions remain distinguishable for downstream refund and payout handling
- issue reporting uses structured reasons rather than free-form chat fallback
- meeting-link and calendar actions respect the approved media and calendar boundaries

**Verification**

- lesson action review
- payment-policy and issue-flow review

## 9.34 `P1-TUTOR-005` Tutor earnings route and payout-readiness flow

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-TUTOR-001`, `P1-BOOK-001`, `P1-ACCOUNT-001`

**Goal**

Implement the tutor earnings route and payout-readiness experience so approved tutors understand listing status, payout setup, earnings timing, and payout holds without leaving the Mentor IB ecosystem.

**Required source docs**

- `docs/architecture/architecture-discussion-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `docs/planning/phase1-payment-scope-decision-v1.md`
- `docs/data/tutor-listing-readiness-model-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/foundations/cross-role-journey-inventory-v1.md`

**Scope**

- `/tutor/earnings`
- payout readiness state and listing-gate interaction
- Stripe Connect Express account creation with pre-filled tutor data (name, email, country, date of birth)
- Stripe hosted onboarding redirect so tutor only needs to provide verification documents and bank account
- return handling from Stripe onboarding (success, incomplete, resume)
- `account.updated` webhook handling for payout account status sync
- monthly payout-cycle summary
- payout hold or missing-setup notices
- readiness checklist integration on tutor overview

**Out of scope**

- advanced finance reconciliation tools
- tax-document collection beyond payout-provider handoff
- custom KYC forms (use Stripe hosted onboarding only)

**Acceptance criteria**

- tutors can clearly see whether they are payout-ready and publicly bookable
- Stripe Connect Express account is created with maximum pre-filling from application data
- tutor only needs to upload verification docs and add bank account during Stripe onboarding
- the route explains the hosted payout setup step without inventing a custom KYC flow
- earnings and payout states use shaped product language rather than raw Stripe terms
- `account.updated` webhooks correctly update payout account status
- listing gate correctly blocks public discovery until payout is enabled

**Verification**

- payout-readiness UX review
- provider-handoff boundary review
- Stripe Connect pre-fill and webhook handling review

## 9.35 `P1-DS-FOUND-001` parent — Design-system cleanup umbrella

The cleanup work is split into nine implementation-ready sub-tasks under one parent id:

- `P1-DS-FOUND-001-A` — icon and flag library adoption + DS-first enforcement docs
- `P1-DS-FOUND-001-B` — DB-backed reference copy and fallback removal
- `P1-DS-FOUND-001-C` — DS expansion and continuity-component naming reconciliation
- `P1-DS-FOUND-001-D1` — public route family DS adoption
- `P1-DS-FOUND-001-D2` — student route family DS adoption
- `P1-DS-FOUND-001-D3` — tutor route family DS adoption
- `P1-DS-FOUND-001-D4` — account and setup route family DS adoption
- `P1-DS-FOUND-001-D5` — internal route family DS adoption
- `P1-DS-FOUND-001-E` — component inventory and tokens cheatsheet

Shared parent goal:

Pay down the design-system, icon, and reference-copy drift that accumulated across Phase 1 route work so every route family consumes one shared component vocabulary, one icon library, one flag library, and one canonical reference-data source — closing the door on per-page UI dialects before release verification.

Shared parent outcome (verified at `-E`):

- one icon library (`lucide-react`) and one flag library (`country-flag-icons`) own every icon and country-flag rendering in the product
- every shared vocabulary (subjects, focus areas, languages, learning-need options) — including human-readable description copy — comes from `src/modules/reference/**` and the database, not from route-local arrays or fallback constants
- every route family consumes the design-system primitives and continuity grammar instead of bespoke per-page card / chip / panel CSS
- documentation enforces a "DS-first" rule that future tasks can cite

Sequencing note:

- the foundation sub-tasks (`-A`, `-B`, `-C`) plus `P1-QUALITY-003` should land before remaining Phase 1 feature work (steps 6–11 of the task table) so new routes are built against the new DS, the new lint rules, and the DB-backed reference data from day one
- the cleanup sub-tasks (`-D1..D5`) should land after the feature work in steps 6–11 because their job is to clean up routes that were built before the new rules existed; routes built during steps 6–11 are already protected by the lint introduced in `P1-QUALITY-003` and so should not need a `-D` pass
- `-E` is last because its inventory and audit must reflect the final repo state
- the cleanup sub-tasks do not depend on `P1-QUALITY-001`; however, `-D1..D5` heavily edit route files, so they should not run in parallel with `P1-QUALITY-001` (which is also expected to edit route files to add telemetry) — sequence them in either order, but not concurrently

Shared required source docs (each sub-task may cite a tighter subset):

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/component-specs-phase2-v1.md`
- `docs/design-system/agent-ui-rules.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`
- `docs/planning/engineering-guardrails-v1.md`
- `docs/data/reference-data-and-config-baseline-v1.md`

## 9.35a `P1-DS-FOUND-001-A` Icon and flag libraries, DS-first enforcement docs

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-FOUND-002`, `P1-FOUND-003`

**Goal**

Adopt `lucide-react` as the single icon library and `country-flag-icons` as the single flag library, expose them as DS wrappers, and update governance docs so subsequent sub-tasks have authoritative DS-first rules to cite.

**Required source docs**

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/agent-ui-rules.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`

**Scope**

- add `lucide-react` and `country-flag-icons` to `package.json` (runtime deps)
- create `src/components/ui/icon.tsx` as the single bridge to lucide, exposing the project icon set as a typed `iconKey` → `LucideIcon` map and forwarding `size`, `strokeWidth`, `aria-label`, and `className`; pick the `strokeWidth` and default `size` that visually match the existing hand-drawn primitives so `OptionCardGroup` icon slots do not change weight
- create `src/components/ui/flag.tsx` as the single bridge to `country-flag-icons`, taking an ISO 3166 alpha-2 code and rendering the bundled SVG with consistent radius, viewBox, and accessible label
- replace the inline SVGs and hardcoded flag SVGs in `src/components/ui/app-icons.tsx` with re-exports from the new wrappers; delete `app-icons.tsx` once no caller imports from it
- update `src/modules/reference/visuals.ts` to export `iconKey` values that resolve through the new `Icon` wrapper and `flagCode` values that resolve through the new `Flag` wrapper
- update `CLAUDE.md` to add `lucide-react` and `country-flag-icons` to the frozen baseline and to add a "DS-first" hard boundary: if a needed pattern is not in the design system, extend the design system before using it locally; route-local card / chip / panel / icon / flag CSS is forbidden
- update `docs/design-system/agent-ui-rules.md` to carry the same DS-first rule, reference the new `Icon` / `Flag` wrappers as the only source for icons and country flags, and add this obligation: any task that adds a new DS primitive, variant, or token must update `docs/design-system/component-inventory-v1.md` and (if tokens changed) `docs/design-system/tokens-cheatsheet-v1.md` in the same commit — the inventory and cheatsheet are not allowed to lag
- update `docs/architecture/canonical-value-ownership-map-v1.md` to add icon-library and flag-library ownership entries pointing to the new wrappers

**Out of scope**

- DB schema changes (covered by `-B`)
- new DS primitives beyond `Icon` / `Flag` (covered by `-C`)
- per-route refactors (covered by `-D1..D5`)

**Acceptance criteria**

- `Icon` and `Flag` are exported from `src/components/ui/index.ts` and used by `OptionCardGroup` (and any other primitive that previously rendered inline SVGs) without visual regression
- `src/components/ui/app-icons.tsx` no longer exists, or is reduced to typed re-exports from `Icon` / `Flag`
- `CLAUDE.md`, `agent-ui-rules.md`, and `canonical-value-ownership-map-v1.md` carry the DS-first rule and the new library ownership entries
- a manual cross-OS render check confirms flags display correctly on macOS, Windows, iOS, and Android

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- manual visual check on `/match`, `/settings`, `/tutors/[slug]` to confirm icon and flag rendering is unchanged
- cross-platform flag render check (Windows is the regression-risk platform)

**Required manual steps**

- none beyond `pnpm install` after the dependency additions

**Local testing checklist**

- open `/match` and confirm subject icons and language flags render through the new wrappers
- open `/settings` and confirm the preferred-language card group renders correctly
- open `/tutors/[slug]` and confirm any flag rendering is unchanged

## 9.35b `P1-DS-FOUND-001-B` DB-backed reference copy and fallback removal

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-FOUND-002`, `P1-DATA-003`

**Goal**

Move subject and focus-area description copy into the database, route it through the canonical reference loaders, and delete the page-local fallback constants so every consumer reads from one source of truth.

**Required source docs**

- `docs/data/reference-data-and-config-baseline-v1.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`
- `docs/design-system/agent-ui-rules.md`

**Scope**

- add a Supabase migration that introduces a `display_description` column on `reference_subjects` and any equivalent description column needed for `reference_subject_focus_areas`, then seeds the values currently hardcoded in `src/modules/lessons/match-flow-options.ts` (`subjectDescriptionsByCode`)
- extend `src/modules/reference/schema.ts` and `src/modules/reference/catalog.ts` to expose the new description fields on the loaded rows
- update `src/modules/reference/discovery.ts` to use the loaded descriptions and remove the `getSubjectDescription` import
- delete `subjectDescriptionsByCode` and `previewMatchFlowOptions` from `src/modules/lessons/match-flow-options.ts`, along with the `buildPreviewLanguages` / `buildPreviewSubjects` fallbacks and the `try { … } catch { return previewMatchFlowOptions; }` block in `loadDiscoveryOptions`
- update `src/modules/accounts/profile-settings.ts`, `src/app/(student)/match/match-flow-form.tsx`, and any other caller that depends on those constants to consume the loader output directly; let DB load failures surface as real errors rather than silent preview fallbacks
- once the constants above are deleted, add the corresponding `no-restricted-imports` rule to the ESLint config introduced by `P1-QUALITY-003` so the deleted names cannot be re-added by future code; this rule must live in `-B`'s commit, not `P1-QUALITY-003`'s, because it is only valid after the deletion lands

**Out of scope**

- icon/flag library work (covered by `-A`)
- new DS primitives (covered by `-C`)
- per-route refactors beyond rewiring callers of the deleted constants

**Acceptance criteria**

- `subjectDescriptionsByCode`, `previewMatchFlowOptions`, `buildPreviewLanguages`, and `buildPreviewSubjects` no longer exist in the repo
- `loadDiscoveryOptions` does not return a fallback object on DB error; failures bubble up
- subject descriptions and focus-area copy on `/match` come from the loaded rows
- the new migration applies cleanly on a fresh Supabase init and on top of the prior baseline

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- run `supabase db reset` (or equivalent local migration command) and confirm the migration applies cleanly and seeds the expected description values

**Required manual steps**

- run the new Supabase migration locally and in any deployed environment after merge
- confirm the seed for `reference_subjects.display_description` matches the previously hardcoded copy

**Local testing checklist**

- complete the `/match` flow end-to-end and confirm subject descriptions render the seeded copy
- temporarily break the DB connection and confirm `/match` surfaces an error rather than silently falling back to preview options

## 9.35c `P1-DS-FOUND-001-C` DS expansion and continuity-component naming reconciliation

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-A`, `P1-DS-FOUND-001-B`

**Goal**

Add the DS primitives that route-local CSS currently re-implements, reconcile the documented vs. actual naming of continuity components, and produce a drift inventory that subsequent route-family sub-tasks consume.

**Required source docs**

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/component-specs-phase2-v1.md`
- `docs/design-system/agent-ui-rules.md`

**Scope**

- run a drift inventory pass and record the per-route-family drift sites (route-local card CSS, route-local chip CSS, ad-hoc panel wrappers, inline subject/flag rendering, freeform field styling) so `-D1..D5` have a checklist to work from; persist the inventory at `docs/design-system/component-inventory-v1.md` (this file is created here in skeletal form and finalized in `-E`)
- add the missing primitives that drift sites currently re-implement, only the variants needed by existing routes:
  - a `Card` primitive with at least `select` (radio-style choice card) and `instant-submit` (single-action card) variants
  - a single shared `Chip` primitive with the tones used today
  - a `Section` primitive that replaces the bespoke panel/section CSS used by account, match, and tutor surfaces
- reconcile the gap between `docs/design-system/component-specs-core-v1.md` (which names `LessonCard` and `ScheduleSurface`) and the current repo (which has `LessonSummary` and no `ScheduleSurface`): either rename the components or amend the spec, then apply the chosen name consistently in code and in the spec
- ensure every new primitive lives under `src/components/ui/**` with a CSS module and a barrel export from `src/components/ui/index.ts`

**Out of scope**

- per-route refactors that would touch route-family files (covered by `-D1..D5`)
- speculative DS variants that no current route consumes
- final inventory polish and the tokens cheatsheet (covered by `-E`)

**Acceptance criteria**

- `Card`, `Chip`, and `Section` exist in `src/components/ui/**`, are exported from `src/components/ui/index.ts`, and render through DS tokens only
- the `LessonCard` / `ScheduleSurface` naming gap is closed in both the repo and `component-specs-core-v1.md`
- a skeletal `docs/design-system/component-inventory-v1.md` enumerates the new primitives and the per-route-family drift sites that `-D1..D5` are responsible for cleaning up

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- visual review of the new primitives in isolation (e.g., a temporary route or storybook page is acceptable but not required)

**Required manual steps**

- none

**Local testing checklist**

- confirm existing route families still build and render unchanged (the new primitives are not yet consumed at this stage)

## 9.35d1 `P1-DS-FOUND-001-D1` Public route family DS adoption

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-A`, `P1-DS-FOUND-001-B`, `P1-DS-FOUND-001-C`

**Goal**

Remove per-page card / chip / panel / icon / flag implementations from the public route family and replace them with the DS primitives, including migrating home-page marketing copy to a TS module.

**Required source docs**

- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`
- the drift inventory section produced in `-C`

**Scope**

- routes covered: `/`, `/how-it-works`, `/trust-and-safety`, `/support`, `/become-a-tutor`, `/tutors/[slug]`
- replace per-page card/chip/panel/icon/flag implementations with the DS components
- migrate the home page to consume marketing copy (`pressurePoints`, `matchingSteps`, `reassurancePoints`, `sampleMatches`, `trustProof`) from a new `src/modules/marketing/home-content.ts` TS module instead of inlined arrays
- replace the inline `.matchRow` / `.matchPerson` / `.matchActions` markup on the home page with the shared `MatchRow` continuity component
- replace the one-off `<span className={styles.chip}>` language render in `src/app/(public)/tutors/[slug]/page.tsx` with the shared `Chip` and `Flag` primitives

**Out of scope**

- new public routes
- copy or content rewrites beyond moving existing strings into the new TS module
- changes to other route families

**Acceptance criteria**

- no `.module.css` file under `src/app/(public)/**` defines a `.card`, `.chip`, or `.panel`-style class for a pattern the DS already covers
- the home page renders entirely from DS primitives plus continuity components, with copy sourced from `src/modules/marketing/home-content.ts`
- `/tutors/[slug]` renders subject and language chips through `Chip` + `Icon` / `Flag`

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- manual visual diff against approved hi-fi for the home and tutor profile pages

**Required manual steps**

- none

**Local testing checklist**

- walk every public route and confirm rendering parity with the prior implementation
- confirm sample-match prices, trust-proof items, and marketing sections still render the same content

## 9.35d2 `P1-DS-FOUND-001-D2` Student route family DS adoption

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-A`, `P1-DS-FOUND-001-B`, `P1-DS-FOUND-001-C`

**Goal**

Remove per-page card / chip / panel / icon / flag implementations from the student route family and replace them with the DS primitives, moving route-local helpers into the appropriate `src/modules/**` files.

**Required source docs**

- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/component-specs-core-v1.md`
- the drift inventory section produced in `-C`

**Scope**

- routes covered: `/match`, `/results`, `/book/[context]`, `/lessons`, `/messages`
- replace per-page card/chip/panel/icon/flag implementations with the DS components
- move the `getSubjectLegend` / `getCurrentStepQuestion` switches from `src/app/(student)/match/match-flow-form.tsx` into `src/modules/lessons/match-flow-copy.ts` (or DB-backed copy if `-B` already provides the rows)
- ensure the lesson summary surface uses the reconciled name from `-C` (`LessonCard` or whatever was chosen)

**Out of scope**

- new student routes
- changes to match domain logic, results ranking, or booking domain logic beyond the markup/CSS swap
- changes to other route families

**Acceptance criteria**

- no `.module.css` file under `src/app/(student)/**` defines a `.card`, `.chip`, or `.panel`-style class for a pattern the DS already covers
- match, results, booking, lessons, and messages routes consume DS primitives end-to-end
- match-flow copy switches no longer live inside the form component

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- manual run of the match flow end-to-end and visual diff on results, lessons, and messages

**Required manual steps**

- none

**Local testing checklist**

- complete the match → results → tutor profile → booking path
- open `/lessons` and confirm lesson summary and detail render correctly
- open `/messages` and confirm the conversation list and thread render correctly

## 9.35d3 `P1-DS-FOUND-001-D3` Tutor route family DS adoption

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-A`, `P1-DS-FOUND-001-B`, `P1-DS-FOUND-001-C`

**Goal**

Remove per-page card / chip / panel / icon / flag implementations from the tutor route family and replace them with the DS primitives.

**Required source docs**

- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/component-specs-core-v1.md`
- the drift inventory section produced in `-C`

**Scope**

- routes covered: `/tutor/overview`, `/tutor/lessons`, `/tutor/schedule`, `/tutor/messages`, `/tutor/earnings`
- replace per-page card/chip/panel/icon/flag implementations with the DS components
- ensure the schedule surface uses the reconciled name from `-C` (`ScheduleSurface` or whatever was chosen)

**Out of scope**

- new tutor routes
- changes to tutor domain logic, payout, or earnings logic beyond the markup/CSS swap
- changes to other route families

**Acceptance criteria**

- no `.module.css` file under `src/app/(tutor)/**` (or wherever tutor routes live) defines a `.card`, `.chip`, or `.panel`-style class for a pattern the DS already covers
- tutor overview, lessons, schedule, messages, and earnings consume DS primitives end-to-end

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- manual visual review of every tutor route

**Required manual steps**

- none

**Local testing checklist**

- walk every tutor route and confirm rendering parity with the prior implementation

## 9.35d4 `P1-DS-FOUND-001-D4` Account and setup route family DS adoption

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-A`, `P1-DS-FOUND-001-B`, `P1-DS-FOUND-001-C`

**Goal**

Remove per-page card / chip / panel / icon / flag implementations from the account and setup route families and replace them with the DS primitives, moving route-local helpers into the appropriate `src/modules/**` files.

**Required source docs**

- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/component-specs-core-v1.md`
- the drift inventory section produced in `-C`

**Scope**

- routes covered: `/settings`, `/legal`, `/setup/role`, other `/setup/*` routes that exist at task time
- replace per-page card/chip/panel/icon/flag implementations with the DS components
- move the inline `buildRoleBadges` / `getRoleTone` helpers from `src/app/(account)/settings/page.tsx` into `src/modules/accounts/role-badges.ts` (or equivalent) and consume them via DS primitives
- replace the role-selection bespoke CSS in `src/app/setup/role/role-selection-form.tsx` with the `OptionCardGroup` (or `Card` `select` variant) instead of styled buttons

**Out of scope**

- new account or setup routes
- changes to auth, role, or legal-notice domain logic beyond the markup/CSS swap
- changes to other route families

**Acceptance criteria**

- no `.module.css` file under `src/app/(account)/**` or `src/app/setup/**` defines a `.card`, `.chip`, or `.panel`-style class for a pattern the DS already covers
- role badges and role selection both render through DS primitives
- inline page helpers in account and setup pages are moved to `src/modules/**`

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- manual visual review of `/settings`, `/legal`, `/setup/role`, and any other `/setup/*` route

**Required manual steps**

- none

**Local testing checklist**

- open `/settings` and confirm role badges and the profile form render correctly
- open `/setup/role` and confirm role selection works through the DS card variant

## 9.35d5 `P1-DS-FOUND-001-D5` Internal route family DS adoption

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-A`, `P1-DS-FOUND-001-B`, `P1-DS-FOUND-001-C`

**Goal**

Remove per-page card / chip / panel / icon / flag implementations from any internal/admin route family that exists at task time and replace them with the DS primitives.

**Required source docs**

- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/component-specs-core-v1.md`
- the drift inventory section produced in `-C`

**Scope**

- routes covered: any internal/admin surface that exists at task time
- replace per-page card/chip/panel/icon/flag implementations with the DS components
- if no internal routes exist at task time, this sub-task is a no-op and should be marked `done` with a one-line note

**Out of scope**

- creating new internal routes
- changes to other route families

**Acceptance criteria**

- no `.module.css` file under any internal/admin route family defines a `.card`, `.chip`, or `.panel`-style class for a pattern the DS already covers
- if no internal routes exist, the sub-task report records that explicitly

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

**Required manual steps**

- none

**Local testing checklist**

- walk every internal route and confirm rendering parity with the prior implementation

## 9.35e `P1-DS-FOUND-001-E` Component inventory and tokens cheatsheet

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-D1`, `P1-DS-FOUND-001-D2`, `P1-DS-FOUND-001-D3`, `P1-DS-FOUND-001-D4`, `P1-DS-FOUND-001-D5`

**Goal**

Finalize the design-system component inventory and produce the token cheatsheet so future agents can see, in one place, what the DS contains and how its tokens are intended to be used.

**Required source docs**

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/agent-ui-rules.md`
- `src/styles/globals.css` (read-only reference for tokens)

**Scope**

- finalize `docs/design-system/component-inventory-v1.md`: list every DS primitive, the variants it supports, the route families that consume it, and the canonical import path
- create `docs/design-system/tokens-cheatsheet-v1.md` summarizing the `globals.css` token groups (palette, spacing, radius, motion, state, focus-ring) with usage guidance and examples
- run a final repo-wide audit that the parent acceptance criteria below all hold; record any leftover drift as follow-up issues rather than expanding scope

Parent acceptance criteria verified at this sub-task:

- `pnpm grep -r "<svg" src/app` (or equivalent) returns zero matches outside `src/components/ui/**`
- no route-local module CSS file defines a `.card`, `.chip`, or `.panel`-style class for a pattern the DS already covers
- `subjectDescriptionsByCode`, `previewMatchFlowOptions`, `buildPreviewLanguages`, and `buildPreviewSubjects` no longer exist in the repo
- `loadDiscoveryOptions` does not return a fallback object on DB error
- every subject card, language card, and flag chip across the product renders through `Icon` or `Flag` wrappers
- the design-system component inventory and tokens cheatsheet exist and accurately describe what is in the repo
- `agent-ui-rules.md` and `CLAUDE.md` carry the DS-first rule
- no route family lost functionality during the refactor

**Out of scope**

- new DS primitives
- further route refactors
- new product surfaces

**Acceptance criteria**

- `docs/design-system/component-inventory-v1.md` and `docs/design-system/tokens-cheatsheet-v1.md` exist, are linked from `docs/README.md`, and accurately describe the current repo
- the parent-level acceptance criteria above all hold; any leftover drift is captured as a follow-up issue rather than left undocumented

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- doc review of the inventory and cheatsheet against the actual repo

**Required manual steps**

- none

**Local testing checklist**

- spot-check that each route family still works end-to-end after the audit (no code changes are expected here, but the audit may reveal regressions)

## 9.36 `P1-QUALITY-003` Architectural-rule lint and pre-commit guardrails

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-DS-FOUND-001-A`

**Goal**

Make the DS-first rule, the canonical-ownership rules, and the no-hardcoding rules enforceable at commit time and in CI so they cannot silently rot during the rest of Phase 1, Phase 1.5, and Phase 2. Catch the mechanically-detectable 80% of architectural drift before it lands; leave the semantic 20% to the existing release-time QA audits.

**Required source docs**

- `CLAUDE.md`
- `docs/design-system/agent-ui-rules.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`
- `docs/planning/engineering-guardrails-v1.md`

**Scope**

- ESLint custom config additions (using `no-restricted-syntax`, `no-restricted-imports`, and `no-restricted-globals`) covering at minimum:
  - no `Intl.NumberFormat` outside `src/modules/pricing/**`
  - no `process.env.*` reads outside `src/lib/env/**` (or whichever typed env module path is canonical at task time)
  - no imports of `lucide-react` or `country-flag-icons` outside `src/components/ui/icon.tsx` and `src/components/ui/flag.tsx` (force consumption through the DS wrappers)
- the additional `no-restricted-imports` rule that blocks re-adding `previewMatchFlowOptions`, `subjectDescriptionsByCode`, `getSubjectDescription`, `buildPreviewLanguages`, and `buildPreviewSubjects` is added as part of `P1-DS-FOUND-001-B`'s scope (in the same commit that deletes those constants), not here, to avoid breaking the build before `-B` lands
- a small `scripts/audit-architectural-rules.ts` (run via `tsx`) covering the structural checks ESLint cannot express well:
  - no `<svg` markup in any file under `src/app/**` or `src/modules/**` (icons must come through `Icon`/`Flag`)
  - no `.card`, `.chip`, or `.panel` class definitions in any `*.module.css` under `src/app/**` (must extend the DS instead)
  - no currency-code string literals (`"USD"`, `"EUR"`, `"GBP"`, `"CAD"`, `"AUD"`) outside `src/modules/pricing/**`
  - no route-local literal arrays whose elements have the shape `{ value: string, label: string }` of length ≥ 4 (likely a hardcoded reference vocabulary) outside `src/modules/reference/**` and `src/modules/marketing/**` — flag for review rather than hard-fail to keep noise low
- pre-commit hook via `simple-git-hooks` (preferred — single-package, no install step) running `lint-staged` (lint changed files only) plus the audit script (full repo, fast)
- a single new `pnpm` script `pnpm lint:arch` that runs ESLint plus the audit script in one command, suitable for both pre-commit and CI
- a CI workflow step (extend the existing GitHub Actions config if one exists, otherwise add `.github/workflows/architectural-lint.yml`) running `pnpm lint:arch` on every PR
- update the **Verification standard** section of `CLAUDE.md` to add `pnpm lint:arch` to the default verification commands so future task agents run it before reporting
- update `docs/design-system/agent-ui-rules.md` and `docs/architecture/canonical-value-ownership-map-v1.md` with a short "Enforcement" section linking to the new lint command and audit script

**Out of scope**

- semantic checks that require design judgment (near-duplicate component reimplementation, "is this copy useful" — those stay at the release QA audit)
- prettier or formatting changes
- changes to existing ESLint rules unrelated to architectural enforcement
- pre-push or commit-msg hooks beyond the one pre-commit hook
- a custom ESLint plugin published as its own package (custom rules can live inline in `eslint.config.*`)
- per-developer setup beyond `pnpm install` (the hooks must self-install via `simple-git-hooks`'s `prepare` script convention)

**Acceptance criteria**

- `pnpm lint:arch` exists, runs in under 10 seconds on a clean repo, and exits non-zero when any rule is violated
- the pre-commit hook runs `pnpm lint:arch` on staged changes and blocks commits that violate the rules
- CI runs `pnpm lint:arch` on every PR and fails the build on violations
- the rules listed in scope each have at least one positive test (a deliberately-violating fixture in `scripts/__fixtures__/` or equivalent that the script flags) so the rule cannot silently regress
- `CLAUDE.md`, `agent-ui-rules.md`, and `canonical-value-ownership-map-v1.md` reference `pnpm lint:arch` as the canonical enforcement command
- the current repo passes `pnpm lint:arch` on the first run after this task lands (any genuine drift surfaced by the new rules is fixed in the same task, since the volume should be small post `-A`)

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm lint:arch` (must pass on the current repo)
- manual test: introduce a deliberate violation locally (e.g., add `const usd = "USD"` to a route file), confirm pre-commit hook blocks it, then revert
- CI dry-run: open a draft PR with a deliberate violation and confirm the workflow fails

**Required manual steps**

- after merging, run `pnpm install` once locally to register the `simple-git-hooks` pre-commit hook (this is the standard one-time setup, not a recurring step)

**Local testing checklist**

- run `pnpm lint:arch` and confirm it exits 0
- attempt to commit a file containing `<svg` under `src/app/**` and confirm the commit is blocked
- attempt to commit a file containing `Intl.NumberFormat` outside `src/modules/pricing/**` and confirm the commit is blocked
- confirm `pnpm lint`, `pnpm typecheck`, and `pnpm build` still pass after the new ESLint rules are in place

## 10. Task Drafting Rules For Follow-Up

If one of the tasks above needs to be split further:

- keep the original task id as the parent
- create child tasks with suffixes such as `-A`, `-B`, `-C`
- preserve the same required source docs unless the split changes the decision area
- avoid splitting by arbitrary files only; split by coherent outcome

## 11. What Should Happen Next

After this Phase 1 pack:

1. treat this file as the active Phase 1 execution pack
2. create Phase 1.5 and Phase 2 packs only after the Phase 1 pack is reviewed
3. if needed, copy individual tasks from this pack into the full implementation task template for tracker-ready execution

## 12. Final Recommendation

Mentor IB should use this task pack as the first real implementation backlog for AI agents.

The operating model is:

- Wave 1 stabilizes shell, auth, and data foundations
- Wave 2 delivers public discovery and the student conversion path
- Wave 3 delivers shared continuity objects
- Wave 4 delivers tutor operations and release hardening

That gives the build a clear order, protects the one-ecosystem rule, and turns the architecture pack into work that agents can actually execute.
