# Mentor IB Data Ownership Boundary Map v1

**Date:** 2026-04-09
**Status:** Standalone data-layer ownership map for domain modules, table families, source-of-truth boundaries, access boundaries, and projection ownership
**Scope:** canonical ownership of table families, mutation authority, read exposure, projection owners, source-of-truth precedence, and AI-agent-safe placement rules for new data facts

## 1. Why This Document Exists

Mentor IB now has a strong data-architecture pack, but future implementation agents still need a fast answer to one recurring question:

**Where does this data belong, and who owns it?**

Without a single ownership map, teams usually drift into:

- screen-owned tables
- route-owned queries
- duplicated facts across modules
- projections becoming write models
- public DTOs leaking private source tables
- AI agents adding "just one more field" to the wrong domain object

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it maps domain ownership to data ownership.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/drizzle-schema-and-query-conventions-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

It also inherits module boundaries from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the schema outline
- the RLS matrix
- the authorization matrix
- projection maintenance rules
- Drizzle query conventions

It maps them together.

If there is a conflict:

- table-family shape comes from `docs/data/database-schema-outline-v1.md`
- access rules come from `docs/data/auth-and-authorization-matrix-v1.md`
- RLS boundary type comes from `docs/data/database-rls-boundaries-v1.md`
- projection behavior comes from `docs/data/projection-maintenance-strategy-v1.md`
- implementation query ownership comes from `docs/data/drizzle-schema-and-query-conventions-v1.md`

## 4. Core Recommendation

Mentor IB should use a **domain-owned data model**:

1. every canonical fact has one source-of-truth owner
2. every table family has one primary domain owner
3. every projection has one source projection owner and no write authority
4. every route consumes domain services or DTOs, not raw cross-domain data by reflex
5. every new fact must be placed by ownership, not by the first screen that needs it

## 5. Ownership Dimensions

Each meaningful data surface should be understood through five dimensions.

## 5.1 Domain owner

The domain module that owns the product meaning.

Examples:

- `lessons`
- `conversations`
- `matches`
- `tutors`

## 5.2 Source-of-truth table family

The canonical write model that owns the fact.

Examples:

- message body -> `messages`
- lesson state -> `lessons`
- tutor public profile content -> `tutor_profiles`

## 5.3 Mutation authority

The service boundary allowed to create or change the fact.

Examples:

- lesson status changes -> lesson domain service
- message send -> conversation domain service
- public-listing intervention -> tutor/admin domain service

## 5.4 Read exposure boundary

Who can read it and through what shape.

Examples:

- public projection
- participant-scoped DTO
- owner-only route
- internal-only admin/moderation view

## 5.5 Projection owner

The module responsible for maintaining any derived read model.

Examples:

- tutor search projection -> tutors/discovery ownership
- matching projection -> matches ownership with tutor and availability inputs
- trust snapshot -> reviews/trust ownership

## 6. Source-Of-Truth Precedence

Use this precedence when a fact appears to belong in multiple places:

1. canonical write model owns original facts
2. relationship tables own structured many-to-many facts
3. snapshots own historical context only
4. projections own derived read performance, not truth
5. DTOs own delivery shape, not business truth
6. UI owns presentation, not domain state

## 6.1 Snapshot rule

Snapshot fields are allowed when historical meaning must remain stable.

Examples:

- lesson subject snapshot
- lesson focus snapshot
- lesson timezone snapshot

Snapshots should not become a second editable truth.

## 6.2 Projection rule

Projection tables are read models.

They should not be mutated by user-facing routes as if they were canonical source tables.

## 6.3 DTO rule

DTOs can combine and shape data, but they do not own state.

If a DTO needs a new fact, place that fact in the owning source table or projection first.

## 7. Boundary Labels Used In This Map

This map uses the approved RLS boundary types:

- `Type A`: public with explicit visibility rules
- `Type B`: authenticated user-owned or participant-owned
- `Type C`: internal-only operational data

It also uses these source labels:

- `canonical`: main source-of-truth write model
- `relationship`: structured link between canonical objects
- `snapshot`: immutable historical context
- `projection`: derived read model
- `provider`: external managed system or provider-owned source
- `internal`: operational support state

## 8. Reference And Taxonomy Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `subjects` | canonical reference | product/reference data | admin or migration/bootstrap path | public-safe where active |
| `subject_focus_areas` | canonical reference | product/reference data | admin or migration/bootstrap path | public-safe where active |
| `languages` | canonical reference | product/reference data | admin or migration/bootstrap path | public-safe where active |
| `meeting_providers` | canonical reference | product/reference data | admin or migration/bootstrap path | public-safe where active |
| `video_media_providers` | canonical reference | product/reference data | admin or migration/bootstrap path | public-safe where active |

Rules:

- reference data must not be duplicated as route-local constants
- labels can evolve, stable keys should not casually change
- forms and matching logic should use stable identifiers, not labels

