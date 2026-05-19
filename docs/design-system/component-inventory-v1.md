# Mentor IB Design System — Component Inventory v1

**Date:** 2026-05-06
**Status:** Finalized in `P1-DS-FOUND-001-E`. This is the living source of truth for which DS primitives and shared continuity components exist, what variants they expose, where they are imported from, and which route families consume them.
**Companion doc:** `docs/design-system/tokens-cheatsheet-v1.md` for the token vocabulary that backs every primitive.

## 1. Why this document exists

`docs/design-system/agent-ui-rules.md` makes it a hard rule that any task adding a new DS primitive, variant, or token must update this inventory in the same commit. Without a living inventory, agents and reviewers cannot tell whether a needed primitive already exists, whether a needed variant is already exposed, or whether route-local CSS is allowed to remain.

The mechanically-detectable parts of the DS-first rule are enforced by `pnpm lint:arch` (ESLint custom architectural rules + `scripts/audit-architectural-rules.ts`). This document is the human-readable counterpart that future agents read before introducing new UI.

## 2. Source-of-truth pointers

- canonical visual + component language: `docs/design-system/design-system-spec-final-v1.md`
- canonical core component specs: `docs/design-system/component-specs-core-v1.md`
- canonical phase 2 component specs: `docs/design-system/component-specs-phase2-v1.md`
- operational implementation rules for agents: `docs/design-system/agent-ui-rules.md`
- token reference: `docs/design-system/tokens-cheatsheet-v1.md`

If any entry below conflicts with one of those docs, the canonical doc wins and this inventory must be corrected.

## 3. DS primitives (`src/components/ui/**`)

All entries below are exported by the barrel `src/components/ui/index.ts` and must be imported from `@/components/ui` (never from the individual file). Route-local re-implementations are forbidden by `docs/design-system/agent-ui-rules.md` and enforced by `pnpm lint:arch`.

