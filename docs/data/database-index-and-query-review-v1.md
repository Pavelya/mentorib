# Mentor IB Database Index And Query Review v1

**Date:** 2026-04-09
**Status:** Standalone data-layer review document for database indexes, query shape, hot-path query review, projection-backed access, query plans, and scaling thresholds
**Scope:** when to add indexes, how to review query patterns, which query surfaces are hot, how to use projections before over-indexing raw tables, how to avoid slow matching/search/list views, and AI-agent implementation rules

## 1. Why This Document Exists

Mentor IB depends on fast query experiences:

- public tutor discovery
- guided matching
- match-result refinement
- tutor student management
- lesson lists and dashboards
- conversation lists
- profile and slug lookups
- admin/moderation lookup later

The approved architecture already sets explicit query-performance expectations.

Without an index and query review document, future implementation can drift into:

- raw multi-table joins on every search request
- slow matching caused by repeated availability joins
- route-owned SQL that bypasses domain query services
- indexes added to every column without a real access pattern
- missing composite or partial indexes on hot public/listable subsets
- JSON-heavy projection rows that cannot be filtered efficiently
- later search-infrastructure adoption because the first SQL version was poorly shaped

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because indexes, query shape, query plans, and projection access are database-layer concerns.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/drizzle-schema-and-query-conventions-v1.md`
- `docs/data/database-test-conventions-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/sql-function-and-trigger-boundaries-v1.md`

It inherits product query expectations from:

- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/search-platform-decision-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- final physical schema design
- final table-by-table index declarations
- final SQL query text
- final Drizzle repository implementation
- final search infrastructure decision
- production observability setup

It defines the review posture and query/index boundary that future implementation should follow.

If there is a conflict:

- route and query-surface behavior comes from `docs/architecture/search-and-query-architecture-v1.md`
- query SLOs come from `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- projection shape comes from `docs/data/projection-sql-patterns-v1.md`
- migration rules come from `docs/data/migration-conventions-v1.md`
- repository ownership comes from `docs/data/drizzle-schema-and-query-conventions-v1.md`
- search-platform escalation comes from `docs/architecture/search-platform-decision-v1.md`

## 4. Core Recommendation

Mentor IB should use **access-pattern-driven indexing over query-friendly projections**, not broad reactive indexing over raw normalized tables.

The practical rule is:

1. identify the query surface and SLO
2. confirm the query reads from the correct domain-owned service/repository
3. prefer an approved projection or read model for hot discovery, matching, and operational lists
4. add indexes that match real filters, joins, ordering, uniqueness, and pagination patterns
5. validate important hot queries with query-plan review
6. avoid adding indexes that do not map to an actual query

Performance is not a later polish item for Mentor IB.

If a route is part of matching, search, messaging, lessons, or tutor operations, query speed is part of the product contract.

## 5. Query Review Classification

Every non-trivial query should be classified before index decisions are made.

## 5.1 Class A: hot public discovery query

Examples:

- public tutor browse
- public tutor slug lookup
- public results refinement over listable tutors

Default posture:

- query public-safe projection rows
- use public/listable partial indexes where helpful
- keep result columns narrow
- avoid raw profile joins
- avoid private operational fields

## 5.2 Class B: guided matching query

Examples:

- first candidate retrieval for a `LearningNeed`
- match-result refinement
- availability-fit helper lookup

Default posture:

- query matching projections and helper surfaces
- use indexed hard-filter fields before app-layer scoring
- avoid recomputing full availability overlap from raw rules on each request
- use match-result caching when effective inputs and projection versions are unchanged

## 5.3 Class C: participant operational list query

Examples:

- student's lessons list
- tutor's students list
- tutor's lesson requests
- conversation list

Default posture:

- filter by participant/owner scope first
- index participant foreign keys and status/sort paths
- paginate by stable ordering
- avoid full-message-body or whole-history scans in phase 1

## 5.4 Class D: admin/moderation query

Examples:

- moderation queue
- report lookup
- tutor approval review
- audit lookup

Default posture:

- keep access server-owned and policy-reviewed
- index queue status and created/updated timestamps when these queues become active
- avoid exposing internal lookup paths to public/student/tutor routes

## 5.5 Class E: background job or projection maintenance query

Examples:

- job claim query
- projection refresh target lookup
- provider event replay query
- dirty projection sweep

Default posture:

