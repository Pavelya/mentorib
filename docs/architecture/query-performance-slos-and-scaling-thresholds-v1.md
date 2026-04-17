# Mentor IB Query Performance SLOs And Scaling Thresholds v1

**Date:** 2026-04-08
**Status:** Standalone architecture for query latency targets, scaling thresholds, and matching-cache strategy
**Scope:** query classes, server and user-visible SLOs, read-model posture, matching result caching, invalidation rules, scaling triggers, and when specialized search infrastructure becomes justified

## 1. Why This Document Exists

This document turns the approved search, matching, and performance architecture into measurable expectations.

It exists now because the product already depends on:

- fast public browse search
- fast guided matching
- predictable results under repeated queries
- a desire to avoid recomputing the same expensive joins when nothing meaningful changed
- future AI agents needing explicit latency and caching rules

Without explicit SLOs and scaling rules, teams usually drift into:

- "it feels fast enough" with no measurable target
- repeated expensive query recomputation
- cache behavior improvised per route
- search and matching becoming slow before anyone agrees what "slow" means

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/search-platform-decision-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

It defines the measurable layer that those docs imply.

## 3. Core Recommendation

Mentor IB should use a **read-model-first, cache-aware, invalidation-driven query architecture** with explicit latency targets.

The practical rule is:

- do not measure only page-load speed
- measure query and result-delivery speed directly
- keep matching and search fast by reading from query-friendly projections
- reuse match results when inputs and relevant source data are unchanged
- invalidate intentionally when relevance-affecting data changes

## 4. Important Terms

## 4.1 Server query latency

Time from the server receiving the query request to the server producing the result DTO.

## 4.2 User-visible result latency

Time from a user action such as:

- submitting a search
- changing a filter
- submitting a `LearningNeed`

to the point where the updated results are visibly rendered and usable.

## 4.3 Need signature

A stable hash or deterministic signature of the normalized `LearningNeed` inputs that actually affect matching.

## 4.4 Ranking version

The version identifier of the ranking profile used for the result.

## 4.5 Projection version

A version or freshness marker representing the state of the query-friendly discovery/matching projection used to produce the result.

## 5. Query Classes

The product should treat these query classes differently.

## 5.1 Public browse search

Examples:

- public browse tutors
- open exploration on results

## 5.2 Guided matching run

Examples:

- submitted `LearningNeed`
- first ranked match set

## 5.3 Match refinement query

Examples:

- filters or text refinement applied to an existing match run

## 5.4 Operational list filtering

Examples:

- lessons
- tutor students
- conversation list

## 6. Latency SLOs

## 6.1 Main rule

The architecture should optimize for a user-visible experience where search-like actions usually feel near-immediate and matching usually feels decisively fast, not heavy.

## 6.2 Public browse search SLO

Targets:

- `p50` server query latency: `<= 200ms`
- `p95` server query latency: `<= 700ms`
- `p99` server query latency: `<= 1000ms`
- `p95` user-visible result latency: `<= 1200ms`
- hard user-facing budget: results should normally appear within about `1 to 1.5 seconds`

## 6.3 Guided matching SLO

Targets:

- `p50` server query latency: `<= 400ms`
- `p95` server query latency: `<= 1200ms`
- `p99` server query latency: `<= 1800ms`
- `p95` user-visible result latency: `<= 1800ms`
- hard user-facing budget: first ranked results should normally appear within about `2 seconds`

Matching is allowed to be slower than plain browse search because it does more work.

It should still feel intentionally fast.

## 6.4 Match refinement SLO

Targets:

- `p50` server query latency: `<= 200ms`
- `p95` server query latency: `<= 600ms`
- `p95` user-visible result latency: `<= 1000ms`

This should usually be faster than the first match run because it can reuse an existing candidate context.

## 6.5 Operational filtering SLO

Targets:

- `p50` server query latency: `<= 150ms`
- `p95` server query latency: `<= 500ms`
- `p95` user-visible result latency: `<= 900ms`

## 6.6 SLO interpretation rule

These are operating targets and scaling triggers, not absolute promises for every network condition.

If the product consistently misses the `p95` targets in production, it should trigger the next scaling step rather than normalization of poor performance.

