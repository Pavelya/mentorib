# Mentor IB — Admin Capability Map (Expected End State) v1

**Date:** 2026-05-28
**Status:** Canonical catalog of what the Mentor IB admin/internal surface is expected to do
**Companion to:** `docs/planning/phase2-admin-remediation-plan-v1.md` (the fix/build task plan) and `docs/planning/phase2-task-pack-v1.md` §11.7a–§11.12 (original admin tasks)

This is the single reference for "what can an admin do". It folds in the operator review of 2026-05-28 (nine gaps raised) plus tutor-marketplace research. It marks each capability's current state honestly so we never again mark something "done" that isn't built.

## 1. Status Legend

| Mark | Meaning |
| --- | --- |
| **Shipped** | Working in the repo today (domain + a usable surface). |
| **Shipped-domain / UI-broken** | Domain logic works but the screen is illegible (raw ids/enums, no avatars) — covered by the remediation plan §6–§7. |
| **Partial** | Data layer exists; admin surface missing. |
| **New-build** | Neither data nor surface exists; must be built. |
| **Blocked** | Cannot be built until a prerequisite (usually a data/business-model decision) lands. |

## 2. Prerequisites & Blockers (read first)

These gate whole capability areas:

- **B-1 Revenue model — DECIDED (2026-05-28), now a build, no longer a business blocker.** The model is a **single platform commission percentage**, configured in admin, any value 0–100%. Today the platform still captures only `price_amount` (gross), paid in full to the tutor — no fee split exists in `src/modules/lessons/booking.ts` or `src/modules/payouts`. The remaining work is purely engineering and gates all finance reporting:
  - a **global commission-rate setting** (0–100%) editable in admin Configuration, audited; changing it never rewrites history.
  - **rate snapshot at transaction time** — each booking/payment records the `commission_rate` in effect when it was booked, so later changes don't retroactively alter past lessons.
  - **per-transaction fee capture** — persist `gross_amount`, `commission_rate`, `platform_fee_amount` (= gross × rate), `stripe_fee_amount` (read from the Stripe balance transaction), `tutor_net_amount`, `currency_code`.
  - **Stripe wiring** — apply the platform cut via Stripe Connect `application_fee_amount` on the PaymentIntent so the split happens at capture; this touches the existing capture path in `booking.ts`.
  - Once captured, this unblocks per-tutor "commission paid" (operator point 8) and platform revenue + Stripe fees (operator point 9). *(Now a build → `P2-ADMIN-FIN-000`, no longer pending a business decision.)*
- **B-2 Search-demand logging — RESOLVED (2026-05-28): Option A.** "Popular things students search for / unmet demand" (operator point 2) currently only emits client-side PostHog events (`public_tutor_search_performed`) that lack query text and result counts, and the server analytics module is write-only. Decision: **persist a `search_query_log`** (admin-only RLS, 90-day retention, written on settled searches with the Algolia result count) so the demand panel — including zero-result/unmet-demand — is queryable from the DB. Built by `P2-ADMIN-ANALYTICS-001` (no longer a blocker).
- **B-3 Controlled-lookup posture.** Architecture §18.1 deliberately forbade a "broad unrestricted personal-data browser". Operator points 1 and 4 require student/tutor directories with search. This is an explicit, reviewed relaxation: directories are paginated, role-filtered, name/email-searchable only, admin-gated, and every detail open is audited. Recorded here so the widening is intentional.

## 3. Navigation Information Architecture

**Keep the one shared shell — no admin sidebar.** The whole app, including `/internal`, uses the single `AppFrame` with a **single-row top header nav** (`src/components/shell/app-frame-nav.tsx`) that auto-overflows extra items into a "More" popover, a `BottomNav` on mobile, and the `AvatarMenu` for account excursions. Building a bespoke admin sidebar rail would violate the "one shared app shell, no parallel internal shell" rule (CLAUDE.md + task-pack §11.7a). The flat list of ~15 leaf routes below would also overflow almost entirely into "More" and be unusable.

**Use two-level navigation through existing components:**

1. **The header carries the 7 capability *groups*, not the leaf routes.** Seven entries fit one row; the existing `isGroupStart` separators and "More" overflow handle small screens. Groups map to the architecture's capability families (§6.2) so the later capability-role split can hide whole groups cleanly:

   `Overview · People · Applications · Trust & Safety · Support · Finance · Configuration`

2. **Each group is a section landing page that reveals its sub-items** — the same card pattern the `/internal` hub already uses for queue cards. No new nav model; a group page is just a list of cards linking to its leaf surfaces.

