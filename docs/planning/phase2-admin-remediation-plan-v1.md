# Mentor IB — Phase 2 Admin Surfaces Remediation Plan v1

**Date:** 2026-05-28
**Status:** Active remediation + expansion plan for the admin/internal surface
**Owner doc for:** the legibility fix tasks `P2-OPSFIX-001` … `P2-OPSFIX-006a` (§8) and the expanded build tasks `P2-ADMIN-*` (§12)
**Companion to:** `docs/planning/phase2-admin-capability-map-v1.md` (the full expected end-state catalog + navigation IA) and `docs/planning/phase2-task-pack-v1.md` (§11.7a–§11.12 — the original admin tasks)

## 1. Why This Document Exists

The Phase 2 admin lane (`P2-OPS-000/001/002/003`, plus `P2-DISPUTE-001`) was implemented end-to-end by AI agents, but the result is not usable as an operator tool:

- the screens are hard to understand — a moderation row says only "Reports · Under review · Subject: Tutor profile", with no name, photo, or context for *who* or *what*
- raw database identifiers (UUIDs) and raw enum values (`active`, `app_user`, `tutor_application.approve`) are shown directly to the operator
- there is **no tutor or user photo anywhere**, even though a `PersonSummary` / `Avatar` design-system primitive exists and is used elsewhere
- much of the copy is technical jargon ("Subject id", "App user id", "Kind", "Involvement")
- ~700 lines of route-local CSS were written across the admin pages, recreating design-system patterns the conventions explicitly forbade
- `P2-DISPUTE-001` was marked done but **no `/internal/disputes` route exists** in the repo

This document audits expected vs actual, names the root causes, and defines a sequenced set of fix tasks. The goal is a small, legible, design-system-native operator surface — not more features.

## 2. How This Audit Was Done

Reviewed (read in full):

- `src/app/internal/page.tsx` (hub)
- `src/app/internal/moderation/page.tsx` + `moderation/[caseId]/page.tsx`
- `src/app/internal/users/[id]/page.tsx`
- `src/app/internal/moderation/moderation.module.css` and siblings
- `src/modules/admin/user-detail-repository.ts`, `moderation-case-evidence.ts` (DTO shapes)
- `src/components/continuity/continuity-primitives.tsx` (`PersonSummary` API)
- `src/app/tutor/students/page.tsx` (reference for how the rest of the app presents a person)

Checked against:

- `docs/planning/phase2-task-pack-v1.md` §11.7a (shared admin conventions), §11.9–§11.12
- `docs/architecture/admin-and-moderation-architecture-v1.md` §8.2 (internal DTO rule), §18.2–§18.3 (result-shaping and identifier rules)
- `docs/design-system/agent-ui-rules.md` (DS-first)

## 3. Expected vs Actual

| Surface | Expected (per task pack + architecture) | Actual (as shipped) |
| --- | --- | --- |
| Moderation queue | Rows show *who/what* a case is about: subject name + avatar, reporter, short reason. | Rows show only the case-kind label + status + "Subject: Tutor profile" + opened date. No name, no photo, no reason. |
| Moderation case detail | Operator can decide at a glance: subject person card, evidence, history. §18.3 says prefer "scoped summaries rather than raw dumps". | Renders `Subject id`, `Conversation id`, `Tutor profile id`, `Kind: app_user` as raw rows; blocks render as `<uuid> → <uuid>`; "Public profile" is an unlinked string. No avatar. |
| User detail | Role-safe person view with avatar, friendly statuses, clickable profile, country flag. | No avatar; `accountStatus`/`applicationStatus`/`payoutReadinessStatus` shown as raw enums; `App user id` / `Tutor profile id` shown raw; audit rows show raw `action_key` chips (`tutor_application.approve`) and fall back to actor UUID; country as raw code. |
| Reference data | Label-edit-only with clear field names. | Functional but jargon-heavy; needs copy + DS pass (same patterns as the others). |
| Internal hub | Queue cards with live counts. | Closest to acceptable, but reuses the same route-local intro/card CSS and raw filter chips. |
| Disputes (`P2-DISPUTE-001`) | `/internal/disputes` filtered lesson-issue queue + resolution actions + reliability events. | **Route does not exist.** Not implemented. |
| Design system | "No route-local card/chip/panel/menu CSS … compose only DS primitives" (§11.7a). | ~700 lines of route-local `*.module.css` recreating page-intro, key/value lists, notes lists, and grids. `PersonSummary`, `Avatar`, `Flag` never imported. |

## 4. Root Causes

