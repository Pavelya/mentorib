# Mentor IB Account Family Shape v1 — ADR

**Date:** 2026-05-26
**Status:** Accepted. Binding for every `(account)/**` route and for the notification-preference, notification-inbox, billing, and privacy implementations. Supersedes any per-route guidance in `docs/architecture/route-layout-implementation-map-v1.md` § 7.4 and § 9.4 that conflicts with the four jobs and role-gating rules below.
**Scope:** the information architecture of the four shared Account routes (`/settings`, `/notifications`, `/privacy`, `/billing`), what each route does, who it serves, where notification preferences live, and how role membership shapes each route's body.
**Source task:** `P2-SUX-001-21` (Phase 2 student UX task pack §5.21). Spec only — `P2-SUX-001-22` through `P2-SUX-001-27` implement against it.

## 1. Why this document exists

The Account family today mixes four very different concerns with no role gating and overlapping responsibilities:

- `/settings` renders a `Profile` Panel **plus** a `Notification preferences` Panel — the second Panel duplicates the surface that `/notifications` should own
- `/notifications` is a read-only inbox of past notifications; its name promises preference toggles, but the toggles live elsewhere
- `/privacy` tells the user up-front to read the policy "elsewhere", then renders four future-feature placeholder Cards advertising controls that ship in later phases. The route's actual job today is legal-notice acknowledgement, but that purpose is buried under operator metrics
- `/billing` is a student-only payment-history surface but renders identically to a tutor-only account, who sees an empty list with an `InlineNotice` explaining that tutor payouts live somewhere else

The notification-preference categories include `tutor_application_updates`, which is irrelevant to students, and `lesson_recaps`, which is described from the student perspective even when shown to a tutor. A pure tutor sees a "Tutor application updates" toggle long after their application is approved; a pure student sees "Lesson recaps" framed as if they were the recipient even though the description reads as if they were the author.

The user has asked for one decision before any code changes: what does each Account route do, who is it for, where do preferences live, and how does role membership change the UI.

This ADR is that decision.

## 2. The current drift (what we are replacing)

| Route | Current job(s) | Drift |
| --- | --- | --- |
| `/settings` | Profile + Notification preferences | Two unrelated concerns on one route; preferences duplicate `/notifications`' name |
| `/notifications` | Read-only inbox | Name promises preferences; toggles are not here |
| `/privacy` | Operator metrics + future-feature placeholders + legal-notice acknowledgement | Legal-notice purpose buried under metrics and "coming later" copy |
| `/billing` | Student payment history shown to every role | Tutor-only accounts hit an empty list + architectural disclaimers |

Symptoms in the user-facing product:

- a user looking for "how do I turn off lesson reminder emails?" lands on `/notifications` (correct mental model), finds no toggles, then has to discover them buried at the bottom of `/settings`
- a tutor-only account opening `/billing` sees three operator metric Cards with zeros, a `Scope guardrails` Panel, and a notice pointing them to `/tutor/earnings` — three architectural surfaces in place of one redirect
- a pure student sees `Tutor application updates` and `Reviews` toggles for events they will never receive
- `/privacy` opens with "See the public Privacy Policy and Terms for the canonical legal text" — pointing the user *away* from the surface that should host or link the canonical text

## 3. Decision

Four Account routes; one job each. Role-aware where the underlying data is role-specific. The nav rail and the avatar menu stay flat (every account can reach every route) — gating is applied to the page **body**, never to the entrance.

| Route | Job | Role gating |
| --- | --- | --- |
| `/settings` | Identity + cross-role preferences (name, photo, email, language, timezone). Single page, no embedded notification panel | Visible to every signed-in account |
| `/notifications` | Two-tab page — `Inbox` (the existing read-only notification list) + `Preferences` (toggles, moved out of `/settings`). Default tab is `Inbox` | Visible to every signed-in account. Each tab role-gates its own content |
| `/privacy` | Legal-notice acknowledgement + permanent links to the public Privacy Policy and Terms documents. No future-feature placeholders | Visible to every signed-in account |
| `/billing` | Student-side payment history only. Tutor-only accounts see a single-row redirect Panel pointing at `/tutor/earnings` instead of an empty history list | Conditional body — see § 4 |