| Primitive | Source file | Variants / props | Route families that consume it | Notes |
|---|---|---|---|---|
| `Avatar` | `avatar.tsx` | sizes `sm`, `md`, `lg` | account, plus `PersonSummary` continuity component (transitively used by every role surface) | shared identity glyph; route-local avatar markup is forbidden |
| `Button` | `button.tsx` | variants `primary`, `secondary`, `ghost`, `danger`, `accent`; sizes `default`, `compact`; `fullWidth` | account, public, student, tutor, auth, setup | only button surface allowed; `getButtonClassName` exposes the same style for non-button anchors that must look like a button |
| `Card` | `card.tsx` | variants `static`, `select`, `instantSubmit`; `as` `div` / `section` / `article` / `button` / `a`; `selected`, `fullWidth` | account, student, setup, tutor | introduced in `P1-DS-FOUND-001-C`. `select` mirrors the radio-style choice-card surface inside `OptionCardGroup`; `instantSubmit` is the single-action tile used by setup/role-selection. Route-local card CSS is forbidden — extend variants here instead. |
| `Chip` | `chip.tsx` | tones `default`, `positive`, `warning`, `destructive`, `trust`, `info`, `support`; sizes `default`, `compact`; `pressed` toggle state | public, student, plus `ContextChipRow` continuity composer (transitively used by every role surface) | introduced in `P1-DS-FOUND-001-C`. Replaces the route-local `.chip` rules in tutor profile and the tone-mapped chips in `ContextChipRow`. **Examiner badges** sourced from `tutor_credentials` (subject- or focus-area-scoped, registered in `P15-DATA-003`) must render through `Chip tone="trust"`; the gold trust surface is the canonical examiner-badge tone and is the only treatment public profile, match cards, SEO landing pages, and admin surfaces should use. The `pressed` boolean was added in `P2-DS-MENU-001` so filter chips can render a selected/active state; when paired with `onClick` the chip emits `aria-pressed`, otherwise the prop is purely visual. |
| `Flag` | `flag.tsx` | `code` accepts `FlagCode` (registry in `flag.tsx`) | public (tutor profile), plus reference `visuals` mapping consumed by every flow that surfaces languages | only bridge to `country-flag-icons`; route-local flag SVGs are forbidden |
| `GoogleMark` | `google-mark.tsx` | n/a | auth (sign-in) | example of how brand marks must be wrapped as DS components instead of inlined SVG |
| `Icon` | `icon.tsx` | `name` accepts `IconKey` (registry in `icon.tsx`) | public, setup, plus reference `visuals` mapping consumed by every flow that surfaces subjects, status icons, or role glyphs | only bridge to `lucide-react`; inline SVGs are forbidden in `src/app/**` and `src/modules/**` and the import is restricted to this file by ESLint |
| `InlineNotice` | `inline-notice.tsx` | tones `info`, `warning`, `success`, `action-needed` | account, student, setup, tutor | shared notice surface; never replicate inline notice chrome in route CSS |
| `Menu` | `menu.tsx` | `MenuItem` (with `icon?`, `tone` `default`/`destructive`, `disabled`, `onSelect`), `MenuSeparator`; controlled (`open`/`onOpenChange`) and uncontrolled APIs; `placement` `bottom-start`/`bottom-end`/`top-start`/`top-end` (inherited from `Popover`) | introduced in `P2-DS-MENU-001`, no consumers yet | composed on top of `Popover`. ARIA: trigger gets `aria-haspopup="menu"` + `aria-expanded` via `getPopoverTriggerProps`; surface renders `role="menu"`; items render `role="menuitem"`. Keyboard model matches W3C APG menu pattern: arrow keys cycle items, `Home`/`End` jump, type-ahead by first letter, `Enter`/`Space` activate and close, `Escape` closes without activation. Item icons consume `Icon` — inline SVGs are forbidden. Wave-3 messaging mute/archive controls (`P2-MSG-001`) will be the first consumer. |
| `OptionCardGroup` | `option-card-group.tsx` | radio (`mode="single"`, default) or checkbox (`mode="multi"`) fieldset; supports icon and flag visuals, optional descriptions | student (match), tutor (apply), account (settings) | composes the `select`-variant grammar at fieldset level. `mode="multi"` (added in `P2-APPLY-001` for tutor focus-area / subject / language multi-select) renders `<input type="checkbox">` semantics but uses the **same circular indicator** as the single-select mode so the visual language stays identical across `/match` and `/tutor/apply`. Internal styling will fold into `Card` styles in a follow-up if duplication becomes painful. |
| `OverflowMenuTrigger` | `overflow-menu-trigger.tsx` | `orientation` `horizontal` (default) or `vertical`; required `aria-label`; passes through `aria-controls`/`aria-expanded`/`aria-haspopup` for `Menu` wiring | introduced in `P2-DS-MENU-001`, no consumers yet | icon button using `getButtonClassName({ size: "compact", variant: "ghost" })`. Renders `Icon name="moreHorizontal"` or `name="moreVertical"`. Consumers must supply a contextual `aria-label` (e.g. "Conversation options", "Lesson options"). Forwards a ref to the underlying `<button>` so the same element can serve as a `Popover`/`Menu` `anchorRef`. |
| `Panel` | `panel.tsx` | tones `default`, `soft`, `mist`, `warm`, `raised`, `forest`; supports `eyebrow`, `title`, `description`, `footer`; `as` `section` / `div` / `article` | account, student, auth, tutor | the heavyweight surface (border + background + shadow). Use `Section` for inner groupings. |
| `Popover` | `popover.tsx` | controlled (`open`/`onOpenChange`) or uncontrolled (`defaultOpen`) API; placements `bottom-start`/`bottom-end`/`top-start`/`top-end` with viewport-collision flip; `role` `dialog` (default) / `menu` / `listbox` / `group`; `returnFocus` toggle | introduced in `P2-DS-MENU-001`, no consumers yet | anchored floating surface rendered through a portal to `document.body`. Closes on `Escape` and outside click, traps `Tab` inside the surface while open, restores focus to the previously focused element on close, and exposes `getPopoverTriggerProps({ contentId, haspopup, open })` for trigger ARIA wiring. Uses the `--z-popover` token and `--shadow-raised` elevation. Manual collision-flip avoids pulling in a floating-positioning dependency; if the math becomes unwieldy, escalate per `docs/design-system/agent-ui-rules.md` before adding one. |
| `ReactionGlyph` | `reaction-glyph.tsx` | `reactionKey` accepts `MessageReactionKey` (`thumbs_up`, `heart`, `laugh`, `celebrate`, `thinking`, `clap`); `size`; `aria-hidden` (defaults `true`); also exports `getReactionLabel(key)` | introduced in `P2-MSG-001`, consumed by `MessagesExperience` (reaction picker + reaction summary chips) | maps each canonical `messageReactionKeys` entry to the corresponding `Icon` registry name. Reaction glyph mapping is owned here, not inside route code. New reaction keys must be added in both `src/modules/messages/constants.ts` (DB-aligned enum) and this file so the route surface stays DS-first. |
| `Section` | `section.tsx` | densities `default`, `compact`, `spacious`; dividers `none`, `top`, `bottom`; supports `eyebrow`, `title`, `description`, `action` | public, student, tutor | introduced in `P1-DS-FOUND-001-C`. Lightweight grouping primitive — no surface chrome. Replaces the bespoke `.profileSectionRow`/`.profileSectionHeader`/`.sectionHeader`/`.sectionEyebrow` patterns in account, public, and tutor surfaces. |
| `SelectField` | `select-field.tsx` | sizes `default`, `compact` | student, tutor | shared select shell |
| `StatusBadge` | `status-badge.tsx` | tones `positive`, `warning`, `destructive`, `trust`, `info` | account, plus `LessonSummary`, `ConversationListItem`, and other continuity components (transitively used by every role surface) | text-bearing state pill (heavier than `Chip`). |
| `Switch` | `switch.tsx` | layouts `inline` (default) / `stacked`; `disabled`; optional `description` and `helperText`; controlled `checked` / `onCheckedChange` | account (notification preferences in `/settings`) | introduced in `P2-NOTIF-PREF-001`. Single source-of-truth toggle: renders a `role="switch"` button with `aria-checked`, wired-up `aria-describedby`, and a `data-state` driven knob. Route-local toggle CSS is forbidden — extend this primitive instead. |
| `TabBar` | `tab-bar.tsx` | `default`, scrollable | student, plus `ConversationShell` (transitively used by `/messages` and `/tutor/messages`) | shared tab grammar |
| `Textarea` | `textarea.tsx` | `default`, long-form | student, plus `ConversationThread` composer | shared textarea shell |
| `TextField` | `text-field.tsx` | sizes `default`, `compact` | account, auth, tutor | shared input shell |
| `WeeklyHourGrid` | `weekly-hour-grid.tsx` | controlled `value`/`onChange` `Set<SlotKey>`; `dayLabels` (length 7); optional `startHour` (default 0) / `endHour` (default 24, exclusive); `disabled`; required `aria-label` | tutor (schedule editor — wired up by `P2-TUX-001-09`) | introduced in `P2-TUX-001-08-01`. Stateless click-to-toggle grid (7 day columns × N hour rows). Renders `role="grid"` with sticky header row + sticky hour column. Cells render `<button role="gridcell" aria-pressed>`. Keyboard model follows the W3C ARIA grid pattern: arrow keys move roving focus, `Home`/`End` jump to row start/end, `Page Up`/`Page Down` jump 6 rows, `Space`/`Enter` toggle. Pointer model is single-click toggle — no drag-to-select, no bulk-edit. Consumes `--surface-page`, `--surface-section`, `--paper-1`, `--ink-300`, `--ink-700`, `--state-selected-surface`, `--forest-500`, `--focus-ring`, `--focus-outline`, `--utility-sm`, `--font-mono`, `--font-sans`, `--space-1`, `--radius-md`, `--motion-fast`, `--border-subtle`. Carries zero domain knowledge — the slot↔rule translation lives in `src/modules/tutors/availability-grid.ts`. |

