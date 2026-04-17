# Mentor IB Database Test Conventions v1

**Date:** 2026-04-08
**Status:** Standalone data-layer contract for SQL database tests, pgTAP usage, fixture boundaries, and migration-safe verification
**Scope:** canonical purpose of database tests, approved test families, SQL-script posture, transaction and fixture rules, RLS and projection verification, CI expectations, and AI-agent-safe conventions

## 1. Why This Document Exists

Mentor IB already approved:

- SQL-first migrations
- explicit RLS boundaries
- a maintained projection layer
- seeded synthetic local and preview environments
- a preview-first testing and release architecture

What was still missing was the actual convention layer for database tests.

Without an explicit database test contract, teams usually drift into:

- schema changes shipped without direct SQL-level verification
- RLS behavior tested only through application routes
- projection logic trusted because the UI "looks right"
- giant fixture dependencies that make failures opaque
- AI agents adding random test styles that do not compose well

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how the approved schema, RLS model, and projection layer should be verified directly at the database boundary.

It is the direct companion to:

- `docs/data/migration-conventions-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/seed-and-fixture-data-strategy-v1.md`
- `docs/data/supabase-folder-and-file-conventions-v1.md`

It also inherits constraints from:

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the overall testing stack
- the migration contract
- the seed and fixture strategy
- the auth and authorization matrix
- the route and UI E2E testing strategy

It does not define:

- the final GitHub Actions workflow file
- the final helper SQL utility library
- the final test command wrappers beyond the approved Supabase path

Those can be finalized later.

## 4. Core Recommendation

Mentor IB should use **SQL database tests as a first-class safety layer** for schema, RLS, projection, and migration-sensitive behavior.

The main rule is:

1. application tests do not replace direct DB tests
2. database tests should focus on database truths and database boundaries
3. phase 1 should prefer readable SQL-script pgTAP tests
4. tests should be isolated, deterministic, and minimally stateful
5. every meaningful exposed or hot-path schema change should trigger DB test review

## 5. Role Of Database Tests In The Overall Stack

Database tests are not the whole testing strategy.

They sit between migrations and application integration tests.

Their job is to verify things that are easiest, clearest, or safest to assert directly in SQL.

Good examples:

- tables, columns, and constraints exist as expected
- RLS blocks and allows the right rows
- public projections expose only approved data
- projection refresh queries preserve invariants
- helper functions or triggers behave correctly

Bad examples:

- full end-to-end UX flows
- browser behavior
- visual regressions
- route-level copy and component rendering

## 6. Canonical Database Test Families

Mentor IB should treat database tests as a few explicit families instead of one mixed folder of random checks.

## 6.1 Schema smoke tests

Purpose:

- verify that expected tables, columns, keys, and important constraints exist

Good examples:

- tutor profile table has `public_slug`
- lessons table has booking-state columns
- projection table has expected freshness columns

## 6.2 Constraint and invariant tests

Purpose:

- verify meaningful uniqueness, nullability, and state-boundary rules that matter to product correctness

Good examples:

- one public slug maps to one tutor profile
- required status transitions are enforced through supported DB constraints or write helpers
- one relationship row cannot duplicate another when a unique boundary should prevent it

## 6.3 RLS boundary tests

Purpose:

- verify positive and negative access at the database layer

Good examples:

- public projections are readable only under explicit public-safe conditions
- self-owned rows are readable by the owner and not by another user
- participant-only lesson and conversation rows stay private

## 6.4 Projection integrity tests

Purpose:

- verify that projection rows have the expected shape and eligibility behavior

Good examples:

- non-public tutors do not appear in public discovery projections
- projection updates preserve one-row-per-entity assumptions
- required public-safe columns are present and queryable

## 6.5 Function and trigger tests

Purpose:

- verify behavior only when the database truly owns that behavior

Good examples:

- a helper function returns the expected result
- a trigger maintains a derived field or audit row correctly

Do not create trigger or function tests for logic that should really live in the application service layer.

## 6.6 Migration and repair tests

Purpose:

- verify safety-critical shape or data assumptions introduced by migrations, backfills, or repair paths

Good examples:

- a new required column is backfilled as expected
- a compatibility window preserves transitional reads during rollout
- a repair script produces the intended normalized result

## 7. Canonical Test Style

## 7.1 Phase 1 preferred style

Phase 1 should prefer **SQL-script pgTAP tests** stored under:

- `supabase/tests/database/`

This matches Supabase's current testing guidance and keeps tests easy to review in the same language as the schema.

## 7.2 Script-style preference

Prefer script-style tests over xUnit-style DB test functions in phase 1.

Why:

- lower abstraction
- easier review in diffs
- easier for AI agents to author consistently
- less hidden setup

If xUnit-style pgTAP tests are adopted later for specific needs, that should be an explicit decision, not the default.

## 7.3 One-behavior-per-file rule

Each `.test.sql` file should have one clear main concern.

Good examples:

- `rls_public_tutor_search_projection.test.sql`
- `matching_projection_integrity.test.sql`
- `lessons_unique_booking_boundary.test.sql`

Bad examples:

- `misc_database_checks.test.sql`
- `all_rls_and_schema.test.sql`

## 8. Canonical SQL Test Shape

The default pgTAP SQL test shape should follow the standard transaction-wrapped pattern:

```sql
begin;

select plan(3);

-- arrange
-- act
-- assert

select * from finish();
rollback;
```