- index job state, scheduled time, and dedupe keys
- make retry/claim queries selective
- avoid scan-heavy maintenance loops on hot tables
- keep rebuild queries explicit and observable

## 6. Query Surface SLO Mapping

Use the approved SLOs from `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`.

Summary:

| Query surface | Server query target | User-visible target |
| --- | --- | --- |
| Public browse search | `p95 <= 700ms` | normally `<= 1200ms` |
| Guided matching | `p95 <= 1200ms` | normally `<= 1800ms` |
| Match refinement | `p95 <= 600ms` | normally `<= 1000ms` |
| Operational filtering | `p95 <= 500ms` | normally `<= 900ms` |

Use these as review gates.

If a query shape makes these targets implausible, the right response is not:

- "we will optimize later"
- "the MVP data set is small"
- "Vercel will cache it"

The right response is:

- review the query shape
- review projection shape
- review indexes
- review pagination
- review cache/invalidation boundaries
- only then reconsider infrastructure

## 7. Index Decision Rule

Add an index when there is a clear access pattern.

Good reasons:

- a column is used often in selective `where` clauses
- a foreign key is used in joins or scoped lookups
- a query filters by one or more columns and orders by another predictable column
- a partial subset is the real hot path
- a uniqueness rule needs database enforcement
- a projection table exists specifically for fast filtering/ranking
- pagination needs stable ordered access

Bad reasons:

- "this column might be searched someday"
- "indexes make things faster"
- "every foreign key automatically needs an index even if never queried"
- "a UI component displays this value"
- "an index advisor suggested a single-column index without context"
- "the table is important"

Indexes are not free.

They can improve reads but add write overhead, storage cost, and migration complexity.

## 8. Default Index Type Posture

Use simple index types first.

## 8.1 B-tree

Default for:

- equality filters
- range filters
- ordered pagination
- most foreign-key lookups
- status plus timestamp list queries
- slug lookup

This should be the default MVP index type unless a query clearly needs another structure.

## 8.2 GIN

Use when a reviewed query genuinely needs:

- full-text search over a `tsvector`
- array containment at scale
- JSON containment where JSON is justified and not hiding relational fields

For Mentor IB, GIN should be deliberate, not automatic.

## 8.3 Trigram indexes

Use `pg_trgm` only where light typo tolerance is an approved product behavior.

Good candidate:

- public discovery text query over a curated search document or public display field

Bad candidate:

- arbitrary private profile text
- whole-message-body search in phase 1
- every name/text column

## 8.4 BRIN

Consider later for very large append-heavy time-series-like tables.

Possible later candidates:

- audit logs
- event logs
- job run history

For MVP, B-tree is usually simpler unless table volume and access pattern justify BRIN.

## 9. Composite Index Rule

Composite indexes should reflect actual query predicates and ordering.

Good candidates:

- `participant_id, last_message_at desc`
- `tutor_id, starts_at desc`
- `student_id, starts_at desc`
- `status, available_from`
- `is_publicly_listable, subject_key, updated_at desc`

Review:

- are leading columns used by the hot query
- does the query use equality filters before range/order columns
- does the index match the intended ordering
- would two simpler indexes be clearer
- is the table write-heavy enough that this index is costly

Do not create composite indexes as speculative bundles of every visible filter.

## 10. Partial Index Rule

Partial indexes are preferred when the hot query uses a stable subset.

Good candidates:

- public listable tutor profiles
- active or pending lessons
- unread/open conversation items
- unprocessed provider events
- due background jobs
- visible moderation queue items

Example concept:

```sql
create index some_public_projection_idx
on public.some_projection (subject_key, updated_at desc)
where is_publicly_listable = true;
```

The exact SQL should be finalized during implementation.

Review:

- is the partial predicate stable
- does the query include the same predicate
- does the partial predicate encode product visibility safely
- will status transitions keep the index useful
- does this need a matching RLS or projection review

## 11. Unique Index And Constraint Rule

Use unique indexes or constraints when the database must enforce uniqueness.

Good candidates:

- one public slug per tutor profile
- one account row per auth user
- one active tutor profile per account, if that remains a product rule
- idempotency keys in a scoped operation family
- provider event unique identity
- one projection row per entity when using projection tables

Review:

- is uniqueness global or scoped
- do `null` values matter
- is uniqueness a product rule or only a UI assumption
- does backfill or import data need cleanup before enforcement
- will a future soft-delete/archive state need a partial unique rule

