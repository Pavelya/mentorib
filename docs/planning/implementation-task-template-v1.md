# Mentor IB Implementation Task Template v1

**Date:** 2026-04-10
**Status:** Reusable implementation-task template for future AI agents and human reviewers
**Scope:** standard task shape, required source-doc links, scope boundaries, design/data/security/privacy/SEO checks, acceptance criteria, testing expectations, review notes, and anti-drift rules for turning the approved docs pack into build work

## 1. Why This Document Exists

Mentor IB now has enough design, architecture, data, SEO, privacy, and agent-index material to begin turning the docs into implementation work.

The next risk is not missing architecture.

The next risk is inconsistent task writing:

- tasks that say "build the page" without source docs
- agents reading the wrong docs for a feature
- UI tasks ignoring the design system
- data tasks skipping DTO, RLS, migration, or privacy review
- route tasks creating ad hoc API endpoints
- SEO tasks duplicating public-route acceptance rules
- privacy-sensitive tasks missing provider or retention review
- tests being added inconsistently or not at all

This template exists to prevent that.

## 2. How To Use This Template

Use this template when creating implementation tasks for:

- AI coding agents
- human implementation tickets
- review checklists
- phase 1 MVP work packages
- follow-up fixes that touch architecture-relevant boundaries

Do not use it as a source of truth for product behavior.

It is a task-writing format.

Source decisions still live in the dedicated docs named by the task.

## 3. Source-Of-Truth Rule

Every implementation task must name the source docs it depends on.

For routing to source docs, use:

- `docs/planning/agent-implementation-decision-index-v1.md`

For product build sequencing, use:

- `docs/planning/implementation-readiness-pack-v1.md`

For repo-wide navigation, use:

- `docs/README.md`

If the task conflicts with a dedicated source doc, the dedicated source doc wins and the task should be corrected before implementation.

## 4. Task Sizing Rule

Tasks should be small enough that an implementation agent can finish them with high accuracy.

Prefer tasks that have:

- one clear goal
- one primary route or component family
- one primary data boundary
- one test strategy
- one acceptance checklist
- a small set of files or folders likely to be touched

Avoid tasks that combine unrelated concerns such as:

- build design system, auth, database, and SEO in one task
- build all tutor pages at once
- implement messages plus notifications plus moderation plus Realtime in one task
- add public search plus matching ranking plus Algolia migration in one task
- create schema, UI, tests, privacy workflow, and policy copy in one task

Large work should be split into staged tasks.

## 5. Task Header Template

Use this header for every implementation task.

```md
# Task: <short action-oriented title>

**Task id:** <phase-area-sequence, for example `P1-UX-HOME-001`>
**Status:** Draft | Ready | In progress | Blocked | Done
**Phase:** Phase 1 MVP | Phase 1.5 | Phase 2 | Infrastructure | Follow-up
**Owner:** AI agent | Human | Pair
**Last updated:** YYYY-MM-DD

## Goal

<One paragraph describing the outcome.>

## Non-Goals

- <What this task must not do.>
- <What is explicitly deferred.>

## Required Source Docs

- `<path>`
- `<path>`

## Implementation Scope

- <Route/component/module/file family expected to change.>
- <Data/API/test/docs areas expected to change, if any.>

## Acceptance Criteria

- <Concrete user-visible or system-visible result.>
- <Concrete reviewable behavior.>

## Verification

- <Commands/tests/checks/manual review steps expected.>
```

## 6. Full Implementation Task Template

Copy this full template when creating real tasks.