The DS exports `CardProps`, `ChipProps`, `ChipTone`, `FlagCode`, `IconKey`, `MenuItemProps`, `MenuItemTone`, `MenuProps`, `OverflowMenuTriggerProps`, `PopoverPlacement`, `PopoverProps`, `SectionProps`, `SlotKey`, `SwitchProps`, and `WeeklyHourGridProps` types; consume these instead of redeclaring shapes in route code.

## 4. Shared continuity components (`src/components/continuity/**`, `src/components/datetime/**`, `src/components/shell/**`)

These are not DS primitives but cross-route compositions of DS primitives. Route-local re-implementations of these compositions are forbidden under the same DS-first rule.

| Component | File | Notes |
|---|---|---|
| `NeedSummaryBar` | `continuity/continuity-primitives.tsx` | implements `component-specs-core-v1.md` §7 |
| `PersonSummary` | `continuity/continuity-primitives.tsx` | implements `component-specs-core-v1.md` §9 |
| `LessonSummary` | `continuity/continuity-primitives.tsx` | implemented continuity-anchor sibling per `design-system-spec-final-v1.md` §9.1. Status variants: `pending`, `accepted`, `upcoming`, `in_progress`, `completed`, `reviewed`, `declined`, `cancelled` (the `in_progress` variant was added in `P1-LESS-001` to render the participant-visible mid-lesson state). The broader `LessonCard` and `ScheduleSurface` from `component-specs-core-v1.md` §10–§11 remain to be built. See the reconciliation note in `component-specs-core-v1.md` §5 Rule 3. |
| `ContextChipRow` | `continuity/continuity-primitives.tsx` | uses the same tone vocabulary now exposed by `Chip`. Future cleanup: route-level chip rendering should compose `Chip` directly. |
| `MatchRow` | `continuity/match-row.tsx` | implements `component-specs-core-v1.md` §8. Variants: `match` (default, consumes `MatchResultCardDto` for `/match` and `/results`) and `browse` (introduced in `P2-GROW-001`, consumes `BrowseTutorRowDto` for the public `/tutors` Algolia-backed surface). The `browse` variant skips ranking, fit reasons, and shortlist/compare actions, and instead renders subject/focus-area chips, language flag pills, a price-range label, and a public rating/examiner-badge/intro-video summary. Both variants share the same row chrome, `PersonSummary` header, and action-rail typography — route-local tutor cards on `/tutors` are forbidden. |
| `ConversationShell` | `continuity/conversation-shell.tsx` | implements `design-system-spec-final-v1.md` §9.1 `ConversationShell`. Composes `ConversationList`, `ConversationListItem`, and `ConversationThread` into the split-view-on-desktop, state-view-on-mobile messaging shell. Reused across `/messages` and `/tutor/messages` so role wrappers do not create a second messaging shell. |
| `ConversationList` | `continuity/conversation-shell.tsx` | sidebar list surface within `ConversationShell`. |
| `ConversationListItem` | `continuity/conversation-shell.tsx` | implements `design-system-spec-final-v1.md` §9.1 `ConversationListItem`. One thread-row grammar (counterpart identity + last message preview + timestamp + unread/mute/archive/block signals). |
| `ConversationThread` | `continuity/conversation-shell.tsx` | thread surface within `ConversationShell`. Uses `PersonSummary` for the counterpart header, renders messages with role-aware bubbles, exposes `threadActions` for block/report entry points, and reserves a composer slot consumed by `P1-MSG-002`. |
| `ScreenState` | `continuity/screen-state.tsx` | shared empty/loading/error state. The redundant "Empty" / "Loading" / "Error" `StatusBadge` was removed in `P1-LESS-001` polish — the visual treatment, role attribute, and title already convey the state. Hints render as a clean bulleted list rather than pill chips. |
| `TimezoneNotice` | `datetime/timezone-notice.tsx` | one shared timezone surface across student and tutor routes (match, results, lessons, book, tutor schedule, tutor lessons). Renders the clock icon, the resolved timezone label, and a configurable body line. The match flow's previous bespoke `.timezoneCard` was removed and now consumes this primitive. |
| `AppFrame` | `shell/app-frame.tsx` | shared application shell consumed by every route-family layout. Owns the eyebrow / title / description rhythm and the family navigation rail. The footer accepts an optional `footerLinks` list (used by the public layout in `P15-PUBLIC-003` to surface `/privacy-policy` and `/terms`); route families that don't need legal anchors omit the prop. |
| `RoutePlaceholder` | `shell/route-placeholder.tsx` | reserved-route shell consumed by every yet-to-be-built route. Internal route family currently consists entirely of `RoutePlaceholder` shells. |
| `RouteFamilyError` | `shell/route-family-error.tsx` | shared `error.tsx` boundary used by every route family. |

