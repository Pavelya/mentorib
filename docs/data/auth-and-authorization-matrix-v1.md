# Mentor IB Auth And Authorization Matrix v1

**Date:** 2026-04-08
**Status:** Standalone access-control matrix for identity resolution, role capability, route families, data surfaces, and RLS posture
**Scope:** auth chain, session states, actor classes, route access, table-family access, storage/realtime boundaries, and implementation rules for AI agents

## 1. Why This Document Exists

This document defines who can access what in Mentor IB.

It exists now because the approved product already has:

- shared student and tutor objects
- one account system with multiple role capabilities
- public, private, and internal-only surfaces
- RLS-sensitive Supabase access paths
- messaging, lessons, trust, moderation, and payout-related data

Without an explicit matrix, teams usually drift into:

- route protection that does not match data protection
- RLS policies that do not match business rules
- duplicated auth checks in random components
- AI agents inventing inconsistent access patterns per feature

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it is the data-access contract for the system.

It inherits from the security and architecture decisions, but its main job is to connect:

- identity objects
- role capability
- route families
- table families
- RLS boundaries

That makes it a direct companion to:

- `docs/data/database-schema-outline-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/data/database-schema-outline-v1.md`

It inherits from those documents and turns them into an access matrix.

It does not define:

- exact SQL policy text
- exact middleware code
- exact route file names
- final DTO implementations

Those should come later in implementation-facing artifacts.

## 4. Core Recommendation

Mentor IB should use a four-layer access model:

1. identity and session resolution through `Supabase Auth`
2. route and shell gating in the Next.js server layer
3. domain authorization in server-owned application logic
4. RLS on any table, view, or realtime path that can be accessed with user JWTs

The practical rule is:

- auth answers who the person is
- route gating answers which product area they may enter
- domain authorization answers whether they may act on a specific object
- RLS provides defense in depth for exposed data paths

## 5. Identity Chain

The canonical identity chain is:

1. `auth.users`
2. `app_users`
3. `user_roles`
4. optional profile rows such as `student_profiles` and `tutor_profiles`

The key rule is:

- one authenticated human resolves to one canonical `app_user`

Google sign-in and magic-link sign-in both converge through the same chain.

## 6. Authentication States

These auth and account states matter operationally.

## 6.1 `unauthenticated`

Meaning:

- no valid session

Allowed:

- public routes
- auth entry routes

Blocked:

- all private student, tutor, and admin surfaces

## 6.2 `authenticated_role_pending`

Meaning:

- valid account exists
- `app_user` exists
- no active student or tutor role has been chosen yet

Allowed:

- role chooser
- limited onboarding steps
- account settings

Blocked:

- student workflow routes
- tutor workflow routes

## 6.3 `student_active`

Meaning:

- user has active student capability

Allowed:

- student private surfaces
- public surfaces

Blocked:

- tutor operational surfaces unless the same account also has tutor capability

## 6.4 `tutor_pending_review`

Meaning:

- tutor role exists or tutor application exists, but listing and operational access are still limited

Allowed:

- tutor application and limited tutor setup surfaces
- public surfaces

Blocked:

- full tutor operational workflow until approval state allows it

## 6.5 `tutor_active`

Meaning:

- tutor role is active and operationally allowed

Allowed:

- tutor private surfaces
- public surfaces

Blocked:

- internal admin surfaces unless separately granted

## 6.6 `limited`

Meaning:

- account is temporarily restricted

Examples:

- messaging blocked
- listing hidden
- payout hold

Rule:

- limitation must be object- or capability-specific, not an ambiguous blob

## 6.7 `suspended`

Meaning:

- account or role is blocked from normal product use

Rule:

- suspend access narrowly where possible
- preserve the ability for internal teams to inspect the account and case history

## 7. Actor Classes

The authorization matrix should think in actor classes, not just route names.

## 7.1 Public visitor

- any non-authenticated visitor

## 7.2 Authenticated self

- signed-in person acting on their own account or profile

## 7.3 Student actor

- signed-in person exercising student capability

## 7.4 Tutor actor

- signed-in person exercising tutor capability

## 7.5 Dual-role actor

- one account with both student and tutor capability

Rule:

- access should switch by context, not by pretending the user is a separate person

## 7.6 Admin actor

- privileged internal actor with broad operational access

Rule:

- MVP uses only the `admin` role for internal operations
- trust, review, and payout actions should still be capability-scoped inside admin tooling

## 8. Route-Family Authorization Matrix

Route protection should be reasoned by route family, not page-by-page improvisation.

