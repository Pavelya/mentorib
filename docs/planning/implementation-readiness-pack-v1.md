# Mentor IB Implementation Readiness Pack v1

**Date:** 2026-04-07
**Status:** Standalone bridge from approved design to build planning
**Scope:** MVP scope, route map, build order, acceptance criteria, and QA rules

## 1. Why This Document Exists

This document exists to turn the approved Mentor IB design system and screen work into an implementation-ready product pack.

It is intentionally written to be:

- standalone
- repo-ready
- technology-agnostic
- usable as the transition point from design into production planning

This is not the architecture document.

This is the product and UX implementation brief that architecture should respond to.

## 2. Current Project State

The design-definition phase is approved.

That approved phase now includes:

- product positioning and UX strategy
- two-sided ecosystem logic
- service blueprint and canonical object model
- cross-role journey inventory
- IA and wireframes
- shared component specifications
- hi-fi desktop screens
- responsive and mobile hi-fi screens
- final reusable design-system extraction

The next job is not more exploration.

The next job is to translate the approved system into a realistic build plan.

A dedicated planning companion now exists for future SEO work:

- `docs/planning/seo-implementation-foundation-v1.md`
- `docs/planning/seo-route-ownership-map-v1.md`
- `docs/planning/seo-foundation-task-pack-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/planning/phase1-class-a-route-seo-task-pack-v1.md`

A dedicated implementation-agent index now exists for routing future AI agents to the correct source docs:

- `docs/planning/agent-implementation-decision-index-v1.md`

A dedicated execution playbook now exists for turning the approved task packs into actual implementation workflow:

- `docs/planning/agent-execution-playbook-v1.md`

A dedicated engineering guardrails doc now exists for hardcoded-value rules, dependency discipline, repo hygiene, and verification policy:

- `docs/planning/engineering-guardrails-v1.md`

A dedicated implementation baseline now exists for freezing the repo bootstrap and toolchain choices:

- `docs/planning/implementation-baseline-v1.md`

A dedicated service and SDK baseline now exists for freezing the approved provider stack and dependency posture:

- `docs/planning/service-dependency-baseline-v1.md`

A dedicated implementation backlog index now exists for structuring the actual task packs:

- `docs/planning/implementation-backlog-index-v1.md`

A dedicated end-to-end flow and policy audit now exists for checking whether the current docs actually cover the real operating journeys and failure cases:

- `docs/planning/end-to-end-use-case-gap-audit-v1.md`

The active Phase 1 execution pack now also exists:

- `docs/planning/phase1-mvp-task-pack-v1.md`

The next bounded planning pack now also exists:

- `docs/planning/phase1-5-task-pack-v1.md`

The broad Phase 2 planning pack now also exists:

- `docs/planning/phase2-task-pack-v1.md`

## 3. Canonical Approved Artifact Set

These docs should now be treated as the canonical design source pack:

