# Mentor IB — Phase 2 Admin Task Pack v1

**Date:** 2026-05-28
**Status:** Executable task pack for the admin/internal remediation + expansion
**Scope:** make the shipped admin surfaces legible (view-model boundary + DS chrome), build the one missing surface (disputes), and add the operator-requested capabilities (people management, review moderation, support, analytics, finance)

## 1. Why This Pack Exists

The original admin tasks (`P2-OPS-000/001/002/003`, `P2-DISPUTE-001` in `phase2-task-pack-v1.md` §11.7a–§11.12) shipped their domain layer correctly but produced unusable operator screens, and `P2-DISPUTE-001` was never actually built. The diagnosis, decisions, and capability catalog live in:

- `docs/planning/phase2-admin-remediation-plan-v1.md` — the gap analysis + sequencing
- `docs/planning/phase2-admin-capability-map-v1.md` — the expected end-state catalog + navigation IA

This pack turns the task **list** in those docs into **executable specs**. It follows the same task shape as `phase2-task-pack-v1.md` (Goal / Required source docs / Existing repo anchors / Scope / Out of scope / Acceptance criteria / Verification).

## 2. Binding Conventions (read before any task)

All conventions in `phase2-task-pack-v1.md` §11.7a (Shared admin-surface conventions) apply unchanged. In addition, this pack ratifies four rules that the original tasks lacked:

- **VM-1 — admin DTOs are view models, not storage shapes.** No raw UUID renders as visible body text; no raw enum/`action_key` renders as a label. Humanization, avatar resolution, flag codes, and link hrefs happen at the repository boundary, not in the page.
- **VM-2 — every person renders through `PersonSummary`.** Subjects, reporters, note authors, audit actors, directory rows. Tutors link to their public profile; countries render via `Flag`.
- **VM-3 — chrome comes from the DS.** Page header, key/value list, and notes/activity list are DS primitives (`P2-OPSFIX-002`). Route-local `*.module.css` for those patterns is forbidden; only genuine page-level layout (e.g., a two-column grid) may stay local.
- **VM-4 — navigation is two-level, one shell.** No admin sidebar. The shared `AppFrame` header carries the 7 capability groups; leaf routes hang off section landing pages (`P2-ADMIN-NAV-001`, IA in capability-map §3).

Definition of done for every UI task: zero raw UUIDs/enums on screen, `PersonSummary` for all people, no forbidden route-local CSS, `pnpm lint:arch` clean, and a screenshot review (not just a green build).

## 3. Task Table (execution order)

| Step | Task id | Status | Pri | Title |
| --- | --- | --- | --- | --- |
| 1 | `P2-OPSFIX-001` | `ready` | `P1` | Admin view-model boundary (avatars, humanized enums, flags, hrefs) |
| 1 | `P2-OPSFIX-002` | `ready` | `P1` | Shared admin DS chrome: `PageHeader`, `DescriptionList`, `ActivityList`; rebuild hub |
| 1 | `P2-OPSFIX-003` | `ready` | `P1` | Plain-language copy map (action keys, statuses, involvement, kinds) |
| 2 | `P2-OPSFIX-004` | `ready` | `P1` | Moderation queue + detail rebuild |
| 2 | `P2-OPSFIX-005` | `ready` | `P1` | User-detail rebuild |
| 2 | `P2-OPSFIX-006a` | `ready` | `P2` | Reference-data + policy-notice DS/copy pass |
| 3 | `P2-OPSFIX-006` | `ready` | `P1` | Build the missing `/internal/disputes` + reliability events |
| 4 | `P2-ADMIN-NAV-001` | `ready` | `P1` | Two-level header nav: 7 capability groups + section landing pages |
| 4 | `P2-ADMIN-PEOPLE-001` | `ready` | `P1` | Student/tutor/admin directories + edit-name + remove-via-DSR + promote |
| 4 | `P2-ADMIN-PEOPLE-002` | `ready` | `P1` | Tutor detail: lifecycle timeline, lessons, rating, earnings |
| 4 | `P2-ADMIN-TRUST-001` | `ready` | `P2` | Tutor-review moderation (hide/redact) + report-a-review |
| 4 | `P2-ADMIN-POLICY-001` | `ready` | `P2` | Global policy-change acknowledgement banner |
| 5 | `P2-ADMIN-SUPPORT-001` | `ready` | `P2` | Contact-us → ticket; internal support queue |
| 5 | `P2-ADMIN-ANALYTICS-001` | `ready` | `P2` | Operational + marketplace-health dashboard + search-demand panel (`search_query_log`) |
| 6 | `P2-ADMIN-FIN-000` | `ready` | `P1` | Revenue-model build: commission-rate setting + per-transaction fee capture |
| 6 | `P2-ADMIN-FIN-001` | `ready` | `P1` | Platform finance dashboard: revenue, commission, Stripe fees, payouts |