## 8.1 Public routes

Examples:

- `/`
- `/how-it-works`
- `/trust-and-safety`
- `/support`
- `/become-a-tutor`
- `/tutors/[slug]`

Access:

- public visitor: allowed
- authenticated self: allowed
- student: allowed
- tutor: allowed
- admin: allowed

Rule:

- these routes may use public-safe DTOs only

## 8.2 Auth entry and callback routes

Examples:

- sign-in
- magic-link completion
- OAuth callback

Access:

- public visitor: allowed where needed
- signed-in user: usually redirect away after resolution

Rule:

- these routes resolve identity but must not leak role-specific private data by default

## 8.3 Role chooser and onboarding bootstrap

Examples:

- role selection
- student setup starter
- tutor apply entry

Access:

- `authenticated_role_pending`: allowed
- active users: usually redirect if already resolved

## 8.4 Student private routes

Examples:

- `/match`
- `/results`
- `/book/...`
- `/messages`
- `/lessons`

Access:

- student actor: allowed
- dual-role actor in student context: allowed
- tutor-only actor: blocked unless switching context into valid student capability

Rule:

- route entry is not enough
- object-level checks still apply inside the route

## 8.5 Tutor private routes

Examples:

- `/tutor/overview`
- `/tutor/lessons`
- `/tutor/schedule`
- `/tutor/messages`
- later `/tutor/students`

Access:

- active tutor actor: allowed
- tutor pending review: limited to allowed setup/application steps only
- student-only actor: blocked

## 8.6 Internal admin routes

Examples:

- internal approval queues
- moderation dashboards
- internal payout or operations pages

Access:

- admin: allowed where explicitly granted
- all public and normal product actors: blocked

## 9. Authorization Layer Responsibilities

## 9.1 Middleware and shell gating

Use lightweight checks for:

- redirecting unauthenticated users
- redirecting users away from invalid route families
- handling obvious role mismatch

Do not treat middleware as the only security layer.

## 9.2 Server-domain authorization

Use server-owned domain checks for:

- lesson access
- booking creation
- match retrieval
- tutor profile editing
- moderation actions
- payout-affecting mutations

This is the primary business-rule layer.

## 9.3 RLS layer

Use RLS wherever user-authenticated browser or realtime paths can touch data.

RLS should be considered mandatory for:

- tables in exposed schemas
- views in exposed schemas
- realtime-backed private channels
- storage paths relying on user JWT identity

## 10. Table-Family Access Matrix

This is the canonical access matrix for the major table families.

## 10.1 Identity tables

### `app_users`

Read:

- self: own row only
- admin: allowed

Write:

- self-service limited profile/account updates through server-owned mutation paths
- internal elevated writes by admin systems where justified

Direct client exposure:

- minimal

RLS posture:

- enabled if exposed
- self-row only by default

### `user_roles`

Read:

- self: allowed to inspect own active capabilities
- admin: allowed

Write:

- internal only

Rule:

- users do not self-grant roles by writing this table directly

## 10.2 Student data tables

### `student_profiles`

Read:

- owning student: allowed
- admin: allowed
- tutor: only through explicit lesson-, conversation-, or roster-shaped DTOs, not broad raw profile reads

Write:

- owning student through server-owned mutation paths
- admin where necessary

### `learning_needs`

Read:

- owning student: allowed
- admin: allowed
- tutor: not by default as raw rows

Tutor visibility rule:

- tutors should see only the need context intentionally surfaced through match, booking, lesson, or conversation objects

Write:

- owning student creates and updates their own needs
- admin can inspect or intervene if required

### `match_runs`

Read:

- owning student: allowed
- admin: allowed
- tutor: not directly

Write:

- system/server only

### `match_candidates`

Read:

- owning student: allowed
- admin: allowed
- tutor: only if the candidate becomes part of an authorized downstream interaction such as booking or lesson context

Write:

- system/server only, except student-controlled shortlist/dismiss actions through controlled mutation paths

## 10.3 Tutor data tables

### `tutor_profiles`

Read:

- public routes: public-safe projection only
- owning tutor: full owner edit view
- admin: full

Write:

- owning tutor through controlled mutation paths
- admin for approval/listing interventions

### `tutor_subject_capabilities`

Read:

- public-safe shaped read where listable
- owner and admin full read

Write:

- owning tutor
- admin if needed

### `tutor_language_capabilities`

Read:

- public-safe shaped read where listable
- owner and admin full read

Write:

- owning tutor
- admin if needed

