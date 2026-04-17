# Mentor IB Drizzle Schema And Query Conventions v1

**Date:** 2026-04-08
**Status:** Standalone data-layer implementation contract for Drizzle schema declarations, query organization, and server-side database access boundaries
**Scope:** Drizzle ownership boundaries, file placement, schema declaration conventions, query and transaction patterns, projection access rules, and AI-agent-safe usage within the approved SQL-first architecture

## 1. Why This Document Exists

Mentor IB already approved:

- `Drizzle ORM` as the preferred typed server-side database access layer
- SQL-first migrations under `supabase/migrations/`
- one shared modular-monolith application
- explicit projection, RLS, and authorization boundaries

What was still missing was the actual convention layer for using Drizzle inside the codebase.

Without an explicit Drizzle contract, teams usually drift into:

- treating Drizzle schema files as the only source of truth even though SQL migrations are canonical
- mixing route-level data code and domain data code
- giant `schema.ts` files with no domain ownership
- browser-side leakage of DB types
- forcing every query through ORM helpers even when SQL is the clearer answer
- AI agents inventing local query styles that do not match each other

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how the approved relational schema is represented and queried in application code.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/supabase-folder-and-file-conventions-v1.md`

It also inherits constraints from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/security-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the canonical SQL migration contract
- the schema outline
- the auth and authorization matrix
- the RLS boundary model
- the route-layout map

It does not define:

- the exact Postgres driver package choice
- final testing commands
- every individual repository function name
- the final module map beyond the already approved architecture

Those can be finalized later as long as they obey the rules here.

## 4. Core Recommendation

Mentor IB should use Drizzle as a **typed server-side access layer around the approved database**, not as a second competing schema-ownership system.

The main rule is:

1. SQL migrations remain the canonical database-change path
2. Drizzle schema files mirror the approved database shape for typed access
3. domain modules own repositories and query composition
4. routes and UI never become the place where raw database logic lives
5. complex or hot-path SQL is allowed when it is the clearest and safest answer

## 5. Drizzle Ownership Boundary

## 5.1 Database source-of-truth rule

The database schema is canonically owned by reviewed SQL migrations under `supabase/migrations/`.

Drizzle schema declarations must stay consistent with that shape, but they do not replace it.

## 5.2 Drizzle role

Drizzle should own:

- typed table declarations for app code
- typed query composition
- typed transactions
- typed projection reads
- typed parameterized SQL composition where raw SQL is still the right answer

Drizzle should not own:

- production schema rollout policy
- canonical migration history
- RLS policy authority
- public DTO shape by default

## 5.3 No parallel schema-system rule

Mentor IB already chose a SQL-first migration model.

That means:

- do not use `drizzle-kit push` as the canonical schema rollout path
- do not let generated code-first diffs silently replace reviewed SQL migrations
- do not treat the Drizzle schema folder as a second independent database truth

If Drizzle tooling is later used for local assistance, it must remain subordinate to the approved SQL migration flow.

## 6. Server-Only Boundary

Drizzle usage must stay server-side.

Allowed:

- Server Components
- Server Actions
- Route Handlers
- domain services and repositories
- approved background jobs

Not allowed:

- browser-side direct Drizzle imports
- client components importing the DB client
- public UI code importing table declarations just for convenience

## 7. Canonical File And Ownership Shape

Drizzle should follow the approved modular-monolith structure rather than one giant global data folder.

Recommended phase 1 shape:

```text
src/
  server/
    db/
      client.ts
      schema/
        index.ts

  modules/
    accounts/
      schema.ts
      repository.ts
      service.ts
      dto.ts
      policies.ts

    tutors/
      schema.ts
      repository.ts
      service.ts
      dto.ts

    lessons/
      schema.ts
      repository.ts
      service.ts
      dto.ts

    conversations/
      schema.ts
      repository.ts
      service.ts
      dto.ts
