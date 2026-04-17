# Mentor IB Migration Conventions v1

**Date:** 2026-04-08
**Status:** Standalone data-layer contract for schema changes, data backfills, projection changes, and RLS-safe database rollout
**Scope:** migration file discipline, additive versus destructive change rules, RLS-aware rollout, data backfills, projection rebuild posture, enum-change posture, and release-safe sequencing for future AI-agent implementation

## 1. Why This Document Exists

Mentor IB already approved:

- a normalized relational write model
- explicit RLS boundaries for exposed data paths
- a maintained projection layer for hot query surfaces
- a preview-first, rollback-aware release model

What was still missing was the actual migration contract.

Without explicit migration conventions, teams usually drift into:

- schema changes that are technically valid but unsafe to release
- destructive changes bundled too early
- backfills mixed into the wrong migration step
- projection tables that are changed without rebuild planning
- RLS policies that fall out of sync with new tables, views, or functions

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how the approved schema and access model are changed over time.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`

It also inherits release constraints from:

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the canonical schema outline
- the auth matrix
- the RLS boundary model
- the testing and release architecture

It does not define:

- the final folder naming inside `supabase/`
- the exact ORM model file layout
- the exact CI command names

Those can be decided later as long as they obey the rules here.

## 4. Core Recommendation

Mentor IB should use forward-safe, version-controlled, SQL-first database migrations with explicit separation between:

1. schema shape changes
2. data backfills or repair work
3. projection rebuild work
4. RLS policy changes

The main migration rule is:

- additive before destructive
- expand before contract
- backfill separately when needed
- projection rebuilds planned explicitly
- RLS reviewed whenever exposed surfaces change

The goal is not theoretical purity.

The goal is safe release behavior for a product that will be built incrementally by AI agents.

## 5. Version-Control And Review Rules

## 5.1 Version-control rule

Every migration must live in version control and be reviewed like application code.

No production-only manual dashboard changes should become the normal path.

## 5.2 Local-first rule

Schema changes should be developed and tested locally first, then promoted through the approved release flow.

## 5.3 One-intent rule

A migration should have one clear primary purpose.

Good examples:

- add lesson meeting-access table
- add public tutor discovery projection
- add RLS policy for reviews public-read projection

Bad examples:

- one migration that renames columns, changes statuses, rebuilds projections, and rewrites several policies for unrelated domains

## 5.4 Reviewability rule

If a migration is hard to review, it is probably too broad.

Split large changes when that improves safety or clarity.

## 6. Schema-Change Categories

Every migration should be treated as one of these categories.

## 6.1 Category A: additive schema change

Examples:

- add a new nullable column
- add a new table
- add a new index
- add a new projection table
- add a new policy

This is the safest normal category.

## 6.2 Category B: compatible expansion

Examples:

- add a new status value to a validated-text family
- add a replacement column while the old one still exists
- add a new derived projection alongside an older read path

This is safe when old code still works.

## 6.3 Category C: backfill or repair

Examples:

- populate a new column from existing data
- rebuild trust snapshots
- recalculate availability helper rows

This should often be separated from the shape migration itself.

## 6.4 Category D: destructive or contract-tightening change

Examples:

- drop a column
- rename a widely used column without compatibility window
- tighten a nullable field to `not null`
- remove an old projection or status shape

This requires the strongest caution and usually a multi-step rollout.

## 7. Expand-Before-Contract Rule

Mentor IB should default to an expand-before-contract posture.

That means:

1. add the new shape first
2. ship code that reads/writes the new shape safely
3. backfill or dual-write if needed
4. verify no important path depends on the old shape
5. remove the old shape in a later release

This is especially important for:

- public route data surfaces
- matching inputs
- lesson and messaging records
- anything used by projections

## 8. Additive-First Rules

Prefer these patterns:

- add nullable column first
- add new table before redirecting writes
- add new index before relying on the query at scale
- add new projection table before deleting an older read path
- add new RLS policy before exposing the new route or client path

Avoid these patterns:

- rename a hot column in one step when old code may still run
- drop old fields in the same release that introduces the replacement
- depend on immediate global backfill completion before the app can function

## 9. RLS-Aware Migration Rule

## 9.1 Main rule

Any migration that adds or changes an exposed table, view, or callable function must include an RLS review.

## 9.2 Exposed-surface checklist

When a migration touches an exposed surface, review:

- whether the object belongs in the exposed schema at all
- whether RLS is enabled
- whether public access is explicit rather than accidental
- whether view and function boundaries are still safe
- whether Realtime or client JWT access behavior changed

## 9.3 No orphan exposed object rule

Do not ship a new exposed table or view and promise to "add policies later."

If it is exposed, its boundary must be defined in the same change set or the rollout must keep it unreachable.

## 10. Projection-Aware Migration Rule

## 10.1 Main rule

Schema changes must account for the maintained projection layer explicitly.

## 10.2 Projection impact review

When a migration changes canonical source tables, review whether it affects:

- `public_tutor_search_projection`
- `tutor_matching_projection`
- `tutor_trust_snapshot`
- `tutor_availability_projection`
- any future `lesson_list_projection`

## 10.3 Projection rollout rule

If a projection contract changes materially:

1. update the projection schema
2. update the refresh/rebuild logic
3. plan the backfill or rebuild
4. update cache invalidation logic if the consuming read surfaces changed

## 10.4 Projection rebuild separation

Do not hide major projection rebuild work inside a schema change that reviewers think is small.

If rebuild cost or timing matters, call it out explicitly.

## 11. Backfill Rules

## 11.1 Separate-when-needed rule

Backfills should be separated from shape changes when:

- the data volume may be meaningful
- the work may be slow
- retries may be needed
- the app can tolerate a short compatibility window

## 11.2 Safe inline-backfill rule

Small backfills can happen with the migration only when:

- the affected data is small
- the work is deterministic
- the lock and runtime impact are understood
- failure mode is clear

## 11.3 Durable backfill rule

Use the approved durable job lane for:

- large projection rebuilds
- heavy recalculations
- backfills that may need retries
- repair work after a partial rollout

## 11.4 Idempotency rule

Backfill and repair steps should be designed to be safe to re-run.

## 12. Destructive-Change Rules

## 12.1 Two-step rule

For risky removals:

1. ship code that no longer depends on the old shape
2. remove the old shape in a later release

## 12.2 No same-release trap rule

Do not:

- drop old columns in the same release that introduces replacement code
- remove old projection tables before consumers have moved
- convert a field to `not null` before the backfill proves completeness

## 12.3 Rename posture

Treat renames as risky changes.

In many cases, the safer path is:

- add new field
- copy data
- cut code over
- remove old field later

instead of direct rename-first behavior.

## 13. Constraint And Index Rules

## 13.1 Constraint posture

Add new constraints only when the data is already compatible or a clear backfill path exists.

Examples:

- `not null`
- foreign keys
- uniqueness constraints
- `check` constraints

## 13.2 Index posture

Indexes should be added deliberately for:

- hot public discovery queries
- matching inputs
- participant-scoped messaging queries
- lesson list/dashboard queries if they become hot

Index creation belongs in migration review because performance is part of correctness for this product.

## 13.3 Do not fake optimization later

If a schema change introduces a query path that clearly needs indexing, do not defer the index casually.

Use `docs/data/database-index-and-query-review-v1.md` when deciding whether the index belongs in the same migration path.

## 14. Enum And Status Evolution Rules

## 14.1 Main rule

Follow the approved glossary posture.

For MVP, most status families should remain validated text values rather than hard Postgres enums.

## 14.2 Why this matters

True Postgres enums create more migration friction when values evolve.

That friction is sometimes worth it, but not by default for fast-moving product domains.

## 14.3 New-status rule

When a validated-text status family gains a new value:

- update the glossary
- update database checks if used
- update domain validation
- update projection or query logic if the new status affects visibility or eligibility

## 14.4 Hard-enum caution

Do not convert a family to a hard DB enum casually.

That should happen only after the family is operationally stable.

## 15. Function, Trigger, And View Rules

## 15.1 Function rule

If a migration adds or changes a function that is callable from exposed paths:

- review it under the same access posture as tables
- document any elevated permissions
- keep scope narrow

## 15.2 Trigger rule

Use triggers for:

- narrow dirty-marking
- narrow bookkeeping
- safe freshness updates

Do not use triggers as the default home for heavy business workflows or large recomputation.

## 15.3 View rule

Views are not automatically safe.

If a view lives in an exposed schema, review RLS and field safety explicitly.

## 16. Release Sequencing Rules

## 16.1 Main rule

Database changes are part of the release plan, not an afterthought.

## 16.2 High-risk migration triggers

Treat a release as higher risk when migrations affect:

- auth-linked identity tables
- public search or tutor profile surfaces
- matching inputs
- lessons or meeting access
- payments or earnings
- RLS policies on exposed objects

## 16.3 Preview verification rule

Higher-risk database changes should go through:

- migration application in preview or local verification
- smoke testing against the changed shape
- explicit review of critical flows

## 16.4 Rollback-aware rule

Code rollback is easier than schema rollback.

Migration design must assume that production may need code rollback without instantly undoing the database shape.

## 17. Repair And Recovery Rules

If a migration partially succeeds or a projection becomes stale:

- prefer forward repair over panic rollback
- use targeted rebuilds where possible
- use full rebuilds only when needed
- preserve auditability of what changed

For schema repair:

- fix the data or apply a forward migration
- do not default to destructive undo unless the risk is clearly lower

## 18. AI-Agent Implementation Rules

Agents should:

- classify the change before writing the migration
- assume additive-first and expand-before-contract
- separate heavy backfills from schema shape when needed
- review projection impact whenever source tables change
- review RLS whenever exposed objects change
- prefer readable, narrowly scoped migrations over giant mixed-purpose files

Agents should not:

- rely on dashboard-only database edits as the normal workflow
- drop old shape too early
- introduce exposed objects without access review
- hide rebuild work in "small" migrations
- use hard DB enums too early for unstable status families

## 19. Decisions To Lock Now

The system should lock the following decisions now:

- migrations are SQL-first, version-controlled, and reviewed
- additive before destructive is the default posture
- expand before contract is the default release-safe sequencing rule
- exposed-schema changes always trigger RLS review
- projection-impact review is mandatory when source tables change
- heavy backfills and rebuilds should be explicit and often separate from shape changes
- enum friction should be avoided unless strict DB enforcement is worth it

## 20. Implementation Handoff Status

The implementation handoff path is:

1. use `docs/architecture/route-layout-implementation-map-v1.md` for app route shape
2. use `docs/planning/agent-implementation-decision-index-v1.md` and `docs/planning/implementation-task-template-v1.md` to create concrete implementation tasks

## 21. Final Recommendation

Mentor IB should treat migrations as a controlled product-safety surface, not just as SQL files.

The clean operating model is:

- small reviewed migrations in version control
- additive schema first
- backfill and rebuild work called out explicitly
- projection and RLS impact reviewed every time
- destructive cleanup only after code and data are already safe

That gives the project a migration posture that is understandable for humans, safe for AI agents, and compatible with the approved release architecture.

## 22. Official Source Notes

The guidance above is aligned with current official documentation for:

- Supabase local development with schema migrations: `https://supabase.com/docs/guides/local-development/overview`
- Supabase declarative database schemas: `https://supabase.com/docs/guides/local-development/declarative-database-schemas`
- Supabase seeding your database: `https://supabase.com/docs/guides/local-development/seeding-your-database`
- Supabase CLI migration reference: `https://supabase.com/docs/reference/cli/supabase-migration-new`
- PostgreSQL `ALTER TABLE`: `https://www.postgresql.org/docs/current/sql-altertable.html`
- PostgreSQL modifying tables: `https://www.postgresql.org/docs/current/ddl-alter.html`
