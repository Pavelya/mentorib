# Mentor IB Configuration And Governance Architecture v1

**Date:** 2026-04-08
**Status:** Standalone architecture for configuration boundaries, anti-hardcoding rules, component reuse governance, feature-flag posture, and AI-agent-safe implementation ownership
**Scope:** source-of-truth hierarchy, config classes, ownership boundaries, reusable component governance, environment and secret handling posture, centralized behavior configuration, and change-control rules

## 1. Why This Document Exists

This document defines how Mentor IB should centralize values, behavior switches, shared patterns, and ownership rules so implementation does not drift into scattered constants and duplicated UI.

It exists now because the approved product already depends on:

- a shared design system
- shared student and tutor components
- centralized matching logic
- centralized trust and rating logic
- route-level SEO ownership
- multiple vendors and provider allowlists
- AI agents doing a significant part of the implementation work

Without an explicit governance posture, projects usually drift into:

- colors, spacing, and copy literals scattered across route files
- "almost the same" cards and panels recreated on different screens
- business rules duplicated in UI, services, and queries
- direct `process.env` usage everywhere
- feature flags and provider switches implemented ad hoc
- future AI agents inventing local conventions instead of following one system

## 2. What This Document Does Not Redefine

This document does not replace the approved design, SEO, matching, trust, security, analytics, or implementation-planning docs.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`

It does not define:

- the exact final repository file tree
- the exact final component API of every primitive
- the final admin UI for changing governed settings
- the final experimentation program

Those can be refined later as implementation companions.

## 3. Core Recommendation

Mentor IB should use a **centralized, versioned, schema-validated configuration model** with clear ownership boundaries:

- design tokens own visual values
- route content modules own route-specific copy
- domain services own business rules
- structured config owns provider lists, flags, and tunable behavior
- environment modules own deployment-specific values and secrets

The practical rule is:

- one source of truth per concern
- semantically meaningful values should not be duplicated across modules
- reusable components should be extended through variants or wrappers, not copied and forked
- environment access should be parsed once and consumed through typed modules
- dynamic configuration should remain narrow and intentional

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means the configuration and governance system should be:

- explicit
- centralized
- typed
- reviewable
- machine-checkable where possible

The architecture should not rely on:

- implementation agents guessing where a value belongs
- repeated local literals that "look close enough"
- direct environment-variable access inside random modules
- UI files owning business rules because it feels convenient
- uncontrolled runtime configurability for critical product behavior

## 5. Goals

The configuration and governance architecture should:

- prevent hardcoded drift
- protect the approved design system
- keep student and tutor mode inside one reusable ecosystem
- make business rules tunable without scattering them
- keep secrets and deployment values isolated
- make future AI-agent implementation safer and more predictable
- create a clean bridge from architecture docs into implementation tasks

## 6. Source-Of-Truth Hierarchy

Every meaningful value should belong to one primary layer.

Recommended hierarchy:

1. design-system tokens
2. canonical domain models and enums
3. centralized behavior configuration
4. route-owned content and metadata inputs
5. environment and secret configuration
6. narrow dynamic runtime configuration where genuinely needed

The main rule is:

- if two layers appear to own the same value, the ownership boundary is wrong and should be clarified before implementation continues

## 7. Configuration Classes

## 7.1 Design token configuration

Visual values such as:

- color
- typography
- spacing
- radius
- shadow
- motion
- breakpoints

should be owned by the design-system token layer.

They should not be redefined in route or feature modules.

## 7.2 Canonical domain constants and states

Business-state families such as:

- lesson status
- booking state
- tutor approval state
- moderation state
- trust labels
- provider identifiers

should be defined once in domain-owned modules.

These are not design tokens and not page-local constants.

## 7.3 Product behavior configuration

Tunable product behavior such as:

- ranking profiles
- provider allowlists
- meeting-platform support
- upload limits
- notification thresholds
- public-route quality gates

should live in structured, versioned config rather than in scattered service files.

## 7.4 Route-owned content configuration

Page-specific narrative content, metadata inputs, and policy-surface content should be owned at the route or route-family level.

This is where one-off page copy belongs.

It should not live inside reusable UI primitives.

## 7.5 Environment and deployment configuration

Deployment-specific values such as:

- app base URL
- Supabase project credentials
- Stripe keys
- email provider credentials
- analytics keys
- webhook secrets

belong in environment configuration, not in code constants.

## 7.6 Dynamic runtime configuration

Some values may need limited runtime switching, such as:

- feature flags
- kill switches
- active experiment arms
- emergency provider disablement

This should remain narrow.

The MVP should not become a no-code control panel for core product behavior.

## 7.7 Database-data rule

The database is the source of truth for domain data.

It should not become the default dumping ground for general product configuration.

Use database-backed config only when:

- runtime mutability is genuinely required
- the owner is clear
- auditability matters
- schema and validation are explicit

Otherwise, keep config in versioned application code.

## 8. Ownership Boundaries

## 8.1 Component layer ownership

Reusable components own:

- presentation structure
- interaction behavior
- variant behavior
- layout logic that is intrinsic to the component

Reusable components do not own:

- SEO metadata
- ranking logic
- trust math
- policy decisions
- deployment-specific provider behavior

## 8.2 Route layer ownership

Route layers own:

- metadata inputs
- JSON-LD invocation inputs
- route-specific copy
- page composition
- route acceptance criteria

Route layers should not silently redefine:

- token values
- shared component semantics
- domain-state logic

## 8.3 Domain service ownership

Domain services own:

- matching and ranking rules
- rating and trust derivation
- booking rules
- moderation logic
- notification triggers

These should not be reimplemented inside route handlers, components, or client state.

## 8.4 Environment module ownership

Environment modules own:

- reading deployment variables
- parsing and validation
- server-only versus browser-safe separation
- fail-fast behavior when critical values are missing

No feature module should become its own environment parser.

## 9. Anti-Hardcoding Rules

## 9.1 Main rule

Hardcoding is not "any literal string or number."

The actual problem is duplicated or semantically important values being placed in the wrong layer.

## 9.2 Values that must not be scattered

The following should not be duplicated ad hoc across the app:

- color hex values
- spacing and radius values
- provider names and URL allowlists
- status labels that map to domain state
- ranking weights and thresholds
- trust-score math
- analytics event names
- feature-flag keys
- route-class policies
- upload-size and file-type limits

## 9.3 Acceptable local literals

The following are usually acceptable when they are truly local:

- one-off narrative copy owned by a route module
- tiny helper labels that are unique to one component
- internal implementation constants with no wider semantic meaning
- test fixtures

The rule is:

- if a value affects cross-screen consistency, business behavior, or vendor integration, it does not belong as a random local literal

## 9.4 Browser-visible environment rule

Because `NEXT_PUBLIC_` values are bundled into browser-delivered JavaScript at build time, browser-visible environment values should stay minimal and intentional.

Do not treat `NEXT_PUBLIC_` as a generic runtime-config channel.

## 9.5 No direct environment sprawl

Avoid widespread `process.env.*` reads across application code.

Environment access should be centralized and exported through typed modules.

## 10. Design-System Governance

## 10.1 Token authority rule

All visual implementation should derive from the approved token system in the design-system spec.

If a needed visual value is missing, add or refine a token deliberately rather than inventing a route-local override.

## 10.2 No ad hoc card rule

Do not create a new card, panel, or shell from zero on each page just because the screen context is different.

The shared object model already defines reusable anchors such as:

- `NeedSummaryBar`
- `MatchRow`
- `PersonSummary`
- `LessonCard`
- `ScheduleSurface`

New surfaces should try to compose from approved primitives and shared composites first.

## 10.3 Variation rule

Differences between student and tutor views should usually be expressed through:

- density
- visible fields
- helper text
- available actions

They should not default to separate visual systems or forked base components.

## 11. Component Reuse Governance

## 11.1 Wrapper-over-fork rule

When a screen needs specialized behavior, prefer:

- a wrapper
- a slot-based composition
- a variant
- a route-owned container

before creating a cloned component.

## 11.2 Shared-object rule

If two screens represent the same underlying object:

- lesson
- person
- match
- conversation
- trust proof

they should start from the same base component contract.

## 11.3 Duplication threshold rule

If a pattern appears on multiple routes or in both student and tutor flows, it should be evaluated for promotion into the shared component library.

## 11.4 Exception rule

A new dedicated component is justified when:

- the object model is genuinely different
- the interaction grammar is different
- reuse would produce a confusing abstraction

The burden of proof should favor reuse first.

## 12. Content And Copy Governance

## 12.1 Route-content rule

Page-specific content should be owned close to the route, not hidden inside shared visual components.

This includes:

- hero copy
- explanatory body copy
- route-specific FAQs
- policy text entry points

## 12.2 No token-swapped SEO rule

Public pages should not be generated by shallow token replacement over one generic template.

This already aligns with the approved SEO posture.

## 12.3 Policy-content rule

Legal and policy surfaces should have a clearly governed source and should not be partially reconstructed from random UI fragments.

## 13. Feature Flags And Runtime Switches

## 13.1 Main rule

Feature flags should exist, but they should be centralized and limited.

## 13.2 Registry rule

All feature flags should be declared in one canonical registry with:

- flag key
- owner
- purpose
- default behavior
- allowed evaluation surface

## 13.3 Evaluation rule

Evaluate flags on the server by default when possible.

Client-side flag evaluation should be the exception, not the default.

## 13.4 Runtime-store posture

If the product later needs a low-latency read-mostly dynamic flag store, a tool like Vercel Edge Config can be used for narrow runtime config such as:

- kill switches
- redirects
- emergency provider disablement
- selected experiment inputs

It should not become the canonical home for core business rules like rating math or booking policy.

## 14. Environment And Secret Governance

## 14.1 Parse-once rule

Environment variables should be parsed, validated, and exported once through dedicated modules.

## 14.2 Server-only default

Values should remain server-only unless there is a specific reason they must be exposed to the browser.

## 14.3 Preview and production separation

Preview and production should have separate environment values where trust or external side effects differ.

This is especially important for:

- auth
- payments
- email
- analytics
- webhooks

## 14.4 Secret-handling rule

Secrets should never be:

- committed into source
- copied into client bundles
- duplicated across ad hoc config files
- embedded into local test utilities that may leak into production code

## 15. Validation And Fail-Fast Posture

## 15.1 Main rule

Configuration should fail fast when it is invalid.

## 15.2 Validation targets

At minimum, validation should cover:

- required environment variables
- provider identifiers
- supported URL host allowlists
- ranking profile structure
- file-upload policy config
- feature-flag registry shape

## 15.3 Build or boot failure rule

If critical configuration is invalid, the application should fail at build or startup rather than degrade silently.

## 16. Change Control And Versioning

## 16.1 Versioned-config rule

Semantically meaningful configuration should be versioned in the codebase so changes are:

- reviewable
- attributable
- testable
- deployable with intent

## 16.2 Review rule

Changes to shared config families should be reviewed with awareness of their scope.

Examples:

- changing token values affects design consistency
- changing ranking config affects trust and conversion
- changing provider allowlists affects security and UX
- changing route policy affects SEO and privacy behavior

## 16.3 No silent drift rule

If a new configuration family is introduced, it should be added to the canonical governance map rather than appearing as an untracked local pattern.

## 17. Recommended Implementation Topology

The exact paths can change, but the implementation should converge on a shape like:

```text
src/
  config/
    env.server.ts
    env.public.ts
    features.ts
    providers.ts
    route-policy.ts
    upload-policy.ts
    meeting-platforms.ts
    ranking/
      profiles.ts
  design/
    tokens.css
    tokens.ts
  domain/
    lessons/
      constants.ts
      states.ts
    matching/
      scorer.ts
      config.ts
    trust/
      rating.ts
      config.ts