All 16 tasks are `ready` — concrete enough to implement in dependency order. Step 1 is parallelizable (disjoint scopes). Do not start a step until its dependencies merge.

---

## 4. P2-OPSFIX-* — Legibility Remediation

### 4.1 `P2-OPSFIX-001` Admin view-model boundary

**Status:** `ready` · **Priority:** `P1` · **Depends on:** — (the shipped admin modules)

**Goal**

Make every admin DTO display-ready so the UI never has to print a UUID or a raw enum. This is the root fix: the current screens print identifiers because the repositories hand them nothing else.

**Required source docs**

- `docs/architecture/admin-and-moderation-architecture-v1.md` §§ 8.2 (internal DTO rule), 18.2–18.3 (result shaping, identifier rule)
- `docs/data/data-dto-and-query-boundary-map-v1.md` (D7 admin DTO rules)
- `docs/planning/phase2-admin-capability-map-v1.md` §5 (legibility baseline)

**Existing repo anchors to reuse**

- `src/modules/admin/user-detail-repository.ts`, `moderation-case-repository.ts`, `moderation-case-evidence.ts` — the DTOs to extend.
- `src/modules/tutors/media-public-assets-service.ts` — published `profile_photo` lookup (M2) for tutor avatars.
- `src/components/ui/flag.tsx` `FlagCode`; `src/lib/datetime` formatters.
- `P2-OPSFIX-003` copy map (consumed for labels).

**Scope**

- Add to every person/tutor DTO: `avatarSrc: string | null` (tutor → published M2 profile photo; account → account avatar if any; `null` is fine — `PersonSummary` renders initials), `displayName`, and a real `publicProfileHref: Route | null` instead of a bare `/tutors/${slug}` string.
- Replace (or shadow with `*Label` + `*Tone`) every raw enum surfaced to the UI: `account_status`, `application_status`, `public_listing_status`, `payout_readiness_status`, `case_kind`, `case_status`, `resolution_kind`, `role_status`, `review_status`, and `admin_action_logs.action_key`. Labels/tones come from the `P2-OPSFIX-003` map.
- Add `countryFlagCode: FlagCode | null` wherever a country code is surfaced.
- Keep raw ids in the DTO **only** where the UI needs them for React keys or link construction — never as a display field. Where an operator genuinely needs to copy an id, expose it under a `technicalRef` field the UI puts behind a disclosure, not inline.
- No change to RLS, audit, or state-machine behavior. This task only reshapes read DTOs.

**Out of scope**

- any UI change (consumed by `004`/`005`); any new capability; any write-path change.

**Acceptance criteria**