## 5. Naming reconciliation log

| Spec name | Repo name | Resolution |
|---|---|---|
| `LessonCard` (component-specs-core-v1.md §10) | `LessonSummary` (`continuity/continuity-primitives.tsx`) | Spec amended in `P1-DS-FOUND-001-C` to align with `design-system-spec-final-v1.md`, which lists `LessonSummary` and `LessonCard` as separate siblings. The implemented `LessonSummary` is the booking/continuity anchor; `LessonCard` is the future broader lesson-object grammar. No code rename. |
| `ScheduleSurface` (component-specs-core-v1.md §11) | not yet implemented | Spec amended with an implementation-status note. The booking, reschedule, and tutor schedule routes must adopt this primitive when it is introduced; the `-D*` cleanup tasks already cleared the route-local chrome that `ScheduleSurface` will replace. |

## 6. Per-route-family drift cleanup — closure summary

`P1-DS-FOUND-001-D1..D5` consumed and cleared the drift checklist this document maintained during `-C`. Adoption is now complete for every route family that exists at task time. The historical record below documents what was removed so future tasks can avoid re-introducing it.

### 6.1 `D1` — Public route family (`src/app/(public)/**`, `src/app/auth/**`)

- `src/app/(public)/tutors/[slug]/tutor-profile.module.css` — bare `.panel`, `.chip`, `.chipRow`, `.capability*`, `.sectionEyebrow`, `.sectionHeader` rules removed; tutor profile now consumes `Panel`, `Section`, `Card` (`static`), `Chip`, and `Flag`.
- `src/app/(public)/home.module.css` — `.sectionEyebrow`/`.sectionHeader*` rules removed; home consumes `Section` for eyebrow/title rhythm and `Chip` for the pressure-point list; `.matchRow`/`.matchPerson`/`.matchActions` markup replaced with the shared `MatchRow` continuity component fed from `src/modules/marketing/home-content.ts`.
- `src/app/auth/sign-in/sign-in.module.css` `.cardTop` — left in place for now; `-D1` recorded it as a follow-up to reconcile against `Panel`/`Section` during the next auth surface review (it is not a drift site that violates the DS-first rule today).

