# Mentor IB Seed And Fixture Data Strategy v1

**Date:** 2026-04-08
**Status:** Standalone data-layer contract for seed data, scenario fixtures, preview demo data, and synthetic scale datasets
**Scope:** canonical distinction between seeds and fixtures, environment-specific data posture, folder strategy, deterministic synthetic data rules, auth/bootstrap boundaries, and safe usage by future AI agents

## 1. Why This Document Exists

Mentor IB already approved:

- a normalized write model
- explicit migration conventions
- a maintained projection layer
- a canonical `supabase/` folder structure
- preview-first testing and release architecture

What was still missing was the actual strategy for non-production data.

Without an explicit seed and fixture contract, teams usually drift into:

- random demo rows mixed into migrations
- local environments that only work on one machine
- preview data that is visually nice but structurally unrealistic
- database tests that depend on hidden manual setup
- copied production data being treated as the easiest shortcut
- AI agents generating new fake data in inconsistent formats on every task

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how canonical database-compatible non-production data should be created, organized, loaded, and maintained.

It is the direct companion to:

- `docs/data/supabase-folder-and-file-conventions-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`

It also inherits constraints from:

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- schema design
- migration safety rules
- database test-writing conventions
- preview deployment rules
- privacy or security architecture

It does not define:

- the final Drizzle file layout
- the final E2E test runner fixture helpers
- the final CI commands for loading special fixtures

Those should come later.

## 4. Core Recommendation

Mentor IB should use a three-layer non-production data model:

1. **reference seeds** for canonical shared vocabularies and baseline lookup rows
2. **baseline synthetic seeds** for predictable local and preview environments
3. **named scenario fixtures** for targeted tests, demos, and scale checks

The main rule is:

- default seeds should be small, deterministic, and safe to rerun
- fixtures should be intentional, named, and not part of every reset
- production should never depend on demo or test fixtures
- copied production personal data should never become the default shortcut

## 5. Canonical Terms

## 5.1 Reference seed

Reference seeds contain stable rows that define shared vocabulary or lookup content.

Examples:

- languages
- meeting providers
- video media providers
- approved subject or curriculum vocabularies if they are modeled as tables

These rows are part of the product contract, not demo content.

## 5.2 Baseline synthetic seed

Baseline synthetic seeds create a predictable working environment for local development and preview review.

Examples:

- synthetic users
- synthetic tutor profiles
- synthetic availability examples
- synthetic lesson and messaging examples for core flows

## 5.3 Preview overlay seed

A preview overlay is optional extra synthetic data that exists only to make shared preview environments more reviewable.

Examples:

- a curated set of public tutor profiles for visual review
- a couple of end-to-end booking states
- safe trust and moderation examples

This should remain synthetic and controlled.

## 5.4 Fixture

A fixture is a named scenario package used intentionally for a specific purpose.

Examples:

- one matching scenario with three tutors and one learning need
- one confirmed lesson with meeting access
- one moderation/report scenario
- one pricing or payout edge case

Fixtures are not the same as the default seed path.

## 5.5 Scale fixture

A scale fixture is a larger synthetic dataset used for performance, ranking, and query-behavior verification.

Examples:

- 100 tutors
- 1,000 tutors
- dense schedule overlap cases

Scale fixtures should be opt-in and should not run during every local reset.

## 6. Environment Seeding Posture

## 6.1 Local

Local should default to:

- reference seeds
- baseline synthetic seeds
- optional targeted fixtures when needed

The goal is reproducibility, not realism at all costs.

## 6.2 Preview

Preview should default to:

- reference seeds
- a controlled synthetic baseline
- an optional preview overlay if the shared review environment needs it

Preview data should help humans review the product quickly without exposing real user data.

## 6.3 Production

Production should not load demo fixtures, test fixtures, or performance fixtures.

If the product depends on lookup rows or other required reference data, those rows must be promoted intentionally through an approved release-safe path.

That can be:

- a dedicated reference-data migration
- an approved bootstrap step
- another explicit production-safe mechanism

This document does not force one production rollout vehicle, but it does require the source rows to remain centralized and canonical.

## 7. Canonical Seed Families

Mentor IB should treat seed content as a few explicit families rather than one giant SQL blob.

## 7.1 Reference vocabulary family

This family should contain canonical shared lookup rows.

Likely examples for phase 1:

- `languages`
- `meeting_providers`
- `video_media_providers`
- other approved vocabulary tables that the app depends on

## 7.2 Baseline identity family

This family should contain a small number of synthetic identities needed for predictable development and preview use.

Examples:

- one or two student examples
- several approved tutor examples
- one pending tutor application example
- one internal admin example only if operational surfaces need visual review

## 7.3 Baseline operational family

This family should contain synthetic domain rows that make the product usable after reset.

Examples:

- tutor subject capabilities
- availability samples
- one or two learning needs
- a few lessons in different states
- safe example messages
- a few lesson-linked reviews

## 7.4 Fixture family

This family should contain named scenarios that are not part of the default seed load.

Examples:

- `matching_math_hl_priority.sql`
- `booking_confirmed_with_meet_link.sql`
- `moderation_reported_message_thread.sql`

## 7.5 Scale family

This family should contain larger synthetic datasets used only when intentionally validating search, matching, or projection performance.

This is especially important for Mentor IB because public tutor browse and internal matching speed are product-critical surfaces.

## 8. Canonical Folder Strategy Inside `supabase/seeds`

Inside `supabase/seeds/`, phase 1 should use a structure like this:

```text
supabase/seeds/
  reference/
  baseline/
  preview/        # optional
  fixtures/
  scale/
```

The main rule is:

- `reference/` and `baseline/` are the normal seed path
- `preview/` is optional and environment-specific
- `fixtures/` and `scale/` are opt-in only

## 8.1 Default seed path rule

The default `db.seed.sql_paths` configuration should include only the approved default families.

Good default shape:

```toml
[db.seed]
enabled = true
sql_paths = [
  "./seeds/reference/*.sql",
  "./seeds/baseline/*.sql",
]
```

This follows Supabase's documented `db.seed.sql_paths` model and preserves predictable execution order.

## 8.2 Fixture exclusion rule

Do not include `fixtures/` or `scale/` in the default seed path.

They should be loaded only when a developer, test runner, or approved script intentionally requests them.

## 8.3 Ordered filename rule

When order matters within a family, use deterministic numeric prefixes.

Examples:

- `00_reference_languages.sql`
- `05_reference_meeting_providers.sql`
- `10_baseline_users.sql`
- `20_baseline_tutor_profiles.sql`

## 9. Determinism And Idempotency Rules

## 9.1 Main rule

Default seeds should be deterministic and safe to rerun.

## 9.2 Stable identifier rule

Use stable primary keys or stable unique business keys wherever cross-file references matter.

Do not rely on accidental insert order or auto-generated identifiers that make diffs harder to reason about.

## 9.3 Idempotent insert rule

Reference and baseline seed files should generally be written to behave safely on repeated execution.

Good patterns include:

- `insert ... on conflict do nothing`
- `insert ... on conflict do update`

when the target unique boundary is explicit and intentional.

## 9.4 No hidden randomness rule

Do not put non-deterministic random generators directly in the default seed path.

If synthetic data is generated by a tool, the reviewed output should be committed as canonical SQL or another approved deterministic artifact.

## 9.5 Safe fake identity rule

Synthetic emails, names, phones, and message content should be obviously fake and safe.

Prefer non-deliverable or example-style identity patterns such as:

- `.test`
- `.example`

Do not use real staff emails, real tutor emails, or scraped public data as shortcuts.

## 10. Auth And Identity Bootstrap Posture

## 10.1 Main rule

Auth-like demo accounts should use one approved bootstrap path rather than scattered direct hacks.

## 10.2 Baseline SQL seed boundary

The default SQL seed path should focus on database-owned domain rows.

It should not depend on a random mixture of:

- manual dashboard-created users
- hidden local scripts
- undocumented raw auth mutations spread across unrelated seed files

## 10.3 Dedicated auth fixture rule

If local preview or E2E flows need sign-in capable synthetic users, that bootstrap path should be centralized and documented as a dedicated mechanism.

It may be:

- a dedicated local-only auth bootstrap script
- a dedicated local-only SQL helper if proven safe and compatible
- another single approved path

The important rule is centralization, not ad hoc repetition.

## 10.4 Production rule

Production must never depend on seeded synthetic auth identities.

## 11. Relationship To Migrations, Tests, And Reference Data

## 11.1 No schema-in-seeds rule

Supabase's seeding guidance already recommends keeping seed files focused on data insertion.

