# Mentor IB App Header Shape v1 — ADR

**Date:** 2026-05-25
**Status:** Accepted. Binding for every `AppFrame` consumer. Supersedes any header guidance in `docs/architecture/route-layout-implementation-map-v1.md` §§ 9.1–9.7 and § 14.
**Scope:** the cross-route-family shape of the application header, the mobile primary-nav model (bottom dock vs. hamburger), the avatar-menu vs. direct-link decision, the desktop single-row overflow rule, and the four-tab mobile cores for the student and tutor families.
**Source task:** `P2-SUX-001-14` (Phase 2 student UX task pack §5.14). Spec only — `P2-SUX-001-15` through `P2-SUX-001-19` implement against it.

## 1. Why this document exists

Mentor IB's header has drifted across route families. Five `AppFrame` consumers each pass a different combination of `eyebrow`, `viewer`, and `navItems`, and the layout file decides on its own whether the avatar renders. A signed-in student walking `/results → /tutors` (one tap apart in the journey) loses the avatar entirely on the public family and sees a different number of nav rows. On mobile, `.headerInner { flex-wrap: wrap }` stacks brand, nav, and avatar into three rows; on `/tutor/**` the grouped nav adds two more rows of pills before the page body even starts. There is no overflow handling, no hamburger, no bottom dock, no per-breakpoint layout switch, and the avatar today is a direct `<Link>` to `/settings` that swaps the entire nav rail on a single click.

The user has asked for a binding decision: bottom-nav-with-core vs. hamburger. That decision changes the nav adjacency model — every connection between pages on mobile — so it must land in one place before any code does.

This ADR is that one place.

## 2. The current drift (what we are replacing)

| Family | `viewer` passed? | Nav items | Mobile chrome |
| --- | --- | --- | --- |
| `(public)` | **no** — `viewer` prop omitted entirely | 7 flat | wraps into stacked pill rows |
| `(student)` | yes (via `loadViewerIdentity`) | 6 flat | wraps into stacked pill rows |
| `tutor` | yes | 9 in 3 groups | wraps into 3–4 stacked rows |
| `(account)` | yes | 4 flat | wraps |
| `internal` | yes (admin-only) | 4 flat | wraps |
| `auth`, `setup` | n/a — use `FocusedFlowShell` | n/a | n/a |

Symptoms in the user-facing product:

- the avatar disappears entirely on every public route once signed in
- the avatar is a direct link to `/settings`, so a single tap replaces the active role family's nav rail with the Account family's
- on `< 767px`, the header is 3–4 rows tall on `/tutor/**` before the page body starts
- there is no overflow handling: when the nav exceeds the viewport, items wrap

## 3. Decision

The header has **one shape** across every route family that uses `AppFrame`. `FocusedFlowShell` (auth + setup) is exempt and keeps its single-purpose chrome.

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

This shape is owned by a single DS shell composition — `AppHeader` — exported from `src/components/shell/app-frame.tsx` and consumed by every layout. No layout file may render brand / nav / avatar markup directly.

## 4. Binding rules

These rules are binding on every `AppFrame` consumer. Subtasks `-15` through `-19` implement against them; reviewers reject any deviation that is not first ratified by amending this ADR.

1. **Brand block** (brand wordmark + route-family eyebrow where the family declares one) is always on the leading edge. The eyebrow is optional per family — public and account declare one; student, tutor, and internal do not. The eyebrow is dropped on mobile (only the wordmark remains).
2. **Nav** lives in the top bar on desktop and in the bottom dock on mobile. The top bar's nav is hidden on mobile via the same `< 768px` breakpoint that switches to the bottom dock. The bottom dock is hidden on desktop. No simultaneous display, no wrapping across rows.
3. **Avatar** sits on the trailing edge of the top bar on every viewport. It is a `<button>` that opens `AvatarMenu` (a DS popover) — it is **not** a direct link. The menu items are the Account family routes plus `Sign out`. The avatar always renders when `viewer` is present; if not signed in, the slot renders a `Sign in` `Button` instead.
4. **Mobile bottom nav** carries up to **five** slots: four primary destinations from the route family + a `More` slot that opens a DS `Menu` listing the family's overflow items. The exact 4-tab split per family is locked in § 5 below.
5. **Desktop overflow** is mandatory: if the nav row would exceed the available width at the current viewport, the trailing items collapse into a `More` menu (same DS `Menu` primitive). No wrapping into a second row. No horizontal scroll on the top bar.
6. **Public family** does **not** show a bottom dock — the public surface is browsing, not workflow. On mobile, public nav collapses into a hamburger drawer (implemented in `-19`). On desktop, public nav obeys the single-row overflow rule.
7. **Account family** does **not** get its own bottom dock. The Account routes (`/settings`, `/notifications`, `/privacy`, `/billing`) are reached via the avatar menu. Once inside Account, the bottom dock continues to show the originating role family's tabs — a student on `/settings` still sees the student dock, a tutor still sees the tutor dock — so the role's identity is preserved across the settings excursion.
8. **Internal family** keeps its current top-nav-only shape (admin-only; mobile is not a target). Bottom nav is not added there.
9. The header is one DS component — `AppHeader` — owned by `src/components/shell/app-frame.tsx` and consumed by every layout. No layout file may render brand / nav / avatar markup directly.

