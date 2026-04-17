# Mentor IB Agent Implementation Decision Index v1

**Date:** 2026-04-10
**Status:** Agent-facing implementation index for the approved UX, architecture, data, SEO, and planning docs
**Scope:** how future AI agents should find the right source-of-truth docs before implementation, which docs govern each decision area, what not to infer, and how to avoid duplicated or conflicting implementation paths

## 1. Why This Document Exists

Mentor IB now has a broad standalone documentation pack covering:

- UI/UX research and product positioning
- shared UX object model and IA
- wireframes and hi-fi design direction
- design system foundations and component specs
- application architecture
- SEO and AI discoverability
- auth, data, RLS, schema, projections, DTOs, API boundaries, and data operations
- security, privacy, performance, accessibility, testing, observability, matching, messages, meetings, media, admin, and notifications

That is the right level of depth for a project that will be implemented by AI agents.

The remaining risk is not lack of docs.

The remaining risk is that an agent:

- reads only one nearby doc
- implements from memory
- treats an index as source of truth
- creates duplicate architecture paths
- misses the design-system constraints
- misses the data and privacy constraints
- changes code without understanding which decision doc owns the behavior

This document exists to prevent that.

## 2. How To Use This Index

Use this file as the first stop for implementation work.

The workflow is:

1. classify the task by decision area
2. read the required source docs for that area
3. identify the source-of-truth owner
4. implement the smallest coherent slice
5. update the source docs only when a decision changes
6. cite the relevant docs in task summaries and reviews

This document should not be used as a replacement for the source docs.

It is a routing layer.

## 3. Source-Of-Truth Rule

If this index conflicts with a dedicated source doc, the dedicated source doc wins.

Use this priority order:

1. direct source doc for the decision area
2. cross-cutting architecture or data doc named by that source doc
3. `docs/README.md` for navigation
4. this decision index for routing

Examples:

- DTO rules come from `docs/data/data-dto-and-query-boundary-map-v1.md`
- Server Action and Route Handler rules come from `docs/data/api-and-server-action-contracts-v1.md`
- route ownership comes from `docs/architecture/route-layout-implementation-map-v1.md`
- design-system rules come from `docs/design-system/design-system-spec-final-v1.md`
- implementation sequencing comes from `docs/planning/implementation-readiness-pack-v1.md`

## 4. Agent Pre-Flight Checklist

Before editing code, an agent should answer:

- What product area is this task in?
- Is it UI-only, data-affecting, route-affecting, security-sensitive, SEO-affecting, or privacy-affecting?
- Which source docs own the decision?
- Does the task require a database change, migration, RLS review, DTO review, or API boundary review?
- Does the task affect public routes, metadata, sitemap, structured data, or cache invalidation?
- Does the task affect student/tutor shared UX objects?
- Does the task introduce a new component or reuse an existing one?
- Does the task require tests, and at which layer?
- Is any new configuration, copy, color, status, reference data, or hardcoded value being introduced?
- Is this a new decision that should update docs, or an implementation of an existing decision?

If the answer is unclear, read the docs listed in the relevant section below before implementing.

## 5. Universal Docs To Read First

> **Note:** When `CLAUDE.md` exists at the repo root, it is loaded automatically and already contains the condensed stack, rules, and read protocol. Agents do NOT need to read this full universal list on every task — follow `CLAUDE.md`'s Step 2 read order instead. Use this section only for deep reference or when `CLAUDE.md` does not exist.

For any nontrivial implementation task, read:

- `docs/README.md`
- `docs/planning/implementation-readiness-pack-v1.md`
- `docs/planning/agent-execution-playbook-v1.md`
- `docs/planning/engineering-guardrails-v1.md`
- `docs/planning/implementation-baseline-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

For data-affecting tasks, also read:

- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`

For public route tasks, also read:

- `docs/planning/seo-implementation-foundation-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`

## 6. Task-To-Doc Decision Matrix

