# Mentor IB Design System — Component Inventory v1 (skeletal)

**Date:** 2026-04-27
**Status:** Skeletal inventory created in `P1-DS-FOUND-001-C`. Finalized in `P1-DS-FOUND-001-E`.
**Scope:** the source of truth for which DS primitives and shared components exist, what variants they expose, and which route-family drift sites the `P1-DS-FOUND-001-D*` cleanup tasks must remove.

## 1. Why this document exists

`docs/design-system/agent-ui-rules.md` makes it a hard rule that any task adding a new DS primitive, variant, or token must update this inventory in the same commit. Without a living inventory, agents and reviewers cannot tell whether a needed primitive already exists or whether route-local CSS is allowed to remain.

This file is intentionally skeletal at this stage:

- `P1-DS-FOUND-001-C` populates the primitives table and the per-route-family drift checklist below
- `P1-DS-FOUND-001-D1..D5` consume the drift checklist and remove the route-local CSS site by site
- `P1-DS-FOUND-001-E` polishes this document, cross-references the tokens cheatsheet, and reconciles it against the canonical specs

## 2. Source-of-truth pointers

- canonical visual + component language: `docs/design-system/design-system-spec-final-v1.md`
- canonical core component specs: `docs/design-system/component-specs-core-v1.md`
- canonical phase 2 component specs: `docs/design-system/component-specs-phase2-v1.md`
- operational implementation rules for agents: `docs/design-system/agent-ui-rules.md`
- token reference (to be created): `docs/design-system/tokens-cheatsheet-v1.md` (`P1-DS-FOUND-001-E`)

If any entry below conflicts with one of those docs, the canonical doc wins and this inventory must be corrected.

## 3. DS primitives (`src/components/ui/**`)

All entries are accessed through the barrel export `src/components/ui/index.ts`. Route-local re-implementations of any of these are forbidden by `docs/design-system/agent-ui-rules.md` and enforced by `pnpm lint:arch`.

| Primitive | File | Variants / props | Notes |
|---|---|---|---|
| `Avatar` | `avatar.tsx` | sizes `sm`, `md`, `lg` | shared identity glyph used by `PersonSummary`, account, and tutor surfaces |
| `Button` | `button.tsx` | `primary`, `secondary`, `ghost`, `danger`, `accent`; `default` and `compact` sizes; `fullWidth` | only button surface allowed; `getButtonClassName` exposes the style for non-button anchors that must look like a button |
| `Card` | `card.tsx` | variants `static`, `select`, `instantSubmit`; `as` `div`/`section`/`article`/`button`/`a`; `selected`, `fullWidth` | new in `P1-DS-FOUND-001-C`. `select` mirrors the radio-style choice-card surface inside `OptionCardGroup`; `instantSubmit` is the single-action tile used by setup/role-selection. Route-local card CSS is forbidden — extend variants here instead. |
| `Chip` | `chip.tsx` | tones `default`, `positive`, `warning`, `destructive`, `trust`, `info`, `support`; sizes `default`, `compact` | new in `P1-DS-FOUND-001-C`. Replaces the route-local `.chip` rules in tutor profile and the tone-mapped chips in `ContextChipRow`. |
| `Flag` | `flag.tsx` | `code` accepts `FlagCode` | only bridge to `country-flag-icons`; route-local flag SVGs are forbidden |
| `GoogleMark` | `google-mark.tsx` | n/a | example of how brand marks must be wrapped as DS components instead of inlined SVG |
| `Icon` | `icon.tsx` | `name` accepts `IconKey` | only bridge to `lucide-react`; inline SVGs are forbidden in `src/app/**` and `src/modules/**` |
| `InlineNotice` | `inline-notice.tsx` | `tone` `info`, `warning`, `success`, `action-needed` | shared notice surface |
| `OptionCardGroup` | `option-card-group.tsx` | radio-style fieldset; supports icon and flag visuals, optional descriptions | composes the `select`-variant grammar at fieldset level; remains the right primitive for radio groups. Internal styling will fold into `Card` styles in a follow-up if duplication becomes painful. |
| `Panel` | `panel.tsx` | tones `default`, `soft`, `mist`, `warm`, `raised`, `forest`; supports `eyebrow`, `title`, `description`, `footer` | the heavyweight surface (border + background + shadow). Use `Section` for inner groupings. |
| `Section` | `section.tsx` | densities `default`, `compact`, `spacious`; dividers `none`, `top`, `bottom`; supports `eyebrow`, `title`, `description`, `action` | new in `P1-DS-FOUND-001-C`. Lightweight grouping primitive — no surface chrome. Replaces the bespoke `.profileSectionRow`/`.profileSectionHeader`/`.sectionHeader`/`.sectionEyebrow` patterns in account, public, and tutor surfaces. |
| `SelectField` | `select-field.tsx` | `default`, `compact` | shared select shell |
| `StatusBadge` | `status-badge.tsx` | tones `positive`, `warning`, `destructive`, `trust`, `info` | text-bearing state pill (heavier than `Chip`). |
| `TabBar` | `tab-bar.tsx` | `default`, scrollable | shared tab grammar |
| `Textarea` | `textarea.tsx` | `default`, long-form | shared textarea shell |
| `TextField` | `text-field.tsx` | `default`, `compact` | shared input shell |

