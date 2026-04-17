# Mentor IB Reference Data Governance v1

**Date:** 2026-04-08
**Status:** Standalone data-layer contract for shared vocabularies, taxonomies, provider lists, and reference-data lifecycle governance
**Scope:** canonical definition of reference data, ownership boundaries, table-versus-enum-versus-config rules, reference-table shape, lifecycle and rollout rules, seed and production posture, and AI-agent-safe conventions

## 1. Why This Document Exists

Mentor IB already approved:

- a canonical schema with explicit taxonomy tables
- centralized anti-hardcoding governance
- modular seeds and fixtures
- a canonical status glossary
- a typed application data layer

What was still missing was the actual governance contract for reference data.

Without an explicit reference-data contract, teams usually drift into:

- the same vocabulary living in tables, enums, and UI constants at once
- provider identifiers duplicated in app code and database rows
- search and matching filters depending on unstable labels
- production reference rows diverging from seed rows
- AI agents inventing local lists because the canonical source is unclear

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it defines how shared database-backed vocabularies and taxonomies are modeled and governed.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md`
- `docs/data/seed-and-fixture-data-strategy-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-test-conventions-v1.md`

It also inherits constraints from:

- `docs/architecture/configuration-and-governance-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/seo-and-ai-discoverability-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the schema outline
- the status glossary
- the seed and fixture strategy
- the migration contract
- route-level content ownership

It does not define:

- final UI labels for every surface
- the final localization system
- the final post-MVP internal tooling split beyond the MVP `admin` role

Those can come later.

## 4. Core Recommendation

Mentor IB should treat shared vocabularies and taxonomies as **reference data with one canonical owner**, normally database-backed and version-controlled.

The main rule is:

1. if a value family powers filters, matching, search, routing, or reusable UI choices, it should have one canonical reference source
2. stable reference data should usually live in reference tables, not scattered constants
3. statuses stay in the glossary unless they are truly provider or taxonomy vocabularies
4. deployment-specific switches stay in config, not in reference tables by default
5. product code should consume stable keys, not raw display labels

## 5. Canonical Definition Of Reference Data

Reference data is shared product vocabulary that changes slowly and is reused across multiple product surfaces.

Good examples for Mentor IB:

- `subjects`
- `subject_focus_areas`
- `languages`
- `countries`
- `meeting_providers`
- `video_media_providers`

Reference data is not:

- user-generated content
- lesson or booking state
- route copy
- secrets or environment configuration
- test fixtures

## 6. Ownership Boundaries

## 6.1 Product-owned rule

Reference data is product-owned.

It should not be owned by:

- one page
- one component
- one feature branch
- one agent-local helper file

## 6.2 Database ownership rule

If a value family is modeled as reference data, the canonical source should normally be the database reference table plus its approved seed or migration path.

## 6.3 App-consumption rule

Application code may mirror reference data through typed access, DTOs, or cache layers, but it should not become the primary truth.

## 6.4 UI boundary rule

Reusable UI controls should consume reference keys and labels from the canonical source or from a typed adapter.

They should not redefine option lists locally unless the list is purely presentational and not domain-significant.

## 7. Reference Data Versus Statuses, Config, And Copy

## 7.1 Versus status glossary

Use the status glossary for lifecycle and workflow meaning.

Use reference data for reusable taxonomy and vocabulary meaning.

Examples:

- `lesson_status` -> glossary
- `meeting_provider` -> reference data
- `subject_focus_area` -> reference data

## 7.2 Versus structured config

If a value family is deployment-specific, environment-specific, or a runtime switch, it usually belongs in configuration, not in reference data.

Examples:

- feature flags -> config
- provider kill switch -> config
- app base URL -> config

## 7.3 Versus route copy

Reference data may provide stable display labels, but route-specific narrative language still belongs to route-owned content.

Example:

- subject name in a filter -> reference data
- homepage headline mentioning that subject -> route content

## 8. When To Use A Reference Table

A value family should usually be modeled as a reference table when one or more of these are true:

- it is reused across multiple write tables
- it powers search or filtering
- it appears in public SEO-sensitive surfaces
- it should be validated by foreign keys
- it needs a stable key independent of a mutable label
- it may later need lifecycle fields such as active or deprecated state

This is the default posture for Mentor IB's main shared vocabularies.

## 9. When To Use An Enum Or Validated Text Instead

## 9.1 Database enum posture

Use a true database enum only when the value family is small, stable, and tightly bound to DB-level validation.

Reference taxonomies usually do not need this first.

## 9.2 Validated text posture

Use validated text when the family is controlled but not worth a dedicated table yet and does not need cross-table referential reuse.

## 9.3 MVP rule

For Mentor IB MVP, most shared reusable vocabularies should prefer reference tables over hard enums because:

- labels may evolve
- slugs may matter
- active and deprecated behavior may be needed
- filters and relationships benefit from a joinable source of truth

## 10. Canonical Reference Table Shape

Reference tables should stay simple, explicit, and stable.

Recommended default column families:

- stable machine key
- stable slug or code where relevant
- default display label
- optional short description where genuinely useful
- sort order when presentation order matters
- active or deprecated state when lifecycle matters

Do not reflexively add every operational column just because a table "might need it later."

## 10.1 Key rule

Each reference row should have one stable machine identity.

Good options:

- UUID primary key plus stable code
- stable code as the primary key when the family is tiny and clearly permanent

The important rule is:

- product code should rely on stable keys
- labels are allowed to evolve

## 10.2 Label rule