This shape is owned at the route level; no new shared component is required. `(account)/layout.tsx` keeps the same shape it has today (the `AppFrame` consumer with the four-item nav rail).

## 4. Binding rules

These rules are binding on every `(account)/**` page. Subtasks `-22` through `-27` implement against them; reviewers reject any deviation that is not first ratified by amending this ADR.

1. **Notification preferences live on `/notifications`, not on `/settings`.** The `NotificationPreferencesForm` and its Server Action relocate from `src/app/(account)/settings/` to `src/app/(account)/notifications/`. The existing optimistic-toggle interaction is preserved verbatim — only the file location and the route that hosts it change.
2. **`/notifications` is a two-tab page.** Tabs: `Inbox` (default, `/notifications`) and `Preferences` (`/notifications?tab=preferences`). The TabBar is a DS `TabBar` in link mode, rendered directly under the canonical page intro. No third tab is added without amending this ADR.
3. **`/notifications` Inbox tab — role-aware labels, not role-gated rows.** The inbox already routes notifications to the right account via `account.id`, so a tutor never sees a student's row and vice versa. The role-awareness on the Inbox tab is purely a copy concern: the `lesson_report_shared` and `review_submitted` labels read differently for the side of the event the account is on. Implementation lands in `-23` / `-24`.
4. **`/notifications` Preferences tab — role-gated categories.** Categories whose audience does not match the account's roles are hidden:
   - `lesson_reminders` — audience `both`, always shown; description copy adapts per active role
   - `lesson_recaps` — audience `student`, shown only when `hasRole(account, "student")`
   - `reviews` — audience `tutor`, shown only when `hasRole(account, "tutor")` (active or pending)
   - `tutor_application_updates` — audience `tutor`, shown only when `hasRole(account, "tutor")` (active or pending)

   A dual-role account sees every category. Filtering is presentation-only — the underlying Server Action accepts the full category set so existing rows survive a role change. Audience metadata is a static lookup in `src/modules/notifications/constants.ts`; no DB column, no DTO, no migration.
5. **`/billing` body branches on `hasRole(account, "student")`.**
   - **Tutor-only** (`hasRole(account, "student") === false && hasRole(account, "tutor") === true`): the body is a single `Panel` titled "Tutor payouts live in Earnings" with one primary `Link` to `/tutor/earnings`. No payment history, no metric Cards, no `Scope guardrails` Panel, no `InlineNotice`.
   - **Student** or **dual-role** (`hasRole(account, "student") === true`): render the student payment history surface, with the simplified copy and metric labels covered in `-26`. A dual-role account sees a small `InlineNotice` at the top with a link to `/tutor/earnings` for their payout view; the architectural "shared route" badge row is dropped.
6. **`/privacy` is a legal-acknowledgement surface, not a metrics surface.** The body, top to bottom, is:
   1. canonical page intro (eyebrow + title + one-line description)
   2. the optional pending-legal-notice banner (already shared via `PendingLegalNotice`)
   3. the highlighted current-notice `Panel` with the `Open full document` + `Acknowledge and continue` actions, when a notice exists
   4. a `Policy documents` section with permanent links to `/privacy-policy`, `/terms`, and `/trust-and-safety` (the canonical legal text is **linkable from here**, not pointed at as living elsewhere)
   5. the published-history list

   The `Privacy surface scope` Panel, the `Current notice state` metric grid, and the `Deferred controls — ship in later phases` Card are all removed. A user-facing route does not advertise its own gaps.
7. **`/settings` is identity + cross-role preferences only.** After `-22` and `-27` the page reduces to one `Profile` Panel. The Panel's footer carries a single one-line text link "Manage notification preferences →" pointing at `/notifications?tab=preferences` for discoverability. No second Panel, no embedded toggle UI.
8. **Avatar menu and nav rail are flat.** The avatar menu continues to list all four Account routes; the `(account)/layout.tsx` nav rail continues to render the same four entries for every signed-in account. Role gating is body-level only. This keeps the avatar menu shape stable across users and keeps the architectural posture "every account can reach Billing (which then role-gates its own body)" intact.