Do not rely on application checks alone when duplicates would damage security, billing, scheduling, or idempotency.

## 12. Foreign-Key Lookup Rule

Foreign keys are product relationships.

They are not always query paths by themselves.

Index foreign-key columns when they are used for:

- participant-owned list queries
- parent-child joins in hot paths
- cascade/restrict checks at meaningful scale
- maintenance sweeps
- projection rebuilds
- authorization predicates

Likely phase 1 candidates:

- `auth_user_id` mapping lookup
- `tutor_profile_id` on tutor-owned children
- `student_account_id` or equivalent participant columns on lessons
- `conversation_id` on messages
- `participant_account_id` on conversation participants
- `lesson_id` on meeting/calendar/report children

Do not mechanically index every relationship until its access path is clear.

## 13. Public Discovery Query Review

Public tutor discovery should not query raw tutor presentation tables with repeated joins.

Preferred source:

- `public_tutor_search_projection` or equivalent public-safe discovery projection

Likely indexed fields:

- `public_slug`
- public listability/eligibility
- subject/component keys used by browse filters
- language keys used by browse filters
- public trust/listing quality gate
- public availability summary fields used by browse sorting
- optional curated text-search document if implemented

Review:

- is every returned field public-safe
- is the query paginated
- are filters structured
- does text query run over curated public fields only
- are non-indexable personalized result states kept out of SEO routes
- could this query later be backed by Algolia without changing the UI contract

Do not index private tutor notes, raw credential evidence, moderation flags, or internal matching-only fields into the public discovery surface.

## 14. Matching Query Review

Matching should be fast because the candidate set is narrow and query-friendly before scoring starts.

Preferred source:

- `tutor_matching_projection`
- `tutor_trust_snapshot`
- `tutor_availability_projection`
- approved helper projections or derived read models

Likely indexed fields:

- matching eligibility
- subject/component coverage keys
- language capability keys
- availability horizon/overlap summary fields
- moderation/reliability gating fields used as hard filters
- projection freshness/version fields when cache reuse depends on them

Review:

- are hard filters applied before weighted scoring
- does the query avoid full availability recomputation
- does it use projection-backed structured fields
- does it avoid public projection fields that lack internal match signals
- does cache reuse work when `need_signature`, `ranking_version`, and `matching_projection_version` are unchanged
- is the match-result persistence path clear

Do not solve matching by adding random indexes to raw schedule and profile tables while still recomputing expensive join graphs per request.

## 15. Availability Query Review

Availability is a known expensive area.

For MVP, direct availability rules may be sufficient for tutor setup and schedule management.

For matching and public discovery, avoid repeated raw availability expansion on every request.

Preferred posture:

- use query-friendly availability summaries
- precompute or cache overlap-ready helpers for matching horizon
- use stable indexed columns for "can help soon" or next-available summaries where product behavior needs them

Review:

- is this a setup/admin query or a hot matching/search query
- does the query expand recurring rules repeatedly
- does it account for timezone in one consistent model
- does it need a projection refresh trigger or job
- does the index support the actual time-window filter

## 16. Lesson And Booking Query Review

Lesson and booking queries are participant-scoped operational surfaces.

Likely indexed fields:

- student participant id plus `starts_at`
- tutor participant id plus `starts_at`
- lesson status plus `starts_at`
- booking/request status plus `created_at` or `updated_at`
- meeting link or provider linkage only if used for lookup, not just display

Review:

- is the query always scoped by participant or admin role
- does it paginate by stable time ordering
- does it avoid loading all historical lessons by default
- does it avoid joining meeting/calendar/report data unless needed
- is the visibility rule mirrored by RLS or server-side authorization

## 17. Conversation And Message Query Review

Messaging MVP should optimize conversation lists and recent messages, not whole-message search.

Likely indexed fields:

- conversation participant account id
- conversation last message timestamp
- conversation status/archive fields
- message conversation id plus created timestamp
- unread marker fields if maintained

Review:

- does the list query start from participant scope
- is the most recent message lookup bounded
- are message pages cursor-paginated
- does the query avoid scanning message bodies
- does Realtime subscription scope match canonical participant access

Do not add full-message-body search indexes in phase 1 unless the product requirement changes.

## 18. Tutor Operations Query Review

Tutor-side operations need fast lists but should not become a second product architecture.

Likely indexed fields:

- tutor id plus student relationship status
- tutor id plus lesson/request status
- tutor id plus starts_at
- tutor id plus updated_at for recent operational changes

