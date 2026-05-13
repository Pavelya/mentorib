# Mentor IB Phase 1.5 Task Pack v1

**Date:** 2026-04-10
**Status:** Implementation-usable Phase 1.5 task pack for future AI agents
**Scope:** compare, shortlist continuity, tutor-student relationship surfaces, and the limited quality work that should happen after the Phase 1 MVP loop is stable

## 1. Why This Document Exists

Mentor IB now has:

- an active Phase 1 MVP execution pack
- a master backlog index
- an implementation decision index
- a full architecture and design source pack

What is still needed is the next layer after the MVP loop works:

**Which additional tasks should be implemented to improve decision confidence for students and continuity for tutors, without drifting into Phase 2 complexity?**

Phase 1.5 exists to add the next two high-value surfaces:

- `/compare`
- `/tutor/students`

These are important, but they should not expand into:

- a second marketplace loop
- a full CRM
- full tutor operations admin
- reporting, notes, or file systems that do not yet have a clean Phase 1.5 boundary

This document exists to keep that expansion deliberate.

## 2. How To Use This Pack

Use this pack only after the relevant Phase 1 foundations are stable enough to support it.

The workflow is:

1. confirm the needed Phase 1 routes and DTO foundations already exist
2. open this pack to find the next Phase 1.5 task
3. use `docs/planning/agent-implementation-decision-index-v1.md` to confirm source docs
4. use `docs/planning/implementation-task-template-v1.md` if a task needs to be expanded into tracker format
5. keep Phase 1.5 bounded; if a task starts becoming tutor application, deep reporting, or a new product area, move it to Phase 2

This pack is intentionally lighter than the Phase 1 pack.

It should still be specific enough for AI-agent execution.

## 3. Phase 1.5 Entry Conditions

Phase 1.5 should start only when the following Phase 1 capabilities are available or materially close:

- shared shell, primitives, and continuity anchors
- authenticated student and tutor route families
- public tutor profiles
- match results and booking handoff
- shared messages and lessons foundations
- tutor overview and tutor route chrome

Practical dependency rule:

- if Compare cannot reuse real match/profile objects, wait
- if Tutor Students cannot reuse real lesson/message continuity objects, wait

Phase 1.5 should extend the Phase 1 ecosystem, not patch around missing MVP work.

## 4. What Phase 1.5 Covers

Phase 1.5 should improve two parts of the experience:

1. student decision confidence through compare and shortlist continuity
2. tutor relationship continuity through a lightweight student roster and relationship surface

Primary routes and surfaces:

- `/compare`
- `/tutor/students`

Supporting capability additions:

- shortlist and compare state persistence
- compare entry affordances on existing student surfaces
- tutor-student roster DTOs and search/filter behavior
- on-page tutor student relationship detail

## 5. Phase 1.5 Non-Goals

Phase 1.5 should not include:

- `/tutor/apply`
- tutor profile editor expansion
- notes authoring systems
- lesson report authoring systems
- file uploads for student records
- bulk tutor messaging or CRM automation
- advanced student progress analytics
- a broad saved-items hub beyond what Compare needs
- any separate tutor-only component family or data model

## 6. Status And Priority Vocabulary

Use:

- `ready`: implementation-usable now
- `draft`: useful direction, but still somewhat provisional
- `blocked`: waiting on a Phase 1 dependency or unresolved decision
- `done`: implemented and verified

Priority:

- `P1`: main Phase 1.5 value work
- `P2`: quality and hardening work inside Phase 1.5

## 7. Execution Waves

Use this as the default order.

## 7.1 Wave 1: Compare state and entry points

Goal:

- make compare a real workflow instead of a disconnected page

## 7.2 Wave 2: Compare decision surface

Goal:

- let a student evaluate a small shortlist side by side and move forward confidently

## 7.3 Wave 3: Tutor relationship continuity

Goal:

- let tutors see student relationships through shared lesson/message context rather than a cold admin table

## 7.4 Wave 4: Hardening

Goal:

- verify noindex posture, telemetry, query performance, and responsive/accessibility behavior for the added Phase 1.5 surfaces

## 8. Parallel Work Rule

Parallel work is allowed only when write scopes are meaningfully disjoint.

Good parallel examples:

- compare state plumbing and tutor roster query work
- compare route UI work and tutor roster UI work
- verification work after feature routes are stable

Bad parallel examples:

- two agents editing the same shortlist mutation path
- compare route work before shortlist state exists
- tutor students UI work before the roster DTO and query shape are settled

## 9. Task Pack Table

**This table is sorted by execution order, not by workstream.** Tasks on the same step can run in parallel. Complete all tasks in a step before moving to the next step.

| Step | Task id | Status | Priority | Wave | Short title |
| --- | --- | --- | --- | --- | --- |
| 1 | `P15-DATA-001` | `ready` | `P1` | 1 | Shortlist and compare state baseline |
| 1 | `P15-DATA-002` | `ready` | `P1` | 2 | Structured tutor pricing schema and DTO |
| 1 | `P15-DATA-003` | `ready` | `P1` | 2 | Structured examiner credential typing |
| 1 | `P15-FOUND-001` | `ready` | `P2` | 4 | Brand icon and favicon assets |
| 1 | `P15-QUALITY-002` | `ready` | `P1` | 4 | Verification stack baseline (Vitest, Playwright, CI) |
| 1 | `P15-SEO-001` | `ready` | `P1` | 2 | Subject and service SEO landing pages |
| 1 | `P15-STUD-001` | `ready` | `P1` | 3 | Tutor students roster DTO and query path |
| 2 | `P15-COMP-001` | `ready` | `P1` | 1 | Compare entry affordances on student surfaces |
| 2 | `P15-SAVED-001` | `ready` | `P1` | 1 | Saved tutors persistent surface |
| 2 | `P15-STUD-002` | `ready` | `P1` | 3 | Tutor students route and roster surface |
| 3 | `P15-COMP-002` | `ready` | `P1` | 2 | Compare route and decision surface |
| 3 | `P15-STUD-003` | `ready` | `P1` | 3 | Tutor student relationship detail surface |
| 4 | `P15-PUBLIC-001` | `draft` | `P2` | 4 | Public landing page visual enrichment |
| 4 | `P15-PUBLIC-002` | `draft` | `P2` | 4 | Home route visual enrichment |
| 4 | `P15-PUBLIC-003` | `ready` | `P1` | 4 | Public privacy-policy and terms routes |
| 5 | `P15-QUALITY-001` | `ready` | `P2` | 4 | Phase 1.5 verification and hardening pass |
| 6 | `P15-DATA-001-A` | `ready` | `P2` | 4 | Shortlist and compare discovery telemetry events |

