# Mentor IB Database RLS Boundaries v1

**Date:** 2026-04-08
**Status:** Standalone boundary document for Row Level Security coverage, exposed-schema posture, and table-family policy strategy
**Scope:** exposed versus private schemas, which tables require RLS, which paths should stay server-only, public projection boundaries, storage and realtime RLS posture, and implementation rules for future policy work

## 1. Why This Document Exists

This document defines where Row Level Security must apply in Mentor IB and where server-only access is the safer boundary.

It exists now because the approved architecture already assumes:

- Supabase Data API access exists for exposed schemas
- some data must be browser-readable or realtime-readable
- some data must never be directly exposed at all
- one account can hold multiple role capabilities
- public tutor discovery depends on carefully shaped data surfaces

Without an explicit RLS-boundary document, teams usually drift into:

- enabling RLS on some tables but forgetting related views or functions
- exposing raw operational tables because the UI needs data quickly
- duplicating business authorization inside fragile policies
- letting internal-only tables remain in the exposed schema without a good reason

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it is the access-boundary companion to the schema outline and auth matrix.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/security-architecture-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`

It inherits from them and translates the access model into RLS coverage decisions.

It does not define:

- exact SQL policy text
- exact helper functions
- final migration order for policies

Those should come later in implementation-facing artifacts.

## 4. Core Recommendation

Mentor IB should use a three-boundary model:

1. exposed data surfaces in the `public` schema with RLS enabled
2. explicit public-safe projections in the exposed schema with RLS and visibility rules
3. internal-only or server-only tables outside normal client exposure, ideally in a private schema when appropriate

The practical rule is:

- if a user JWT can touch it, RLS must protect it
- if the browser should never touch it, do not rely on route hiding alone
- if data is public, make that publicness explicit through projection or policy, not by accident

## 5. Official Boundary Rule From Supabase

Supabase's current guidance is explicit:

- tables created in the `public` schema are accessible via the Data API
- RLS should be enabled on all tables, views, and functions in the `public` schema
- any `public`-schema table without RLS may be accessible through the `anon` role

That means the safest baseline is:

- exposed schema -> RLS mandatory
- private/internal schema -> no casual client exposure

## 6. Boundary Types

## 6.1 Type A: public with explicit visibility rules

These are data surfaces that may be readable by public users or `anon`, but only through explicit public-safe conditions.

Examples:

- public tutor profile projection
- public tutor search projection
- published public reviews

Rule:

- public access must be an explicit positive rule

## 6.2 Type B: authenticated user-owned or participant-owned

These are surfaces that a signed-in user can access only if they own the object or participate in it.

Examples:

- own account row
- own learning needs
- lessons where the user is student or tutor
- conversations where the user is a participant

Rule:

- start from self- or participant-only policies

## 6.3 Type C: internal-only operational data

These are surfaces that should not be broadly exposed to clients at all.

Examples:

- moderation cases
- admin action logs
- webhook processing records
- job runs
- raw credential evidence metadata

Rule:

- keep these server-owned
- move them to a private schema when that improves safety and clarity

## 7. RLS Coverage Rules

## 7.1 Exposed-schema rule

Every table, view, and callable function in the exposed schema must be reviewed for RLS.

For MVP, the exposed schema is expected to be `public`.

## 7.2 View rule

Views in exposed schemas also require the same security review posture.

Do not assume that a view is safe just because it hides some columns.

## 7.3 Function rule

Functions callable through exposed data paths must be reviewed like tables.

If they operate with elevated permissions:

- document them
- keep scope narrow
- avoid using them as hidden universal bypasses

## 7.4 Service-role rule

The service-role key is not a substitute for policy design.

It is a server-only tool, not a normal app-user boundary.

## 8. Recommended Schema Exposure Posture

## 8.1 `public` schema

Recommended usage:

- canonical application tables that may need API or realtime access
- public-safe projections
- authenticated user-owned tables

Rule:

- RLS mandatory

## 8.2 `private` schema

Recommended usage later where helpful:

- internal sync helpers
- internal operational helpers
- internal admin/moderation support tables
- raw provider-event helpers or non-user-facing maintenance tables

Rule:

- do not treat `private` schema as public API surface

## 8.3 MVP simplification rule

Not every internal-only table must be moved out of `public` on day one.

But if it remains in `public`, it still needs:

- RLS
- narrow policies
- server-owned mutation posture

## 9. Table-Family RLS Boundary Matrix

This section defines the canonical boundary type for each major family.

## 9.1 Identity tables

### `app_users`

Boundary type:

- Type B

RLS posture:

- enabled
- self-row read baseline
- limited self-update paths if directly exposed
- no broad authenticated read

### `user_roles`

Boundary type:

- Type B with internal aspects

RLS posture:

- enabled
- self can inspect own role rows if directly exposed
- admin internal access allowed
- no self-service writes

## 9.2 Student data tables

### `student_profiles`

Boundary type:

- Type B

RLS posture:

- enabled
- self-row read/update baseline
- tutor access should not come from broad raw-table read policies

### `learning_needs`

Boundary type:

- Type B

RLS posture:

- enabled
- owning student read/write baseline
- no generic tutor read policy on raw rows

### `match_runs`

Boundary type:

- Type B

RLS posture:

- enabled if exposed
- owning student read
- system/server writes

### `match_candidates`

Boundary type:

- Type B

RLS posture:

- enabled if exposed
- owning student read
- no raw public read
- no general tutor read

## 9.3 Tutor data tables

### `tutor_profiles`

Boundary type:

- mixed Type A and Type B

RLS posture:

- if raw table stays exposed, use explicit public read condition only for public-safe rows
- owner read/update allowed for own row
- internal elevated access allowed as required

Preferred posture:

- public-facing reads should come from a public-safe projection or DTO
- owner editing can still use the canonical table through server-owned paths

### `tutor_subject_capabilities`

Boundary type:

- mixed Type A and Type B

RLS posture:

- public read only when tied to a publicly listable tutor surface
- owner/admin full management

### `tutor_language_capabilities`

Boundary type:

- mixed Type A and Type B

RLS posture:

- same pattern as subject capabilities

### `tutor_credentials`

Boundary type:

- Type C

RLS posture:

- enabled if still in exposed schema
- owner limited read
- admin review access only
- never public

Preferred posture:

- keep access server-owned and narrow

## 9.4 Scheduling and availability tables

### `schedule_policies`

Boundary type:

- Type B

RLS posture:

- owner read/write
- admin read/write where needed
- no raw public access

### `availability_rules`

Boundary type:

- Type B

RLS posture:

- owner read/write
- no raw public access
- student/public access should go through shaped slot outputs

### `availability_overrides`

Boundary type:

- Type B

RLS posture:

- owner read/write
- no raw public access

### `tutor_availability_projection`

Boundary type:

- mixed Type A and Type B depending on projection contents

RLS posture:

- if it contains only public-safe availability summaries for listable tutors, allow explicit public read
- if it contains richer overlap or internal signals, keep it authenticated/server-only

## 9.5 Lesson tables

### `lessons`

Boundary type:

- Type B

RLS posture:

- participant-only read baseline
- student or tutor participant write access only through server/domain paths
- internal elevated read where justified

### `lesson_status_history`

Boundary type:

- Type B

RLS posture:

- participant-readable where intentionally surfaced
- no casual public access

### `lesson_meeting_access`

Boundary type:

- Type B

RLS posture:

- lesson participants only
- no public access

### `lesson_reports`

Boundary type:

- Type B

RLS posture:

- tutor owner access
- student access only when shared state allows it
- no public access

## 9.6 Messaging tables

### `conversations`

Boundary type:

- Type B

RLS posture:

- participant-only read baseline
- no non-participant access

### `conversation_participants`

Boundary type:

- Type B

RLS posture:

- participant-scoped read only
- no public access

### `messages`

Boundary type:

- Type B

RLS posture:

- participant-only read
- send paths still go through server/domain checks

### `message_reads`

Boundary type:

- Type B

RLS posture:

- self-read state or participant-scoped internal logic only

### `user_blocks`

Boundary type:

- Type B

RLS posture:

- blocker-owned visibility baseline
- narrow exceptions only if product behavior requires them

### `abuse_reports`

Boundary type:

- Type C

RLS posture:

- if exposed, very narrow reporter and admin policies only

Preferred posture:

- keep largely server-owned

## 9.7 Trust and review tables

### `reviews`

Boundary type:

- mixed Type A and Type B

RLS posture:

- public read only for `published` public-safe rows
- reviewer private draft/submitted visibility
- internal moderation access where needed

### `tutor_reliability_events`

Boundary type:

- Type C

RLS posture:

- no public read
- no normal tutor read by default
- internal only except via derived trust projections

### `tutor_rating_snapshot`

Boundary type:

- mixed Type A and internal support

RLS posture:

- if used publicly, only expose public-safe derived fields

### `tutor_trust_snapshot`

Boundary type:

- mixed Type A and internal support

RLS posture:

- separate any internal-only trust signals from public-safe derived outputs

## 9.8 Notification and async tables

### `notifications`

Boundary type:

- Type B

RLS posture:

- owner-only read baseline
- no public access

### `notification_deliveries`

Boundary type:

- Type C

RLS posture:

- internal only

### `job_runs`

Boundary type:

- Type C

RLS posture:

- internal only

### `webhook_events`

Boundary type:

- Type C

RLS posture:

- internal only

## 9.9 Payment and earnings tables

### `payments`

Boundary type:

- Type B with internal sensitivity

RLS posture:

- payer-readable only if exposed through shaped billing history
- no public access
- internal elevated access where needed

### `earnings`

Boundary type:

- Type B with internal sensitivity

RLS posture:

- tutor-owner shaped read only
- no public access

## 9.10 Internal moderation and audit tables

### `tutor_application_reviews`

Boundary type:

- Type C

RLS posture:

- internal only

### `moderation_cases`

Boundary type:

- Type C

RLS posture:

- internal only

### `moderation_case_events`

Boundary type:

- Type C

RLS posture:

- internal only

### `admin_action_logs`

Boundary type:

- Type C

RLS posture:

- internal only

## 10. Public Projection Boundary Rules

Public projections should be the preferred public-read boundary.

## 10.1 `public_tutor_search_projection`

Boundary type:

- Type A

RLS posture:

- explicit public read allowed only for rows tied to public listing eligibility

Should never contain:

- private credential evidence
- internal moderation fields
- raw reliability events
- private lesson or conversation context

## 10.2 Public tutor profile DTO or view

Boundary type:

- Type A

Rule:

- if implemented as a view in an exposed schema, review it exactly like a table and give it explicit public-safe rules

## 10.3 `tutor_matching_projection`

Boundary type:

- usually Type B or server-only support

Rule:

- this is not a public browse surface by default
- keep it internal or authenticated/server-owned unless there is a proven reason otherwise

## 10.4 `lesson_list_projection`

Boundary type:

- Type B

Rule:

- participant-scoped, never public

## 11. Storage RLS Boundaries

## 11.1 Credential file objects

Boundary type:

- Type C

RLS posture:

- owner-limited access only if product requires owner review
- internal reviewer access where needed
- never public

Rule:

- ownership metadata helps but is not sufficient by itself
- align storage policies with application and review rules

## 11.2 Future lesson or message attachments

Boundary type:

- Type B by default

Rule:

- participant-only access
- separate bucket/path strategy from credential evidence

## 12. Realtime RLS Boundaries

## 12.1 Realtime channel rule

Private Realtime channels must use authorization rules that mirror canonical read permissions.

## 12.2 Conversation channel rule

For message freshness, presence, or typing:

- only conversation participants may join the private topic

## 12.3 Notification channel rule

- only the notification owner may receive their private notification channel

## 12.4 Policy-complexity rule

Supabase notes that more complex Realtime authorization can increase connection latency and reduce join performance.

That means:

- keep topic authorization narrow
- avoid needlessly complex policy logic on `realtime.messages`
- subscribe only where the UX really needs live updates

## 12.5 Postgres-changes rule

When using Postgres Changes, the canonical table RLS still governs who can receive row changes.

The `private` channel option does not replace table-level RLS for Postgres Changes.

## 13. Policy-Shape Rules

## 13.1 Prefer positive conditions

Write policies as explicit positive access rules.

Examples:

- row belongs to current user
- row is public and listed
- actor participates in the conversation

## 13.2 Avoid broad authenticated rules

Do not use:

- "authenticated can read all"

unless the data is genuinely safe.

## 13.3 Split read and write intent

Do not assume one policy should cover every operation.

Keep `select`, `insert`, `update`, and `delete` logic separate where meanings differ.

## 13.4 Pair `using` and `with check` carefully

For writable tables, make sure update/insert conditions protect both:

- which existing rows can be targeted
- what the resulting row is allowed to become

## 13.5 Keep business logic readable

If a rule becomes too complex for healthy RLS reasoning:

- push more logic into server-owned domain actions
- keep RLS as the narrow defense-in-depth boundary

## 14. Recommended Phase 1 RLS Priorities

Phase 1 should prioritize explicit policy design for:

1. `app_users`
2. `student_profiles`
3. `learning_needs`
4. `tutor_profiles`
5. `availability_rules`
6. `availability_overrides`
7. `lessons`
8. `conversations`
9. `messages`
10. `reviews`
11. `notifications`
12. any public projection or view used by public routes

## 15. Default-Deny Examples

These rules should be assumed unless explicitly opened:

- public users cannot read raw tutor profile rows just because a tutor exists
- tutors cannot read arbitrary learning needs
- students cannot read other students' lessons
- non-participants cannot read conversation rows
- public users cannot inspect raw availability rules
- admins should still get only the internal tables their action family requires

## 16. AI-Agent Implementation Rules

Agents should treat this document as the boundary contract for policy work.

Agents should:

- identify the boundary type first
- ask whether the table belongs in exposed schema at all
- keep public access explicit
- keep participant and owner access narrow
- align storage and realtime policies with canonical read rules

Agents should not:

- expose internal-only tables to avoid writing DTOs
- treat route gating as a substitute for RLS
- write broad fallback policies to "get it working"
- assume a view is safe without separate review

## 17. Decisions To Lock Now

The system should lock the following decisions now:

- RLS is mandatory on all exposed tables, views, and functions
- public data must be public by explicit policy, not by omission
- many core operational tables are Type B and should start self- or participant-scoped
- internal moderation, audit, webhook, and job tables are Type C
- server-only access remains the preferred boundary for highly sensitive internal tables
- public projections are the right way to serve public discovery and trust surfaces
- Realtime authorization must mirror canonical read permissions

## 18. Implementation Handoff Status

The implementation handoff path is:

1. use `docs/architecture/route-layout-implementation-map-v1.md` for app route shape
2. use `docs/planning/agent-implementation-decision-index-v1.md` and `docs/planning/implementation-task-template-v1.md` to create concrete implementation tasks

## 19. Final Recommendation

Mentor IB should use RLS as a deliberate exposed-surface boundary, not as an afterthought.

The clean model is:

- exposed schema -> RLS reviewed and explicit
- public reads -> explicit public-safe projections
- private user reads -> self or participant scoped
- sensitive internal operations -> server-owned and tightly bounded

That gives the project a security posture that is strong enough for browser and realtime access while still staying understandable for humans and AI agents.

## 20. Official Source Notes

The guidance above is aligned with current official documentation for:

- Supabase Row Level Security: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase securing your API: `https://supabase.com/docs/guides/api/securing-your-api`
- Supabase hardening the Data API: `https://supabase.com/docs/guides/database/hardening-data-api`
- Supabase Storage ownership: `https://supabase.com/docs/guides/storage/security/ownership`
- Supabase Realtime authorization: `https://supabase.com/docs/guides/realtime/authorization`
