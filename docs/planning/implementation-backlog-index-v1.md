# Mentor IB Implementation Backlog Index v1

**Date:** 2026-04-10
**Status:** Master backlog routing document for converting the approved docs pack into concrete implementation task packs
**Scope:** backlog structure, phase grouping, workstream ownership, task-pack sequencing, readiness rules, and agent-safe conventions for creating implementation tasks from the existing architecture and design docs

## 1. Why This Document Exists

Mentor IB now has:

- product and UX research
- shared object and IA foundations
- wireframes and hi-fi design direction
- final design-system rules
- architecture, security, SEO, privacy, data, and testing docs
- an agent implementation decision index
- a reusable implementation task template

That means the project is no longer blocked on broad architecture.

What is needed now is a practical answer to:

**How should implementation work be organized so AI agents can pick up the right tasks in the right order without creating drift, duplication, or giant unfocused tickets?**

Without a master backlog index, teams usually drift into:

- one giant flat task list
- route-by-route tickets with no system layering
- SEO and public-route work split from the product backlog
- data work happening without matching app tasks
- tasks that are too large for one clean agent pass
- phase 1 and phase 2 work mixed together
- agents not knowing which task pack should exist next

This document exists to prevent that.

## 2. Why This Lives In `docs/planning`

This document belongs in `docs/planning` because it is not a product source-of-truth doc and not an architecture decision doc.