Review:

- is the query scoped to the tutor first
- does it reuse the same lesson/student objects as the student side
- does it avoid separate tutor-only table sprawl
- does it rely on shared components/DTOs where appropriate

## 19. Admin And Moderation Query Review

Admin and moderation queries are internal, but they still need performance review when queues become active.

Likely indexed fields:

- moderation case status plus priority/created_at
- report status plus created_at
- tutor approval status plus submitted_at
- audit actor id plus created_at
- affected entity id plus created_at

Review:

- is the query server-owned
- is access limited to the right role/capability
- is pagination required
- does the query avoid unrestricted public/user lookup paths
- does the query need an audit trail rather than direct table reads

## 20. Projection Index Review

Projection tables exist to make hot queries simple.

Every maintained projection table should have an index review when it is introduced or changed.

For each projection, answer:

- what is the primary lookup key
- what are the hot filters
- what are the hot sort orders
- what is the public/private exposure boundary
- what query surface depends on it
- what update frequency will it have
- what write overhead is acceptable

Rules:

- primary key on projection entity id unless a different identity is intentional
- partial indexes for public/listable/eligible subsets where appropriate
- scalar query columns before JSON blobs
- no index on every projection column
- no public indexes over private facts

## 21. Text Search And Typo Tolerance Review

Mentor IB is not a generic search product in MVP.

Text search should remain controlled.

Allowed in phase 1:

- exact/partial public discovery query over curated fields
- light typo tolerance over public discovery fields if implemented deliberately
- simple scoped operational filters by visible person/context labels

Not phase 1:

- global omnibox
- whole-message-body search
- semantic tutor search
- vector retrieval
- arbitrary private text search

If using Postgres full-text search:

- use a reviewed public-safe `tsvector` or generated search document
- use GIN where the query is frequent enough
- keep language and dictionary behavior deliberate

If using `pg_trgm`:

- limit it to reviewed public discovery or narrow operational labels
- tune thresholds deliberately
- avoid applying it broadly to every text field

## 22. Pagination And Sorting Review

Every list query should have a stable ordering and pagination strategy.

Preferred:

- cursor or keyset-style pagination for growing lists
- stable timestamp plus id tie-breaker where needed
- narrow select lists
- ordered indexes for common dashboards and messages

Avoid:

- unbounded `select *`
- loading all lessons or messages into memory
- offset-only pagination on lists expected to grow significantly
- sorting in application code after fetching too many rows

For MVP, offset pagination may be acceptable on tiny bounded reference lists.

For lessons, messages, tutor/student operational lists, and discovery results, design as if growth will happen.

## 23. Query Shape Anti-Patterns

Avoid:

- route-owned raw SQL for business queries
- `select *` in repository methods serving UI routes
- live join graphs across many domains for hot search/matching requests
- repeated availability expansion on every match query
- filtering large result sets in application memory
- indexing JSON instead of modeling hot filter fields relationally
- indexes added without a named query surface
- unbounded list queries
- query code that silently bypasses RLS or DTO boundaries
- using a search vendor to hide poor internal query boundaries

## 24. Query Plan Review

Use query-plan review for hot or risky queries.

Require plan review when:

- a new public discovery query is introduced
- a new guided matching query is introduced
- a list query can grow with lessons, messages, or users
- a query adds a new join across multiple table families
- a migration introduces a new index for a hot path
- a performance issue is suspected

Look for:

- unexpected sequential scans on large or growing tables
- row estimates that are wildly off
- expensive sorts
- repeated nested loops over large sets
- filters applied after broad joins
- missing index usage on selective predicates
- query plans that depend on tiny seed-data volumes

Plan review is evidence, not a ritual.

If an index does not improve the query plan for the real access pattern, do not keep it just because it sounds useful.

## 25. Supabase Advisor Posture

Supabase `index_advisor` and Query Performance tooling can help, but they do not replace product review.

Use them for:

- spotting missing simple B-tree indexes
- checking individual query patterns
- validating that obvious query filters are not unsupported
- supporting investigation when SLOs are missed

Do not use them as:

- an automatic migration generator
- a substitute for composite or partial-index reasoning
- proof that every suggested index belongs in production
- a reason to bypass the query-surface contract

Important limitation:

- advisor output is one input into the review, not the complete product/data decision.

## 26. Migration Requirements

Index changes must follow the migration conventions.