## 4. Shared continuity components (`src/components/continuity/**`)

| Component | File | Notes |
|---|---|---|
| `NeedSummaryBar` | `continuity-primitives.tsx` | implements `component-specs-core-v1.md` §7 |
| `PersonSummary` | `continuity-primitives.tsx` | implements `component-specs-core-v1.md` §9 |
| `LessonSummary` | `continuity-primitives.tsx` | implemented continuity-anchor sibling per `design-system-spec-final-v1.md` §9.1. Status variants: `pending`, `accepted`, `upcoming`, `in_progress`, `completed`, `reviewed`, `declined`, `cancelled` (the `in_progress` variant was added in `P1-LESS-001` to render the participant-visible mid-lesson state). The broader `LessonCard` and `ScheduleSurface` from `component-specs-core-v1.md` §10–§11 remain to be built. See the reconciliation note in `component-specs-core-v1.md` §5 Rule 3. |
| `ContextChipRow` | `continuity-primitives.tsx` | uses the same tone vocabulary now exposed by `Chip`. Future cleanup: route-level chip rendering should compose `Chip` directly. |
| `MatchRow` | `match-row.tsx` | implements `component-specs-core-v1.md` §8 |
| `ConversationShell` | `conversation-shell.tsx` | implements `design-system-spec-final-v1.md` §9.1 `ConversationShell`. Composes `ConversationList`, `ConversationListItem`, and `ConversationThread` into the split-view-on-desktop, state-view-on-mobile messaging shell. Reused across `/messages` and the future `/tutor/messages` so role wrappers do not create a second messaging shell. |
| `ConversationList` | `conversation-shell.tsx` | sidebar list surface within `ConversationShell`. |
| `ConversationListItem` | `conversation-shell.tsx` | implements `design-system-spec-final-v1.md` §9.1 `ConversationListItem`. One thread-row grammar (counterpart identity + last message preview + timestamp + unread/mute/archive/block signals). |
| `ConversationThread` | `conversation-shell.tsx` | thread surface within `ConversationShell`. Uses `PersonSummary` for the counterpart header, renders messages with role-aware bubbles, exposes `threadActions` for block/report entry points, and reserves a composer slot consumed by `P1-MSG-002`. |
| `ScreenState` | `screen-state.tsx` | shared empty/loading/error state. The redundant "Empty" / "Loading" / "Error" `StatusBadge` was removed in `P1-LESS-001` polish — the visual treatment, role attribute, and title already convey the state. Hints render as a clean bulleted list rather than pill chips. |
| `TimezoneNotice` | `src/components/datetime/timezone-notice.tsx` | one shared timezone surface across student and tutor routes (match, results, lessons, book, tutor schedule, tutor lessons). Renders the clock icon, the resolved timezone label, and a configurable body line. The match flow's previous bespoke `.timezoneCard` was removed and now consumes this primitive. |

## 5. Naming reconciliation log

| Spec name | Repo name | Resolution |
|---|---|---|
| `LessonCard` (component-specs-core-v1.md §10) | `LessonSummary` (continuity-primitives.tsx) | Spec amended in `P1-DS-FOUND-001-C` to align with `design-system-spec-final-v1.md`, which lists `LessonSummary` and `LessonCard` as separate siblings. The implemented `LessonSummary` is the booking/continuity anchor; `LessonCard` is the future broader lesson-object grammar. No code rename. |
| `ScheduleSurface` (component-specs-core-v1.md §11) | not yet implemented | Spec amended with an implementation-status note. The booking, reschedule, and tutor schedule routes must adopt this primitive when it is introduced; the `-D*` cleanup tasks will surface the route-local scheduling drift that must move to it. |