Each family should have one canonical default display label.

For MVP, English default labels are acceptable.

If localization arrives later, localizations should extend this layer rather than replace it with scattered UI constants.

## 10.3 Sort rule

If user-facing ordering matters, include an explicit `sort_order` instead of relying on lexical label order.

## 10.4 Lifecycle rule

If rows may be retired, include a clear lifecycle posture such as:

- `is_active`
- `deprecated_at`

Prefer deactivation over hard deletion when rows are already referenced by canonical data.

## 11. Canonical Mentor IB Reference Families

These families should be treated as true reference data from the start.

## 11.1 `subjects`

Purpose:

- canonical IB subject vocabulary used by matching, profile capabilities, lessons, and public discovery

## 11.2 `subject_focus_areas`

Purpose:

- canonical IB-specific academic support areas such as IA, EE, TOK, IO, exam prep, and similar structured needs

## 11.3 `languages`

Purpose:

- canonical language vocabulary reused across account preference, tutor language capability, and student preference flows

## 11.4 `meeting_providers`

Purpose:

- supported external meeting providers for lesson access

## 11.4 `countries`

Purpose:

- canonical country vocabulary reused by tutor payout-readiness, admin reference management, and any country-aware operational filtering

## 11.5 `meeting_providers`

Purpose:

- supported external meeting providers for lesson access

## 11.6 `video_media_providers`

Purpose:

- supported external media providers for public tutor intro videos

## 13. Internal Admin Editing Rule

MVP internal editing of reference data is `admin`-only.

The initial internal admin surface should manage at least:

- subjects
- subject focus areas
- languages
- countries
- meeting providers
- video media providers

## 12. Usage Conventions In Queries And UI

## 12.1 Query rule

Queries should filter and join on stable codes or keys, not on mutable labels.

## 12.2 Form rule

Forms should submit stable reference identifiers.

They should not post human-facing labels back as if those were canonical keys.

## 12.3 Public-route rule

Public search, subject pages, and SEO-sensitive surfaces should depend on stable slugs or codes derived from reference data, not on ad hoc page-local strings.

## 12.4 Matching rule

Matching logic should score against stable reference identities and structured capabilities, not free-text synonyms where a controlled vocabulary already exists.

## 13. Rollout And Change Rules

## 13.1 Main rule

Reference data changes must be explicit and reviewable.

## 13.2 Additive-first rule

Prefer additive updates:

- add a new row
- add a new alias field if truly needed
- mark old rows deprecated when compatibility matters

Avoid silent destructive changes to stable reference keys.

## 13.3 Stable-key rule

Do not casually rename stable codes or slugs once external or cross-table dependencies exist.

If the label needs to change, change the label.

If the key must change, treat it as a migration-sensitive event and review all dependencies.

## 13.4 Production-promotion rule

If production correctness depends on a reference family, its rollout must follow an explicit production-safe path.

That can be:

- a reference-data migration
- an approved bootstrap step
- another reviewed production-safe mechanism

The important rule is:

- one canonical source
- no hidden manual divergence

## 14. Relationship To Seeds And Migrations

## 14.1 Seed relationship

Reference seed files are the canonical non-production source for reference row families.

## 14.2 Migration relationship

Migrations own schema changes.

They do not automatically own all reference row mutations, but they may own required production bootstrap changes where that is the safest reviewed path.

## 14.3 No split-brain rule

Do not let:

- seed files
- production SQL
- app constants

all disagree about the same family.

## 15. Testing And Verification Rules

Reference data should be verified where it matters for correctness.

Good examples:

- required rows exist in reference seeds
- foreign keys reference the correct families
- public projections or search paths use the intended stable identifiers
- deprecated rows do not leak into active public surfaces if they should be hidden

This does not require giant test suites, but it does require explicit review for meaningful changes.

## 16. AI-Agent Implementation Rules

Future AI agents should:

- add shared vocabularies to canonical reference tables rather than route-local constants
- reuse stable keys and labels that already exist
- treat labels as mutable and keys as durable
- keep reference row changes explicit and reviewable
- use reference seeds or approved production-safe rollout paths

Agents should not:

- invent new provider identifiers locally in UI or service files
- treat reference labels as primary keys
- duplicate the same vocabulary in config and database without an explicit reason
- hard-delete referenced rows casually
- hide product-critical reference rows in one-off scripts

## 17. Decisions To Lock Now

The system should lock the following decisions now:

- shared vocabularies and taxonomies are first-class reference data
- reference data normally lives in canonical reference tables
- statuses stay in the glossary unless they truly belong to a different family
- stable keys matter more than mutable labels
- reference seeds are the canonical non-production source for reference rows
- production rollout of required reference rows must be explicit

## 18. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 19. Final Recommendation

Mentor IB should treat reference data as a shared product contract, not as a scattering of convenient option lists.

The clean phase 1 model is:

- one canonical reference source
- stable keys
- mutable labels
- explicit lifecycle
- explicit rollout
- no duplicate truths across SQL, app code, and UI

That gives the product better query correctness, cleaner matching and search behavior, safer UI reuse, and a much better retrieval layer for future AI agents.

## 20. Official Source Notes

The guidance above is aligned with current official documentation for:

- Supabase seeding your database: `https://supabase.com/docs/guides/local-development/seeding-your-database`
- PostgreSQL constraints: `https://www.postgresql.org/docs/current/ddl-constraints.html`
- PostgreSQL enum types: `https://www.postgresql.org/docs/current/sql-createtype.html`
