# Mentor IB Supabase Folder And File Conventions v1

**Date:** 2026-04-08
**Status:** Standalone data-layer repository-structure contract for Supabase config, migrations, seeds, database tests, and optional Supabase-managed folders
**Scope:** canonical `supabase/` directory shape, file naming rules, what belongs in each folder, what does not, and the minimum structure future AI agents should follow for database and Supabase-local work

## 1. Why This Document Exists

Mentor IB already approved:

- SQL-first migrations
- a maintained projection layer
- local-first schema development
- one shared Next.js application with route handlers owned in `src/app/api`

What was still missing was the concrete repository structure for Supabase-specific work.

Without an explicit folder contract, teams usually drift into:

- random SQL files at the repo root
- mixed migration and seed content
- hidden local-only config changes
- tests stored in inconsistent places
- premature Edge Function folders even though the app does not need them yet

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how the database and Supabase-local assets are organized in the repository.

It is the direct companion to:

- `docs/data/migration-conventions-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`

It also inherits release and route boundaries from:

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- migration sequencing rules
- seed content strategy
- SQL projection patterns
- app route layout

It does not define:

- the actual schema contents
- the final Drizzle file layout
- the final CI commands

Those should come later.

## 4. Core Recommendation

Mentor IB should use one explicit `supabase/` directory at repo root, with a small number of clearly owned subfolders.

The main rule is:

- database and Supabase-local infrastructure files live under `supabase/`
- application code lives outside `supabase/`
- route handlers stay in the Next.js app by default
- optional Supabase subfolders should appear only when there is a real need for them

## 5. Canonical Supabase Directory Shape

Phase 1 should use a structure like this:

```text
supabase/
  config.toml
  migrations/
  seeds/
  tests/
    database/

  functions/               # optional later, absent by default
    _shared/
    some-function/
      index.ts
    tests/

  templates/               # optional, only if local auth email templates are customized
```

This is the canonical structure contract, not a requirement that every optional folder exists on day one.

## 6. Root `supabase/` Rules

The `supabase/` root should contain only Supabase-owned or database-owned artifacts.

Good examples:

- `config.toml`
- migrations
- seeds
- pgTAP database tests
- optional Supabase functions if later justified
- optional local auth email templates

Bad examples:

- random scratch SQL files
- application DTO code
- route handlers for the Next.js app
- unrelated scripts that are not specifically tied to Supabase CLI workflows

## 7. `config.toml` Rules

`supabase/config.toml` is the canonical local Supabase configuration file.

It should own:

- local stack configuration
- local auth configuration
- local seed-path configuration
- optional branch-specific remote config later if used

It should not be treated as:

- a secret vault checked into git
- a place for hardcoded production secrets

Use `env()` references when sensitive local config needs environment values.

## 7.1 Config ownership rule

There should be one `supabase/config.toml` file per repo.

Do not create parallel config files and expect humans or agents to remember which one matters.

## 7.2 Branch-specific config rule

If Supabase branch-specific remotes are adopted later, keep them inside the same `config.toml` rather than inventing custom sidecar config files.

## 8. `migrations/` Rules

## 8.1 Folder purpose

`supabase/migrations/` is the canonical home for version-controlled database migrations.

## 8.2 Flat-folder rule

Keep migrations in one flat folder.

Do not create nested domain subfolders under `migrations/` unless the chosen tooling explicitly supports and requires it.

The main goal is predictable CLI behavior and simple review.

## 8.3 Naming rule

Use timestamped migration names plus a short intent slug.

Recommended shape:

```text
YYYYMMDDHHMMSS_domain_intent.sql
```

Examples:

- `20260408103000_lessons_add_meeting_access.sql`
- `20260408121500_matching_add_tutor_projection.sql`
- `20260408142000_reviews_add_public_read_policy.sql`

## 8.4 One-intent rule

Follow the migration doc:

- one migration should have one clear main purpose

Avoid names like:

- `misc.sql`
- `fix_stuff.sql`
- `changes.sql`

## 8.5 Scratch-SQL rule

Do not keep review-unready scratch queries inside `supabase/migrations/`.

If temporary scratch SQL is needed during development, it should live outside the canonical migration path and should not become part of the permanent repo contract by accident.

## 9. `seeds/` Rules

## 9.1 Folder purpose

`supabase/seeds/` is the preferred home for modular seed SQL files.

## 9.2 Preferred phase 1 posture

Even though Supabase supports the default `supabase/seed.sql` path, Mentor IB should prefer a modular seeds folder from the beginning because:

- the project is domain-heavy
- different seed groups will exist for auth, tutors, availability, lessons, and trust data
- modular files are easier for AI agents to reason about and update safely

Use `config.toml` to point `db.seed.sql_paths` at the modular seed files or globs.

## 9.3 Naming rule

Use deterministic ordered filenames when order matters.

Recommended shape:

```text
NN_domain_intent.sql
```

Examples:

- `00_reference_data.sql`
- `10_identities.sql`
- `20_tutors.sql`
- `30_learning_needs.sql`

## 9.4 What does not belong here

Do not put:

- schema migrations
- one-off manual repair scripts
- test assertions

into `supabase/seeds/`.

## 10. `tests/database/` Rules

## 10.1 Folder purpose