It is the planning layer that sits on top of:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/planning/implementation-task-template-v1.md`
- `docs/planning/implementation-readiness-pack-v1.md`

It translates the approved docs pack into a backlog structure.

It does not redefine the architecture itself.

## 3. What This Document Does Not Redefine

This document does not replace:

- the approved UX strategy
- the design system
- the route architecture
- the data model
- the privacy and security rules
- the SEO architecture
- the implementation task template

It does not contain the actual detailed implementation tasks yet.

Those should live in dedicated task-pack docs created after this index.

If there is a conflict:

- source-of-truth decisions come from the dedicated design, architecture, and data docs
- task format comes from `docs/planning/implementation-task-template-v1.md`
- task routing to source docs comes from `docs/planning/agent-implementation-decision-index-v1.md`

## 4. Core Recommendation

Mentor IB should use a **layered backlog system**, not one flat backlog.

The practical rule is:

1. one master backlog index defines the structure
2. one Phase 1 MVP task pack contains the first implementation-ready work
3. later phase packs stay lighter and more provisional until Phase 1 is moving
4. every concrete task uses the implementation task template
5. tasks are grouped by coherent workstreams, not by random pages

This keeps the backlog small enough for agents to reason about and large enough to reflect the real system shape.

## 5. Canonical Backlog Structure

The backlog should be organized in this order:

1. master backlog index
2. Phase 1 MVP task pack
3. Phase 1.5 task pack
4. Phase 2 task pack
5. optional supporting packs only if a real planning need appears

The canonical planned files are:

- `docs/planning/implementation-backlog-index-v1.md`
- `docs/planning/phase1-mvp-task-pack-v1.md`
- `docs/planning/phase1-5-task-pack-v1.md`
- `docs/planning/phase2-task-pack-v1.md`

Optional later files only if needed:

- `docs/planning/cross-cutting-infrastructure-task-pack-v1.md`
- `docs/planning/implementation-backlog-review-guide-v1.md`

The optional files should not be created unless the real backlog becomes difficult to navigate without them.

## 6. Backlog Status Vocabulary

Use these backlog states consistently.

## 6.1 `planned`

The task pack or workstream is known and expected, but detailed tasks are not written yet.

## 6.2 `draft`

Tasks exist but still need source-doc, scope, or acceptance cleanup.

## 6.3 `ready`

Tasks are implementation-ready for an AI agent.

## 6.4 `in_progress`

The task or workstream is being actively implemented.

## 6.5 `blocked`

A missing decision, dependency, or environment issue prevents progress.

## 6.6 `done`

The task or workstream is complete and verified.

## 6.7 `deferred`

The work is intentionally postponed to a later phase.

## 7. Phase Structure

## 7.1 Phase 1 MVP

This is the first real implementation phase.

It should cover the smallest coherent system that proves:

- matching-first product value
- one shared student/tutor ecosystem
- shared lesson and scheduling continuity
- public tutor discovery
- booking and messaging fundamentals

Primary product surfaces:

- Home
- Match Flow
- Results
- Tutor Profile
- Booking
- Messages
- Tutor Overview
- Tutor Lessons
- Tutor Schedule

## 7.2 Phase 1.5

This is the next useful product layer after the MVP loop works.

Primary surfaces:

- Compare
- Tutor Students

These should stay lighter and more provisional until Phase 1 tasks are drafted.

## 7.3 Phase 2

This phase should stay intentionally broad until MVP implementation generates real constraints.

Current expected areas:

- Tutor Application
- deeper tutor profile management
- broader reporting and operations
- richer messaging behavior
- additional growth or optimization work

## 8. Workstream Structure

Backlog work should be grouped by system workstreams.

## 8.1 Foundations and app shell

Examples:

- app shell
- root layout and route-group skeleton
- shared providers
- core design tokens and primitives
- navigation skeleton
- shared loading, error, and empty-state patterns

Why this is one workstream:

- it creates the shared product frame that every other surface depends on

## 8.2 Auth and setup

Examples:

- magic link and Google login entry
- auth callback handling
- role selection
- shared account bootstrap
- protected route posture

Why this is one workstream:

- auth and setup are one entry funnel into the shared ecosystem

## 8.3 Data and schema foundations

Examples:

- baseline schema tables
- migrations
- RLS
- reference data
- DTO foundations
- repository and domain boundaries

Why this is one workstream:

- the app surfaces should build on stable data foundations instead of inventing schema on the fly

## 8.4 Public routes and SEO

Examples:

- `/`
- `/how-it-works`
- `/trust-and-safety`
- `/support`
- `/become-a-tutor`
- `/tutors/[slug]`
- route metadata
- sitemap and robots behavior

Why this is one workstream:

- public route quality, metadata, and discoverability are tightly connected

## 8.5 Match and discovery

Examples:

- match flow
- results
- public or authenticated search surfaces
- match DTOs
- ranking display logic

Why this is one workstream:

- this is the core student conversion path

## 8.6 Tutor profile and booking

Examples:

- tutor profile details
- trust proof display
- booking context
- booking request flow
- schedule previews
- calendar export

Why this is one workstream:

- profile evaluation and booking are one decision flow for students

## 8.7 Messages and lessons

Examples:

- conversation list
- message thread
- send message
- lesson list
- lesson detail
- reminders and lesson continuity surfaces

Why this is one workstream:

- these are the shared continuity objects across student and tutor modes

## 8.8 Tutor operations

Examples:

- tutor overview
- tutor lessons
- tutor schedule
- tutor messages
- later tutor students

Why this is one workstream:

- these are the tutor operational views built on shared underlying objects

## 8.9 Cross-cutting quality and release

Examples:

- testing foundations
- observability and incident hooks
- analytics and telemetry wiring
- accessibility verification
- release readiness checks

Why this is one workstream:

- these tasks are distributed across the build but should still have a visible planning lane

## 9. Phase 1 Recommended Backlog Order

Phase 1 tasks should be created in roughly this order:

1. foundations and app shell
2. auth and setup
3. data and schema foundations
4. public routes and SEO foundations
5. match and discovery
6. tutor profile and booking
7. messages and lessons
8. tutor operations
9. cross-cutting quality and release

This is not a hard rule for parallel work.

It is the default order that best protects the shared-system architecture.

## 10. Dependency Rules

When drafting the actual task packs:

- do not create page tasks before the route family is clear
- do not create public route tasks without SEO/public DTO ownership
- do not create feature tasks that assume schema details without naming the schema source docs
- do not create message or booking tasks without auth and object-level access rules
- do not create tutor operations tasks as if they are a separate product
- do not separate SEO into a parallel feature backlog disconnected from route work
- do not make every task depend on every other task

Prefer explicit dependencies like:

- auth and setup before authenticated workflows
- baseline data tables before higher-level feature flows
- public tutor profile DTO before public tutor profile page polish
- booking domain mutation before reminder jobs
- message send action before typing indicator or reactions

## 11. Task Pack Conventions

Every future task pack should:

- use `docs/planning/implementation-task-template-v1.md`
- route source-doc selection through `docs/planning/agent-implementation-decision-index-v1.md`
- group tasks by workstream
- keep Phase 1 tasks implementation-ready and concrete
- keep later phase tasks lighter until they are closer to execution
- state dependencies only where they materially matter
- avoid giant umbrella tasks

Every task pack should include:

- task id
- goal
- required source docs
- scope
- acceptance criteria
- verification expectations
- open questions if any

## 12. Readiness Rules For Actual Task Creation

Create a concrete task only when:

- the source docs are already written
- the goal is narrow enough for one agent pass
- the route/component/data boundary is clear
- acceptance criteria can be reviewed
- test expectations are named

Do not create a ready task when:

- a key product decision is still unresolved
- the work spans too many layers at once
- the task asks the agent to invent product or legal policy
- the task would touch unrelated workstreams by default

If a task is useful but not ready, keep it as `planned` or `draft`.

## 13. What The Master Backlog Index Should Not Do

This index should not:

- contain every actual implementation task inline
- duplicate the architecture docs
- become a second design spec
- become a route-by-route changelog
- become a vendor-selection discussion
- be used as a substitute for phase task packs

Its job is to keep the future packs organized.

## 14. Immediate Next Artifacts

The first required pack after this index was:

1. `docs/planning/phase1-mvp-task-pack-v1.md`

That file now exists and should be treated as the active Phase 1 execution pack.

The next bounded pack after that was:

1. `docs/planning/phase1-5-task-pack-v1.md`

That file now also exists and should stay lighter than the Phase 1 pack.

The final baseline phase pack is now:

1. `docs/planning/phase2-task-pack-v1.md`

That file now also exists and should remain broader than the earlier packs.

The canonical phase task-pack set is now complete.

Additional planning artifacts should be created only if execution reveals a real need for more navigation or coordination support.

## 15. AI-Agent Planning Rules

Future AI agents should:

- use this index to decide which task pack to open or create next
- keep Phase 1 task slices small and coherent
- cite source docs in every real task
- preserve the one-ecosystem student/tutor rule
- avoid creating speculative later-phase tasks in too much detail
- update the backlog pack, not this index, when individual tasks are drafted

Agents should not:

- dump all future work into one giant document
- create separate backlogs for public SEO, student app, tutor app, and data platform unless a real planning need appears
- bypass the implementation task template
- mark a task `ready` without source docs and acceptance criteria
- create a backlog structure that hides shared objects behind page-only ownership

## 16. Final Recommendation

Mentor IB should treat this document as the master routing layer for implementation planning.

The operating model is:

- this doc defines the backlog structure
- the decision index routes agents to source docs
- the task template standardizes every real task
- the phase task packs hold the actual implementation work

That should keep the backlog usable for AI agents and stable enough for a long implementation run.
