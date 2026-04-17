# Mentor IB Projection SQL Patterns v1

**Date:** 2026-04-08
**Status:** Standalone data-layer implementation guide for the SQL shapes and update patterns used by maintained projections
**Scope:** projection tables, lightweight views, later materialized views, row identity, upsert posture, deletion posture, indexing patterns, freshness columns, and SQL anti-patterns for phase 1

## 1. Why This Document Exists

Mentor IB already approved:

- which projection families should exist
- when projections should be refreshed
- how projection maintenance relates to caching, rebuilds, and Algolia-readiness

What was still missing was the concrete SQL pattern layer.

Without an explicit SQL pattern guide, teams usually drift into:

- projection tables with inconsistent keys and freshness columns
- ad hoc JSON-heavy rows that are hard to query or export
- view-based hot paths that should have been maintained tables
- heavy trigger logic that becomes opaque
- inconsistent deletion versus ineligibility handling across projections

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how approved projections should be represented in SQL.

It is the direct companion to:

- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/database-schema-outline-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the projection strategy
- the migration rules
- the RLS boundary model
- the route/layout or app-cache architecture

It does not define:

- final file names for every SQL migration
- final helper function names
- the exact ORM wrappers around the SQL

Those can vary as long as they follow the patterns here.

## 4. Core Recommendation

Phase 1 should prefer dedicated projection tables for the approved hot surfaces and use SQL patterns that are:

- deterministic
- upsert-friendly
- indexable
- rebuildable
- exportable where needed

The main SQL rule is:

1. canonical tables remain normalized and authoritative
2. projection tables store derived read rows, not source-of-truth business facts
3. each projection row should have a clear entity key
4. targeted recompute should normally use deterministic `INSERT ... ON CONFLICT DO UPDATE`
5. public and internal projection surfaces should remain intentionally separate

## 5. Preferred Physical SQL Shapes

## 5.1 Pattern A: dedicated projection table

This is the preferred phase 1 pattern for:

- `public_tutor_search_projection`
- `tutor_matching_projection`
- `tutor_trust_snapshot`
- `tutor_availability_projection`

Use this when the surface needs:

- stable indexed columns
- targeted entity refresh
- version or freshness tracking
- future export compatibility

## 5.2 Pattern B: thin read view

Use a normal `view` only when:

- the derivation is cheap
- the surface is not the hot query bottleneck
- the view is mainly DTO shaping rather than heavy precomputation

Good examples:

- narrow internal convenience views
- public DTO views over already-maintained projection tables

Do not use a normal view as the default answer for heavy public search or matching.

## 5.3 Pattern C: materialized view later

Use a `materialized view` only when:

- periodic refresh is acceptable
- the read surface is more batch-like than interactive
- the refresh model is simpler than targeted table maintenance

For Mentor IB, this remains a later optimization tool, not the default phase 1 shape.

## 6. Canonical Projection Table Pattern

The default projection-table pattern should look like this conceptually:

```sql
create table public.some_projection (
  entity_id uuid primary key,
  -- query-friendly derived columns
  -- eligibility or visibility fields where relevant
  updated_at timestamptz not null default now()
);
```

That is intentionally simple. The important structural rules are below.

## 6.1 Row identity rule

Each projection row should have one clear identity key.

Preferred default:

- one row per primary business entity for that projection

Examples:

- one row per tutor in `public_tutor_search_projection`
- one row per tutor in `tutor_matching_projection`
- one row per tutor in `tutor_trust_snapshot`
- one row per tutor in `tutor_availability_projection`

Use a composite key only when the projection is truly multi-row by design.

Do not invent surrogate ids for projection rows when the business entity key is already the correct natural identity.

## 6.2 Column families

Projection tables should normally contain only these column families:

- entity key columns
- query columns used for filtering or ranking
- public or internal eligibility fields
- freshness or version fields
- narrow derived summary fields

Avoid adding:

- raw source payload blobs
- private text that the consumer does not need
- UI-only copy fragments that should stay in the application layer

## 6.3 Freshness columns

Maintained projection rows should normally include:

- `updated_at`

When version semantics matter, also include:

- a family-specific version or freshness marker

Examples:

- `matching_projection_version` where matching reuse depends on it
- optional source-derived freshness markers if they meaningfully help invalidation or debugging

## 6.4 Visibility and eligibility columns

Use explicit visibility or eligibility fields only when the consumer truly needs them.

Examples:

- public listability flags
- approval-derived availability for public discovery
- reliability or moderation-derived gating fields for internal matching support

Do not dump every raw status column from canonical tables into the projection.

## 7. Surface-Specific SQL Patterns

## 7.1 `public_tutor_search_projection`

Preferred shape:

- dedicated table
- one row per tutor

Preferred row posture:

- public-safe columns only
- optimized for browse filters, slug lookup support, and later search export

Recommended key columns:

- `tutor_profile_id`
- `public_slug`
- `is_publicly_listable`
- public subject and language query fields
- public trust summary fields
- public intro-video metadata fields if published
- public availability summary fields
- `updated_at`

Preferred eligibility posture:

- this surface may either contain only publicly listable tutors or contain a strict public-eligibility flag

For phase 1, the cleaner public-read pattern is:

- rows present only for publicly listable tutors when that does not complicate maintenance unreasonably

## 7.2 `tutor_matching_projection`

Preferred shape:

- dedicated table
- one row per tutor

Preferred row posture:

- internal or authenticated support surface
- ranking-friendly scalar fields
- no accidental public-read assumptions

Recommended columns:

- `tutor_profile_id`
- eligibility gates needed by matching
- subject and focus coverage fields
- language fields
- trust snapshot fields needed by ranking
- reliability fields needed by ranking
- availability helper fields needed by matching
- `matching_projection_version`
- `updated_at`

## 7.3 `tutor_trust_snapshot`

Preferred shape:

- dedicated table
- one row per tutor

Recommended columns:

- `tutor_profile_id`
- public rating summary
- eligible review count
- review recency indicators
- approved proof indicators
- reliability summary indicators
- public or internal gating flags that downstream consumers need
- `updated_at`

Do not store:

- raw review text
- raw review moderation notes
- raw case evidence

## 7.4 `tutor_availability_projection`

Preferred shape:

- dedicated table
- one row per tutor

Recommended columns:

- `tutor_profile_id`
- next-available summary fields
- urgency-overlap helper fields
- recurring-overlap helper fields where needed
- public-safe availability summary fields if reused by discovery
- `updated_at`

Do not store:

- raw recurring schedule definitions unless that is genuinely the query surface
- direct copies of every override row

## 8. Upsert Pattern

The default targeted refresh pattern for dedicated projection tables should be:

```sql
insert into public.some_projection (...)
select ...
from ...
where ...
on conflict (entity_id) do update
set ...
```

Use this pattern when:

- one entity or slice is being refreshed
- the projection row is deterministic from canonical state
- the result should overwrite stale derived values

Why this is the preferred default:

- readable
- idempotent enough for repeat refreshes
- easy to review
- compatible with targeted recompute

## 8.1 Source CTE pattern

For non-trivial projection queries, prefer:

```sql
with source as (
  select ...
)
insert into ...
select ...
from source
on conflict (...) do update
set ...
```

This keeps the derivation readable and reviewable.

## 8.2 Narrow update rule

When using `ON CONFLICT DO UPDATE`, update only the columns that belong to the derived row contract.

Do not hide unrelated side effects inside the same statement.

## 9. Delete Versus Ineligibility Patterns

Projection rows can disappear for two different reasons:

- the source entity is gone
- the entity still exists but is no longer eligible for that projection surface

The SQL posture should vary by projection type.

## 9.1 Public-export or public-read projection rule

For surfaces like `public_tutor_search_projection`, the cleaner default is:

- row absent when the tutor is no longer publicly eligible

Why:

- simpler public-read boundary
- simpler export contract
- less risk of accidental public exposure of a non-listable tutor row

## 9.2 Internal support projection rule

For internal helper projections like `tutor_matching_projection`, it can be reasonable to keep the row and carry explicit eligibility flags when that improves debugging or refresh simplicity.

Choose one posture deliberately and keep it consistent.

## 9.3 Hard-delete rule

If the canonical source entity is deleted or fully archived beyond the projection's purpose, the projection row should be deleted or rebuilt away accordingly.

Do not leave permanent orphan projection rows.

## 10. Indexing Patterns

## 10.1 Main rule

Projection tables exist partly so queries can hit stable indexed columns.

If a projection table is created for a hot query path, index review is part of correctness.

## 10.2 Good default index posture

Prefer:

- primary key on the entity id
- btree indexes on hot scalar filter columns
- composite indexes only where the access pattern clearly benefits
- partial indexes where public or eligible subsets are the hot path

## 10.3 Public discovery examples

Examples that may justify indexes:

- `public_slug`
- public listability field
- frequently filtered subject fields
- frequently filtered language fields

## 10.4 Matching examples

Examples that may justify indexes:

- matching-eligibility field
- subject coverage fields
- language requirement fields
- public or operational gating fields used before weighted ranking

## 10.5 Anti-pattern

Do not create indexes reactively on every projection column.

Indexes should map to real hot filters, joins, or sort paths.

## 11. JSON And Array Patterns

## 11.1 Main rule

Projection rows should prefer stable scalar columns for hot filters and ranking inputs.

## 11.2 Acceptable usage

Arrays or JSON may be acceptable when:

- the field is truly summary data
- it is not the primary indexed filter path
- the representation improves export or debugging without becoming the only query path

## 11.3 Anti-pattern

Do not build projections as one large JSON blob and then hope application code will parse it later for filtering.