### `tutor_credentials`

Read:

- owning tutor: limited own-evidence view
- admin: full
- public: never

Write:

- owning tutor uploads and manages own evidence through server-owned flows
- admin review status changes only through internal tools

Direct client exposure:

- avoid broad direct exposure

## 10.4 Scheduling and availability tables

### `schedule_policies`

Read:

- owning tutor: full
- student/public: only shaped scheduling outputs, never raw policy internals
- admin: allowed

Write:

- owning tutor
- admin where needed

### `availability_rules`

Read:

- owning tutor: full
- public/student: shaped slot availability only, not raw recurring-rule tables
- admin: allowed

Write:

- owning tutor
- admin where needed

### `availability_overrides`

Read:

- owning tutor: full
- public/student: no raw access
- admin: allowed

Write:

- owning tutor
- admin where needed

## 10.5 Lesson tables

### `lessons`

Read:

- lesson student: allowed
- lesson tutor: allowed
- admin: allowed

Write:

- server-owned domain mutations only

Rule:

- participants do not directly patch raw lesson rows from the browser

### `lesson_status_history`

Read:

- lesson participants: shaped history as relevant
- admin: allowed

Write:

- system/server only

### `lesson_meeting_access`

Read:

- lesson participants: allowed
- admin: allowed

Write:

- tutor or system through controlled lesson-domain mutations
- admin where operationally necessary

### `lesson_reports`

Read:

- lesson tutor: full owner access
- lesson student: only if the report is intentionally shared
- admin: allowed

Write:

- lesson tutor through controlled mutation paths

## 10.6 Messaging tables

### `conversations`

Read:

- conversation participants: allowed
- admin: allowed through internal tools

Write:

- server-owned creation and status mutation

### `conversation_participants`

Read:

- conversation participants: allowed as needed
- admin: allowed

Write:

- system/server only except participant preference updates through controlled mutation paths

### `messages`

Read:

- conversation participants: allowed
- admin: internal tools only

Write:

- conversation participants through controlled server-owned send paths

### `message_reads`

Read:

- self and internal tools

Write:

- participant or system through controlled paths

### `user_blocks`

Read:

- blocker self
- blocked user only where product behavior explicitly requires disclosure
- admin as needed

Write:

- self-service block action
- admin interventions where justified

### `abuse_reports`

Read:

- reporter: limited own-case visibility if product exposes it
- admin: full internal view
- reported user: not by default

Write:

- reporting actor through server-owned report flow
- admin through case management

## 10.7 Trust and review tables

### `reviews`

Read:

- public: published public-safe review projection
- owning student reviewer: own draft/submitted view
- reviewed tutor: public and owner-appropriate trust view
- admin: full

Write:

- eligible student reviewer through lesson-linked review flow
- admin for review status changes

### `tutor_reliability_events`

Read:

- internal only by default
- public exposure only through derived trust surfaces

Write:

- system/server only
- admin where operational correction is justified

## 10.8 Notification and async tables

### `notifications`

Read:

- owner only
- admin for support/internal inspection if justified

Write:

- system/server only

### `notification_deliveries`

Read:

- internal only

Write:

- system/server only

### `job_runs`

Read:

- internal only

Write:

- system/server only

### `webhook_events`

Read:

- internal only

Write:

- system/server only

## 10.9 Payment and earnings tables

### `payments`

Read:

- payer via shaped billing history if exposed
- admin: full

Write:

- system/server only

### `earnings`

Read:

- owning tutor: allowed through shaped earnings views
- admin: full

Write:

- system/server only

## 10.10 Internal-only trust and audit tables

### `tutor_application_reviews`

Read:

- admin: full
- tutor applicant: only through shaped public status surfaces, not raw internal notes

Write:

- internal only

### `moderation_cases`

Read:

- admin: full
- normal product actors: no raw access

Write:

- admin only

### `moderation_case_events`

Read:

- admin only

Write:

- admin only

### `admin_action_logs`

Read:

- highly restricted internal access only

Write:

- system/server only from privileged flows

## 11. Public Projection Rules

Public routes must never query private operational tables directly and treat the result as public-safe automatically.

The public system should rely on:

- explicit public views
- projection tables
- server-shaped DTOs

Examples:

- tutor public browse -> `public_tutor_search_projection`
- tutor public profile -> public-safe tutor profile view or DTO
- public trust proof -> derived trust snapshot, not raw credentials or internal reliability tables

## 12. Storage Authorization Matrix

## 12.1 Tutor credential files

Access:

