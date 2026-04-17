# Mentor IB Projection Maintenance Strategy v1

**Date:** 2026-04-08
**Status:** Standalone data-layer strategy for projection ownership, physical shape, refresh rules, invalidation, and rebuild posture
**Scope:** public search projections, matching projections, trust snapshots, availability helpers, optional operational list projections, and the maintenance rules that keep them accurate without turning them into a second write model

## 1. Why This Document Exists

Mentor IB already approved a normalized relational write model plus a small projection layer for search, matching, trust, and list performance.

What was still missing was the maintenance contract:

- which projections should exist in phase 1
- which physical form each projection should use
- when a projection should be refreshed
- how projection changes should invalidate caches and matching reuse
- how to avoid projection sprawl and duplicated logic

Without an explicit projection-maintenance strategy, teams usually drift into one of two bad patterns:

- they query raw canonical tables with expensive joins on every hot request
- they create many ad hoc derived tables that become a second source of truth

This document exists to prevent both.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how canonical write-model data is translated into query-oriented read surfaces.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`

It also inherits constraints from:

- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the canonical relational schema
- the RLS boundary model
- the search/query product contract
- the matching/ranking rules
- the runtime SLOs

It does not define:

- exact SQL migrations
- exact trigger bodies
- exact background-job framework code
- exact cache helper function names

Those should come later in implementation-facing artifacts.

## 4. Core Recommendation

Mentor IB should use one normalized write model plus a small number of explicit maintained projections.

The main rule is:

1. canonical tables own the truth
2. projections exist only for hot query surfaces or public-safe DTO surfaces
3. every projection must be reproducible from canonical data
4. projection updates should be incremental by affected entity where possible
5. full rebuilds should be the exception, used for backfills, recovery, or versioned re-shapes

The default physical strategy should be:

1. use a `view` when the derivation is simple and performance is already good
2. use a dedicated projection table when the surface is hot, query-heavy, versioned, or needs per-entity maintenance
3. use a `materialized view` only when periodic refresh is acceptable and the refresh model is simpler than maintaining a table

For phase 1, the preferred default is not "everything as views" and not "everything as materialized views."

The preferred default is:

- canonical write tables
- a few dedicated projection tables for hot or versioned read paths
- views only where they remain cheap and clear

## 5. Projection Definition Rules

A projection in Mentor IB is a derived read surface with a narrow purpose.

A projection must:

- have one clear consumer family
- have one clear input family
- be reproducible from canonical state
- avoid storing private data that the consumer does not need
- avoid becoming the only place where a business fact exists

A projection must not:

- become the write source for the domain
- contain hidden policy logic that disagrees with the canonical domain rules
- carry irreversible state that cannot be rebuilt from canonical tables
- expand just because one page wants convenience fields

## 6. Approved Projection Families

Phase 1 should treat the following as the canonical projection set.

## 6.1 `public_tutor_search_projection`

Purpose:

- fast public browse/search surface
- future export surface if public browse search later gains an external index

Recommended physical shape:

- dedicated projection table

Why:

- public browse is a hot surface
- it benefits from stable query-friendly columns
- it is the cleanest future handoff surface for Algolia or another public search index if ever adopted later

Should include only:

- public-safe tutor identity and slug fields
- public-safe subject and language coverage
- public-safe trust proof and rating summary
- public intro video metadata if published
- lightweight availability summary fields
- listability flags required for public eligibility

Should never include:

- raw credential evidence
- raw moderation data
- raw reliability event history
- private lesson context
- internal-only ranking fields

## 6.2 `tutor_matching_projection`

Purpose:

- structured matching and ranking input surface

Recommended physical shape:

- dedicated projection table

Why:

- matching needs stable query-friendly fields
- matching reuse depends on projection versioning
- ranking should read from normalized derived signals, not recompute heavy joins repeatedly

Should include:

- eligibility and listability gates needed by the matching flow
- subject and focus coverage
- language support
- trust snapshot fields needed for ranking
- reliability snapshot fields needed for ranking
- availability-helper fields needed for overlap and urgency checks

Should not be treated as:

- a public browse surface
- a replacement for canonical tutor tables

## 6.3 `tutor_trust_snapshot`

Purpose:

- curated derived trust output for ranking and public-safe display

Recommended physical shape:

- dedicated projection table

Why:

- trust inputs come from multiple families
- rating, review counts, reliability, and approved proof are derived
- both public search and matching need a stable trust surface

Should include:

- public rating summary
- review count and recency indicators
- approved trust proof indicators
- reliability summary indicators
- moderation/listability-derived gating signals that are safe to surface downstream

Raw evidence and raw case history should remain canonical/internal, not live here.

## 6.4 `tutor_availability_projection`

Purpose:

- query-friendly availability helper for public discovery summaries and matching overlap checks

Recommended physical shape:

- dedicated projection table

Why:

- repeated live overlap calculation is one of the main query risks already identified
- availability is derived from multiple scheduling inputs
- search and matching need different lightweight summaries from the same underlying schedule state

Should include:

- next-available summary signals
- recurring overlap helper signals where needed
- lightweight public-safe availability summary fields
- update markers that allow matching invalidation

It should not expose raw recurring rules or raw overrides to public consumers.

## 6.5 `lesson_list_projection`

Purpose:

- optional list-friendly lesson summary surface for frequent dashboard reads

Recommended physical shape:

- defer initially
- if later justified, start with a view or dedicated projection table based on measured query cost

Why:

- it is explicitly optional in the approved schema
- it should exist only if canonical lesson queries miss the approved performance targets

## 7. Physical Shape Selection Rules

## 7.1 Choose a `view` when

Use a normal database view when:

- the derivation is simple
- the source joins are cheap
- the result is not a major hot path bottleneck
- no special per-row maintenance or export process is needed

Views are good for:

- narrow DTO surfaces
- low-volume internal read shaping

Views are not the default answer for:

- heavy public browse
- matching at scale
- any surface that needs explicit maintenance versioning

## 7.2 Choose a dedicated projection table when

Use a dedicated projection table when:

- the surface is queried frequently
- the query needs stable indexed columns
- the projection needs per-entity updates
- the projection needs explicit freshness/version tracking
- the projection may later feed another system such as a public search index

For Mentor IB, dedicated projection tables are the preferred phase 1 shape for:

- `public_tutor_search_projection`
- `tutor_matching_projection`
- `tutor_trust_snapshot`
- `tutor_availability_projection`

## 7.3 Choose a `materialized view` when

Use a materialized view only when:

- the computation is expensive enough to justify precomputation
- the refresh model can tolerate staleness between refreshes
- full or scheduled refresh is operationally acceptable

Materialized views are more suitable for:

- read-mostly public surfaces
- periodic batch-style derivations

They are less suitable for:

- highly personalized near-real-time surfaces
- projections that need targeted per-tutor incremental refresh as the default model

For Mentor IB, materialized views are a later optimization tool, not the phase 1 default.

## 8. Projection Ownership Model

Each projection family should have one owning domain.

Recommended ownership:

- `public_tutor_search_projection` -> public discovery/query domain
- `tutor_matching_projection` -> matching/query domain
- `tutor_trust_snapshot` -> trust/review domain
- `tutor_availability_projection` -> scheduling domain
- `lesson_list_projection` -> lessons/query domain if it is created later

Ownership means:

- that domain defines the projection contract
- that domain owns refresh logic
- other domains may provide inputs, but do not fork the projection

## 9. Source Inputs By Projection

## 9.1 `public_tutor_search_projection`

Typical source families:

- `tutor_profiles`
- `tutor_subject_capabilities`
- `tutor_language_capabilities`
- `tutor_trust_snapshot`
- published intro video metadata
- `tutor_availability_projection`

## 9.2 `tutor_matching_projection`

Typical source families:

- `tutor_profiles`
- `tutor_subject_capabilities`
- `tutor_language_capabilities`
- `tutor_trust_snapshot`
- `tutor_availability_projection`
- approved listability and availability gates

## 9.3 `tutor_trust_snapshot`

Typical source families:

- `reviews`
- `tutor_reliability_events`
- approved trust proof state
- moderation/listability gate state

## 9.4 `tutor_availability_projection`

Typical source families:

- `schedule_policies`
- `availability_rules`
- `availability_overrides`
- any future booking-derived availability blockers needed for overlap logic

## 10. Maintenance Model

## 10.1 Main rule

Canonical writes happen first.

Projection maintenance happens after canonical success.

This prevents projections from becoming the mutation source of truth.

## 10.2 Recommended maintenance flow

The preferred flow is:

1. write canonical domain tables
2. identify affected projection families and affected entity ids
3. mark the affected projection slices dirty or refresh them directly if the work is cheap
4. recompute only the affected rows or slices where possible
5. update projection freshness markers
6. invalidate application-layer caches that read the changed surface

## 10.3 Incremental refresh rule

Default to per-entity or per-slice refresh, not full global recomputation.

Examples:

- one tutor updates subjects -> refresh that tutor's search and matching rows
- one review becomes published -> refresh that tutor's trust snapshot and dependent discovery/matching rows
- one tutor changes availability -> refresh only that tutor's availability helper and dependent matching/discovery summaries

## 10.4 Full rebuild rule

Use full rebuilds only for:

- initial backfill
- recovery from projection corruption
- major projection contract changes
- materialized-view refresh workflows where that model is intentionally chosen

## 11. Event-to-Projection Update Matrix

## 11.1 Tutor public profile change

Examples:

- headline
- bio
- display name
- intro video metadata
- public pricing text

Refresh:

- `public_tutor_search_projection`

Usually does not require:

- trust snapshot recomputation

## 11.2 Subject or language capability change

Refresh:

- `public_tutor_search_projection`
- `tutor_matching_projection`

## 11.3 Trust-proof approval or review publication change

Refresh:

- `tutor_trust_snapshot`
- `public_tutor_search_projection`
- `tutor_matching_projection`

## 11.4 Reliability event change

Examples:

- no-show
- late cancellation
- response-timeout signal

Refresh:

- `tutor_trust_snapshot`
- `tutor_matching_projection`

Refresh `public_tutor_search_projection` only if the public surface exposes a derived trust summary affected by the event.

## 11.5 Availability rule or override change

Refresh:

- `tutor_availability_projection`
- `tutor_matching_projection`
- `public_tutor_search_projection` if public availability summary fields changed

## 11.6 Tutor listability or moderation gate change

Refresh:

- `tutor_trust_snapshot`
- `public_tutor_search_projection`
- `tutor_matching_projection`

This is one of the highest-priority invalidation paths because it affects public eligibility.

## 11.7 Lesson mutation

Refresh:

- no projection by default unless a created projection explicitly depends on lesson state

Possible later refresh:

- `lesson_list_projection`
- `tutor_availability_projection` if booking state affects availability-helper summaries directly

## 12. Versioning And Freshness Rules

## 12.1 Projection rows should be inspectable

Maintained projection rows should carry at minimum:

- `updated_at`
- enough key identifiers to rebuild or compare them safely

Use an explicit version field when a consumer depends on version semantics rather than just freshness timestamps.

## 12.2 Matching version rule

The system already approved `matching_projection_version` as part of match-run reuse.

That means the matching-maintenance path must preserve a monotonic version signal representing meaningful matching-read-model changes.

## 12.3 Global versus granular versioning

Phase 1 should prefer correctness and clarity over elaborate invalidation.

Recommended posture:

- allow a global or family-level monotonic `matching_projection_version`
- evolve toward per-tutor or per-slice versioning later only if scale proves the need

## 12.4 Cache invalidation boundary

Projection freshness and application cache freshness are related but not identical.

The rule is:

- projection refresh updates the database-side read surface
- application cache invalidation makes sure routes and query helpers stop serving stale results

Do not treat one as a substitute for the other.

## 13. Trigger And Job Rules

## 13.1 Trigger rule

Database triggers are acceptable for:

- narrow dirty-marking
- narrow bookkeeping
- cheap same-row or same-entity freshness markers

Do not put heavy projection recomputation into triggers by default.

## 13.2 Job rule

Use the approved durable job lane for:

- heavy recomputation
- retries
- batched rebuilds
- scheduled refresh sweeps
- recovery/backfill work

## 13.3 Post-response rule

Cheap post-response refresh work may run in the short post-response lane only when:

- canonical data is already committed
- the projection work is small and deterministic
- failure does not silently lose the need for later correction

## 14. Cache And Revalidation Rules

Projection changes that affect user-facing read paths should trigger cache invalidation at the app layer.

Recommended examples:

- public discovery projection changes -> invalidate public discovery/search tags
- matching projection changes -> invalidate or bypass stale matching result reuse as required by `matching_projection_version`
- trust snapshot changes -> invalidate public tutor profile and matching tags that depend on trust summaries

The exact tag names can change later.

The architectural rule is:

- one projection update path should know which application read surfaces depend on it

## 15. Algolia-Ready Rule For Public Search

If the product later adopts Algolia for public browse search, the canonical export surface should be:

- `public_tutor_search_projection`

That means phase 1 should not couple public discovery to raw normalized tutor tables.

The future migration should be:

1. maintain `public_tutor_search_projection`
2. verify it as the canonical public-search contract
3. export/sync that surface to Algolia later if needed

This is how Mentor IB avoids a painful search rewrite while still staying Postgres-first for MVP.

## 16. Rebuild And Recovery Rules

Every maintained projection must be rebuildable from canonical data.

That means:

- no projection-only business facts
- no hidden irreversible state in projection rows
- rebuild jobs must be allowed to replace stale rows safely

Phase 1 should support:

- targeted tutor-level rebuild
- family-level rebuild
- full rebuild for rare recovery or contract migration work

## 17. RLS And Exposure Rules

Projection maintenance does not bypass the approved RLS model.

Rules:

- public projections in exposed schemas still require explicit public-safe access rules
- internal support projections should remain server-owned or non-public by default
- matching support projections are not public browse data
- trust snapshots may feed public and internal surfaces, but raw trust evidence remains canonical/internal

This document complements `database-rls-boundaries-v1.md`; it does not replace it.

## 18. AI-Agent Implementation Rules

Agents should:

- add a projection only when a real query, SLO, or export need justifies it
- choose the simplest physical shape that meets the requirement
- keep canonical mutation logic and projection maintenance separate
- refresh projections by affected entity where possible
- treat projection refresh and app-cache invalidation as separate responsibilities
- keep `public_tutor_search_projection` clean enough to serve as the future public-index export surface

Agents should not:

- query raw hot-path joins forever because projection work feels annoying
- create projection sprawl for UI convenience
- store private or internal-only data in public projections
- put heavy recomputation in triggers by default
- invent a second source of truth inside projection tables

## 19. Decisions To Lock Now

The system should lock the following decisions now:

- phase 1 projection families are limited and explicit
- dedicated projection tables are the preferred phase 1 shape for public search, matching, trust, and availability helper surfaces
- views remain acceptable for lighter read shaping
- materialized views are a later optimization tool, not the default
- projection maintenance should be incremental by affected tutor or slice where possible
- `public_tutor_search_projection` is the canonical future export surface if external public search is adopted later
- projection refresh and application cache invalidation are separate layers that must both be handled

## 20. Implementation Handoff Status

The implementation handoff path is:

1. use `docs/architecture/route-layout-implementation-map-v1.md` for app route shape
2. use `docs/planning/agent-implementation-decision-index-v1.md` and `docs/planning/implementation-task-template-v1.md` to create concrete implementation tasks

## 21. Final Recommendation

Mentor IB should treat projections as a small, explicit, maintained read layer sitting on top of the canonical write model.

The clean phase 1 model is:

- canonical normalized tables own the truth
- a few dedicated projection tables power hot discovery and matching reads
- cheap refreshes happen incrementally by affected tutor or slice
- heavy rebuilds go through the approved job lane
- future external public search, if adopted, exports from `public_tutor_search_projection`

That gives the product speed, clarity, and a clean migration path without prematurely locking the system into a specialized search platform.

## 22. Official Source Notes

The guidance above is aligned with current official documentation for:

- PostgreSQL materialized views: `https://www.postgresql.org/docs/current/rules-materializedviews.html`
- PostgreSQL `REFRESH MATERIALIZED VIEW`: `https://www.postgresql.org/docs/current/sql-refreshmaterializedview.html`
- Supabase query optimization: `https://supabase.com/docs/guides/database/query-optimization`
- Supabase Postgres triggers: `https://supabase.com/docs/guides/database/postgres/triggers`
- Next.js `revalidateTag`: `https://nextjs.org/docs/app/api-reference/functions/revalidateTag`