3. **`AvatarMenu` stays unchanged** — admins are still users; settings/sign-out live there.

Implementation note: extend `navigationByFamily.internal` to list the 7 **group** entries (each pointing at its section landing route); leaf routes are reached from the section page, not from the global header.

Group → section → leaf map:

```
OVERVIEW            → /internal                      (dashboard: KPIs + live queue counts)

PEOPLE              → /internal/people               (section landing: cards below)
  Students            /internal/students             directory (search, filter)
  Tutors              /internal/tutors               directory (search, filter)
  Admins              /internal/admins               list + add/remove
  (person detail)     /internal/users/[id]           shared detail for any person

APPLICATIONS        → /internal/tutor-reviews        (queue is itself the landing)
  (credentials)       within the application detail

TRUST & SAFETY      → /internal/trust                (section landing: cards below)
  Moderation          /internal/moderation           reports · blocks · takedowns
  Review moderation   /internal/reviews              hide/redact tutor reviews
  Disputes            /internal/disputes             lesson-issue resolution

SUPPORT             → /internal/support              contact-us → ticket queue

FINANCE             → /internal/finance              (section landing: cards below)
  Platform finance    /internal/finance              revenue · fees (after B-1)
  Payout oversight    /internal/finance/payouts

CONFIGURATION       → /internal/configuration        (section landing: cards below)
  Reference data      /internal/reference-data
  Commission rate     /internal/configuration/commission
  Policy notices      /internal/reference-data/policy-notices
  Audit log           /internal/audit                (later)
```

A group with a single leaf (Applications, Support) points the header entry straight at that leaf — no empty section page. Groups with multiple leaves get a lightweight card-list landing page.

Detail-page reuse: `students` and `tutors` directories both link to one `/internal/users/[id]` person detail. For a person who holds the tutor role, that page renders the extra tutor panels (history, lessons, earnings, reviews) described in §4.3. We do **not** build two parallel detail pages.

## 4. Capability Catalog

### 4.1 Overview / Analytics  *(operator point 2)*

| Capability | State | Notes |
| --- | --- | --- |
| Live operational dashboard (pending tutor reviews, open cases, open tickets, disputes) | Partial | Hub shows queue counts today; expand into a real dashboard. |
| Marketplace health: active tutors, listed tutors, new signups, lessons booked/completed per week, GMV | New-build | Computed from DB (`tutor_profiles`, `lessons`, `bookings`). GMV = gross until B-1. |
| Country distribution (students & tutors) | New-build | From `app_users` / profile country fields; render with `Flag`. |
| Popular subjects / focus areas in demand | New-build | *Booked* demand from booking/match data; *search* demand from the new `search_query_log` (B-2 → Option A). |
| Unmet demand (searches with no good match / zero results) | New-build | Highest-value supply signal; powered by the new `search_query_log` (B-2 resolved → Option A). |
| Conversion funnels (visit → search → profile → booking → repeat) | New-build | Behavioral funnel lives in PostHog; link out rather than rebuild. |
| Tutor supply funnel (apply → approve → first lesson → repeat) | New-build | Computable in-product from application + lesson data. |

### 4.2 People — Students  *(operator point 1)*

| Capability | State | Notes |
| --- | --- | --- |
| Student directory (paginated, search by name/email) | New-build | Filtered `app_users` where role = student. See B-3. |
| Student detail (account, lessons taken, spend, cases) | New-build | Shares `/internal/users/[id]`; student-flavored panels. |
| Edit a student's display name | New-build | New admin action wrapping the existing `full_name` update path with admin actor + audit. |
| Restrict student account (limit/suspend) | Shipped | `setAccountStatus` already supports active⇄limited⇄suspended. |
| Remove student from platform | Partial/New-build | Account closure (`account_status = closed`) is reserved for the DSR/erasure flow (`P2-DSR-001`); the admin "remove" button must route through DSR so erasure/retention rules are honored — not a raw delete. |

### 4.3 People — Tutors  *(operator points 7, 8)*