1. **The tasks specced data and behavior, not information design.** Acceptance criteria covered state machines, RLS, audit rows, and DTO-leak prevention — all present and working. None of them said "the operator must see the subject's name and photo and decide without reading a UUID." The agents satisfied the letter of the spec.
2. **DTOs return storage shapes, not view models.** `user-detail-repository.ts` and `moderation-case-evidence.ts` return raw enum strings, raw UUIDs, and no avatar/flag fields. The UI then has nothing display-ready to render, so it prints identifiers. Humanization and avatar resolution must happen at the repository boundary.
3. **DS-first was asserted but not enforced for layout chrome.** The conventions block listed primitives to *compose*, but every page still needed a page header, a key/value list, and a notes list — none of which existed as primitives — so each route invented them in CSS. This is a real DS gap, not just agent sloppiness.
4. **`PersonSummary` was never connected.** The one primitive purpose-built for this (it has an `operational` variant) was not referenced. The admin DTOs also don't carry the `avatarSrc` it needs.
5. **`P2-DISPUTE-001` was closed without a route.** Verification was checklist-based ("privilege and DTO review") rather than "the route renders" — so a missing surface passed.

## 5. Guiding Principles For The Fix

- **No raw identifiers in the UI.** UUIDs never render as visible text. If an operator needs to copy an id, it goes behind a "copy id" affordance, not inline body text (architecture §18.3).
- **No raw enums in the UI.** Every status/kind/action-key is mapped to a human label at one place. Prefer the canonical label loaders already used elsewhere; statuses use `StatusBadge` with a tone.
- **Every person is a `PersonSummary`.** Subjects, reporters, note authors, and audit actors render through `PersonSummary` (avatar + name + descriptor), not bare strings. Tutors link to their public profile; countries render through `Flag`.
- **Decide-at-a-glance queues.** A queue row answers "who, what, how urgent, how old" without opening the case.
- **DS-native chrome.** Page header, key/value list, and notes/activity list become shared primitives. Route-local `*.module.css` for these patterns is deleted.
- **Smaller, not bigger.** This is a remediation pass. Do not add operator features beyond building the missing dispute surface.

## 6. Cross-Cutting Fixes (apply to every admin surface)

These are prerequisites; the per-surface tasks consume them.

### 6.1 View-model boundary (`P2-OPSFIX-001`)

Extend the admin repositories so every DTO is display-ready:

- add `avatarSrc: string | null` to every person/tutor DTO, resolved from the M2 public profile photo (`tutor_public_media_assets`, published `profile_photo`) for tutors, and from any account avatar for users; `null` is fine (PersonSummary falls back to initials).
- replace raw enum fields with `{ value, label, tone }` view objects (or add parallel `*Label` fields) for `account_status`, `application_status`, `public_listing_status`, `payout_readiness_status`, `case_kind`, `case_status`, `resolution_kind`, `role_status`, and `admin_action_logs.action_key`.
- add a `countryFlagCode` field wherever a country code is surfaced.
- add `publicProfileHref` (a real route) instead of returning a `/tutors/${slug}` string for the UI to print.
- never include a bare UUID as a *display* field; keep ids in the DTO only where the UI needs them for links/keys.

### 6.2 Shared admin DS chrome (`P2-OPSFIX-002`)

Add the three missing primitives to the design system (DS-first; update `component-inventory-v1.md`), then delete the route-local CSS that duplicates them:

- **`PageHeader`** (or a `Section` variant) for the eyebrow + title + optional back-link + status row repeated on every internal page. Removes `.intro` / `.eyebrow` / `.title` / `.helperText` from five `*.module.css` files.
- **`DescriptionList`** key/value primitive replacing the hand-rolled `.detailList` / `.detailRow` / `.detailLabel` / `.detailValue` in moderation and user-detail. Values can be text, a `StatusBadge`, a `Link`, or a `Flag`.
- **`ActivityList`** (notes / audit entries) primitive replacing `.notesList` / `.noteEntry` / `.recentList` / `.recentRow`. Each item takes a `PersonSummary`-style header + body + timestamp.
- After these land, the only admin route-local CSS allowed is genuine page-level layout (e.g., the two-column `detailGrid`), and even that should be reviewed against existing layout tokens.

### 6.3 Plain-language copy map (`P2-OPSFIX-003`)

One copy module per domain mapping technical tokens to operator language, consumed by the view-model boundary:

- `action_key` → verb phrases ("Approved tutor application", "Revoked admin role", "Delisted public profile").
- `involvement` / `subject_kind` → plain nouns ("Reported user", "Reported tutor", "Reporter").
- statuses → the labels already defined inline today, centralized so they are not redefined per page.
- remove operator-jargon row labels ("Subject id", "App user id", "Kind") — these stop being visible rows once §6.1 lands; any remaining technical field goes behind a "Technical details" disclosure.

