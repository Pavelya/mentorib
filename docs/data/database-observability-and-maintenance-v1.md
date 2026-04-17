# Mentor IB Database Observability And Maintenance v1

**Date:** 2026-04-09
**Status:** Standalone data-layer operations document for database health, query visibility, projection freshness, migration/backfill monitoring, backup/restore posture, advisor checks, and AI-agent-safe maintenance rules
**Scope:** database-specific observability signals, slow query investigation, projection lag, job/webhook maintenance, RLS/security advisor posture, backups and restore checks, storage metadata consistency, retention cleanup, and review rules for future implementation tasks

## 1. Why This Document Exists

Mentor IB now has a strong data-model and query-boundary architecture.

What was still missing was the database operations layer:

**How do we know the database is healthy after implementation starts and after users begin relying on it?**

Without a database observability and maintenance document, implementation can drift into:

- slow queries being noticed only when users complain
- projection rows silently going stale
- failed jobs or webhooks hiding in logs with no durable product state
- migrations and backfills shipping with no post-release inspection
- public tutor search serving old data after delisting
- expired meeting links and credential files surviving longer than intended
- Supabase advisor warnings being ignored or blindly applied without product context
- backup/restore assumptions that accidentally republish deleted public data

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it is the operations companion to the data-model docs.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/database-index-and-query-review-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/sql-function-and-trigger-boundaries-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

It inherits broader operational posture from:

- `docs/architecture/observability-and-incident-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- general incident severity definitions
- product analytics event taxonomy
- SEO/Search Console observability
- exact Supabase plan selection
- exact future APM or tracing vendor
- exact backup vendor procedures
- exact SQL for health-check queries

It defines the data-layer signals and maintenance posture that implementation should preserve.

If there is a conflict:

- incident process comes from `docs/architecture/observability-and-incident-architecture-v1.md`
- query SLOs come from `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- index/query review comes from `docs/data/database-index-and-query-review-v1.md`
- projection maintenance comes from `docs/data/projection-maintenance-strategy-v1.md`
- retention and restore safety come from `docs/data/data-retention-erasure-field-map-v1.md`

## 4. Core Recommendation

Mentor IB should use a **lightweight but explicit database operations model**:

1. use Supabase as the primary managed database observability surface
2. use application-owned durable records for jobs, webhooks, projection refreshes, and deletion workflows
3. review slow queries against explicit query SLOs
4. treat projection freshness as a product health signal
5. treat advisor warnings as review inputs, not automatic migration instructions
6. verify migrations, backfills, and restore behavior as operational events
7. keep maintenance small, documented, and AI-agent-readable

The practical rule:

**If the product depends on a database side effect, there should be a way to inspect whether it happened, when it happened, and what to do if it failed.**

## 5. Database Signal Lanes

Database observability should be split into separate signal lanes.

## 5.1 Query performance lane

Tracks:

- public browse query latency
- guided matching query latency
- match refinement latency
- lesson list query latency
- conversation list query latency
- expensive availability overlap queries
- slow admin/moderation lookup queries later

Primary sources:

- application query timing logs
- Supabase/Postgres query logs where enabled
- `EXPLAIN` and query plan review
- Supabase query optimization tools

## 5.2 Data correctness lane

Tracks:

- projection freshness
- missing projection rows
- stale public listing rows
- stale trust/rating snapshots
- stale availability summaries
- failed rebuilds
- cache invalidation misses

Primary sources:

- projection freshness columns
- projection dirty/refresh records if implemented
- targeted rebuild job records
- post-release smoke checks

## 5.3 Security and exposure lane

Tracks:

- RLS disabled or missing policies
- unexpected exposed tables/views/functions
- public projections containing private fields
- security-definer function warnings
- sensitive columns exposed through DTO/query changes

Primary sources:

- Supabase Security Advisor
- database-change review checklist
- RLS tests
- DTO boundary tests

## 5.4 Async durability lane

Tracks:

- webhook receipt and processing status
- job attempts and retries
- notification enqueue and delivery state
- provider event idempotency
- failed or stuck projection rebuild tasks

Primary sources:

- `webhook_events`
- `job_runs`
- `notification_deliveries`
- idempotency records
- provider dashboards

## 5.5 Storage and media lane

Tracks:

- credential file metadata consistency
- missing storage objects
- orphan storage objects
- public media delisting cleanup
- signed URL or access errors

Primary sources:

- Supabase Storage logs
- domain metadata rows
- file/media cleanup jobs
- retention workflow records

## 5.6 Backup and restore lane

Tracks:

- available backup posture for the current Supabase plan
- restore procedure readiness
- database backup scope versus storage object scope
- restore-safe public visibility checks
- post-restore projection rebuild requirements

Primary sources:

- Supabase backup settings
- restore runbooks
- retention/erasure workflow records
- post-restore smoke checks

## 6. MVP Tooling Posture

The MVP should not start with a heavy database observability stack.

Recommended MVP surfaces:

- Supabase Logs Explorer
- Supabase Performance Advisor
- Supabase Security Advisor
- Supabase dashboard database metrics
- PostgreSQL `EXPLAIN` during query review
- durable app tables for jobs, webhooks, projection maintenance, and notification delivery
- Vercel runtime logs for correlating route failures with database behavior
- provider status pages for dependency diagnosis

Do not add by default:

- a separate paid database APM
- a log warehouse
- a custom metrics platform
- a complex tracing backend

Escalate later only when:

- log retention is not enough
- correlation across providers becomes painful
- production incidents require deeper tracing
- operational volume grows enough to justify a dedicated tool

## 7. Supabase Logs Usage

Use Supabase Logs Explorer for database and platform debugging.

Useful source families:

- API logs for Supabase API request behavior
- Auth logs for sign-in and account issues
- Postgres logs for database errors and selected query logging
- Storage logs for object access and upload/download issues
- Realtime logs if Realtime is enabled for messaging or live updates

Rules:

- keep logs scoped by time window
- avoid noisy global query logging by default
- do not put PII in user agents or custom log metadata
- enable deeper Postgres or realtime logging only when needed for investigation
- turn noisy debug settings back down after the investigation

## 8. Query Performance Monitoring

Mentor IB has explicit query SLOs.

Database observability should track whether implementation stays plausible against them.

High-priority query families:

- public tutor discovery
- guided matching
- match refinement
- lessons list
- tutor students list
- conversation list
- public tutor profile lookup by slug
- job claim and webhook processing queries

Investigation triggers:

- public browse repeatedly misses approved `p95` target
- first match result repeatedly exceeds the approved user-visible budget
- lesson or conversation list queries feel slow with realistic fixture data
- raw availability joins dominate match query cost
- adding an index causes visible write latency on hot tables
- a query depends on tiny seed data to look fast

The first response should be:

1. confirm the query surface and DTO boundary
2. inspect query shape
3. inspect projection freshness and source
4. inspect index coverage
5. inspect plan behavior
6. inspect cache/invalidation behavior
7. only then reconsider infrastructure

## 9. Query Plan Review

Use `EXPLAIN` or equivalent query-plan review for high-risk SQL.

Require plan review when:

- a new public discovery query ships
- a new guided matching query ships
- a conversation/message list query changes
- a lesson/tutor dashboard query changes
- a projection refresh query changes
- a backfill or migration query touches many rows
- an index is added for a hot path

Look for:

- unexpected sequential scans on growing tables
- expensive sorts
- broad joins before filters
- repeated nested loops over large row sets
- row estimates that are obviously wrong
- filters that cannot use intended indexes
- query plans that only look safe because local data is tiny

Production caution:

- do not run expensive `EXPLAIN ANALYZE` on write-heavy production queries without an explicit safety decision
- use staging or representative fixtures for risky plan validation whenever possible

## 10. Advisor Review Posture

