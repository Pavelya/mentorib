# Mentor IB SQL Function And Trigger Boundaries v1

**Date:** 2026-04-09
**Status:** Standalone data-layer boundary document for SQL functions, RPC-style database entry points, triggers, RLS helper functions, and projection maintenance helpers
**Scope:** when Mentor IB should use SQL functions and triggers, when to avoid them, security-definer posture, exposed function boundaries, trigger side-effect limits, projection refresh boundaries, migration and testing expectations, and AI-agent implementation rules

## 1. Why This Document Exists

Mentor IB is using Supabase Postgres as the primary data platform.

That gives the project useful database-native tools:

- SQL functions
- trigger functions
- row-level security helper functions
- projection refresh helpers
- narrow database-owned validation logic

Those tools are powerful, but they can also create a hidden second application layer if used casually.

Without a clear boundary, implementation can drift into:

- booking workflows hidden inside triggers
- notification sending triggered from writes
- broad `SECURITY DEFINER` functions that bypass normal access checks
- projection recomputation that is hard to observe or rebuild
- app-domain logic split between TypeScript services and SQL bodies
- functions exposed through the Data API without the same review discipline as tables

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because SQL functions and triggers are database-owned behavior.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/database-test-conventions-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`

It also inherits security constraints from:

- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- exact table design
- exact RLS policy SQL
- exact Drizzle repository design
- exact projection table shape
- exact migration ordering for every function
- exact job or notification worker implementation

It defines the boundary for when SQL functions and triggers are appropriate.

If there is a conflict:

- source table meaning comes from `docs/data/database-schema-outline-v1.md`
- access rules come from `docs/data/auth-and-authorization-matrix-v1.md`
- RLS coverage comes from `docs/data/database-rls-boundaries-v1.md`
- projection refresh rules come from `docs/data/projection-maintenance-strategy-v1.md`
- migration style comes from `docs/data/migration-conventions-v1.md`
- tests come from `docs/data/database-test-conventions-v1.md`

## 4. Core Recommendation

Mentor IB should treat SQL functions and triggers as **narrow database-boundary tools**, not as a hidden domain-service layer.

Use them when database locality improves:

- atomicity
- authorization clarity
- projection consistency
- idempotency
- auditability
- performance on narrow database-owned operations

Avoid them when the behavior is really:

- user journey orchestration
- provider integration orchestration
- email or notification delivery
- payment flow control
- booking lifecycle policy
- moderation decision workflow
- cross-domain business logic

The practical rule is:

**If a future agent would need to read hidden SQL side effects to understand a product workflow, the behavior probably belongs in the app/domain service, not a trigger.**

## 5. Boundary Model

Use four boundary types.

## 5.1 Type A: exposed callable function

A database function that can be called from an exposed client path or Supabase API path.

Examples:

- a narrow public-safe lookup helper
- a carefully reviewed authenticated action function

Default posture:

- avoid unless it creates a clearly safer or simpler boundary
- review like an exposed table
- document the caller roles
- document the input and output shape
- test authorization behavior

## 5.2 Type B: RLS helper function

A database function used by policies to reduce duplication or improve performance.

Examples:

- `private.is_conversation_participant(conversation_id)`
- `private.has_admin_capability()`
- `private.can_view_lesson(lesson_id)`

Default posture:

- allowed when it keeps policies readable
- should usually live outside exposed API schemas when possible
- must not become a universal bypass helper
- must be tested with positive and negative roles

## 5.3 Type C: internal maintenance function

A database function used by migrations, jobs, or server-owned repository methods.

Examples:

- targeted projection rebuild helper
- idempotency record helper
- narrow backfill helper
- internal audit append helper

Default posture:

- allowed when it is deterministic and observable
- prefer private/internal schemas when not intended for public API exposure
- avoid broad side effects

## 5.4 Type D: trigger function

A function executed automatically by a table event.

Examples:

- `updated_at` maintenance
- audit marker insertion
- projection dirty flagging
- narrow denormalized counter maintenance

Default posture:

- allowed for small database-owned invariants
- not allowed for broad product workflows
- not allowed for external side effects
- should be easy to explain in one sentence

## 6. Appropriate SQL Function Use Cases

SQL functions are appropriate when the operation is close to the database and easier to make correct there.

Good use cases:

- RLS helper predicates
- deterministic projection refresh helpers
- idempotent upsert helpers
- canonical status transition validation for narrow database-owned transitions
- small reference-data lookup helpers
- audit append helpers that do not call external systems
- data repair helpers used by reviewed migrations
- backfill helpers used by reviewed migrations

Good function qualities:

- single purpose
- narrow inputs
- narrow outputs
- deterministic where possible
- explicit schema references
- clear role and privilege assumptions
- testable without UI context
- not surprising to a future reader

## 7. Inappropriate SQL Function Use Cases

SQL functions are not the right place for broad app workflows.

Avoid SQL functions for:

- lesson booking orchestration
- cancellation policy orchestration
- payment and payout workflow orchestration
- sending email
- sending push notifications
- creating calendar events through external APIs
- calling Google, Stripe, Resend, or other providers
- moderation queue decision workflows
- matching product strategy that needs frequent non-DB tuning
- dynamic copy, UX content, or component behavior

These belong in app/domain services, job workers, or provider integration layers.

The database may still own durable records that those services use.

## 8. Exposed Function Boundary

Any function callable through an exposed API path must be treated like an exposed data surface.

Review:

- who can call it
- whether anonymous users can call it
- whether authenticated non-participants can call it
- whether admin-only access is sufficient or finer capability gating is required
- whether the function leaks existence of private records
- whether it returns public-safe data only
- whether it mutates data across multiple owners
- whether it relies on caller JWT claims
- whether it uses `SECURITY DEFINER`

Default rule:

- prefer server-owned domain services over public RPC sprawl

Allowed exception:

- a database function may be exposed if it is the simplest safe way to enforce an atomic database operation and the review checklist is satisfied.

## 9. Private Schema Posture

Functions that are not intended as client-callable API endpoints should not be casually placed in exposed schemas.

Recommended posture:

- use a private/internal schema for helper functions when appropriate
- qualify private helper calls explicitly
- do not expose private helper function results through generated APIs by accident
- keep public-schema functions rare and deliberate

This aligns with the broader RLS boundary rule:

- exposed schema -> reviewed and protected
- private schema -> server/database internal by default

## 10. `SECURITY DEFINER` Rule

`SECURITY DEFINER` should be rare.

It is appropriate only when the function intentionally needs the privileges of the function owner rather than the caller, and there is no simpler safer boundary.

Before using it, answer:

- What caller-level restriction is being bypassed?
- Why is bypassing it necessary?
- Who owns the function?
- Which roles can execute it?
- Can it be placed in a private schema?
- Does it have a fixed safe `search_path`?
- Does it avoid dynamic SQL from untrusted input?
- Does it leak data through timing, boolean existence checks, or error messages?
- Is the behavior covered by database tests?

Required posture:

- set a safe `search_path`
- schema-qualify sensitive objects where practical
- revoke broad execute access when needed
- grant execute only to intended roles
- keep input parameters narrow
- keep output minimal
- document why caller privileges are not sufficient

Do not use `SECURITY DEFINER` as a general escape hatch for broken RLS design.

## 11. Function Volatility And Stability Posture

When functions are implemented, volatility should be chosen deliberately.

Posture:

- read-only deterministic helpers should be marked only as stable/immutable when that is actually true
- data-reading authorization helpers should not be marked more stable than their data dependencies allow
- mutation functions must not pretend to be read-only
- projection refresh functions should be named and documented as mutating operations

Do not add volatility labels mechanically to satisfy linting or performance guesses.

## 12. Function Naming Rules

Function names should describe their boundary and target.

Good naming patterns:

- `private.is_conversation_participant(...)`
- `private.can_view_lesson(...)`
- `private.refresh_public_tutor_profile_projection(...)`
- `private.mark_tutor_projection_dirty(...)`
- `private.record_idempotency_attempt(...)`

Avoid:

- `do_action(...)`
- `process_booking(...)`
- `handle_user(...)`
- `sync_everything(...)`
- `admin_magic(...)`

The name should make it obvious whether the function is:

- a predicate
- a mutation
- a refresh helper
- a trigger helper
- a migration/backfill helper

## 13. Trigger Use Cases

Triggers are appropriate only when the behavior is narrow, local, and database-owned.

Allowed trigger use cases:

- maintain `updated_at`
- insert audit marker rows for sensitive table changes
- mark projection rows dirty
- append a durable outbox/job marker
- maintain a simple denormalized counter when it avoids obvious inconsistency
- enforce a small invariant that cannot be reliably enforced with a constraint

Allowed trigger qualities:

- small body
- predictable side effect
- no external network call
- no cross-product workflow
- no surprise writes to unrelated domains
- no heavy recomputation on hot write paths

## 14. Trigger Anti-Patterns

Avoid triggers that:

- send emails
- send push notifications
- call provider APIs
- create Google Calendar events
- orchestrate booking lifecycle changes
- recompute large projections synchronously on every source write
- execute matching/ranking runs
- mutate unrelated domain table families
- hide permission changes
- make local tests pass only because hidden side effects ran

If a trigger would require a large comment to explain why it is safe, it probably needs to be moved into an explicit domain service or job.

## 15. Projection Trigger Boundary

Projection triggers should normally mark work, not perform heavy work.

Preferred pattern:

1. source table changes
2. trigger marks affected entity/family as dirty or appends a durable projection refresh request
3. explicit projection refresh path rebuilds the target projection
4. projection output remains rebuildable from canonical source tables

Avoid:

- large projection recomputation inside row-level triggers
- hidden multi-table projection writes across many unrelated domains
- trigger-only projection maintenance with no rebuild path
- unobservable projection failures

This keeps projections fast, reviewable, and rebuildable.

## 16. Idempotency Function Boundary

SQL helpers may be useful for idempotency when the operation needs atomic database behavior.

Allowed:

- create or claim an idempotency key record
- record a provider event processing attempt
- mark a job attempt as started, succeeded, failed, or retryable
- guard against duplicate durable records

Not allowed:

- hiding provider-specific business workflows inside generic idempotency helpers
- sending provider requests from the database
- using one generic function to own every external integration's semantics

The idempotency helper should protect durability, not own the product meaning.

## 17. RLS Helper Boundary

RLS helper functions are allowed when they make policies clearer or faster.

Good RLS helper posture:

- keep helper outputs boolean or narrow
- use explicit schema placement
- avoid returning sensitive record details
- keep helpers specific to one policy concept
- test participant, owner, non-participant, admin, and anonymous cases where relevant

Bad RLS helper posture:

- one universal `can_access(anything)` helper
- a helper that reveals whether private records exist
- a helper that accepts arbitrary table names
- dynamic SQL based on user input
- a helper that bypasses RLS without a written reason

## 18. Audit And Outbox Boundary

Triggers may append durable records when the database must not miss a change.

Allowed examples:

- append an audit row when an admin-visible table changes
- append a projection refresh request
- append an internal outbox/job marker for later server-side processing

Important boundary:

- the trigger may record that work is needed
- a server/job worker should perform external side effects

For example:

- trigger may create `notification_jobs`
- trigger should not send through Resend directly

## 19. Scheduling And Lesson Boundary

Scheduling and lessons are product workflows.

Do not place broad scheduling behavior in triggers.

Allowed in SQL:

- narrow constraints
- simple conflict checks if used as part of an explicit service call
- durable state transition validation if tightly scoped
- audit markers
- projection dirty markers

Not allowed in SQL:

- full booking acceptance workflow
- cancellation policy interpretation
- calendar provider calls
- tutor availability strategy
- student/tutor messaging side effects
- tutor reliability penalty calculations

The lesson domain service should own the workflow.

## 20. Messaging Boundary

Messaging can use SQL helpers for narrow durability and access checks.

Allowed in SQL:

- participant predicate helpers
- unread counter maintenance if simple and tested
- conversation projection dirty markers
- message audit/report linkage if narrow

Not allowed in SQL:

- sending push notifications directly
- broad moderation decisions
- block/report workflow orchestration
- message ranking or inbox product strategy
- attachment provider handling

The conversation domain service and job/notification architecture should own the higher-level workflow.

## 21. Search And Matching Boundary

Search and matching may read from projection tables and use database helpers, but they should not be hidden inside triggers.

Allowed in SQL:

- maintaining scalar projection fields
- targeted projection rebuild helpers
- deterministic match candidate projection refresh helpers
- indexed search-friendly read models

Not allowed in SQL triggers:

- full match ranking recalculation on every tutor profile edit
- public search index provider sync
- broad recommendation strategy logic
- A/B-tested scoring behavior that product teams need to tune quickly

The matching service owns the scoring strategy. The database owns durable inputs and queryable projections.

## 22. Migration Requirements

Function and trigger changes must go through SQL migrations.

Migration posture:

- one intent per migration where practical
- no hidden function edits outside migrations
- explicit drop/recreate strategy if a signature changes
- expansion before contraction for callable functions
- privilege grants/revokes in the same migration when relevant
- comments or companion docs for non-obvious privileged functions
- rollback or forward-repair thinking for trigger changes

If a function is exposed or privileged, the migration must trigger RLS/security review.

## 23. Testing Requirements

Any meaningful SQL function or trigger change should have an explicit test decision.

Test when the function/trigger affects:

- access control
- public data exposure
- lesson or booking state
- messaging participant behavior
- projection correctness
- idempotency
- auditability
- job scheduling
- admin/moderation behavior

Preferred tests:

- database tests for RLS helper behavior
- projection refresh tests for deterministic SQL helpers
- trigger side-effect tests for audit/dirty marker behavior
- negative authorization tests for exposed functions
- migration smoke tests for function signature and grants

Do not rely only on UI tests to validate database-owned behavior.

## 24. Observability Requirements

Database functions and triggers should not be invisible magic.

For important side effects, use durable records that can be inspected:

- audit rows
- outbox rows
- job rows
- projection dirty rows
- processing attempt rows

Avoid:

- silent failure swallowing
- hidden notification attempts
- hidden provider calls
- side effects that cannot be replayed or reconciled

If a trigger creates operational work, the resulting row should explain:

- what entity changed
- what work is needed
- when it was created
- whether it has been processed
- what retry/error state exists, if applicable

## 25. Performance Requirements

Functions and triggers can affect hot write and read paths.

Before adding one, check:

- does it run once per row or once per statement?
- does it run on a hot table?
- does it query unindexed columns?
- does it scan participant, lesson, message, or tutor tables repeatedly?
- does it write rows that can create contention?
- does it add latency to user-facing mutations?
- can the operation be deferred to a job?

Avoid adding trigger work to hot paths unless the work is:

- small
- indexed
- local
- necessary for correctness

## 26. Data Ownership Rules

Functions and triggers must respect the data ownership map.

Rules:

- a function should have one obvious domain owner
- a trigger should be attached to a table owned by the same domain as the side effect, unless it only appends an event/outbox marker
- cross-domain writes need explicit review
- public projection refresh helpers must not write private facts into public projection rows
- route-specific needs must not create route-specific trigger behavior

If ownership is unclear, resolve it in `docs/data/data-ownership-boundary-map-v1.md` before implementing the function.

## 27. Review Checklist

Before creating or changing a SQL function or trigger, answer:

- Is this behavior database-owned, or is it really app/domain-service behavior?
- Is the function exposed, private, or only used by migrations/jobs?
- Does it require `SECURITY DEFINER`?
- If exposed, who can call it?
- If privileged, why are caller privileges insufficient?
- Does it need a safe `search_path`?
- Are grants/revokes explicit?
- Does it rely on dynamic SQL?
- Does it touch hot tables?
- Does it change public data exposure?
- Does it change projection maintenance behavior?
- Does it create durable operational records for important side effects?
- Are tests required?
- Is there a rebuild or recovery path if the behavior fails?

If the answer is unclear, stop and update the relevant architecture/data doc before implementation.

## 28. AI-Agent Implementation Rules

Agents should:

- keep SQL functions single-purpose and narrow
- prefer private/internal schema placement for non-public helpers
- avoid public RPC functions unless explicitly justified
- treat exposed functions like exposed tables for review
- use `SECURITY DEFINER` only with written justification
- set safe `search_path` for privileged functions
- keep trigger bodies small and local
- use triggers to mark work, not to execute broad workflows
- use durable outbox/job rows for external side effects
- add or update database tests when behavior affects security or correctness
- update this doc or the change checklist if a new function/trigger pattern is introduced

Agents should not:

- hide booking workflows in triggers
- hide notification sending in triggers
- call external providers from database functions
- create generic privileged helper functions
- create route-specific trigger behavior
- place public-safe and private facts in the same projection helper
- bypass RLS because a policy was inconvenient to write
- implement matching strategy in trigger bodies
- mutate unrelated domain tables without an ownership review

## 29. Decisions To Lock Now

The system should lock the following decisions now:

- SQL functions and triggers are narrow database-boundary tools, not a second application layer
- exposed functions require the same security review posture as exposed tables
- `SECURITY DEFINER` is rare and requires written justification
- heavy projection recomputation should not live in triggers by default
- triggers may mark work or append durable operational records, but should not perform external side effects
- app/domain services own booking, messaging, matching, provider, and notification workflows
- function and trigger changes require migration, RLS/security, performance, and test review decisions

## 30. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 31. Final Recommendation

Mentor IB should use SQL functions and triggers sparingly and deliberately.

The clean operating model is:

- constraints and small database invariants stay close to the database
- helper functions support RLS, projection refresh, idempotency, and reviewed internal maintenance
- triggers mark local changes or durable work, not broad product workflows
- app/domain services own user-facing orchestration
- privileged functions are rare, reviewed, tested, and tightly scoped

That gives future implementation agents the power of Postgres without turning the database into a hidden maze.

## 32. Official Source Notes

The guidance above is aligned with current official documentation for:

- PostgreSQL `CREATE FUNCTION`: `https://www.postgresql.org/docs/current/sql-createfunction.html`
- PostgreSQL `CREATE TRIGGER`: `https://www.postgresql.org/docs/current/sql-createtrigger.html`
- PostgreSQL trigger functions: `https://www.postgresql.org/docs/current/plpgsql-trigger.html`
- PostgreSQL function volatility categories: `https://www.postgresql.org/docs/current/xfunc-volatility.html`
- Supabase Row Level Security: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- Supabase Hardening the Data API: `https://supabase.com/docs/guides/api/hardening-data-api`
- Supabase Postgres triggers: `https://supabase.com/docs/guides/database/postgres/triggers`