## 7. Query Architecture Shape

## 7.1 Main rule

Search and matching should not read from raw presentation tables with repeated heavy joins on every request.

## 7.2 Required read models

The system should maintain at least:

- a `public tutor discovery projection`
- a `matching projection`
- a `trust snapshot` or equivalent derived trust read model
- an `availability helper` or overlap-ready scheduling read model

These may physically be:

- database views
- denormalized tables
- materialized views later

## 7.3 Why this matters

This is the main way to keep both Postgres-first search and internal matching fast without prematurely buying specialized infrastructure.

## 8. Matching Cache Strategy

## 8.1 Main rule

Matching should reuse previous computation when the effective inputs and relevant source data are unchanged.

## 8.2 Recommended cache key

The cache identity for a match result should include at minimum:

- `need_signature`
- `ranking_version`
- `matching_projection_version`
- visibility or mode scope if that changes eligibility

Recommended conceptual key:

```text
match_cache_key =
  hash(
    need_signature,
    ranking_version,
    matching_projection_version,
    visibility_scope
  )
```

## 8.3 What this solves

If the same learning need is evaluated repeatedly and nothing relevant changed:

- no need to recompute all candidate filtering
- no need to recompute all expensive joins
- no need to rerank from scratch

The system can return the cached or persisted result.

## 8.4 Meaningful-match persistence

As already approved, meaningful match outputs should be persisted as first-class `Match` artifacts.

That persisted result can also serve as the reuse layer for:

- compare
- revisit results
- booking continuation
- tutor-side request context

## 8.5 Exploratory-cache posture

Not every tiny interaction should create a permanent record.

Use:

- persisted match artifacts for meaningful submitted `LearningNeed` runs
- short-lived query cache for repeated exploratory requests

## 9. Matching Cache Invalidation

## 9.1 Main rule

Cached matching results must be invalidated when relevance-affecting data changes.

## 9.2 Must-invalidate events

Invalidate matching reuse when any of these change in a way that affects candidate eligibility or score:

- tutor public listability
- tutor approval/suspension state
- subject or component coverage
- language support
- public trust proof state
- trust/reliability snapshot
- availability state used by matching
- ranking profile version

## 9.3 Recommended invalidation model

The simplest reliable MVP model is:

- maintain a monotonic `matching_projection_version`
- bump it whenever the matching read model changes materially
- include it in the cache key

This intentionally favors correctness and simplicity over ultra-granular invalidation.

## 9.4 Future refinement option

If global invalidation becomes too broad later, evolve toward:

- per-tutor projection versioning
- per-subject or per-region slice versioning
- incremental recomputation

Do not start there unless scale proves the need.

## 10. Search Query Caching

## 10.1 Public browse query caching

Public browse queries may use short-lived cached query responses when the data is read-mostly and publicly listable.

Recommended posture:

- short TTL or tagged cache
- targeted invalidation when public discovery projection changes
- no dependence on long stale windows for correctness

## 10.2 Match refinement caching

Match refinement should prefer reusing the existing match context and filtered candidate set rather than rerunning the entire match pipeline.

## 10.3 Operational filtering caching

Operational list filtering should usually rely on:

- indexed scoped queries
- pagination
- light server caching only when repeated reads clearly benefit

Do not broadly cache highly mutable personalized operational data by default.

## 11. App-Layer Cache Mechanics

## 11.1 Main rule

The application should use framework-supported cache mechanisms for read-mostly query results and targeted invalidation rather than ad hoc in-memory guessing.

## 11.2 Recommended posture

Use Next.js cache semantics for:

- read-mostly query functions
- tagged invalidation
- on-demand refresh after relevant writes

Recommended conceptual tools:

- `use cache`
- `cacheTag`
- `updateTag` or `revalidateTag`

## 11.3 Why this matters

This gives the app:

- one explicit caching layer
- targeted invalidation
- less route-local caching drift

## 11.4 No blind-route-cache rule

Do not try to solve slow matching by making entire authenticated routes broadly static or stale.

Cache the query work intentionally, not the whole product experience blindly.

## 12. Database-Side Performance Mechanics

## 12.1 Required posture