## 7. Per-Surface Fixes

### 7.1 Moderation queue + detail (`P2-OPSFIX-004`)

- Queue rows: render each row with `PersonSummary` (subject avatar + name + tutor/user descriptor), a `StatusBadge`, an age/priority chip, and a one-line reason snippet. The row title is the *subject*, not the case kind; the case kind becomes a chip.
- Detail page: replace the raw `DetailRow` dump with a subject `PersonSummary` card (avatar, name, link to public profile / user detail), a `DescriptionList` for the few real attributes, and the evidence block. Render blocks as `PersonSummary` pairs ("X blocked Y"), never raw UUID arrows. Make "Public profile" a real `Link`. Move ids behind a copy affordance.
- Notes + (future) audit: use `ActivityList`.

### 7.2 User detail (`P2-OPSFIX-005`)

- Header: `PersonSummary` (header variant) with avatar, name, account-status `StatusBadge`, joined date.
- Account/roles/tutor/finance: `DescriptionList` with humanized statuses (`StatusBadge` + tone), country via `Flag`, public profile via `Link`. Drop "App user id" / "Tutor profile id" as visible rows.
- If the user is an approved tutor, show the tutor profile photo and headline (the operator should see what the public sees).
- Recent cases / admin actions: `ActivityList` with friendly action-key labels and actor `PersonSummary`; no raw `action_key` chips, no actor-UUID fallback (show "Unknown operator" if name missing).

### 7.3 Reference data + policy notices (`P2-OPSFIX-006a`, folded into the DS pass)

- Adopt `PageHeader` / `DescriptionList`; replace jargon labels with the editable-field names from the matrix in task-pack §11.11; confirm no slug/key/id is ever shown as editable. Lower priority than the people-facing surfaces but should ride the same DS chrome.

### 7.4 Internal hub (folded into `P2-OPSFIX-002`)

- Reuse the new `PageHeader`; keep the queue cards but source counts and labels from the centralized copy map. Add a dispute-queue card once §7.5 lands.

### 7.5 Build the missing dispute surface (`P2-OPSFIX-006`)

`P2-DISPUTE-001` must be re-opened and actually implemented:

- create `/internal/disputes` (filtered `moderation_cases` where `case_kind = 'lesson_issue'`, or the existing `lessonIssueCases` under review) using the same DS chrome and `PersonSummary` rows defined above.
- implement the resolution actions and `tutor_reliability_events` write path per the (already detailed) task-pack §11.12 scope.
- verification must include "the route renders for an admin and 404s for a non-admin" — not only checklist review.
- re-set `P2-DISPUTE-001` status to `draft` in the task pack until this lands, with a pointer to this plan. (It is currently `ready`/assumed-done but unbuilt.)

## 8. Remediation Task List (sequenced)

| Step | Task id | Title | Depends on |
| --- | --- | --- | --- |
| 1 | `P2-OPSFIX-001` | Admin view-model boundary: avatars, humanized enums, flags, hrefs in all admin DTOs | — |
| 1 | `P2-OPSFIX-002` | Shared admin DS chrome: `PageHeader`, `DescriptionList`, `ActivityList`; delete route-local CSS; rebuild hub | — |
| 1 | `P2-OPSFIX-003` | Plain-language copy map for action keys, involvement, statuses | — |
| 2 | `P2-OPSFIX-004` | Moderation queue + detail rebuild on the new VM + chrome + `PersonSummary` | `P2-OPSFIX-001/002/003` |
| 2 | `P2-OPSFIX-005` | User-detail rebuild on the new VM + chrome + `PersonSummary` + tutor photo | `P2-OPSFIX-001/002/003` |
| 3 | `P2-OPSFIX-006` | Build the missing `/internal/disputes` surface + reliability events | `P2-OPSFIX-001/002/003`, `P1-LESS-002` |
| 3 | `P2-OPSFIX-006a` | Reference-data + policy-notice DS/copy pass | `P2-OPSFIX-002/003` |

Step 1 is parallelizable (disjoint write scopes: DTOs, DS primitives, copy module). Steps 2–3 consume step 1.

## 9. Definition Of Done (per surface)

A surface is fixed only when all of the following hold (verify with screenshots, not just a green build):