## 9. Identity And Role Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `auth.users` | provider | Supabase Auth | Supabase Auth | server/auth integration only |
| `app_users` | canonical | accounts | auth resolution and account service | self, admin |
| `user_roles` | canonical | accounts | role/admin service | self inspection, admin |
| `student_profiles` | canonical | students | student profile service | self, admin, shaped tutor context |
| `tutor_profiles` | canonical | tutors | tutor profile service, admin listing service | owner, admin, public projection |

Rules:

- `auth.users` is referenced, not recreated
- `app_users` owns the application identity
- `user_roles` owns capability, not route visibility alone
- public tutor display must not read raw tutor profile rows casually

## 10. Tutor Capability, Credentials, And Public Profile Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `tutor_subject_capabilities` | relationship | tutors | tutor profile service | owner, admin, public-safe projection |
| `tutor_language_capabilities` | relationship | tutors | tutor profile service | owner, admin, public-safe projection |
| `tutor_credentials` | canonical/private evidence | tutors and trust review | tutor upload flow, admin review | owner limited, internal full, never public raw |
| intro video fields | canonical public media reference | tutors | tutor profile service | public only when approved/listable |

Rules:

- raw credentials are verification evidence, not public profile content
- public trust proof should be derived from reviewed evidence
- tutor intro videos use media-provider vocabulary, not meeting-provider vocabulary

## 11. Scheduling And Availability Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `schedule_policies` | canonical | availability | tutor availability service | owner, admin, shaped public/student output |
| `availability_rules` | canonical | availability | tutor availability service | owner, admin, shaped slot output |
| `availability_overrides` | canonical | availability | tutor availability service | owner, admin, shaped slot output |
| `tutor_availability_projection` | projection | availability | projection refresh path | public/student/matching only as shaped fields |

Rules:

- raw recurrence rules should not be a public API
- student-facing availability should be shaped into slot or summary output
- tutor operational timezone lives in `schedule_policies`

## 12. Learning Need And Matching Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `learning_needs` | canonical | learning-needs | student need service | owning student, admin, shaped downstream context |
| `match_runs` | canonical execution record | matches | match service | owning student, admin |
| `match_candidates` | canonical result record | matches | match service plus controlled student actions | owning student, admin, shaped downstream context |
| `tutor_matching_projection` | projection | matches | projection refresh path | server/matching, not public browse by default |

Rules:

- matching reads structured fields, not free text alone
- match candidates are first-class domain records
- tutor access to need context must come through authorized downstream objects

## 13. Lessons, Booking, And Meeting Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `lessons` | canonical | lessons | lesson service | lesson participants, admin |
| lesson snapshot fields | snapshot | lessons | lesson service at booking/update boundary | lesson participants, admin |
| `lesson_status_history` | canonical audit/history | lessons | lesson service | shaped participant history, admin |
| `lesson_meeting_access` | canonical access record | lessons | lesson service | lesson participants, admin |
| `lesson_reports` | canonical continuity record | lessons | tutor report service | tutor full, student only when shared, admin |
| `lesson_list_projection` | projection | lessons | projection refresh path | participant-scoped lists |

Rules:

- lesson state is owned by `lessons`
- external meeting links are lesson access records, not media assets
- historical lesson snapshots should not be overwritten by later profile edits

## 14. Messaging, Blocks, And Reports Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `conversations` | canonical | conversations | conversation service | participants, internal tools |
| `conversation_participants` | relationship/state | conversations | conversation service | participants, internal tools |
| `messages` | canonical | conversations | message send/edit/remove service | participants, limited moderation |
| `message_reads` | relationship/state | conversations | read-state service | self/participant scoped |
| `user_blocks` | canonical interaction rule | reports/trust with conversations input | block service | blocker, limited product disclosure, internal |
| `abuse_reports` | canonical trust intake | reports/moderation | report service | reporter limited, admin full |

Rules:

- message bodies live in `messages`
- notification side effects do not own the message fact
- reports are trust intake objects, not ordinary conversation metadata

## 15. Reviews, Trust, And Reliability Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `reviews` | canonical evidence | reviews | review service, moderation status service | published public-safe, reviewer, tutor shaped, internal |
| `tutor_reliability_events` | canonical internal signal | trust/reviews | system/admin service | internal only by default |
| `tutor_rating_snapshot` | projection | reviews/trust | projection refresh path | public-safe derived fields |
| `tutor_trust_snapshot` | projection | reviews/trust | projection refresh path | split public-safe and internal signals |

Rules:

- public rating is derived, not just a raw average field
- reliability events are not public raw data
- matching may use trust snapshots but should not directly leak internal trust signals

## 16. Notifications, Jobs, And Webhook Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `notifications` | canonical product object | notifications | notification service | owner, limited internal |
| `notification_deliveries` | internal delivery state | notifications | delivery worker/service | internal only |
| `job_runs` | internal operational state | platform/async | job runner/service | internal only |
| `webhook_events` | internal provider event receipt | platform/integrations | webhook route and processor | internal only |