## 5. Four-tab mobile cores per family

The mobile bottom dock is "core + More". Each private family picks four primary destinations and pushes everything else into the `More` menu. The picks below are binding; subtasks `-17` (BottomNav) and the per-family layout wiring consume this list verbatim.

### 5.1 Student family core

| Slot | Label | Href | Icon (registry key) |
| --- | --- | --- | --- |
| 1 | Get Matched | `/match` | `studentRole` (or new `compass` glyph — registry decision belongs to `-17`) |
| 2 | My matches | `/results` | `users` |
| 3 | Lessons | `/lessons` | `calendar` |
| 4 | Messages | `/messages` | `messageSquare` |
| 5 | More → menu | — | `moreHorizontal` |

`More` menu contents: Find Tutors (`/tutors`), Saved (`/saved`), Compare (`/compare`).

Rationale: these four are the only destinations the user reaches every session. `Get Matched` is the front door, `My matches` is the primary review surface, `Lessons` is the work, and `Messages` is the relationship — match → results → lessons → messages is the canonical student arc. `Find Tutors`, `Saved`, and `Compare` are discovery-side affordances that the same user does *not* touch every session, so they live one tap deeper.

### 5.2 Tutor family core

| Slot | Label | Href | Icon (registry key) |
| --- | --- | --- | --- |
| 1 | Overview | `/tutor/overview` | `tutorRole` |
| 2 | Lessons | `/tutor/lessons` | `calendar` |
| 3 | Schedule | `/tutor/schedule` | `clock` |
| 4 | Messages | `/tutor/messages` | `messageSquare` |
| 5 | More → menu | — | `moreHorizontal` |

`More` menu contents: Profile, Credentials, Photo, Video, Earnings.

Rationale: tutors live in Overview (their dashboard) and Lessons (their work today). Schedule is the second daily surface — they update availability often. Messages is the response channel that gates new bookings. The profile-shape surfaces (Profile / Credentials / Photo / Video) and the financial surface (Earnings) are weekly-at-most touches, so the `More` menu is the right home.

### 5.3 Public family

No bottom dock. The top nav carries four conversion-focused items: `Home`, `Find Tutors`, `Get Matched`, `Become a Tutor`. Reassurance content (`How It Works`, `Trust & Safety`, `Support`) lives in the public footer on every page, not in the top nav. On mobile, the four nav items collapse into a hamburger drawer (implemented in `-19`); footer links are not duplicated in the drawer. On desktop, the inline nav obeys the single-row overflow rule from § 4.5.

### 5.4 Account family

No bottom dock of its own. The bottom dock continues to render the originating role family's core (student or tutor) — the role's identity is preserved across the settings excursion. The Account routes themselves are reached via the `AvatarMenu`.

Implementation note for `-17`: `(account)/layout.tsx` resolves which dock to render by reading the viewer's role from the existing role-detection helper used elsewhere in the app, not from the `Referer` header. If the user holds both roles, render the student dock by default. Document the resolved branch in the `-17` report.

### 5.5 Internal family

No bottom dock. Admin-only surface; mobile is not a target. The top nav keeps its existing top-bar-only shape with the desktop single-row overflow guarantee from § 4.5.

## 6. Why avatar opens a menu, not a link

The avatar today is `<Link href="/settings">`. One tap on the avatar swaps the entire active route family's nav rail with the Account family's rail — the student or tutor loses their workspace nav as soon as they reach for a settings change. The cost is high and the value is low: in practice the user wanted to flip a notification preference or check billing, not relocate.

Replacing the link with a popover menu costs nothing visually (the avatar still looks like an avatar, and the menu opens *over* the current surface), and it preserves the active family's nav while exposing all four Account routes plus `Sign out` directly. This also removes the need for a duplicate "Account" tab in any role family's nav rail.

The same DS `Menu` + `Popover` primitives are reused by the bottom dock's `More` slot and the desktop top-bar overflow `More` button (§ 4.5). One composition powers all three call sites.

## 7. Why account routes are not on the dock

Putting `Settings` / `Notifications` / `Privacy` / `Billing` in the bottom dock would cost two of the four core slots — every student would lose either `Match` or `Lessons` from their primary navigation, which inverts the cost-of-access for surfaces they touch every session vs. surfaces they touch monthly.

The dock's adjacency model is "always one tap from your work". The avatar menu's adjacency model is "always one tap from your identity". Keeping these two models separate is the cheapest way to give every primary destination the slot it deserves at every viewport.

When the user is on an Account route, the originating role family's dock still renders below — so the role family is never lost during a settings excursion. The avatar menu becomes the "go to Account" affordance; the dock stays the "go to my work" affordance.