- zero raw UUIDs visible as body text
- zero raw enum/`action_key` strings visible — every one is a label or a toned `StatusBadge`
- every person/tutor renders through `PersonSummary` with an avatar slot; tutors link to their public profile
- the page imports no route-local CSS for page-intro, key/value, or notes patterns (those come from DS)
- copy is operator-plain (no "Subject id", "Kind", "Involvement: …")
- `pnpm lint:arch` passes and `component-inventory-v1.md` reflects any new primitive
- for `/internal/disputes`: the route renders for an admin and returns 404 for a non-admin

## 10. Out Of Scope (for the §6–§7 legibility remediation only)

The legibility remediation (steps 1–3 above) does **not** add new capabilities — it makes the existing ones usable plus builds the missing dispute route. The broader capability expansion raised in the 2026-05-28 operator review is tracked separately in §12 below and catalogued in `phase2-admin-capability-map-v1.md`.

Permanently out of scope for the whole admin programme:

- the capability-family role split (still a later refactor; every admin can do everything for now)
- changing any audit, RLS, or state-machine behavior of the shipped services — those work and must be preserved
- a generic CMS, a SQL console, localization management, or a native mobile admin

## 11. Note On Process

The underlying domain work (migrations, services, audit, RLS, state machines) is largely sound — the wasted effort was concentrated in the UI layer, which optimized for "spec satisfied" over "operator can use it". The durable fix is the §6.1 view-model boundary and the §6.2 DS chrome: once admin DTOs are display-ready and the three shared primitives exist, future admin surfaces inherit a legible baseline instead of re-deriving raw-identifier screens. Fold that lesson back into `phase2-task-pack-v1.md` §11.7a so the convention is "admin DTOs are view models; people render via `PersonSummary`; no raw ids/enums" — not just "use these primitives".

## 12. Expanded Admin Scope (2026-05-28 operator review)

The operator reviewed the post-remediation surface and raised nine gaps. They are analyzed against the codebase below, plus tutor-marketplace research. The full expected end-state catalog — with per-capability status and navigation IA — now lives in **`docs/planning/phase2-admin-capability-map-v1.md`**; this section records the disposition and the build tasks.

### 12.1 Disposition of the nine operator points

| # | Operator point | Disposition | Task |
| --- | --- | --- | --- |
| 1 | View/manage students, edit name, remove from platform | New-build directory + edit-name action; "remove" must route through the DSR/erasure flow, not a raw delete | `P2-ADMIN-PEOPLE-001` |
| 2 | Analytics (popular search areas, country distribution, more) | New-build dashboard; *search-demand* widget blocked on a logging decision (B-2) | `P2-ADMIN-ANALYTICS-001` |
| 3 | Moderate tutor reviews (hide bad language) | **Data layer already exists** (`reviews.review_status` + `moderation_note`); build the admin surface + report-a-review entry | `P2-ADMIN-TRUST-001` |
| 4 | Add more admin users | **Already works** (`grantAdminRole`); just needs a discoverable entry via the admin directory | folded into `P2-ADMIN-PEOPLE-001` |
| 5 | Support tickets / contact-us | New-build: public contact form + internal ticket queue | `P2-ADMIN-SUPPORT-001` |
| 6 | Tutor rejection reasoning (written explanation) | **Already works** — reviewer note is *required* on reject/request-changes and shown to the applicant; only needs UI confirmation during the remediation pass | confirm in `P2-OPSFIX` review; no new task |
| 7 | Tutor record: application/review/status-change history | Data exists across `tutor_application_reviews` + `admin_action_logs`; build a unified lifecycle timeline on the tutor detail | `P2-ADMIN-PEOPLE-002` |
| 8 | Tutor's lessons, rating, money earned, commission paid | Lessons/ratings/earnings data exists (reuse `TutorEarningsDto`); **commission paid needs the B-1 capture build** (model now decided) | `P2-ADMIN-PEOPLE-002` (earnings/lessons), commission via `P2-ADMIN-FIN-000/001` |
| 9 | Platform finance: what we earned, Stripe fees paid | Model **decided** = global commission % (admin-set, 0–100); now an engineering build (commission setting + per-transaction fee capture) before the dashboard | `P2-ADMIN-FIN-000` (build) → `P2-ADMIN-FIN-001` (dashboard) |

### 12.2 Revenue model — decided; remaining blocker is engineering only

- **B-1 — revenue model DECIDED (2026-05-28).** The model is a **single global commission percentage**, configured in admin, any value 0–100%. It is no longer blocked on a business decision; it is now an engineering build that still gates all finance reporting. Required pieces:
  - global commission-rate setting (0–100%) in admin Configuration, audited; changes never rewrite history;
  - rate **snapshot per transaction** at booking time;
  - per-transaction capture of `gross_amount`, `commission_rate`, `platform_fee_amount`, `stripe_fee_amount`, `tutor_net_amount`, `currency_code`;
  - Stripe Connect `application_fee_amount` wiring on the PaymentIntent capture path in `booking.ts`; Stripe fee read from the balance transaction.
  - Once captured, operator points 8 (per-tutor commission) and 9 (platform revenue, Stripe fees) become buildable. Tracked as `P2-ADMIN-FIN-000` (now a build, not a decision).
