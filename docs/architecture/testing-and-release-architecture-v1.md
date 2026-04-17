# Mentor IB Testing And Release Architecture v1

**Date:** 2026-04-08
**Status:** Standalone architecture for testing strategy, environments, CI, preview verification, production release flow, migrations, and rollback posture
**Scope:** test layers, environment model, branch and PR flow, preview deployments, release gates, migration discipline, rollback model, and AI-agent-safe delivery rules

## 1. Why This Document Exists

This document defines how Mentor IB should be tested and released safely.

It exists now because the approved architecture already implies:

- Vercel-hosted preview and production deployments
- Supabase-backed auth, database, storage, and realtime
- public SEO-sensitive routes
- security-sensitive auth and payments flows
- AI agents doing a meaningful part of implementation

Without an explicit testing and release architecture, teams usually drift into:

- good docs but inconsistent execution
- merges that rely on manual memory instead of release gates
- preview deployments that are useful visually but not verified operationally
- code rollbacks that do not match database reality
- AI-generated changes being treated differently from human changes in ad hoc ways

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`

It defines the operational build-and-ship layer that those docs depend on.

## 3. Core Recommendation

Mentor IB should use a **preview-first, gate-driven, rollback-aware release model** with a deliberately small testing stack.

The practical rule is:

- every meaningful code change gets automated checks
- every meaningful UI change gets a preview deployment
- production changes ship only after required gates pass
- database changes are tested before production and designed for safe forward progress
- AI agents follow the same release controls as humans

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means testing and release rules should be:

- explicit
- automatable
- branch-aware
- environment-aware
- difficult to bypass accidentally

The architecture should not rely on:

- "the agent probably tested it"
- manual deployment memory
- production as the first realistic integration environment
- schema changes that assume perfect deploy order with no rollback scenario

## 5. Goals

The testing and release architecture should:

- catch regressions before production
- keep preview environments useful and trustworthy
- protect public discoverability and trust surfaces
- protect auth, payments, and scheduling flows
- keep the toolchain small enough for a small team
- give AI agents a clear operational contract

## 6. Testing Stack Recommendation

## 6.1 Main rule

Use one compact default stack:

- static checks for fast failure
- `Vitest` for unit and light integration tests
- `Playwright` for end-to-end verification
- `GitHub Actions` for CI orchestration
- `Vercel` preview deployments for release-like verification

## 6.2 Why this stack

This stack fits the approved product because:

- Next.js officially supports `Vitest`, `Jest`, `Playwright`, and `Cypress`
- `Vitest` is fast and works well for pure logic and many component tests
- `Playwright` is strong for production-like user journeys
- `GitHub Actions` fits repository-driven CI well
- `Vercel` previews fit the chosen hosting model

## 6.3 Tool-sprawl rule

Do not adopt multiple overlapping test stacks by default.

Recommended default:

- `Vitest` instead of both `Vitest` and `Jest`
- `Playwright` instead of both `Playwright` and `Cypress`

Additional tools should be added only when they solve a clearly different problem.

## 7. Environment Model

## 7.1 Required environments

The architecture should assume at least:

- local
- preview
- production

## 7.2 Local environment

Local exists for:

- implementation
- migration testing
- deterministic test runs
- debugging before PR

Recommended posture:

- local app environment
- local Supabase stack where database/schema work is involved
- seeded synthetic data only

## 7.3 Preview environment

Preview exists for:

- PR validation
- realistic UI review
- protected shared QA verification
- E2E smoke testing

Recommended posture:

- Vercel preview deployment for each meaningful branch or PR
- preview-specific environment values
- noindex and discoverability protections already covered by the SEO docs
- no production secrets reused

## 7.4 Production environment

Production exists for:

- real user traffic
- final observability truth
- release verification after promotion

## 7.5 Environment separation rule

Development, preview, and production must remain operationally separate.

That includes:

- secrets
- auth configuration
- payment credentials
- webhooks
- analytics destinations where relevant

## 7.6 Data rule

Preview and local environments should not be populated with copied production personal data by default.

Use:

- synthetic data
- seed data
- controlled fixtures

## 8. Database Environment Posture

## 8.1 Main rule

Schema work should be tested before it reaches production.

## 8.2 Local-first schema rule

The safest default posture is:

- develop schema changes locally with migration files in version control
- test them locally before PR

## 8.3 Preview database posture

For day one, the product does not need to require a fully isolated per-PR database branch.

The minimum acceptable posture is:

- one shared preview backend environment
- careful preview-only secrets
- migration discipline that avoids breaking concurrent preview verification

## 8.4 Optional stronger posture later

If schema concurrency or preview isolation becomes painful, Supabase Branches can be adopted later for stronger environment isolation.

They are useful, but they are not a required MVP dependency.

## 9. Test Layers

## 9.1 Static verification layer

These should run very early because they are cheap:

- type checking
- linting
- build validation
- config and environment schema validation where possible

## 9.2 Unit test layer

Use unit tests for:

- pure utility logic
- ranking math
- trust math
- normalization functions
- DTO shaping helpers
- config parsing and validation

These are high-value because they are deterministic and fast.

## 9.3 Component and light integration layer

Use `Vitest` plus React Testing Library for:

- synchronous client components
- synchronous shared components
- simple interaction contracts
- route-independent rendering behavior

Do not force this layer to become the primary tool for `async` Server Component behavior.

## 9.4 Domain integration layer

Use focused integration tests for:

- query adapters
- authorization-sensitive service functions
- match assembly logic
- booking rules
- webhook handlers

These should run against testable service boundaries rather than full browser flows whenever possible.

## 9.5 End-to-end layer

Use `Playwright` for:

- sign-in and role resolution
- match flow
- results and tutor profile evaluation
- booking
- messages core path
- tutor overview / lessons / schedule core path

This is the authoritative layer for async server-driven user journeys.

## 9.6 Snapshot posture

Avoid heavy reliance on snapshot testing for core UI behavior.

Use it sparingly, if at all.

Brittle snapshots create noise for AI-agent implementation and do not protect the product well.

## 10. What Must Be Tested By Default

## 10.1 Always

Every meaningful code change should pass:

- typecheck
- lint
- build

## 10.2 Domain-sensitive changes

Changes to matching, trust, scheduling, payments, auth, security, or migrations should also require targeted tests in the relevant domain layer.

## 10.3 User-journey-sensitive changes

Changes to core user journeys should trigger or require Playwright coverage for the affected flow.

## 10.4 Public Class A route changes

Changes to public search-facing routes should also respect the existing:

- SEO acceptance rules
- accessibility posture
- performance posture

This can be enforced through release gates even if not every rule is a separate test file.

## 11. Playwright Strategy

## 11.1 Main rule

Use Playwright against a production-like application build whenever practical.

## 11.2 CI stability rule

In CI, prefer stability over maximal parallelism.

Start with conservative worker settings and expand only when evidence supports it.

## 11.3 Scope rule

Keep the Playwright suite focused on:

- core flows
- smoke coverage
- high-risk regressions

Do not try to encode every visual nuance into E2E tests.

## 11.4 Preview verification rule

Preview deployments should support smoke verification of critical paths before production release.

For protected previews, use tooling that can still verify endpoints and pages safely.

## 12. CI Architecture

## 12.1 Main rule

CI should be fast enough for iteration and strict enough to be trusted.

## 12.2 Default CI stages

Recommended stage order:

1. install
2. typecheck and lint
3. unit and integration tests
4. production build
5. preview deployment
6. preview smoke and E2E verification

## 12.3 Required-check rule

Protected branches should require a stable set of checks.

At minimum:

- build
- test
- preview verification for high-risk changes

## 12.4 Naming rule

Required checks should use stable names.

Do not rename them casually, because branch protections and merge controls depend on that stability.

## 13. Preview Deployment Architecture

## 13.1 Main rule

Every meaningful PR should produce a preview deployment suitable for review.

## 13.2 Preview purpose

Previews exist for:

- visual verification
- route smoke checks
- auth and flow sanity checks
- stakeholder review

## 13.3 Protected-preview rule

Preview deployments should be protected when the content or functionality should not be public.

This is especially important for:

- unfinished product work
- non-public features
- preview APIs
- routes with realistic but non-production data

## 13.4 Promotion posture

For higher-risk releases, a verified preview deployment can be promoted rather than rebuilding a different artifact implicitly.

This is a valid release path and should remain available.

## 14. Release Flow

## 14.1 Default release path

Recommended default path:

1. branch changes
2. PR opened
3. CI runs
4. preview deployment created
5. preview reviewed and smoke-tested
6. PR merged
7. production deployment created
8. post-deploy verification runs

## 14.2 High-risk release path

For higher-risk changes such as:

- auth
- payments
- migrations
- matching logic
- public route behavior

prefer:

- verified preview first
- explicit production promotion or tightly controlled release timing

## 14.3 Continuous-delivery posture

Production can still be continuous-delivery oriented, but not uncontrolled.

The release gates must remain meaningful.

## 15. Migration Architecture

## 15.1 Main rule

Database migrations are part of the release architecture, not a side detail.

## 15.2 Version-control rule

Migrations must live in version control and be reviewed like code.

## 15.3 Forward-safe rule

Prefer forward-safe migration design:

- additive before destructive
- expand before contract
- data backfill separated when needed

## 15.4 Rollback-aware schema rule

Code rollback is easier than schema rollback.

Do not ship schema changes that make an immediate code rollback unsafe unless the release plan explicitly accounts for that.

## 15.5 Two-step destructive-change rule

For risky schema removals:

1. deploy code that no longer depends on the old shape
2. remove the old shape in a later release

## 15.6 Seed and fixture rule

Preview and local test data should come from governed seeds and fixtures, not ad hoc manual setup.

## 16. Post-Deploy Verification

## 16.1 Main rule

Production deployment is not the end of release verification.

## 16.2 Required verification

After production release, verify at least:

- core homepage availability
- auth entry health
- match/results route health
- booking critical path health
- messages critical path health
- logs for obvious new error spikes

## 16.3 Search-facing release rule

Public Class A route changes should also respect the already approved discoverability verification rules.

## 17. Rollback And Incident Posture

## 17.1 Main rule

Rollback should be fast for code and cautious for data.

## 17.2 Code rollback posture

Vercel rollback and promotion capabilities should be part of the normal incident toolkit.

The release architecture should assume code rollback can happen quickly.

## 17.3 Schema rollback reality

Database rollback is more dangerous than code rollback.

The safer default is:

- design forward-safe migrations
- restore service with code rollback when possible
- handle schema repair deliberately

## 17.4 Feature-flag posture

When a risk can be isolated behind a feature flag or kill switch, prefer that over emergency redeploys for narrowly scoped issues.

## 18. AI-Agent Release Rules

## 18.1 Main rule

AI-generated changes must pass the same gates as human-written changes.

## 18.2 No special bypass rule

Do not create a separate lower-trust release lane for agent-authored code.

## 18.3 Task-contract rule

Future implementation tasks should specify:

- required checks
- affected environments
- whether preview verification is mandatory
- whether migration review is required

This makes agent execution safer and more predictable.

## 19. Recommended Phase 1 Defaults

Phase 1 should include:

- `Vitest` for unit and light integration tests
- `Playwright` for E2E and smoke tests
- `GitHub Actions` for CI
- `Vercel` previews for PR verification
- local migration testing before merge
- protected main branch with required checks
- post-production smoke verification

## 20. Decisions To Lock Now

The architecture should lock the following decisions now:

- one compact default test stack is preferred over tool sprawl
- `Vitest` is the default fast test runner
- `Playwright` is the default E2E runner
- previews are required for meaningful PR verification
- production deploys require automated gates
- migrations are versioned and rollback-aware
- code rollback and schema change are treated differently
- AI agents follow the same release controls as humans

## 21. Final Recommendation

Mentor IB should use a preview-first release system with a small, explicit testing stack and rollback-aware migration discipline.

The recommended posture is:

- static checks early
- targeted unit and integration tests
- Playwright for real user journeys
- preview verification before production
- controlled production releases
- fast code rollback with cautious data change discipline

This gives the project a delivery model that is fast enough for an AI-assisted small team, but structured enough to keep the product trustworthy as complexity grows.

## 22. Official Source Notes

The recommendation above is informed by current official documentation for:

- Next.js testing overview: `https://nextjs.org/docs/app/guides/testing`
- Next.js Playwright guide: `https://nextjs.org/docs/app/guides/testing/playwright`
- Next.js Vitest guide: `https://nextjs.org/docs/app/guides/testing/vitest`
- Playwright CI: `https://playwright.dev/docs/ci`
- GitHub Actions CI: `https://docs.github.com/en/actions/get-started/continuous-integration`
- Vercel Deployment Protection: `https://vercel.com/docs/deployment-protection`
- Vercel promote preview to production: `https://vercel.com/docs/deployments/promote-preview-to-production`
- Vercel rollback production deployment: `https://vercel.com/docs/deployments/rollback-production-deployment`
- Supabase local development with schema migrations: `https://supabase.com/docs/guides/local-development/overview`
- Supabase Branching: `https://supabase.com/docs/guides/deployment/branching`