## 5. Why preferences live on `/notifications`, not `/settings`

The user's mental model when they want to change a notification setting is "I want to change my notifications" — they reach for the route named `/notifications`. The current split (toggles on `/settings`, inbox on `/notifications`) forces them to discover the toggle UI in a panel buried at the bottom of a different route.

Co-locating the inbox and the preferences also keeps the route's job describable in one sentence ("see your notifications and manage which ones reach you") and removes the duplicated header surface — today `/settings` and `/notifications` both render the word "Notifications" in a section header for two different things.

The two-tab shape (`Inbox` / `Preferences`) was chosen over a single scrolling page because the inbox surface and the preferences surface have different interaction grammars (read-only timeline vs. optimistic toggle form) and different state (notification rows + status vs. preference snapshot). A tab boundary lets each surface own its own URL, its own intro, and its own loading state without one polluting the other.

## 6. Why `/billing` is role-aware but stays in the nav

The cheapest model would be "hide `/billing` from tutor-only accounts entirely". That model has two problems:

1. The avatar menu and the `(account)/layout.tsx` nav rail would then need to know the active role at render time and diff the menu structure across users. The shape of the menu becomes user-dependent, and any future Account route inherits the same divergence question.
2. A dual-role account would still need to see `/billing` (because they may also book lessons as a student), so the gating is already body-conditional. Keeping `/billing` reachable for tutor-only accounts and giving them a one-Panel redirect is simpler than maintaining two menu shapes.

Body-level gating wins on every axis except "tutor sees an entry they will never enter twice" — and the cost of that entry is one click into a Panel that contains a single link to `/tutor/earnings`, which is a non-cost relative to the alternative.

## 7. Why `/privacy` hosts the policy links

The current `/privacy` opens with "See the public Privacy Policy and Terms for the canonical legal text." — pointing the user *away* from the surface they just landed on. The user reading that sentence is then expected to remember where the public policy URLs live and navigate there manually.

The canonical text already lives at `/privacy-policy`, `/terms`, and `/trust-and-safety` (rendered by the public family). The right behaviour is to **link those URLs from `/privacy`**, not to announce that they exist elsewhere. The `Policy documents` section in § 4.6 above is exactly that — three DS secondary-button links to the canonical pages.

