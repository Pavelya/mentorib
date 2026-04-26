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
| 1 | `P15-SEO-001` | `ready` | `P1` | 2 | Subject and service SEO landing pages |
| 1 | `P15-STUD-001` | `ready` | `P1` | 3 | Tutor students roster DTO and query path |
| 2 | `P15-COMP-001` | `ready` | `P1` | 1 | Compare entry affordances on student surfaces |
| 2 | `P15-SAVED-001` | `ready` | `P1` | 1 | Saved tutors persistent surface |
| 2 | `P15-STUD-002` | `ready` | `P1` | 3 | Tutor students route and roster surface |
| 3 | `P15-COMP-002` | `ready` | `P1` | 2 | Compare route and decision surface |
| 3 | `P15-STUD-003` | `draft` | `P1` | 3 | Tutor student relationship detail surface |
| 4 | `P15-PUBLIC-001` | `draft` | `P2` | 4 | Public landing page visual enrichment |
| 4 | `P15-PUBLIC-002` | `draft` | `P2` | 4 | Home route visual enrichment |
| 5 | `P15-QUALITY-001` | `ready` | `P2` | 4 | Phase 1.5 verification and hardening pass |

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

**Status:** `draft`
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

**Scope**

- selected-student detail view within `/tutor/students` by default
- overview of active relationship context
- clear connection to lessons and messages
- reuse of shared person and lesson-summary patterns

**Out of scope**

- notes authoring
- report authoring
- file management
- a brand-new route family unless the route architecture is explicitly revised

**Acceptance criteria**

- the detail surface behaves like an extension of the roster, not a separate back-office tool
- only role-safe relationship context is shown
- lessons and messages remain the primary continuity anchors
- the interaction model is explicit before implementation begins

**Verification**

- detail interaction review
- DTO and privacy review

## 10.7 `P15-SEO-001` Subject and service SEO landing pages

**Status:** `ready`
**Priority:** `P1`
**Wave:** 2
**Depends on:** `P1-SEO-001`, `P1-DATA-002`, `P1-PUBLIC-003`

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

**Scope**

- `/subjects/[subject-slug]` — subject pages (e.g., `/subjects/biology-hl`)
- `/services/[need-slug]` — problem-led pages (e.g., `/services/tok-essay-help`)
- `/subjects/[subject-slug]/[need-slug]` — curated combinations only (e.g., `/subjects/english-a-io/oral-practice`)
- server-rendered with unique copy per page
- quality gate: only publish pages with real tutor coverage and useful unique content
- metadata, canonical URLs, and Open Graph per page
- JSON-LD structured data where appropriate
- internal linking from home, subject pages, and tutor profiles
- AI discoverability through clear entity structure and people-first content

**Out of scope**

- mass-generated thin landing pages
- pages for every possible subject-need combination
- editorial resource hub (Phase 2+)

**Acceptance criteria**

- each page answers: what the need is, who it's for, when support matters, what kind of tutor fits, and what action to take next
- pages with insufficient tutor coverage or thin content are not published
- metadata is unique per page and follows the metadata matrix
- pages are server-rendered with meaningful content in the initial HTML
- internal links between subject, service, and tutor pages are crawlable HTML links
- structured data matches visible page content (no fake or hidden markup)

**Verification**

- content quality review per page
- metadata and structured data validation
- sitemap inclusion review
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
