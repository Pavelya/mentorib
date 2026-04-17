# Mentor IB Data DTO And Query Boundary Map v1

**Date:** 2026-04-09
**Status:** Standalone data-layer boundary document for DTO-safe query surfaces, route-facing data shapes, server-only data access, public/private/admin DTO separation, and AI-agent-safe query ownership
**Scope:** DTO classes, query ownership, route-to-domain query boundaries, public profile/search DTOs, matching DTOs, lesson/message/tutor/student/admin DTOs, mutation return shapes, projection consumption, and implementation review rules

## 1. Why This Document Exists

Mentor IB already has:

- a canonical schema outline
- access-control and RLS docs
- Drizzle query conventions
- projection and index review docs
- privacy and retention field maps
- route layout and application architecture docs

What was still missing was the map for one repeated implementation question:

**What exact shape is allowed to leave the data layer and reach a route, component, client component, API response, or external export?**

Without a DTO and query boundary map, implementation can drift into:

- raw database rows passed to UI components
- public pages querying private tutor tables directly
- client components typed against Drizzle row models
- route files owning large business queries
- student and tutor views receiving mismatched object shapes
- internal admin fields leaking into normal role surfaces
- matching and search DTOs becoming infrastructure-specific
- AI agents re-querying whatever table is convenient instead of using domain-owned query services

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because DTO shape is the controlled boundary where database truth becomes route-safe application data.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/drizzle-schema-and-query-conventions-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/database-index-and-query-review-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`

It inherits application-shape rules from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- final TypeScript DTO definitions
- final repository function names
- final implementation folder tree
- final Drizzle schema declarations
- final RLS policy SQL
- final API route contracts for external clients
- final product copy or UI component props

It defines the boundary posture and canonical DTO families that future implementation should follow.

If there is a conflict:

- source-of-truth table ownership comes from `docs/data/data-ownership-boundary-map-v1.md`
- RLS and authorization come from the auth/RLS docs
- query performance and indexes come from the index/query review doc
- route ownership comes from the route-layout implementation map
- privacy field handling comes from the retention/erasure field map
- public SEO route behavior comes from the SEO architecture docs

## 4. Core Recommendation

Mentor IB should use a **server-only, domain-owned data access layer that returns minimal, role-safe DTOs**.

The practical rule is:

1. route files compose product screens; they do not own raw business queries
2. domain services own use-case authorization and DTO shaping
3. repositories own database query composition
4. Drizzle row types stay server-side and internal
5. client components receive serializable DTO props only
6. public routes receive public DTOs only
7. participant and admin routes receive role-scoped DTOs only
8. projections are read models that feed DTOs, not user-facing truth by themselves

This gives the app one UI/UX ecosystem while still keeping student, tutor, public, and internal data boundaries sharp.

## 5. Boundary Vocabulary

Use these terms consistently.

## 5.1 Database row

A physical row from a canonical table, view, or projection.

Rule:

- stays inside repositories or tightly internal server-only helpers

## 5.2 Repository result

A typed result returned by a domain repository.

Rule:

- may be raw-ish internally, but should not cross into routes or client components if sensitive or broader than the use case

## 5.3 Domain object

A server-side use-case object with product meaning.

Examples:

- `Match`
- `Lesson`
- `Conversation`
- `TutorProfile`

Rule:

- can combine rows and enforce business meaning, but still needs DTO shaping before route/UI consumption

## 5.4 DTO

A Data Transfer Object shaped for a specific boundary and caller.

Rule:

- route-facing and client-facing data should be DTO-safe, minimal, serializable, and role-appropriate

## 5.5 View model

A UI-specific composition of DTOs and presentational state.

Rule:

- can exist in route/page code or screen containers, but must not introduce new source-of-truth facts

## 5.6 Projection

A database read model for query performance or public-safe exposure.

Rule:

- can feed DTOs, but does not own retention, authorization, or product truth

## 6. Golden Path For Reads

The default read path should be:

1. route page or server component receives route params/search params
2. route validates params and resolves route family
3. route calls a domain query/service function
4. domain query/service resolves actor context when required
5. domain service performs authorization and product-state checks
6. repository reads canonical tables or approved projections
7. service maps results to the smallest safe DTO
8. route passes DTO to server components or client components
9. client components receive only serializable DTO props

Do not skip from route file to raw table query for sensitive, public, participant, billing, or admin data.

## 7. Golden Path For Mutations

The default mutation path should be:

1. form or client interaction submits to Server Action or route handler
2. action validates input
3. action resolves session from server-owned cookies/headers, not trusted client input
4. action calls domain command/service
5. service performs authorization and business validation
6. repository performs mutation or transaction
7. service triggers explicit side-effect records where needed
8. service returns a minimal operation result DTO
9. action revalidates or redirects as needed

Mutation return values should usually be:

- success/failure state
- safe message or error code
- updated public/role-safe DTO fragment if required
- next navigation target when appropriate

Do not return full updated database rows to the client by reflex.

## 8. DTO Boundary Classes

Use these classes when designing or reviewing a DTO.

## 8.1 Class D0: internal server-only row shape

Audience:

- repositories and internal service helpers

Allowed:

- raw Drizzle row types
- internal join results
- internal projection rows

Blocked:

- route/page exports
- client component props
- public route data
- external API responses

## 8.2 Class D1: public anonymous DTO

Audience:

- unauthenticated visitors
- indexable public pages
- public discovery routes

Allowed:

- approved public tutor profile fields
- approved public trust summary
- approved public subject/language coverage
- public intro video metadata
- public availability summary

Blocked:

- emails
- auth ids
- private credential paths
- moderation fields
- raw reliability events
- private availability rules
- student data
- lesson/conversation data

## 8.3 Class D2: public non-indexable workflow DTO

Audience:

- public or unauthenticated workflow routes that should not be SEO-indexed

Examples:

- auth hints
- role chooser hints
- public booking entry context before sign-in

Allowed:

- public-safe context needed to continue the flow

Blocked:

- private match data
- personalized student state
- internal tutor availability details

## 8.4 Class D3: authenticated self DTO

Audience:

- signed-in user viewing their own account/settings/notifications

Allowed:

- own account profile data
- own role state
- own notification list
- own privacy/settings state

Blocked:

- other users' account rows
- internal moderation notes
- unrelated participant records

## 8.5 Class D4: student private DTO

Audience:

- signed-in student actor

Allowed:

- own learning needs
- own match results
- own lesson list
- own conversation summaries
- saved/shortlisted tutor state

Blocked:

- tutor financial data
- raw tutor reliability internals
- private credential evidence
- other students' data
- internal matching debug fields unless explicitly exposed as user-safe rationale

## 8.6 Class D5: tutor private DTO

Audience:

- signed-in tutor actor

Allowed:

- own tutor profile setup state
- own schedule policy and availability management data
- own lesson/student roster summaries
- own conversation summaries
- own application status
- own earnings summary if billing phase supports it

Blocked:

- student private profile data beyond lesson/conversation/roster purpose
- unrelated tutor data
- internal moderation notes
- payment instrument details
- raw matching debug data

## 8.7 Class D6: participant-scoped DTO

Audience:

- student or tutor who participates in a lesson or conversation

Examples:

- lesson detail DTO
- message thread DTO
- meeting access DTO
- lesson report DTO

Allowed:

- fields needed for the participant's role in that object

Blocked:

- fields visible only to the other role
- internal moderation details
- unrelated account/profile fields
- raw security or provider metadata

## 8.8 Class D7: admin DTO

Audience:

- admin capability holders

Allowed:

- scoped internal queue data
- application review summaries
- moderation case fields
- report context
- restricted audit summaries

Blocked:

- broad database dumps
- raw secrets
- payment method details
- unrestricted message or credential content without case-specific purpose

## 8.9 Class D8: provider/job/internal DTO

Audience:

- server-owned provider handlers
- background job handlers
- internal maintenance workflows

Allowed:

- provider ids
- idempotency status
- job state
- retry context
- restricted operational metadata

Blocked:

- browser props
- public route payloads
- analytics events unless minimized and approved

## 8.10 Class D9: export/search/analytics DTO

Audience:

- public search export
- structured data generation
- analytics or observability payload

Allowed:

- the minimum fields required for the target surface

Blocked:

- private fields copied for convenience
- raw message/lesson-report text
- credential file data
- student identity in public/analytics payloads

## 9. Query Ownership Map

The query owner should be the domain that owns the product meaning.

| Query surface | Owner module | Preferred source | DTO class |
| --- | --- | --- | --- |
| Public tutor card/search result | `tutors` or `discovery` | `public_tutor_search_projection` | `D1` |
| Public tutor profile | `tutors` | public-safe profile projection/view plus trust summary | `D1` |
| Match run result | `matches` | `match_runs`, `match_candidates`, matching projections | `D4` |
| Match refinement | `matches` | cached match context plus discovery/matching projections | `D4` |
| Student learning needs | `learning-needs` | `learning_needs` | `D4` |
| Student lessons | `lessons` | `lessons` plus role-safe summaries | `D4`/`D6` |
| Tutor lessons | `lessons` | `lessons` plus tutor-scoped summaries | `D5`/`D6` |
| Tutor students roster | `lessons` or `tutors` | lesson/conversation-derived roster summary | `D5` |
| Conversation list | `conversations` | participant-scoped conversation projection/query | `D4`/`D5`/`D6` |
| Message thread | `conversations` | `messages` scoped by participant | `D6` |
| Meeting access | `lessons` | `lesson_meeting_access` | `D6` |
| Tutor application review | `tutors` plus `moderation` | application/review records | `D7` |
| Abuse report queue | `moderation` | reports/cases | `D7` |
| Notifications | `notifications` | recipient-scoped notifications | `D3` |
| Payment summary | `billing` | payment/earning records | `D4`/`D5`/`D7` |
| Webhook event handling | `billing` or provider module | webhook/idempotency tables | `D8` |
| Public SEO metadata | route owner plus source module | public-safe DTO | `D1`/`D9` |
| Analytics event payload | `analytics` | event input, not raw table rows | `D9` |

If a route needs a DTO that crosses several domains, the page can compose domain DTOs, but it should not own raw cross-domain joins.

## 10. Public Tutor Discovery DTO

Purpose:

- render public browse/search cards and match-light discovery cards

DTO class:

- `D1`

Allowed fields:

- `tutor_profile_id` or public-safe stable identifier
- `public_slug`
- `display_name`
- `headline`
- public subject labels
- public focus-area labels
- public language labels
- public best-for summary
- public trust summary
- public rating/review summary if approved
- public availability summary
- public intro video thumbnail/provider if approved
- public price/range summary if approved

Blocked fields:

- `app_user_id`
- `auth_user_id`
- email
- private credential paths
- raw credential review state
- moderation notes
- internal reliability event details
- raw availability rules
- student-specific match rationale
- private pricing/payment state

Preferred query source:

- `public_tutor_search_projection`

## 11. Public Tutor Profile DTO

Purpose:

- render `/tutors/[slug]`
- feed public metadata and structured data helpers

DTO class:

- `D1`

Allowed fields:

- public slug
- display name
- headline
- approved bio
- teaching style summary
- best-for summary
- public subject/focus/language coverage
- public intro video metadata
- public trust proof summary
- public review/rating summary
- public availability summary
- public call-to-action state

Blocked fields:

- raw account row
- email
- private credential evidence
- private schedule policy internals
- private application review details
- internal moderation state
- raw reliability penalties
- private student interaction history
- full payment/earnings state

Important rule:

- public metadata and JSON-LD should derive from the same public DTO or an even narrower metadata DTO, not from raw tutor tables.

## 12. Matching Result DTO

Purpose:

- show student why a tutor fits a submitted learning need

DTO class:

- `D4`

Allowed fields:

- match run id
- candidate id
- tutor public card data
- rank position or user-safe ordering
- confidence label
- fit summary
- best-for summary
- availability signal
- public trust signal
- next actions such as save, compare, message, book

Potentially internal fields:

- raw numeric `match_score`
- ranking debug details
- raw reliability penalty details
- full matching projection row
- private availability inputs

Rule:

- expose explanations derived from scored signals, but do not expose internal scoring/debug fields unless the product explicitly wants them user-visible.

## 13. Student Learning Need DTO

Purpose:

- let a student view, refine, archive, or continue a support request

DTO class:

- `D4`

Allowed fields:

- learning need id
- need status
- structured subject/focus labels
- urgency level
- support style
- language preference
- timezone context
- session frequency intent
- submitted/archived timestamps
- redacted or user-authored free-text note only where needed

Blocked fields:

- raw need signature if it can leak internal matching logic
- internal matching projection version unless needed for debug/admin
- other students' needs

Rule:

- keep free-text note handling aligned with the retention/erasure field map.

## 14. Lesson DTOs

Lessons need role-shaped DTOs, not one universal lesson row.

## 14.1 Student lesson DTO

DTO class:

- `D4`/`D6`

Allowed fields:

- lesson id
- lesson status
- scheduled start/end
- lesson timezone
- tutor public/participant-safe card
- subject/focus snapshot
- meeting access when allowed
- booking/cancellation status
- student-visible lesson report summary
- next actions

Blocked fields:

- tutor private schedule internals
- tutor financial payout details
- internal reliability event records
- private tutor notes not shared with student

## 14.2 Tutor lesson DTO

DTO class:

- `D5`/`D6`

Allowed fields:

- lesson id
- lesson status
- scheduled start/end
- lesson timezone
- student participant-safe display
- subject/focus snapshot
- student note snapshot if it was submitted for lesson context
- meeting access management state
- report status
- next actions

Blocked fields:

- student account email unless a specific communication feature requires it
- unrelated student profile detail
- student private settings
- payment method detail
- internal moderation notes

## 14.3 Admin lesson DTO

DTO class:

- `D7`

Allowed fields:

- dispute/support-relevant lesson state
- participant references
- lifecycle timestamps
- payment linkage summary
- moderation/report linkage where relevant

Rule:

- still scoped by case/support purpose; not a raw lesson table dump.

## 15. Meeting And Calendar DTOs

Meeting links are sensitive participant data.

DTO class:

- `D6`

Allowed fields:

- provider label
- meeting URL only when actor is a participant and access is active
- normalized host for safety display
- access status
- add-to-calendar link or downloadable ICS endpoint

Blocked fields:

- inactive meeting URL
- provider secrets
- unrelated lesson links
- internal meeting validation metadata

Rule:

- public pages must never receive meeting access DTOs.

## 16. Conversation List DTO

Purpose:

- render a student's or tutor's message sidebar/list

DTO class:

- `D4`/`D5`/`D6`

Allowed fields:

- conversation id
- counterpart display summary
- related lesson or learning need label where safe
- last message timestamp
- last message short preview if product allows it
- unread count
- mute/archive state for current participant
- block/report state summary where needed for UI behavior

Blocked fields:

- full message body history
- other participant's private settings
- conversations where actor is not a participant
- moderation notes

Rule:

- list queries must start from participant scope.

## 17. Message Thread DTO

Purpose:

- render a participant-scoped thread

DTO class:

- `D6`

Allowed fields:

- message id
- sender participant role/display
- body when not redacted and actor is a participant
- created timestamp
- edited/removed status
- reply-to summary if visible
- read state for current actor where needed

Blocked fields:

- hidden or redacted message body
- internal moderation annotations
- sender account email by default
- messages from conversations where actor is not a participant

Rule:

- deleted/redacted message bodies should follow the retention/erasure field map.

## 18. Tutor Operations DTOs

Tutor workflow surfaces should reuse shared objects but role-shape the fields.

Examples:

- tutor overview DTO
- tutor schedule DTO
- tutor students roster DTO
- tutor application status DTO
- tutor profile editor DTO

Allowed:

- own public/private profile setup state
- own schedule and availability management state
- own lesson/request summaries
- student participant-safe roster entries
- own application review status and next steps

Blocked:

- raw student profiles
- internal tutor moderation notes
- admin-only application review summary
- unrelated tutor comparisons

Rule:

- the tutor side should not become a second data model; it should use shared lesson, conversation, profile, and schedule concepts with tutor-specific DTO shaping.

## 19. Account And Settings DTOs

Purpose:

- render account, notification, privacy, billing, and role settings

DTO class:

- `D3`

Allowed fields:

- own display/account settings
- own role capabilities
- own notification settings
- own privacy/delete-account workflow state
- safe billing summary

Blocked fields:

- raw auth identity internals
- provider tokens
- other role owners' data
- audit logs
- raw Stripe object payloads

Rule:

- auth identity and product identity should be resolved server-side and returned as a minimal account DTO.

## 20. Billing And Earnings DTOs

Billing and earnings DTOs must be extremely narrow.

DTO classes:

- `D4` for payer/student billing summary
- `D5` for tutor earning summary
- `D7` for admin financial support context
- `D8` for provider webhook/internal context

Allowed fields:

- payment status
- amount and currency
- receipt/support-facing provider reference if needed
- refund/cancellation status
- tutor earning status if payout phase supports it

Blocked fields:

- raw payment instrument data
- full Stripe payload
- bank details
- unrestricted connected-account details
- other users' payments

Rule:

- Stripe should remain the system of record for sensitive payment details; Mentor IB DTOs expose only operational summaries.

## 21. Admin And Moderation DTOs

Admin/moderation tools should still use scoped DTOs.

DTO class:

- `D7`

Allowed fields:

- queue status
- case status
- report summary
- relevant object references
- reviewed public profile content
- restricted credential review metadata
- action history summary

Blocked fields:

- broad raw table dumps
- raw credential file content unless explicitly requested in a secure review flow
- full message history unless tied to a case and authorized
- payment method details
- secrets

Rule:

- internal access is not a reason to skip DTO shaping.

## 22. Notification DTOs

Purpose:

- render in-app notifications and notification settings

DTO class:

- `D3`

Allowed fields:

- notification id
- type
- title
- body summary
- read state
- safe object link
- created timestamp

Blocked fields:

- full message bodies
- lesson report text
- credential details
- meeting URLs unless the notification is the secure participant path that intentionally exposes one

Rule:

- notification DTOs should be summaries, not hidden copies of sensitive source objects.

## 23. Public SEO And Structured Data DTOs

Purpose:

- feed metadata, sitemap eligibility, and JSON-LD helpers

DTO class:

- `D1`/`D9`

Allowed fields:

- canonical URL inputs
- public title/description inputs
- public tutor profile facts that pass quality gate
- public rating summary if approved
- public subject/service labels

Blocked fields:

- private tutor data
- student data
- personalized match data
- internal moderation state
- public fields that have been deindexed or delisted

Rule:

- metadata/structured data helpers should be narrower than page DTOs where possible.

## 24. Search And Export DTOs

Purpose:

- preserve a stable query contract if public browse later moves to Algolia or another search tool

DTO class:

- `D1`/`D9`

Allowed fields:

- public search object id
- public slug
- public display name/headline
- public subject/language/focus labels
- public trust summary
- public availability summary
- public ranking/filter fields

Blocked fields:

- private tutor profile fields
- internal match projection fields
- raw reliability penalties
- credential evidence
- student or lesson data

Rule:

- public search export DTOs must remain public-safe even if the index vendor supports secured keys.

## 25. Analytics And Observability DTOs

Purpose:

- measure product behavior without copying private source data

DTO class:

- `D9`

Allowed fields:

- event name
- route family
- object type
- coarse outcome/status
- anonymized or pseudonymous ids where approved
- timing and performance fields

Blocked fields:

- message bodies
- learning need free-text notes
- lesson report text
- credential contents
- payment method data
- auth tokens
- meeting URLs

Rule:

- analytics event DTOs should be designed as product signals, not serialized source objects.

## 26. File And Media DTOs

Purpose:

- represent public media, private credential files, or later attachments safely

DTO classes:

- `D1` for approved public media
- `D5`/`D7` for private tutor credential review
- `D6` for future participant-scoped attachments if added later

Allowed public fields:

- provider
- public thumbnail or embed metadata
- public title/label if approved

Allowed private review fields:

- credential metadata
- review status
- secure access action state

Blocked fields:

- raw storage object paths in public/client DTOs
- private signed URLs outside an active authorized flow
- credential file contents in route props

Rule:

- files should be represented by domain-owned metadata DTOs, not bucket paths passed around casually.

## 27. Error And Empty-State DTOs

DTO boundaries should include absence and denial states explicitly.

Examples:

- `not_found`
- `not_public`
- `requires_sign_in`
- `forbidden`
- `role_pending`
- `profile_incomplete`
- `not_participant`
- `deleted_or_redacted`

Rule:

- avoid returning `null` with no reason when a route needs to distinguish absent, private, deleted, or unauthorized state.

Do not leak private existence through overly specific public errors.

For page and route rendering, unauthorized, private, and non-public objects should collapse outwardly to `not_found` or equivalent 404 behavior unless the product is intentionally showing an account-state restriction surface.

## 28. Serialization Rule

Client components and Server Action return values receive serialized data.

DTOs passed to client components should avoid:

- class instances
- database driver objects
- raw `Date` objects unless the team standardizes serialization
- functions
- secrets
- non-serializable provider payloads
- full Drizzle row types

Recommended posture:

- use plain JSON-safe DTOs for route/client boundaries
- use ISO strings for timestamps at the boundary if that is the project convention
- parse/format dates in controlled UI helpers

## 29. Type Ownership Rule

Recommended implementation posture:

- module-owned `dto.ts` files define exported route-safe DTO types
- module-owned repository files may use Drizzle row types internally
- domain services map repository results to DTOs
- shared DTO primitives may live in a small shared location only when genuinely cross-domain

Do not:

- export `InferSelectModel` row types as component prop types
- import Drizzle schema/table declarations into client components
- make UI component props depend on private table columns
- create one giant global DTO file with no domain ownership

## 30. Query Parameter Boundary

Route params and search params are user input.

Rules:

- validate route params before querying
- normalize search params before building filters
- reject or ignore unsupported filter keys
- enforce pagination limits
- do not treat a slug/id in the URL as authorization

Examples:

- `/tutors/[slug]` resolves to a public DTO only if listing and quality gates pass
- `/book/[context]` resolves to a role-safe booking context DTO only after auth and ownership checks
- `/internal/users/[id]` resolves only for internal roles and must return an admin-scoped DTO

## 31. Cache Boundary

Cache keys and cached values should align with DTO boundaries.

Rules:

- public DTOs may use public route cache tags where approved
- private participant DTOs require private/user-scoped caching posture
- matching DTOs must include ranking/projection version where cache reuse depends on it
- retained/deleted/redacted source data must invalidate dependent DTO caches

Do not:

- cache broad raw row sets and then filter them per user in UI code
- let public cache tags hold private participant data
- cache public tutor DTOs after delisting without invalidation

## 32. Testing Requirements

DTO and query boundary tests should be added when:

- a public DTO gains or changes fields
- a participant DTO changes lesson/message visibility
- a tutor roster/student DTO changes shape
- a billing/admin DTO changes exposed fields
- a deletion/redaction flow affects DTO output
- a route starts reading from a new projection or query service

Useful tests:

- public DTO does not include private fields
- student and tutor lesson DTOs differ appropriately
- non-participant cannot receive conversation DTO
- delisted tutor returns not-public/not-found public behavior
- redacted message body does not appear in thread DTO
- billing DTO does not include raw provider payload

Do not test only that a repository was called.

Test the boundary shape and authorization behavior.

## 33. DTO Review Checklist

Before creating or changing a DTO, answer:

- Who is the audience?
- Which DTO class is it?
- Which route or feature consumes it?
- Which domain module owns it?
- Which source tables or projections feed it?
- Does it contain only fields the audience needs?
- Does it include any free text?
- Does it include student or minor-related data?
- Does it include public fields only if the public gate passes?
- Does it include payment, credential, moderation, meeting, or message data?
- Does it need cache invalidation when source data changes?
- Does deletion/redaction affect the DTO?
- Does it need an RLS, authorization, or test update?

If the answer is unclear, update this doc or the relevant source doc before implementation.

## 34. AI-Agent Implementation Rules

Agents should:

- classify each new route-facing shape as a DTO class
- keep Drizzle row types server-side
- put business queries in module-owned repositories and services
- make route pages call domain services/query functions
- return minimal DTOs from Server Actions
- keep public DTOs public-safe even if the route is server-rendered
- use participant-scoped DTOs for lessons and conversations
- use admin-scoped DTOs even for internal tools
- validate route/search params before querying
- update DTO tests when public, participant, billing, or admin boundaries change
- check retention/erasure impacts when adding DTO fields

Agents should not:

- pass raw table rows into client components
- import DB clients or Drizzle schema into client components
- hide business queries in page files
- use public projections as private match DTOs
- use matching projections as public browse DTOs
- expose raw scoring/debug fields without product approval
- copy private fields into metadata, JSON-LD, analytics, or search exports
- return full database records from Server Actions
- assume RLS removes the need for DTO shaping

## 35. Decisions To Lock Now

The system should lock the following decisions now:

- route-facing data must be DTO-safe
- DTOs are role/audience-specific and do not own source truth
- Drizzle row types stay server-side and internal
- domain services own DTO shaping and authorization
- repositories own query composition
- public DTOs are allowed to contain only public-safe approved fields
- participant DTOs are required for lessons and conversations
- admin/moderation tools still use scoped DTOs
- Server Actions return minimal operation results, not full rows
- projections feed DTOs but never replace authorization, retention, or source-of-truth decisions

## 36. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 37. Final Recommendation

Mentor IB should treat DTOs as a safety and product-consistency boundary, not just TypeScript convenience.

The clean operating model is:

- rows stay inside repositories
- services authorize and shape
- routes compose DTOs
- client components receive minimal serializable props
- public, student, tutor, participant, admin, provider, and export surfaces each get their own DTO class
- future search or API changes plug in behind the same query contract

That gives future AI agents a clear rule for every data surface: first identify the audience, then return only the data that audience is allowed to use.

## 38. Official Source Notes

The guidance above is aligned with current official documentation for:

- Next.js Server and Client Components: `https://nextjs.org/docs/app/getting-started/server-and-client-components`
- Next.js Data Security guide: `https://nextjs.org/docs/app/guides/data-security`
- Next.js `use server` directive and Server Function security posture: `https://nextjs.org/docs/app/api-reference/directives/use-server`
- Supabase Row Level Security: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Drizzle ORM select queries: `https://orm.drizzle.team/docs/select`
- Drizzle ORM `sql` template: `https://orm.drizzle.team/docs/sql`