The legal-notice acknowledgement Panel (the route's actual MVP job) stays as it is. The `Published legal notice history` Panel below stays because the history is genuinely useful — it gives the user a way back into a notice they already acknowledged.

## 8. Why role gating is body-level, not nav-level

The avatar menu and the `(account)/layout.tsx` nav rail are visited dozens of times across a session; their structure is part of the user's spatial memory. A menu that flips items in and out depending on role mix is a menu that the user has to re-learn every time they switch test accounts (or every time their role mix changes — student-applying-as-tutor is a real flow).

Body-level gating keeps the entrance points stable and applies the rule only at the moment the page renders. The cost is one extra `Panel` for a tutor-only account on `/billing` and a slightly narrower toggle set on `/notifications?tab=preferences` — both well within the route's existing rendering envelope.

The same principle is already used in the avatar-menu ADR (`docs/architecture/app-header-shape-v1.md` § 4.7): every account can reach every Account route; the body, not the menu, applies role gating. This ADR is consistent with that decision.

## 9. Implementation handoff

This ADR is the spec. The implementation lands in six subtasks, in order:

| Subtask | Lands |
| --- | --- |
| `P2-SUX-001-22` | Consolidate notification preferences into `/notifications` as a two-tab page (`Inbox` / `Preferences`). Move `NotificationPreferencesForm` and its Server Action from `(account)/settings/` to `(account)/notifications/`. Delete the duplicate Panel on `/settings`. |
| `P2-SUX-001-23` | Role-gate notification categories. Add `NOTIFICATION_CATEGORY_AUDIENCE` lookup; filter `notificationCategories` by `hasRole`; adapt the `lesson_reminders` description per role; switch the `lesson_report_shared` and `review_submitted` Inbox labels per role. |
| `P2-SUX-001-24` | Copy + IA pass on `/notifications`. Delete the `Product inbox only` InlineNotice, the `Channel rule` Panel, the `Notification summary` metric grid, and the `Latest product updates` wrapper Panel. One `StatusBadge` per row (the type); unread state moves to a Card treatment. |
| `P2-SUX-001-25` | Copy + IA pass on `/privacy`. Delete the `Privacy surface scope` Panel and the `Current notice state` metric grid; add the `Policy documents` link section; trim operator copy. |
| `P2-SUX-001-26` | Role-gate + simplify `/billing`. Branch on `hasRole(account, "student")`; tutor-only body becomes a single Earnings-redirect Panel; rename metric labels to user-shaped vocabulary. |
| `P2-SUX-001-27` | `/settings` profile cleanup. Rename the language Section eyebrow to `Lesson language` with a per-role description; add helper text to the Email and Timezone Sections; add the `Manage notification preferences →` link below the form. |

The four routes' jobs in § 3 and the role-gating rules in § 4 are binding on every subtask. Any change to the route inventory, the tab structure on `/notifications`, the audience lookup on a notification category, or the conditional body on `/billing` must amend this ADR first.

## 10. Out of scope for this ADR

The following decisions are intentionally not made here. Any subtask that needs them must escalate and amend this ADR first.

- Delete-account, data-export, or other "advanced privacy" features — future-phase work. The `/privacy` surface stops admitting that gap, but does not start delivering it.
- Password change, 2FA setup, or session-management on `/settings` — separate phase.
- Manual timezone selector on `/settings` — separate decision; the current detection model is the binding interaction.
- Moving any Account route under `(student)/**` or `tutor/**` — the IA stays at the root group `(account)/**`.
- Adding new notification categories or types — `notificationCategories` is the binding set for this ADR.
- A global "Save all" pattern on the preferences form — the optimistic-per-toggle interaction is the binding model.
- Notification badges / unread counts on the avatar menu or the nav rail — escalate before adding.

## 11. Supersedes

This ADR is the canonical reference for the Account-family IA. Where it conflicts with prior documents, this ADR wins:

- `docs/architecture/route-layout-implementation-map-v1.md` § 7.4 and § 9.4 — the per-route examples and the "settings and account-support chrome" phrasing must be read through this ADR's four-jobs decision. That map is updated in the same commit to point here.
- Any per-route guidance in `docs/design-system/component-specs-core-v1.md` and `docs/design-system/component-specs-phase2-v1.md` that predates this ADR is overridden where it conflicts; the binding rules in § 4 above apply.

## 12. Related documents

- `docs/architecture/app-header-shape-v1.md` § 4.7 (avatar menu items are the four Account routes plus `Sign out`; account family has no bottom dock of its own).
- `docs/design-system/agent-ui-rules.md` § 7 (copy discipline), § 8 (consistency checklist).
- `docs/design-system/component-inventory-v1.md` § 4.2 (Account-family IA summary — the in-inventory mirror of this ADR).
- `docs/architecture/route-layout-implementation-map-v1.md` § 7.4 and § 9.4 (shared account route family and layout responsibilities).
- `docs/architecture/canonical-value-ownership-map-v1.md` (shared account vocabularies; notification-category audience metadata lives in `src/modules/notifications/constants.ts`).
- `src/modules/accounts/account-state.ts` (`hasRole`, the canonical role-membership check).
- `src/modules/notifications/constants.ts` (`notificationCategories`, `NOTIFICATION_TYPE_TO_CATEGORY`, and — after `-23` — `NOTIFICATION_CATEGORY_AUDIENCE`).
- `docs/planning/phase2-student-ux-task-pack-v1.md` §§ 5.21–5.27 (this ADR and its six implementation subtasks).
