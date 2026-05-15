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
| 1 | `P2-NOTIF-PREF-001` | `draft` | `P2` | 2 | Notification preferences and channel controls |
| 2 | `P2-MSG-001` | `ready` | `P2` | 3 | Rich messaging behaviors wave |
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
- per-conversation mute and archive controls (owned by `P2-MSG-001`)
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
