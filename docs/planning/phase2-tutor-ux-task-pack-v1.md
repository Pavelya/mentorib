# Mentor IB Phase 2 Tutor UX/UI Polish Task Pack v1

**Date:** 2026-05-18
**Status:** `ready` — concrete polish pack for the `/tutor/**` surfaces after the `P2-MEDIA-001` family closed. Implementation lives in the subtasks below; each subtask is independently `ready` and individually verifiable.
**Scope:** every page under `src/app/tutor/**` plus the shared shell wiring (`src/components/shell/app-frame.tsx`, `src/lib/routing/navigation.ts`). No new functional flows — the goal is to align the existing tutor surfaces with the design system, simplify copy, hide irrelevant operator detail, and reduce visual weight so the daily tutor experience feels deliberate and easy.

## 1. Why this pack exists

`P1-TUTOR-*`, `P2-APPLY-*`, `P2-PROFILE-001`, `P2-MEDIA-001` and the schedule/earnings tasks shipped the tutor product surface in working order, but each task focused on its own slice. Reviewing the full tutor area end-to-end now reveals systemic problems that no single feature task owns:

- the route topology is flat (six sibling nav items, plus four reserved profile sub-routes) with no hierarchy or grouping
- multiple surfaces present the same readiness status with different vocabularies
- forms expose internal Stripe and scheduling jargon to tutors
- copy patterns duplicate "eyebrow + title + section eyebrow + section title" three deep on one panel
- DS-first has been violated in three concrete spots: a standalone `StatusBadge` rendered as a grid item stretches to full row width on `/tutor/profile/photo` and `/tutor/profile/video`; the credential upload uses bare `<input type="file">`; the "Accepting new students" toggle uses a bare `<input type="checkbox">` instead of the DS `Switch`
- a typography token (`--display-sm`) is referenced in five CSS modules but is not defined in `src/styles/globals.css`, so the page title in `/tutor/apply`, `/tutor/profile`, `/tutor/profile/photo`, `/tutor/profile/video`, and `/tutor/profile/credentials` is falling back to browser default sizing
- the weekly-availability editor is a per-row form; the schedule policy exposes timezone, lead time, daily cap, weekly cap, buffer-before, buffer-after, and accept-new-students as one wall of fields

This pack collects those issues into discrete, testable tasks future AI agents can pick up one at a time.

## 2. Source-of-truth pointers

Every UI-affecting subtask must read these before editing:

- `CLAUDE.md`
- `docs/design-system/agent-ui-rules.md` (DS-first, copy discipline, reuse-before-extend)
- `docs/design-system/component-inventory-v1.md` (existing primitives + extension rules)
- `docs/design-system/tokens-cheatsheet-v1.md` (the only approved token vocabulary)
- `docs/design-system/design-system-spec-final-v1.md` and `docs/design-system/component-specs-core-v1.md` / `component-specs-phase2-v1.md` (canonical primitive anatomy)
- `docs/architecture/canonical-value-ownership-map-v1.md` (reference-data ownership; timezone via `src/lib/datetime/**`; currency via `src/modules/pricing/**`)
- `docs/data/tutor-listing-readiness-model-v1.md` (the canonical readiness vocabulary the editor and overview must align on)
- the route-layout map at `docs/architecture/route-layout-implementation-map-v1.md` for any nav grouping change

Out of scope for every subtask in this pack (binding):

- adding any new third-party library (charting, calendar, drag-and-drop, etc.) — escalate per `CLAUDE.md`
- adding any reference data, status enum, or business rule
- redesigning the public tutor profile at `/tutors/[slug]`
- changing the underlying domain modules under `src/modules/tutors/**`, `src/modules/payouts/**`, or `src/modules/messages/**` — UI-only edits; if a query/DTO needs an extra field, that is a scope expansion that requires escalation
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
| 1 | `P2-TUX-001-01` | `ready` | `P1` | Define `--display-sm` token (or migrate consumers to `--title-xl`) |
| 1 | `P2-TUX-001-02` | `ready` | `P1` | Fix standalone `StatusBadge` row-stretching on photo/video managers |
| 1 | `P2-TUX-001-03` | `ready` | `P1` | DS `FileField` primitive + adopt across credential upload and replace flows |
| 1 | `P2-TUX-001-04` | `ready` | `P1` | Replace bare checkbox in `SchedulePolicyForm` with DS `Switch` |
| 2 | `P2-TUX-001-05` | `ready` | `P1` | Tutor nav grouping in `AppFrame` (Workspace / Profile / Money) |
| 2 | `P2-TUX-001-06` | `ready` | `P1` | Overview vs Profile information-architecture split |
| 2 | `P2-TUX-001-07` | `ready` | `P2` | Repeated-heading cleanup on `/tutor/profile` and sub-routes |
| 3 | `P2-TUX-001-08` | `ready` | `P1` | Schedule page simplification — hide booking timezone, fold advanced caps, collapse meeting-link form |
| 3 | `P2-TUX-001-08-01` | `ready` | `P1` | DS `WeeklyHourGrid` primitive + slot↔rule coalescing helpers (precondition for `-09`) |
| 3 | `P2-TUX-001-09` | `ready` | `P1` | Weekly-availability calendar-grid editor on `/tutor/schedule` |
| 3 | `P2-TUX-001-10` | `ready` | `P1` | Earnings page — hide raw Stripe requirement strings and dev-only notices |
| 4 | `P2-TUX-001-11` | `ready` | `P2` | Tutor copy pass (remove tech jargon, dedupe titles, shorten helper text) |
| 4 | `P2-TUX-001-12` | `ready` | `P2` | Icon usage pass — readiness gates, lesson statuses, section eyebrows |
| 4 | `P2-TUX-001-13` | `ready` | `P3` | Empty-state visuals across `/tutor/lessons`, `/tutor/students`, `/tutor/messages` |
| 4 | `P2-TUX-001-15` | `ready` | `P2` | Page-intro structure consistency across every `/tutor/**` route (eyebrow / title / description, timezone banner placement, back-link policy, avatar policy) |
| 5 | `P2-TUX-001-14` | `ready` | `P2` | Final verification: walk every `/tutor/**` route on desktop + mobile, confirm all subtasks |

## 5. Detailed tasks

### 5.1 `P2-TUX-001-01` Define `--display-sm` token (or migrate consumers)

**Status:** `ready` · **Priority:** `P1`

**Problem**

`src/styles/globals.css` defines `--display-xl`, `--display-lg`, `--title-xl`, `--title-lg`, `--title-md`, `--body-lg`, `--body-md`, `--body-sm`, `--caption`, `--utility-sm`. It does **not** define `--display-sm`. Five route-local modules consume `var(--display-sm)`:

- `src/app/tutor/apply/apply.module.css:23`
- `src/app/tutor/profile/profile.module.css:23`
- `src/app/tutor/profile/photo/photo.module.css:23`
- `src/app/tutor/profile/video/video.module.css:23`
- `src/app/tutor/profile/credentials/credentials.module.css:23`

The CSS variable resolves to the empty string, so `font-size` falls back to browser default for the `<h1>` titles on those pages. The tutor area's main page titles are therefore not coming from the design system at all.

**Required source docs**

- `docs/design-system/tokens-cheatsheet-v1.md` § 2 (Typography)
- `docs/design-system/agent-ui-rules.md` § 6a (DS-first, inventory + cheatsheet must be updated when tokens change)

**Scope**

- pick **one** of two fixes (recommended: option A):
  - **option A — adopt the existing token:** replace `var(--display-sm)` with `var(--title-xl)` in all five modules. Reason: `--title-xl` is documented as "route hero titles inside AppFrame", which is exactly what these `<h1>`s are.
  - **option B — add the missing token:** add `--display-sm: clamp(1.625rem, 1.05vw + 1.4rem, 2.125rem);` (or equivalent fluid value) to `:root` in `src/styles/globals.css`, then update `docs/design-system/tokens-cheatsheet-v1.md` § 2 in the same commit
- if option B is chosen, the cheatsheet entry must say "tutor page titles outside `AppFrame` hero" and must reference `docs/design-system/agent-ui-rules.md` § 6a

**Acceptance criteria**