### 6.2 `D2` — Student route family (`src/app/(student)/**`)

- `src/app/(student)/results/loading.module.css` — bare `.panel*`, `.chip`, `.chipWide`, `.chipRow` skeleton selectors removed; the loading skeleton now wraps each surface in `Panel` and renames the chip-shaped placeholders to `.skeletonChip*`.
- `src/app/(student)/match/match-flow.module.css` — `.progressCard`, `.questionPanel`, `.helperPanel`, `.pendingCard` rules removed; the match flow form now consumes `Panel` (default and soft) for the progress, question, helper, and pending overlay surfaces. The route-local `getSubjectLegend`/`getCurrentStepQuestion` switches were moved into `src/modules/lessons/match-flow-copy.ts` as `getMatchFlowSubjectLegend` and `getMatchFlowSubjectQuestion`.
- `src/app/(student)/results/results.module.css` — `.controls` surface chrome removed; the filter/sort controls now render inside `Panel`, and the no-matches suggestion list consumes `Chip`.
- `src/app/(student)/book/[context]/booking.module.css` — `.hero` surface chrome and `.metricCard` / `.slotPreview` / `.checkoutSummary` borders removed; the booking page hero renders through `Panel`, the booking summary metrics consume `Card`, and the booking form's selected-slot and checkout summary consume `Card`.

### 6.3 `D3` — Tutor route family (`src/app/tutor/**`)