- Every admin read DTO carries display-ready fields (avatar, labels, tones, flag codes, hrefs); no consumer needs a raw enum or UUID to render.
- Unit tests assert: a sample case/user DTO contains no raw enum value in any `*Label` field, and `avatarSrc`/`publicProfileHref` resolve correctly for an approved listed tutor.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` pass.

**Verification**

- DTO snapshot review across the three repositories; confirm label/tone/flag/href coverage for each enum in scope.

### 4.2 `P2-OPSFIX-002` Shared admin DS chrome

**Status:** `ready` · **Priority:** `P1` · **Depends on:** —

**Goal**

Add the three missing DS primitives every admin page hand-rolled in CSS, then delete that route-local CSS and rebuild the hub on them.

**Required source docs**

- `docs/design-system/agent-ui-rules.md` (DS-first; inventory + tokens update rule)
- `docs/design-system/component-inventory-v1.md`, `docs/design-system/tokens-cheatsheet-v1.md`

**Existing repo anchors to reuse**

- `src/components/ui/*` (`Section`, `Card`, `StatusBadge`, `Panel`), `src/components/continuity/screen-state.tsx`.
- The ~700 lines of route-local CSS to remove: `src/app/internal/**/*.module.css`.

**Scope**

- Add `PageHeader` (DS): eyebrow + title + optional back-link + optional status row. Replaces `.intro/.eyebrow/.title/.helperText` across the internal pages.
- Add `DescriptionList` (DS): a key/value list where each value can be text, a `StatusBadge`, a `Link`, or a `Flag`. Replaces `.detailList/.detailRow/.detailLabel/.detailValue`.
- Add `ActivityList` (DS): a list of entries with a `PersonSummary`-style header + body + timestamp. Replaces `.notesList/.noteEntry/.recentList/.recentRow`.
- Rebuild `src/app/internal/page.tsx` (hub) on `PageHeader` + the existing queue cards; source counts/labels from the copy map. Reserve a card slot per capability group so `P2-ADMIN-NAV-001` and later queues attach without restructuring.
- Update `component-inventory-v1.md` (and `tokens-cheatsheet-v1.md` if tokens change) in the same commit.

**Out of scope**

- rebuilding moderation/user-detail pages (that's `004`/`005`, which consume these primitives); any new tokens beyond what the three primitives need.

**Acceptance criteria**

- `PageHeader`, `DescriptionList`, `ActivityList` exist in `src/components/ui` (or `continuity`) and are documented in the inventory.
- The hub renders on them; `src/app/internal/internal-home.module.css` is reduced to genuine layout only (or removed).
- `pnpm lint:arch` passes; no forbidden route-local card/panel/list CSS remains on the hub.

**Verification**

- inventory diff review; visual check of the hub; `lint:arch` clean.

### 4.3 `P2-OPSFIX-003` Plain-language copy map

**Status:** `ready` · **Priority:** `P1` · **Depends on:** —

**Goal**

One place that maps every technical token an operator could see to plain language, consumed by the view-model boundary.

**Existing repo anchors to reuse**

- `src/modules/admin/constants.ts` (case kinds/statuses), `src/modules/accounts/constants.ts` (account/role statuses), `src/modules/tutors/constants.ts` (listing/application statuses), `src/modules/reviews/constants.ts` (review statuses), `src/modules/admin/actions.ts` (`ADMIN_ACTION_KEYS`).

**Scope**

- A copy module (e.g., `src/modules/admin/labels.ts`) exporting label + tone maps for: `action_key` → verb phrases ("Approved tutor application", "Revoked admin role", "Delisted public profile"), `case_kind`/`subject_kind`/`involvement` → plain nouns, and every status enum in `P2-OPSFIX-001`'s list → `{ label, tone }`.
- Statuses currently defined inline per page are centralized here; pages stop redefining them.
- An exhaustiveness guard (a `satisfies Record<EnumType, …>`) so adding a new enum value forces a label.

**Out of scope**

- copy for non-admin surfaces; i18n/localization.

**Acceptance criteria**

- Every enum/`action_key` in scope has a label (compile-time exhaustive). No admin page defines its own label map after this lands.
- `pnpm typecheck` fails if a new enum value lacks a label.

**Verification**

- grep confirms the per-page label maps in moderation/user-detail are removed in `004`/`005` and replaced by this module.

### 4.4 `P2-OPSFIX-004` Moderation queue + detail rebuild

**Status:** `ready` · **Priority:** `P1` · **Depends on:** `P2-OPSFIX-001/002/003`

**Goal**

Make the moderation surfaces decide-at-a-glance: a queue row says who/what/how-urgent/how-old; the detail page leads with the subject as a person.

**Existing repo anchors to reuse**

- `src/app/internal/moderation/page.tsx`, `moderation/[caseId]/page.tsx` (rebuild).
- `src/components/continuity` `PersonSummary` (operational variant), `ScreenState`.
- `src/modules/messages/access.ts` block reads (already surfaced via `loadBlocksInvolvingSubject`).

**Scope**

- Queue rows: `PersonSummary` (subject avatar + name + user/tutor descriptor), a `StatusBadge`, an age/priority chip, the case kind as a chip, and a one-line reason snippet. Row title is the **subject**, not the case kind.
- Detail page: lead with a subject `PersonSummary` card (avatar, name, link to public profile / user detail); a `DescriptionList` for the few real attributes; evidence block; notes via `ActivityList`. Render blocks as `PersonSummary` pairs ("X blocked Y"), never UUID arrows. "Public profile" is a real `Link`. Move ids behind a disclosure.
- Delete `moderation.module.css` patterns now owned by the DS; keep only the two-column grid if still needed.

**Out of scope**

- new case actions or kinds; the dispute view (`006`); review moderation (`P2-ADMIN-TRUST-001`).

**Acceptance criteria**

- Zero raw UUIDs/enums on either page; all people via `PersonSummary`; "Public profile" links; ids behind a disclosure.
- `pnpm lint:arch` clean; screenshots reviewed.

**Verification**

- non-admin → 404 on both routes; DTO-leak inspection; screenshot review.

### 4.5 `P2-OPSFIX-005` User-detail rebuild

**Status:** `ready` · **Priority:** `P1` · **Depends on:** `P2-OPSFIX-001/002/003`

**Goal**

Turn the raw-identifier user-detail dump into a legible person view that shows what the public sees for tutors.

**Existing repo anchors to reuse**

- `src/app/internal/users/[id]/page.tsx` (rebuild), `src/modules/admin/user-detail-repository.ts`.

**Scope**

- Header: `PersonSummary` (header variant) — avatar, name, account-status `StatusBadge`, joined date.
- Account/roles/tutor/finance panels: `DescriptionList` with humanized statuses (`StatusBadge` + tone), country via `Flag`, public profile via `Link`. Drop "App user id" / "Tutor profile id" as visible rows.
- For an approved tutor, show the profile photo + headline (operator sees the public view).
- Recent cases / admin actions: `ActivityList` with friendly action-key labels and actor `PersonSummary`; "Unknown operator" when name missing (never an actor UUID).
- Delete `user-detail.module.css` patterns now owned by the DS.

**Out of scope**

- the directories that link here (`P2-ADMIN-PEOPLE-001`); the tutor lessons/earnings panels (`P2-ADMIN-PEOPLE-002`) — leave anchors for them.

**Acceptance criteria**

- Zero raw UUIDs/enums; avatar present; tutor photo shown for approved tutors; friendly audit labels.
- `pnpm lint:arch` clean; screenshots reviewed.

**Verification**

- non-admin → 404; DTO-leak inspection; screenshot review.

### 4.6 `P2-OPSFIX-006a` Reference-data + policy-notice DS/copy pass

**Status:** `ready` · **Priority:** `P2` · **Depends on:** `P2-OPSFIX-002/003`

**Goal**

Bring the already-working reference-data and policy-notice surfaces onto the shared chrome and plain copy.

**Existing repo anchors to reuse**

- `src/app/internal/reference-data/**`, `src/modules/reference/admin/**`, `src/modules/admin/policy-notice-service.ts`.

**Scope**

- Adopt `PageHeader`/`DescriptionList`; replace jargon labels with the editable-field names from `phase2-task-pack-v1.md` §11.11; confirm no slug/key/id is shown as editable.
- Delete `reference-data.module.css` patterns now owned by the DS.

**Out of scope**

- changing what is editable (the §11.11 lockdown stands); policy text authoring (stays code-managed).

**Acceptance criteria**

- Both surfaces use the shared chrome and copy map; `pnpm lint:arch` clean.

**Verification**

- screenshot review; confirm the editable allowlist is unchanged.

### 4.7 `P2-OPSFIX-006` Build the missing `/internal/disputes`

**Status:** `ready` · **Priority:** `P1` · **Depends on:** `P2-OPSFIX-001/002/003`, `P1-LESS-002`

**Goal**

Actually build the lesson-issue dispute surface that `P2-DISPUTE-001` claimed. Reuse the shared case infra; do not introduce a parallel table.

**Required source docs**

- `docs/data/lesson-issue-and-dispute-model-v1.md`; `docs/data/tutor-reliability-thresholds-v1.md`
- `phase2-task-pack-v1.md` §11.12 (the detailed dispute scope — binding)

**Existing repo anchors to reuse**

- `src/modules/lessons/schema.ts` `lessonIssueCases` (`case_status` incl. `under_review`), `src/modules/lessons/constants.ts` `lessonIssueResolutionOutcomes` (the 7 outcome values).
- `src/modules/lessons/lesson-actions.ts:614` (the refund call to extract into `processLessonRefund`).
- `src/modules/admin/moderation-case-service.ts` `resolveCase` (extend with a per-`case_kind` resolution validator, do not fork).
- `P2-OPSFIX-004`'s `/internal/moderation/[caseId]` composition + `PersonSummary` rows.

**Scope**

- Create `/internal/disputes` — a view over lesson-issue cases in `under_review`, using the DS chrome and `PersonSummary` queue rows. Side-by-side participant claims on the detail.
- Resolution actions mapped from `lessonIssueResolutionOutcomes` to consequences (refund / payout-release / reliability event) exactly per §11.12; write the abstract `moderation_cases.resolution_kind` for queue sorting plus the lesson-specific `lessonIssueCases.resolution_outcome` in one transaction.
- New `tutor_reliability_events` table (write path only) per §11.12; aggregate/tutor display is out of scope.
- `lesson_issue_resolution` notification (mandatory) to both participants; `admin_action_logs` row per resolution.
- Add the dispute card to the hub and the Trust & Safety section.

**Out of scope**

- auto-resolved disputes; a tutor-facing reliability score; a parallel dispute table; changing reliability thresholds.

**Acceptance criteria**

- `/internal/disputes` renders for an admin and 404s for a non-admin (this is the verification that was skipped before).
- Resolution drives the correct refund/payout/reliability consequences and writes both the abstract and lesson-specific resolution fields atomically.
- `pnpm lint`, `typecheck`, `build`, `lint:arch`, `test` pass.

**Verification**

- consequence-correctness review vs the lesson-issue model; the route-renders + 404 check explicitly.

---

## 5. P2-ADMIN-* — Capability Expansion

### 5.1 `P2-ADMIN-NAV-001` Two-level header navigation

**Status:** `ready` · **Priority:** `P1` · **Depends on:** `P2-OPSFIX-002`

**Goal**

Adopt the two-level header model (capability-map §3) so the surface scales without a sidebar and without overflowing the header.

**Existing repo anchors to reuse**

- `src/lib/routing/navigation.ts` `navigationByFamily.internal`; `src/components/shell/app-frame-nav.tsx` (header nav with `isGroupStart` + "More" overflow); the hub card pattern.

**Scope**

- Reduce the internal header to the **7 group** entries (Overview · People · Applications · Trust & Safety · Support · Finance · Configuration), each pointing at its section landing route. Groups with a single leaf (Applications → `/internal/tutor-reviews`, Support → `/internal/support`) point straight at the leaf.
- Build card-list section landing pages for the multi-leaf groups (`/internal/people`, `/internal/trust`, `/internal/finance`, `/internal/configuration`) using `PageHeader` + queue/section cards.
- Keep `AvatarMenu` unchanged.

**Out of scope**

- a sidebar; per-capability role gating (still a later refactor — all groups visible to any admin for now).

**Acceptance criteria**

- The internal header shows 7 group entries, not leaf routes; section pages reveal leaves via cards; small-screen overflow works.
- `pnpm lint:arch` clean.

**Verification**

- nav render at desktop + mobile widths; every leaf reachable in ≤2 clicks.

### 5.2 `P2-ADMIN-PEOPLE-001` Directories + manage

**Status:** `ready` · **Priority:** `P1` · **Depends on:** `P2-OPSFIX-001/002/005`, `P2-ADMIN-NAV-001`

**Goal**

Give operators a way to find and manage students, tutors, and admins — including the discoverable entry point for promoting a user to admin (which already works but is currently link-only).

**Required source docs**

- `docs/architecture/admin-and-moderation-architecture-v1.md` §18 (controlled lookup — directories are the reviewed relaxation per capability-map B-3)
- `docs/data/data-subject-request-workflow-v1.md` (the "remove" path)

**Existing repo anchors to reuse**

- `src/modules/accounts/profile-settings.ts` (`full_name` update path — wrap with an admin actor for edit-name).
- `src/modules/admin/role-management-service.ts` (`grantAdminRole`/`revokeAdminRole`), `account-status-service.ts` (`setAccountStatus`).
- `src/app/internal/users/[id]/page.tsx` (shared detail target).

**Scope**

- `/internal/students` and `/internal/tutors` directories: paginated, name/email search, role-filtered, `PersonSummary` rows linking to `/internal/users/[id]`. Tutors directory also filters by listing/application status.
- `/internal/admins`: list current admins (active `admin` rows) with a "Promote a user" entry (search → grant) and revoke (reusing the existing guarded actions).
- New admin action `adminUpdateDisplayName(targetUserId, name, reason)` wrapping the existing profile update with admin actor + audit row.
- "Remove from platform" routes through the DSR/erasure flow (`P2-DSR-001`), not a raw delete; until DSR ships, the button is disabled with an explanatory note (do not implement a raw delete).

**Out of scope**

- raw delete; bulk operations; a unified cross-role search box on the global header (directories are per-section).

**Acceptance criteria**

- Directories are admin-only, paginated, searchable; every row uses `PersonSummary`; promote/revoke reachable from `/internal/admins`.
- `adminUpdateDisplayName` writes an audit row; "remove" is wired to DSR or safely disabled.
- `pnpm lint:arch` clean.

**Verification**

- non-admin → 404; audit coverage for edit-name and role changes; screenshot review.

### 5.3 `P2-ADMIN-PEOPLE-002` Tutor detail enrichment

**Status:** `ready` · **Priority:** `P1` · **Depends on:** `P2-OPSFIX-005`, `P2-ADMIN-PEOPLE-001`

**Goal**

On the person detail for a tutor, show the full operating picture: lifecycle history, lessons delivered, rating/reviews, and earnings.

**Existing repo anchors to reuse**

- `src/modules/tutors/application-review-repository.ts` + `admin_action_logs` (lifecycle events).
- `src/modules/lessons/tutor-lessons.ts` (`getTutorLessonList` — add an admin-scoped read), `src/modules/reviews/*` (rating + published reviews), `src/modules/payouts/service.ts` `TutorEarningsDto`.

**Scope**

- Add to `/internal/users/[id]` (tutor branch) four panels: a **lifecycle timeline** (application submitted → review events → status/listing changes, merged from `tutor_application_reviews` + `admin_action_logs`) via `ActivityList`; a **lessons** list (admin-scoped read of the tutor's lessons); a **rating/reviews** panel (incl. moderation state); an **earnings** panel reusing `TutorEarningsDto` (gross until `P2-ADMIN-FIN-000`, then net + commission).
- Admin-scoped read helpers in the admin module that compose the above as D7 DTOs (no raw rows in the page).

**Out of scope**

- commission paid (until `FIN-000` capture lands — show a "pending revenue model" placeholder in the earnings panel); editing any tutor content.

**Acceptance criteria**

- Tutor detail shows the four panels with display-ready data; no raw rows in the page; reviews show moderation state.
- `pnpm lint:arch` clean.

**Verification**

- DTO-leak inspection; screenshot review with a seeded tutor that has lessons + reviews + earnings.

### 5.4 `P2-ADMIN-TRUST-001` Tutor-review moderation

**Status:** `ready` · **Priority:** `P2` · **Depends on:** `P2-OPSFIX-004`

**Goal**

Let operators hide or redact a published tutor review that contains inappropriate language, and let users report a review.

**Existing repo anchors to reuse**

- `src/modules/reviews/schema.ts` (`review_status` incl. `hidden`/`rejected`, `moderation_note`), `src/modules/reviews/service.ts`, `src/modules/reviews/constants.ts` (`reviewStatuses`).
- `src/modules/admin/audit-service.ts`; `src/modules/admin/moderation-case-service.ts` (new `case_kind = 'review'`).

**Scope**

- `/internal/reviews` queue: published reviews flagged or reported, with the review text, tutor, author (anonymized per the review trust model), and a `StatusBadge`.
- Admin action `setReviewModerationStatus(reviewId, status, moderationNote, reason)` flipping `review_status` to `hidden`/`rejected` with a required note; writes `admin_action_logs`; revalidates the tutor's public profile so a hidden review disappears.
- Product-side "Report this review" entry (minimal: confirm dialog + Server Action) opening a `case_kind = 'review'` moderation case.
- A new `ADMIN_ACTION_KEYS` entry `review.set_status`.

**Out of scope**

- auto-moderation / profanity detection; editing review text; changing review eligibility or trust math.

**Acceptance criteria**

- A hidden/rejected review no longer renders on the public profile after revalidation; the action requires a note and writes an audit row.
- Reporting a review opens a moderation case visible in `/internal/moderation`.
- `pnpm lint:arch` clean.

**Verification**

- public-profile regression: hide a review → it disappears; audit coverage; DTO-leak inspection.

### 5.5 `P2-ADMIN-POLICY-001` Global policy-change acknowledgement banner

**Status:** `ready` · **Priority:** `P2` · **Depends on:** `P2-OPSFIX-002`

**Goal**

Surface a published policy change on-screen across the app, not only in the bell/inbox and `/privacy`. A user with an unacknowledged `requires_acknowledgement` notice sees a banner/modal on every page until they acknowledge.

**Existing repo anchors to reuse**

- `src/modules/notifications/legal-notices.ts` (`listLegalNoticesForAccount`, receipts), `policy_notice_versions` + `policy_notice_receipts` (incl. `requires_acknowledgement`, `firstShownAt`, `acknowledgedAt`), `createPolicyNoticeNotification`.
- `src/app/(account)/privacy/page.tsx` (the acknowledge action to reuse), `src/components/shell/app-frame.tsx` (where the banner mounts).

**Scope**

- A shell-level pending-notice surface mounted in `AppFrame` for signed-in viewers: when the viewer has an unacknowledged notice with `requires_acknowledgement = true`, render a dismissible-only-by-acknowledging banner (or modal) linking to the full policy and offering an acknowledge action. Mark `firstShownAt` on first render; clear on acknowledge.
- Reuse the existing acknowledge Server Action; do not duplicate receipt logic.
- DS-first: compose `InlineNotice`/`Panel`/`Button`; no route-local CSS.

**Out of scope**

- editing policy text; non-legal announcements; changing the notification/email fan-out (already exists).

**Acceptance criteria**

- After an admin publishes a `requires_acknowledgement` notice, a signed-in user sees the banner on any page until they acknowledge; it does not reappear afterward; `firstShownAt`/`acknowledgedAt` update.
- Mandatory notification + email behavior is unchanged.
- `pnpm lint:arch` clean.

**Verification**

- publish → load an unrelated page as a user → banner shows → acknowledge → banner gone on reload; receipts updated.

### 5.6 `P2-ADMIN-SUPPORT-001` Contact-us → support tickets

**Status:** `ready` · **Priority:** `P2` · **Depends on:** `P2-OPSFIX-001/002`, `P2-ADMIN-NAV-001`

**Goal**

A public contact-us form that always creates one internal support ticket, plus the operator queue to triage and reply.

**Required source docs**

- `docs/data/database-rls-boundaries-v1.md` (new table posture), `docs/data/migration-conventions-v1.md`
- email: the existing Resend integration

**Existing repo anchors to reuse**

- `src/modules/admin/audit-service.ts`; the Resend email path used by notifications; `requireInternalAdminAccount`.

**Scope**

- New `support_tickets` table: `id`, `requester_app_user_id` (nullable for logged-out), `requester_email`, `subject`, `body`, `channel` (`contact_form`), `status` (`open`/`in_progress`/`resolved`/`closed`), `assigned_to_app_user_id`, timestamps. RLS: admin-only read/write; inserts from the public form via a controlled server action (rate-limited).
- Public `/contact` form (logged-in or logged-out) → one ticket. Logged-out senders supply an email.
- `/internal/support` queue (status filters, oldest-first) + detail with reply (sends email via Resend) and status transitions. Each privileged action writes an `admin_action_logs` row.
- Add `support.*` action keys.

**Out of scope**

- in-app chat with users; SLA automation; multi-channel ingestion (email-in) — `contact_form` only this wave.

**Acceptance criteria**

- A contact-us submission creates exactly one ticket; the queue/detail are admin-only; replies email the requester; transitions are audited.
- `pnpm lint:arch` clean; RLS DB test (admin-only read/write; anon insert only via the controlled action).

**Verification**

- submit as logged-out + logged-in → tickets appear; reply email sent; non-admin → 404 on `/internal/support`.

### 5.7 `P2-ADMIN-ANALYTICS-001` Operational + marketplace-health dashboard

**Status:** `ready` · **Priority:** `P2` · **Depends on:** `P2-ADMIN-NAV-001`

**Goal**

An Overview dashboard with operational counts and marketplace-health metrics computed from the DB; behavioral funnels link out to PostHog. Includes a search-demand panel ("popular searches" + "unmet demand / zero-result searches") powered by a new DB search log — **decision B-2 resolved (2026-05-28): Option A, persist a `search_query_log`** (rather than querying PostHog, whose current events lack query text and result counts and whose server module is write-only).

**Required source docs**

- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md` (retention + logging posture for the new search log)
- `docs/data/database-rls-boundaries-v1.md`, `docs/data/migration-conventions-v1.md`
- capability-map §4.1

**Existing repo anchors to reuse**

- queue count loaders already on the hub; `tutor_profiles`, `lessons`/`bookings`, `app_users` for aggregates; `Flag` for country distribution.
- `src/app/(public)/tutors/public-tutor-search-experience.tsx` (the client search experience — the only place a search is performed; it already has the settled filters and Algolia `nbHits`).
- `src/lib/analytics/server.ts` (capture pattern; do **not** try to read PostHog back — it is write-only with the public ingest key).
- `src/modules/reference/discovery.ts` (to resolve slugs → labels for the popular-searches view).

**Scope**

Search logging (the B-2 build):

- New `search_query_log` table: `id uuid pk`, `searched_at timestamptz not null default now()`, `query_text text null` (null/empty for filter-only searches), `subject_slug text null`, `language_code text null`, `focus_area_slug text null`, `result_count integer not null` (enables zero-result/unmet-demand detection), `viewer_app_user_id uuid null references app_users(id) on delete set null` (null for logged-out searchers), `page integer not null default 0`. Index on `(searched_at)` and on `(result_count, searched_at)` for the unmet-demand query.
- RLS: **admin-only read**; no anon/auth read. Inserts only through a controlled server path (not a public table insert).
- New Server Action `recordSearchQuery({ queryText, subjectSlug, languageCode, focusAreaSlug, resultCount, page })` called from the search experience. **Debounce/settle:** log only a *settled* search (after the user stops typing / on a committed filter change with results resolved), never per keystroke — reuse the same settle point the client already uses to fire the PostHog `public_tutor_search_performed` event, and pass the Algolia `nbHits` as `result_count`. Rate-limit/guard against abuse.
- Retention: the log is operational analytics, not a durable record — prune rows older than 90 days (a scheduled job or a documented manual prune step), per the privacy architecture. Raw `query_text` is user-provided; the retention window + admin-only RLS is the posture. No PII beyond the query string is stored.

Dashboard:

- Operational cards: pending tutor reviews, open cases, open tickets, open disputes (live counts).
- Marketplace-health: active/listed tutors, new signups, lessons booked/completed per week, GMV (gross until `FIN-000`); country distribution (students + tutors) via `Flag`; tutor supply funnel (apply → approve → first lesson).
- **Search-demand panel** (now in scope): "popular searches" (top subject/language/focus-area facets + top non-empty `query_text` values over a window) and "unmet demand" (searches with `result_count = 0`, grouped by query/filters) — both from `search_query_log`, with slugs resolved to labels via `src/modules/reference/**`.
- Behavioral funnels (visit → search → booking → repeat) link out to PostHog rather than being rebuilt.

**Out of scope**

- rebuilding PostHog funnels in-product; predictive analytics; per-tutor scorecards (research item, later).
- logging searches from any surface other than the public tutor search (matching `/match`/`/results` stays internal/Postgres and is not part of demand logging this wave).

**Acceptance criteria**

- `search_query_log` exists with admin-only RLS; rows are written only via `recordSearchQuery` from a *settled* public search (not per keystroke), carrying the correct `result_count`.
- The dashboard renders operational + health metrics from the DB (GMV labeled gross until `FIN-000`), plus a working search-demand panel showing popular searches and zero-result/unmet-demand from the log.
- A retention prune (≤ 90 days) exists or is documented as a required manual/scheduled step.
- `pnpm lint`, `typecheck`, `build`, `lint:arch`, `test` pass; DB test covers `search_query_log` shape + RLS (admin read only; anon/auth denied).

**Verification**

- numbers reconcile against direct DB queries on a seeded dataset; perform a search on `/tutors` and confirm exactly one settled row (not one per keystroke) with the right `result_count`; a deliberately empty search surfaces in the unmet-demand panel.

**Required manual steps**

- if the retention prune is a scheduled job, wire it; otherwise document the manual prune cadence. No new environment variables.

### 5.8 `P2-ADMIN-FIN-000` Revenue-model build (commission %)

**Status:** `ready` · **Priority:** `P1` · **Depends on:** — (touches the booking/payout path)

**Goal**

Implement the decided revenue model — a single global commission percentage — and capture per-transaction fees so finance reporting becomes possible. This is the prerequisite for all platform finance and per-tutor commission views.

**Required source docs**

- `phase1-payment-scope-decision-v1.md`; the Stripe Connect setup docs; `docs/data/migration-conventions-v1.md`
- capability-map §2 B-1

**Existing repo anchors to reuse**

- `src/modules/lessons/booking.ts` (capture path; `price_amount`), `src/modules/payouts/service.ts`, the Stripe client wiring, `src/modules/admin/audit-service.ts`.

**Scope**

- New **platform commission setting**: a single global rate (0–100%, stored as basis points or a numeric with validation), in a new `platform_settings` (or `commission_settings`) table, editable from `/internal/configuration/commission`, admin-only, audited. No per-tutor/per-subject rate this wave.
- **Snapshot at transaction time:** when a booking is created/captured, record the `commission_rate` then in effect on the payment/booking row.
- **Per-transaction fee capture:** persist `gross_amount`, `commission_rate`, `platform_fee_amount` (= gross × rate), `stripe_fee_amount` (from the Stripe balance transaction), `tutor_net_amount`, `currency_code`.
- **Stripe wiring:** set `application_fee_amount` on the PaymentIntent (Connect) so the split happens at capture; read the Stripe fee from the balance transaction (webhook or retrieval).
- Migrations + Drizzle schema + a DB test for the new columns/table + RLS.

**Out of scope**

- per-tutor or tiered commission; promotions/coupons; refund-fee reconciliation edge cases beyond recording the captured fees; the dashboard itself (`FIN-001`).

**Acceptance criteria**

- The commission rate is admin-editable (0–100), audited, and snapshotted per transaction (changing it never alters past rows).
- New bookings capture `gross/commission_rate/platform_fee/stripe_fee/tutor_net`; the Stripe `application_fee_amount` matches the snapshot.
- `pnpm lint`, `typecheck`, `build`, `lint:arch`, `test` pass; DB test covers the new schema + RLS.

**Verification**

- a test booking through capture shows correct fee fields and a matching Stripe application fee; rate change does not rewrite historical rows.

**Required manual steps**

- confirm the Stripe Connect account/platform configuration supports `application_fee_amount` for the destination charge model in use; set the initial commission rate after migration.

### 5.9 `P2-ADMIN-FIN-001` Platform finance dashboard

**Status:** `ready` · **Priority:** `P1` · **Depends on:** `P2-ADMIN-FIN-000`, `P2-ADMIN-PEOPLE-002`

**Goal**

Surface platform revenue, Stripe fees, and payout oversight from the captured per-transaction data, plus per-tutor commission on the tutor detail.

**Existing repo anchors to reuse**

- the fee fields from `FIN-000`; `src/modules/payouts/service.ts`; `TutorEarningsDto`; DS chrome.

**Scope**

- `/internal/finance`: revenue (sum `platform_fee_amount`), Stripe fees paid (sum `stripe_fee_amount`), gross GMV, net to tutors, over selectable periods; currency-aware via `src/modules/pricing/**`.
- `/internal/finance/payouts`: payout oversight — who is owed, payout status per tutor, holds (reusing finance-intervention notes).
- Per-tutor "commission paid" panel on `P2-ADMIN-PEOPLE-002`'s tutor detail (sum of `platform_fee_amount` for that tutor's lessons).

**Out of scope**

- initiating payout runs or Stripe writes from this surface (oversight + intervention notes only); forecasting; tax reporting.

**Acceptance criteria**

- Revenue, Stripe fees, GMV, and net-to-tutor reconcile against the captured per-transaction fields; per-tutor commission appears on tutor detail.
- money formatting via `src/modules/pricing/**`; `pnpm lint:arch` clean.

**Verification**

- dashboard totals reconcile against direct sums over the fee columns on a seeded dataset.