| Task area | Required docs |
| --- | --- |
| Task execution workflow | `docs/planning/agent-execution-playbook-v1.md`, `docs/planning/agent-implementation-decision-index-v1.md`, `docs/planning/implementation-task-template-v1.md` |
| Engineering guardrails or repo policy | `docs/planning/engineering-guardrails-v1.md`, `docs/planning/implementation-baseline-v1.md`, `docs/planning/service-dependency-baseline-v1.md` |
| Product direction or scope | `docs/research/ui-ux-research-fresh-start.md`, `docs/research/ui-ux-research-two-sided-ecosystem.md`, `docs/planning/implementation-readiness-pack-v1.md`, `docs/foundations/cross-role-journey-inventory-v1.md` |
| Shared object or IA decision | `docs/foundations/ux-object-model.md`, `docs/foundations/ia-map-two-sided.md`, `docs/foundations/service-blueprint-two-sided.md`, `docs/foundations/cross-role-journey-inventory-v1.md` |
| Page, route, or layout implementation | `docs/architecture/route-layout-implementation-map-v1.md`, `docs/architecture/architecture-discussion-v1.md`, `docs/planning/implementation-readiness-pack-v1.md` |
| Visual UI or component implementation | `docs/design-system/design-system-spec-final-v1.md`, `docs/design-system/component-specs-core-v1.md`, `docs/design-system/component-specs-phase2-v1.md` |
| Responsive or mobile UI | `docs/visual-design/hi-fi-key-screen-comps-wave2-v1.html`, `docs/visual-design/hi-fi-key-screen-review-guide-wave2-v1.md`, `docs/design-system/design-system-spec-final-v1.md` |
| Home or public marketing route | `docs/visual-design/hi-fi-key-screen-comps-v1.html`, `docs/architecture/seo-app-architecture-v1.md`, `docs/planning/public-route-seo-acceptance-checklist-v1.md` |
| Match flow or results | `docs/architecture/matching-and-ranking-architecture-v1.md`, `docs/architecture/search-and-query-architecture-v1.md`, `docs/data/data-dto-and-query-boundary-map-v1.md` |
| Tutor profile | `docs/architecture/seo-app-architecture-v1.md`, `docs/data/data-dto-and-query-boundary-map-v1.md`, `docs/data/database-schema-outline-v1.md` |
| Booking or lessons | `docs/architecture/meeting-and-calendar-architecture-v1.md`, `docs/data/api-and-server-action-contracts-v1.md`, `docs/data/integration-idempotency-model-v1.md` |
| Messages | `docs/architecture/message-architecture-v1.md`, `docs/data/api-and-server-action-contracts-v1.md`, `docs/data/data-dto-and-query-boundary-map-v1.md` |
| Tutor dashboard or operations | `docs/planning/implementation-readiness-pack-v1.md`, `docs/architecture/admin-and-moderation-architecture-v1.md`, `docs/data/data-dto-and-query-boundary-map-v1.md` |
| Auth or role setup | `docs/data/auth-and-authorization-matrix-v1.md`, `docs/architecture/security-architecture-v1.md`, `docs/data/api-and-server-action-contracts-v1.md` |
| Server Action or Route Handler | `docs/data/api-and-server-action-contracts-v1.md`, `docs/architecture/route-layout-implementation-map-v1.md`, `docs/architecture/security-architecture-v1.md` |
| Database schema or migration | `docs/data/database-schema-outline-v1.md`, `docs/data/migration-conventions-v1.md`, `docs/data/database-change-review-checklist-v1.md` |
| RLS or authorization policy | `docs/data/database-rls-boundaries-v1.md`, `docs/data/auth-and-authorization-matrix-v1.md`, `docs/architecture/security-architecture-v1.md` |
| Drizzle query or repository | `docs/data/drizzle-schema-and-query-conventions-v1.md`, `docs/data/data-dto-and-query-boundary-map-v1.md`, `docs/data/database-index-and-query-review-v1.md` |
| Toolchain, dependency, or scaffold baseline | `docs/planning/implementation-baseline-v1.md`, `docs/planning/service-dependency-baseline-v1.md`, root `package.json`, lockfile, `tsconfig.json`, `next.config.*` |
| Projection or search read model | `docs/data/projection-maintenance-strategy-v1.md`, `docs/data/projection-sql-patterns-v1.md`, `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md` |
| Reference data, enum, or status | `docs/data/reference-data-governance-v1.md`, `docs/data/database-enum-and-status-glossary-v1.md`, `docs/architecture/configuration-and-governance-architecture-v1.md` |
| Seed, fixture, or test data | `docs/data/seed-and-fixture-data-strategy-v1.md`, `docs/data/database-test-conventions-v1.md`, `docs/data/supabase-folder-and-file-conventions-v1.md` |
| File, certificate, video, or media | `docs/architecture/file-and-media-architecture-v1.md`, `docs/data/data-dto-and-query-boundary-map-v1.md`, `docs/data/database-observability-and-maintenance-v1.md` |
| Meeting link or calendar export | `docs/architecture/meeting-and-calendar-architecture-v1.md`, `docs/data/api-and-server-action-contracts-v1.md`, `docs/data/data-dto-and-query-boundary-map-v1.md` |
| Notifications or background jobs | `docs/architecture/background-jobs-and-notifications-architecture-v1.md`, `docs/data/integration-idempotency-model-v1.md`, `docs/data/database-observability-and-maintenance-v1.md` |
| SEO or AI discoverability | `docs/architecture/seo-and-ai-discoverability-v1.md`, `docs/architecture/seo-app-architecture-v1.md`, `docs/planning/seo-implementation-foundation-v1.md` |
| Search platform or query performance | `docs/architecture/search-platform-decision-v1.md`, `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`, `docs/data/database-index-and-query-review-v1.md` |
| Analytics or telemetry | `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`, `docs/architecture/observability-and-incident-architecture-v1.md`, `docs/data/database-observability-and-maintenance-v1.md` |
| Privacy, retention, erasure, or DSR | `docs/architecture/privacy-and-data-retention-architecture-v1.md`, `docs/data/data-retention-erasure-field-map-v1.md`, `docs/data/data-subject-request-workflow-v1.md`, `docs/data/privacy-policy-data-inventory-handoff-v1.md` |
| Compliance or regulatory posture | `docs/architecture/compliance-and-regulatory-posture-v1.md`, `docs/architecture/privacy-and-data-retention-architecture-v1.md`, `docs/data/data-subject-request-workflow-v1.md` |
| Security-sensitive feature | `docs/architecture/security-architecture-v1.md`, `docs/data/auth-and-authorization-matrix-v1.md`, `docs/data/database-rls-boundaries-v1.md` |
| Accessibility | `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`, `docs/design-system/design-system-spec-final-v1.md` |
| Testing or release | `docs/architecture/testing-and-release-architecture-v1.md`, `docs/data/database-test-conventions-v1.md`, `docs/data/database-change-review-checklist-v1.md` |
| Observability or incidents | `docs/architecture/observability-and-incident-architecture-v1.md`, `docs/data/database-observability-and-maintenance-v1.md`, `docs/architecture/search-console-and-observability-architecture-v1.md` |