## 6. Per-route-family drift checklist

This is the working checklist `P1-DS-FOUND-001-D1..D5` consume. Each entry names the route-local CSS or markup that must be replaced by a DS primitive. Entries are removed once the corresponding cleanup task lands.

### 6.1 `D1` — Public route family (`src/app/(public)/**`, `src/app/auth/**`)

- `src/app/(public)/tutors/[slug]/tutor-profile.module.css`
  - bare `.panel`, `.panel h2`, `.panel p` selectors → migrate to `Panel` + `Section`
  - bare `.chip`, `.chipRow` selectors → migrate to `Chip` + flex container
  - `.sectionEyebrow`, `.sectionHeader`, `.sectionHeader > div` → migrate to `Section`
  - `.capability`, `.capabilityList`, `.capability div`, `.capability h3`, `.capability div p` → migrate to `Card` (`static` variant) + tone-aware label
- `src/app/(public)/home.module.css`
  - `.sectionEyebrow`, `.sectionHeader`, `.sectionHeader > div` → migrate to `Section`
- `src/app/auth/sign-in/sign-in.module.css`
  - `.cardTop` → reconcile against `Panel` / `Section` once the sign-in surface is reviewed (verify whether it is simply a panel header or a distinct card)

### 6.2 `D2` — Student route family (`src/app/(student)/**`)

- `src/app/(student)/results/loading.module.css`
  - bare `.panel*`, `.chip`, `.chipWide`, `.chipRow` skeleton selectors → re-express skeletons against `Panel` / `Chip` shapes (allowlisted today via `scripts/audit-architectural-rules.ts`; allowlist entry is removed when this drift is cleaned up)
- `src/app/(student)/match/match-flow.module.css`
  - audit for choice-card and chip rhythm that should consume `Card` (`select`) and `Chip`
- `src/app/(student)/results/results.module.css`
  - audit for filter chip and result-card patterns that should consume `Chip` and `Card` (`select` / `static`)
- `src/app/(student)/book/[context]/booking.module.css`
  - `.metricCard`, `.surfaceGrid` → migrate to `Card` (`static`) and `Section` once the booking surface adopts `LessonSummary` and the future `ScheduleSurface`

### 6.3 `D3` — Tutor route family (`src/app/tutor/**`)

- audit each tutor route for repeated card / chip / panel patterns; route-local CSS modules in this family are currently slim, but adoption of `Card`, `Chip`, and `Section` should be enforced as new tutor surfaces fill in (`tutor/lessons`, `tutor/schedule`, `tutor/students`, `tutor/earnings`, `tutor/overview`, `tutor/messages`).

### 6.4 `D4` — Account and setup route families (`src/app/(account)/**`, `src/app/setup/**`)

- `src/app/(account)/account-surfaces.module.css`
  - `.panelGrid`, `.summaryGrid`, `.metricGrid` → keep as layout grids; verify each consumes `Panel`/`Section`/`Card` rather than ad-hoc bordered boxes
  - `.detailCard`, `.metricCard`, `.listItem`, `.routeItem` → migrate to `Card` (`static`) variant
  - `.profileSectionList`, `.profileSectionRow`, `.profileSectionHeader`, `.profileSectionContent`, `.sectionNote` → migrate to `Section` with `divider="bottom"` rhythm
- `src/app/setup/role/role-selection.module.css`
  - `.roleOption` (button-shaped tile with hover and selected states) → migrate to `Card` (`instantSubmit`) with `as="button"`

### 6.5 `D5` — Internal route family (`src/app/internal/**`)

- internal routes do not yet ship route-local CSS modules; adoption of `Card`, `Chip`, `Section` should be enforced as the moderation, reference-data, tutor-reviews, and users surfaces fill in.

## 7. Out-of-scope notes for `-C`

- `-C` does not migrate any route to consume the new primitives; that work is owned by `-D1..D5`.
- `-C` does not finalize the visual polish of `Card`, `Chip`, or `Section`; route adoption may surface variant gaps that `-E` reconciles.
- `-C` does not introduce new tokens. Any token additions must accompany a tokens-cheatsheet update per `docs/design-system/agent-ui-rules.md` §6a.
