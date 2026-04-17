# Mentor IB Database Change Review Checklist v1

**Date:** 2026-04-09
**Status:** Standalone data-layer review gate for database, projection, RLS, seed, Drizzle, and data-access changes
**Scope:** when to run a database-change review, what must be checked, which source-of-truth docs to consult, blocker conditions, and AI-agent-safe review rules

## 1. Why This Document Exists

Mentor IB now has dedicated data-layer contracts for:

- schema shape
- authorization and RLS
- migrations
- projections
- seeds and fixtures
- Drizzle access
- database tests
- reference data
- idempotency

What was still missing was the one checklist that future humans and AI agents can use before making or approving a database-affecting change.

Without a single review gate, implementation usually drifts into:

- schema changes without RLS review
- projection changes without refresh or cache thinking
- migrations without tests
- Drizzle changes without matching SQL migrations
- reference-data changes hidden in app constants
- webhook or job changes without idempotency handling

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it is the review gate for the approved data-layer source-of-truth docs.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/seed-and-fixture-data-strategy-v1.md`
- `docs/data/drizzle-schema-and-query-conventions-v1.md`
- `docs/data/database-test-conventions-v1.md`
- `docs/data/reference-data-governance-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/database-index-and-query-review-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`

It also inherits release constraints from:

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the schema outline
- the migration rules
- the RLS boundary model
- the projection strategy
- the Drizzle conventions
- the test conventions

It is a review checklist that points to those canonical docs.

If a checklist item appears to conflict with a dedicated source doc, the dedicated source doc wins and this checklist should be updated.

## 4. When To Use This Checklist

Use this checklist for any change that touches:

- `supabase/migrations/`
- `supabase/seeds/`
- `supabase/tests/database/`
- Drizzle table declarations
- repository queries
- projection SQL or refresh logic
- RLS policies
- database functions or triggers
- provider event records
- job records
- reference data
- status or enum families
- data-access DTOs for sensitive or public surfaces

## 5. When This Checklist Is Not Required

This checklist is usually not required for:

- pure visual component changes
- copy-only changes in route-owned content
- CSS token changes
- local test text updates with no data-model impact

If a "UI-only" change changes what data is queried, exposed, stored, or mutated, use the checklist.

## 6. Blocker Rule

A database-affecting change should not be considered implementation-ready if any of these are unresolved:

- the source-of-truth owner is unclear
- an exposed table or view lacks an RLS decision
- a migration changes a hot path without projection or performance review
- a public projection can leak private data
- a retryable provider or job flow lacks idempotency review
- a Drizzle schema change is not aligned with the SQL migration model
- a required reference-data change is hidden only in app constants
- a meaningful data-boundary change has no test decision
- a destructive change skips expand-before-contract review

## 7. Change Classification Checklist

Before editing files, classify the change.

Answer:

- Is this a schema shape change?
- Is this a data backfill or repair?
- Is this an RLS or access-boundary change?
- Is this a projection or read-model change?
- Is this a reference-data or status-family change?
- Is this a Drizzle schema/query change?
- Is this a seed, fixture, or test-data change?
- Is this a webhook, job, retry, or idempotency change?
- Is this a public, SEO, or matching/search data-surface change?

If more than one answer is yes, the change may need more than one review path.

## 8. Schema And Migration Review

Check:

- Does the change follow the SQL-first migration path?
- Is the migration one-intent and reviewable?
- Is the change additive where possible?
- If destructive or contract-tightening, does it follow expand-before-contract?
- Are backfills separated or clearly scoped where needed?
- Are new constraints, indexes, and defaults safe for existing data?
- Is the rollback or forward-repair posture understood?

Use:

- `docs/data/migration-conventions-v1.md`
- `docs/data/database-schema-outline-v1.md`

## 9. RLS And Exposure Review

Check:

- Is the touched object in an exposed schema?
- Does a user JWT or public user have any path to this object?
- Is RLS enabled where required?
- Are policies explicit and minimal?
- Does public access happen only through public-safe surfaces?
- Does Realtime access mirror canonical read permissions?
- Are internal-only tables kept server-owned or moved to a safer boundary?

Use:

- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/architecture/security-architecture-v1.md`

## 10. Data Ownership And Source-Of-Truth Review

Check:

- Which table family owns the fact being changed?
- Is the value a status, reference datum, config value, or route copy?
- Is any value being duplicated across SQL, app constants, and UI?
- Is any JSON blob hiding a field that should be relational for filtering, matching, or access control?
- Is a new table being created because the domain truly needs it, not because one screen does?

Use:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md`
- `docs/data/reference-data-governance-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`

## 11. Projection, Search, And Matching Review

Check:

- Does this change affect a projection source table?
- Does any maintained projection need a refresh rule update?
- Does cache invalidation or freshness versioning need to change?
- Does public tutor search or guided matching depend on the changed field?
- Is the hot path reading from the approved projection rather than rebuilding expensive joins?
- Does the public projection still contain only public-safe data?

Use:

- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`