## 7. Source Ownership By Decision Type

Use this section when a task touches multiple areas.

## 7.1 UX and product decisions

Owned by:

- `docs/research/ui-ux-research-fresh-start.md`
- `docs/research/ui-ux-research-two-sided-ecosystem.md`
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/foundations/cross-role-journey-inventory-v1.md`
- `docs/foundations/ux-object-model.md`
- `docs/foundations/ia-map-two-sided.md`

Rule:

- do not create separate student and tutor UX worlds unless an approved product decision changes.

## 7.2 Visual and component decisions

Owned by:

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/component-specs-phase2-v1.md`
- `docs/visual-design/hi-fi-key-screen-comps-v1.html`
- `docs/visual-design/hi-fi-key-screen-comps-wave2-v1.html`

Rule:

- reuse approved tokens, primitives, and shared components before creating new local variants.

## 7.3 Route and application-shape decisions

Owned by:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`

Rule:

- do not create a generic internal REST or GraphQL BFF for routine in-app page data.

## 7.4 Data and database decisions

Owned by:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md`

Rule:

- every new persistent fact needs an owner, access rule, DTO surface, and migration posture.

## 7.5 Auth, RLS, and security decisions

Owned by:

- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/architecture/security-architecture-v1.md`

Rule:

- route/layout checks and UI hiding are not authorization.

## 7.6 Search, match, and performance decisions

Owned by:

- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/search-platform-decision-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/data/database-index-and-query-review-v1.md`