```

The important rule is not the exact folder names.

The important rule is that:

- configuration is discoverable
- ownership is obvious
- environment parsing is centralized
- domain rules are not embedded inside route or component files

## 18. Phase 1 Must-Haves

Phase 1 should include:

- a token implementation layer derived from the approved design-system spec
- centralized environment parsing
- centralized provider allowlists
- centralized meeting-platform support config
- centralized upload policy config
- centralized ranking profile config
- one feature-flag registry, even if very small
- component-governance rules that prevent forked student versus tutor base components

## 19. Decisions To Lock Now

The architecture should lock the following decisions now:

- one source of truth should exist for every semantically meaningful value family
- reusable components own presentation, not business policy
- route layers own route content and metadata inputs, not token values
- environment access must be centralized and typed
- `NEXT_PUBLIC_` usage must stay minimal and intentional
- ranking, trust, and provider behavior must remain centrally configured
- feature flags must use a central registry
- shared student and tutor objects should reuse the same component contracts by default

## 20. What This Architecture Prevents

This architecture is meant to prevent:

- colors, spacing, and radius values copied across JSX and CSS files
- route-specific forks of core components
- business-rule duplication between service and UI layers
- uncontrolled environment-variable usage
- provider strings and allowlists scattered across the app
- future AI agents inventing competing local patterns
- fragile implementation that becomes expensive to refactor later

## 21. Final Recommendation

Mentor IB should treat configuration and governance as part of the core product architecture, not as cleanup work after implementation starts.

The recommended posture is:

- centralized config for semantically meaningful behavior
- token-led visual implementation
- wrapper-first component reuse
- route-owned content
- typed environment boundaries
- narrow, intentional runtime switches

This creates a codebase that is safer for AI agents to extend, easier for humans to review, and much less likely to split into inconsistent local conventions.

## 22. Official Source Notes

The recommendation above is informed by current official documentation for:

- Next.js environment variables: `https://nextjs.org/docs/app/guides/environment-variables`
- Vercel environment variables: `https://vercel.com/docs/environment-variables`
- Vercel Edge Config: `https://vercel.com/docs/edge-config`