- `src/app/tutor/overview/overview.module.css` — `.metricItem` and `.issueItem` bordered surfaces removed; the overview page now renders the metric tiles and open-issue rows through `Card`.
- `src/app/tutor/lessons/lessons.module.css` — `.group`, `.groupHeader`, `.groupTitle`, `.groupSubtitle` rules removed; the lesson groups (Pending requests, Upcoming lessons, Past lessons) now use `Section` with `title`/`description` for header rhythm.
- `src/app/tutor/schedule/schedule.module.css` — `.ruleItem` border + radius + background and `.addRuleForm` dashed-border surface chrome removed; weekly availability rows render through `Card` and the add-rule form is wrapped in `Card`.
- `src/app/tutor/earnings/earnings.module.css` — `.summaryItem`, `.checklistItem`, `.monthItem` bordered surfaces removed; the earnings summary tiles, payout-readiness checklist row, and monthly earnings list now consume `Card`.
- `/tutor/lessons/[id]` and `/tutor/messages` already consumed `Panel`, `Section`, `Chip`, `StatusBadge`, and `ConversationShell` end-to-end at task entry, so no markup migration was needed.
- `/tutor/students` is a `RoutePlaceholder` reserved for Phase 1.5 and ships no route-local CSS.

### 6.4 `D4` — Account and setup route families (`src/app/(account)/**`, `src/app/setup/**`)

- `src/app/(account)/account-surfaces.module.css` — `.detailCard`, `.metricCard`, `.listItem`, `.routeItem`, `.selectedItem` bordered surfaces removed; the billing snapshot, notification summary, privacy snapshot, billing/notification/privacy lists, and notice history now consume `Card` (`static`). `.profileSectionList`, `.profileSectionRow`, `.profileSectionHeader`, `.profileSectionContent` row pattern removed; the settings profile form now uses `Section` with `divider="bottom"` rhythm. Unused row helpers (`.shortcutList`, `.shortcutItem`, `.statusList`, `.statusRow`, `.routeList`, `.routeItem`, `.primaryStack`, `.sideStack`, `.panelGrid`, `.identityRow`, `.identityCopy`, `.eyebrow`, `.settingLabel`) dropped at the same time.
- `src/app/(account)/settings/page.tsx` — inline `buildRoleBadges` / `getRoleTone` helpers moved to `src/modules/accounts/role-badges.ts` as `buildAccountRoleBadges`, exposing typed `AccountRoleBadge` shapes consumed by the settings profile form.
- `src/app/setup/role/role-selection.module.css` — `.roleOption`, `.selected`, and `.optionIcon` route-local card chrome removed; the role-selection tiles now render through `Card` (`instantSubmit`) with `as="button"` and `selected`.

### 6.5 `D5` — Internal route family (`src/app/internal/**`)

- The internal route family ships only `RoutePlaceholder` shells under `AppFrame`. No route-local CSS, card, chip, panel, icon, or flag implementations existed at task time, so `-D5` was a structural no-op. Future tasks that fill in `/internal/moderation`, `/internal/reference-data`, `/internal/tutor-reviews`, and `/internal/users/[id]` must adopt `Card`, `Chip`, `Section`, `Panel` from this inventory rather than introducing route-local chrome.

## 7. Final-audit results (`P1-DS-FOUND-001-E`)

The parent acceptance criteria recorded against `P1-DS-FOUND-001` were all verified at the close of `-E`:

- `grep -rn "<svg" src/app src/modules` returns zero matches; the only registered SVG glyphs are inside `src/components/ui/**` (and indirectly through `lucide-react` and `country-flag-icons`, which are themselves restricted to `Icon` and `Flag`).
- No `*.module.css` file under `src/app/**` defines a `.card`, `.chip`, or `.panel` class for a pattern the DS already covers. The audit script `scripts/audit-architectural-rules.ts` enforces this on every commit.
- `subjectDescriptionsByCode`, `previewMatchFlowOptions`, `buildPreviewLanguages`, and `buildPreviewSubjects` no longer exist anywhere in `src/`. `getSubjectDescription` is also gone.
- `loadDiscoveryOptions` (`src/modules/reference/discovery.ts`) does not return a fallback object on DB error — DB failures propagate.
- Every subject card, language card, and flag chip across the product renders through `Icon` or `Flag` wrappers; `lucide-react` and `country-flag-icons` are not imported anywhere outside `src/components/ui/icon.tsx` and `src/components/ui/flag.tsx` (enforced by `eslint.config.mjs`).
- `agent-ui-rules.md` and `CLAUDE.md` carry the DS-first rule.
- No route family lost functionality during the refactor; `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm lint:arch` all pass.

No leftover drift requires a follow-up issue at `-E` close. Future drift will be captured by `pnpm lint:arch` and reviewed by the relevant feature task.
