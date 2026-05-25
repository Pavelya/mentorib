# Mentor IB Phase 2 Student UX/UI Polish Task Pack v1

**Date:** 2026-05-22
**Status:** `ready` — concrete polish pack for every student-facing surface under `src/app/(student)/**`, plus the student nav wiring in `src/lib/routing/navigation.ts` and the shared shell in `src/components/shell/app-frame.tsx`. No new functional flows. The pack mirrors [phase2-tutor-ux-task-pack-v1.md](phase2-tutor-ux-task-pack-v1.md) so the two roles converge on one shared UX vocabulary instead of drifting apart.
**Scope:** every page under `src/app/(student)/**` (`/match`, `/results`, `/saved`, `/compare`, `/lessons`, `/lessons/[id]`, `/messages`, `/book/[context]`), the student nav entries in [src/lib/routing/navigation.ts](../../src/lib/routing/navigation.ts), and the cross-role lesson-detail token vocabulary that today lives in two route-local CSS modules (`(student)/lessons/[id]/lesson-detail.module.css` and `tutor/lessons/[id]/lesson-detail.module.css`). The goal is to align the student surfaces with the tutor pack decisions, lift route-local primitives into the DS, remove copy fluff, and make the match → results → saved → compare → book → lessons journey feel like one product.

## 1. Why this pack exists

`P1-MATCH-*`, `P1-RESULTS-*`, `P1-BOOK-*`, the `(student)/lessons` family, and `P2-COMPARE-*` shipped the student surfaces in working order, but each task focused on its own slice. Reviewing the student area end-to-end reveals systemic problems no single feature task owns:

- the student nav is a flat row of six items (`Match | Results | Browse | Saved | Messages | Lessons`) with no grouping. The tutor nav now ships three labelled groups (`Workspace / Profile / Money`) after `P2-TUX-001-05`. The two roles drift apart visually at the most-visible piece of chrome
- `/compare` is not in the nav at all — it is only reachable from inline links on `/results` and `/saved`, even though it is one of the two primary decision surfaces in the match→decide→use loop
- `/results`, `/saved`, and `/compare` each render two stacked "summary" `Panel`s (an eyebrow-led "current state" panel + a duplicated "Handoff" panel that paraphrases what the same surface already shows on the next click). Three pages explaining themselves to the user with overlapping copy
- there is **no canonical page intro** on the student side. Every `/tutor/**` route uses `header.intro` + `<h1 className={styles.title}>` + a one-line description (`P2-TUX-001-15`). The student routes use a different shape on every page:
  - `/match` puts its `<h1>` inside a `Panel`, eyebrow as a body-text paragraph
  - `/results`, `/saved`, `/compare` have **no** page-intro region at all — they jump from the nav header into `NeedSummaryBar` and then into the summary `Panel` pair
  - `/lessons` and `/lessons/[id]` have **no** page intro — they render `TimezoneNotice` immediately, before any title region
  - `/book/[context]` defines a route-local `.hero` `Panel` with a literal `clamp(2rem, 4vw, 2.9rem)` font-size and gradient backgrounds, bypassing the DS title ramp entirely
  - `/messages` has no page intro; the shared `MessagesExperience` shell handles its own header
- DS-first is violated in several concrete spots:
  - [src/app/(student)/lessons/[id]/lesson-detail.module.css](../../src/app/(student)/lessons/[id]/lesson-detail.module.css) references seven CSS variables that are **not defined** in `src/styles/globals.css`: `--text-sm`, `--text-md`, `--leading-relaxed`, `--color-text-strong`, `--color-border-strong`, `--color-status-positive`, `--color-accent`. Fifteen call sites. Same problem (different vocabulary) as the `--display-sm` bug from `P2-TUX-001-01`. The tutor side has the same vocabulary in [src/app/tutor/lessons/[id]/lesson-detail.module.css](../../src/app/tutor/lessons/[id]/lesson-detail.module.css) — eight more hits — so this is a cross-role token-migration task
  - the existing-review summary on `/lessons/[id]` renders stars as the **Unicode characters** `★` and `☆` with `String.repeat`, plus an inline `style={{ color: "var(--color-border-strong)" }}` on the empty stars (page.tsx:393-406). Both the character usage and the inline style violate `agent-ui-rules.md § 6` / § 10. `Icon` registry already exposes `star`
  - `/compare`'s `.column` is a route-local `Card` primitive — explicit `padding`, `border-radius: var(--radius-lg)`, gradient `background`, `box-shadow: var(--shadow-soft)` — recreating what the DS `Card` and `Panel` primitives already own
  - `/book/[context]` `.heroTitle` hardcodes `font-size: clamp(2rem, 4vw, 2.9rem); line-height: 1.05;` and `.hero` adds two literal gradients; `.metricLabel` / `.metricValue` / `.summaryLabel` / `.summaryValue` / `.slotPreviewLabel` all set route-local `font-size` literals (`0.82rem`, `1rem`, `1.4rem`) instead of the body / caption / title-md tokens
  - `/match` `<h1>` lives inside a `Panel` as a sibling of a body-text paragraph styled to look like an eyebrow (`.eyebrow` is duplicated in [match-flow.module.css](../../src/app/(student)/match/match-flow.module.css) rather than coming from a shared rule)
- `TimezoneNotice` placement varies: above content on `/lessons`, above the back link on `/lessons/[id]`, below `NeedSummaryBar` on `/results` / `/saved` / `/compare`. The tutor pack settled on "always below the page intro" (`P2-TUX-001-15`) — the student side should match
- copy duplicates state vocabulary across surfaces. The "compare readiness" message exists three times (`CompareSummary` on `/results`, `CompareReadiness` on `/saved`, `CompareStateNotice` on `/compare`) — three near-identical components with slightly different wording, each computing the same `compareCount`/`compareCap`/`tone` triple
- `ScreenState` gained an `icon?: IconKey` prop in `P2-TUX-001-13` but none of the four student empty states (`/lessons`, `/saved`, `/compare`, `/messages`, plus the no-need `/results` branch) pass it
- "X unavailable" / "X setup required" `InlineNotice` titles drift in tone across routes ("Match flow unavailable", "Matching setup required", "Saved tutors unavailable", "Compare unavailable", "Booking unavailable", "Lessons unavailable", "Lesson unavailable", "Tutor unavailable", "No live slots right now", "Pricing incomplete", "Subject options unavailable") — same problem as `P2-TUX-001-11` flagged for the tutor surface
- the Account family (`/settings`, `/notifications`, `/privacy`, `/billing`) mixes four very different concerns with no role gating: notification preferences live both on `/settings` and (by name only — not by content) on `/notifications`; `/privacy` advertises its own future-feature gaps ("Deferred controls — Delete-account, export, and advanced preferences ship in later phases"); `/billing` is shown identically to tutor-only accounts who have no learner-side payments and see only the "Scope guardrails" architectural Panel. The notification preference categories include `tutor_application_updates` rendered to every account regardless of role; a pure student sees toggles for events they will never receive. The Account family pack at the end of this doc (`-21` through `-28`) handles this in one shot
- the header itself drifts across route families and degrades badly on mobile. `(public)/layout.tsx` never passes `viewer` to `AppFrame`, so signed-in users on `/`, `/tutors`, `/match`, and every other public route see no avatar at all — different chrome on `/results` vs `/tutors`. The avatar today is a direct `<Link>` to `/settings` that replaces the active family's nav rail in one click. At `< 768px` the header uses `flex-wrap: wrap`, producing 2–4 stacked rows of nav pills (especially on `/tutor/**` with its 9-item grouped nav), with no hamburger, no bottom dock, no overflow menu. This is a cross-family problem with knock-on effects for tutor and account surfaces too — the header pack at the end of this doc (`-14` through `-20`) handles it in one shot

This pack collects those issues into discrete, testable tasks future agents can pick up one at a time. None of the tasks below add or remove a Server Action, DTO field, or domain rule.

## 2. Source-of-truth pointers

Every UI-affecting subtask must read these before editing:

- [CLAUDE.md](../../CLAUDE.md)
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) (DS-first, copy discipline, reuse-before-extend)
- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) (existing primitives + extension rules)
- [docs/design-system/tokens-cheatsheet-v1.md](../design-system/tokens-cheatsheet-v1.md) (the only approved token vocabulary)
- [docs/design-system/design-system-spec-final-v1.md](../design-system/design-system-spec-final-v1.md), [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md), [docs/design-system/component-specs-phase2-v1.md](../design-system/component-specs-phase2-v1.md) (canonical primitive anatomy)
- [docs/architecture/canonical-value-ownership-map-v1.md](../architecture/canonical-value-ownership-map-v1.md) (timezone via `src/lib/datetime/**`; currency via `src/modules/pricing/**`)
- [docs/architecture/route-layout-implementation-map-v1.md](../architecture/route-layout-implementation-map-v1.md) for any nav grouping change
- [docs/planning/phase2-tutor-ux-task-pack-v1.md](phase2-tutor-ux-task-pack-v1.md) — the reference pack this one mirrors. Read at least `P2-TUX-001-05` (nav grouping), `P2-TUX-001-13` (`ScreenState` icon), `P2-TUX-001-15` (page-intro structure)

Out of scope for every subtask in this pack (binding):

- adding any new third-party library — escalate per `CLAUDE.md`
- adding any reference data, status enum, business rule, or new Server Action
- redesigning the public tutor profile at `/tutors/[slug]` or the shared `MatchRow`, `NeedSummaryBar`, `LessonSummary`, `PersonSummary`, or `ConversationShell` primitives beyond what an individual subtask explicitly requires
- changing the underlying domain modules under `src/modules/lessons/**`, `src/modules/messages/**`, or `src/modules/reviews/**` — UI-only edits; if a query/DTO needs an extra field, that is a scope expansion that requires escalation
- adding tutor-side equivalents of student-only screens, or vice versa, beyond the one cross-role token-migration task explicitly called out below
- shipping any new internal route or admin surface

## 3. Status and priority vocabulary

Reuses the Phase 2 pack vocabulary verbatim:

- `ready`: concrete enough to implement now
- `draft`: needs sharper interaction or scope decisions before implementation
- `planned`: reserved until a trigger condition exists
- `done`: implemented and verified

Priority:

- `P1`: visible-on-every-screen issues or DS-first violations
- `P2`: per-surface clarity and copy work
- `P3`: nice-to-have polish

## 4. Execution order

Tasks on the same step can run in parallel. Complete all tasks in a step before moving on.

| Step | Task id | Status | Priority | Short title |
| --- | --- | --- | --- | --- |
| 1 | `P2-SUX-001-01` | `ready` | `P1` | Migrate undefined token vocabulary in lesson-detail CSS (student + tutor) |
| 1 | `P2-SUX-001-02` | `ready` | `P1` | DS `StarRating` primitive + adopt for existing-review summary |
| 1 | `P2-SUX-001-03` | `ready` | `P1` | Replace route-local `.column` Card recreation on `/compare` with DS `Card`/`Panel` |
| 1 | `P2-SUX-001-04` | `ready` | `P1` | Remove route-local hero / metric typography on `/book/[context]` |
| 2 | `P2-SUX-001-05` | `ready` | `P1` | Student nav grouping + promote `/compare` to first-class nav item |
| 2 | `P2-SUX-001-06` | `ready` | `P1` | Page-intro structure consistency across every `/(student)/**` route |
| 2 | `P2-SUX-001-07` | `ready` | `P1` | Extract single `CompareReadinessNotice` and remove the three duplicates |
| 3 | `P2-SUX-001-08` | `ready` | `P1` | Collapse "summary + handoff" Panel pairs on `/results`, `/saved`, `/compare` |
| 3 | `P2-SUX-001-09` | `ready` | `P2` | Lesson-detail heading dedup (Panel eyebrow/title repetition + nested `Section` eyebrow density) |
| 3 | `P2-SUX-001-10` | `ready` | `P2` | Booking sidebar simplification — drop nested `Card`s, lift policy/consent under one `Section` |
| 4 | `P2-SUX-001-11` | `ready` | `P2` | Student copy pass (InlineNotice titles, redundant subtitles, "X unavailable" cleanup) |
| 4 | `P2-SUX-001-12` | `ready` | `P2` | Icon usage pass — readiness signals on results, saved, compare, lessons; `ScreenState icon` adopted on all four student empty states |
| 5 | `P2-SUX-001-13` | `done` | `P2` | First-wave verification: walk every `/(student)/**` route on desktop + mobile, confirm subtasks `-01` through `-12` |
| 6 | `P2-SUX-001-14` | `done` | `P1` | Canonical `AppHeader` spec — one shape everywhere (brand · nav · avatar), avatar always present when signed in |
| 6 | `P2-SUX-001-15` | `done` | `P1` | Always load `viewer` across every `AppFrame` consumer, including the `(public)` family |
| 7 | `P2-SUX-001-16` | `ready` | `P1` | DS `AvatarMenu` (popover) — avatar opens a menu instead of linking straight to `/settings`; account routes accessible without losing the role nav |
| 7 | `P2-SUX-001-17` | `ready` | `P1` | DS `BottomNav` primitive + adoption for student and tutor families on `< 768px` |
| 7 | `P2-SUX-001-18` | `ready` | `P1` | Desktop single-row header guarantee — collapse overflow into a `MoreMenu` instead of wrapping into stacked pill rows |
| 7 | `P2-SUX-001-19` | `ready` | `P2` | Public family mobile chrome — hamburger drawer instead of wrapped pill rows |
| 8 | `P2-SUX-001-20` | `ready` | `P2` | First-final verification: walk every route family at 360 / 768 / 1280 / 1440 px and confirm the canonical header shape, avatar presence, and bottom / top nav behaviour (subtasks `-01` through `-19`) |
| 9 | `P2-SUX-001-21` | `ready` | `P1` | Canonical Account family IA + role-gating spec — what each `/(account)/**` route does, who it serves, where preferences live |
| 9 | `P2-SUX-001-22` | `ready` | `P1` | Consolidate notification preferences — move the duplicate Panel out of `/settings` into a new `/notifications` `Inbox` + `Preferences` tab pair |
| 10 | `P2-SUX-001-23` | `ready` | `P1` | Role-gate notification categories — students do not see `tutor_application_updates`; tutors do not see student-only categories |
| 10 | `P2-SUX-001-24` | `ready` | `P1` | Copy + IA pass on `/notifications` — remove "Bell inbox", "Channel rule", "No chat replay", "Visible product updates", and other operator vocabulary |
| 10 | `P2-SUX-001-25` | `ready` | `P1` | Copy + IA pass on `/privacy` — remove future-feature placeholders ("Deferred controls", "Privacy surface scope"); become a real legal-acknowledgement + policy-link surface |
| 10 | `P2-SUX-001-26` | `ready` | `P2` | Role-gate + simplify `/billing` — student-only history; tutor sees a single `Earnings` CTA; remove "Scope guardrails" architectural copy |
| 10 | `P2-SUX-001-27` | `ready` | `P2` | `/settings` profile cleanup — rename `Preferred lesson language` per role context; remove the embedded notification-preferences Panel (subsumed by `-22`) |
| 11 | `P2-SUX-001-28` | `ready` | `P2` | Final verification (incl. account family): walk every Account route at 360 / 768 / 1280 px for both a student-only and a tutor-only test account; confirm the per-role surface differences land cleanly |

## 5. Detailed tasks

### 5.1 `P2-SUX-001-01` Migrate undefined token vocabulary in lesson-detail CSS

**Status:** `ready` · **Priority:** `P1`

**Problem**

[src/app/(student)/lessons/[id]/lesson-detail.module.css](../../src/app/(student)/lessons/[id]/lesson-detail.module.css) consumes seven CSS variables that **are not defined** in `src/styles/globals.css`:

- `--text-sm` (4 hits — body / note / inline review meta)
- `--text-md` (1 hit — note body)
- `--leading-relaxed` (3 hits — body line-height)
- `--color-text-strong` (5 hits — primary text color)
- `--color-border-strong` (2 hits — muted star + inline override at [page.tsx:406](../../src/app/(student)/lessons/[id]/page.tsx#L406))
- `--color-status-positive` (2 hits — filled star color)
- `--color-accent` (3 hits — focus outline + fallback chain on the star colors)

Every one resolves to the empty string at runtime, so the affected text falls back to browser defaults for color, font-size, and line-height. The tutor side has the same problem in [src/app/tutor/lessons/[id]/lesson-detail.module.css](../../src/app/tutor/lessons/[id]/lesson-detail.module.css) (8 hits). This is the student-side analogue of `P2-TUX-001-01` (the `--display-sm` migration); resolving both modules together avoids a follow-up tutor task.

**Required source docs**

- [docs/design-system/tokens-cheatsheet-v1.md](../design-system/tokens-cheatsheet-v1.md) § 2 (Typography), § 3 (Color)
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 6a (DS-first; tokens cheatsheet must be updated when tokens change)

**Scope — token migration (binding mapping)**

Replace every consumer with the documented cheatsheet token, in both `lesson-detail.module.css` files:

| Undefined consumer | Replacement |
| --- | --- |
| `var(--text-sm)` | `var(--body-sm)` |
| `var(--text-md)` | `var(--body-md)` |
| `var(--leading-relaxed)` | `var(--line-body)` |
| `var(--color-text-strong)` | `var(--ink-900)` for emphasized body, `var(--ink-700)` for muted body. Use `--ink-900` when the surrounding rule was treating the text as the primary content; use `--ink-700` for descriptive paragraphs already paired with a `Panel`/`Section` eyebrow |
| `var(--color-border-strong)` | `var(--border-strong)` |
| `var(--color-status-positive, var(--color-accent, currentColor))` | `var(--success-500)` (drop the fallback chain; `--success-500` is always defined) |
| `outline: 2px solid var(--color-accent, currentColor)` (focus ring on the star label) | replace the whole `outline` declaration with `box-shadow: var(--focus-ring);` and drop the `--color-accent` reference |

After the migration, `grep -rEn "var\(--(text-(sm|md|lg|xl)|color-(text|border|status|accent)|leading-)" src/app` must return zero hits.

**Scope — inline-style cleanup**

In [src/app/(student)/lessons/[id]/page.tsx:406](../../src/app/(student)/lessons/[id]/page.tsx#L406), the empty stars are rendered as a `<span>` with `style={{ color: "var(--color-border-strong)" }}`. After this task lands, the inline span goes away entirely — its visual job is taken over by the new `StarRating` primitive in `P2-SUX-001-02`. If `-02` has not landed yet, replace the inline style with a route-local `.emptyStars` className that uses `var(--border-strong)`; `-02` will remove it.

**Acceptance criteria**

- `grep -rEn "var\(--(text-(sm|md|lg|xl)|color-(text|border|status|accent)|leading-)" src/app src/components src/modules` returns zero hits
- `/lessons/[id]` body text, note text, issue copy, and the cancellation outcome panel all render with visible color and consistent line-height
- `/tutor/lessons/[id]` body text renders identically to its student counterpart
- no module under `src/app/**` introduces a **new** undefined CSS variable

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: load `/lessons/[id]` for a completed lesson with a recap and review, confirm body text uses the documented `--ink-*` palette; load the tutor counterpart and confirm parity

### 5.2 `P2-SUX-001-02` DS `StarRating` primitive + adopt for existing-review summary

**Status:** `ready` · **Priority:** `P1`

**Problem**

`ExistingReviewSummary` in [src/app/(student)/lessons/[id]/page.tsx:392-419](../../src/app/(student)/lessons/[id]/page.tsx#L392-L419) renders the published rating as the literal Unicode characters `★` and `☆` produced by `"★".repeat(review.ratingValue)`. This violates the "no inline SVG / no character glyphs for icons" rule in [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 6 / § 10 — the `Icon` registry already exposes `star` ([src/components/ui/icon.tsx:74](../../src/components/ui/icon.tsx#L74)). The same component also carries the inline `style={{ color }}` flagged in `-01`.

The `SubmitTutorReviewForm` (in `lesson-actions-client.tsx`) renders an input-based star picker through `.ratingStarLabel` + `.ratingStarIcon` route-local CSS — also inventing a route-local rating control instead of using a DS primitive.

Per `agent-ui-rules.md` § 6a: if a needed pattern is not in the DS, extend the DS before using it locally.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 5 (reuse), § 6 (icons), § 6a (DS extension)
- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 3 (primitive shape + barrel-export discipline)
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) (Icon, focus model)
- existing `src/components/ui/icon.tsx` (the `star` key is already registered)
- `REVIEW_MAX_RATING` in `src/modules/reviews/**`

**Scope — new DS primitive**

Add `src/components/ui/star-rating.tsx` and `src/components/ui/star-rating.module.css`, exported from the barrel `src/components/ui/index.ts`.

Two modes:

```ts
type StarRatingDisplayProps = {
  mode: "display";
  value: number;            // 0..max
  max?: number;             // default REVIEW_MAX_RATING (5)
  "aria-label"?: string;    // defaults to `${value} out of ${max} stars`
};

type StarRatingInputProps = {
  mode: "input";
  name: string;
  value: number;
  max?: number;
  onChange?: (next: number) => void;
  required?: boolean;
  legend: string;
  error?: string;
};

export type StarRatingProps = StarRatingDisplayProps | StarRatingInputProps;
```

Display mode renders `max` `<Icon name="star">` glyphs; the first `value` use `--success-500` (filled tone), the rest use `--border-strong`. No character glyphs, no inline `style`. ARIA: outer `<span role="img" aria-label={…}>`.

Input mode renders a `<fieldset>` with the legend and `max` radio inputs (visually hidden), each labelled by the same `<Icon name="star">`. Keyboard model: arrow keys move focus left/right, `Space`/`Enter` selects, `Home`/`End` jump to ends. Focus ring uses `var(--focus-ring)` — same as the rest of the field primitives. The hidden radio's `name` keeps the existing form contract for `SubmitTutorReviewForm` (no Server Action change).

**Scope — adoption**

- migrate `ExistingReviewSummary` to `<StarRating mode="display" value={review.ratingValue} max={REVIEW_MAX_RATING} aria-label={\`Rated ${review.ratingValue} out of ${REVIEW_MAX_RATING}\`} />`. Drop the `.reviewStarsInline` selector and the inline `<span>` rendering filled/empty Unicode characters
- migrate `SubmitTutorReviewForm`'s rating fieldset to `<StarRating mode="input" name="ratingValue" legend="Rate this lesson" … />`. Drop `.ratingGroup`, `.ratingStarLabel`, `.ratingStarIcon`, `.ratingStarIconFilled`
- update [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 3 with a new `StarRating` row (props, modes, keyboard model, consumed tokens). Note that the only consumer is the lesson-detail review surface (today)

**Out of scope**

- adding half-star or fractional support — escalate before adding
- adding a separate tutor-facing variant — the same primitive serves both reads (tutor profile public ratings) and writes (student post-lesson review)
- changing `REVIEW_MAX_RATING` or any `src/modules/reviews/**` field

**Acceptance criteria**

- `grep -rn "★\|☆" src/app src/components src/modules` returns zero hits
- `grep -rn "ratingStarIcon\|reviewStarsInline" src/app` returns zero hits
- `/lessons/[id]` with a published review renders the rating as five Lucide star glyphs (filled count = `ratingValue`); with no review, the rating input renders the same glyph set
- DS inventory lists `StarRating`

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest unit test for `StarRating`: display mode renders `max` icons with correct fill split; input mode submits the chosen integer via the named field; keyboard arrow keys move selection
- manual: publish a 4-star review and confirm the post-publish summary now uses the icon-based rendering

### 5.3 `P2-SUX-001-03` Replace route-local `.column` Card recreation on `/compare`

**Status:** `ready` · **Priority:** `P1`

**Problem**

[src/app/(student)/compare/compare.module.css:40-50](../../src/app/(student)/compare/compare.module.css#L40-L50) defines `.column` as:

```css
.column {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.96), rgb(252 248 240 / 0.92)),
    var(--surface-panel);
  box-shadow: var(--shadow-soft);
}
```

That is a `Card` (or, given the gradient + shadow, a `Panel`) reimplemented at the route level. The compare matrix renders one `.column` per compared tutor. `agent-ui-rules.md` § 6a forbids route-local card / chip / panel / icon CSS — the matrix needs to compose DS `Card`s or `Panel`s.

The same module also adds `.category` with `border-top: 1px solid var(--border-subtle)`; the `Section divider="top"` primitive already does this. `.columnRank`, `.categoryLabel`, and `.controlLabel` (also duplicated in `results.module.css` and `match-flow.module.css`) repeat the same `font-family: var(--font-mono); font-size: var(--caption); letter-spacing: 0.08em; text-transform: uppercase;` rule four times across student modules — that's the canonical eyebrow style.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 5 (reuse-before-extend), § 6a
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) (Card, Panel, Section anatomy)
- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 3 (existing primitives)

**Scope**

- replace `<article className={styles.column}>` in `CompareColumn` ([compare/page.tsx:346](../../src/app/(student)/compare/page.tsx#L346)) with `<Card>` — same outer wrapper, no gradient. If the comparator visually requires the warm gradient look (likely), use `<Panel tone="warm">` instead. Decide once, document the choice in the report
- replace each `.category` `<li>` with a `Section density="compact" divider="top"` containing the existing `<p className={styles.categoryLabel}>` (which becomes the `Section` `eyebrow` prop) and the value paragraph
- drop `.column`, `.category`, `.columnRank`, `.categoryLabel`, `.controlLabel` (the last only after `P2-SUX-001-06` lifts the eyebrow into the canonical intro structure; if `-06` has not landed yet, keep `.controlLabel` for now and remove it in `-06`)
- the `aria-labelledby` and `id={\`compare-tutor-${match.candidateId}\`}` wiring on the inner `<h2>` must survive — `Card`/`Panel` accept arbitrary children and pass `aria-*` props through

**Acceptance criteria**

- `grep -rn "^\.column\b\|^\.category\b" src/app/(student)/compare` returns zero hits
- `pnpm lint:arch` passes (no route-local card / chip / panel selectors)
- the compare matrix at 1280px / 768px / 360px renders the same column count, the same per-row dividers, and the same action stack as before this task

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: open `/compare` with 2 and 3 columns; confirm visual parity with the pre-task screenshot (capture before, capture after, diff)

### 5.4 `P2-SUX-001-04` Remove route-local hero / metric typography on `/book/[context]`

**Status:** `ready` · **Priority:** `P1`

**Problem**

[src/app/(student)/book/[context]/booking.module.css](../../src/app/(student)/book/[context]/booking.module.css) bypasses the DS typography ramp in four places:

- `.heroTitle` sets `font-size: clamp(2rem, 4vw, 2.9rem); line-height: 1.05;` — the DS already exposes `--display-lg` (`clamp(1.875rem, 1.55vw + 1.525rem, 2.75rem)`) and `--line-tight: 1.15` for exactly this slot
- `.hero` adds two literal gradients on top of what `<Panel tone="warm">` already provides
- `.metricLabel` (`font-size: 0.82rem`), `.metricValue` (`font-size: 1rem`), `.summaryLabel` (`font-size: 0.82rem`), `.summaryValue` (`font-size: 1.4rem`), `.slotPreviewLabel` (`font-size: 0.82rem`), `.consentNote` (`font-size: var(--body-sm)`) — five route-local font-sizes, four of them hardcoded `rem` values instead of `--caption` / `--body-md` / `--title-md`

[page.tsx:89-97](../../src/app/(student)/book/[context]/page.tsx#L89-L97) passes both `className={styles.hero}` and `titleClassName={styles.heroTitle}` into `Panel` — the Panel primitive is being overridden to behave like a route-local hero. After `P2-SUX-001-06` lands the canonical page intro, the hero panel is redundant entirely.

**Required source docs**

- [docs/design-system/tokens-cheatsheet-v1.md](../design-system/tokens-cheatsheet-v1.md) § 2 (Typography ramp — `--display-lg` / `--title-xl` / `--title-md` / `--caption`)
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) (Panel + Card anatomy; `tone` values)
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 6a (no route-local typography overrides)

**Scope**

- **drop the route-local hero entirely.** After `-06` ships, `/book/[context]` will carry the canonical eyebrow + h1 + description intro at the top of the page; the `Panel` currently labelled "Booking handoff" / "Confirm the lesson request before Stripe takes over." becomes redundant copy-with-itself. Remove the `<header className={styles.pageHeader}>` block and its inner Panel from `page.tsx`; remove `.pageHeader`, `.hero`, `.heroTitle` from `booking.module.css`. If `-06` has not landed yet, this task is blocked on `-06` for the title-region change but can still complete the typography migration below
- migrate the remaining font-size literals to tokens, in `booking.module.css`:
  - `.metricLabel` `font-size: 0.82rem` → `font-size: var(--caption)`
  - `.summaryLabel` `font-size: 0.82rem` → `font-size: var(--caption)`
  - `.slotPreviewLabel` `font-size: 0.82rem` → `font-size: var(--caption)`
  - `.metricValue` `font-size: 1rem; font-weight: 600` → `font-size: var(--body-md); font-weight: 600`
  - `.summaryValue` `font-size: 1.4rem; font-weight: 700` → `font-size: var(--title-md); font-weight: 700`
  - keep `.consentNote` using `var(--body-sm)` — that one is already correct
- the upper-case + letter-spacing on the four label classes (`.metricLabel`, `.summaryLabel`, `.slotPreviewLabel`) is the canonical eyebrow rule. Replace the per-class declarations with `composes: eyebrow from "globals.css"` only if a shared utility class exists (it does not today); otherwise leave the per-class declarations until a separate "Eyebrow utility" task lifts them
- the booking sidebar `metricGrid` renders three `<Card>` children (lines 268-286 in `page.tsx`) — that nesting is addressed by `P2-SUX-001-10`, not here

**Acceptance criteria**

- `grep -n "font-size:\s*[0-9]" src/app/(student)/book/[context]/booking.module.css` returns zero hits — every `font-size` consumes a token
- `grep -n "\.heroTitle\|\.hero\b" src/app/(student)/book/[context]/booking.module.css` returns zero hits (only after `-06` lands)
- the booking page hero region is replaced by the canonical intro from `-06`; the page reads as "Booking handoff" eyebrow + one h1 + one description, then `NeedSummaryBar` + `TimezoneNotice` + body
- no inline `style={{ fontSize }}` or `titleClassName` overrides remain on Panel calls in the booking route

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: load `/book/<known-context>` in preview mode, compare against the pre-task screenshot; the booking summary card values render at the title-md ramp (1.125rem–1.375rem fluid), not 1.4rem flat

### 5.5 `P2-SUX-001-05` Student nav grouping + promote `/compare` to first-class nav item

**Status:** `ready` · **Priority:** `P1`

**Problem**

[src/lib/routing/navigation.ts:32-39](../../src/lib/routing/navigation.ts#L32-L39) exposes six flat student links:

```ts
student: [
  { href: "/match", label: "Match" },
  { href: "/results", label: "Results" },
  { href: "/tutors" as Route, label: "Browse" },
  { href: "/saved", label: "Saved" },
  { href: "/messages", label: "Messages" },
  { href: "/lessons", label: "Lessons" },
],
```

`/compare` is **not** in the nav even though it is the primary side-by-side decision surface; today the only way to reach `/compare` is an inline `<Link>` from `/results` or `/saved`. The tutor nav now ships three labelled groups (`Workspace / Profile / Money`) after `P2-TUX-001-05`. The `NavItem` type already supports `group?: string` and `AppFrame` already knows how to render groups — only the student data is flat.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 5, § 7
- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 4 (`AppFrame`, `TabBar`)
- [docs/architecture/route-layout-implementation-map-v1.md](../architecture/route-layout-implementation-map-v1.md)
- `phase2-tutor-ux-task-pack-v1.md` § 5.5 (`P2-TUX-001-05`) — the reference shape

**Scope**

- regroup the student nav into three labelled groups in [src/lib/routing/navigation.ts](../../src/lib/routing/navigation.ts). Final wording is the agent's call within copy-discipline rules; suggested:
  - **Find**: Match, Results, Browse (`/tutors`)
  - **Decide**: Saved, Compare
  - **Use**: Lessons, Messages
- promote `/compare` to a first-class nav entry inside the `Decide` group. It already exists as a route under `(student)/compare/page.tsx` with its own metadata — today it is just orphaned from the nav
- the wording `Browse` for `/tutors` stays; this is the only entry that points into the `public` route family (the public tutor index is the student's "open browse" surface). Keep the existing `as Route` cast
- do not introduce a sidebar component without DS extension. If the implementing agent decides horizontal `TabBar` is too cramped at the new group count on small viewports, an acceptable trade-off is collapsing into a `Menu` on `< 640px` — but that is already `AppFrame`'s job and must not be route-local
- no `AppFrame` API change is needed — `P2-TUX-001-05` already widened `NavItem` and the rendering supports groups

**Acceptance criteria**

- `/match`, `/results`, `/tutors`, `/saved`, `/compare`, `/messages`, `/lessons` all appear in the rail, each under its group label
- `/compare` is reachable in one click from the rail on every student route
- no other route family's nav rendering changes
- at 360px, the grouped nav stays usable (wraps, scrolls, or collapses — decided once, documented in the report)

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: load each student route at 1280px and 360px, confirm groups render and every entry is reachable

### 5.6 `P2-SUX-001-06` Page-intro structure consistency across every `/(student)/**` route

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-05` (nav grouping, so the back-link policy decision is consistent with the rail's reachability guarantees). Best run before `P2-SUX-001-04` (booking hero removal) and `P2-SUX-001-08` (panel-pair collapse), since those depend on the intro existing.

**Problem**

Every `/tutor/**` route now follows one canonical intro shape after `P2-TUX-001-15`:

1. optional inline notice rail (gating notices above the intro)
2. **page intro block** — eyebrow + h1 + one-line description (`<header className={styles.intro}>` + `.title` + `.description`)
3. optional `TimezoneNotice` directly below the intro, only on routes that display lesson times
4. page body

Every `/(student)/**` route invents its own shape. Specifically:

| Route | Today | Problem |
| --- | --- | --- |
| `/match` | `<h1>` inside the wizard `Panel` (with route-local `.eyebrow` class) | no page-level intro outside the wizard; the h1 text changes per step |
| `/results` | starts with `NeedSummaryBar` → `TimezoneNotice` → two summary Panels | no eyebrow + page title region |
| `/saved` | starts with `NeedSummaryBar` → `TimezoneNotice` → two summary Panels | no eyebrow + page title region |
| `/compare` | starts with `NeedSummaryBar` → `TimezoneNotice` → two summary Panels | no eyebrow + page title region |
| `/lessons` | starts with `TimezoneNotice` immediately | no intro; `TimezoneNotice` above the (missing) title |
| `/lessons/[id]` | `TimezoneNotice` → back link → `LessonSummary` | no intro; `TimezoneNotice` above everything |
| `/messages` | shared shell renders its own header | no page-level intro; can stay as-is below the inline-notice rail |
| `/book/[context]` | route-local `Panel` "Booking handoff" / "Confirm the lesson request before Stripe takes over." with its own clamp font-size | hero is not the canonical intro; copy is fluff |

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 5, § 7, § 8
- [docs/design-system/component-specs-phase2-v1.md](../design-system/component-specs-phase2-v1.md)
- this doc's `-05` (nav grouping) and `phase2-tutor-ux-task-pack-v1.md` § 5.15 (`P2-TUX-001-15`)

**Canonical decision (binding for this task)**

Every `/(student)/**` route (except `/messages`, which keeps the shared shell header) adopts a **section intro** in this exact order from the top of the page:

1. optional inline notice rail (`Account access limited`, `Match flow unavailable`, `<page> preview`, `<page> unavailable`)
2. **Page intro block** — `<header className={styles.intro}>` with `.eyebrow` + `.title` + `.description`
3. optional `TimezoneNotice`, only on routes that display lesson times (`/results`, `/saved`, `/compare`, `/lessons`, `/lessons/[id]`, `/book/[context]`). Renders directly below the intro
4. (where present) `NeedSummaryBar` — renders below `TimezoneNotice` so the page title is always above the live need
5. Page body

Per-route copy (binding):

| Route | Eyebrow | Title | Description |
| --- | --- | --- | --- |
| `/match` | "Match flow" | "Tell us about your IB request" | "Three quick steps. Your need stays attached through results and booking." |
| `/results` | "Match results" | "Your tutor results" | "Fit-ranked tutors based on the IB need you just submitted." |
| `/saved` | "Saved tutors" | "Your shortlist" | "Saved tutors stay here across sessions. Promote a few into compare for a closer read." |
| `/compare` | "Compare" | "Side by side" | "Up to three tutors. The same need context stays attached on every column." |
| `/lessons` | "Lessons" | "Your lessons" | "Past, upcoming, and pending lesson requests with this Mentor IB tutor pool." |
| `/lessons/[id]` | "Lesson" | "Lesson detail" | "Schedule, meeting link, cancellation, and reschedule for this lesson." |
| `/book/[context]` | "Booking" | "Request lesson" | "Confirm the slot and continue into Stripe Checkout for authorization." |

`/messages` is exempted from the page-intro rule because the shared `MessagesExperience` shell carries its own list-and-thread header; do **not** add a duplicate intro above it.

The wizard `<h1>` inside the `/match` `Panel` becomes an `<h2>` (the step question). The page-level `<h1>` always reads "Tell us about your IB request"; only the step question below it changes.

**Back-link policy (binding)**

The grouped nav rail from `-05` makes one-click reachability to every student route trivial. The only inline back-link that survives is on `/lessons/[id]` (detail one level under a list, no list tab visible in the detail view) — same rule the tutor pack adopted in `P2-TUX-001-15`. The back link uses the same `.backLink` style block already present in [lesson-detail.module.css](../../src/app/(student)/lessons/[id]/lesson-detail.module.css), renders **above** the intro block on `/lessons/[id]` (since it is the escape from the detail context, not chrome inside the detail).

**TimezoneNotice placement (binding)**

- Move `TimezoneNotice` to render **below** the intro block on `/lessons`, `/lessons/[id]`, `/results`, `/saved`, `/compare`, `/book/[context]`
- `/match` does not render a standalone `TimezoneNotice` — the existing `TimezoneNotice` inside the details step keeps its current position inline with the form fields
- `/messages` does not render `TimezoneNotice` — conversations are not time-anchored to a single timezone

**Avatar policy (binding)**

No avatar in any student intro. The student is the page subject only on the (out-of-scope) settings/profile surfaces; on every `(student)/**` route, the page is about the listing, lesson, or message — not about the student's identity.

**Scope — concrete edits**

For each route, normalise the top of the page to match the canonical structure. Touch only the page-intro region; do not change the page body unless deleting an intro-zone fragment the body relied on.

- `/match` ([page.tsx](../../src/app/(student)/match/page.tsx) + [match-flow-form.tsx](../../src/app/(student)/match/match-flow-form.tsx)): add the static intro in `page.tsx` above `MatchFlowForm`; demote the in-form `<h1>` to `<h2>` and rename it from `match-flow-title` to `match-flow-step-question`. The `aria-labelledby` on the wizard `<section>` follows the new id
- `/results` ([page.tsx:160](../../src/app/(student)/results/page.tsx#L160)): add the intro at the top of `renderResultsPage`, move `TimezoneNotice` below it, keep `NeedSummaryBar` below the timezone
- `/saved` ([page.tsx:139](../../src/app/(student)/saved/page.tsx#L139)): same shape; intro → `TimezoneNotice` (when `hasSaved`) → `NeedSummaryBar`
- `/compare` ([page.tsx:148](../../src/app/(student)/compare/page.tsx#L148)): same shape; intro → `TimezoneNotice` (when `hasCompared`) → `NeedSummaryBar`
- `/lessons` ([page.tsx:114](../../src/app/(student)/lessons/page.tsx#L114)): add intro above the existing `TimezoneNotice`
- `/lessons/[id]` ([page.tsx:198](../../src/app/(student)/lessons/[id]/page.tsx#L198)): keep the back link as the very first element; intro below it; `TimezoneNotice` below intro
- `/book/[context]` ([page.tsx:87](../../src/app/(student)/book/[context]/page.tsx#L87)): delete the route-local hero Panel + `.pageHeader` + `.hero` + `.heroTitle` (also covered by `-04`); intro becomes the new top; `TimezoneNotice` below intro; `NeedSummaryBar` below timezone
- `/messages`: confirm no page intro is added (only the shared `MessagesExperience` continues to render)

A shared CSS module already exists in [src/app/tutor/](../../src/app/tutor/) per-route (`.intro`, `.eyebrow`, `.title`, `.description`). Do not introduce a new DS primitive; add the same three rules to a new `src/app/(student)/student-surfaces.module.css` and import it from each student page module. The single shared module avoids three copy-pasted blocks. Naming mirrors `src/app/(account)/account-surfaces.module.css` which already exists for the account family.

**Out of scope**

- changing the body of any student surface beyond removing the explanatory hero Panel on `/book/[context]`
- introducing a new DS `PageHeader` primitive — that is a separate escalation
- changing `NeedSummaryBar`, `TimezoneNotice`, `LessonSummary`, or any DS primitive
- adding avatars

**Acceptance criteria**

- every `/(student)/**` route (except `/messages`) renders the canonical eyebrow + h1 + description intro at the top
- `TimezoneNotice` either appears once on a page (below the intro) or not at all; no student route renders it above the intro
- the back link survives only on `/lessons/[id]`
- no inline `style={{ fontSize }}` or route-local hero typography remains on the booking route
- no new DS primitive is added; no route-local card / chip / panel CSS is introduced

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- manual: walk every `/(student)/**` route at 1280px, 768px, and 360px and confirm the intro region matches the canonical shape

### 5.7 `P2-SUX-001-07` Extract single `CompareReadinessNotice` and remove the three duplicates

**Status:** `ready` · **Priority:** `P1`

**Problem**

Three near-identical components compute the same compare-state triple and render an `InlineNotice` with slightly different copy:

- `CompareSummary` in [results/page.tsx:586-621](../../src/app/(student)/results/page.tsx#L586-L621)
- `CompareReadiness` in [saved/page.tsx:235-269](../../src/app/(student)/saved/page.tsx#L235-L269)
- `CompareStateNotice` in [compare/page.tsx:483-539](../../src/app/(student)/compare/page.tsx#L483-L539)

All three derive the same `compareCount`, `compareCap`, `tone`, and `title`, and render an `InlineNotice` with a single action link to `/compare` (or, on `/compare`, no action). The copy drift is the inconsistency: "Comparing N of M tutors" vs "Pick up to N tutors to compare" vs "Compare is full". A future change to the compare state vocabulary touches three files.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 5 (reuse-before-extend)
- existing `ShortlistStateDto` shape in `src/modules/lessons/shortlist`

**Scope**

- add `src/components/continuity/compare-readiness-notice.tsx` (the `compare-readiness` lives next to `NeedSummaryBar` and the other shortlist-aware continuity primitives — not in `src/components/ui`, because it composes `InlineNotice` and binds to `ShortlistStateDto`)
- props:

```ts
type CompareReadinessNoticeProps = {
  state: ShortlistStateDto;
  origin: "results" | "saved" | "compare";
  className?: string;
};
```

The `origin` switches the secondary copy and the action presence:
  - `results` and `saved`: action = `<Link>` to `/compare`, label depends on `compareCount`
  - `compare`: no action link (already on the destination)
- the title/tone/description vocabulary stays the same as `compare/page.tsx`'s `CompareStateNotice` since that copy already covers the `is_full` / `has_some` / `empty` branches cleanly
- replace all three call sites with the new primitive; delete the three local components
- export from `src/components/continuity/index.ts`

**Acceptance criteria**

- `grep -rn "CompareSummary\|CompareReadiness\|CompareStateNotice" src/app` returns zero hits
- the three routes render the same notice copy for the same state input
- no Server Action or DTO change

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- manual: with two tutors compared, load `/results`, `/saved`, `/compare`; the notice copy and action are identical across the three routes (except for the action's absence on `/compare`)

### 5.8 `P2-SUX-001-08` Collapse "summary + handoff" Panel pairs on `/results`, `/saved`, `/compare`

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-06` (the page intro takes over the role the eyebrow-led panels were filling)

**Problem**

Each of `/results`, `/saved`, `/compare` renders a `summaryGrid` containing two `Panel`s:

- a "Tutor results" / "Saved tutors" / "Compare" panel that paraphrases the page title (now coming from the canonical intro after `-06`) and lists three bulleted "things the page does"
- a "Handoff" panel that paraphrases what the next click already shows ("Open a tutor profile to review proof without losing the fit rationale", "Compare lives inside Saved so the shortlist and the side-by-side view stay one decision", "Saved is where the shortlist lives. Compare is the closer read.")

The "Handoff" copy is the canonical kind of fluff `agent-ui-rules.md` § 7 calls out: it explains the surface to the user instead of letting the surface do its job. The first panel is also redundant once the canonical intro exists.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 7 (copy discipline — "if removing a sentence does not make the task harder for the user, remove it")
- existing `phase2-tutor-ux-task-pack-v1.md` § 5.6 (`P2-TUX-001-06`) for the precedent of removing readiness-restate panels on the tutor side

**Scope**

- delete the `summaryGrid` / `headerGrid` block (both Panels) from `/results`, `/saved`, `/compare`. The page intro from `-06` carries the eyebrow + h1 + one-line description; everything else in those Panels duplicates what the page body already shows
- on `/results`, the existing `NoMatchesState` Panel (the empty-state branch) stays — that one is not duplicative
- on `/results`, the `queued` and `failed` and `empty` `state` branches keep their existing Panel / `ScreenState` rendering — only the `ready` and `preview` summary header is removed
- on `/saved`, the `SavedEmptyState` `ScreenState` stays
- on `/compare`, the `CompareEmptyState` `ScreenState` stays
- remove the `.summaryGrid`, `.summaryList`, `.handoffList`, `.headerGrid` selectors from the three modules (`results.module.css`, `saved.module.css`, `compare.module.css`)
- the `CompareReadinessNotice` from `-07` still renders on all three pages — it carries the compare state, which is the only non-duplicative piece the deleted Panels were carrying

**Acceptance criteria**

- `grep -rn "\.summaryGrid\|\.handoffList\|\.headerGrid" src/app/(student)` returns zero hits
- `/results`, `/saved`, `/compare` open straight from intro → `TimezoneNotice` → `NeedSummaryBar` → `CompareReadinessNotice` → the list / matrix / empty state
- no body content is removed; only the explanatory header Panels

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: walk the three routes in `ready` state and confirm no information is lost; walk them again in `empty` / `queued` / `failed` and confirm the existing empty branches still render

### 5.9 `P2-SUX-001-09` Lesson-detail heading dedup

**Status:** `ready` · **Priority:** `P2`

**Problem**

`/lessons/[id]` stacks heading-on-heading in several sections, the same pattern `P2-TUX-001-07` cleaned up on the tutor side:

- `ReportSection` ([page.tsx:306-353](../../src/app/(student)/lessons/[id]/page.tsx#L306-L353)): outer `Panel` `eyebrow="Lesson recap"` + `title="Lesson recap from your tutor"` (same words twice). Inside it, up to four nested `Section`s each with their own `eyebrow` ("Lesson goal" / "What we covered" / "Confidence and understanding" / "Next steps") — six heading levels deep on a single panel
- `MeetingAccessSection`: `eyebrow="Meeting access"` + `title={meeting.displayLabel ?? methodLabel}` — the title is whatever string the tutor saved, so it can read anything from "Google Meet" to "Join the lesson here please ❤️". After `P2-TUX-001-08` deleted the "Display label" field on the tutor side, `displayLabel` is being removed from new policies but the read path still falls back to it for legacy rows
- `CancellationSection` renders one of two Panels depending on `policy.cancellable`: "Cancellation closed" or "Cancel this lesson" — the eyebrow "Cancellation" repeats the first word of each title
- `ContextSection`: `eyebrow="Lesson context"` + `title="Subject and request"` — both phrases say the same thing
- `CalendarSection`: `eyebrow="Add to calendar"` + `title="Keep this lesson visible"` — eyebrow describes action, title describes benefit. Drop the title and let the eyebrow stand
- `ReviewSection`: `eyebrow="Lesson review"` + `title="Tell other students what worked"` — same as add-to-calendar; the title is sales copy

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 7, § 5
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) (Panel + Section anatomy)

**Scope**

- `ReportSection`: drop the outer `Panel` title (keep the eyebrow "Lesson recap"). Inside, render the four content blocks as inline paragraphs with bold leading labels ("Lesson goal — …", "What we covered — …", "Confidence — …", "Next steps — …") inside a single `Section`. Drop the per-Section `divider="top"` + `eyebrow` pattern — that was the source of the six-level density
- `MeetingAccessSection`: drop `meeting.displayLabel` from the Panel title; always render `MEETING_METHOD_LABELS[meeting.meetingMethod]` as the title. The user-provided label, if any, can move to the body as a paragraph but should not be a heading
- `CancellationSection`: keep both branches but drop the "Cancellation" eyebrow when the title already starts with "Cancel" or "Cancellation"
- `ContextSection`: drop the title "Subject and request"; rename the eyebrow to "Lesson context" → keep — render the chips and the optional note directly under the panel content with no inner title
- `CalendarSection`: drop the title "Keep this lesson visible"; eyebrow "Add to calendar" stays
- `ReviewSection`: drop the title "Tell other students what worked"; eyebrow "Lesson review" stays
- the `Card`, `Panel`, `Section`, `StatusBadge`, `Chip` primitives stay; only headings change. No DTO change

**Acceptance criteria**

- no Panel on `/lessons/[id]` renders a title that repeats its eyebrow (or vice versa)
- no Panel on `/lessons/[id]` stacks more than two heading levels (page title from `-06` + one nested Panel/Section title)
- `MEETING_METHOD_LABELS[meeting.meetingMethod]` is the only thing rendered as the meeting access title

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: load a completed lesson with a tutor-published recap; confirm no duplicate-word heading pairs

### 5.10 `P2-SUX-001-10` Booking sidebar simplification

**Status:** `ready` · **Priority:** `P2`

**Problem**

[book/[context]/page.tsx:262-310](../../src/app/(student)/book/[context]/page.tsx#L262-L310) renders a "Booking summary" `Panel tone="raised"` whose content is:

- a `Section density="compact"` containing
  - a `metricGrid` of three nested `<Card>`s — each Card just shows a `metricLabel` + `metricValue` pair
  - a bulleted `policyList`
  - a `consentNote` paragraph linking to terms and privacy
- followed by an "About this tutor" `Panel tone="mist"` with the tutor bio

Three nested Cards inside a Section inside a Panel inside a `<aside>` is four wrappers deep for what is conceptually one info block. The Cards add no visual separation that a definition list would not — they are using the Card primitive as a typography crutch (`metricLabel` + `metricValue` is exactly the pattern `--caption` + `--body-md` already covers without a wrapper).

The bookings page sidebar is also where the "Pricing summary" + "Authorization hold" + "Lesson length" + "Slot count" + "Policy" + "Consent" all live — the user reads five different "facts" with no priority order.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 5, § 6a, § 7
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) (Panel + Section + Card anatomy — when to use which)

**Scope**

- replace the three nested `<Card>` children inside `metricGrid` with one `<dl>` (definition list). Each row is `<div class={styles.summaryRow}><dt class={styles.summaryLabel}>{label}</dt><dd class={styles.summaryValue}>{value}</dd></div>`. Drop the `metricGrid` grid; render the dl rows stacked
- the existing `summaryLabel` / `summaryValue` typography rules (after `-04` migrated their font-sizes to tokens) stay
- keep the policy `<ul>` and the consent `<p>` inside the same Section
- the "About this tutor" Panel can render directly below the booking-summary Panel without an extra wrapper — it already does, no change there
- the right-column `<aside className={styles.sidebar}>` stays — that is the page-level layout, not a primitive

**Acceptance criteria**

- `grep -rn "metricGrid\|metricLabel\|metricValue" src/app/(student)/book` returns hits only as `summaryLabel`/`summaryValue` (the renamed style classes) or zero hits if a fuller rename happens
- the booking sidebar renders one summary block (lesson length / authorization / slot count / policy / consent) inside one Panel, no nested Cards
- no DTO or Server Action change

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: load `/book/<context>` in `ready` state, confirm the sidebar reads as one summary block, not three sub-cards

### 5.11 `P2-SUX-001-11` Student copy pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

Across the student surface, copy violates [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 7 in small consistent ways:

- `InlineNotice` titles drift across surfaces:
  - "Match flow unavailable" / "Matching setup required" / "Saved tutors unavailable" / "Compare unavailable" / "Lessons unavailable" / "Lesson unavailable" / "Messages unavailable" / "Booking unavailable" — mostly `X unavailable` but not uniformly
  - "Tutor unavailable" / "Pricing incomplete" / "No live slots right now" — adverbial pattern that does not match the rest
  - "Authorization step cancelled" / "Booking return failed" — Stripe-flow specifics that leak terminology ("Authorization", "return") into the title
  - "Account access limited" appears verbatim on five routes — that one is fine
  - preview notices: "Lessons preview" / "Lesson preview" / "Messages preview" — okay; drop "Tutor" prefix conventions on the student side (there is none today, but apply the same rule)
- the three deleted "summary + handoff" Panel pairs (`-08`) carry copy duplicated across surfaces ("Compare keeps the same need context …" / "Compare lives inside Saved …") — those go away with `-08`
- `/lessons/[id]` issue-section helper text describes implementation rather than user intent ("Issue reporting opens after the tutor accepts and stays available through the 24-hour window after the lesson ends. Use this surface — not the chat thread — when something goes wrong with a session."). Two sentences; the second is policy, the first is timing — split into a short one-liner
- the booking outcome rendering on `/book/[context]:128-160` shows three `<p>` lines ("Hold amount: …", "Lesson status: …", "Payment status: …") that expose the underlying state machine to the user. The user needs "Request sent. Lesson at {time} with {tutor}." plus one CTA — the status enum strings should not surface in the title or the meta
- `/match` form pending overlay says "We're getting your tutor matches ready." + "You'll land on the results screen as soon as your request is saved." — two sentences saying the same thing
- `/match` step labels: `matchFlowStaticCopy.problemLabel` / `subjectLabel` / `detailsLabel` (lives in `src/modules/lessons/match-flow-copy.ts`) drive the step pill rail. Keep those — they are reference-data-shaped. The action button "Continue to {nextStep.label.toLowerCase()}" reads "Continue to subject" / "Continue to details" — fine
- `/results` `buildSummaryDescription` produces strings like "3 cards shown from all active results, sorted by best-fit order." — that copy is implementation-shaped (`cards shown`, `active results`). After `-08` deletes the panel pair this string disappears, so no work here

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 7

**Scope**

- standardise `InlineNotice` titles on a short noun-phrase pattern. Concrete renames:
  - "Match flow unavailable" → "Match unavailable"
  - "Matching setup required" → "Match setup required"
  - "Saved tutors unavailable" → "Saved unavailable"
  - "Lesson unavailable" stays (singular when on the detail route)
  - "Booking unavailable" stays
  - "Tutor unavailable" stays
  - "Pricing incomplete" stays
  - "No live slots right now" → "No bookable slots"
  - "Authorization step cancelled" → "Booking cancelled in Stripe"
  - "Booking return failed" → "Couldn't confirm Stripe return"
  - "We couldn't reschedule" → "Reschedule failed"
- on `/lessons/[id]` `IssueSection`, replace the two-sentence helper with: "Report a session problem here — not in the chat. Issue reporting opens after the tutor accepts and closes 24 hours after the lesson ends."
- on `/book/[context]` bookingOutcome rendering, replace the three `<p>` status lines with one paragraph: "Your request is with **{tutor}** for **{scheduledLabel}**. We placed a **{priceLabel}** hold — Stripe captures it only if the tutor accepts." Drop the raw `lessonStatus` / `paymentStatus` enum strings (they are visible on `/lessons/[id]` if the user needs them later)
- on `/match` pending overlay: keep the single-line "We're getting your tutor matches ready." Delete the second paragraph
- on `/messages` preview `InlineNotice`: rewrite from "Live messaging connects once Supabase auth is configured. The shared shell below previews the conversation list and thread surfaces." to "Live messaging is paused in this preview. The shell below shows the list and thread layout."
- do not change form behavior, status enums, or DTO shapes — copy only

**Acceptance criteria**

- no `InlineNotice` title in `src/app/(student)/**` exceeds five words
- no helper text on `/lessons/[id]` contains the literal "Use this surface — not the chat thread"
- no booking outcome surface renders the literal `lessonStatus` or `paymentStatus` enum values

**Verification**

- mostly manual: walk every `/(student)/**` route and read each visible string out loud — if a sentence does not help the user choose or act, remove it
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch` pass

### 5.12 `P2-SUX-001-12` Icon usage pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

The student surface is almost entirely text. `P2-TUX-001-12` adopted icons on the tutor side; the student side has none, even though the same `ScreenState`, `StatusBadge`, and `Chip` primitives are in use.

Specific spots that read well with icons today but do not have them:

- four `ScreenState` empty states render text-only: `/lessons` no-lessons, `/saved` no-saved, `/compare` no-compare, `/messages` no-conversations, plus the `/results` no-need branch. `ScreenState.icon` already exists (added in `P2-TUX-001-13`)
- `LessonSummary` status renders the `mapLessonStatusToSummary` text-only `StatusBadge`. A glyph next to the tone makes pending / accepted / upcoming / completed scannable in a list
- `CompareReadinessNotice` from `-07` is text-only; one icon would carry the tone (info / success / warning) faster

**Required source docs**

- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 3 (`Icon`, `ScreenState`)
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 6 (icons must come through `src/components/ui/icon.tsx`)
- `phase2-tutor-ux-task-pack-v1.md` § 5.12, § 5.13

**Scope**

- audit `src/components/ui/icon.tsx`'s `IconKey` registry; if a needed glyph is missing (the registry already contains `calendar`, `messageSquare`, `users`, `star`, `checkCircle`, `clock`, `circleDashed`, `alertTriangle` — should be enough), add it in the same commit. **Never inline `<svg>`**
- adopt `ScreenState icon` on the five student empty / error states:
  - `/lessons` no-lessons → `calendar`
  - `/saved` no-saved → `star`
  - `/compare` no-compare → `users`
  - `/messages` no-conversations → `messageSquare`
  - `/results` no-need → `circleDashed`
  - `/results` failed → `alertTriangle`
  - `/results` filtered-empty → `circleDashed`
- on `LessonSummary` status, decide once in `src/app/(student)/lessons/lesson-presentation.ts` (the existing `mapLessonStatusToSummary` mapper) which `IconKey` corresponds to which `LessonStatus`. Pass the icon as a `StatusBadge` slot if the primitive supports it; if not, render an `Icon` adjacent to the badge. Do not add a new badge variant just for this
- do **not** add decorative icons to body copy or nav tabs

**Acceptance criteria**

- every student `ScreenState` renders an icon above the title
- every `StatusBadge` rendered through `LessonSummary` carries a glyph from the registry
- `grep -rn '<svg' src/app src/modules` returns zero hits (per `agent-ui-rules.md` § 10)
- `pnpm lint:arch` passes

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: confirm visual scannability on `/lessons`, `/saved`, `/compare`, `/messages`, `/results` empty states

### 5.13 `P2-SUX-001-13` First-wave verification

**Status:** `done` · **Priority:** `P2`

**Goal**

End-to-end walkthrough that the previous twelve subtasks (`-01` through `-12`) landed without regression and that no new DS or copy drift was introduced inside the page body. The header itself is covered by the header pack (`-14` through `-19`) and re-verified end-to-end in `-20`.

**Required source docs**

- this document
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 8 (consistency checklist)
- [phase2-tutor-ux-task-pack-v1.md](phase2-tutor-ux-task-pack-v1.md) § 5.14 (`P2-TUX-001-14`) for the final-verification precedent

**Scope**

- walk each route in `src/app/(student)/**` (`/match`, `/results`, `/saved`, `/compare`, `/lessons`, `/lessons/[id]`, `/messages`, `/book/[context]`) at desktop (≥ 1024px), tablet (768px), and mobile (360px) widths
- for each route confirm:
  - one page title, no duplicate-word heading pairs
  - the canonical page intro renders (eyebrow + h1 + description) — except `/messages`, which keeps the shared shell header
  - `TimezoneNotice` (where present) renders directly below the intro and never above
  - the nav rail shows the three groups (Find / Decide / Use) and `/compare` is reachable in one click
  - all `ScreenState` empty / error branches show their registry icon
  - no native browser file picker is visible (none should be, on the student side; this is a sanity check)
  - no Unicode-character star rating; the `StarRating` primitive renders glyphs from the registry
  - no Stripe internal field name (`lessonStatus` / `paymentStatus` raw enum) is rendered to the user
  - no inline `style={{ … }}` on text rendering paths
- update [docs/planning/phase2-task-pack-v1.md](phase2-task-pack-v1.md) with a footnote that the student UX polish pack landed (link to this doc)
- update [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) if any subtask added a primitive (`StarRating`, `CompareReadinessNotice`)
- close `P2-SUX-001` parent in this file with a one-paragraph close note under § 6

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- `pnpm test:e2e` is **not** required — no public, auth, `robots.ts`, or `sitemap.ts` route is touched in this pack. Call this out explicitly in the final report

### 5.14 `P2-SUX-001-14` Canonical `AppHeader` spec

**Status:** `done` · **Priority:** `P1`

**Problem**

The header today drifts across route families because `AppFrame` accepts each piece (`eyebrow`, `viewer`, `navItems`) independently and every layout passes a different combination:

| Family | `viewer` passed? | Nav items | Mobile chrome |
| --- | --- | --- | --- |
| `(public)` ([layout.tsx](../../src/app/(public)/layout.tsx)) | **no** — `viewer` prop omitted entirely | 7 flat | wrap into stacked pill rows |
| `(student)` | yes (via `loadViewerIdentity`) | 6 flat | wrap into stacked pill rows |
| `tutor` | yes | 9 in 3 groups | wrap into stacked pill rows (3-4 rows tall) |
| `(account)` | yes | 4 flat | wrap |
| `internal` | yes (admin-only) | 4 flat | wrap |
| `auth`, `setup` | n/a — use `FocusedFlowShell` instead of `AppFrame` | n/a | n/a |

The user-visible symptoms:

- A signed-in student on `/tutors` (public family) sees **no avatar**, no way to reach their settings, and a different nav rail than `/results` — the two routes are one tap apart in the journey but feel like different products
- The avatar today is a direct `<Link>` to `/settings` ([app-frame.tsx:62-74](../../src/components/shell/app-frame.tsx#L62-L74)). One click on the avatar replaces the active route family's nav rail with the Account family's rail — the student / tutor loses their workspace nav as soon as they reach for settings
- At `< 767px`, `.headerInner { flex-wrap: wrap }` ([app-frame.module.css:28-35](../../src/components/shell/app-frame.module.css#L28-L35)) stacks brand, nav, and avatar into three rows; on `/tutor/**` the grouped nav adds two more rows of pills (3-4 stacked rows of nav before the page body even starts)
- There is no overflow handling: when the nav exceeds the viewport, items wrap. There is no hamburger, no bottom dock, no `More` menu, no per-breakpoint layout switch

The user has asked for a binding decision: bottom-nav-with-core vs hamburger. The decision changes the nav adjacency model (every connection between pages on mobile), so it must be made in one place before any implementation lands.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 5 (reuse-before-extend), § 6a (DS-first extension), § 8 (consistency checklist)
- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 4 (`AppFrame`, `TabBar`), § 3 (`Menu`, `Avatar`)
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) and [docs/design-system/component-specs-phase2-v1.md](../design-system/component-specs-phase2-v1.md)
- [docs/architecture/route-layout-implementation-map-v1.md](../architecture/route-layout-implementation-map-v1.md) (route-family ownership)
- [docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md](../architecture/accessibility-and-inclusive-ux-architecture-v1.md) (target sizes, keyboard model)
- existing `src/components/ui/menu.tsx` and `src/components/ui/popover.tsx` (the DS already exposes both — no new vendor required)
- W3C ARIA APG patterns for "Menu", "Disclosure", "Tablist" (no link; used as the keyboard-model reference)

**Canonical decision (binding for every subtask below)**

The header has **one shape** across every route family that uses `AppFrame`. `FocusedFlowShell` (auth + setup) is exempt and keeps its current single-purpose chrome.

```
Desktop (≥ 768px), one row:
┌──────────────────────────────────────────────────────────────────┐
│ Mentor IB · {eyebrow}    [nav: family tabs]    [avatar / Sign in]│
└──────────────────────────────────────────────────────────────────┘

Mobile (< 768px), one row at the top + one dock at the bottom:
┌──────────────────────────────────────────────────────────────────┐
│ Mentor IB                                  [avatar / Sign in]    │
└──────────────────────────────────────────────────────────────────┘
                              … page body …
┌──────────────────────────────────────────────────────────────────┐
│ [tab1] [tab2] [tab3] [tab4] [More]                               │ ← BottomNav (private families only)
└──────────────────────────────────────────────────────────────────┘
```

Binding rules:

1. **Brand block** (brand wordmark + route-family eyebrow) is always on the leading edge. The eyebrow is dropped on mobile (only the wordmark remains)
2. **Nav** lives in the top bar on desktop, in the bottom dock on mobile. The top bar's nav is hidden on mobile via the same `< 768px` breakpoint that switches to the bottom dock. The bottom dock is hidden on desktop. No simultaneous display
3. **Avatar** sits on the trailing edge of the top bar on every viewport. It is a `<button>` that opens `AvatarMenu` (a DS popover) — it is **not** a direct link. The menu items are the Account family routes plus "Sign out". The avatar always renders when `viewer` is present; if not signed in, the slot renders a `Sign in` `Button` instead
4. **Mobile bottom nav** carries up to **five** slots: four primary destinations from the route family + a `More` slot that opens a DS `Menu` listing the family's overflow items. The exact 4-tab split is decided per family in `-17`
5. **Desktop overflow**: if the nav row would exceed the available width at the current viewport, the trailing items collapse into a `More` menu (same DS `Menu` primitive). No wrapping into a second row, no horizontal scroll on the top bar
6. **Public family** does **not** show a bottom dock — the public surface is browsing, not workflow. On mobile, public nav collapses into a hamburger drawer (covered in `-19`). On desktop, public nav obeys the single-row overflow rule
7. **Account family** does **not** get its own bottom dock. The Account routes (`/settings`, `/notifications`, `/privacy`, `/billing`) are reached via the avatar menu. Once inside Account, the bottom dock continues to show the originating role family's tabs — so a student on `/settings` still sees Match / Results / Lessons / Messages / More in the dock, and the role's identity is preserved
8. **Internal family** keeps its current top-nav-only shape (admin-only; mobile is not a target). Bottom nav not added there
9. The header is one DS component — `AppHeader` — owned by `src/components/shell/app-frame.tsx` and consumed by every layout. No layout file may render brand / nav / avatar markup directly

**Scope — this task delivers the spec, not the implementation**

This task produces three artifacts and **only those three**:

1. A new section in [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 4 documenting the canonical `AppHeader` + `BottomNav` + `AvatarMenu` shape (props summary, breakpoints, accessibility model, route-family rules). Reference the binding rules above
2. A new ADR-style page at `docs/architecture/app-header-shape-v1.md` capturing the bottom-nav-vs-hamburger decision, the four-tab-mobile-core decision per family, and the rationale for keeping account routes reachable via the avatar menu rather than the dock. This doc supersedes any header guidance in the route-layout-implementation-map
3. A short update to [docs/architecture/route-layout-implementation-map-v1.md](../architecture/route-layout-implementation-map-v1.md) pointing at the new ADR

No code lands in this task. Subtasks `-15` through `-19` implement against this spec.

**Out of scope**

- writing the components themselves (covered in `-15`–`-19`)
- redesigning the page-body intro from `P2-SUX-001-06` (that is a body decision, not a header one)
- adding a new vendor or icon set
- introducing a notification badge / unread count on any nav slot — escalate before adding
- localising any header copy

**Acceptance criteria**

- `docs/design-system/component-inventory-v1.md` § 4 lists `AppHeader`, `AvatarMenu`, `BottomNav` with the binding rules
- `docs/architecture/app-header-shape-v1.md` exists with the decision, the four-tab cores for student + tutor, and the desktop overflow rule
- `docs/architecture/route-layout-implementation-map-v1.md` references the new ADR

**Verification**

- doc-only task. `pnpm lint:arch` still passes (no code change). No runtime verification
- review: the two cores (student + tutor) listed in the ADR cover every primary destination the user named in this audit ("all major functionality one click away")

### 5.15 `P2-SUX-001-15` Always load `viewer` across every `AppFrame` consumer

**Status:** `done` · **Priority:** `P1`
**Depends on:** none (can run in parallel with `-14`, but final code lands after `-14`)

**Problem**

[src/app/(public)/layout.tsx](../../src/app/(public)/layout.tsx) does not import `loadViewerIdentity` and never passes `viewer` to `AppFrame`. The other four `AppFrame` consumers ([(student)/layout.tsx](../../src/app/(student)/layout.tsx), [tutor/layout.tsx](../../src/app/tutor/layout.tsx), [(account)/layout.tsx](../../src/app/(account)/layout.tsx), [internal/layout.tsx](../../src/app/internal/layout.tsx)) all do. Result: a signed-in user on any public route — Home, `/tutors`, `/match`, `/how-it-works`, `/trust-and-safety`, `/become-a-tutor`, `/support`, plus every SEO landing under `(public)/_seo-landing/**`, `(public)/services/**`, `(public)/subjects/**` — sees no avatar in the header and has no in-frame affordance to reach settings or sign out. They have to navigate into a private route first.

The user's specific report ("/results vs /tutors — different menus, one with avatar, another without") is exactly this.

**Required source docs**

- the `-14` ADR
- [docs/architecture/canonical-value-ownership-map-v1.md](../architecture/canonical-value-ownership-map-v1.md) (viewer identity ownership — `src/lib/identity/**`)
- existing `loadViewerIdentity` in [src/lib/identity/viewer-loader.ts](../../src/lib/identity/viewer-loader.ts) (already `cache`d and safe to call from any server layout)

**Scope**

- in [src/app/(public)/layout.tsx](../../src/app/(public)/layout.tsx), call `loadViewerIdentity()` and pass `viewer={viewer ?? undefined}` to `AppFrame`, identical to the other four consumers
- the public layout becomes `async` (it is currently sync). Confirm no client-only assumption inside the public family relies on the layout being sync — `loadViewerIdentity` is server-only and the rest of the public surface is server-rendered
- when `viewer` is `null` (not signed in, or `isSupabaseAuthConfigured()` returns false), the header avatar slot renders the **`Sign in`** `Button` instead of the avatar. That branch is implemented in `-16` (the `AvatarMenu` task) — for this task, `AppHeader` keeps showing the existing `Sign in` link via `getButtonClassName({ variant: "secondary", size: "compact" })` in the same slot. If the slot does not exist yet (today the slot is conditional on `viewer`), add it conditionally: `viewer ? <AvatarSlot /> : <SignInButton />`
- no change to `loadViewerIdentity` itself — it already handles the unconfigured / signed-out branches by returning `null`
- no change to the role-gating in routes themselves — the public family stays publicly accessible; the avatar slot is purely presentational

**Out of scope**

- adding a notification badge or unread count
- changing the avatar's click behaviour (covered in `-16`)
- adding a `Sign in` CTA to non-public families (they redirect to `/auth/sign-in` via `buildAuthSignInPath` already)

**Acceptance criteria**

- `grep -n "loadViewerIdentity" src/app/(public)/layout.tsx` returns one match
- signed in as any user, every public route shows the avatar in the same screen position as `/results` does
- signed out, every public route shows a `Sign in` button in the same screen position
- non-public layouts continue to render the avatar identically

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test:e2e` (the public family is covered by the logged-out Playwright smoke suite — confirm sign-in-button render survives)
- manual: sign in, walk `/` → `/tutors` → `/match` → `/results`, confirm avatar is in the same place on every step; sign out, walk the same path and confirm a `Sign in` button replaces the avatar

### 5.16 `P2-SUX-001-16` DS `AvatarMenu` (popover) — avatar opens a menu, not a direct link

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-14`, `P2-SUX-001-15`

**Problem**

Today's avatar is a `<Link href={viewer.settingsHref}>` ([app-frame.tsx:62-74](../../src/components/shell/app-frame.tsx#L62-L74)) that takes one click to `/settings` — which switches the user from the student / tutor route family to the Account family, swapping the entire nav rail. The user loses their workspace nav to read a notification preference.

The DS already has `Menu` ([src/components/ui/menu.tsx](../../src/components/ui/menu.tsx)) and `Popover` ([src/components/ui/popover.tsx](../../src/components/ui/popover.tsx)). The fix is to compose them into a small `AvatarMenu` primitive and render the four Account routes plus `Sign out` as menu items.

**Required source docs**

- the `-14` ADR
- [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 3 (`Menu`, `Popover`, `Avatar`)
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) (Menu anatomy + keyboard model)
- W3C ARIA APG "Menu Button" pattern

**Scope — new DS primitive**

Add `src/components/shell/avatar-menu.tsx` (composes DS primitives; lives in `shell/` because the header owns it) and `src/components/shell/avatar-menu.module.css`. Exported from `src/components/shell/index.ts` if a barrel exists; otherwise consumed directly by `AppFrame`.

Props:

```ts
export type AvatarMenuItem = {
  href?: Route;
  label: string;
  iconKey?: IconKey;
  onSelect?: () => void;  // for "Sign out" (form action)
  tone?: "default" | "danger";  // "danger" for sign-out
};

export type AvatarMenuProps = {
  viewer: ViewerIdentity;
  items: AvatarMenuItem[];
  "aria-label"?: string;  // defaults to "Account menu"
};
```

Default item set (binding):

1. `Settings` → `/settings`, icon `users` (or the most appropriate registry key)
2. `Notifications` → `/notifications`, icon `messageSquare`
3. `Privacy` → `/privacy`, icon `circleDashed` (or new `shield` glyph; add to registry if missing — per `agent-ui-rules.md` § 6, never inline)
4. `Billing` → `/billing`, icon `fileText`
5. `Sign out` → `onSelect` posts to the existing sign-out action (route handler), `tone="danger"`

Markup:

- trigger: `<button type="button" aria-haspopup="menu" aria-expanded={open}>` wrapping the existing `Avatar` component
- menu: DS `Popover` + DS `Menu` containing the items
- keyboard model: `Enter` / `Space` opens; `ArrowDown` / `ArrowUp` move focus through items; `Esc` closes; `Tab` closes and moves focus to next focusable element. Match the ARIA APG menu-button pattern
- the existing `viewer.settingsHref` field on `ViewerIdentity` becomes dead — drop it from `src/lib/identity/viewer.ts` after migration (only `displayName` and `avatarUrl` survive)

**Scope — integration**

- replace the `<Link className={styles.viewerLink}>` block in [src/components/shell/app-frame.tsx](../../src/components/shell/app-frame.tsx) with `<AvatarMenu viewer={viewer} items={DEFAULT_ACCOUNT_ITEMS} />`
- when `viewer` is `null`, render `<Link className={getButtonClassName({ size: "compact", variant: "secondary" })} href={buildAuthSignInPath(/* current path */)}>Sign in</Link>` in the same slot
- drop the `.viewerLink` selector from `app-frame.module.css` once the avatar trigger handles its own focus ring via the DS Menu trigger pattern
- the `(account)/layout.tsx` continues to render the Account nav rail — that surface is still the canonical view for those routes. The change is only that the avatar is no longer the only way to reach them and using it does not break the user out of their current role family

**Out of scope**

- adding a notification dot / badge on the avatar — separate task
- moving the Account routes under `(student)` or `tutor` parent paths — IA stays as-is
- a "switch role" affordance for users with both roles — separate task

**Acceptance criteria**

- clicking the avatar opens a popover menu; the route does not change until an item is selected
- the five default items render with their glyphs; `Sign out` is visibly differentiated (danger tone)
- the menu trigger and items pass keyboard / screen-reader checks per the ARIA menu-button pattern
- `viewer.settingsHref` is removed from `ViewerIdentity` and no consumer references it
- `docs/design-system/component-inventory-v1.md` § 3 lists `AvatarMenu`

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest unit test for `AvatarMenu`: opens on click, focuses first item, closes on `Esc`, navigates with arrows
- manual: sign in, click avatar from `/tutors`, `/results`, `/tutor/overview`, `/settings`; confirm the menu opens in all four places and the surrounding nav rail does not change

### 5.17 `P2-SUX-001-17` DS `BottomNav` primitive + adoption for student and tutor

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-14`, `P2-SUX-001-05` (student nav grouping)

**Problem**

At `< 768px` the top nav today wraps into 2–4 stacked rows of pills, especially on `/tutor/**` where the three nav groups each spawn their own wrapped row. The user has explicitly asked for the alternative: bottom nav with the core destinations + `More` for the overflow.

The DS has no `BottomNav` primitive today. The four other DS shell primitives (`AppFrame`, `TabBar`, `Menu`, `Popover`) compose into one, but the composition + the "anchored to bottom of viewport, safe-area aware, hides on scroll-down (optional)" behaviour belongs in a single primitive.

**Required source docs**

- the `-14` ADR (binding for the four-tab cores)
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 6a (DS extension)
- [docs/design-system/tokens-cheatsheet-v1.md](../design-system/tokens-cheatsheet-v1.md) (surface, ink, focus tokens; safe-area envs)
- [docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md](../architecture/accessibility-and-inclusive-ux-architecture-v1.md) (target sizes — 44 × 44px minimum on touch)

**Scope — new DS primitive**

Add `src/components/ui/bottom-nav.tsx` and `src/components/ui/bottom-nav.module.css`, exported from `src/components/ui/index.ts`.

Props:

```ts
export type BottomNavItem = {
  href: Route;
  label: string;
  iconKey: IconKey;          // required — bottom nav items always carry an icon
};

export type BottomNavProps = {
  items: BottomNavItem[];     // length 3..5
  overflowItems?: NavItem[];   // when set, the last slot becomes a "More" menu trigger
  "aria-label": string;
};
```

Markup + behaviour:

- outer `<nav aria-label={…}>` with `position: sticky; bottom: 0; padding-bottom: env(safe-area-inset-bottom);`
- one `<Link>` per item; the active item is matched the same way `AppFrameNav` already does (longest-prefix match against `usePathname()`)
- each slot stacks `<Icon size={20} />` above a 12px-line label. Slot min-width is `4.5rem`, min-height is `3.25rem` (so the touch target is ≥ 44 × 44px). Active slot uses `var(--forest-700)` ink; inactive uses `var(--ink-500)`
- the `More` slot opens a DS `Menu` containing `overflowItems` — same primitive `AvatarMenu` composes
- hides on `≥ 768px` via `display: none` in a media query — the top nav takes over above that breakpoint
- the surrounding `AppFrame` body adds `padding-bottom: calc(env(safe-area-inset-bottom) + 4rem)` on `< 768px` so content does not sit behind the dock

**Scope — adoption (binding cores)**

Per the `-14` ADR, the four-tab core per family is (final wording is the implementing agent's call within `agent-ui-rules.md` § 7):

- **Student core** (4 + More):
  - Match (`/match`, `studentRole` or new `compass` glyph)
  - Results (`/results`, `users`)
  - Lessons (`/lessons`, `calendar`)
  - Messages (`/messages`, `messageSquare`)
  - More → opens menu with: Browse (`/tutors`), Saved (`/saved`), Compare (`/compare`)
- **Tutor core** (4 + More):
  - Overview (`/tutor/overview`, `tutorRole`)
  - Lessons (`/tutor/lessons`, `calendar`)
  - Schedule (`/tutor/schedule`, `clock`)
  - Messages (`/tutor/messages`, `messageSquare`)
  - More → opens menu with: Profile, Credentials, Photo, Video, Earnings
- **Public family**: no `BottomNav` (covered in `-19`)
- **Account family**: no `BottomNav` (account routes reachable via the avatar menu; the bottom dock keeps showing the originating role family's tabs — student's dock or tutor's dock, depending on which family the user came from. Implementation note: the `(account)/layout.tsx` reads the previous family from the `Referer` header or — more reliably — from a small role-detection helper that reads the account's role and renders the correct dock. If both, render the student dock by default. Document the choice in the report)
- **Internal family**: no `BottomNav`

**Scope — integration**

- `AppFrame` accepts a new `bottomNavItems?: BottomNavItem[]` prop and an optional `bottomNavOverflowItems?: NavItem[]`
- each layout that consumes `AppFrame` passes its core + overflow set (the student / tutor / account / public layouts decide once; internal does not pass any)
- the existing `navItems` continue to drive the desktop top nav; at `< 768px` the desktop nav is hidden via the same media query that shows the bottom dock
- the `navigationByFamily` data structure in [src/lib/routing/navigation.ts](../../src/lib/routing/navigation.ts) gains a new optional `bottomNav?: BottomNavItem[]` and `bottomNavOverflow?: NavItem[]` per family, so the data stays centralised. Each layout reads from `navigationByFamily.<family>.bottomNav` instead of hardcoding the core list in the layout file

**Out of scope**

- hide-on-scroll behaviour — defer to a follow-on if needed
- per-tab badges / unread counts
- haptics or motion polish

**Acceptance criteria**

- on `< 768px`, every `(student)/**` and `tutor/**` route renders the bottom dock with its core four tabs + More
- on `≥ 768px`, no bottom dock is visible; the top nav takes over
- the page body does not overlap the dock at any viewport
- the More menu and the AvatarMenu both compose the same DS `Menu` primitive — no duplicated styling
- `(public)/**` and `internal/**` routes do not render the bottom dock
- `docs/design-system/component-inventory-v1.md` § 3 lists `BottomNav`

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest unit test for `BottomNav`: active-href resolution, More-menu open, four-tab + More render correctness
- manual: at 360 / 414 / 768 / 1024px, walk every `(student)` and `tutor` route; confirm the dock appears below 768 and disappears at 768

### 5.18 `P2-SUX-001-18` Desktop single-row header guarantee + `MoreMenu` overflow

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-14`, `P2-SUX-001-15`

**Problem**

The top header today uses `display: flex; flex-wrap: wrap` ([app-frame.module.css:28-35](../../src/components/shell/app-frame.module.css#L28-L35)) and `.navGroups { flex-wrap: wrap }` ([:98-104](../../src/components/shell/app-frame.module.css#L98-L104)). On any viewport too narrow to fit brand + nav + avatar in one line — that includes 768–1024px on the tutor family with its 9 items in 3 groups — the rows stack. The result is a header that can be three lines tall at 900px and still does not collapse to a hamburger or dock.

After `-17` lands the bottom dock takes over below 768px, but the 768–1024px band still wraps. The fix is to make the top bar a hard single row that collapses overflow into a `More` menu.

**Required source docs**

- the `-14` ADR
- [docs/design-system/component-specs-core-v1.md](../design-system/component-specs-core-v1.md) (Menu)
- W3C ARIA APG "Menu Button" pattern

**Scope**

- in `src/components/shell/app-frame-nav.tsx`, switch the top-bar render from `<TabBar … flex-wrap … />` to a measure-and-collapse pattern. Implementation approach (decide once, document in the report):
  - **option A (recommended):** use `ResizeObserver` on the nav container; on each width change, measure cumulative tab widths and move the trailing N tabs into a `More` menu when overflow is detected. Persist a `pinnedCount` in state. The non-pinned items render in a DS `Menu` triggered from a `More` button at the trailing edge of the nav row
  - **option B:** CSS-only — declare a fixed per-tab width and use `flex-basis` math; when the nav row would exceed the container, the trailing items are hidden via `:nth-child` rules and a `More` button always renders. This is simpler but less precise (label-length sensitivity)
- pick option A; option B is acceptable only if `ResizeObserver` introduces a render-loop bug the implementing agent cannot resolve. Either way, the visible single-row guarantee is binding
- `.headerInner` and `.navGroups` drop `flex-wrap: wrap`; the row uses `min-width: 0` and `flex: 1` on the nav container so it shrinks instead of wrapping
- the `More` button uses the same `MoreMenu` (DS `Menu` + DS `Popover`) composition as `AvatarMenu` and the bottom-dock `More` slot. Centralise the composition in `src/components/shell/more-menu.tsx` if the three call sites diverge; otherwise inline a small helper. No duplicated CSS
- grouped navs (tutor's three-group rail) become a single flat row at the top with `·` separators between groups (e.g. "Overview · Lessons · Schedule · Messages | Profile · Credentials · Photo · Video | Earnings"). When overflow kicks in, the trailing groups collapse first. Group labels are dropped on the top bar at `≥ 768px` — they survive only in the bottom dock's `More` menu and in the eyebrow vocabulary of the nav rail

**Out of scope**

- adding a search input or a global command menu — escalate before adding
- making the top bar sticky on scroll — separate decision (already render-stable today; sticky is a polish task)

**Acceptance criteria**

- at every viewport from 768px to 1920px, the top header is exactly one line tall
- when the nav row cannot fit all family items, a `More` button appears at the trailing edge of the nav row; clicking it opens a menu with the overflowing items
- no `flex-wrap: wrap` rule remains in `app-frame.module.css` on `.headerInner` / `.navGroups`
- group labels are no longer rendered as eyebrows above the top nav at any viewport — the row is flat
- avatar slot is always at the trailing edge of the row, never wraps below

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest / Playwright: resize the viewport from 1920 → 768 in 32px steps; the top bar height stays constant at every step; the `More` button appears when items overflow and disappears when they fit
- manual: at 800 / 1000 / 1200 / 1440px, confirm the tutor family fits in one row (overflow into `More` as needed) and avatar never wraps below

### 5.19 `P2-SUX-001-19` Public family mobile chrome — hamburger drawer

**Status:** `ready` · **Priority:** `P2`
**Depends on:** `P2-SUX-001-14`, `P2-SUX-001-15`, `P2-SUX-001-18` (the desktop overflow primitive — same `Menu` composition is reused)

**Problem**

The public family is the only `AppFrame` consumer that does not get a bottom dock (per the `-14` ADR — browsing surface, not workflow). On `< 768px` it still needs a usable mobile chrome instead of the current "wrap into stacked pill rows" behaviour. The natural answer for browsing-shaped IA is a hamburger drawer.

**Required source docs**

- the `-14` ADR
- [docs/design-system/component-specs-phase2-v1.md](../design-system/component-specs-phase2-v1.md) (`Popover`, `Menu`, overlay anatomy)
- W3C ARIA APG "Disclosure" pattern

**Scope**

- on `< 768px`, the public layout hides the inline top nav and renders a `<button>` with a hamburger icon at the leading edge of the top bar (left of the brand wordmark, or right of it — decide once; placement matches the `AvatarMenu` mirror so the two interactive elements bracket the brand)
- clicking the hamburger opens a DS `Popover` (full-width sheet at this breakpoint) containing the seven public nav items as a vertical list (`Home`, `Find Tutors`, `Get Matched`, `How It Works`, `Trust & Safety`, `Become a Tutor`, `Support`)
- when signed in, the same drawer optionally surfaces the "switch to your workspace" link at the top — a one-line shortcut to `/results` (student) or `/tutor/overview` (tutor) so the public surface is not a dead end for signed-in users. If signed out, the drawer ends with a `Sign in` link
- keyboard model: `Esc` closes; focus traps inside the drawer while open; opening moves focus to the first item; closing returns focus to the hamburger button (DS `Popover` already implements these guarantees)
- the hamburger button uses an `Icon` from the registry. If no `menu` glyph exists in the registry, add one in the same commit. Never inline `<svg>`
- on `≥ 768px` the hamburger is hidden and the existing inline top nav (with the `-18` overflow rule) takes over

**Out of scope**

- adding any new nav target to the public family
- making the hamburger a global pattern across role families — only public uses it (private families use the bottom dock)
- moving the brand or footer

**Acceptance criteria**

- at `< 768px` on every `(public)/**` route, a hamburger button appears in the top bar; clicking it opens the drawer; selecting an item navigates and closes the drawer
- at `≥ 768px` the hamburger is gone and the inline nav is back
- if no `menu` glyph existed in the registry before, it is now in `src/components/ui/icon.tsx`
- no public route renders the wrapped pill rows that exist today on `< 768px`

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test:e2e` (the public family is covered by the Playwright smoke suite — confirm the drawer renders and the navigation links still resolve)
- manual: at 360 / 414 / 768px, confirm the drawer opens and closes, focus traps correctly, and the signed-in shortcut to the user's workspace renders when applicable

### 5.20 `P2-SUX-001-20` First-final verification

**Status:** `ready` · **Priority:** `P2`

**Goal**

End-to-end walkthrough that subtasks `-01` through `-19` landed without regression, with explicit header coverage on every route family at every breakpoint. The Account family is verified separately in `-28` after `-21` through `-27` land.

**Required source docs**

- this document
- the `-14` ADR
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 8

**Scope**

- walk **every** route under `(public)/**`, `(student)/**`, `tutor/**`, `(account)/**`, `internal/**`, plus the `auth` and `setup` shells (the latter two use `FocusedFlowShell` — verify they were not affected)
- breakpoints: 360px, 414px, 768px, 1024px, 1280px, 1440px
- for each route + viewport, confirm:
  - header is exactly one row tall on `≥ 768px`; brand · nav (or `More`) · avatar all visible
  - on `< 768px`, the top bar shows brand + avatar only; private families show the bottom dock with four tabs + More; public shows the hamburger button
  - avatar always renders when signed in, on every route family including public
  - clicking the avatar opens `AvatarMenu`; selecting a menu item navigates without replacing the current family's nav rail / dock
  - all body-level acceptance criteria from `-01` through `-12` still hold
- update [docs/planning/phase2-task-pack-v1.md](phase2-task-pack-v1.md) with a footnote that the student UX polish pack and the header pack landed (link to this doc)
- update [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) with final entries for `AppHeader`, `AvatarMenu`, `BottomNav`, `StarRating`, `CompareReadinessNotice`
- close `P2-SUX-001` parent in this file with a one-paragraph close note under § 6

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`, `pnpm test:e2e` (the header pack touches the public family — the logged-out Playwright smoke suite must pass)

### 5.21 `P2-SUX-001-21` Canonical Account family IA + role-gating spec

**Status:** `ready` · **Priority:** `P1`

**Problem**

The Account family today (Settings / Notifications / Privacy / Billing) mixes four very different concerns with no role gating and overlapping responsibilities:

- `/settings` ([settings/page.tsx](../../src/app/(account)/settings/page.tsx)) renders a `Profile` Panel **plus** a `Notification preferences` Panel — the second Panel duplicates what `/notifications` is supposed to own
- `/notifications` ([notifications/page.tsx](../../src/app/(account)/notifications/page.tsx)) is a read-only inbox of past notifications; there is no preferences UI on this route even though its name suggests it
- `/privacy` ([privacy/page.tsx](../../src/app/(account)/privacy/page.tsx)) tells the user up-front to read the policy elsewhere, then renders four future-feature placeholder Cards ("Deferred controls — Delete-account, export, and advanced preferences ship in later phases"). The route's actual job today is legal-notice acknowledgement, but that purpose is buried under operator metrics
- `/billing` ([billing/page.tsx](../../src/app/(account)/billing/page.tsx)) is a student-only payment-history surface but is shown identically to tutor-only accounts — who see an empty list with an `InlineNotice` explaining that tutor payouts live elsewhere

The notification-preference categories ([src/modules/notifications/constants.ts:45-72](../../src/modules/notifications/constants.ts#L45-L72)) include `tutor_application_updates`, which is irrelevant to students, and `lesson_reminders` + `lesson_recaps`, which are relevant to both roles but described from the student perspective. A pure tutor sees a "Tutor application updates" toggle even after their application is approved; a pure student sees the same toggle next to "Lesson recaps" with no role context.

The user has explicitly asked for one decision before any code changes: what does each Account route do, who is it for, where do preferences live, and how does role membership change the UI.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 7 (copy discipline), § 8 (consistency checklist)
- [docs/architecture/canonical-value-ownership-map-v1.md](../architecture/canonical-value-ownership-map-v1.md)
- [docs/architecture/route-layout-implementation-map-v1.md](../architecture/route-layout-implementation-map-v1.md)
- [src/modules/accounts/account-state.ts](../../src/modules/accounts/account-state.ts) (`hasRole`, role-status snapshot)
- [src/modules/accounts/role-badges.ts](../../src/modules/accounts/role-badges.ts) (canonical role-badge mapping)
- [src/modules/notifications/constants.ts](../../src/modules/notifications/constants.ts) (`notificationCategories`, `NOTIFICATION_TYPE_TO_CATEGORY`)

**Canonical decision (binding for `-22` through `-27`)**

Four Account routes; one job each. Role-aware where the underlying data is role-specific.

| Route | Job | Role gating |
| --- | --- | --- |
| `/settings` | Identity + cross-role preferences (name, photo, email, language, timezone). Single page, no embedded notification panel | Visible to every signed-in account |
| `/notifications` | **Two-tab page** — `Inbox` (the existing read-only notification list) + `Preferences` (toggles, moved out of `/settings`). Default tab is `Inbox` | Visible to every signed-in account. Each tab role-gates its own content per `-23` |
| `/privacy` | Legal-notice acknowledgement + permanent links to the public Privacy Policy and Terms documents. **No future-feature placeholders** | Visible to every signed-in account |
| `/billing` | Student-side payment history only. Tutor-only accounts see a single-row redirect Panel pointing at `/tutor/earnings` instead of an empty history list | Conditional surface — see below |

Role-gating rules (binding):

1. **`/billing` for tutor-only accounts** (`hasRole(account, "student") === false && hasRole(account, "tutor") === true`): the page body is a single `Panel` titled "Tutor payouts live in Earnings" with a primary `Link` to `/tutor/earnings`. No payment history rendering. No "Scope guardrails" panel
2. **`/billing` for dual-role accounts** (both `student` and `tutor` roles): show the student payment history (since they may also book lessons), plus a small `InlineNotice` at the top with one link to `/tutor/earnings`. No "shared route" architectural copy
3. **`/notifications` Inbox tab**: filter the rendered notification types by the active roles. A tutor-only account does not see `lesson_request_submitted` from the student perspective (they only see the tutor-facing variants — same `lesson_request_submitted` event but the inbox already routes it to the right party via `account.id`, so this is purely a copy-label change covered in `-24`). A student sees their student-side events; a tutor sees tutor-side. Dual-role sees both
4. **`/notifications` Preferences tab**: hide notification categories whose target audience does not match the account's roles. `tutor_application_updates` is hidden for accounts without a tutor role (active or pending). `reviews` is hidden for accounts without a tutor role (the toggle is about tutor's review notifications). `lesson_reminders` and `lesson_recaps` are shown to both roles, but their description copy adapts per role
5. **Avatar menu (the `-16` consumer)**: the menu items continue to list all four Account routes. The avatar menu does not itself hide items by role — every account can reach Billing (which then role-gates its own body). This keeps the avatar menu shape stable across users
6. **Account nav rail** (rendered inside `(account)/layout.tsx`): same four entries for every signed-in account; the page body, not the nav, applies role gating. This matches the "every account can reach Billing" rule

**Scope — this task delivers the spec, not the implementation**

Produce three artifacts:

1. A new section in [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) § 4 (or a new § dedicated to Account routes) documenting the four routes' jobs, the role-gating rules above, and the binding decision that notification preferences live on `/notifications`
2. A new ADR-style page at `docs/architecture/account-family-shape-v1.md` capturing the IA decision (preferences moved out of `/settings`, `/billing` becomes role-aware, `/privacy` is a legal-ack surface) and the rationale (each route does exactly one thing; role gating is body-level, not nav-level)
3. A short update to [docs/architecture/route-layout-implementation-map-v1.md](../architecture/route-layout-implementation-map-v1.md) pointing at the new ADR

No code lands in this task. Subtasks `-22` through `-27` implement against this spec.

**Out of scope**

- adding delete-account or data-export features (those are future-phase work; the `/privacy` surface stops admitting that gap, but does not start delivering it)
- adding password / 2FA / session-management to `/settings` (separate phase)
- moving any Account route under `(student)` or `tutor` parent paths — IA stays where it is
- adding new notification categories or types
- adding a global preferences "Save" pattern — the existing optimistic-toggle UX in `NotificationPreferencesForm` is the binding interaction model

**Acceptance criteria**

- `docs/design-system/component-inventory-v1.md` documents the four Account-route jobs and the role-gating rules
- `docs/architecture/account-family-shape-v1.md` exists with the IA decision and rationale
- `docs/architecture/route-layout-implementation-map-v1.md` references the new ADR

**Verification**

- doc-only task. `pnpm lint:arch` still passes (no code change)
- review: the four route jobs cover every visible Account surface today; no route is left without a binding "what does this do?" sentence

### 5.22 `P2-SUX-001-22` Consolidate notification preferences into `/notifications`

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-21`

**Problem**

The notification-preference UI exists twice today:

- as a **Panel inside `/settings`** ([settings/page.tsx:56-64](../../src/app/(account)/settings/page.tsx#L56-L64), rendering `NotificationPreferencesForm`)
- as a **route name** (`/notifications`) that does **not** actually expose any preference toggles — it is a read-only inbox

So the user looking for "where do I turn off lesson reminder emails?" lands on `/notifications` (correct mental model), finds no toggles, then has to discover them buried at the bottom of `/settings`. This is exactly the IA confusion the user called out.

**Required source docs**

- the `-21` ADR
- existing `NotificationPreferencesForm` in [settings/notification-preferences-form.tsx](../../src/app/(account)/settings/notification-preferences-form.tsx) (keep behaviour; only move location)
- existing `notificationCategories` data shape in [src/modules/notifications/constants.ts](../../src/modules/notifications/constants.ts)
- DS `TabBar` ([src/components/ui/tab-bar.tsx](../../src/components/ui/tab-bar.tsx)) — link mode (already used on `/results`)

**Scope — `/notifications` becomes a two-tab page**

- in [src/app/(account)/notifications/page.tsx](../../src/app/(account)/notifications/page.tsx), read a single search param `?tab=inbox|preferences` (default `inbox`)
- render the canonical page intro (per `P2-SUX-001-06`-style shape — eyebrow "Notifications" + title "Notifications" + one-line description) at the top
- render a DS `TabBar` (link mode) with two tabs: `Inbox` (`/notifications`) and `Preferences` (`/notifications?tab=preferences`). The TabBar lives directly below the intro
- `Inbox` tab renders the existing notification list (subject to the copy pass in `-24` and role gating in `-23`)
- `Preferences` tab renders the existing `NotificationPreferencesForm` — moved verbatim from `/settings`. The form file relocates from `src/app/(account)/settings/notification-preferences-form.tsx` to `src/app/(account)/notifications/notification-preferences-form.tsx`. Its companion Server Action `notification-preference-actions.ts` moves with it
- the existing Server Action contract does not change — the form posts to the same action with the same shape. Only the file path moves

**Scope — `/settings` loses the duplicate Panel**

- delete the `Notification preferences` Panel from `/settings/page.tsx` (lines 56-64). Delete the now-unused `notificationPreferenceSnapshot` fetch and `getNotificationPreferenceSnapshot` import on this page
- the `/settings` page becomes a single Profile Panel — handled by `-27`
- a small one-line link "Manage notification preferences" inside the profile Panel's footer points at `/notifications?tab=preferences` for discoverability. Use a plain `<Link>` underneath the form, not a button

**Out of scope**

- adding new notification categories
- changing the optimistic-toggle interaction in `NotificationPreferencesForm` (covered by `-23` for content gating only)
- adding a "Save all" button — the form remains per-toggle optimistic

**Acceptance criteria**

- `/settings` no longer contains a Notification preferences Panel
- `/notifications?tab=preferences` renders the toggle form; `/notifications` (no param) renders the inbox
- both tabs render the same canonical page intro
- the existing notification-preference Server Action contract is preserved (no schema change)
- `grep -rn "NotificationPreferencesForm" src/app/(account)/settings` returns zero hits

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest: existing notification-preference tests stay green (they target the action, not the route)
- manual: toggle a category in `Preferences`, refresh, confirm persistence; switch back to `Inbox` and confirm the list still renders

### 5.23 `P2-SUX-001-23` Role-gate notification categories

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-21`, `P2-SUX-001-22`

**Problem**

`NotificationPreferencesForm` renders every category in `notificationCategories` ([constants.ts:45-50](../../src/modules/notifications/constants.ts#L45-L50)) unconditionally:

- `lesson_reminders` — relevant to both roles
- `reviews` — labelled "Notices when a student leaves a review on a lesson you taught" — **tutor-only** in description, but shown to every account
- `tutor_application_updates` — **tutor-only** in description and in audience, but shown to every account
- `lesson_recaps` — described as "Continuity notes your tutor shares after a lesson is complete" — **student-only** in description

So a pure student sees toggles for "Reviews" and "Tutor application updates" they will never receive; a pure tutor sees "Lesson recaps" framed from the student perspective. The same `Inbox` tab from `-22` has the matching problem: notification type labels (e.g., "Lesson recap shared", "Application sent") render regardless of which side of that event the account is on.

**Required source docs**

- the `-21` ADR
- [src/modules/notifications/constants.ts](../../src/modules/notifications/constants.ts) (`notificationCategories`, `NOTIFICATION_TYPE_TO_CATEGORY`)
- [src/modules/accounts/account-state.ts](../../src/modules/accounts/account-state.ts) (`hasRole`)

**Scope — category audience metadata**

- extend `src/modules/notifications/constants.ts` with one new constant:

```ts
export const NOTIFICATION_CATEGORY_AUDIENCE: Record<NotificationCategory, "student" | "tutor" | "both"> = {
  lesson_reminders: "both",
  reviews: "tutor",
  tutor_application_updates: "tutor",
  lesson_recaps: "student",
};
```

- extend the `NOTIFICATION_CATEGORY_DESCRIPTIONS` map with role-aware descriptions only for the `both` categories (so `lesson_reminders` carries one description for a student account and another for a tutor account; the existing single-string field becomes a small `{ student: string; tutor: string }` object for `lesson_reminders`). The other three categories retain a single description string since their audience is single-role
- the `audience` field is purely metadata. No DB column, no DTO, no migration — it is a static lookup

**Scope — Preferences tab role filtering**

- in the relocated `NotificationPreferencesForm` (post-`-22`), filter `notificationCategories` by the account's active roles before rendering:
  - if `hasRole(account, "tutor")`, include categories whose audience is `tutor` or `both`
  - if `hasRole(account, "student")`, include categories whose audience is `student` or `both`
  - a dual-role account sees every category
  - account with no active role (pending setup) does not reach `/notifications` (the existing `getSharedAccountRouteContext` already gates this — confirm; if not, gate at the page level)
- the form's underlying Server Action keeps accepting the full category set — the filter is presentation-only, so existing rows for hidden categories continue to persist correctly. No data loss when a user gains or loses a role later

**Scope — Inbox tab notification-type labels**

- the existing `getNotificationTypeLabel` map in [notifications/page.tsx:210-243](../../src/app/(account)/notifications/page.tsx#L210-L243) flattens every type into one string. After `-24` rewrites the copy, the same map gets a role-aware variant for the three ambiguous types:
  - `lesson_report_shared` — student: "Lesson recap from your tutor"; tutor: "Recap shared with student" (a tutor sees this event when they themselves published the recap)
  - `review_submitted` — student: "Your review published"; tutor: "New review on your teaching"
  - `lesson_accepted` / `lesson_declined` — already symmetric; no change
- this is metadata-only; no DTO field is added. The page reads the account's role and selects the right label string

**Acceptance criteria**

- a pure student visiting `/notifications?tab=preferences` sees `Lesson reminders` and `Lesson recaps` only
- a pure tutor visiting `/notifications?tab=preferences` sees `Lesson reminders`, `Reviews`, and `Tutor application updates`
- a dual-role account sees all four categories
- the `lesson_reminders` description text adapts to the active role
- in the `Inbox` tab, `lesson_report_shared` and `review_submitted` labels read from the role-appropriate string

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest: new unit tests for the audience-filter helper and the role-aware label helper
- manual: sign in as a student-only and a tutor-only account; walk the Preferences and Inbox tabs; confirm visible category and label differences

### 5.24 `P2-SUX-001-24` Copy + IA pass on `/notifications`

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-SUX-001-22`

**Problem**

Even after `-22` and `-23` reshape `/notifications`, the existing copy on the route is operator-shaped:

- `InlineNotice title="Product inbox only"` with body "Tutor-student chat stays in the dedicated Messages route so conversation traffic does not mix with the bell-style product notification inbox" — this is an architecture decision being explained to the user
- `Panel title="Channel rule"` with three `StatusBadge`s: `Bell inbox`, `Lifecycle updates`, `No chat replay`. The badge "No chat replay" reads as a feature gap excuse
- `Panel title="Notification summary"` with three `Card`s: `Visible product updates`, `Unread updates`, `Legal notices retained here`. "Visible" and "retained here" are operator words. The user wants to know "how many do I have?" — not "how many are *visible*"
- `Panel title="Latest product updates"` with description "Notifications stay summarized and safe to render without exposing raw lesson or message payloads." — pure operator language
- Empty-state copy "No bell-style product updates yet — lifecycle and legal items will appear here as soon as they happen. The bell inbox stays separate from the Messages route by design." — three architectural concepts (bell-style, lifecycle, separate from Messages) crammed into two sentences

The user-visible reading: the `/notifications` page is currently an internal architecture FAQ with notifications tacked on.

**Required source docs**

- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 7 (copy discipline)
- the `-21` ADR

**Scope**

- delete the `InlineNotice title="Product inbox only"` block entirely. The Inbox / Preferences tab pair already implies the route's job
- delete the `Channel rule` Panel entirely. The badge vocabulary ("Bell inbox", "Lifecycle updates", "No chat replay") has no user value
- delete the `Notification summary` metric grid. Notification counts are visible by reading the list; if a single "X unread" count is helpful, render it as a small chip next to the page title in the `Inbox` tab — not a three-Card grid
- the `Panel title="Latest product updates"` becomes just the list — drop the surrounding Panel entirely, since the page intro already names this section ("Notifications" / "Notifications")
- rewrite the empty-state copy to: title "No notifications yet" + description "Lesson, payment, and legal updates will appear here as soon as they happen." Drop the second sentence about chat
- per-notification `Card`: keep one `StatusBadge` (the **type** badge — e.g., "Lesson accepted", "Legal update"). Drop the second status badge (`Unread` / `Read` / `Dismissed`); unread state becomes a visual treatment of the Card itself (subtle border or background — Card already supports `selected`; reuse that affordance) so the badge row is not duplicated
- rename the `getNotificationTypeLabel` strings where they read operator-shaped:
  - "Chat message" stays (user-shaped)
  - "Lesson request" stays
  - "Application sent" → "Tutor application sent"
  - "Application reviewed" → "Application reviewed"
  - "Lesson expired" → "Lesson request expired"
  - "Payout update" → "Payout updated"
- the `Mark all as read` and per-card `Mark as read` / `Dismiss` / `Restore` actions all stay — they are the inbox's job and the wording is already direct

**Acceptance criteria**

- `grep -n "Bell inbox\|Channel rule\|No chat replay\|bell-style\|Product inbox only\|Visible product updates\|retained here" src/app/(account)/notifications` returns zero hits
- the Inbox tab opens directly into the notification list under the intro; no architectural notice rail above the list
- each notification card shows exactly one `StatusBadge` (the type), with unread state expressed as a Card treatment

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: with three unread + two read notifications, confirm the visual differentiation is clear without two badges; mark one read and confirm the Card treatment updates

### 5.25 `P2-SUX-001-25` Copy + IA pass on `/privacy`

**Status:** `ready` · **Priority:** `P1`

**Problem**

`/privacy` today is a mix of three things, none of which it does well:

1. **Operator metrics**: "Published legal notices" / "Updates still needing review" / "Notices with acknowledgement tracking" — three counts in a `metricGrid` that no user has asked for
2. **Future-feature placeholders**: the `Privacy surface scope` Panel renders a `Card` with copy "Deferred controls — Delete-account, export, and advanced preferences ship in later phases." A user-facing route should not advertise its own gaps
3. **Legal-notice acknowledgement** (the actual job): a `highlightedNotice` Panel with the current notice + the "Acknowledge and continue" CTA, plus a `Published legal notice history` Panel below. This part is fine in concept but buried under the operator copy

The page also redirects the user away in its description: "See the public Privacy Policy and Terms for the canonical legal text." — the canonical legal text **should be linkable from here**, not announced as living elsewhere.

**Required source docs**

- the `-21` ADR
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 7
- existing `listLegalNoticesForAccount` + `requiresLegalNoticeAction` helpers in `src/modules/notifications/legal-notices` (keep, no API change)

**Scope**

- rename the page from `/privacy` to a clearer surface job — keep the route path `/privacy` (no URL change), but rename the page title from `Privacy & legal` to **`Legal & privacy`**, with description "Review required policy updates and find your account's legal documents." (one sentence, no "see elsewhere" pointer)
- delete the `Privacy surface scope` Panel entirely. Replace with a small `Section` titled "Policy documents" (or render as an inline link strip) listing three links: `Privacy Policy` → `/privacy-policy`, `Terms` → `/terms`, `Trust & Safety` → `/trust-and-safety`. Use the existing DS `getButtonClassName({ variant: "secondary", size: "compact" })` for the link buttons. This is the "links to canonical text live HERE" change
- delete the `Current notice state` metric Panel entirely
- the existing `highlightedNotice` Panel stays — that's the actual job. Trim its copy:
  - drop the description sentence "Legal updates stay visible after sign-in and remain accessible later in this shared privacy route." (operator language)
  - keep the three `StatusBadge`s (notice type / version / "Acknowledgement tracked"); drop "Acknowledgement tracked" — the action button below already implies tracking
  - keep the `Open full document` + `Acknowledge and continue` actions
- the `Published legal notice history` Panel stays. Trim its description "Unauthorized or missing notice selections collapse to the shared 404 posture instead of leaking private object state." (pure operator language) to "" or drop the description prop entirely. Keep the list of past notices, since the history is genuinely useful — but rename the `Focus notice` link to `Open notice`
- empty-state copy becomes title "No published policies yet" + description "Terms and privacy updates will appear here when published." (drop the policy-publication-flow meta-talk)

**Acceptance criteria**

- `grep -n "Privacy surface scope\|Deferred controls\|Current notice state\|ship in later phases\|posture\|leaking private object state\|Focus notice" src/app/(account)/privacy` returns zero hits
- the route renders, top to bottom: page intro → optional pending-legal notice → current notice Panel (if any) → Policy documents links → published-history Panel
- the three policy links (`/privacy-policy`, `/terms`, `/trust-and-safety`) are rendered on the route

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: with an active legal notice requiring acknowledgement, confirm the flow still works end-to-end (acknowledge → notice clears); with no pending notice, confirm the route renders the published-history list and the three policy links

### 5.26 `P2-SUX-001-26` Role-gate + simplify `/billing`

**Status:** `ready` · **Priority:** `P2`
**Depends on:** `P2-SUX-001-21`

**Problem**

`/billing` today is shown identically to every signed-in account. The page is conceptually student-only (it shows the user's payment history as a learner), but a tutor-only account sees:

- an empty list with `InlineNotice title="Billing history only"` body "This shared account route is for learner-side payment history. Tutor payout operations remain separate on the tutor earnings route."
- a `Scope guardrails` Panel with badges "Shared account route", "Payer-safe summary", "No payout controls here"
- the same three operator metric Cards as a student would see, all with zeros

That is a dead-end surface for tutor-only accounts.

The student rendering also leaks Stripe-shaped vocabulary: "Captured or refunded value", "Authorizations awaiting capture", "Refunded payments" use the Stripe state machine words, not the student's mental model.

**Required source docs**

- the `-21` ADR
- [src/modules/accounts/account-state.ts](../../src/modules/accounts/account-state.ts) (`hasRole`)
- existing `listAccountBillingHistory` (keep, no API change)

**Scope — role-gate the page body**

- after `getSharedAccountRouteContext` resolves, branch on `hasRole(account, "student")`:
  - **tutor-only** (`hasRole === false` for student, `true` for tutor): render the canonical page intro + a single `Panel` titled "Tutor payouts live in Earnings" with one CTA `<Link>` to `/tutor/earnings`. Drop the `InlineNotice`, the `Scope guardrails` Panel, the metric grid, and the history list entirely
  - **student** or **dual-role**: render the existing history surface, simplified per the next bullet
- the existing nav rail still shows Billing for every account (per the `-21` decision — nav stays stable; the body adapts)

**Scope — simplify the student body**

- delete the `InlineNotice title="Billing history only"` block. The route's job is implied by its name
- delete the `Scope guardrails` Panel entirely (three architectural badges, body text "This page is intentionally limited to operational billing status, amount, and timeline visibility for the paying account owner." — pure operator copy)
- the `Billing snapshot` Panel keeps the three metric Cards but renames the labels to user-shaped vocabulary:
  - "Captured or refunded value" → "Total paid"
  - "Authorizations awaiting capture" → "Awaiting confirmation"
  - "Refunded payments" → "Refunds"
- the per-entry `Card` title `Lesson payment` is correct but lacks context. Render the lesson date inline if the underlying DTO carries it (it does — `entry.createdAt` is the booking date). If a lesson reference is available on the entry, append it ("Lesson payment · Mar 12"); if not, leave it. No DTO change
- the empty-state copy becomes title "No payments yet" + description "Your first lesson payment will appear here once you book a tutor."

**Acceptance criteria**

- a tutor-only account visiting `/billing` sees one Panel with the Earnings CTA; the page renders no payment-history shapes or operator copy
- a student visiting `/billing` sees the three renamed metric labels and no "Scope guardrails" Panel
- `grep -n "Scope guardrails\|Shared account route\|Payer-safe summary\|No payout controls here\|Billing history only" src/app/(account)/billing` returns zero hits
- `hasRole(account, "student")` is checked in the page-level branch

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- manual: sign in as a tutor-only test account → confirm `/billing` shows only the Earnings CTA; sign in as a student account with one captured payment → confirm the renamed metric labels render

### 5.27 `P2-SUX-001-27` `/settings` profile cleanup

**Status:** `ready` · **Priority:** `P2`
**Depends on:** `P2-SUX-001-22` (the duplicate notification-preference Panel is already removed there)

**Problem**

`/settings` after `-22` reduces to one `Profile` Panel. Two issues remain in the Profile form itself:

1. The `Preferred lesson language` `OptionCardGroup` reads as student-shaped vocabulary. For a tutor, "preferred lesson language" is ambiguous — the tutor's teaching languages live on their tutor profile under `/tutor/profile`, and the account-level value drives the discovery / match prefill for the student side. A tutor who lands on `/settings` sees a single language selector with no role context and reasonably wonders "which one is this?"
2. The `Timezone` `Section` shows the timezone as plain text (`<p className={styles.settingValue}>{timezone}</p>`) — no edit affordance. The timezone is set during `ensureAuthAccount` from the browser and is rarely updated afterwards. That is **probably** the right product behaviour (most users do not travel between zones), but the UI gives no signal that this is intentional vs broken. A short helper line clarifies

The current `email` Section is identical (read-only display) — and the same helper-text fix applies.

**Required source docs**

- the `-21` ADR
- existing `SettingsProfileForm` ([settings/settings-form.tsx](../../src/app/(account)/settings/settings-form.tsx))
- [src/lib/datetime/format.ts](../../src/lib/datetime/format.ts) (`getTimezoneLabel` for prettier rendering, if available)

**Scope**

- rename the form's `Preferred lesson language` `Section eyebrow` to **`Lesson language`** (one word shorter, less ambiguous) and add a one-line `description` below the legend that adapts to the active roles:
  - student-only: "We use this to filter tutors by lesson language during matching."
  - tutor-only: "We use this for your own communication with Mentor IB and as a default when you message students."
  - dual-role: "We use this for matching as a student and for Mentor IB communication as a tutor."
- the underlying field name (`preferredLanguageCode`) and the action contract do not change — only the eyebrow and description copy
- on the `Email` `Section`, add helper text below the value: "Sign in email cannot be changed here. Contact Support to update it." (matches existing platform behaviour — the email is set at sign-up and not user-editable in MVP)
- on the `Timezone` `Section`, render the timezone with `getTimezoneLabel(timezone)` (e.g., "Europe/Madrid · CET") instead of the raw IANA identifier, and add helper text: "Mentor IB detects your timezone at sign-in. Travelling? Booking and lessons always display in this zone until detection picks up a new one." (one sentence)
- the existing `roleBadges` strip below the display name stays unchanged — it is the canonical role-mix surface
- add a one-line link below the form: "Manage notification preferences →" pointing to `/notifications?tab=preferences` (per the `-22` discoverability hook)

**Out of scope**

- adding a manual timezone selector (separate decision — escalate if the platform decides to support traveller flows)
- adding email change / verification flow
- adding name-format validation beyond what `updateAccountProfileAction` already does

**Acceptance criteria**

- the `Lesson language` Section title and per-role description are rendered correctly for the three role combinations (single student, single tutor, dual-role)
- the `Email` Section shows the "cannot be changed here" helper
- the `Timezone` Section shows the prettier label + the traveller helper
- the link to `/notifications?tab=preferences` appears at the bottom of the form
- `updateAccountProfileAction` continues to accept the same payload; no schema change

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- manual: sign in as a student-only, a tutor-only, and a dual-role test account; confirm the Lesson language description adapts; confirm the email + timezone helper text is visible and the notification-preferences link reaches the right surface

### 5.28 `P2-SUX-001-28` Final verification (full pack incl. Account family)

**Status:** `ready` · **Priority:** `P2`

**Goal**

End-to-end walkthrough that the Account family work (`-21` through `-27`) landed without regression, alongside the rest of the pack.

**Required source docs**

- this document
- the `-21` ADR
- [docs/design-system/agent-ui-rules.md](../design-system/agent-ui-rules.md) § 8

**Scope**

- walk every `(account)/**` route for three role combinations: a student-only account, a tutor-only account, a dual-role account
- breakpoints: 360px, 768px, 1280px
- for each combination + viewport, confirm:
  - `/settings` shows one Profile Panel with role-aware `Lesson language` description; no embedded notification-preferences Panel; the "Manage notification preferences →" link is visible
  - `/notifications` opens on the `Inbox` tab by default; switching to `Preferences` renders the toggle form with role-filtered categories (student-only sees 2 categories, tutor-only sees 3, dual-role sees 4)
  - `/notifications` Inbox copy no longer mentions "Bell inbox", "Channel rule", "No chat replay", or any architectural vocabulary; each notification card carries exactly one `StatusBadge`
  - `/privacy` renders the page intro, the optional pending-legal notice, the current-notice Panel (if any), the Policy documents links, and the published-history list — no metric grid, no "Privacy surface scope" Panel, no future-feature placeholder
  - `/billing` renders the Earnings CTA Panel for a tutor-only account, the simplified history for a student; the renamed metric labels are visible
- re-walk a representative student route (`/results`) and a representative tutor route (`/tutor/overview`) to confirm none of the body changes from earlier subtasks regressed
- update [docs/planning/phase2-task-pack-v1.md](phase2-task-pack-v1.md) with a footnote that the Account family pack landed (link to this doc)
- update [docs/design-system/component-inventory-v1.md](../design-system/component-inventory-v1.md) with the final entries for the Account family routes
- close `P2-SUX-001` parent in this file with a one-paragraph close note under § 6

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- `pnpm test:e2e` is **not** required for the Account family work alone — but it is required if any prior subtask touched the public, auth, `robots.ts`, or `sitemap.ts` surfaces (the header pack did). Run it once at this point to cover both packs

## 6. Closure notes

**First wave (subtasks `-01` through `-13`) — closed 2026-05-25.** The first wave of `P2-SUX-001` landed end-to-end. The lesson-detail token vocabulary was migrated to `--ink-*` / `--body-*` / `--line-body` on both student and tutor sides (`-01`), the route-local Unicode-star markup was replaced by a single DS `StarRating` primitive (`-02`), `/compare`'s route-local `.column` Card recreation was rebuilt on the DS `Card` / `Panel` surface (`-03`), `/book/[context]`'s route-local hero typography and metric literals were removed (`-04`), the student nav grouped into Find / Decide / Use with `/compare` promoted to a first-class rail entry (`-05`), every `/(student)/**` route now carries the canonical eyebrow + h1 + description page intro followed by `TimezoneNotice` (`-06`), the three near-duplicate compare-readiness summaries collapsed into one `CompareReadinessNotice` continuity composer (`-07`), the "summary + handoff" Panel pairs on `/results` / `/saved` / `/compare` were removed (`-08`), lesson-detail headings deduped (`-09`), the booking sidebar simplified into one `Section` (`-10`), the student copy pass tightened `InlineNotice` titles and removed redundant subtitles (`-11`), and the icon usage pass adopted `ScreenState icon` on every student empty state (`-12`). End-to-end verification under `-13` confirmed every `/(student)/**` route renders one page title, the canonical intro, the timezone notice directly below the intro, three nav groups with `/compare` reachable in one click, registry icons on every empty/error state, no Unicode-character star markup, no raw `lessonStatus` / `paymentStatus` enum strings, and no inline `style={{ … }}` on text rendering paths. The parent task remains open through the cross-family header pack (`-14` … `-20`) and the Account-family pack (`-21` … `-28`); their closure notes append here as each wave lands.

## 7. Manual smoke checklist for the human (to run after each subtask)

For every subtask that ships, the human should run through:

- sign in as a student with no active learning need → `/match` shows the canonical intro + the three-step wizard; submitting walks to `/results`
- with a `ready` match run → `/results` opens straight to intro → timezone → need bar → match rows (no explanatory summary panels)
- save two tutors → `/saved` shows them in a list with one shared compare-readiness notice; `/compare` shows them side-by-side with content-sized status badges, no full-width row stretching, and the column uses a DS primitive (Card/Panel)
- start a booking → `/book/[context]` shows the canonical intro + need bar + sidebar summary that reads as one block, no nested Cards
- with a completed lesson and tutor recap → `/lessons/[id]` shows a single lesson-recap block (no six-level heading stack); the existing star rating renders as Lucide icons, not Unicode characters; body text uses the documented `--ink-*` palette and the documented `--body-*` / `--line-body` ramp
- the student nav rail shows three group labels (Find / Decide / Use) at desktop and remains usable at 360px; `/compare` is one click from the rail on every student route
- on every route family that uses `AppFrame`, the header is exactly one row tall at desktop widths and the avatar appears in the same screen position
- on `< 768px` for `(student)/**` and `tutor/**`, the bottom dock shows four core tabs + More; the top bar carries only brand + avatar
- on `< 768px` for `(public)/**`, the hamburger drawer opens and closes cleanly; signed-in users see a "switch to your workspace" shortcut at the top of the drawer
- clicking the avatar from any route opens a popover menu with Settings / Notifications / Privacy / Billing / Sign out — the surrounding nav rail (or bottom dock) does not change until a menu item is selected
- `/settings` is one Profile Panel; `/notifications` carries the toggles inside a `Preferences` tab; `/privacy` shows the legal-acknowledgement surface plus three policy-document links; `/billing` shows a single Earnings CTA for tutor-only accounts and the simplified history for students
- the notification preferences shown to the user match their active roles (student-only sees 2 categories, tutor-only sees 3, dual-role sees 4); the `lesson_reminders` description adapts per role