That defeats the purpose of the projection layer.

## 12. View Patterns

## 12.1 Safe usage

Use a normal view when:

- it is cheap
- it is mainly a readable join surface
- the result is not the main latency bottleneck

## 12.2 Security review rule

If the view lives in an exposed schema, review it as a real access surface.

Do not assume a view is safe because it is "just a select."

## 12.3 Replace-view caution

If a view is replaced with `CREATE OR REPLACE VIEW`, remember that the resulting column contract still needs compatibility awareness.

Do not break downstream consumers casually.

## 12.4 Public-view caution

Public DTO views are acceptable, but they should usually sit over already-curated projection tables or other public-safe sources, not over sprawling raw canonical joins.

## 13. Materialized View Patterns

## 13.1 When they fit

Materialized views fit best when:

- full or scheduled refresh is acceptable
- the surface is read-mostly
- targeted row-by-row maintenance is not required in phase 1

## 13.2 Refresh caution

Materialized views are not self-updating.

If one is used, the refresh trigger and operational cadence must be explicit.

## 13.3 Phase 1 rule

Do not reach for materialized views first when a dedicated projection table plus targeted upsert is the cleaner fit.

## 14. Trigger Patterns

## 14.1 Acceptable trigger use

Triggers are acceptable for:

- narrow dirty marking
- cheap freshness updates
- enqueueing or recording that a projection family needs refresh

## 14.2 Heavy-work anti-pattern

Do not put heavy multi-join projection recomputation directly into triggers by default.

That makes behavior harder to review, retry, and reason about.

## 15. Projection Builder Query Pattern

For non-trivial projection maintenance, structure the SQL in this order:

1. source rows
2. derived scalar columns
3. eligibility or gating columns
4. final upsert or delete decision

This keeps the projection query readable.

Good builder posture:

- clear CTE names
- explicit column lists
- obvious eligibility logic

Bad builder posture:

- nested unreadable subqueries with no column naming discipline
- `select *`
- hidden business meaning in cryptic expressions

## 16. Public Search Export Pattern

If Mentor IB later exports public discovery data to Algolia or another external index, the SQL contract should be:

- `public_tutor_search_projection` is the canonical export surface

That means its SQL shape should stay:

- stable
- public-safe
- query-friendly
- export-friendly

Do not contaminate it with internal-only ranking fields just because matching also uses some similar inputs elsewhere.

## 17. Rebuild SQL Posture

Every projection must be rebuildable from canonical tables.

The SQL posture should support:

- targeted entity rebuild
- family-level rebuild
- full rebuild

That means:

- builder queries should not depend on transient app memory
- rebuild logic should not require hidden manual steps
- projection rows should be replaceable safely

## 18. AI-Agent Implementation Rules

Agents should:

- default to dedicated projection tables for the approved phase 1 hot surfaces
- use deterministic upsert SQL for targeted recompute
- keep projection tables scalar and index-friendly
- review delete versus ineligibility behavior explicitly
- review exposed views under the same boundary discipline as tables
- keep `public_tutor_search_projection` export-clean

Agents should not:

- create random surrogate ids for projection rows without a reason
- hide hot filters inside JSON blobs
- use views for heavy search or matching paths by default
- put large recomputation logic in triggers
- mix unrelated side effects into projection upserts

## 19. Decisions To Lock Now

The system should lock the following decisions now:

- dedicated projection tables are the default SQL shape for phase 1 hot projections
- targeted refresh should normally use deterministic upsert SQL
- public search projection stays public-safe and export-ready
- matching projection stays non-public by default
- scalar index-friendly columns are preferred over opaque blobs
- heavy recomputation belongs in explicit refresh paths, not large trigger bodies

## 20. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 21. Final Recommendation

Mentor IB should implement projections with a small, consistent SQL pattern family:

- dedicated projection tables for hot read surfaces
- deterministic per-entity upserts for refresh
- selective views for cheap read shaping
- materialized views only later when their refresh tradeoff is truly worth it

That gives the product a projection layer that is fast, reviewable, rebuildable, and easy for future AI agents to extend without inventing new local conventions every time.

## 22. Official Source Notes

The guidance above is aligned with current official documentation for:

- PostgreSQL `CREATE VIEW`: `https://www.postgresql.org/docs/current/sql-createview.html`
- PostgreSQL `CREATE MATERIALIZED VIEW`: `https://www.postgresql.org/docs/current/sql-creatematerializedview.html`
- PostgreSQL `CREATE INDEX`: `https://www.postgresql.org/docs/current/sql-createindex.html`
- PostgreSQL `INSERT`: `https://www.postgresql.org/docs/current/sql-insert.html`
- Supabase query optimization: `https://supabase.com/docs/guides/database/query-optimization`
- Supabase Postgres triggers: `https://supabase.com/docs/guides/database/postgres/triggers`