| Capability | State | Notes |
| --- | --- | --- |
| Tutor directory (search, filter by status/listing) | New-build | Filtered `tutor_profiles`. |
| Tutor lifecycle history: application submitted → review events → status changes → listing changes | Partial | Data exists across `tutor_application_reviews` + `admin_action_logs`; build a unified timeline view. |
| All lessons delivered by a tutor (count, dates, status) | Partial | `lessons` data exists; build per-tutor lesson list. |
| Tutor rating & published reviews (with moderation state) | Partial | `reviews` + aggregate counts exist; surface in detail. |
| Money the tutor earned | Shipped-domain | Reuse `TutorEarningsDto` (total + monthly). Shows gross until B-1 capture lands, then net. |
| Commission the tutor paid the platform | New-build (after B-1) | Buildable once per-transaction `platform_fee_amount` is captured; sums per tutor. |
| Reliability record (no-shows, cancellations) | Partial/New-build | `tutor_reliability_events` is introduced by the disputes build (`P2-OPSFIX-006`); surface once it exists. |
| Admin listing control (pause / delist / lift hold) | Shipped | `admin-listing-service`. |

### 4.4 People — Admins  *(operator point 4)*

| Capability | State | Notes |
| --- | --- | --- |
| List current admins | New-build | Filtered `user_roles` where role = admin. |
| Add an admin (promote a user) | Shipped | `grantAdminRole` — needs a discoverable entry (directory → promote), not just a deep link. |
| Remove an admin | Shipped | `revokeAdminRole` with self-revoke lockout guard. |
| Bootstrap first admin | Shipped | `scripts/grant-admin.ts`. |

### 4.5 Applications — Tutor review  *(operator point 6)*

| Capability | State | Notes |
| --- | --- | --- |
| Application queue (filter, counts) | Shipped | |
| Claim / approve / reject / request changes | Shipped | Guarded transitions, audited; approval activates the tutor role. |
| **Rejection / changes reasoning (written explanation)** | **Shipped** | Reviewer note is **required** on reject and request-changes; the applicant sees the public note. Confirm it is clearly captured in the UI and shown on `/tutor/apply`. |
| Internal-only note (not shown to applicant) | Shipped | Separate from the applicant-visible reviewer note. |
| Credential review (approve/reject/needs-info) | Shipped | |

### 4.6 Trust & Safety  *(operator point 3)*

| Capability | State | Notes |
| --- | --- | --- |
| Moderation case queue + detail (reports, blocks, takedowns) | Shipped-domain / UI-broken | Works; rebuilt for legibility in remediation §7.1. |
| Claim / note / resolve / dismiss cases | Shipped | Audited transitions. |
| Public-content takedown (delist + sitemap + de-index) | Shipped | |
| **Review (comment) moderation — hide/redact a tutor review with bad language** | **Partial** | `reviews.review_status` + `moderation_note` exist; build an admin surface to flip a review to hidden/redacted with a reason, plus a report-this-review entry. New `case_kind = 'review'` recommended. |
| View blocks involving a subject | Shipped | |

### 4.7 Support  *(operator point 5)*

**One pipeline, two surfaces.** "Contact us" is the public input; a support ticket is the internal record it creates. A contact-us submission **always** creates exactly one ticket in the admin queue — they are not separate features.

| Capability | State | Notes |
| --- | --- | --- |
| Public "Contact us" form → creates a ticket | New-build | Available to logged-in and logged-out senders; a logged-out sender supplies an email so we can reply. |
| Internal support ticket queue + detail | New-build | Dedicated `support_tickets` table (recommended over reusing `moderation_cases`): support has its own fields — channel, requester email, status/SLA — and a different lifecycle. |
| Reply / resolve ticket | New-build | Replies go out via email (Resend) since some senders are logged-out; not in-app messaging. |

### 4.8 Finance  *(operator point 9)*

| Capability | State | Notes |
| --- | --- | --- |
| Commission rate setting (global %, 0–100) | New-build | Admin Configuration setting; audited; snapshotted per transaction. The lever for the whole revenue model. |
| Per-tutor earnings view | Shipped-domain | Reuse `TutorEarningsDto`. |
| Platform revenue (commission earned) | New-build (after B-1) | Sum of `platform_fee_amount`; buildable once capture lands. |
| Stripe fees paid | New-build (after B-1) | Sum of `stripe_fee_amount`, read from Stripe balance transactions per payment. |
| Payout oversight (who is owed, payout runs, holds) | Partial | Payout status per tutor exists; a platform-wide payout view is new-build. |
| Finance-intervention notes (payout hold / refund anomaly) | Shipped | Records intent only, no Stripe writes. |
| Refund / dispute financial outcomes | Partial | Refund path exists; dispute consequences land with `P2-OPSFIX-006`. |

### 4.9 Configuration

