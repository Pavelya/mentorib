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
| 5 | `P2-SUX-001-13` | `ready` | `P2` | Final verification: walk every `/(student)/**` route on desktop + mobile, confirm all subtasks |

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

### 5.13 `P2-SUX-001-13` Final verification

**Status:** `ready` · **Priority:** `P2`

**Goal**

End-to-end walkthrough that the previous twelve subtasks landed without regression and that no new DS or copy drift was introduced.

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

## 6. Closure notes

`P2-SUX-001` parent is open. Update this section when `-13` lands.

## 7. Manual smoke checklist for the human (to run after each subtask)

For every subtask that ships, the human should run through:

- sign in as a student with no active learning need → `/match` shows the canonical intro + the three-step wizard; submitting walks to `/results`
- with a `ready` match run → `/results` opens straight to intro → timezone → need bar → match rows (no explanatory summary panels)
- save two tutors → `/saved` shows them in a list with one shared compare-readiness notice; `/compare` shows them side-by-side with content-sized status badges, no full-width row stretching, and the column uses a DS primitive (Card/Panel)
- start a booking → `/book/[context]` shows the canonical intro + need bar + sidebar summary that reads as one block, no nested Cards
- with a completed lesson and tutor recap → `/lessons/[id]` shows a single lesson-recap block (no six-level heading stack); the existing star rating renders as Lucide icons, not Unicode characters; body text uses the documented `--ink-*` palette and the documented `--body-*` / `--line-body` ramp
- the student nav rail shows three group labels (Find / Decide / Use) at desktop and remains usable at 360px; `/compare` is one click from the rail on every student route