- no module under `src/app/**` references an undefined CSS variable; `grep -rn "var(--display-sm)" src/styles src/app` returns either zero hits (option A) or hits only where the new token is defined
- visually, the title on `/tutor/apply`, `/tutor/profile`, `/tutor/profile/photo`, `/tutor/profile/video`, `/tutor/profile/credentials` has a consistent fluid size between 1.625rem and 2.125rem
- if option B, `docs/design-system/tokens-cheatsheet-v1.md` § 2 lists the new token

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: load all five pages and confirm the title sizes are consistent and within the documented type ramp

### 5.2 `P2-TUX-001-02` Fix standalone `StatusBadge` row-stretching

**Status:** `ready` · **Priority:** `P1`

**Problem**

`StatusBadge` is declared `display: inline-flex` in `src/components/ui/status-badge.module.css:1-11`. When it is rendered as a direct child of a CSS Grid container with `display: grid; gap: var(--space-3)` and no explicit `justify-self`, grid items default to `justify-self: stretch` and the badge expands to the full column width. Two known sites:

- `src/app/tutor/profile/photo/photo-manager.tsx:227-231` — the "Published / Uploaded / Hidden" badge inside `.uploadBlock`
- `src/app/tutor/profile/video/video-manager.tsx:56-58` — the top-of-page "Published / Hidden" badge inside `.formStack`

The user-facing symptom is a "huge long Published chip" on `/tutor/profile/photo` — the badge stretches the full panel width.

**Required source docs**

- `docs/design-system/component-specs-core-v1.md` (StatusBadge anatomy)
- `docs/design-system/agent-ui-rules.md` § 6a

**Scope**

- two options, agent picks one:
  - **option A (recommended, no DS change):** wrap the badge call sites in a flex/inline container so the badge no longer participates in a `grid` layout as a direct child. Reuse an existing pattern (for example `.statusLine` in `src/app/tutor/profile/profile.module.css:47-53` already pairs `StatusBadge` with meta text correctly).
  - **option B (DS change):** add `align-self: start; justify-self: start;` to `.badge` in `src/components/ui/status-badge.module.css`. If chosen, update `docs/design-system/component-inventory-v1.md` § 3 to note the alignment guarantee.
- if option A: in `photo-manager.tsx`, place the badge on the same row as the upload action buttons or below the helper text in an inline container; in `video-manager.tsx`, move the badge into the same row as the section title so it reads as a status pill, not a hero bar
- both managers must still render the same five photo / two video publication statuses with the existing tones

**Acceptance criteria**

- `StatusBadge` width matches its text content on both `/tutor/profile/photo` and `/tutor/profile/video`
- no inline style overrides; no route-local `.badge` selectors

**Verification**

- `pnpm lint:arch` (no new bare `.card/.chip/.panel` selectors introduced)
- manual: published photo and published intro video render a compact pill, not a full-row banner

### 5.3 `P2-TUX-001-03` DS `FileField` primitive + adopt for credentials

**Status:** `ready` · **Priority:** `P1`

**Problem**

`src/app/tutor/profile/credentials/credentials-manager.tsx:540-592` defines a route-local `FileField` helper that renders a raw `<input type="file">`. Result: the tutor sees the browser's default "Choose File / No file chosen" control — different on every OS, completely off-brand. The same control is used in three places on the page (`UploadCredentialForm`, `ReplaceCredentialForm`, and implicitly any future M1 evidence picker).

The DS today does not expose a file-picker primitive. Per `docs/design-system/agent-ui-rules.md` § 6a: "If a needed pattern is not in the design system, extend the design system before using it locally."

**Required source docs**

- `docs/design-system/agent-ui-rules.md` § 6a (DS-first), § 5 (reuse rules)
- `docs/design-system/component-inventory-v1.md` § 3 (primitive shape and barrel-export discipline)
- `docs/design-system/tokens-cheatsheet-v1.md` (focus ring, spacing, surface tokens to consume)
- `docs/design-system/component-specs-core-v1.md` (button + field anatomy — `FileField` should compose `getButtonClassName` for its trigger, not invent a new button)

**Scope**

- add `src/components/ui/file-field.tsx` and `src/components/ui/file-field.module.css`:
  - props: `label`, `accept`, `name`, `required`, `description?`, `error?`, `helperText?`, `multiple?` (default false), `disabled?`, `onChange?`, controlled `value?` and `onFilesChange?` for client-state callers
  - markup: a label, optional description, a styled button rendered through `getButtonClassName({ variant: "secondary", size: "compact" })` that opens the native file picker, a chosen-file name pill (text only, no DS chip), and error/helper text below
  - keep the `<input type="file">` visually hidden with the same `sr-only` pattern already used in `photo-manager.tsx`
  - support drag-and-drop optional behavior (defer if needed — escalate, do not add a third-party DnD library)
- export from `src/components/ui/index.ts`
- update `docs/design-system/component-inventory-v1.md` § 3 with a new row (`FileField`) and reference it from § 5 if a naming reconciliation is needed
- migrate `credentials-manager.tsx` to use the new primitive (`UploadCredentialForm`, `ReplaceCredentialForm`); remove the route-local `FileField` helper
- audit any other tutor surface for `<input type="file">` (today only `photo-manager.tsx` uses one and it is intentionally hidden — leave that one alone; do not surface it as a DS `FileField`)

**Acceptance criteria**

- `grep -rn 'type="file"' src/app/tutor` returns only the hidden picker in `photo-manager.tsx`
- `/tutor/profile/credentials` upload and replace surfaces show the new branded trigger button; no native browser file control is visible
- DS inventory mentions `FileField`

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest unit test for `FileField` covers: rendered label/description/error, accept attribute pass-through, disabled state, click on trigger opens the picker (via ref simulation)
- manual: upload a PDF; verify the chosen filename appears; verify error/description render correctly

### 5.4 `P2-TUX-001-04` Replace bare checkbox with DS `Switch`

**Status:** `ready` · **Priority:** `P1`

**Problem**

`src/app/tutor/schedule/schedule-policy-form.tsx:208-225` renders a raw `<input type="checkbox">` for "Accepting new students". The DS already exposes `Switch` (`src/components/ui/switch.tsx`, listed in `docs/design-system/component-inventory-v1.md` § 3) with the right ARIA, focus, and tone treatment. Same primitive is used in `/settings`; using a bare checkbox here breaks visual consistency between account and tutor surfaces.

**Required source docs**

- `docs/design-system/component-inventory-v1.md` § 3 `Switch` row
- `docs/design-system/agent-ui-rules.md` § 5 (reuse before restyling)

**Scope**

- replace the `<label>` + `<input type="checkbox">` block in `schedule-policy-form.tsx` with `Switch` using the same `isAcceptingNewStudents` state value
- the underlying form submission still posts `isAcceptingNewStudents=true|false` — `Switch` must keep the hidden input in sync (use an internal `<input type="hidden" name="isAcceptingNewStudents">` next to the `Switch` if needed)
- remove the route-local `.toggleRow` and `.toggleLabel` selectors from `src/app/tutor/schedule/schedule.module.css` if they only existed for this control
- no other field in this form changes

**Acceptance criteria**

- `grep -n 'type="checkbox"' src/app/tutor` returns no hits
- the toggle has the same visual treatment as the notification toggles on `/settings`
- saving the form still updates the policy correctly with both states

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: toggle on/off, save, refresh, confirm value persists

### 5.5 `P2-TUX-001-05` Tutor nav grouping in `AppFrame`

**Status:** `ready` · **Priority:** `P1`

**Problem**

`src/lib/routing/navigation.ts:39-46` exposes six flat tutor links (Overview, Profile, Lessons, Schedule, Messages, Earnings) and four uncatalogued sub-routes (`/tutor/profile/photo`, `/tutor/profile/video`, `/tutor/profile/credentials`, `/tutor/apply`) that are only reachable from inline links. The tutor has no map of the surface and no signal that "Profile" actually contains four sub-pages. There is also no grouping between "today's work" (lessons, schedule, messages) and "your shop" (profile, photo, video, credentials, earnings).

The user explicitly asked whether the tutor area should become a dashboard with a left rail or stay header-tabbed. Recommended: keep `AppFrame` as the single shared layout, but introduce **section labels** inside the navigation rail so the tutor can see the three groups, on both desktop and mobile.

**Required source docs**