## 8. Why bottom dock for private, hamburger for public

The two route postures are different:

- **Private families (student, tutor)** are workflow surfaces. The user moves between four primary destinations many times per session. A bottom dock that keeps those four always one tap away matches the workflow. A hamburger would add a tap to every workflow transition.
- **Public family** is browsing. The user enters from a search result or a deep link, scans, and either signs up or leaves. There is no four-destination loop to optimise. A hamburger drawer keeps the browsing surface clean (no persistent dock chrome eating viewport on a marketing page) and still gives signed-in browsers a one-tap shortcut into their workspace (covered in `-19`).

The shapes are different on purpose. They are not "two solutions to the same problem"; they are one solution each to two different problems.

## 9. Desktop overflow rule

At every viewport from 768px to 1920px, the top header is one line tall. When the nav row cannot fit all the family's items, the trailing items collapse into a `More` menu at the trailing edge of the nav row. The avatar slot is always at the trailing edge, never wraps below.

Group labels (e.g. the tutor family's three nav groups today) are not rendered as eyebrows above the top nav at any viewport — the desktop row is flat. Group identity survives only as the eyebrow vocabulary of the active item and as section dividers inside the `More` menu when overflow kicks in.

The CSS rules `flex-wrap: wrap` on `.headerInner` and `.navGroups` (`src/components/shell/app-frame.module.css`) are removed by `-18`. They are the mechanical source of the multi-row drift this ADR replaces.

## 10. Implementation handoff

This ADR is the spec. The implementation lands in five subtasks, in order:

| Subtask | Lands |
| --- | --- |
| `P2-SUX-001-15` | `loadViewerIdentity()` in `(public)/layout.tsx`, so the avatar slot has data on every route. Sign-in button when `viewer` is null |
| `P2-SUX-001-16` | DS `AvatarMenu` (popover composition over `Menu` + `Popover` + `Avatar`); replaces the direct `<Link>` in `app-frame.tsx`; `viewer.settingsHref` is removed from `ViewerIdentity` |
| `P2-SUX-001-17` | DS `BottomNav` primitive + adoption for student and tutor (four-tab cores from § 5.1 and § 5.2 above) |
| `P2-SUX-001-18` | Desktop single-row guarantee + `MoreMenu` overflow composition (drops `flex-wrap: wrap`) |
| `P2-SUX-001-19` | Public family mobile chrome — hamburger drawer (private families use the dock from `-17`) |

The four-tab cores in § 5.1 and § 5.2 are binding on `-17`. The avatar menu items in `-16` are binding (`Settings`, `Notifications`, `Privacy`, `Billing`, `Sign out`). The mobile-vs-desktop breakpoint is `768px` across every subtask. The DS `Menu` + `Popover` composition is shared across `AvatarMenu`, the bottom-dock `More`, the desktop-overflow `More`, and the public hamburger drawer — no duplicated styling, no parallel popover stacks.

## 11. Out of scope for this ADR

The following decisions are intentionally not made here. Any subtask that needs them must escalate and amend this ADR first.

- Notification badges / unread counts on any nav slot — escalate before adding.
- Hide-on-scroll behaviour on the bottom dock — covered as a follow-on if needed.
- "Switch role" affordance for users with both student and tutor roles — separate task; the role-switch UI is not the avatar menu's job in this ADR.
- A global command-menu / search input in the top bar — escalate before adding.
- Localisation of any header copy — header copy in this ADR is English-only.
- Sticky-on-scroll behaviour for the top bar — separate polish task; render-stability is sufficient for this ADR.

## 12. Supersedes

This ADR is the canonical reference for the header shape. Where it conflicts with prior documents, this ADR wins:

- `docs/architecture/route-layout-implementation-map-v1.md` §§ 9.1–9.7 (per-family layout responsibilities) and § 14 (shared navigation and mode rules) — the layout-by-layout phrasing of "header and footer", "navigation", and "mode rules" must now be read through this ADR. That map is updated in the same commit to point here.
- Any header guidance in `docs/design-system/component-specs-core-v1.md` and `docs/design-system/component-specs-phase2-v1.md` that predates the canonical `AppHeader` decision is overridden where it conflicts; the binding rules in § 4 above apply.

## 13. Related documents

- `docs/design-system/agent-ui-rules.md` § 5 (reuse-before-extend), § 6a (DS-first extension), § 8 (consistency checklist).
- `docs/design-system/component-inventory-v1.md` § 4 (`AppFrame`, `AvatarMenu`, `BottomNav`).
- `docs/design-system/component-specs-core-v1.md`, `docs/design-system/component-specs-phase2-v1.md`.
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md` (target sizes, keyboard model).
- W3C ARIA APG patterns for `Menu`, `Disclosure`, `Tablist` (the keyboard-model reference).
- `docs/planning/phase2-student-ux-task-pack-v1.md` §§ 5.14–5.19 (this ADR and its five implementation subtasks).