| Capability | State | Notes |
| --- | --- | --- |
| Reference-data label editing (subjects, focus areas, languages, meeting/video providers) | Shipped | Label-edit-only; no slug/key/row creation. |
| Commission rate setting (global %, 0–100) | New-build | The revenue-model lever; see Finance §4.8 and B-1. |
| Policy notices (draft / publish / revoke + broadcast) | Shipped | Manages **versions**, not page text. |
| Policy-change **user surfacing** (on-screen acknowledgement) | Partial | Today: a `policy_notice_updated` bell + email notification fires, and `/privacy` shows pending notices with an acknowledge action; `policy_notice_receipts` tracks shown/viewed/acknowledged + `requires_acknowledgement`. Missing: a **global on-screen banner/modal** that appears on every page after login when an unacknowledged `requires_acknowledgement` notice exists, and clears once acknowledged. New-build, powered by the existing receipts table. See `P2-ADMIN-POLICY-001`. |
| Policy **text** authoring | Out of scope (by decision, 2026-05-28) | Legal copy stays **code-managed** in `src/modules/legal/content.ts` (version control + review before going live). Admin manages versions + broadcasts only — it does **not** edit the wording. The three docs (`terms`, `privacy`, `trust_and_safety`) already have dedicated public pages; no new page per doc is needed. |
| Audit-log browsing UI | New-build (later) | Audit rows are written today; a viewer is deferred. |

## 5. Cross-Cutting (always-on)

- **Audit trail** — every privileged write records an `admin_action_logs` row. *(Shipped; surfaced legibly after remediation.)*
- **Scoped DTOs** — operators see only what they need; no leak of internal notes, raw credentials, or unrelated records. *(Shipped.)*
- **Legibility baseline** — after the remediation plan, every admin screen renders people via `PersonSummary` (avatar + name), humanized statuses via `StatusBadge`, countries via `Flag`, and shows no raw UUIDs/enums. *(In progress — remediation plan.)*

## 6. Marketplace Research — items not in the operator list but standard for tutor marketplaces

Recommended, prioritized:

- **Tutor quality scorecard** (response time, acceptance rate, completion rate, cancellation/no-show rate) — partly enabled by reliability events; high value for supply quality.
- **Repeat-booking / retention metrics** per tutor and platform-wide.
- **Refund & chargeback monitoring** as a finance-risk view.
- **Featured / curated tutors** (manual promotion) — defer unless a discovery need appears.
- **Announcement broadcast** (non-legal in-app/email announcements) — extends the existing policy-notice fan-out; defer.
- **Fraud / risk flags** (duplicate accounts, payment anomalies) — defer to a dedicated risk pass.

Out of scope (consistent with task-pack non-goals): a generic CMS, a SQL console, localization management, native mobile admin.

## 7. Suggested Phasing

1. **Legibility first** — the remediation plan §6–§7 (view-model boundary, DS chrome, `PersonSummary`, rebuild moderation + user detail). Nothing else is usable until this lands.
2. **People & history** — student/tutor/admin directories, unified tutor lifecycle + lessons + earnings + reviews on the person detail, edit-name, remove-via-DSR. Grouped navigation.
3. **Trust completeness** — build disputes (`/internal/disputes`) and review moderation.
4. **Support** — contact-us + ticket queue.
5. **Analytics** — operational + marketplace-health dashboard (after B-2 decision); funnels via PostHog.
6. **Finance** — only after B-1 (revenue model) is decided and per-transaction fee data is captured.

## 8. Honest Status Summary

- **Genuinely working today:** admin gate + bootstrap, tutor application review (with required rejection reasoning), credential review, moderation cases, public takedown, admin listing control, account-status changes, grant/revoke admin, reference-data editing, policy broadcasts, finance-intervention notes, per-tutor earnings data, audit trail.
- **Built but unusable until remediation:** every screen's legibility (raw ids/enums, no photos).
- **Claimed done but NOT built:** `/internal/disputes`.
- **Needs building (data exists):** review moderation UI, tutor lifecycle/lessons/earnings views, student/tutor/admin directories, edit-name.
- **Needs building (greenfield):** analytics dashboard, support tickets/contact-us, global policy-change acknowledgement banner.
- **Decided, now engineering builds (no longer blocked on a decision):** commission rate setting + per-transaction fee capture (B-1) → unblocks platform finance and per-tutor commission; search-demand logging via `search_query_log` (B-2 → Option A) → unblocks the analytics demand panel.
- **No open decisions remain** — all admin capabilities are either shipped or have a concrete, `ready` build task.