```

## 7.1 Ownership rule

Module-owned tables and queries should live with the owning domain module.

Examples:

- `src/modules/tutors/schema.ts`
- `src/modules/tutors/repository.ts`
- `src/modules/lessons/schema.ts`
- `src/modules/lessons/repository.ts`

This keeps domain ownership clear and matches the approved architecture.

## 7.2 Aggregation rule

Use a small shared barrel such as `src/server/db/schema/index.ts` to re-export module-owned Drizzle tables and views when the DB client or shared typed helpers need one combined schema object.

Do not make the barrel the real ownership location.

## 7.3 Client rule

Use one shared server DB client module such as:

- `src/server/db/client.ts`

That file should own:

- driver initialization
- Drizzle initialization
- any strictly shared DB wiring

It should not become a place for business logic.

## 8. Schema Declaration Conventions

## 8.1 Table export naming rule

Use readable TypeScript export names for table objects.

Examples:

- `appUsers`
- `tutorProfiles`
- `learningNeeds`
- `matchCandidates`

## 8.2 Database identifier rule

Database table and column identifiers remain canonical `snake_case`.

Drizzle declarations should mirror those identifiers explicitly rather than hiding them behind clever remapping.

Recommended posture:

- explicit table names in `snake_case`
- explicit column names in `snake_case`
- TypeScript table object names may still be idiomatic export names

## 8.3 Column-property rule

For Mentor IB, Drizzle column property keys should usually match the actual database column names exactly.

Examples:

```ts
export const tutorProfiles = pgTable('tutor_profiles', {
  id: uuid('id').primaryKey(),
  public_slug: text('public_slug'),
  display_name: text('display_name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull(),
});
```

This is slightly less fashionable in TypeScript than camelCase keys, but it is lower ambiguity for:

- SQL review
- schema debugging
- AI-agent retrieval
- migration alignment

## 8.4 Constraint-mirroring rule

If the database shape depends on a constraint or default that application code relies on, the Drizzle declaration should reflect it too where supported.

Examples:

- `notNull`
- default expressions
- primary keys
- unique boundaries where they matter for typing or query code

## 8.5 Managed-schema boundary

Managed provider schemas such as `auth` and `storage` are integration boundaries, not normal module-owned table families.

If application code needs read-only references for them, declare those carefully and minimally.

Do not treat:

- `auth.users`
- `auth.identities`
- `storage.objects`

as ordinary application-owned write tables.

## 8.6 Projection declaration rule

Approved projection tables and stable views should be declared in Drizzle for typed access when the application reads them directly.

But:

- their DDL still belongs in SQL migrations
- their maintenance logic still follows the projection strategy docs

## 9. Repository And Query Ownership Conventions

## 9.1 Main rule

Routes should call domain services.

Domain services should call repositories.

Repositories should own Drizzle query composition.

## 9.2 No route-owned query rule

Do not write substantial Drizzle queries directly inside:

- page files
- layout files
- client components
- random route handlers

Small glue code is fine.

Business query ownership is not.

## 9.3 Module boundary rule

Repositories should primarily read and write the tables owned by their module.

Cross-module reads are allowed where the product truly needs them, but they should remain intentional and reviewable.

## 10. Select And Read Conventions

## 10.1 Explicit select rule

Prefer explicit selected fields for public or UI-facing reads.

Do not default to "entire row everywhere" when the route only needs a small DTO.

## 10.2 DTO separation rule

Drizzle row shapes are not automatically route DTOs.

Repositories and services may return:

- raw row shapes for tightly internal use
- mapped DTO-safe shapes for route and UI consumers

Public and cross-boundary consumers should receive DTO-safe shapes, not raw table records by reflex.

## 10.3 Query-shape rule

Shape queries around product use cases, not just table names.

Good examples:

- public tutor profile read
- tutor dashboard lesson list
- student conversation list
- matching projection lookup by candidate slice

Bad examples:

- one generic "get tutor by id and everything else" function that every route reuses regardless of actual needs

## 10.4 Hot-read rule

Public discovery, matching, trust, and schedule hot reads should prefer the approved projection surfaces instead of rebuilding expensive joins at route time.

## 11. SQL-Like Query Conventions

Drizzle is valuable partly because it stays close to SQL.

Mentor IB should lean into that rather than trying to hide SQL-shaped logic completely.

## 11.1 Preferred default

Use the core SQL-like builder for most phase 1 work:

- `select`
- `insert`
- `update`
- `delete`
- explicit joins
- explicit predicates

## 11.2 Predicate composition rule

Build filters from explicit query inputs, compose them deliberately, and keep the final query readable.

Do not hide major filter logic inside overly abstract helper stacks.

## 11.3 Typed SQL fragment rule

When the query builder becomes awkward or less readable, use Drizzle's `sql` template instead of dropping into unsafe string concatenation.

Good uses:

- computed ranking fields
- Postgres full-text expressions
- custom `order by` fragments
- CTE-heavy or derived fragments where SQL is clearer

## 11.4 Unsafe raw string rule

Do not interpolate user input into raw SQL strings manually.

If custom SQL is needed, use Drizzle's parameterized `sql` template so values remain escaped and bound safely.

## 12. Mutation Conventions

## 12.1 Main rule

Mutations should be use-case shaped and domain-owned.

Examples:

- create learning need
- publish tutor profile
- confirm lesson booking
- send message

## 12.2 No generic write-helper sprawl

Avoid generic mutation helpers that make it hard to see what business operation is actually happening.

## 12.3 Return-shape rule

Return the smallest post-mutation shape needed by the caller.

Do not automatically return giant joined records after every write.

## 13. Transaction Conventions

## 13.1 Main rule

Use Drizzle transactions for multi-step business operations that must succeed or fail together.

Examples:

- booking confirmation plus lesson state update plus notification enqueue
- message insert plus unread-state update
- tutor approval plus public-listability activation changes

## 13.2 Service-owned transaction rule

Transaction boundaries should usually be owned by the domain service layer, not by leaf UI code.

That keeps business consistency rules in one place.

## 13.3 Nested-work rule

If nested transactions or savepoint-like behavior becomes necessary, use it intentionally for recovery or partial rollback behavior, not as a casual abstraction trick.

## 14. Complex SQL And Performance-Critical Query Rule

Mentor IB should not force every hot-path query through the most ORM-shaped API.

For:

- matching score queries
- search ranking fragments
- projection refresh queries
- heavy aggregation and trust snapshots

it is acceptable, and often preferable, to use SQL-first query composition through Drizzle's typed SQL facilities or carefully isolated execution helpers.

The important rule is:

- keep it parameterized
- keep it typed where practical
- keep ownership explicit
- keep the query close to the module that owns the use case

## 15. Views, Projections, And Read Models

## 15.1 Main rule

Views and projection tables that the app reads should have typed declarations where that improves safety and readability.

## 15.2 No write-through illusion

Do not treat projections or views as if they were normal write targets unless that behavior is explicitly designed and reviewed.

## 15.3 Public-read boundary

Public read routes should usually consume:

- public-safe projection tables
- explicit public-safe views
- DTO-safe repository outputs

not direct canonical operational joins.

## 16. Relation Helper Posture

If Drizzle relation helpers are used later, treat them as convenience helpers, not as the place where business ownership is defined.

The true ownership still lives in:

- the canonical SQL schema
- foreign keys and constraints
- repository and service boundaries

Phase 1 should not depend on beta-only or fast-moving ORM features when simpler explicit queries are sufficient.

## 17. Error And Nullability Conventions

## 17.1 Main rule

Repository functions should make absence and failure behavior explicit.

Good patterns:

- `get...` returns nullable or optional when absence is normal
- `require...` or service-level guard throws or returns a domain error when absence is not acceptable

## 17.2 No hidden coercion rule

Do not casually coerce nullable DB data into assumed-present app data inside shared low-level helpers.

Make the nullability decision at the right layer.

## 18. Testing Boundary For Query Code

Repository and query code should be written in a way that makes:

- unit testing of mapping logic
- integration testing of real query behavior
- local reproducibility with seeded synthetic data

straightforward.

This document does not define the full testing contract, but Drizzle usage should make that future testing work easier, not harder.

## 19. AI-Agent Implementation Rules

Future AI agents should:

- keep SQL migrations as the canonical database-change path
- colocate schema and repository logic with the owning module
- use one shared server DB client
- keep table and column naming explicit
- prefer DTO-safe returns for route and UI consumers
- use transactions for real multi-step business operations
- use Drizzle's parameterized `sql` helper when raw SQL is the clearest option
- keep projection reads aligned with the approved read-model strategy

Agents should not:

- use `drizzle-kit push` as the default schema rollout path
- hide business queries in page files
- create giant global repositories with no domain ownership
- leak Drizzle row types directly into all UI layers by reflex
- force every complex SQL query through an awkward abstraction just to look "ORM-pure"
- build a second schema truth that drifts from SQL migrations

## 20. Decisions To Lock Now

The system should lock the following decisions now:

- Drizzle is the typed server-side access layer
- SQL migrations remain the canonical database-change path
- module-owned `schema.ts` plus `repository.ts` is the preferred ownership pattern
- one shared server DB client module should exist
- explicit `snake_case` database identifiers stay visible in Drizzle declarations
- projection reads may use typed Drizzle declarations, but projection DDL stays SQL-owned
- complex performance-critical SQL is allowed when it is clearer and safer

## 21. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 22. Final Recommendation

Mentor IB should use Drizzle as a disciplined typed query layer, not as a magical abstraction that tries to own the whole data system.

The clean phase 1 model is:

- SQL migrations own database change
- Drizzle mirrors the approved schema for typed access
- modules own repositories
- services own business transactions
- routes consume DTO-safe results
- complex SQL remains available when it is the right tool

That gives the project strong type safety and good developer ergonomics without sacrificing the clarity, migration safety, and retrieval quality already established in the rest of the data architecture.

## 23. Official Source Notes

The guidance above is aligned with current official documentation for:

- Drizzle ORM overview: `https://orm.drizzle.team/docs/overview`
- Drizzle schema declaration: `https://orm.drizzle.team/docs/sql-schema-declaration`
- Drizzle database schemas: `https://orm.drizzle.team/docs/schemas`
- Drizzle transactions: `https://orm.drizzle.team/docs/transactions`
- Drizzle `sql` template: `https://orm.drizzle.team/docs/sql`
- Drizzle Kit `push`: `https://orm.drizzle.team/docs/drizzle-kit-push`