## 12. Idempotency, Jobs, And Provider-Event Review

Check:

- Can this operation be retried, replayed, or double-submitted?
- Is the correct idempotency boundary natural uniqueness, operation key, provider event id, or job dedupe key?
- Are inbound webhooks handled with verify-record-dispatch?
- Are outbound provider calls using provider-supported idempotency where needed?
- Can a job retry after partial success without duplicate side effects?
- Are projection rebuilds and repair scripts rerunnable?

Use:

- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`

## 13. Seed, Fixture, And Reference-Data Review

Check:

- Does this change belong in reference seeds, baseline seeds, fixtures, or scale data?
- Is the default seed path still small and deterministic?
- Are fixtures named by scenario and opt-in?
- Is production reference data promoted through an explicit safe path?
- Are synthetic identities and content obviously fake and safe?

Use:

- `docs/data/seed-and-fixture-data-strategy-v1.md`
- `docs/data/reference-data-governance-v1.md`
- `docs/data/supabase-folder-and-file-conventions-v1.md`

## 14. Drizzle And Application Data-Access Review

Check:

- Does the Drizzle schema mirror the SQL migration?
- Is repository logic owned by the correct domain module?
- Are routes calling services rather than owning substantial queries?
- Are public and sensitive routes receiving DTO-safe shapes?
- Are complex SQL fragments parameterized and owned by the right module?
- Are Drizzle row types leaking into UI boundaries by reflex?

Use:

- `docs/data/drizzle-schema-and-query-conventions-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/security-architecture-v1.md`

## 15. Database Test Review

Check:

- Does the change require a database test?
- Does it touch RLS, projections, constraints, functions, triggers, backfills, or repair logic?
- Does the test use the approved `supabase/tests/database/` path?
- Is setup minimal and deterministic?
- Are both allowed and denied paths tested for meaningful RLS changes?
- Is there a clear reason if no DB test is being added?

Use:

- `docs/data/database-test-conventions-v1.md`
- `docs/architecture/testing-and-release-architecture-v1.md`

## 16. Privacy, Retention, And Public-Surface Review

Check:

- Does the change create, expose, retain, or delete personal data?
- Does it affect student data, tutor private evidence, messages, reports, or moderation data?
- Does a public route or projection expose only approved public fields?
- Does deletion or deindexing behavior need to change?
- Are analytics or logs accidentally receiving private content?

Use:

- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`

## 17. Performance And Index Review

Check:

- Does the change affect a hot query, matching query, public search, dashboard list, or message list?
- Are indexes needed before relying on the query at scale?
- Is a read-model or projection the safer shape?
- Are SLOs still plausible for the affected route or operation?
- Does the change create a new N+1 or expensive live-join path?

Use:

- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/data/database-index-and-query-review-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`
- `docs/data/projection-sql-patterns-v1.md`

## 18. Documentation Update Review

Check:

- Does the schema outline need a note?
- Does the status glossary need a new value?
- Does the RLS boundary doc need a new table-family rule?
- Does the projection strategy need a new refresh trigger?
- Does the idempotency model need a new operation family?
- Does the database observability doc need a new signal, review trigger, or maintenance cadence note?
- Does the data subject request workflow need a new request type, hold, or provider task?
- Does the API and Server Action contracts doc need a new boundary, mutation family, endpoint rule, or cache invalidation note?
- Does the privacy policy data inventory handoff need a new data category, provider, purpose, public exposure, or policy gap?
- Does the docs map need the new artifact linked?

Do not update docs just for noise.

Do update docs when a source-of-truth decision changes.

## 19. AI-Agent Review Rules

Future AI agents should:

- run this checklist before database-affecting implementation
- cite the canonical docs that apply to the change
- avoid changing more data-layer families than necessary
- explicitly state when a DB test is not needed and why
- avoid creating undocumented SQL, config, or reference-data side paths

Agents should not:

- treat this checklist as a substitute for reading the relevant source docs
- bypass RLS review because a route is "server-only for now"
- make destructive schema changes in one step without expand-before-contract reasoning
- add app constants for values that belong in reference data
- update Drizzle schema without aligning with SQL migrations

## 20. Decisions To Lock Now

The system should lock the following decisions now:

- every database-affecting change gets classified before implementation
- RLS, projections, idempotency, and tests are explicit review dimensions
- Drizzle, seeds, and reference data are included in database-change review
- destructive and public-surface changes are blocker-level concerns
- this checklist is a review gate, not a replacement for the dedicated data docs

## 21. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 22. Final Recommendation

Mentor IB should use this checklist as the shared pre-implementation and review gate for data-layer changes.

The practical outcome should be simple:

- classify the change
- check the relevant boundaries
- update the right source-of-truth docs only when needed
- add database tests when the risk warrants it
- avoid accidental drift across schema, access, projections, and app code

That gives future AI agents a reliable path through a complex data system without forcing them to rediscover every architecture decision from scratch.