Mentor IB should follow that strictly:

- migrations change schema
- seeds populate data
- tests assert behavior

## 11.2 No demo-data-in-migrations rule

Do not hide demo content inside migrations just because it is easier to make it "always exist."

## 11.3 Reference-data promotion rule

If a reference row family becomes necessary for real product correctness in production, promote it intentionally through the approved release path.

Do not keep two different truths:

- one truth in seed files
- another truth in ad hoc production SQL

## 11.4 Database-test boundary

Small SQL database tests should usually create only the rows they need inside the test transaction or load a minimal named fixture.

They should not rely on a giant magical baseline seed unless the test explicitly says so.

## 12. Scenario Fixture Design Rules

Fixtures should be named around product meaning, not table names.

Good fixture themes:

- matching
- booking
- messaging
- moderation
- reviews
- schedule overlap

Good examples:

- `match_two_good_fits_one_fallback.sql`
- `lesson_reschedule_pending.sql`
- `reported_thread_blocked_sender.sql`

Bad examples:

- `misc_fixture.sql`
- `seed_extra.sql`
- `sample_data_2.sql`

## 12.1 Minimal-scope rule

Each fixture should include only the rows needed for that scenario.

That keeps tests faster and makes review easier.

## 12.2 Safe-content rule

Even moderation fixtures should avoid gratuitous harmful content.

Use only the minimum representative synthetic content needed to test behavior.

## 13. Scale And Performance Fixture Rules

Mentor IB should explicitly support optional scale fixtures for hot paths such as:

- public tutor browse search
- guided match generation
- projection rebuild checks

This matters because search latency and matching latency are product-critical.

## 13.1 Default-size rule

Default seeds should stay small enough to reset quickly and remain human-reviewable.

## 13.2 Optional scale tiers

If scale fixtures are added, prefer explicit tiers such as:

- `100_tutors`
- `1000_tutors`
- `dense_availability_overlap`

## 13.3 Isolation rule

Scale fixtures should never be part of the normal local reset, preview reset, or CI baseline unless a specific job is intentionally validating scale behavior.

## 14. Optional Synthetic Data Generator Rule

Tools that generate synthetic SQL, such as generators mentioned in current Supabase docs, may be used later if they save time.

But the canonical rule should be:

- generated output must be reviewable
- generated output must remain synthetic and safe
- generated output should be committed in a stable form before it becomes part of the shared project contract

Do not make CI, preview, or local resets depend on hidden generation steps that humans or agents do not fully see.

## 15. AI-Agent Implementation Rules

Future AI agents should:

- extend existing seed families instead of inventing new random ones
- keep default seeds deterministic
- keep fixtures small and purpose-named
- avoid mixing auth bootstrap behavior into unrelated domain seed files
- avoid copied production data
- avoid real or risky personal data in synthetic rows
- preserve stable keys where scenarios depend on them

Agents should not:

- put schema statements in seed files
- add `fixtures/` or `scale/` to default reset config by reflex
- create giant all-purpose fixture files
- introduce random faker-like output directly into canonical seed SQL
- hide product-required reference rows in manual one-off scripts

## 16. Decisions To Lock Now

The system should lock the following decisions now:

- seed data and fixtures are separate concepts
- default reset uses `reference/` plus `baseline/`
- `fixtures/` and `scale/` stay opt-in
- default seeds are deterministic and rerunnable
- copied production data is out of bounds
- auth-capable demo users use one centralized bootstrap path
- performance-scale data is supported intentionally, not mixed into the baseline

## 17. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 18. Final Recommendation

Mentor IB should keep non-production data boring, explicit, and reusable:

- canonical reference seeds
- a small synthetic baseline
- named scenario fixtures
- optional scale datasets for search and matching validation

That gives the project reproducible local environments, safer previews, better tests, and a cleaner retrieval layer for future AI agents than one giant demo SQL blob ever could.

## 19. Official Source Notes

The guidance above is aligned with current official documentation for:

- Supabase seeding your database: `https://supabase.com/docs/guides/local-development/seeding-your-database`
- Supabase CLI config, including `db.seed.sql_paths`: `https://supabase.com/docs/guides/local-development/cli/config`
- Supabase database testing: `https://supabase.com/docs/guides/database/testing`
- PostgreSQL `INSERT`: `https://www.postgresql.org/docs/current/sql-insert.html`