This keeps tests isolated and leaves the DB clean after execution.

## 8.1 Transaction wrapper rule

Wrap script-style database tests in a transaction and roll them back unless the specific test runner or setup pattern requires a different reviewed approach.

## 8.2 Explicit plan rule

Use an explicit `plan(...)` so the test contract is obvious in review.

## 8.3 Deterministic assertion rule

Assertions should be deterministic and should not depend on:

- uncontrolled row order
- current wall-clock time unless explicitly fixed
- external network state
- leftover rows from unrelated tests

## 8.4 Minimal arrange rule

Arrange only the rows needed for the behavior being tested.

## 9. Data Setup And Fixture Rules For DB Tests

## 9.1 Main rule

Database tests should prefer **local in-test setup** first, then **small named fixtures** when a scenario is too large to express clearly inline.

## 9.2 No magical baseline dependency

Database tests should not silently depend on a huge default seed set just because it happens to exist locally.

If a test depends on seed data, that dependency should be obvious and intentional.

## 9.3 Named-fixture rule

When a scenario is large enough to justify a fixture:

- use a small named fixture
- keep it purpose-specific
- keep it synthetic and safe

This should align with the approved seed and fixture strategy.

## 9.4 No copied production data rule

Never use copied production personal data in database tests.

## 10. RLS And Authorization Test Conventions

## 10.1 Main rule

RLS-sensitive tables and public projections should have direct DB tests for both:

- allowed access
- denied access

## 10.2 Positive-and-negative pair rule

Do not stop after proving the happy path.

For meaningful RLS checks, test both:

- who can read or write
- who cannot read or write

## 10.3 Public projection rule

For any publicly readable projection or view, test:

- public-safe inclusion behavior
- non-public exclusion behavior

## 10.4 Participant boundary rule

For participant-owned surfaces such as lessons and conversations, test:

- participant visibility
- non-participant denial

## 10.5 Server-only reminder

Some boundaries are better protected by keeping tables server-only rather than relying on complex RLS alone.

Database tests should reinforce that distinction rather than pushing every rule into exposed-schema policy logic.

## 11. Projection Test Conventions

## 11.1 Main rule

Hot-path projections should have direct integrity tests close to the database layer.

## 11.2 What to verify

At minimum, projection tests should verify:

- one-row-per-entity assumptions where required
- visibility and eligibility behavior
- required derived columns exist and are populated correctly
- old or ineligible entities do not leak into public or matching reads

## 11.3 No UI-substitute rule

A UI screenshot or manual page check is not a substitute for projection integrity tests.

## 12. Migration-Coupled Test Review Rule

## 12.1 Main rule

Any migration that changes an exposed boundary, projection, or important invariant must trigger a DB test review.

That can mean:

- add a new test
- update an existing test
- explicitly document why no DB test change is needed

## 12.2 Especially test these changes

DB test review is especially important for:

- new public projections
- new RLS policies
- new unique or state constraints
- backfills that alter meaningfully queried data
- matching and trust projection changes

## 13. CI And Release Posture For DB Tests

## 13.1 Main rule

Database tests should run locally for DB changes and in CI before merge or release according to the broader testing architecture.

## 13.2 Failure rule

A failing DB test should block the relevant schema change from being treated as releasable.

## 13.3 Environment rule

DB tests should run against the approved local or CI test database target, not against production.

## 14. Anti-Patterns To Avoid

Do not:

- put schema DDL assertions and unrelated RLS scenarios in one giant test file
- make every DB test depend on all baseline seeds
- use DB tests as a substitute for route or E2E testing
- rely on manual dashboard setup before tests can run
- hide important setup in undocumented helper scripts
- write brittle assertions against uncontrolled ordering or timestamps

## 15. AI-Agent Implementation Rules

Future AI agents should:

- write DB tests in readable SQL
- keep one main behavior per file
- use transaction-wrapped pgTAP script style by default
- add or update DB tests when migrations affect exposed or hot-path behavior
- keep setup minimal and synthetic
- prefer direct SQL assertions for DB truths

Agents should not:

- invent a second database test framework by reflex
- place database tests outside `supabase/tests/database/`
- depend on giant hidden fixtures
- test app-rendering behavior in SQL
- ship RLS or projection changes without DB test review

## 16. Decisions To Lock Now

The system should lock the following decisions now:

- SQL-script pgTAP tests are the phase 1 default
- `supabase/tests/database/` is the canonical home
- DB tests focus on schema, constraints, RLS, projections, and DB-owned behavior
- tests should be transaction-wrapped and deterministic by default
- tests should prefer minimal setup or named small fixtures
- DB test review is mandatory for exposed-boundary and hot-path DB changes

## 17. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 18. Final Recommendation

Mentor IB should treat SQL database tests as a direct safety contract for the most important database truths:

- schema shape
- access boundaries
- projection integrity
- migration-sensitive invariants

That gives the project a much stronger foundation than relying on UI tests or manual checks alone, and it gives future AI agents a clear, repeatable way to verify database behavior where it actually lives.

## 19. Official Source Notes

The guidance above is aligned with current official documentation for:

- Supabase database testing: `https://supabase.com/docs/guides/database/testing`
- pgTAP overview: `https://pgtap.org/`
- pgTAP `pg_prove`: `https://pgtap.org/pg_prove.html`
- PostgreSQL `BEGIN`: `https://www.postgresql.org/docs/17/sql-begin.html`