Database-side query performance should rely on:

- proper indexes
- narrow row selection
- query-friendly projections
- avoiding repeated expensive join graphs on hot paths

## 12.2 Next scale step

When the first projection layer is no longer enough, the next preferred steps are:

- denormalized read tables
- materialized views
- precomputed overlap helpers

## 12.3 Availability-helper rule

Availability is one of the more expensive parts of matching.

The product should avoid recomputing full availability overlap from raw schedule state on every repeated match query.

Instead, it should use:

- overlap-ready helpers
- precomputed slot windows
- cached or derived availability summaries suited to the matching horizon

## 13. Scaling Thresholds

## 13.1 Stage 0: MVP

Expected scale:

- around `100 tutors`

Architecture:

- Postgres-first search
- internal matching
- indexed projections
- short-lived query caching
- projection-version-based match reuse

Decision:

- Algolia is not required

## 13.2 Stage 1: Early post-MVP

Possible trigger conditions:

- more than roughly `500 to 1000` public tutors
- repeated `p95` browse-search misses above target
- repeated `p95` matching misses above target
- heavy repeated identical match runs

Preferred actions:

- stronger denormalized projections
- materialized views where justified
- stronger availability helpers
- more explicit tag-based invalidation

## 13.3 Stage 2: Browse-search pressure

Possible trigger conditions:

- browse search becomes a major acquisition or conversion surface
- typo tolerance expectations exceed the controlled Postgres-first behavior
- faceting and instant-search behavior become strategically important
- public browse `p95` remains above target despite good projections and indexes

Preferred action:

- introduce specialized search infrastructure for public browse only
- Algolia becomes a valid candidate here

Matching still remains internal.

## 13.4 Stage 3: Heavy matching scale

Possible trigger conditions:

- much larger tutor inventory
- more complex ranking signals
- richer availability and fit scoring
- sustained matching `p95` misses even after projection optimization

Preferred actions:

- more incremental read-model maintenance
- more selective invalidation granularity
- heavier precomputation
- maybe additional compute patterns

Do not assume that specialized browse search solves this stage.

## 14. What Should Trigger Immediate Investigation

These should be treated as performance incidents or near-incidents:

- public browse `p95` above `1200ms` user-visible latency for sustained periods
- first match result `p95` above `2000ms` user-visible latency
- clear repeated reruns of identical match queries with no cache reuse
- cache hit quality collapsing after normal user flows
- expensive repeated availability joins dominating query time

## 15. Decisions To Lock Now

The architecture should lock the following decisions now:

- browse search should normally feel under about `1 to 1.5 seconds`
- first guided matching results should normally feel under about `2 seconds`
- matching should reuse previous computation when `need_signature`, `ranking_version`, and `matching_projection_version` are unchanged
- read models are required for hot search and matching paths
- availability overlap must not be recomputed from raw schedule joins on every repeated query
- global route staleness is not the solution to slow matching
- Algolia, if adopted later, is a browse-search scaling tool, not a matching engine

## 16. Final Recommendation

Mentor IB should treat query speed as a measurable product promise.

The recommended posture is:

- explicit latency SLOs
- Postgres-first query-friendly read models
- deterministic match-result reuse
- targeted invalidation
- escalation to stronger projections and only then specialized browse search

This gives the product the best chance to stay fast now, stay understandable for AI agents, and scale without jumping too early into the wrong infrastructure.

## 17. Official Source Notes

The recommendation above is informed by current official documentation for:

- Next.js caching deep dive: `https://nextjs.org/docs/app/deep-dive/caching`
- Next.js `use cache`: `https://nextjs.org/docs/app/api-reference/directives/use-cache`
- Next.js `cacheTag`: `https://nextjs.org/docs/app/api-reference/functions/cacheTag`
- Next.js `updateTag`: `https://nextjs.org/docs/app/api-reference/functions/updateTag`
- Next.js `revalidateTag`: `https://nextjs.org/docs/app/api-reference/functions/revalidateTag`
- PostgreSQL materialized views: `https://www.postgresql.org/docs/current/rules-materializedviews.html`
- Supabase query optimization: `https://supabase.com/docs/guides/database/query-optimization`