## 10. Detailed Tasks

Each task below is intentionally more compact than the Phase 1 pack.

That is deliberate.

Phase 1.5 should stay smaller and more provisional while still being useful for execution.

## 10.1 `P15-DATA-001` Shortlist and compare state baseline

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P1-DATA-003`, `P1-MATCH-002`, `P1-PUBLIC-003`

**Goal**

Implement the student-controlled shortlist and compare state needed to move candidate tutors from match results into a limited compare flow.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/integration-idempotency-model-v1.md`

**Scope**

- shortlist and compare state for a student's own tutor candidates
- compare-cap enforcement rules
- controlled mutation path for add/remove compare actions
- DTO shaping needed for compare entry and compare route reads

**Out of scope**

- a general saved-items center
- recommendation retuning
- public exposure of shortlist state

**Acceptance criteria**

- shortlist and compare state is explicit rather than UI-only
- a student can only mutate their own shortlist state
- compare-cap rules are enforceable through the approved mutation boundary
- compare surfaces can read from stable DTOs rather than ad hoc page logic

**Verification**

- schema and mutation review
- DTO exposure review

## 10.2 `P15-COMP-001` Compare entry affordances on student surfaces

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P15-DATA-001`, `P1-MATCH-002`, `P1-PUBLIC-003`

**Goal**

Add compare entry and state feedback to the existing student journey so Compare behaves like a natural continuation of results and tutor evaluation.

**Required source docs**

- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/wireframes/low-fi-wireframe-spec.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`

**Scope**

- add/remove compare controls in the relevant student evaluation surfaces
- visible shortlist and compare state feedback
- continuity of the active need while moving toward compare
- clear limit messaging when compare is full

**Out of scope**

- the full compare route
- a dedicated saved route or saved dashboard

**Acceptance criteria**

- save and compare actions remain low-friction and explicit
- compare state is visible on the surfaces where students make shortlist decisions
- compare actions do not create a separate visual language from the rest of the student flow
- compared and shortlisted states remain understandable without relying on color only

**Verification**

- cross-route continuity review
- accessibility label/state review

## 10.3 `P15-COMP-002` Compare route and decision surface

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P15-COMP-001`

**Goal**

Implement the compare route so a student can evaluate a small shortlist side by side, understand differences quickly, and move into booking or profile review with confidence.

**Required source docs**

- `docs/planning/implementation-readiness-pack-v1.md`
- `docs/wireframes/low-fi-wireframe-spec.md`
- `docs/design-system/component-specs-phase2-v1.md`
- `docs/visual-design/hi-fi-key-screen-comps-wave2-v1.html`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`

**Scope**

- `/compare`
- compare matrix on desktop
- stacked compare cards on mobile
- fixed comparison-category order
- remove/edit shortlist controls
- handoff into tutor profile or booking
- correct noindex posture and exclusion from sitemap behavior

**Out of scope**

- indexable compare pages
- advisor or concierge compare workflows
- more than three tutors in compare

**Acceptance criteria**

- compare preserves one active need
- compare is capped to a small shortlist
- desktop and mobile presentations remain meaningfully comparable
- booking and profile actions are explicit and not buried
- route metadata follows the approved non-indexable workflow posture

**Verification**

- responsive compare review
- metadata and noindex review
- manual decision-flow review

## 10.4 `P15-STUD-001` Tutor students roster DTO and query path

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P1-LESS-001`, `P1-MSG-001`, `P1-TUTOR-001`

**Goal**

Implement the tutor students roster query and DTO boundary so tutors can view student relationships through safe shared objects rather than raw student records.

**Required source docs**

- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-index-and-query-review-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`

**Scope**

- tutor students roster DTO
- tutor roster query shape
- search by student name
- filter by active/inactive or equivalent relationship state
- subject relationship filtering if already modeled

**Out of scope**

- raw student profile access
- internal moderation context
- bulk export or CSV behavior

**Acceptance criteria**

- tutor students data is DTO-shaped and role-safe
- the route does not depend on raw student profile reads
- search and filters match the approved search architecture
- roster queries are compatible with the defined performance posture

**Verification**

- DTO boundary review
- query and index review

## 10.5 `P15-STUD-002` Tutor students route and roster surface

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P15-STUD-001`, `P1-FOUND-003`, `P1-TUTOR-001`

**Goal**

Implement the tutor students route as a lightweight relationship surface that helps tutors continue active teaching relationships without turning the product into a CRM.

**Required source docs**

- `docs/wireframes/wireframes-tutor-core-v1.md`
- `docs/visual-design/hi-fi-key-screen-comps-wave2-v1.html`
- `docs/planning/implementation-readiness-pack-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/foundations/ux-object-model.md`

**Scope**

- `/tutor/students`
- search field and lightweight filters
- student rows or cards
- clear next actions into lessons and messages
- mobile-safe stacked presentation

**Out of scope**

- bulk actions
- pipeline views
- reporting dashboards

**Acceptance criteria**

- tutor students remains identity-first
- the surface avoids generic admin-table or CRM-table behavior
- lessons and messages feel like natural relationship continuations from the roster
- route reuses shared person, lesson, and continuity components where possible

**Verification**

- desktop and mobile route review
- cross-role design-system consistency review

## 10.6 `P15-STUD-003` Tutor student relationship detail surface

**Status:** `ready`
**Priority:** `P1`
**Wave:** 3
**Depends on:** `P15-STUD-002`

**Goal**

Add the first tutor student relationship detail surface so a tutor can open one student context and understand active lessons, recent continuity, and next actions without leaving the shared ecosystem.

**Required source docs**

- `docs/wireframes/wireframes-tutor-core-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/foundations/ux-object-model.md`
- `docs/design-system/design-system-spec-final-v1.md`

**Interaction model**

- the detail surface lives at the child route `/tutor/students/[studentProfileId]`, reusing the existing `tutor` route family layout
- the detail page is overview-only and does not introduce tabs; notes, reports, and file management remain out of scope per the explicit non-goals below
- roster cards on `/tutor/students` add an "Open student" link that navigates to the detail route while preserving the roster's `q` / `relationship` / `subject` query params on the back link
- the detail page links into the existing `/tutor/lessons` and `/tutor/messages` hubs as-is; per-student filters on those hubs are deliberately deferred to keep this task bounded
- authorization is enforced server-side by scoping the DTO query to lessons owned by the current tutor's profile; missing or unauthorized relationships return 404 rather than leak existence

**Scope**

- selected-student detail view at `/tutor/students/[studentProfileId]`
- overview of active relationship context (relationship state badge, subjects shared, completed-lesson count, pending-request count, next-lesson and last-lesson timestamps)
- a short recent-lessons list (≤ 5) reusing the shared `LessonSummary` pattern, each linking to the matching `/tutor/lessons/[id]` detail
- clear next-action affordances into lessons and messages
- reuse of shared person and lesson-summary patterns

**Out of scope**

- notes authoring
- report authoring
- file management
- a brand-new route family unless the route architecture is explicitly revised
- per-student filter parameters on `/tutor/lessons` or `/tutor/messages`

**Acceptance criteria**

- the detail surface behaves like an extension of the roster, not a separate back-office tool
- only role-safe relationship context is shown
- lessons and messages remain the primary continuity anchors
- the interaction model is explicit before implementation begins

**Verification**

- detail interaction review
- DTO and privacy review

## 10.6a `P15-DATA-002` Structured tutor pricing schema and DTO

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-DATA-002`, `P1-PUBLIC-003`