`supabase/tests/database/` is the canonical home for SQL database tests run through the Supabase CLI and pgTAP.

## 10.2 File rule

Use `.test.sql` suffixes for database tests.

Examples:

- `auth_identity_resolution.test.sql`
- `rls_public_tutor_search_projection.test.sql`
- `matching_projection_integrity.test.sql`

## 10.3 Organization rule

If the test suite grows, organize it under nested folders inside `supabase/tests/database/`.

Recommended subfolders later:

- `smoke/`
- `auth/`
- `rls/`
- `projections/`
- `matching/`

## 10.4 What belongs here

Use this folder for:

- schema integrity tests
- RLS tests
- projection integrity tests
- helper-function tests

Do not use it for browser or application-flow tests.

## 11. `functions/` Rules

## 11.1 Default posture

`supabase/functions/` should be absent by default in phase 1.

Why:

- the approved architecture uses Next.js route handlers and server actions first
- MVP does not require Supabase Edge Functions as a default platform
- adding a second server boundary too early makes the repo harder for agents to reason about

## 11.2 When to create it

Create `supabase/functions/` only when there is a real use case that is clearly better served there than in `src/app/api` or the server/domain layer.

## 11.3 If functions are later adopted

Use this structure:

```text
supabase/functions/
  _shared/
  function-name/
    index.ts
  tests/
```

Rules:

- keep shared code in `_shared`
- keep one folder per function
- keep function tests in the functions test area, not mixed into database tests

## 11.4 Do not duplicate webhook ownership

If a webhook already belongs in the app route layer, do not create a second Edge Function copy of it.

One boundary should own each integration path.

## 12. `templates/` Rules

`supabase/templates/` is optional.

Create it only if local auth email templates are intentionally customized for local development or preview behavior.

Do not create it just to mirror platform defaults without a reason.

## 13. What Stays Outside `supabase/`

These concerns belong outside the `supabase/` directory:

- Next.js route handlers
- application domain modules
- DTO builders
- frontend and server UI code
- Drizzle usage in app code
- generic scripts that are not Supabase-CLI-owned

Examples:

- Stripe webhook route -> `src/app/api/stripe/webhook/route.ts`
- calendar export route -> `src/app/api/calendar/.../route.ts`

## 14. SQL File Conventions

For canonical SQL files under `supabase/`:

- use lowercase snake_case filenames
- keep names intent-revealing
- avoid vague suffixes like `misc`, `stuff`, or `temp`
- use ASCII only

The file name should help a human or agent infer:

- what changed
- where it belongs
- whether it is migration, seed, or test content

## 15. No Mixed Schema-System Rule

Supabase supports both migration-based and declarative schema workflows.

Mentor IB already chose the SQL-first migration path for MVP.

That means:

- do not mix a second parallel schema-authoring system into the repo casually
- do not introduce declarative-schema ownership later without an explicit architecture decision

One repo should have one clear database authoring posture.

## 16. Preview And Local Rules

This folder structure should support:

- local-first schema work
- one shared preview backend in MVP
- later stronger branch isolation if needed

The structure should not assume:

- per-PR isolated Supabase branches on day one
- production-only dashboard editing

## 17. AI-Agent Implementation Rules

Agents should:

- put Supabase-owned artifacts under `supabase/`
- keep migrations flat and timestamped
- keep seed content modular under `supabase/seeds/`
- keep database tests under `supabase/tests/database/`
- avoid creating `supabase/functions/` unless a real architecture need exists
- keep app route handlers in the Next.js app layer

Agents should not:

- drop ad hoc SQL files into the repo root
- mix migration, seed, and test content in the same file
- create parallel config files
- create Edge Functions by reflex when route handlers already fit
- treat `supabase/` as a dumping ground for random scripts

## 18. Decisions To Lock Now

The system should lock the following decisions now:

- one canonical `supabase/` directory at repo root
- `supabase/config.toml` as the single Supabase config contract
- flat timestamped `supabase/migrations/`
- modular `supabase/seeds/` as the preferred seed posture
- `supabase/tests/database/` as the canonical home for SQL database tests
- no `supabase/functions/` by default in phase 1
- app route handlers remain the default server integration boundary

## 19. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 20. Final Recommendation

Mentor IB should keep the `supabase/` workspace small, explicit, and boring:

- one config file
- one migrations folder
- one modular seeds folder
- one database-tests folder
- optional folders only when the architecture truly needs them

That gives future AI agents a predictable place to put database work, keeps Supabase-specific assets separate from app code, and reduces repository drift as the system grows.

## 21. Official Source Notes

The guidance above is aligned with current official documentation for:

- Supabase CLI config: `https://supabase.com/docs/guides/local-development/cli/config`
- Supabase local development overview: `https://supabase.com/docs/guides/local-development`
- Supabase seeding your database: `https://supabase.com/docs/guides/local-development/seeding-your-database`
- Supabase database testing: `https://supabase.com/docs/guides/database/testing`
- Supabase testing and linting: `https://supabase.com/docs/guides/local-development/cli/testing-and-linting`
- Supabase local development for Edge Functions: `https://supabase.com/docs/guides/functions/local-development`
- Supabase managing config and secrets: `https://supabase.com/docs/guides/local-development/managing-config`