- `docs/design-system/agent-ui-rules.md` § 5 (reuse before restyling), § 7 (copy discipline)
- `docs/design-system/component-inventory-v1.md` § 4 (`AppFrame`, `TabBar`)
- `docs/architecture/route-layout-implementation-map-v1.md` (route-family ownership)

**Scope**

- extend the `NavItem` type in `src/lib/routing/navigation.ts` to optionally carry a `group?: string`; default groupless behavior unchanged for every other route family
- regroup the tutor nav into three labelled groups (final wording is the agent's call within the copy-discipline rules):
  - **Workspace**: Overview, Lessons, Schedule, Messages
  - **Profile**: Profile, Credentials, Photo, Video
  - **Money**: Earnings
- the four reserved profile sub-routes (`/tutor/profile/credentials`, `/tutor/profile/photo`, `/tutor/profile/video`) must appear in the nav — today they are orphaned
- `/tutor/apply` is **not** added to the nav — it remains a redirect target for non-approved tutors
- in `src/components/shell/app-frame.tsx`, render group labels as small monospace eyebrows above each TabBar segment when `groupedItems` are passed. Reuse the existing `.eyebrow` token (`var(--caption)`, `var(--font-mono)`). Do not introduce a new primitive.
- consider whether `TabBar` should be replaced by a vertical list on desktop ≥ 1024px; if the implementing agent chooses to keep horizontal scrolling tabs everywhere, that is an acceptable trade-off — document the choice in the report. Do not introduce a sidebar component without DS extension
- update `docs/design-system/component-inventory-v1.md` § 4 if the `AppFrame` API is widened

**Acceptance criteria**

- the tutor nav shows three group labels and lists Credentials, Photo, and Video as first-class items
- no other route family's nav rendering changes
- on mobile width (< 640px) the grouped nav remains usable (wraps, scrolls, or collapses — decided by the implementing agent)

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: load `/tutor/overview` at desktop and mobile widths, confirm the three groups render and that every sub-route is reachable

### 5.6 `P2-TUX-001-06` Overview vs Profile information-architecture split

**Status:** `ready` · **Priority:** `P1`

**Problem**

The two surfaces share too much vocabulary and visual surface:

- `/tutor/overview` renders a `PersonSummary` header, a `ContextChipRow` with `Application | Visibility | Payouts` chips (`src/app/tutor/overview/overview-presentation.ts:97-116`), a payout-setup `InlineNotice`, three `MetricItem` cards (pending / upcoming / open issues), then three lesson list sections
- `/tutor/profile` renders a header, a "Public listing" `Panel`, a "Listing readiness" `Section` with six gate `Card`s, a "Trust & media" `Panel` with three `Card`s, then the editor `Panel`

The readiness state appears twice with two different vocabularies (chip row vs. gate cards). Tutors do not know which one is authoritative. Meanwhile, real "today" information that should live on Overview (this week's earnings, upcoming meeting links, unread messages) is missing.

**Required source docs**

- `docs/data/tutor-listing-readiness-model-v1.md` (canonical readiness)
- `docs/foundations/cross-role-journey-inventory-v1.md` J-TUT-016
- `docs/design-system/agent-ui-rules.md` § 7 (copy discipline), § 8 (consistency checklist)

**Scope**

- **`/tutor/overview` becomes "today":** the operator-facing daily hub. Keep `PersonSummary`, the three metric cards, pending requests, upcoming lessons, open issues. **Remove** the `ContextChipRow` readiness summary entirely. Replace the standalone payout `InlineNotice` with a single "Finish setup" row that only renders while any of the six readiness gates is failing, with a deep link to `/tutor/profile` (no detail on which gate — that detail lives on Profile)
- **`/tutor/profile` becomes "your listing":** the single source of truth for readiness. Keep the publication `Panel`, the readiness gate list, the trust & media summary, the editor. Move the "Preview public profile" link from a secondary action under the publication panel into the publication panel header
- update `getTutorOverview` in `src/modules/tutors/tutor-overview.ts` if needed to stop building the chip data; do not change DTO field names that other surfaces consume — only stop *rendering* them on Overview
- copy: the Overview hero descriptor stops saying "operational view across pending requests and upcoming lessons" (it is now obvious from the page) — replace with the local timezone meta only
- copy: the Profile hero stays at "Your public profile" + the one-line subtitle, but the subtitle gets shorter (e.g. "What students see when they find you.")

**Acceptance criteria**

- readiness state is presented in exactly one place: `/tutor/profile`'s gate list
- `/tutor/overview` no longer renders the application/visibility/payouts chip row
- the only payout signal on `/tutor/overview` is a single CTA row that disappears when all readiness gates pass
- no Server Action or domain function is added or removed by this task

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest: snapshot or render test confirming Overview no longer mounts the readiness chip row
- manual: as an approved tutor with all gates passing, Overview shows no readiness banner; as an approved tutor with payouts not set up, Overview shows exactly one CTA row linking to `/tutor/profile`

### 5.7 `P2-TUX-001-07` Repeated-heading cleanup

**Status:** `ready` · **Priority:** `P2`

**Problem**

Several profile sub-routes stack three levels of heading for what is really one surface:

- `/tutor/profile/credentials` renders: page eyebrow "Trust & media" + page title "Credentials" + Panel eyebrow "Manage" + Panel title "Your credentials" + Section eyebrow "Add" + Section title "Add a credential". The user-facing reading is: "Manage / Your credentials / Add / Add a credential" — four headings in a row.
- `/tutor/profile` renders: Panel eyebrow "Trust & media" + Panel title "Trust & media" + Section eyebrow "Summary" + Section title "Status at a glance" — same word twice in adjacent slots.
- `/tutor/profile/photo` renders: page eyebrow "Trust & media" + page title "Profile photo" + Panel eyebrow "Manage" + Panel title "Your profile photo".
- `/tutor/profile/video` renders the same shape and additionally splits the page into four Sections ("Update video link", "How your intro looks", "Publication", "Clear video link") that double the heading density.

**Required source docs**

- `docs/design-system/agent-ui-rules.md` § 7 (copy discipline), § 5 (one coherent section rhythm)
- `docs/design-system/component-specs-core-v1.md` (`Panel` and `Section` anatomy)

**Scope**

- on **every** `/tutor/profile/*` route: page-level intro stays as eyebrow ("Trust & media") + title (page name) + one-line description; the immediate child `Panel` drops its eyebrow if it would just repeat the page eyebrow, and drops its title if it would just repeat the page title
- on `/tutor/profile/credentials`: drop the inner Panel ("Manage / Your credentials") entirely — render the two Sections ("Add a credential", "Existing credentials") directly under the page intro; rename "Add a credential" to just "Add" since the section eyebrow already says "Add"
- on `/tutor/profile`: collapse the Trust & media Panel's eyebrow + title duplication. The Section inside it loses "Summary" eyebrow and uses just "Trust & media" as a single heading
- on `/tutor/profile/video`: drop the per-Section eyebrows entirely; render the four blocks as inline form regions inside one Panel
- do not delete any controls; only delete redundant headings

**Acceptance criteria**

- no `/tutor/profile/**` route has two adjacent headings using the same word
- no `/tutor/profile/**` route stacks more than two heading levels (page title + one nested title) under a single panel

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: walk each route, confirm no duplicate-word heading pairs

### 5.8 `P2-TUX-001-08` Schedule page simplification

**Status:** `ready` · **Priority:** `P1`

**Problem**

`/tutor/schedule` currently exposes nine top-level form fields plus the weekly availability editor and the meeting-link form:

- "Booking timezone" (`SelectField` with 17 hardcoded zones in `src/app/tutor/schedule/schedule-policy-form.tsx:16-34`) — the tutor already set a timezone in their account; this field lets them set a different timezone for bookings, which is a confusing edge case the product does not need
- "Minimum notice" (minutes), "Daily lesson capacity", "Weekly lesson capacity", "Buffer before", "Buffer after" — five numeric fields with technical helper text ("Buffer reserved before each lesson (in minutes)")
- "Accepting new students" toggle (covered by `P2-TUX-001-04`)
- meeting-link form: "Meeting provider" select, "Default meeting URL", "Display label" — the user's complaint is exactly "what is a friendly label shown to lesson participants?"

**Required source docs**

- `docs/architecture/canonical-value-ownership-map-v1.md` (timezone via `src/lib/datetime/**`)
- `docs/design-system/agent-ui-rules.md` § 7 (copy discipline)
- `docs/design-system/component-specs-phase2-v1.md` (Section, Panel composition)

**Scope**

- **booking timezone:** remove the field. Default the policy timezone to the account timezone (already loaded via `getCurrentUserTimezone()` in `src/app/tutor/schedule/page.tsx:31`). Render the resolved zone as a read-only `TimezoneNotice` (already imported) immediately above the availability rules. If the timezone ever needs to differ from the account zone, that becomes a separate escalation
- **minimum notice + buffers + caps:** collapse into one collapsible `Section` titled "Advanced booking rules" with sensible defaults shown inline ("We use a 24-hour minimum notice and no daily cap by default"). The collapsible can be a `<details>` element styled via the `Section` primitive — do not add a third-party accordion. The toggle, when expanded, shows the five fields
- **meeting link form:** delete the "Display label" field entirely (the column stays in the DB; this is a UI removal). Replace "Meeting provider" + "Default meeting URL" with one URL field — auto-detect the provider from the URL host (the registry already exists per `P2-MEDIA-001-02` for video providers; meeting-provider detection is a small derived util in `src/modules/tutors/**` and may be inlined). If detection fails, fall back to "Custom link"
- update the helper copy:
  - "Default meeting URL" description becomes "Paste the join link Mentor IB seeds into every lesson."
  - the auto-detected provider renders as a small inline chip next to the field, using `Chip tone="info" size="compact"`

**Acceptance criteria**

- only three fields are visible on the page by default: weekly availability, the default meeting URL, and the "Accepting new students" `Switch`
- "Advanced booking rules" is collapsed by default and contains exactly the five numeric fields
- "Booking timezone" is gone
- "Display label" is gone from the meeting form
- the underlying `updateSchedulePolicyAction` and `updateMeetingPreferenceAction` still accept the same payloads; removed fields fall back to defaults server-side

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest: update existing schedule-policy tests so removed fields default correctly
- manual: save the form without expanding "Advanced", confirm policy persists with default min-notice and buffers; expand, change values, save, refresh, confirm persistence

### 5.8.1 `P2-TUX-001-08-01` DS `WeeklyHourGrid` primitive + slot↔rule coalescing helpers

**Status:** `ready` · **Priority:** `P1`
**Depends on:** none (can run in parallel with `-08`; must land before `-09`)

**Problem**

The repo has no grid primitive. The current weekly-availability editor (`src/app/tutor/schedule/availability-rules-editor.tsx`) renders each rule as its own `Card` plus an inline add-rule form. The replacement is a click-to-toggle 7-day × 24-hour grid (see `-09`). Per `docs/design-system/agent-ui-rules.md` § 6a, that grid must be a DS primitive — route-local card/grid CSS is forbidden. This subtask ships the primitive and the pure helpers that convert between the grid's slot model and the existing `availability_rules` row shape, so `-09` can adopt it cleanly.

**Required source docs**

- `docs/design-system/agent-ui-rules.md` § 5 (reuse-before-extend), § 6a (DS-first extension rules)
- `docs/design-system/component-inventory-v1.md` § 3 (primitive shape and barrel-export discipline)
- `docs/design-system/component-specs-phase2-v1.md` (composition rules with `Panel` and `Section`)
- `docs/design-system/tokens-cheatsheet-v1.md` (selected-state, surface, ink, focus-ring tokens)
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md` (grid pattern + keyboard model)
- W3C ARIA APG "Grid (Interactive Tabular Data and Layout Containers)" pattern (no link — used as the keyboard-behavior reference)
- existing `availability_rules` schema in `src/modules/tutors/schema.ts:310-345` (unique index on `(tutor_profile_id, day_of_week, start_local_time, end_local_time)`)

**Scope — new DS primitive**

Add `src/components/ui/weekly-hour-grid.tsx` and `src/components/ui/weekly-hour-grid.module.css`, exported from the barrel `src/components/ui/index.ts`.

**Props (final shape):**

```ts
type SlotKey = `${number}:${number}`; // `${dayOfWeek}:${hour}`, e.g. "1:09" for Monday 09:00

export type WeeklyHourGridProps = {
  value: ReadonlySet<SlotKey>;
  onChange: (next: Set<SlotKey>) => void;
  dayLabels: readonly string[];   // length 7, in the order the grid renders columns
  startHour?: number;             // default 0
  endHour?: number;               // default 24 (exclusive); rows = endHour - startHour
  disabled?: boolean;
  "aria-label": string;
};
```

The primitive is **purely visual and stateless beyond focus** — it does not know about tutors, rules, or timezones. All domain coupling lives in the helpers below.

**Markup and behavior:**

- outer `<div role="grid" aria-label={…} aria-rowcount={hours + 1} aria-colcount={8}>` (8 = 1 sticky hour column + 7 day columns)
- header row: `role="row"`, with one empty corner cell + 7 `role="columnheader"` cells rendering `dayLabels[i]`
- body: one `role="row"` per hour. First cell is `role="rowheader"` showing the hour label as `HH:00` (24-hour). Next 7 cells are `<button type="button" role="gridcell" aria-pressed={selected}>`
- accessible cell name: `aria-label={\`${dayLabels[day]} ${hourLabel}, ${selected ? "available" : "unavailable"}\`}`
- keyboard model (W3C ARIA grid pattern):
  - arrow keys move roving focus by one cell (wrap not required)
  - `Home` / `End` jump to start/end of row
  - `Page Up` / `Page Down` jump up/down 6 rows
  - `Space` and `Enter` toggle the focused cell
  - `Ctrl+A` is **not** implemented (selection batching is a `-09` concern, not a primitive concern)
- pointer model: single click toggles the cell; pointer down + drag does **not** select a range in this version
- the primitive uses CSS Grid via the `:where()` selector to keep specificity flat. Sticky positioning on the first column and the header row (so they remain visible while scrolling horizontally on mobile)
- focus ring uses the existing `--ring-focus` token; no new tokens

**Tokens consumed (all already in the cheatsheet — no new tokens):**

- default cell background: `var(--surface-page)`
- default cell border: `1px solid var(--ink-300)`
- hover background: `var(--paper-1)`
- selected cell background: `var(--state-selected-surface)` (alias of `--forest-100`)
- selected cell border: `1px solid var(--forest-500)`
- header row + first column background: `var(--surface-section)`
- header / row-header text: `var(--ink-700)`, `font-size: var(--utility-sm)`, `font-family: var(--font-mono)` for the hour labels
- spacing inside cells: `var(--space-1)` padding; minimum cell height `2.25rem`
- focus ring: `var(--ring-focus)`

If any of those tokens turns out to need extension during implementation, **escalate per `agent-ui-rules.md` § 6a — do not inline literal values**.

**Responsive behavior:**

- desktop (≥ 1024px): grid sized to fill its container, cells stretch to fill column width with `minmax(0, 1fr)` and `min-height: 2.25rem`
- tablet (≥ 640px): same as desktop
- mobile (< 640px): the grid switches to horizontal scroll — `min-width: 32rem` on the inner grid so cells stay clickable; the first hour column and the top day-name row become `position: sticky` so the user always sees what they are toggling

No drag-to-select, no copy-day-to-day, no exceptions. Those are out of scope for both this primitive and `-09`.

**Scope — pure helpers (live in `src/modules/tutors/availability-grid.ts`)**

Two pure functions (no DB access, no `account` parameter — fully unit-testable):

```ts
// Expand availability_rules rows into the grid's slot set.
// Sub-hour rules from legacy data are rounded outward to whole-hour cells:
//   start: floor(startHour:startMinute) → startHour
//   end:   ceil(endHour:endMinute)      → endHour + (minute > 0 ? 1 : 0)
// All hours in [expandedStart, expandedEnd) become selected slots.
export function expandAvailabilityRulesToSlots(
  rules: ReadonlyArray<{ dayOfWeek: number; startLocalTime: string; endLocalTime: string }>,
): Set<SlotKey>;

// Coalesce a slot selection into the minimum number of (day, startHH:00, endHH:00) rows.
// Contiguous selected hours on the same day collapse into one row.
// Output rows are always whole-hour (`HH:00`) and sorted by (dayOfWeek asc, startLocalTime asc).
export function coalesceSlotsToAvailabilityRules(
  slots: ReadonlySet<SlotKey>,
): Array<{ dayOfWeek: number; startLocalTime: string; endLocalTime: string }>;
```

Both helpers are imported by `-09`'s Server Action and by the route's initial-state builder. They have no runtime dependencies beyond the standard library.

**Legacy-data normalization rule (binding):**

- on load, sub-hour rules are rounded outward (more permissive than the source). Example: a rule `09:15–09:45` becomes the single selected slot `09:00` (cell covers `09:00–10:00`)
- on the **next save**, that rule is rewritten as the whole-hour row `09:00–10:00`. This is the documented one-way migration. A tutor with sub-hour legacy rules will see the grid the next time they edit, save once, and the underlying rows are normalized
- no database migration is added by this subtask — the existing schema already accepts whole-hour rules

**Inventory + cheatsheet updates**

- add a `WeeklyHourGrid` row to `docs/design-system/component-inventory-v1.md` § 3, with the props summary, the keyboard model, the consumed tokens list, and a note that the only consumer is the tutor schedule route
- if any new token is introduced during implementation (it should not be — escalate first), update `docs/design-system/tokens-cheatsheet-v1.md` in the same commit per `agent-ui-rules.md` § 6a

**Out of scope**

- drag-to-select / range selection
- copy-day-to-day, "Apply to weekdays", or any bulk-edit affordance
- exceptions / holidays / one-off date overrides (the `availability_overrides` table exists but is a separate feature)
- sub-hour granularity (30-min, 15-min)
- timezone awareness inside the primitive — the consumer is responsible for resolving labels and ordering
- any change to the existing `availability_rules` schema, RLS, or per-row Server Actions
- adopting the primitive in `availability-rules-editor.tsx` — that is `-09`

**Acceptance criteria**

- the primitive is exported from `@/components/ui` and consumed via the barrel
- the primitive renders a 7-column × 24-row grid by default with no route-local CSS at the call site
- clicking a cell toggles its `aria-pressed` state and fires `onChange` with the next `Set<SlotKey>` (identity-stable when nothing changed)
- arrow / `Home` / `End` / `Page Up` / `Page Down` / `Space` / `Enter` behave per the W3C ARIA grid pattern
- the primitive carries no domain knowledge — `grep -n "tutor\|rule\|availability" src/components/ui/weekly-hour-grid.tsx` returns zero hits
- the two helpers are pure (no I/O, no React imports)
- `coalesceSlotsToAvailabilityRules(expandAvailabilityRulesToSlots(rules))` is idempotent for any input that is already whole-hour
- `docs/design-system/component-inventory-v1.md` § 3 lists the new primitive

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest unit tests cover:
  - cell click toggles `aria-pressed` and fires `onChange` with the updated set
  - keyboard navigation: each documented key produces the expected focus move or toggle
  - `expandAvailabilityRulesToSlots` round-trips whole-hour rules unchanged
  - `expandAvailabilityRulesToSlots` rounds sub-hour rules outward as documented (`09:15–09:45` → slot `09:00`)
  - `coalesceSlotsToAvailabilityRules` collapses contiguous slots and splits non-contiguous slots into separate rows
  - idempotency: `coalesceSlotsToAvailabilityRules(expandAvailabilityRulesToSlots(rules))` equals `rules` for any whole-hour input
- manual: render the primitive in isolation (e.g., a Storybook-style scratch route in a dev branch — do not ship it) and confirm focus ring, hover, selected state, and sticky header behavior at 360px / 768px / 1280px viewports
- `pnpm test:e2e` is **not** required

### 5.9 `P2-TUX-001-09` Weekly-availability calendar-grid editor on `/tutor/schedule`

**Status:** `ready` · **Priority:** `P1`
**Depends on:** `P2-TUX-001-08-01` (the DS primitive + helpers must exist)

**Problem**

`src/app/tutor/schedule/availability-rules-editor.tsx` renders each rule as its own `Card` plus a manual add-rule form. The tutor has no visual sense of their week and must add seven separate rules to express "Mon–Fri 9–17". The user wants a click-to-toggle 7-day × 24-hour grid where one click marks an hour available, a second click unmarks it.

**Required source docs**

- this doc's `-08-01` entry (the primitive contract)
- `docs/architecture/canonical-value-ownership-map-v1.md` (timezone via `src/lib/datetime/**`)
- `docs/data/api-and-server-action-contracts-v1.md` § 6 (Server Action golden path), § 8 (boundary errors), § 14 (cache revalidation)
- `docs/design-system/agent-ui-rules.md` § 7 (copy discipline)
- existing `addAvailabilityRule` / `removeAvailabilityRule` in `src/modules/tutors/tutor-schedule.ts:241-305`

**Scope — UI**

- rewrite `src/app/tutor/schedule/availability-rules-editor.tsx` so it:
  - imports `WeeklyHourGrid` from `@/components/ui` and `expandAvailabilityRulesToSlots` / `coalesceSlotsToAvailabilityRules` from `@/modules/tutors/availability-grid`
  - hydrates the grid's initial `Set<SlotKey>` from the existing `rules` prop using `expandAvailabilityRulesToSlots`
  - tracks a local `pendingSlots` state (mirrors the grid's current selection)
  - renders the grid inside the existing "Weekly availability" `Panel` in `src/app/tutor/schedule/page.tsx`
  - renders a `TimezoneNotice` above the grid with body "Showing your local time" — the timezone label comes from the existing `policyTimezoneLabel` resolution in `schedule/page.tsx:97-98`
  - renders two `Button`s below the grid: primary "Save availability" (disabled when the diff vs. server state is empty), secondary "Discard changes" (resets `pendingSlots` to the initial set)
  - removes the per-rule `Card` list, the per-rule remove form, and the entire "Add window" form. Those interactions are subsumed by the grid
- copy:
  - the panel description on `schedule/page.tsx:151` becomes "Click an hour to mark it as available. Click again to unmark."
  - no helper paragraphs below the grid

**Scope — domain + Server Action**

- add `replaceAvailabilityRules(account, slots)` to `src/modules/tutors/tutor-schedule.ts`:
  - input: `account` (existing `Pick<ResolvedAuthAccount, "id">`) and the coalesced rule rows (computed by the caller from the slot set via the `-08-01` helper)
  - behavior: in a single transaction, delete every row in `availability_rules` for the tutor's profile and insert the new set. Use the existing service-role Supabase client. Same `visibility_status: "active"` default as `addAvailabilityRule`. Same uniqueness contract — coalesced helper guarantees no duplicates
  - error model: throws `AvailabilityRuleCommandError` (already defined) with the existing codes; add one new code `availability_rules_replace_failed` for transactional failures
- add `replaceAvailabilityRulesAction(prevState, formData)` to `src/app/tutor/schedule/actions.ts`:
  - reads a single hidden field `slots` containing a JSON-encoded `SlotKey[]` array (the client serialises `Array.from(pendingSlots)` on submit)
  - performs the same auth + role gating as the existing `addAvailabilityRuleAction`
  - calls `coalesceSlotsToAvailabilityRules` on the parsed array and delegates to `replaceAvailabilityRules`
  - on success, calls `revalidatePath('/tutor/schedule')` and returns `{ code: "success", message: "Availability saved." }`
- the existing `addAvailabilityRuleAction` / `removeAvailabilityRuleAction` stay in place — they are still part of the module contract and may be reused later (do **not** delete the actions, even though the UI no longer calls them; deletion would be a scope expansion). Document this in the report

**Scope — module updates**

- export `replaceAvailabilityRulesAction` from `src/app/tutor/schedule/actions.ts`
- update `src/app/tutor/schedule/action-types.ts` with the action state type if a new shape is needed (likely the same shape as the existing rule action state)

**Out of scope**

- everything listed as out-of-scope in `-08-01`
- migrating sub-hour legacy rules in a separate background job (the documented load/save normalization rule is enough)
- showing booked lessons inside the grid (a future enhancement — escalate before adding)
- exceptions / overrides / "I'm away this week" toggles (own future work)
- removing the existing `addAvailabilityRuleAction` / `removeAvailabilityRuleAction` endpoints

**Acceptance criteria**

- `/tutor/schedule` renders the grid as the only availability editor; the per-rule `Card` list and add-rule form are gone
- selecting hours and clicking "Save availability" writes a coalesced row set to `availability_rules` in one round trip
- the grid renders the saved state on next page load (round-trip works)
- saving with an empty selection clears all rules for the tutor (allowed — the tutor can have no availability)
- a tutor with a legacy sub-hour rule (`09:15–09:45`) sees the `09:00–10:00` cell selected on load; saving once rewrites the underlying row to `09:00–10:00`
- the "Save availability" button is disabled when `pendingSlots` matches the saved set
- "Discard changes" reverts `pendingSlots` without a server round trip
- `pnpm lint:arch` passes (no route-local card/chip/panel/icon CSS)
- the page renders without horizontal page-level scroll at desktop and tablet widths; the grid itself may scroll horizontally on mobile

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest covers:
  - `replaceAvailabilityRules` deletes all existing rules and inserts the new set atomically
  - `replaceAvailabilityRulesAction` rejects malformed `slots` JSON with a validation error and does not write
  - `replaceAvailabilityRulesAction` enforces tutor-role gating identically to `addAvailabilityRuleAction`
  - the route component round-trips a legacy sub-hour rule into the documented whole-hour shape
- `pnpm test:e2e` is **not** required (no public, auth, `robots.ts`, or `sitemap.ts` change). Call this out explicitly in the final report
- manual:
  - click five contiguous Monday hours → save → reload → those five cells are selected and the `availability_rules` table contains a single row `(1, 09:00, 14:00)`
  - click two non-contiguous Tuesday hours → save → two rows exist
  - select an hour that already has a sub-hour legacy rule → save → the legacy row is gone, replaced by a whole-hour row
  - on a 360px viewport: the grid scrolls horizontally; the day header and hour column stay sticky

### 5.10 `P2-TUX-001-10` Earnings page — hide raw Stripe internals

**Status:** `ready` · **Priority:** `P1`

**Problem**

`src/app/tutor/earnings/page.tsx` exposes Stripe internals to tutors in three places:

- `describeRequirement` (lines 457-479) translates Stripe requirement keys to human prose but still leaks the underlying namespacing for any key it does not recognise (`business_profile.mcc` style strings render verbatim). The user specifically called this out.
- `collectOpenRequirements` shows a bulleted list of every open Stripe requirement. Tutors do not need to see "Verification documents (government-issued ID) · Bank account or debit card for payouts · Acceptance of Stripe terms" — they need a single "Finish payout setup" CTA that opens Stripe's hosted onboarding, where Stripe itself shows the requirements.
- lines 259-266 render `<code>STRIPE_SECRET_KEY</code>` and the prose "Set STRIPE_SECRET_KEY on the server to enable Stripe Connect onboarding for tutors" — this is a developer-facing message that must never reach a logged-in tutor.

**Required source docs**

- `docs/design-system/agent-ui-rules.md` § 7 (no technical filler copy)
- `docs/architecture/file-and-media-architecture-v1.md` (only relevant for media; included for context)
- `docs/data/tutor-listing-readiness-model-v1.md` (payout readiness gate vocabulary)

**Scope**

- remove the `collectOpenRequirements` / `describeRequirement` rendering on the public-facing earnings card. Replace with: a single sentence that adapts to `payoutReadinessStatus` (the four-state vocabulary already exists in `earnings-presentation.ts`) plus one CTA — "Continue setup in Stripe" / "Resolve in Stripe" / "Open Stripe dashboard" / nothing when enabled
- delete the "Stripe is not configured" `InlineNotice` block (lines 259-266). If Stripe is not configured in production it is an operator emergency, not a tutor-facing message; the rest of the page already gates the start/resume forms via `setupBlocked` so the tutor cannot try and fail
- keep the `countryDisplayName` and `payoutStatusSyncedAt` helper lines — those are tutor-relevant
- the existing four `PAYOUT_READINESS_HEADLINE` / `PAYOUT_READINESS_DESCRIPTION` strings stay
- copy review: "We pre-fill your name and email …" paragraph (lines 292-297) is informational fluff — keep only the email pre-fill mention, drop the rest

**Acceptance criteria**

- no Stripe internal field key (`individual.*`, `external_account*`, `tos_acceptance*`, `business_profile.*`) is ever rendered on `/tutor/earnings`
- no environment-variable name is ever rendered on `/tutor/earnings`
- the page still surfaces all four `PayoutReadinessStatus` states with appropriate copy and exactly one onboarding CTA when relevant

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- Vitest: update existing earnings tests so the requirement-list assertions are removed; add a test that the page renders without any string starting with `individual.` or `business_profile.`
- manual: switch payout readiness through `not_started` / `pending_verification` / `restricted` / `enabled` (using existing test fixtures), confirm each state shows one CTA and no internal namespacing

### 5.11 `P2-TUX-001-11` Tutor copy pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

Across the tutor surface, copy violates `docs/design-system/agent-ui-rules.md` § 7 in many small ways:

- helper text describes implementation rather than user intent ("Buffer reserved before each lesson (in minutes)", "Optional friendly label shown to lesson participants", "Daily lesson cap (leave blank for no cap)")
- titles repeat (covered structurally by `P2-TUX-001-07`; this task handles wording)
- application/listing status labels include both an object name and a state ("Application: changes requested", "Profile draft", "Payouts: verification pending") — verbose
- inline notices restate the page title ("Tutor lessons unavailable", "Tutor profile not set up", "Tutor schedule unavailable") — the eyebrow already says "Tutor"
- file upload helper text is split across two sentences ("PDF, JPEG, or PNG up to 15 MB" + a separate description block) and should be one line
- the "Why this matters" section on `/tutor/profile/credentials` is two paragraphs explaining a Mentor IB policy that should be a single sentence

**Required source docs**

- `docs/design-system/agent-ui-rules.md` § 7

**Scope**

- pass over every page in `src/app/tutor/**` and apply the practical test from § 7: "if removing a sentence does not make the task harder for the user, remove it"
- specific edits expected (not exhaustive — the agent may make additional cuts):
  - `schedule-policy-form.tsx` field descriptions: keep one short line each, drop the "(in minutes)" parenthetical (the input is a number field with min=0 and the field label is "Minimum notice" — context is enough); when `P2-TUX-001-08` runs first, this becomes simpler
  - `meeting-preference-form.tsx`: rewrite or remove the entire `.helperText` paragraph; description on the URL field becomes "Paste the join link Mentor IB seeds into every lesson."
  - `overview-presentation.ts`: rename status chips to short forms: "Application approved" → "Approved", "Application in progress" → "Draft", "Profile draft" → "Draft", "Payouts enabled" → "Payouts on", etc. (a small label table — keep this table here, not in route files)
  - `tutor/lessons/page.tsx`: drop the per-group `subtitle` lines for Pending requests and Upcoming lessons (they restate the group title)
  - `tutor/students/page.tsx`: drop the `PersonSummary` `descriptor` "Identity-first view of your teaching relationships. Continue lessons and conversations without switching context." — replace with nothing
  - `tutor/profile/credentials/page.tsx`: collapse the page description + the "Why this matters / What students see" Section into one paragraph immediately under the page title
  - everywhere: any `InlineNotice` titled "Tutor X unavailable" loses the "Tutor" prefix
- do not change form behavior, status enums, or DTO shapes — copy only

**Acceptance criteria**

- no helper text contains the literal words "(in minutes)", "Optional friendly label", "Buffer reserved", "leave blank for no cap"
- no `InlineNotice` title on a `/tutor/**` route starts with the word "Tutor"
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch` pass

**Verification**

- mostly manual: walk every `/tutor/**` page and read each visible string out loud — if a sentence does not help the user choose or act, remove it

### 5.12 `P2-TUX-001-12` Icon usage pass

**Status:** `ready` · **Priority:** `P2`

**Problem**

The tutor surface is almost entirely text. The user asked for visuals using only approved sources (`src/components/ui/icon.tsx`, `src/components/ui/flag.tsx`, `src/components/ui/google-mark.tsx`). Specific spots that read well with icons today have none:

- readiness gate cards on `/tutor/profile` (each gate has a state; an icon makes the state scannable)
- lesson status badges on `/tutor/overview` and `/tutor/lessons` (today they are text-only `StatusBadge`s — pending/accepted/upcoming/in_progress/completed could each carry a glyph)
- "Trust & media" summary cards on `/tutor/profile` (credentials, photo, video each have a natural glyph already in the `Icon` registry)
- section eyebrows that describe an action ("Manage", "Add", "Publish", "Preview", "Remove") read better with a leading glyph

**Required source docs**

- `docs/design-system/component-inventory-v1.md` § 3 (`Icon`)
- `docs/design-system/agent-ui-rules.md` § 6 (icons must come through the DS wrapper only)

**Scope**

- audit `src/components/ui/icon.tsx`'s `IconKey` registry; if a needed glyph is missing, add it to the registry in the same commit (and only there — never inline `<svg>`)
- add icons to:
  - readiness gate `Chip` (compose `Chip` with an `Icon` slot if the primitive supports it; if not, render the `Icon` adjacent to the `Chip` inside `.readinessRow`)
  - lesson `StatusBadge` variants on overview and lessons (decide once in a shared mapper in `src/app/tutor/overview/overview-presentation.ts` and `src/app/tutor/lessons/lesson-presentation.ts`)
  - the three Trust & media cards (`Credentials`, `Profile photo`, `Intro video`)
- do **not** add decorative icons to body copy
- do **not** add icons to navigation tabs in this task (a nav-icon pass is a separate decision)

**Acceptance criteria**

- every readiness state, every lesson status, and every trust-media row renders with an icon from the registry
- `grep -rn '<svg' src/app src/modules` still returns zero hits (per `docs/design-system/agent-ui-rules.md` § 10)
- `pnpm lint:arch` passes

**Verification**

- manual: confirm visual scannability on `/tutor/overview`, `/tutor/profile`, `/tutor/lessons`

### 5.13 `P2-TUX-001-13` Empty-state visuals across tutor lists

**Status:** `ready` · **Priority:** `P3`

**Problem**

`ScreenState` (`src/components/continuity/screen-state.tsx`) renders empty/loading/error states as title + description + optional action + optional hints. On `/tutor/lessons`, `/tutor/students`, `/tutor/messages`, and the no-data branch of `/tutor/overview`, an empty state is the **first** thing a brand-new approved tutor sees. Today it is a plain text block.

**Required source docs**

- `docs/design-system/component-inventory-v1.md` § 4 (`ScreenState`)
- `docs/design-system/agent-ui-rules.md` § 6

**Scope**

- extend `ScreenState` to accept an optional `icon?: IconKey` and render it above the title at large size (token: `var(--space-6)` or similar — reuse only)
- update the inventory entry
- adopt the new prop in the four locations listed above with appropriate registry icons (e.g. `calendar`, `messageSquare`, `users`)
- do not add illustrations or imagery; the only approved visual source remains the icon registry

**Acceptance criteria**

- the four empty-state surfaces show a single registry icon above the title

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`
- manual: each empty state renders the icon at the same size and alignment

### 5.15 `P2-TUX-001-15` Page-intro structure consistency across `/tutor/**`

**Status:** `ready` · **Priority:** `P2`
**Depends on:** `P2-TUX-001-05` (nav grouping) and `P2-TUX-001-06` (Overview vs Profile IA split). Best run after `P2-TUX-001-07` (heading cleanup) and `P2-TUX-001-11` (copy pass) so the structural decisions are not fighting with stale copy or duplicated headings. Should land before `P2-TUX-001-14` (final verification).

**Problem**

Each `/tutor/**` route currently invents its own page-intro region. As of 2026-05-20:

- `/tutor/profile/credentials` uses `<header className={styles.intro}>` with **eyebrow + h1 + description + back-link**. This is the cleanest pattern and reads correctly as "category → page → one-line context → escape".
- `/tutor/profile`, `/tutor/profile/photo`, `/tutor/profile/video`, `/tutor/apply` use the same `header.intro` pattern but **without** the back link and **without** the timezone banner.
- `/tutor/schedule` uses `header.intro` with **no eyebrow**, just an h1 + description; the `TimezoneNotice` renders **above** the intro, so the page reads as "(timezone banner) → page title", which buries the title.
- `/tutor/lessons` has **no page intro at all** — it renders `TimezoneNotice` immediately, then the lesson-group `Section`s. There is no eyebrow / title region on this page.
- `/tutor/overview`, `/tutor/students`, `/tutor/students/[studentProfileId]`, `/tutor/earnings` use `PersonSummary variant="header"` as the page intro. On `/tutor/overview` this duplicates the timezone (the `TimezoneNotice` above the header and the `meta={["Local timezone: …"]}` row inside `PersonSummary` are the same value). On `/tutor/students` and `/tutor/earnings` the descriptor was removed by `P2-TUX-001-11`, so the `PersonSummary` is now mostly a heavy avatar slot around a single name.
- Back-link CTAs ("← Back to your profile") exist on `/tutor/profile/credentials` and `/tutor/profile/photo` / `/tutor/profile/video` but not on `/tutor/profile` or the workspace routes. After `P2-TUX-001-05` made the nav rail group sub-pages explicitly, the back link is redundant in most places.
- Avatar usage is inconsistent: `PersonSummary` header carries it on Overview, Students, Earnings; the `header.intro` pattern does not show an avatar at all. There is no documented rule about which surfaces should foreground the tutor's identity.

The user-facing symptom is that walking from `/tutor/overview` to `/tutor/lessons` to `/tutor/schedule` to `/tutor/profile/credentials` feels like four different products. This task standardises the intro region.

**Required source docs**

- `docs/design-system/agent-ui-rules.md` § 5 (reuse-before-extend), § 7 (copy discipline), § 8 (consistency checklist)
- `docs/design-system/component-specs-core-v1.md` § 9 (`PersonSummary`)
- `docs/design-system/component-specs-phase2-v1.md` (`Section`, `Panel`, hero anatomy)
- `docs/design-system/component-inventory-v1.md` § 3 (existing primitives) and § 4 (`AppFrame`)
- this doc's `P2-TUX-001-05` (nav grouping) and `P2-TUX-001-06` (Overview vs Profile split) — both shape what the intro region needs to carry

**Canonical decision (binding for this task)**

Adopt **one** intro shape for every `/tutor/**` route, in this exact order from top of the page down:

1. (Optional) inline notice rail — `Account access limited`, `Profile not set up`, `<page> preview`, `<page> unavailable`. These render above the intro because they gate the rest of the page.
2. **Page intro block** — eyebrow + h1 + one-line description.
3. (Optional) `TimezoneNotice` — only on routes where local-time interpretation is load-bearing (`/tutor/schedule`, `/tutor/lessons`, `/tutor/lessons/[id]`, `/tutor/overview`, `/tutor/students/[studentProfileId]`). Renders **directly below the intro block**, never above it.
4. Page body.

The intro block has two approved variants:

- **Identity intro** (`PersonSummary variant="header"`): used only when the page foregrounds the tutor's own identity. Approved surfaces: `/tutor/overview`, `/tutor/profile`. Carries the eyebrow ("Tutor overview" / "Tutor profile"), the tutor's display name as the h1-equivalent, the avatar, and no `meta` line that duplicates the `TimezoneNotice` below.
- **Section intro** (`<header className={styles.intro}>` with `.eyebrow` + `.title` + `.description`): used for every other tutor surface (Schedule, Lessons, Lessons/[id], Students, Students/[id], Messages, Earnings, Apply, Profile/Photo, Profile/Video, Profile/Credentials). No avatar; the route is about the workspace area, not the person.

The "Tutor earnings" header that uses `PersonSummary` today is migrated to the section-intro pattern: eyebrow "Tutor earnings" + h1 "Earnings" (or equivalent) + one-line description. Same for `/tutor/students` and `/tutor/students/[studentProfileId]` — the roster page is about the list, not the tutor's avatar.

**Back-link policy (binding)**

With `P2-TUX-001-05`'s grouped nav rail, every `/tutor/profile/*` sub-page is one click from `/tutor/profile` via the rail. Inline back-link CTAs become redundant chrome.

- **Remove** the `← Back to your profile` link from `/tutor/profile/credentials`, `/tutor/profile/photo`, `/tutor/profile/video`.
- **Keep** the existing back-link on `/tutor/students/[studentProfileId]` and `/tutor/lessons/[id]` — those are detail routes one level below a list, and the rail does not surface the parent list as a tab in the detail view.

**TimezoneNotice placement (binding)**

- Move the `TimezoneNotice` to render **after** the page intro block on every surface that uses it today.
- Remove the `meta={["Local timezone: …"]}` entry from the `PersonSummary` on `/tutor/overview` so the timezone shows up exactly once per page.
- Routes that do not depend on local-time interpretation (`/tutor/profile`, `/tutor/profile/credentials`, `/tutor/profile/photo`, `/tutor/profile/video`, `/tutor/earnings`, `/tutor/apply`, `/tutor/messages`) drop the `TimezoneNotice` entirely. They never display lesson times.

**Avatar policy (binding)**

The avatar appears only on `/tutor/overview` and `/tutor/profile` — the two surfaces where the page subject is the tutor. Every other route uses the section-intro pattern with no avatar slot. `/tutor/profile/photo` does **not** show an avatar in its intro; the photo it manages is the page subject, rendered in the body of the page, not at the top.

**Scope — concrete edits**

For each route, normalise the top of the page to match the canonical structure above. Touch only the page-intro region; do not change the page body unless deleting an intro-zone fragment that the body relied on.

- `/tutor/overview` ([page.tsx](src/app/tutor/overview/page.tsx)): keep `PersonSummary variant="header"`; remove the `meta` line that duplicates the timezone; move `TimezoneNotice` to render below the `PersonSummary`.
- `/tutor/profile` ([page.tsx](src/app/tutor/profile/page.tsx)): no avatar today, but the page is about the tutor's listing — promote the existing `header.intro` to a `PersonSummary` identity intro (eyebrow "Tutor profile" + name + avatar) so it matches `/tutor/overview`. No `TimezoneNotice` here.
- `/tutor/profile/credentials`, `/tutor/profile/photo`, `/tutor/profile/video` ([page.tsx](src/app/tutor/profile/credentials/page.tsx) and siblings): keep section-intro pattern; remove back-link.
- `/tutor/schedule` ([page.tsx](src/app/tutor/schedule/page.tsx)): add an eyebrow ("Tutor schedule") to the existing `header.intro`; move `TimezoneNotice` to render directly below the intro.
- `/tutor/lessons` ([page.tsx](src/app/tutor/lessons/page.tsx)): add the missing section intro (eyebrow "Tutor lessons" + title "Lessons" + one-line description); move `TimezoneNotice` below it.
- `/tutor/lessons/[id]` ([page.tsx](src/app/tutor/lessons/[id]/page.tsx)): keep the existing back link to the lesson list; add a section intro above the lesson detail body if missing; `TimezoneNotice` below the intro.
- `/tutor/students` ([page.tsx](src/app/tutor/students/page.tsx)): replace the bare `PersonSummary` (post-`-11` it has no descriptor and no avatar value-add) with a section intro: eyebrow "Tutor students" + h1 "Students" + one-line description.
- `/tutor/students/[studentProfileId]` ([page.tsx](src/app/tutor/students/[studentProfileId]/page.tsx)): the student identity is the page subject — `PersonSummary variant="header"` is correct here. Keep the existing back link to the roster. `TimezoneNotice` renders below the intro.
- `/tutor/earnings` ([page.tsx](src/app/tutor/earnings/page.tsx)): migrate from `PersonSummary` header to section intro (eyebrow "Tutor earnings" + h1 "Earnings" + one-line description). No `TimezoneNotice`.
- `/tutor/apply` ([page.tsx](src/app/tutor/apply/page.tsx)): already section-intro; verify spacing matches the others. No `TimezoneNotice`.
- `/tutor/messages`: align to section-intro if it is not already; no `TimezoneNotice`.

**Out of scope**

- changing the page body of any tutor surface
- adding a new DS primitive (the section-intro pattern stays as the existing `header.intro` + `styles.eyebrow` / `styles.title` / `styles.description` CSS modules; if a future task wants to lift this into a DS `PageHeader` primitive, that is a separate escalation)
- changing the nav rail or its grouping — that work landed in `P2-TUX-001-05`
- restyling `PersonSummary`, `TimezoneNotice`, or any DS primitive
- adding avatars to routes other than `/tutor/overview` and `/tutor/profile`
- introducing a new "back to list" pattern beyond the two existing detail-route uses

**Acceptance criteria**

- every `/tutor/**` route renders one of the two approved intro shapes at the top, in the canonical order documented above
- `TimezoneNotice` either appears once on a page (below the intro) or not at all; no route renders it above the intro
- `/tutor/overview` no longer shows the timezone twice
- back links exist only on the two approved detail routes (`/tutor/lessons/[id]`, `/tutor/students/[studentProfileId]`)
- avatars appear only on `/tutor/overview` and `/tutor/profile`
- no new DS primitives are added; no route-local card / chip / panel CSS is introduced

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- manual: walk every `/tutor/**` route at 1280px, 768px, and 360px and confirm the intro region matches the canonical shape

### 5.14 `P2-TUX-001-14` Final verification

**Status:** `ready` · **Priority:** `P2`

**Goal**

End-to-end walkthrough that the previous fourteen subtasks landed without regression and that no new DS or copy drift was introduced.

**Required source docs**

- this document
- `docs/design-system/agent-ui-rules.md` § 8 (consistency checklist)

**Scope**

- walk each route in `src/app/tutor/**` (Overview, Profile, Profile/Photo, Profile/Video, Profile/Credentials, Schedule, Lessons, Lessons/[id], Students, Students/[id], Messages, Earnings, Apply) at desktop (≥ 1024px), tablet (768px), and mobile (360px) widths
- for each route confirm:
  - one page title, no duplicate-word heading pairs
  - all status pills are content-sized (no row stretching)
  - no native browser file picker is visible
  - no Stripe internal field names are rendered
  - the nav rail shows the three groups
  - the readiness vocabulary appears only on `/tutor/profile`
  - the page-intro region matches the canonical shape from `P2-TUX-001-15`: identity intro only on `/tutor/overview` and `/tutor/profile`, section intro everywhere else
  - `TimezoneNotice` renders below the intro (never above) and only on routes that display lesson times
  - inline back-link CTAs exist only on `/tutor/lessons/[id]` and `/tutor/students/[studentProfileId]`
  - avatars appear in the intro region only on `/tutor/overview` and `/tutor/profile`
- update `docs/planning/phase2-task-pack-v1.md` § 10 table with a footnote that the tutor UX polish pack landed (link to this doc)
- update `docs/design-system/component-inventory-v1.md` if any subtask added a primitive (`FileField`, possibly `CalendarGrid` if `-09` was implemented)
- close `P2-TUX-001` parent in this file with a one-paragraph close note under § 6

**Verification**

- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, `pnpm test`
- `pnpm test:e2e` is **not** required — no public, auth, `robots.ts`, or `sitemap.ts` route is touched in this pack. Call this out explicitly in the final report.

## 6. Closure notes

Reserved for `P2-TUX-001-14` to write when the pack closes.

## 7. Manual smoke checklist for the human (to run after each subtask)

For every subtask that ships, the human should run through:

- sign in as an approved tutor with all six readiness gates passing → `/tutor/overview` shows no readiness banner, payout CTA absent
- sign in as an approved tutor with payouts not started → `/tutor/overview` shows one CTA row, `/tutor/profile` shows the full readiness gate list, `/tutor/earnings` shows one Stripe-onboarding CTA and no namespaced requirement strings
- on `/tutor/profile/photo`, upload a JPEG → the "Published / Uploaded / Hidden" pill is content-sized, not full-row
- on `/tutor/profile/video`, paste a YouTube URL → same content-sized pill behaviour
- on `/tutor/profile/credentials`, click "Upload" → a branded file-picker trigger opens, not a browser-default control
- on `/tutor/schedule`, the page shows availability + meeting URL + "Accepting new students" toggle by default; expanding "Advanced booking rules" reveals the five numeric fields; saving with defaults still works
- the tutor nav rail shows three section labels (Workspace / Profile / Money) at desktop and remains usable at 360px