Supabase Performance Advisor and Security Advisor should be part of the review loop.

Use them for:

- missing indexes
- unused or duplicate indexes
- RLS disabled or policy issues
- security-definer view/function warnings
- table bloat or maintenance warnings
- sensitive-column exposure warnings

Rules:

- advisor results are evidence, not automatic changes
- every accepted advisor fix should map to a data doc rule or named query/access surface
- every ignored advisor finding should have a short reason if it is meaningful
- rerun or re-check advisors after meaningful schema/RLS/index changes

Do not:

- blindly add every suggested index
- ignore RLS/security findings because routes are server-rendered
- treat advisor silence as proof the product-level DTO boundary is safe

## 11. Projection Freshness Monitoring

Projection freshness is product health.

Projection families to watch:

- `public_tutor_search_projection`
- `tutor_matching_projection`
- `tutor_trust_snapshot`
- `tutor_availability_projection`
- `lesson_list_projection` if introduced
- conversation list projection if introduced

Each maintained projection should expose or support:

- `updated_at` or equivalent freshness marker
- source entity id
- projection family
- last successful targeted refresh timestamp when needed
- failed refresh state if refresh is asynchronous
- rebuild capability from canonical tables

MVP posture:

- synchronous cheap targeted refresh is acceptable
- asynchronous refresh should create inspectable work records
- every projection family should have a rebuild path
- public projection cleanup after delisting/deletion should be testable

## 12. Projection Lag Review

Projection lag matters most when it affects:

- public tutor visibility
- matching relevance
- trust/rating display
- availability fit
- student/tutor operational lists

Suggested review targets:

- public delisting should remove public exposure as close to immediately as the implementation path allows
- matching projection changes should update `matching_projection_version` when relevance-affecting data changes
- availability summaries should not lag long enough to produce misleading booking expectations
- projection rebuild failures should be visible in a durable status record or post-release check

Do not:

- let stale projections become accepted product behavior
- hide projection failures in logs only
- rely on cache expiry alone to fix public exposure mistakes

## 13. Job And Webhook Maintenance

Jobs and webhooks need durable operational records.

Required inspectable fields conceptually include:

- operation family
- trigger object type and id
- provider and provider event id where relevant
- processing status
- attempt count
- last attempted at
- final success/failure status
- failure code or short failure summary
- next retry time where relevant

This applies to:

- Stripe webhooks
- notification deliveries
- reminder jobs
- projection rebuilds
- data deletion workflows
- provider sync tasks later

Do not rely only on provider dashboards for product state.

Provider dashboards show delivery attempts.

Mentor IB must still know whether the domain operation succeeded.

## 14. Migration And Backfill Observability

Migrations and backfills are operational events.

Before a high-risk migration:

- classify it using the database-change checklist
- identify affected hot queries and projections
- identify RLS and DTO exposure changes
- identify expected backfill duration and rollback/forward-repair posture
- identify post-migration checks

After a high-risk migration:

- verify migration applied in the expected environment
- verify critical queries still work
- verify projection rebuilds or refreshes completed
- verify RLS/security posture where relevant
- verify advisor findings if the migration touched RLS, indexes, functions, or exposed schemas
- verify no obvious error spike in Supabase/Vercel logs

Backfills should be:

- resumable where practical
- chunked if they touch meaningful volume
- observable through durable progress or logs
- safe to rerun if possible

## 15. Retention And Deletion Maintenance

Retention and deletion workflows must be observable.

Maintenance should track:

- account deletion workflow state
- public delisting/deindexing state
- credential file cleanup
- meeting URL redaction
- stale match artifact cleanup
- notification cleanup
- projection purge/rebuild after deletion
- minimal audit record for completed deletion workflows

Do not treat deletion as complete until:

- live public exposure is removed
- public projections/caches are purged or rebuilt
- storage dependencies are handled
- retained restricted records are documented by purpose
- auth identity timing is resolved

## 16. Storage Maintenance