- uploading tutor: limited self-service upload and owner view where product allows
- admin: internal review access
- public: never

Rule:

- storage access must align with the private credential-review flow

## 12.2 Public tutor intro-video metadata

Rule:

- phase 1 stores normalized external video references, not private uploaded video files

Access:

- public: only published metadata and embed-safe fields
- owner tutor: edit through controlled profile paths

## 12.3 Future file uploads

If later user-uploaded messaging or lesson files are introduced:

- each file class needs its own access rules
- do not reuse tutor-credential rules casually

## 13. Realtime Authorization Matrix

Realtime is optional by feature, but when used it must respect the same object boundaries.

## 13.1 Messaging channels

Allowed:

- conversation participants only

Blocked:

- non-participants

Rule:

- private realtime channels must follow the same participant rules as canonical message reads

## 13.2 Notification freshness

Allowed:

- notification owner only

## 13.3 Presence and typing

Allowed:

- only where users are already authorized to participate in the conversation context

Rule:

- presence is additive convenience, not an access loophole

## 14. Mutation Rules

The safest default is:

- most business-critical writes happen through server-owned actions or route handlers

Examples:

- booking creation
- lesson acceptance
- message send
- tutor approval
- review publication status change
- payout-affecting changes

This keeps business authorization readable and reduces policy drift.

## 15. RLS Boundary Rules

## 15.1 Main rule

Enable RLS on all tables, views, and functions in exposed schemas.

## 15.2 Self-row rule

For user-owned private tables, start from:

- self-row only

Then add narrowly scoped participant or internal access rules.

## 15.3 Public-row rule

Public visibility must be an explicit positive condition, not an absence of protection.

Examples:

- published review
- public listed tutor profile
- approved public search projection row

## 15.4 Internal-only rule

For internal-only tables:

- do not depend on permissive RLS plus hidden routes
- keep them server-owned and tightly protected

## 16. Default-Deny Examples

These rules should be assumed unless explicitly opened:

- tutors cannot read arbitrary student profiles
- students cannot read arbitrary tutor credentials
- public users cannot inspect raw availability rules
- participants cannot see other conversations they do not belong to
- admins do not automatically get payout editing powers outside the explicit finance path
- admins do not need raw storage access unless operationally justified

## 17. AI-Agent Implementation Rules

Future implementation tasks should treat this matrix as a hard contract.

Agents should:

- ask which actor is acting
- ask which object is being read or mutated
- identify whether access is public, self, participant, role-based, or internal-only
- implement domain checks before trusting client state
- apply or preserve RLS where user JWT paths exist

Agents should not:

- bypass authorization because the route is already gated
- expose raw operational tables to simplify UI code
- treat admin capability as a universal shortcut
- duplicate similar but inconsistent access checks across modules

## 18. Decisions To Lock Now

The system should lock the following now:

- one `app_user` is the canonical product identity root
- roles are capabilities, not separate auth universes
- route gating and domain authorization are both required
- RLS is mandatory for exposed data paths
- public data must come from explicit public-safe projections or DTOs
- most critical writes stay server-owned
- trust-sensitive admin access remains narrower than ordinary admin browsing
- realtime follows the same participant and owner rules as canonical reads

## 19. Implementation Handoff Status

The implementation handoff path is:

1. use `docs/architecture/route-layout-implementation-map-v1.md` for app route shape
2. use `docs/planning/agent-implementation-decision-index-v1.md` and `docs/planning/implementation-task-template-v1.md` to create concrete implementation tasks

## 20. Final Recommendation

Mentor IB should use a conservative, layered authorization system:

- Supabase Auth for identity
- one canonical `app_user`
- capability-based roles
- server-owned domain authorization
- RLS defense in depth on exposed data paths
- public-safe projections for public reads

That gives the project an authorization model that is precise enough for secure implementation, clear enough for humans to review, and structured enough for AI agents to retrieve and apply consistently.

## 21. Official Source Notes

The matrix above is consistent with current official documentation for:

- Supabase Auth overview: `https://supabase.com/docs/guides/auth`
- Supabase user sessions: `https://supabase.com/docs/guides/auth/sessions`
- Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase securing your API: `https://supabase.com/docs/guides/api/securing-your-api`
- Supabase hardening the Data API: `https://supabase.com/docs/guides/database/hardening-data-api`
- Supabase Storage ownership: `https://supabase.com/docs/guides/storage/security/ownership`
- Supabase Realtime authorization: `https://supabase.com/docs/guides/realtime/authorization`