- **B-2 — search demand logging: RESOLVED (Option A).** Search was only logged to client-side PostHog events (lacking query text + result counts; server module write-only). Decision: persist a `search_query_log` (admin-only RLS, 90-day retention, written on settled searches with the Algolia result count). Built inside `P2-ADMIN-ANALYTICS-001`, which is now `ready`. No open decisions remain in the admin programme.

### 12.3 Navigation

Keep the one shared shell — **no admin sidebar** (that would violate the "one shared app shell" rule in §11.7a / CLAUDE.md). Instead, `P2-ADMIN-NAV-001` adopts **two-level navigation through the existing `AppFrame` header**: the single-row top header carries the **7 capability groups** (Overview · People · Applications · Trust & Safety · Support · Finance · Configuration), and each group is a **section landing page** of cards linking to its leaf surfaces (the same card pattern the `/internal` hub already uses). Seven entries fit one row; the existing `isGroupStart` separators + "More" overflow handle small screens, and `AvatarMenu` is unchanged. Implementation: extend `navigationByFamily.internal` to list the 7 group entries (pointing at section landing routes), not the ~15 leaf routes. Groups with a single leaf (Applications, Support) point straight at that leaf. The full group → section → leaf map is in `phase2-admin-capability-map-v1.md` §3. This lands early in step 4 so new surfaces attach to a stable menu.

### 12.4 Expanded task list (steps 4+)

These run **after** the §8 legibility remediation (steps 1–3), because every new surface should be built on the view-model boundary + DS chrome rather than repeating the original mistakes.

| Step | Task id | Title | Depends on |
| --- | --- | --- | --- |
| 4 | `P2-ADMIN-NAV-001` | Two-level header nav: 7 capability groups in the shared `AppFrame` header + card-list section landing pages (no sidebar) | `P2-OPSFIX-002` |
| 4 | `P2-ADMIN-PEOPLE-001` | Student/tutor/admin directories (search, filter) + edit-name + remove-via-DSR + promote-to-admin entry | `P2-OPSFIX-001/002/005`, `P2-ADMIN-NAV-001` |
| 4 | `P2-ADMIN-PEOPLE-002` | Tutor detail enrichment: lifecycle timeline, lessons list, rating/reviews, earnings (gross) | `P2-OPSFIX-005`, `P2-ADMIN-PEOPLE-001` |
| 4 | `P2-ADMIN-TRUST-001` | Tutor-review moderation surface (hide/redact + reason) + report-a-review entry | `P2-OPSFIX-004` |
| 4 | `P2-ADMIN-POLICY-001` | Global policy-change acknowledgement banner/modal (appears on every page after login until an unacknowledged `requires_acknowledgement` notice is cleared); powered by the existing `policy_notice_receipts` table | `P2-OPSFIX-002` |
| 5 | `P2-ADMIN-SUPPORT-001` | Contact-us public form → creates one ticket; internal support ticket queue/detail; email replies via Resend | `P2-OPSFIX-001/002`, `P2-ADMIN-NAV-001` |
| 5 | `P2-ADMIN-ANALYTICS-001` | Operational + marketplace-health dashboard (country distribution, supply funnel, GMV-gross) + search-demand panel via new `search_query_log` (B-2 → Option A) | `P2-ADMIN-NAV-001` |
| 6 | `P2-ADMIN-FIN-000` | Revenue-model build (model decided = global commission %): commission-rate setting (0–100, audited) + per-transaction snapshot/capture of `gross / commission_rate / platform_fee / stripe_fee / tutor_net` + Stripe `application_fee_amount` wiring | — |
| 6 | `P2-ADMIN-FIN-001` | Platform finance dashboard: revenue, commission, Stripe fees, payout oversight; per-tutor commission | `P2-ADMIN-FIN-000`, `P2-ADMIN-PEOPLE-002` |

### 12.5 Research additions (recommended, not yet tasked)

From tutor-marketplace norms (detail in capability-map §6): tutor quality scorecard (response/acceptance/completion/cancellation rates), retention/repeat-booking metrics, refund & chargeback monitoring, optional featured-tutor curation, and a non-legal announcement broadcast. These are deferred until the core operator surface is legible and the people/finance foundations exist.