Rules:

- notifications are product objects, not email-only side effects
- delivery records do not own notification meaning
- webhook events use verify-record-dispatch handling

## 17. Payments, Earnings, And Payout Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `payments` | canonical app payment record | billing | billing service and Stripe webhook processor | payer shaped, admin |
| `earnings` | canonical tutor earning record | billing | billing/lesson fulfillment service | tutor shaped, admin |
| `payout_accounts` | deferred provider-linked state | billing | payout service later | tutor/admin later |
| `payouts` | deferred provider-linked state | billing | payout service later | tutor/admin later |

Rules:

- Stripe owns provider payment state
- Mentor IB owns app-facing payment and lesson linkage
- payout automation remains deferred until in scope

## 18. Admin, Moderation, And Audit Ownership

| Data family | Source label | Domain owner | Primary mutation authority | Read exposure |
| --- | --- | --- | --- | --- |
| `tutor_application_reviews` | internal review record | tutors/admin | admin or approved reviewer service | internal, applicant only through shaped status |
| `moderation_cases` | internal case record | moderation | admin service | internal only |
| `moderation_case_events` | internal case timeline | moderation | admin service | internal only |
| `admin_action_logs` | internal audit record | admin/platform | system/server privileged flows | highly restricted internal |

Rules:

- internal notes are not public or user-facing by default
- applicant-visible status is a shaped output, not raw review notes
- privileged actions should leave audit records

## 19. Projection Ownership Map

| Projection | Primary owner | Source inputs | Read boundary | Notes |
| --- | --- | --- | --- | --- |
| `public_tutor_search_projection` | tutors/discovery | tutor profile, capabilities, public trust, public availability summary | Type A public-safe | future Algolia export source |
| `tutor_matching_projection` | matches | tutor capabilities, listability, trust, availability | server/internal matching | not a public browse surface by default |
| `tutor_availability_projection` | availability | schedule policies, rules, overrides, lessons | shaped public/student/matching | avoid expensive live overlap joins |
| `tutor_rating_snapshot` | reviews/trust | reviews | public-safe derived fields | stabilized aggregate |
| `tutor_trust_snapshot` | reviews/trust | reviews, reliability, credentials, moderation/listability | split public-safe/internal | do not leak raw signals |
| `lesson_list_projection` | lessons | lessons, meeting/report summary, participant state | participant-scoped | optional only if list SLO requires it |

Rules:

- projections are maintained by the owner module or an explicit projection refresh service
- projections must not become mutation sources
- public projections must contain only public-safe data

## 20. Route And Module Ownership Boundary

Routes compose data through domain services.

Routes should not own:

- table placement
- cross-domain joins
- business authorization
- projection refresh logic
- idempotency decisions

Domain modules own those decisions.

## 20.1 Route-to-module examples

| Route family | Primary modules |
| --- | --- |
| public tutor profile | tutors, reviews/trust, availability |
| match flow/results | learning-needs, matches, tutors, availability, reviews/trust |
| booking | lessons, matches, billing, notifications |
| messages | conversations, notifications, reports |
| tutor overview | tutors, lessons, availability, reviews/trust, notifications |
| tutor application | tutors, files, admin/review |
| internal moderation | moderation, reports, accounts |

## 21. Placement Rules For New Facts

When adding a new data fact, ask these questions in order:

1. What product object does this fact describe?
2. Is it original truth, relationship, snapshot, projection, provider state, or internal operational state?
3. Which domain module owns the mutation?
4. Who may read it directly?
5. Is a shaped DTO or projection needed instead of raw access?
6. Does it need history, idempotency, or auditability?
7. Does it belong in reference data, status glossary, config, or route copy instead of a table column?

If the answers are unclear, do not create the table or column yet.

Update the ownership model first.

## 22. AI-Agent Implementation Rules

Future AI agents should:

- place new fields by source-of-truth ownership, not screen convenience
- route mutations through the owning domain service
- consume projections as read models only
- keep public reads on public-safe DTOs or projections
- cite this map when introducing new table families
- update this map only when ownership meaning changes

Agents should not:

- create route-local schema islands
- mutate projection tables from UI flows
- duplicate a fact across canonical and snapshot columns without a clear historical reason
- expose raw private tables because the page needs a quick join
- treat provider records as if they were app-owned domain truth

## 23. Decisions To Lock Now

The system should lock the following decisions now:

- every data family has one primary domain owner
- projections are read models, not write models
- routes compose services; they do not own data placement
- public exposure must go through public-safe surfaces
- provider systems own provider truth, while Mentor IB owns app-facing linkage
- new data facts require an ownership decision before implementation

## 24. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 25. Final Recommendation

Mentor IB should use this document as the fast ownership lookup for future data work.

The practical outcome should be:

- one owner per fact
- one mutation authority per domain
- one public exposure path per public data family
- projections as controlled read models
- no route-owned schema sprawl

That gives humans and AI agents a clear placement model before implementation starts.