```md
# Task: <short action-oriented title>

**Task id:** <phase-area-sequence>
**Status:** Draft
**Phase:** <Phase 1 MVP | Phase 1.5 | Phase 2 | Infrastructure | Follow-up>
**Owner:** <AI agent | Human | Pair>
**Last updated:** <YYYY-MM-DD>

## 1. Goal

<Describe the exact outcome in product terms.>

## 2. User Value

<Explain why this matters for students, tutors, admins, or platform operations.>

## 3. Required Source Docs

Read these before implementation:

- `docs/planning/agent-execution-playbook-v1.md`
- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/planning/engineering-guardrails-v1.md`
- `docs/planning/implementation-baseline-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- `<area-specific source doc>`
- `<area-specific source doc>`

## 4. Source-Of-Truth Decisions

This task must follow these decisions:

- <Decision and source doc path.>
- <Decision and source doc path.>

## 5. Scope

In scope:

- <Specific route/component/data/test work.>

Out of scope:

- <Explicitly deferred work.>

## 6. Likely Work Areas

Expected files or folders:

- `<path or folder>`
- `<path or folder>`

Do not touch unless necessary:

- `<path or folder>`
- `<path or folder>`

## 7. UX And Design Requirements

- <Design-system components/tokens/patterns to use.>
- <Responsive behavior expected.>
- <Accessibility expectations.>
- <Empty/loading/error states expected.>

## 8. Route And Rendering Requirements

- <Route family and URL behavior.>
- <Server Component, Client Component, Server Action, or Route Handler boundary.>
- <Metadata/SEO/noindex behavior if relevant.>
- <Cache or revalidation behavior if relevant.>

## 9. Data And API Requirements

- <DTO class or data shape.>
- <Domain service or repository boundary.>
- <Server Action or Route Handler contract.>
- <Database/migration/projection/index needs.>
- <RLS/auth/object-level access checks.>

## 10. Privacy, Security, And Compliance Requirements

- <Privacy class or data category affected.>
- <Sensitive fields that must not be logged or exposed.>
- <Provider/recipient changes, if any.>
- <Retention or DSR effects, if any.>
- <Rate limiting, abuse, audit, or moderation expectations.>

## 11. Analytics, Observability, And SEO Requirements

- <Telemetry event or explicit no-event decision.>
- <Log/audit signal or explicit no-log decision.>
- <SEO/AI discoverability impact or explicit not-applicable decision.>

## 12. Tests And Verification

Automated checks:

- <Test command or expected test file.>

Manual checks:

- <Manual browser/review step.>

Not required:

- <Test or check not required, with reason.>

## 13. Acceptance Criteria

- <Concrete done condition.>
- <Concrete done condition.>
- <Concrete done condition.>

## 14. Review Checklist

- [ ] Source docs were read.
- [ ] UI follows the design system.
- [ ] Student/tutor UX remains one ecosystem.
- [ ] Data returned to UI is DTO-safe.
- [ ] Auth and object-level authorization are handled where relevant.
- [ ] Privacy-sensitive data is not exposed or logged.
- [ ] SEO/public route behavior is correct where relevant.
- [ ] Tests or explicit no-test rationale are included.
- [ ] No unrelated files or user changes were reverted.

## 15. Open Questions

- <Question, owner, and whether it blocks implementation.>

## 16. Implementation Notes

- <Useful notes for the implementing agent.>

## 17. Completion Summary

To be filled by the implementing agent:

- What changed:
- Verification run:
- Docs consulted:
- Follow-ups:
```

## 7. Quick Intake Checklist

Before marking a task as ready, answer:

- Is the task small enough for one agent pass?
- Does it name the required source docs?
- Does it state what is out of scope?
- Does it identify likely files or folders?
- Does it identify whether the task is UI-only, data-affecting, route-affecting, privacy-affecting, SEO-affecting, or security-sensitive?
- Does it name the test expectation?
- Does it include acceptance criteria that can be reviewed?
- Does it avoid asking an agent to make product or legal decisions without a source doc?

If any answer is no, the task is still a draft.

## 8. Task Type Shortcuts

Use these shortcuts when filling the required docs section.

## 8.1 UI component task

Required docs:

- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/component-specs-phase2-v1.md` if the component is phase 2 or operational
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`

Must answer:

- which existing screen or shared component is the live interaction reference
- which canonical config or loader owns any shared options, labels, icons, or flags
- which existing component or pattern is reused
- which tokens are used
- which responsive states are required
- whether the component is shared or feature-local
- whether copy was intentionally kept sparse

## 8.2 Public route task

Required docs:

- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`

Must answer:

- route class
- metadata owner
- sitemap eligibility
- public DTO source
- structured data requirement
- noindex/canonical behavior

## 8.3 Authenticated workflow task

Required docs:

- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/architecture/security-architecture-v1.md`

Must answer:

- actor context
- route family
- Server Action versus Route Handler boundary
- object-level authorization
- cache invalidation
- returned operation result shape

## 8.4 Database or migration task

Required docs:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/database-test-conventions-v1.md`

Must answer:

- source-of-truth owner
- migration strategy
- RLS exposure
- DTO exposure
- index or projection impact
- retention and erasure impact
- database test expectation

## 8.5 Server Action or Route Handler task

Required docs:

- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/data/integration-idempotency-model-v1.md` if retryable
- `docs/data/data-dto-and-query-boundary-map-v1.md`

Must answer:

- why this boundary is a Server Action or Route Handler
- validation behavior
- auth and authorization behavior
- DTO/operation result shape
- idempotency behavior
- cache revalidation or redirect behavior

## 8.6 Privacy-sensitive task

Required docs:

- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`

Must answer:

- data category
- privacy class
- public exposure
- provider recipient
- retention or erasure behavior
- DSR/export impact
- policy gap, if any

## 8.7 Messaging task

Required docs:

- `docs/architecture/message-architecture-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/architecture/security-architecture-v1.md`

Must answer:

- participant access
- conversation/thread DTO
- moderation, block, or report interaction
- notification side effect
- Realtime behavior
- logging safety

## 8.8 Search or matching task

Required docs:

- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/search-platform-decision-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/data/database-index-and-query-review-v1.md`

Must answer:

- public search versus internal matching boundary
- projection usage
- ranking feature ownership
- query SLO
- cache strategy
- external search threshold impact

## 8.9 File, media, or meeting task

Required docs:

- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md` if meetings or calendar files are involved
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`

Must answer:

- media asset class
- public versus private exposure
- storage path handling
- external provider behavior
- meeting link privacy
- export or `.ics` Route Handler behavior

## 9. Acceptance Criteria Rules

Acceptance criteria should be observable.

Good examples:

- "The `/tutors/[slug]` route renders only approved public profile fields from a public DTO."
- "The message send action rejects non-participants and does not log message bodies."
- "The booking action records a durable booking request and returns a minimal operation result."
- "The route includes metadata and noindex/canonical behavior required by the route class."
- "The component uses approved design tokens and has mobile behavior matching the final design-system spec."

Weak examples:

- "Make it nice."
- "Implement the page."
- "Add auth."
- "Improve SEO."
- "Use best practices."

If acceptance criteria cannot be reviewed, the task is not ready.

## 10. Test Expectation Rules

Every task should state one of:

- automated test required
- manual verification sufficient
- no test required with reason

Use these defaults:

- UI component tasks need component, visual, or manual responsive verification depending the available test stack.
- public route tasks need SEO/public-route checklist verification.
- Server Actions need validation/auth/result-shape tests when meaningful.
- Route Handlers need method/auth/signature/response tests when meaningful.
- database changes need database tests when they affect RLS, constraints, projections, functions, triggers, or migrations.
- privacy-sensitive changes need exposure/export/deletion verification where relevant.
- messaging changes need participant-access and denied-access coverage.

Do not let "no test required" be a silent default.

## 11. Review Checklist Rules

Task reviewers should check:

- source docs were listed and are relevant
- implementation stayed inside scope
- no unrelated user changes were reverted
- no generic internal API layer was introduced
- no separate student/tutor UI world was created
- no hardcoded design token, status, reference data, or legal copy was introduced without review
- no sensitive data was exposed in DTOs, logs, analytics, metadata, or public routes
- tests or verification match the task risk
- docs were updated only when a source-of-truth decision changed

## 12. Anti-Patterns

Avoid task statements like:

- "Build all auth."
- "Implement database."
- "Create the full tutor dashboard."
- "Add messaging."
- "Make SEO work."
- "Use the docs as needed."
- "Update anything necessary."

Prefer:

- "Implement role selection Server Action and setup route guard using the auth matrix and API boundary docs."
- "Create the public tutor profile read DTO and route skeleton, without booking actions."
- "Add baseline `app_users` and profile tables with RLS review and database tests."
- "Implement message send domain command and Server Action, without Realtime typing indicators."

The narrower form gives agents a much better chance of doing the right work.

## 13. When To Split A Task

Split the task if it touches more than one of these in a substantial way:

- design-system primitives
- route layout
- schema migration
- RLS policy
- domain service
- Server Action
- Route Handler
- public SEO metadata
- privacy/DSR behavior
- provider integration
- Realtime behavior
- background jobs

Some slices can still include multiple layers when the work is small and coherent.

Example:

- a small form can include component usage, a Server Action, validation, and one test

But split when the task starts to hide more than one independent decision.

## 14. Documentation Update Rule

Implementation tasks should not rewrite docs by default.

Update docs only when:

- implementation reveals an approved decision is incomplete
- a new source-of-truth decision is approved
- a provider or data category changes
- an architecture boundary changes
- a new reusable pattern is introduced
- a checklist or decision index is now wrong

If a task only implements an existing decision, cite the source docs in the completion summary instead of editing docs.

## 15. Completion Summary Template

Every implementation agent should finish with:

```md
## Completion Summary

Implemented:

- <high-signal summary>

Verification:

- `<command>` passed
- `<manual check>` completed
- Not run: <reason>

Source docs used:

- `<path>`
- `<path>`

Notes:

- <follow-up, risk, or none>
```

## 16. Final Recommendation

Mentor IB should use this task template before writing real build tickets.

The operating model is:

- decision index routes agents to source docs
- task template turns those docs into small implementation slices
- each task names source docs, scope, boundaries, acceptance criteria, and verification
- source docs change only when decisions change

This should let future AI agents work quickly without turning the approved architecture into guesswork.