Rule:

- matching stays internal; public search can use public-safe projections and only moves to an external provider when thresholds justify it.

## 7.7 Privacy and compliance decisions

Owned by:

- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`

Rule:

- privacy behavior is workflow-driven and hold-aware; do not infer deletion behavior from table names.

## 7.8 Service and dependency decisions

Owned by:

- `docs/planning/implementation-baseline-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`

Rule:

- do not add a new provider, SDK family, or overlapping service stack unless the baseline or architecture docs explicitly change.

## 7.9 Execution workflow decisions

Owned by:

- `docs/planning/agent-execution-playbook-v1.md`
- `docs/planning/implementation-task-template-v1.md`
- `docs/planning/implementation-backlog-index-v1.md`

Rule:

- implement from a concrete task id and detailed task section, not from a backlog row or general project summary.

## 7.10 Engineering guardrail decisions

Owned by:

- `docs/planning/engineering-guardrails-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`
- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`

Rule:

- do not bypass hardcoded-value, env, dependency, repo-hygiene, or verification rules just because a task feels small.

## 7.11 SEO and AI discoverability decisions

Owned by:

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/content-template-spec-v1.md`
- `docs/planning/seo-implementation-foundation-v1.md`
- `docs/planning/seo-route-ownership-map-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`

Rule:

- public metadata, structured data, sitemap eligibility, and AI discoverability must be route-owned and public-DTO-safe.

## 7.12 Testing and release decisions

Owned by:

- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/data/database-test-conventions-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

Rule:

- new implementation tasks should name their test layer or explicitly explain why no test is needed.

## 8. Implementation Boundary Rules

Use these as guardrails when converting docs into code tasks.

## 8.1 UI boundary

Agents should:

- use the design system before inventing local UI
- preserve the shared student/tutor ecosystem
- follow responsive behavior from the approved hi-fi and design-system docs
- keep copy and state language aligned with the product object model

Agents should not:

- create one-off cards for every page
- hardcode colors, spacing, status colors, or major copy values without checking the design/config docs
- turn tutor operations into a visually separate product

## 8.2 Server boundary

Agents should:

- use Server Components and domain services for page reads
- use Server Actions for in-app UI mutations
- use Route Handlers for provider callbacks, auth callbacks, exports, calendar files, and explicit machine-readable endpoints
- keep domain services as the business-rule owner
- keep repositories as database-query owners

Agents should not:

- create `/api/*` routes for every internal page query
- put complex business logic in page files
- return raw database rows to Client Components
- bypass DTO shaping because a route is server-rendered

## 8.3 Data boundary

Agents should:

- run the database-change checklist for data-affecting tasks
- use SQL-first migration discipline
- review RLS and DTO exposure together
- review idempotency for retryable operations
- review indexes and projections for hot paths

Agents should not:

- add reference data only in app constants when it belongs in reference tables
- use JSON blobs to avoid modeling filterable or permission-sensitive fields
- add broad projections or public views without exposure review

## 8.4 Privacy and security boundary

Agents should:

- validate input at server boundaries
- resolve actor context server-side
- keep audit records for security-relevant actions
- avoid logging private content
- make export/download routes access-controlled and short-lived

Agents should not:

- trust hidden form fields
- treat auth user id as enough for object access
- delete records without checking holds, retention, public exposure, and provider follow-up
- expose meeting links, message bodies, payment details, or tutor credential evidence in public/client DTOs

## 9. Common Task Playbooks

## 9.1 Add or change a public route

Read:

- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

Check:

- route class
- metadata ownership
- structured data requirement
- public DTO safety
- sitemap eligibility
- responsive design pattern

## 9.2 Add or change an authenticated workflow

Read:

- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/security-architecture-v1.md`

Check:

- route family
- actor resolution
- Server Action versus Route Handler boundary
- role and object-level authorization
- minimal DTO result
- cache invalidation

## 9.3 Add or change a database table

Read:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

Check:

- source-of-truth owner
- RLS exposure
- indexes
- retention behavior
- DTO surfaces
- migration and test plan

## 9.4 Add or change a message feature

Read:

- `docs/architecture/message-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/architecture/security-architecture-v1.md`

Check:

- participant access
- block/report interaction
- realtime permission
- notification side effect
- logging safety
- duplicate-message semantics

## 9.5 Add or change a booking, lesson, or calendar feature

Read:

- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

Check:

- participant access
- meeting link privacy
- `.ics` Route Handler boundary
- booking transition idempotency
- notification and reminder side effects
- schedule cache invalidation

## 9.6 Add or change tutor public profile data

Read:

- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`

Check:

- public versus private tutor fields
- credential evidence visibility
- video preview link behavior
- structured data truthfulness
- public projection refresh
- cache and sitemap updates

## 9.7 Add or change search or matching behavior

Read:

- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/search-platform-decision-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/data/database-index-and-query-review-v1.md`

Check:

- public search versus internal matching boundary
- typo tolerance expectation
- projection and cache strategy
- rank feature ownership
- query SLO
- external search threshold

## 9.8 Add or change privacy request handling

Read:

- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`

Check:

- identity verification
- request type
- role scope
- holds
- export DTO safety
- public exposure removal
- storage and provider follow-up

## 10. When To Update Docs

Update docs when implementation changes a source-of-truth decision.

Examples:

- new route family
- new public route class
- new data owner
- new status family
- new RLS pattern
- new Server Action or Route Handler family
- new projection or search threshold
- new privacy workflow step
- new design-system component category
- new provider integration

Do not update docs for:

- local refactors that preserve the approved architecture
- copy edits that do not change route meaning
- component implementation details already covered by the design system
- test fixture names that do not alter the fixture strategy

## 11. What Not To Do

Future agents should not:

- treat this index as the only doc to read
- implement from non-canonical external materials as the source of truth
- duplicate student and tutor systems
- create separate UI component families by role
- create an internal API layer by default
- use Supabase Edge Functions by reflex
- bypass DTOs because code is server-side
- assume RLS alone makes public surfaces safe
- introduce hardcoded colors, statuses, reference data, or legal copy without checking the source docs
- skip tests for data-affecting, auth-affecting, public-route, or privacy-affecting changes

## 12. Recommended Next Planning Artifacts

The implementation task template now exists:

- `docs/planning/implementation-task-template-v1.md`

Use it together with:

- `docs/planning/implementation-backlog-index-v1.md`
- `docs/planning/phase1-mvp-task-pack-v1.md`
- `docs/planning/phase1-5-task-pack-v1.md`
- `docs/planning/phase2-task-pack-v1.md`

The active next step is Phase 1 implementation from the Phase 1 pack.

The canonical phase task-pack set now exists.

## 13. Final Recommendation

> **Note:** When `CLAUDE.md` exists at the repo root, it is the agent entrypoint — not this index. This index remains the authoritative decision-routing reference that `CLAUDE.md` points agents to when they need to find which docs own a specific decision area.

Mentor IB has enough architecture and product material to begin implementation.

The operational model is:

- `CLAUDE.md` is the agent entrypoint (loaded automatically every session)
- this index is the decision-routing layer (read when a task touches an unfamiliar area)
- the dedicated source docs remain the source of truth for each decision area
- the phase task packs define what to build and in what order
- update docs only when a real decision changes