Database backups do not automatically solve storage cleanup.

The database stores metadata about storage objects, but storage objects have their own lifecycle.

Maintenance checks should cover:

- credential metadata row points to an existing object when review requires it
- deleted credential files no longer have live public/private access paths
- public media delisting removes public rendering references
- orphan storage objects are periodically reviewable
- signed URL creation failures are visible to the secure review flow

Do not:

- store raw bucket paths in public DTOs
- delete auth users before checking user-owned storage dependencies
- assume database restore restores deleted storage objects

## 17. Backup And Restore Posture

Backups are a recovery tool, not a product deletion mechanism.

Rules:

- confirm the actual backup and restore capabilities of the current Supabase plan before production launch
- document whether the project uses daily backups, Point-in-Time Recovery, or manual exports
- remember that database backups may not include Storage API objects
- test restore assumptions before depending on them in a real incident
- document who can perform restore actions

Restore safety checks:

- do not automatically republish deleted or delisted public tutor profiles
- rerun public visibility gates after restore
- rebuild public and matching projections after restore where needed
- recheck deletion workflow records after restore
- recheck storage metadata versus actual storage objects
- recheck RLS/security advisor posture after restore if schema state changed

## 18. Database Capacity And Maintenance

Postgres requires ongoing maintenance and planning.

For MVP, Supabase handles much of the database platform work, but Mentor IB still needs to watch:

- database size growth
- table growth in messages, lessons, jobs, webhooks, logs, and projections
- unused or duplicate indexes
- missing indexes on hot queries
- table bloat warnings
- connection pressure
- slow queries
- long-running transactions
- failed or stuck jobs

Postgres autovacuum should usually be left to do its job.

Do not run heavyweight maintenance such as `VACUUM FULL` casually because it can lock tables and disrupt normal operation.

If bloat or vacuum issues appear, treat them as operational work that needs a safe plan, not as an AI-agent improvisation.

## 19. Realtime Maintenance

If Supabase Realtime is used for messaging or live status updates, database observability should include:

- whether realtime publications include only intended tables
- whether RLS rules match canonical read permissions
- whether subscriptions are too broad
- connection or channel issues when diagnosing live update problems
- whether debug logging is temporarily enabled and later reduced

Realtime is useful, but it should not become an unobserved data leak or noisy log source.

## 20. RLS And Exposure Maintenance

RLS is not a one-time setup.

Re-check RLS and exposure posture when:

- a new public projection or view is added
- a table is exposed through browser/Supabase API paths
- a function is made callable
- a DTO starts consuming a new source
- realtime access is enabled for a table
- admin/moderation surfaces gain new internal fields
- retention/deletion changes affect visibility state

Use:

- Supabase Security Advisor
- database RLS tests
- DTO boundary review
- database-change checklist

Do not assume:

- server rendering alone makes raw data safe
- RLS alone makes public DTOs safe
- advisor silence means the product access model is correct

## 21. Public Route Data Maintenance

Public route data needs special maintenance because public exposure can be crawled and cached.

Watch:

- tutor profile quality gates
- public listing status
- public projections
- sitemap eligibility
- structured data output
- public cache tags
- Search Console removal workflow for sensitive removals

When public tutor data changes:

- update canonical tutor data
- refresh public projection
- invalidate public cache
- update metadata/structured data sources
- update sitemap eligibility if public status changed

When public tutor data is removed:

- delist first
- purge public projections
- invalidate caches
- remove sitemap eligibility
- use Search Console removal workflow where appropriate

## 22. Local And Preview Database Maintenance

Development and preview environments should be useful but not trusted as production truth.

Rules:

- local seed data should be realistic enough to expose bad query shape
- preview environments should not share production secrets
- preview databases should not contain unnecessary production personal data
- migration checks should run against representative fixtures where practical
- database reset workflows should not teach agents destructive production habits

Do not:

- infer production query health from tiny local seed data only
- copy production private data into local fixtures by default
- run destructive cleanup commands against production without explicit review

## 23. Maintenance Review Cadence

For MVP, keep the cadence lightweight.

Recommended checks:

- post-release: check Supabase and Vercel logs for new errors
- post-migration: verify migration, RLS/index/advisor posture, and affected projections
- weekly while active development is high: review advisor findings and slow query symptoms
- after schema changes: review DTO, RLS, projection, and index impacts
- after public visibility changes: verify public projection and sitemap behavior
- after deletion workflow changes: verify live removal and retained restricted records

This cadence can become more formal when user volume grows.

## 24. Incident Hooks

Treat these as data-layer incident or near-incident triggers:

- public data leak or public projection contains private data
- RLS disabled or broken on an exposed surface
- match/search queries repeatedly miss SLOs
- projection refresh failing or badly lagging
- payment webhook processing stuck or duplicated
- notification delivery records show repeated failures for critical flows
- migration causes public route or auth failures
- restore or backfill accidentally republishes deleted data
- storage object deletion or access control fails for credential files
- database connection pressure causes app errors

Severity should be assigned using the general incident architecture.

## 25. AI-Agent Implementation Rules

Agents should:

- add durable status records for jobs, webhooks, and projection work
- keep projection freshness inspectable
- tie slow query fixes to named query surfaces and SLOs
- use advisor findings as evidence, not automatic edits
- include post-migration checks for high-risk data changes
- keep deletion and public delisting observable
- avoid logging PII, message bodies, credential contents, meeting URLs, or payment details
- document restore-sensitive behavior when changing public visibility or deletion flows
- update tests when observability affects correctness, not only diagnostics
- preserve shared operational conventions instead of inventing per-feature log formats

Agents should not:

- swallow critical database failures silently
- hide important side effects only in trigger bodies or logs
- add broad query logging permanently to debug one issue
- run heavyweight database maintenance in production casually
- assume local seed performance proves production performance
- treat Supabase backups as storage-object backup guarantees
- ignore advisor warnings without a reason
- use product analytics as the primary database incident signal

## 26. Decisions To Lock Now

The system should lock the following decisions now:

- database observability is a data-layer responsibility, not only a platform dashboard concern
- Supabase Logs and Advisors are the MVP database diagnosis surface
- hot query health must be tied to the approved query SLOs
- projection freshness must be inspectable
- jobs, webhooks, notifications, and deletion workflows need durable status records
- advisor findings inform review but do not automatically define migrations
- backup/restore behavior must be documented before production launch
- restore workflows must recheck public visibility and projection state
- AI agents must preserve visibility into data side effects

## 27. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 28. Final Recommendation

Mentor IB should keep the database operations model simple, but not vague.

The clean operating model is:

- use Supabase and Postgres-native visibility first
- keep durable records for async and projection work
- review hot queries against SLOs
- make public exposure cleanup observable
- treat migrations, backfills, deletion, and restore as operational events
- add heavier observability tooling only when real operating pain appears

That gives the future implementation agents enough guardrails to ship quickly without making the data layer a black box.

## 29. Official Source Notes

The guidance above is aligned with current official documentation for:

- Supabase Logs Explorer and product logs: `https://supabase.com/docs/guides/telemetry/logs`
- Supabase query optimization: `https://supabase.com/docs/guides/database/query-optimization`
- Supabase Performance and Security Advisors: `https://supabase.com/docs/guides/database/database-advisors`
- Supabase database backups: `https://supabase.com/docs/guides/platform/backups`
- Supabase production checklist: `https://supabase.com/docs/guides/deployment/going-into-prod`
- PostgreSQL statistics monitoring: `https://www.postgresql.org/docs/current/monitoring-stats.html`
- PostgreSQL routine vacuuming: `https://www.postgresql.org/docs/current/routine-vacuuming.html`
- PostgreSQL `EXPLAIN`: `https://www.postgresql.org/docs/current/using-explain.html`