**Goal**

Replace the free-text `tutor_profiles.pricing_summary` with structured pricing fields so tutor cards, public profiles, search and match surfaces, and the SEO subject/service/combo pages can render numeric prices, compute price ranges, and emit Schema.org `Offer` blocks. This task closes a gap between the listing-readiness model (which already lists "hourly rate" as a profile minimum in Gate 2) and the actual schema, which has only free-text pricing.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/tutor-listing-readiness-model-v1.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`

**Scope**

- migration adds three columns to `tutor_profiles`: `trial_price_minor` (integer, minor units, nullable), `hourly_rate_minor` (integer, minor units, nullable in this task and tightened by `P2-PROFILE-001`), and `currency_code` (text, default `USD`)
- check constraints: `hourly_rate_minor > 0` when set, `trial_price_minor >= 0` when set, `currency_code` is a 3-letter ISO code
- update tutor listing-readiness Gate 2 query and helpers to read `hourly_rate_minor IS NOT NULL` instead of free-text presence on `pricing_summary`
- `pricing_summary` stays as a fallback display field but is no longer the source of truth for listing readiness
- public profile DTO exposes `trialPriceMinor`, `hourlyRateMinor`, `currencyCode` and a derived `priceRangeLabel` formed from those values
- shared formatters live in `src/modules/pricing/`: `formatTrialPrice`, `formatHourlyRate`, `formatPriceRange` — no `Intl.NumberFormat` or currency-code literals outside `src/modules/pricing/**`
- shared repository helper exposing min/max trial price and min/max hourly rate for a given `subject_id`, `subject_focus_area_id`, or `(subject_id, focus_area_id)` pair, scoped to listed, accepting tutors — consumed by SEO pages and search summaries
- update tutor application form, profile editor, and any internal admin surface that captures pricing today to write the structured fields; existing free-text rows are backfilled or left null
- seed and fixture data updated to populate the structured fields

**Out of scope**

- consumer-facing budget filters in match or search
- multi-currency display switching for the same tutor
- tax, discounts, subscription pricing, or package pricing
- removing `pricing_summary` outright — kept as a display fallback string

**Acceptance criteria**

- migration adds the three columns and the documented check constraints
- listing-readiness Gate 2 reads from `hourly_rate_minor`
- public profile DTO and tutor cards consume the structured values via shared formatters
- the price-range repository helper returns deterministic min/max values for any `subject_id` / `focus_area_id` and is exercised by tests
- all currency formatting flows through `src/modules/pricing/**`
- seeded tutors render numeric prices on their public profile and on subject/service surfaces

**Verification**

- migration and constraint review
- DTO and formatter review
- listing-readiness gate test
- price-range query test
- canonical-value-ownership lint pass (no `Intl.NumberFormat` or currency literals outside `src/modules/pricing/**`)

## 10.6b `P15-DATA-003` Structured examiner credential typing

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-DATA-002`, `P1-PUBLIC-003`

**Goal**

Replace the free-text `tutor_credentials.title` examiner labels with a typed credential so SEO pages, public profiles, match cards, and admin surfaces can derive examiner badges and "examiners on staff" counts from a real, queryable signal. This is the data foundation that powers a Schema.org-friendly trust signal on the subject/service/combo SEO pages.

**Required source docs**

- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`
- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/structured-data-map-v1.md`

**Scope**

- introduce an enumerated credential-type taxonomy in `src/modules/tutors/constants.ts` with values such as `examiner`, `teaching_qualification`, `degree`, `professional_certification`, and `language_certification`
- migration constrains `tutor_credentials.credential_type` to the enumerated set (with a non-throwing backfill path: existing rows mapped to the closest enum value, unmappable rows tagged `professional_certification`)
- migration adds two nullable FK columns to `tutor_credentials`: `credential_subject_id` (FK to `subjects.id`) and `credential_subject_focus_area_id` (FK to `subject_focus_areas.id`); examiner credentials require at least one of these to be non-null
- repository helpers in `src/modules/tutors/`:
  - `countExaminersForSubject(subject_id)` and `countExaminersForSubjectFocusArea(focus_area_id)` returning the number of distinct, approved, listed, accepting examiner tutors
  - `loadExaminerBadgesForTutor(tutor_profile_id)` returning a typed list of `{ subject?: { id, displayName, slug }, focusArea?: { id, displayName, slug } }`
- public profile DTO surfaces an `examinerBadges` array sourced from approved examiner credentials only
- canonical badge tone for examiner badges added to the design system (DS-first; if the existing `badge` primitive needs a new tone, update `docs/design-system/component-inventory-v1.md` in the same commit)
- seed and fixture data updated so a subset of seeded tutors carry examiner credentials with subject/focus-area scope

**Out of scope**

- examiner verification workflow (the existing `tutor_credentials.review_status` lifecycle covers approval; this task does not change it)
- exam-board specific taxonomy beyond IB (only IB subjects and focus areas are referenced)
- self-service examiner attestation flows on the tutor side

**Acceptance criteria**

- migration constrains `credential_type` to the enumerated set with no data loss on existing rows
- approved examiner credential rows can be queried per subject and per focus area in deterministic time
- the count helpers return only distinct tutors, filtered to listed and accepting tutors
- the public profile DTO returns a non-empty `examinerBadges` array for tutors with approved examiner credentials
- the badge tone used for examiner badges is registered in the design system inventory and reused by every consumer

**Verification**

- migration and constraint review
- DTO and helper tests
- public profile rendering review on a seeded examiner tutor
- DS inventory update review

## 10.7 `P15-SEO-001` Subject and service SEO landing pages

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-SEO-001`, `P1-DATA-002`, `P1-PUBLIC-003`, `P15-DATA-002`, `P15-DATA-003`

**Goal**

Implement the first subject and service SEO landing pages so Mentor IB captures problem-led and subject-led search demand with quality-gated, server-rendered pages that work for both traditional search and AI discoverability.

**Required source docs**

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/content-template-spec-v1.md`
- `docs/planning/seo-route-ownership-map-v1.md`
- `docs/planning/phase1-class-a-route-seo-task-pack-v1.md`

**Visual / structural reference**

`docs/designs/` contains a layout exploration for all three templates. Use it for **structure, hierarchy, and section composition only**. Every value in those files is illustrative — copy strings, tutor data, "this week" metrics, strand counts, ratings, slot times, syllabus references, and the bespoke `SiteHeader` are not authoritative. Production pages must source content and metrics from real systems per the rules below.

Specifically:

- `docs/designs/services-tok-essay-help.html` + `TokEssayHelpPage.jsx` — service template (canonical reference)
- `docs/designs/subjects-biology-hl.html` + `SubjectBiologyHLPage.jsx` — subject template
- `docs/designs/subjects-english-a-tok-essay-help.html` + `CombinedEnglishTokPage.jsx` — curated combination template

The section order from these designs maps to the content-template-spec and is binding for this task: breadcrumbs → eyebrow → hero (with optional metrics aside) → pressure points → "five questions" / "what this is" → "how matching works" (service only) → curated tutor list → related-links block (subjects × services, parent pages on combo) → FAQ → final CTA on the forest panel.

**Scope**

- `/subjects/[subject-slug]` — subject pages, slug sourced from `subjects.slug` (e.g., `/subjects/biology-hl`)
- `/services/[need-slug]` — problem-led pages, slug sourced from `subject_focus_areas.slug` (e.g., `/services/tok-essay-help`)
- `/subjects/[subject-slug]/[need-slug]` — curated combinations only, restricted to `(subject, focus area)` pairs that pass the publish gate (e.g., `/subjects/english-a-lang-and-lit/tok-essay-help`)
- server-rendered with unique, IB-specific copy per page (no token-swapped templates)
- quality gate at render/build time: only publish pages with at least N active, accepting tutors mapped to the relevant `subject_id` and/or `subject_focus_area_id` via `tutor_subject_capabilities`, with `schedule_policies.is_accepting_new_students = true` and `tutor_profiles.public_listing_status` listed; the threshold N is documented in code or config (combo pages set N higher than single-axis pages)
- metadata, canonical URLs, and Open Graph per page (per metadata matrix)
- JSON-LD: `BreadcrumbList` on every interior page, `FAQPage` only when the page renders a real visible FAQ, `Course` / `Service` per the structured-data map; no schema not reflected in visible content
- internal linking from home, subject pages, service pages, combination pages, and tutor profiles, all as crawlable `<a>` HTML
- AI discoverability through clear entity structure, people-first copy, and visible answers to "what / who it's for / when it matters / who fits / what's next"
- reuse the shared shell (`src/components/shell/app-frame.tsx` and existing public-family layout); do not introduce a bespoke landing-page header
- all reference-backed labels, slugs, icons, flags, and related-link lists must flow through `src/modules/reference/**` and the canonical icon/flag components — no route-local arrays
- copy authored against the actual product proposition; all five "what / who / when / fit / next" answers must be unique per page

**Real-data sourcing rules**

Replace every hardcoded value in the designs with data sourced from real systems. With `P15-DATA-002` and `P15-DATA-003` merged before this task, the following dynamic content is required on the rendered pages:

Required dynamic content:
- tutor count and "see all N" — count of `tutor_profiles` rows joined to `tutor_subject_capabilities`, filtered by the page's `subject_id` and/or `subject_focus_area_id`, listed publicly, accepting students
- subject/service labels, descriptions, and slugs — `subjects.display_name` / `subjects.display_description` / `subjects.slug` and `subject_focus_areas.display_name` / `subject_focus_areas.slug`
- numeric **trial-price range** in the hero aside, sourced via the price-range repository helper from `P15-DATA-002`, formatted through `src/modules/pricing/**` (e.g., `$44–$58`); both subject and service pages must render a real range
- per-tutor **trial price** and **hourly rate** on cards, formatted through the shared formatters
- **examiner count** ("examiners on staff: N") in the hero aside, sourced via `countExaminersForSubject` / `countExaminersForSubjectFocusArea` from `P15-DATA-003`
- per-tutor **examiner badge** on cards, sourced from the public profile DTO's `examinerBadges`, scoped to the page's subject or focus area
- per-tutor card content — `display_name`, `headline` (descriptor), `best_for_summary` (fit statement), `teaching_style_summary`, `public_slug` (deep link to profile)
- per-tutor language pills / flags via `tutor_language_capabilities` and the canonical flag component
- breadcrumbs derived from the route segments and reference data
- final-CTA destination — route into the existing match entry under `(student)` / public match flow

Required structured data:
- `BreadcrumbList` on every interior page
- `FAQPage` whenever a visible FAQ block is rendered (subject and service templates always render one)
- `Course` for subject pages and `Service` for service pages, per the structured-data map
- `Offer` with `priceRange` on subject, service, and combination pages, populated from the price-range helper; `priceCurrency` from the shared currency formatter
- examiner-credential trust signals reflected in the visible page content (badges) — no hidden schema-only assertions

Omitted from this task (still no schema or surface to source from):
- per-tutor numeric **rating** and **review count** — no review/rating system exists in Phase 1; reviews are owned by `P2-TRUST-001` and the rating signals will land on these pages in a separate post-Phase-2 follow-up
- per-tutor **"next slot"** timestamp — no public availability-lookup helper exists for an anonymous viewer in Phase 1; cards link to the profile instead
- **median first match time**, "recent results" %, "live coverage updated N min ago" — no telemetry / cache-freshness surface
- **strand rail** with per-strand tutor counts — no per-strand tagging in the tutor schema
- per-page authored **pressure-point chips** like "PT 4 (language)" or "Genetics unit fog" — `learning_need_option_values` is keyed for the match wizard and not granular enough; the pressure-points block is dropped from this task's templates
- the design-only `SiteHeader`, italic-word / tweaks panel, and inline SVGs from the design files

Curated-tutor-list ranking:
- the existing match ranker (`mvp-ranking-v1` in `match-flow-service.ts`) requires a learning need and is not usable for an anonymous SEO surface
- this task introduces a small, deterministic public ordering for the curated list (max 3 visible per page), driven only by signals already in the schema: `tutor_subject_capabilities.display_priority`, count of matching capabilities, examiner-credential presence (`P15-DATA-003`), `tutor_profiles.public_listing_status` recency, and tie-broken by `created_at`
- the ordering is documented in code, exposed as a single repository function, and reused across all three templates; it does not personalise

Internal-linking lists:
- "related subjects", "related services", and "subject × need" link blocks are generated from reference data and filtered to slugs that pass the same publish gate used for the page itself; gated-out targets are omitted, not stubbed

**Out of scope**

- mass-generated thin landing pages
- pages for every possible subject-need combination (publish only curated combos that pass the gate)
- editorial resource hub (Phase 2+)
- introducing a tutor review / rating system (owned by `P2-TRUST-001`)
- public availability-lookup helper for anonymous "next slot" rendering
- pressure-point or chip taxonomy beyond what the existing wizard reference data supports
- localization, currency switching, or multi-language SEO

**Acceptance criteria**

- each page answers, in visible HTML: what the need or subject is, who it's for, when support matters, what kind of tutor fits, and what action to take next
- pages with insufficient tutor coverage or thin content are not published; the gate threshold and query are documented in code and applied at build/render time, with a sitemap-aware exclusion path
- every dynamic value on the page is sourced from a real query, reference module, or shared formatter
- subject, service, and combination pages render a real numeric trial-price range and examiner count in the hero aside, drawn from the helpers introduced in `P15-DATA-002` and `P15-DATA-003`
- per-tutor cards render trial price, hourly rate, and (where applicable) an examiner badge scoped to the page's subject or focus area
- `Offer` JSON-LD with `priceRange` is emitted on every subject, service, and combination page and matches the visible price range
- metadata is unique per page and follows the metadata matrix (title, description, canonical, Open Graph, robots posture)
- pages are server-rendered with meaningful content in the initial HTML
- internal links between subject, service, combination, and tutor pages are crawlable `<a>` elements; combination pages link back to both parent surfaces
- structured data matches visible page content; `FAQPage` is only emitted when the page renders a real FAQ block, `BreadcrumbList` matches the visible trail
- the page reuses `AppFrame` and the shared shell; no bespoke landing-page header is introduced
- all reference-backed labels (subject names, service names, related links) come through the reference module, not route-local arrays
- the curated-combination page renders a visible "why this exists" rationale and is automatically suppressed (route returns `notFound()` and the URL is excluded from sitemap) when the gate condition fails
- the deterministic public tutor ordering used on these pages is implemented as a single shared repository function and exercised by tests

**Verification**

- content quality review per page (uniqueness, IB specificity, no AI filler)
- metadata and structured data validation against the matrix and structured-data map, including `Offer.priceRange` and examiner-credential trust signals
- sitemap inclusion review (only published pages indexed; gated-out combos excluded)
- internal-link crawl from home and tutor profiles into the new surfaces
- visual / section-order parity with the design references for the three example pages
- unit / integration test coverage for the publish-gate query, the price-range helper consumption, the examiner-count helper consumption, and the deterministic public tutor ordering
- public-route SEO acceptance checklist pass

## 10.8 `P15-SAVED-001` Saved tutors persistent surface

**Status:** `ready`
**Priority:** `P1`
**Wave:** 1
**Depends on:** `P15-DATA-001`, `P1-MATCH-002`, `P1-PUBLIC-003`

**Goal**

Implement the saved tutors surface so students can view, manage, and return to tutors they have shortlisted across sessions without losing state, and so Compare has a natural entry point from saved items.

**Required source docs**

- `docs/foundations/ia-map-two-sided.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`

**Scope**

- saved tutors list accessible from student navigation ("Saved" in bottom nav on mobile, in primary nav on desktop)
- persistent shortlist state across sessions (not UI-only)
- remove from saved action
- entry point into compare flow from saved list
- entry point into tutor profile from saved list
- empty state when no tutors are saved

**Out of scope**

- saved searches or saved needs
- recommendation engine on saved page
- a full "favorites" system beyond tutor shortlisting

**Acceptance criteria**

- saved tutors persist across sessions and devices for authenticated students
- saved list uses shared MatchRow or PersonSummary components
- compare entry is clearly accessible from saved list
- mobile bottom nav includes "Saved" as one of the 5 destinations per the IA
- removing a tutor from saved updates state immediately

**Verification**

- cross-session persistence review
- mobile navigation integration review
- component reuse review

## 10.9 `P15-PUBLIC-001` Public landing page visual enrichment

**Status:** `draft`
**Priority:** `P2`
**Wave:** 4
**Depends on:** `P1-PUBLIC-001`, `P1-PUBLIC-002`, `P1-PUBLIC-003`, `P1-MATCH-001`

**Goal**

Enrich the four supporting public landing pages (`/how-it-works`, `/trust-and-safety`, `/support`, `/become-a-tutor`) with visual elements so they feel like polished product pages rather than text-only content. By this point the shared components, tutor data, and visual patterns from Phase 1 exist and can be reused.

**Required source docs**

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/content-template-spec-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`

**Scope**

- add brand illustrations or imagery to each public landing page (hero visuals, section illustrations, or photography)
- add sample tutor cards or `PersonSummary` components to `/how-it-works` and `/become-a-tutor` using real tutor data where available
- add a `TrustProofBlock` or equivalent trust signal section to `/trust-and-safety` and `/how-it-works`
- add visual section breaks, icons, or decorative elements using the approved design tokens
- improve visual hierarchy and scannability with card-based layouts where appropriate
- ensure all visual additions are server-rendered and do not degrade SEO or AI discoverability quality

**Out of scope**

- changing page metadata, canonical, or robots behavior (already correct from P1-PUBLIC-001)
- home page visual enrichment (owned by P15-PUBLIC-002)
- tutor profile page changes (owned by P1-PUBLIC-003)
- new copy or content restructuring beyond what visual layout requires
- new shared components — reuse what exists from Phase 1

**Acceptance criteria**

- each of the four landing pages has at least one non-text visual element (image, illustration, tutor card, or branded section)
- pages remain server-rendered with no client-only primary content
- visual additions use the approved design tokens and shared components
- pages pass the public route SEO acceptance checklist after changes
- responsive behavior remains correct at phone, tablet, and desktop breakpoints

**Verification**

- visual review at all three breakpoints
- public route SEO acceptance checklist re-check
- Lighthouse accessibility audit on each page

## 10.10 `P15-PUBLIC-002` Home route visual enrichment

**Status:** `draft`
**Priority:** `P2`
**Wave:** 4
**Depends on:** `P1-PUBLIC-002`, `P1-PUBLIC-003`, `P1-MATCH-002`

**Goal**

Visually enrich the home route (`/`) so it feels like a polished product landing page rather than a text-heavy content page. Replace the current all-text hero, proof card, sample matches, and trust sections with layouts that incorporate imagery, tutor preview cards with real data, branded illustrations or photography, and better visual scannability. By this point Phase 1 tutor data, profile media patterns, and shared components exist and can be reused.

**Required source docs**

- `docs/visual-design/hi-fi-key-screen-comps-v1.html`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`

**Scope**

- add a hero visual element (brand illustration, photography, or product screenshot) alongside the existing hero copy
- replace the static sample match rows with live or representative tutor preview cards using `PersonSummary` or a new tutor preview component, pulling from real approved tutor data where available
- add visual section breaks, iconography, or decorative elements between content blocks to reduce wall-of-text feel
- improve the proof card section with imagery or a visual story element instead of text-only study notes
- add a visual element to the trust proof block (icons, illustrations, or trust badges)
- ensure all visual additions are server-rendered, optimized with `next/image`, and do not degrade SEO or Core Web Vitals
- reduce text density: trim or condense copy where visuals communicate the same idea more effectively

**Out of scope**

- changing page metadata, canonical, or robots behavior (already correct from P1-PUBLIC-002)
- match flow internals
- tutor profile route changes
- supporting landing page enrichment (owned by P15-PUBLIC-001)
- new copy strategy or brand messaging changes beyond trimming for visual balance

**Acceptance criteria**

- the home page has at least three non-text visual elements (hero image, tutor cards, trust icons/illustrations)
- the page no longer feels like a text-heavy document — content blocks are scannable and visually broken up
- sample tutor data is sourced from real approved tutor records or realistic representative data
- all images use `next/image` with appropriate sizing and alt text
- the page remains server-rendered with no client-only primary content
- responsive behavior remains correct at phone, tablet, and desktop breakpoints
- the page passes the public route SEO acceptance checklist after changes

**Verification**

- visual review at all three breakpoints
- Lighthouse performance audit (no CLS regression from image loading)
- public route SEO acceptance checklist re-check
- accessibility audit (alt text, contrast, heading hierarchy)

## 10.11 `P15-QUALITY-001` Phase 1.5 verification and hardening pass

**Status:** `ready`
**Priority:** `P2`
**Wave:** 4
**Depends on:** all implemented Phase 1.5 feature tasks

**Goal**

Run the Phase 1.5 verification pass across compare behavior, noindex posture, shortlist telemetry, tutor roster search performance, accessibility, and responsive quality.

**Required source docs**

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`

**Scope**

- compare route verification
- tutor students route verification
- noindex and sitemap exclusion checks for compare
- shortlist and compare telemetry checks
- tutor roster query performance review
- DS adherence audit: confirm no route-local `.card`, `.chip`, or `.panel`-style CSS, no inline SVGs outside `src/components/ui/**`, no route-local copies of shared reference vocabularies, and no new `Intl.NumberFormat` or currency-code literals outside `src/modules/pricing/**`; if drift is found, raise a sub-task with an `-A` suffix on the offending feature task before marking the phase done

**Out of scope**

- new feature work
- broad Phase 2 planning

**Acceptance criteria**

- compare follows the approved workflow, accessibility, and discoverability rules
- tutor students meets the relationship-first UX bar
- telemetry and query-performance expectations are reviewed explicitly
- unresolved Phase 1.5 blockers are named clearly rather than hidden
- the DS adherence audit produced either a clean result or named follow-up sub-tasks against specific feature tasks

**Verification**

- checklist-driven review across the named source docs

## 10.12 `P15-QUALITY-002` Verification stack baseline (Vitest, Playwright, CI)

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** none

**Goal**

Stand up the Phase 1 testing and CI stack the codebase already commits to in `CLAUDE.md` and `docs/architecture/testing-and-release-architecture-v1.md` so subsequent tasks can ship with executable regression coverage and so the MVP cutover is gated by something other than `pnpm lint:arch`. This task was deferred from `P1-QUALITY-002`, where the absence of any test runner, E2E harness, or CI workflow beyond `architectural-lint.yml` was named as release blocker B2 (see `docs/planning/phase1-release-readiness-v1.md` §2 B2).

**Required source docs**

- `CLAUDE.md`
- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/planning/phase1-release-readiness-v1.md`
- `docs/planning/engineering-guardrails-v1.md`

**Scope**

- install Vitest, Testing Library, jsdom, and `@vitest/ui`; add `vitest.config.ts` and a `pnpm test` script; co-locate tests under `src/test/**` per the existing repo shape
- write a small but real first batch of unit tests against pure helpers (e.g. `getSafeRedirectPath` in `src/lib/auth/allowed-redirects.ts`, `normalizeTimezone` in `src/lib/datetime`, `redactObject`-style helpers in `src/lib/observability/redaction.ts`, `isPreviewDeployment` in `src/lib/seo/site.ts`) so the harness is provably wired up rather than empty
- install `@playwright/test`; add `playwright.config.ts`; add `pnpm test:e2e` and `pnpm test:e2e:install` scripts
- write a logged-out smoke E2E suite covering the public route family and the auth entry: `/`, `/how-it-works`, `/trust-and-safety`, `/support`, `/become-a-tutor`, `/auth/sign-in`. Each test asserts the page renders with the expected title, no console error, and the expected metadata posture (e.g. canonical/robots header) where mechanically checkable
- add a CI workflow at `.github/workflows/ci.yml` running, on every PR and on pushes to `main`: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`. Run Playwright in the same workflow against `pnpm start` after `pnpm build`, scoped to the logged-out smoke suite (no Supabase fixtures required)
- update `CLAUDE.md` **Verification standard** so future task agents run `pnpm test` before reporting

**Out of scope**

- authenticated critical-path E2E coverage (match wizard, booking, lessons, messages, earnings) — those need Supabase test fixtures and should land as a separate sub-task once the harness is in place
- a fixture / seed strategy for Supabase under tests
- preview-environment Playwright runs against Vercel preview URLs
- visual-regression / snapshot testing
- migrating existing manual smoke checklist items into automated tests beyond the public + auth-entry surface

**Acceptance criteria**

- `pnpm test` runs Vitest, finds the unit tests, and passes
- `pnpm test:e2e` runs Playwright against a locally built app and passes the logged-out smoke suite
- `.github/workflows/ci.yml` exists and runs `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`, and the Playwright smoke suite on every PR
- `CLAUDE.md` **Verification standard** lists `pnpm test` (and notes when the E2E suite must also run)
- the unit-test files exist as real tests, not placeholder asserts

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm lint:arch`
- `pnpm test`
- `pnpm test:e2e` against a local production build

**Required manual steps**

- run `pnpm test:e2e:install` once locally (and once in CI on first run) to download Playwright browsers
- if the GitHub Actions runner needs additional environment variables for `pnpm build` to succeed, supply dummy values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in the workflow `env:` block; do not put real secrets in workflow files

**Local testing checklist**

- run `pnpm test` and confirm the unit tests pass
- run `pnpm build && pnpm start` in one terminal, then `pnpm test:e2e` in another; confirm the smoke suite is green against the live local build
- confirm CI green on a no-op PR before merging the workflow into `main`

## 10.13 `P15-PUBLIC-003` Public privacy-policy and terms routes

**Status:** `ready`
**Priority:** `P1`
**Wave:** 4
**Depends on:** `P1-PUBLIC-002`, `P1-PUBLIC-003`

**Goal**

Add the publicly indexable legal surfaces (`/privacy-policy` and `/terms`) so auth, sign-up, payment-consent, and marketing flows have canonical URLs to link to and so the product satisfies the basic legal-discoverability expectation external listings, app-store submissions, and review processes assume. This task was deferred from `P1-QUALITY-002` as release blocker B3 (see `docs/planning/phase1-release-readiness-v1.md` §2 B3). Note that the existing `/privacy` route is the authenticated `(account)` privacy snapshot and is intentionally non-indexable; the legal page is a different surface.

**Required source docs**

- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/architecture/metadata-matrix-v1.md`

**Scope**

- add `src/app/(public)/privacy-policy/page.tsx` and `src/app/(public)/terms/page.tsx` consuming `buildStaticPublicRouteMetadata` and the shared `JsonLd`/`StructuredData` pattern used by the other Class A pages
- register both routes in `src/lib/seo/public-routes.ts` so `sitemap.ts` includes them
- author the legal copy in shared modules (`src/modules/legal/**` or equivalent) rather than inlining 1000-line strings in the route file; treat the copy itself as a content artifact reviewed by the human, not an architectural decision
- update `src/app/robots.ts` if either path needs an explicit allow rule (it should not — `robots.ts` only disallows; the default is allow)
- add navigation references to the legal pages from auth flows (sign-in, sign-up consent), the booking-checkout consent surface, the public footer, and the account `/privacy` snapshot ("see the public Privacy Policy")
- ensure both routes carry `LegalDocument` or appropriate `WebPage` JSON-LD per the structured-data map

**Out of scope**

- the *content* of the legal copy (this task wires up the surface and inserts placeholder copy with clear `TODO(legal)` markers; the human owns the actual policy text and signs off before merging)
- region-specific variants (GDPR-vs-CCPA-vs-other) — Phase 1.5 ships one canonical page each
- consent-management UI (cookie banner, granular consent) — separate task
- DSAR / data-subject-request automation (already covered by `docs/data/data-subject-request-workflow-v1.md`)

**Acceptance criteria**

- `/privacy-policy` and `/terms` are reachable, server-rendered, indexable, and emit valid JSON-LD
- both routes appear in `sitemap.xml` and are not disallowed by `robots.txt`
- both routes pass every item in `docs/planning/public-route-seo-acceptance-checklist-v1.md` §7
- footer / auth / booking-consent surfaces link to both routes
- the authenticated `(account)/privacy` route links out to the public `/privacy-policy` so users can find the canonical legal text from inside the product
- legal copy is sourced from a shared content module, not duplicated in route files

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm lint:arch`
- public-route SEO checklist pass for both new routes
- manual verification that footer / auth / booking-consent links land on the right pages

**Required manual steps**

- the human supplies the actual legal copy (or signs off on placeholder copy explicitly marked as draft) before merging; do not ship to production with `Lorem ipsum` content

**Local testing checklist**

- `/privacy-policy` and `/terms` render at `http://localhost:3000`
- view-source confirms `<script type="application/ld+json">` blocks are present and valid JSON
- `/sitemap.xml` lists both URLs
- `/robots.txt` does not disallow either path
- the public footer and the authenticated `/privacy` snapshot link to `/privacy-policy`

## 10.14 `P15-FOUND-001` Brand icon and favicon assets

**Status:** `ready`
**Priority:** `P2`
**Wave:** 4
**Depends on:** none

**Goal**

Add the Mentor IB icon and favicon assets so browsers, mobile devices, search results, and home-screen installs render the brand mark instead of falling back to a 404 favicon or a generic glyph. This task was deferred from `P1-QUALITY-002` as release blocker B4 (see `docs/planning/phase1-release-readiness-v1.md` §2 B4).

**Required source docs**

- `docs/visual-design/hi-fi-direction-boards-v1.md`
- `docs/architecture/seo-and-ai-discoverability-v1.md`
- Next.js metadata-files convention (icons, app icons, favicons)

**Scope**

- add `src/app/icon.png` (default app icon, square, recommended 512×512 source rendered by Next.js into multiple sizes)
- add `src/app/apple-icon.png` (Apple touch icon, square, 180×180)
- add `src/app/favicon.ico` (legacy favicon, 32×32)
- if a dark-mode variant is needed, follow the Next.js `icon-dark.png` convention rather than inlining `<link>` tags in `layout.tsx`
- regenerate or confirm the existing `src/app/opengraph-image.tsx` produces a brand-correct OG image

**Out of scope**

- redesigning the brand mark itself (use the approved mark from `docs/visual-design`)
- splash screens for native app installs
- multiple icon variants per route family
- a logo component in `src/components/ui/**` (separate concern)

**Acceptance criteria**

- the four icon assets exist at the canonical Next.js paths
- a freshly built app serves favicon, app icon, and apple icon at the expected URLs (`/favicon.ico`, `/icon`, `/apple-icon`)
- the home page rendered in a browser shows the brand favicon in the tab and bookmark
- `pnpm build` output references the new icon files
- `opengraph-image.tsx` continues to render correctly and uses the brand palette

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm lint:arch`
- manual verification in Chrome, Safari, and one mobile browser that the favicon and apple icon render

**Required manual steps**

- the human supplies the source PNG / ICO files (or signs off on a generated set) before merging
- confirm the icons are exported at the correct dimensions; do not commit an oversized source as `favicon.ico`

**Local testing checklist**

- `/favicon.ico`, `/icon`, `/apple-icon` are reachable and return the expected file types
- the browser tab on `http://localhost:3000` shows the Mentor IB mark
- iOS Safari "Add to Home Screen" preview shows the apple-icon mark, not a generic glyph

## 10.15 `P15-DATA-001-A` Shortlist and compare discovery telemetry events

**Status:** `ready`
**Priority:** `P2`
**Wave:** 4
**Depends on:** `P15-DATA-001`, `P15-COMP-001`, `P15-COMP-002`

**Goal**

Wire the discovery-family telemetry events the analytics architecture lists for shortlist and compare so the Phase 1.5 surfaces produce the signal the product expects them to produce. This sub-task was raised by the `P15-QUALITY-001` verification pass: the compare and saved surfaces ship without any `result_shortlisted` or `compare_opened` instrumentation, even though both events are part of the canonical matching/discovery family in `docs/architecture/analytics-and-product-telemetry-architecture-v1.md` §11.3.

**Required source docs**

- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`

**Scope**

- extend the `ProductEvent` union in `src/lib/analytics/events.ts` with `result_shortlisted` and `compare_opened`, following the same safe-context property discipline already used for `match_submitted` and `booking_request_submitted`
- emit `result_shortlisted` from the shortlist mutation boundary (`src/modules/lessons/shortlist-actions.ts`) on the `add` path only, with safe context properties such as `surface_source` (results, saved, profile), a stable `learning_need_id`/`match_run_id` reference, and an `intent_outcome` for success vs cap-rejection
- emit `compare_opened` as a client event on `/compare` mount with `compare_count`, `compare_cap`, and `has_learning_need` — keeping it on the client side per §10.4 of the analytics architecture (pure UI exploration)
- ensure both events route through the existing analytics client/server modules; do not introduce a second emission path
- update or add unit tests under `src/test/**` that assert the event names, the property shapes, and the safe-context redaction rules (no raw learning-need text, no tutor display names, no message bodies)

**Out of scope**

- compare/shortlist *interaction* events beyond add and open (e.g. `compare_column_removed`, `compare_booking_clicked`) — those belong to a later iteration
- the broader booking, lessons, and messaging event families
- a generalized event-emission framework or queueing layer
- PostHog dashboard or funnel configuration on the destination side
- back-filling historical shortlist/compare activity

**Acceptance criteria**

- `result_shortlisted` fires exactly once per successful shortlist add, with no payload from free-text fields
- `compare_opened` fires on `/compare` mount and is debounced/guarded against double-fire on client navigations
- both events appear in the `ProductEvent` union and pass typecheck against the existing safe-context discipline
- the redaction tests under `src/test/**` cover the new properties so future drift is caught at unit-test time
- the audit script and `pnpm lint:arch` remain clean
- the analytics architecture doc is referenced (not modified) in the event names and property choices

**Verification**

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm lint:arch`
- `pnpm test`
- manual: trigger a shortlist add and a `/compare` visit locally with `NEXT_PUBLIC_POSTHOG_*` set to a development project and confirm the events arrive with the expected property shape

**Required manual steps**

- the human confirms the destination PostHog project before merging so the new event names register against the correct environment

**Local testing checklist**

- shortlist a tutor from results and confirm `result_shortlisted` is sent with `surface_source: "results"`
- shortlist a tutor from a public tutor profile and confirm `surface_source: "tutor_profile"`
- visit `/compare` with and without an active learning need and confirm `compare_opened` fires once per visit with the expected `compare_count`/`compare_cap`
- run `pnpm test` and confirm the new redaction assertions pass

## 11. Task Drafting Rules For Follow-Up

If one of the tasks above needs to be split further:

- keep the original task id as the parent
- create child tasks with suffixes such as `-A`, `-B`, `-C`
- preserve the same required source docs unless the split changes the decision area
- split by coherent outcome, not by arbitrary file ownership alone

If a `draft` task becomes clearer during Phase 1 execution, promote it to `ready` before implementation starts.

## 12. What Should Happen Next

After this Phase 1.5 pack:

1. keep Phase 1 as the active implementation priority unless the team explicitly moves to Phase 1.5 work
2. use this file when the product is ready to add Compare and Tutor Students without reopening architecture
3. create `docs/planning/phase2-task-pack-v1.md` as the next planning artifact when Phase 1 and Phase 1.5 boundaries are sufficiently stable

## 13. Final Recommendation

Mentor IB should treat this pack as the bounded bridge between MVP and broader Phase 2.

The operating model is:

- Wave 1 makes Compare real by adding shortlist state and entry points
- Wave 2 delivers the actual comparison decision surface
- Wave 3 delivers tutor student continuity without turning tutors into CRM operators
- Wave 4 verifies that the added surfaces are fast, safe, accessible, and correctly non-indexable where required

That keeps the product moving forward without letting the post-MVP backlog dissolve into generic marketplace sprawl.