- `docs/research/ui-ux-research-fresh-start.md`
- `docs/research/ui-ux-research-two-sided-ecosystem.md`
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/foundations/cross-role-journey-inventory-v1.md`
- `docs/foundations/ux-object-model.md`
- `docs/foundations/ia-map-two-sided.md`
- `docs/wireframes/low-fi-wireframe-spec.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/component-specs-phase2-v1.md`
- `docs/visual-design/hi-fi-key-screen-comps-v1.html`
- `docs/visual-design/hi-fi-key-screen-comps-wave2-v1.html`
- `docs/design-system/design-system-spec-final-v1.md`

If future documents conflict with this set, this set wins unless a later document is explicitly marked as an approved revision.

## 4. Product Slice Recommendation

The recommended implementation sequence remains:

### Phase 1 MVP

- Home
- Match Flow
- Results
- Tutor Profile
- Booking
- Messages
- Tutor Overview
- Tutor Lessons
- Tutor Schedule

### Phase 1.5

- Compare
- Tutor Students

### Phase 2

- Tutor Application
- deeper tutor profile management
- additional reporting and operational layers

## 5. Why This Scope Is Recommended

This scope captures the core value loop:

1. student identifies the problem
2. student sees fit-based tutor matches
3. student evaluates and books
4. tutor receives and manages lessons
5. both roles remain connected through shared messages and lesson continuity

It is the smallest slice that proves:

- the matching-first product model
- the one-ecosystem design principle
- the shared lesson and scheduling system

It avoids starting with:

- lower-value edge tooling
- broader tutor admin surfaces
- secondary reporting complexity

## 6. Route Map For Implementation

## 6.1 Public and student routes

### Core

- `/`
- `/match`
- `/results`
- `/tutors/:slug`
- `/book/:tutorOrLessonContext`
- `/messages`
- `/lessons`
- `/notifications`
- `/settings`
- `/privacy`
- `/billing`

### Secondary

- `/compare`

## 6.2 Tutor routes

### Core

- `/tutor/overview`
- `/tutor/lessons`
- `/tutor/schedule`
- `/tutor/messages`
- `/tutor/earnings`

### Secondary

- `/tutor/students`
- `/tutor/apply`

## 6.3 Routing rule

Do not structure the product like two separate applications unless the technical system absolutely requires it.

The UI and UX must continue to behave like one product with different modes.

## 7. Build Layers

The recommended build order is by system layer, not by isolated page ownership.

### Layer 1: Foundations

- typography tokens
- color tokens
- spacing tokens
- surface tokens
- radius and shadow tokens
- icon system
- responsive breakpoints

### Layer 2: Primitives

- button
- icon button
- text field
- textarea
- select and multi-select
- search field
- filter pill
- status badge
- tab bar
- panel
- inline notice
- avatar

### Layer 3: Continuity anchors

- need summary bar
- lesson summary
- person summary
- context chip row

### Layer 4: Core composites

- match row
- trust proof block
- lesson card
- lesson detail
- schedule surface
- availability preview
- conversation shell
- conversation list item
- checklist panel
- metric tile

### Layer 5: Screen patterns

- home hero
- match-flow step
- results list
- tutor-profile decision
- booking flow
- tutor overview
- tutor lessons hub
- tutor schedule pattern

## 8. Shared Component Build Order

The recommended build order for reusable components is:

1. `Button`
2. `Panel`
3. `StatusBadge`
4. `Avatar`
5. `FilterPill`
6. `SearchField`
7. `TabBar`
8. `NeedSummaryBar`
9. `PersonSummary`
10. `MatchRow`
11. `LessonSummary`
12. `LessonCard`
13. `ScheduleSurface`
14. `ConversationShell`
15. `ConversationListItem`
16. `TrustProofBlock`
17. `LessonDetail`
18. `MetricTile`
19. `ChecklistPanel`
20. `CompareTable`
21. `Uploader`

Reason:

- the list moves from high-leverage primitives to continuity anchors, then to the core shared workflows
- it preserves the shared-ecosystem logic
- it reduces duplication pressure when screens start shipping

## 9. Screen Build Order

The recommended screen implementation order is:

1. Home
2. Match Flow
3. Results
4. Tutor Profile
5. Booking
6. Messages
7. Tutor Overview
8. Tutor Lessons
9. Tutor Schedule
10. Compare
11. Tutor Students
12. Tutor Application

## 10. Dependency Logic

This is the dependency chain that matters most:

### Student conversion path

`Home` -> `Match Flow` -> `Results` -> `Tutor Profile` -> `Booking`

### Shared continuity path

`Booking` -> `Messages` -> `Lesson`

### Tutor operation path

`Tutor Overview` -> `Tutor Lessons` -> `Tutor Schedule`

### Shared-object dependency path

`NeedSummaryBar` -> `MatchRow` -> `PersonSummary` -> `LessonCard` -> `ScheduleSurface` -> `ConversationShell`

## 11. MVP Acceptance Criteria

## 11.1 Home

Must:

- route primarily into matching, not into a generic directory
- keep the problem chips above the fold on desktop and mobile
- show sample fit evidence in row form rather than card-grid form
- establish the approved visual direction clearly

## 11.2 Match Flow

Must:

- use one major decision cluster per step
- keep need context visible
- remain low-friction on mobile
- avoid giant form behavior

## 11.3 Results

Must:

- present ranked tutor fits in stacked `MatchRow` form
- explain ranking in plain language
- allow lightweight save and compare actions
- preserve the active need context at the top

## 11.4 Tutor Profile

Must:

- put fit and trust before biography
- show booking confidence in the first viewport
- preserve need context when entered from matching
- make message and save secondary to booking without hiding them

## 11.5 Booking

Must:

- keep timezone visible wherever scheduling decisions are made
- keep the schedule surface large and readable
- show policy before the request is submitted
- preserve lesson summary context throughout the flow

## 11.6 Messages

Must:

- use the same shell for student and tutor modes
- preserve person and lesson context in the thread header
- avoid generic social-chat styling
- keep phone behavior state-based but visibly related

## 11.7 Tutor Overview

Must:

- answer "what should I do now?"
- remain lesson-led, not metric-led
- keep tutor mode visibly related to student mode
- avoid equal-weight dashboard tiles everywhere

## 11.8 Tutor Lessons

Must:

- use the shared lesson object grammar
- adapt actions by role and state without changing the visual system
- preserve lesson detail continuity
- avoid admin-table behavior

## 11.9 Tutor Schedule

Must:

- use the same scheduling grammar as booking
- support recurring availability plus exceptions
- keep student-visible preview tied to the editor
- remain usable on mobile

## 12. Secondary Acceptance Criteria

## 12.1 Compare

Must:

- preserve one active need
- cap comparison scope to a small shortlist
- use stacked compare cards on phone instead of tiny tables

## 12.2 Tutor Students

Must:

- remain identity-first
- avoid CRM-table energy
- connect clearly into lessons and messages

## 12.3 Tutor Application

Must:

- feel staged and finite
- keep one major task per step
- use inline guidance on mobile
- avoid giant dashboard-form behavior

## 13. Responsive QA Checklist

Every implemented screen should be checked for:

- continuity anchor remains visible
- primary CTA remains obvious
- layout stack still preserves hierarchy
- no compressed unreadable table behavior
- no desktop-only assumptions in the interaction
- no separate mobile visual language

## 14. Accessibility QA Checklist

Every implemented screen should be checked for:

- explicit status text
- readable date and timezone text
- focus-visible clarity
- keyboard order following reading order
- compare and schedule states not relying on color only
- button labels being explicit and understandable

## 15. Design QA Checklist

Every implemented screen should be checked against the anti-pattern list:

- does it look like a generic AI tool?
- does it look like a marketplace template?
- does it look like an enterprise dashboard?
- does it split student and tutor into different visual worlds?
- does it replace fit reasoning with cards, stars, and price?
- does it bury context below the fold?

If the answer is yes to any of these, the implementation is drifting from the approved system.

## 16. Delivery Strategy Recommendation

The safest delivery sequence is:

1. foundations and primitives
2. continuity anchors
3. student conversion path
4. shared messages
5. tutor operational path
6. secondary decision and management screens

This sequence protects the shared-system logic and reduces the risk of role-based fragmentation.

## 17. Suggested Workstream Split

If work needs to happen in parallel, split by stable surface families rather than by random page ownership.

Recommended split:

### Workstream A

- foundations
- primitives
- continuity anchors

### Workstream B

- student conversion screens

### Workstream C

- shared lesson and messaging surfaces

### Workstream D

- tutor operational screens

This keeps write scopes and conceptual ownership cleaner than splitting by arbitrary routes.

## 18. Architecture-Phase Inputs

When the architecture discussion starts, it should respond to this pack by answering:

- how the shared component system will be implemented
- how student and tutor modes will be structured without UX fragmentation
- how shared lesson, schedule, and conversation objects will be represented
- how responsive behavior will be supported without component drift

Architecture should not redefine the approved product experience.

It should serve it.

## 19. Immediate Next Actions

The next recommended actions are:

1. freeze the approved design pack
2. approve this implementation-readiness pack
3. decide the exact MVP cut for phase 1 versus phase 1.5
4. then move into architecture planning and implementation planning

## 20. Final Rule

If implementation planning starts from routes alone instead of from shared objects, shared components, and approved screen patterns, the product will drift.

This pack should be used to prevent that.