Rules:

- create indexes through reviewed SQL migrations
- name indexes consistently and readably
- include the related query surface in the migration or PR explanation
- prefer additive index changes before relying on the query at scale
- consider production lock behavior for large tables
- use concurrent index creation where production scale and migration tooling allow it
- remove unused speculative indexes rather than keeping bloat

Review:

- can the index be created safely with existing data volume
- does it enforce uniqueness or only improve reads
- does it need a matching constraint
- does it need a backfill or data cleanup first
- does it affect write-heavy tables

## 27. Testing Requirements

Index correctness is partly performance, but query correctness still needs tests.

Test when:

- query filtering changes visible search/match results
- public/private exposure boundaries are affected
- sorting or pagination behavior changes
- matching candidate hard filters change
- lesson/message list scoping changes
- admin/moderation queue behavior changes
- a projection source or refresh path changes

Useful tests:

- repository query tests with realistic fixture data
- database tests for RLS-sensitive query behavior
- projection refresh tests for hot read models
- pagination boundary tests
- basic plan/smoke review for high-risk SQL if the team adopts a repeatable workflow

Do not write tests that only confirm a mocked repository was called.

## 28. Observability And Incident Hooks

Slow query behavior should be visible.

Important signals:

- public browse query latency
- guided matching query latency
- match refinement latency
- lesson list latency
- conversation list latency
- projection refresh lag
- repeated cache misses for identical match signatures
- slow database queries from Supabase/Postgres tooling

Treat as investigation triggers:

- public browse repeatedly missing `p95` targets
- first match result repeatedly above the approved user-visible budget
- repeated expensive availability joins
- query latency hidden by a loading animation
- sudden write latency after adding indexes to hot tables

## 29. AI-Agent Implementation Rules

Agents should:

- classify the query surface before changing indexes
- prefer query-friendly projections for hot search/matching paths
- tie every new index to a named query or constraint
- keep query composition in domain repositories/services
- avoid route-owned database logic
- review RLS and DTO exposure for public or participant queries
- use `EXPLAIN` or advisor tooling when a hot query needs evidence
- keep projection columns scalar and filterable when they are hot
- document why a composite, partial, GIN, trigram, or BRIN index is needed
- remove speculative indexes if they do not support real access patterns

Agents should not:

- index every column
- add vendor search before fixing query shape
- build matching from raw presentation text
- scan messages or lessons without participant scope
- filter large query results in application memory
- add public search indexes over private data
- hide slow queries behind generic route caching
- assume seed-data performance represents production behavior

## 30. Decisions To Lock Now

The system should lock the following decisions now:

- index review is part of database correctness for hot product paths
- public discovery and matching should read from query-friendly projections
- matching should not recompute expensive availability joins on every request
- indexes must map to real filters, joins, sort orders, uniqueness rules, or pagination paths
- partial indexes are preferred for stable hot subsets such as public/listable rows or due jobs
- text-search and trigram indexes are deliberate product decisions, not default behavior
- Supabase advisor tooling can inform review but should not automatically define migrations
- external search is not a substitute for clean query contracts

## 31. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 32. Final Recommendation

Mentor IB should treat database query speed as a product and data-model design constraint.

The clean operating model is:

- query surfaces are named and scoped
- hot paths use projections or helper read models
- indexes are added for real access patterns
- query plans are reviewed for risky paths
- operational search stays scoped
- matching remains internal and projection-backed
- external search remains an optional public-browse scaling tool, not a rescue for poor SQL boundaries

That gives the MVP a fast Postgres-first path while preserving the option to evolve search infrastructure later without rewriting the UX contract.

## 33. Official Source Notes

The guidance above is aligned with current official documentation for:

- PostgreSQL indexes: `https://www.postgresql.org/docs/current/indexes.html`
- PostgreSQL `CREATE INDEX`: `https://www.postgresql.org/docs/current/sql-createindex.html`
- PostgreSQL `EXPLAIN`: `https://www.postgresql.org/docs/current/using-explain.html`
- PostgreSQL full-text search indexes: `https://www.postgresql.org/docs/current/textsearch-indexes.html`
- PostgreSQL `pg_trgm`: `https://www.postgresql.org/docs/current/pgtrgm.html`
- Supabase query optimization: `https://supabase.com/docs/guides/database/query-optimization`
- Supabase `index_advisor`: `https://supabase.com/docs/guides/database/extensions/index_advisor`
