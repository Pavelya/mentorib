# Mentor IB SEO Implementation Foundation v1

**Date:** 2026-04-08
**Status:** Standalone planning foundation for future SEO and AI discoverability tasks
**Scope:** task boundaries, ownership, sequencing, acceptance model, and anti-duplication rules

## 1. Why This Document Exists

This document defines how future SEO work should enter the implementation plan.

It exists to prevent three common problems:

- SEO becoming a second parallel backlog disconnected from product work
- AI discoverability becoming a vague extra stream with duplicate tasks
- public-page implementation teams reinventing metadata, robots, or structured data rules route by route

This document is the planning foundation for future SEO work.

It is not the SEO strategy itself.

## 2. What This Document Does Not Redefine

This document does not replace the approved SEO source docs.

Those documents remain the source of truth for strategy and page rules:

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/content-template-spec-v1.md`

This document only defines:

- how SEO work should be shaped into implementation tasks
- who owns what
- when a task is valid
- what future route teams should inherit automatically

## 3. Core Recommendation

Mentor IB should treat SEO and AI discoverability as a shared implementation contract for public routes, not as a separate product stream.

The practical rule is:

- one SEO foundation layer
- one public-route SEO contract
- no separate AI SEO backlog

AI discoverability should be handled through the same public-page implementation quality rules that serve strong technical SEO.

## 4. Working Principle

SEO work should be introduced in three layers.

### 4.1 Layer 1: Shared foundation work

This work happens once and is reused by all future public pages.

Examples:

- route ownership rules
- metadata generation boundaries
- robots and sitemap infrastructure
- JSON-LD helper boundaries
- preview noindex defaults

### 4.2 Layer 2: Route-family implementation work

This work applies to a public route family.

Examples:

- home page metadata
- tutor profile metadata generator
- tutor profile structured data
- subject page canonical logic

### 4.3 Layer 3: Content and growth iteration work

This work improves already-approved public pages.

Examples:

- editorial expansion
- title or description refinement
- new subject-page coverage
- new service-page coverage

This layer should come only after the foundation layer is stable.

## 5. Ownership Model

SEO work should follow the same ownership discipline as the rest of the product.

### 5.1 Architecture ownership

Architecture owns:

- route classification rules
- public versus non-public boundaries
- rendering policy for SEO-sensitive routes
- metadata system boundaries
- robots and sitemap infrastructure
- JSON-LD helper boundaries

### 5.2 Product and content ownership

Product and content own:

- public page inventory decisions
- which route families exist in each phase
- quality thresholds for indexable pages
- page promises and user-intent fit

### 5.3 Design ownership

Design owns:

- public page structure
- clarity of headings and visible page hierarchy
- content surfaces that support trust and answerability
- continuity between search-facing pages and the product experience

### 5.4 Feature implementation ownership

Feature teams own:

- route-specific metadata values
- route-specific JSON-LD inputs
- route-specific content assembly
- route-specific acceptance criteria

### 5.5 Component ownership

The component layer owns presentation primitives and reusable UI behavior.

It does not own:

- indexation logic
- canonical logic
- metadata policy
- structured data business rules

That separation is critical to avoid duplicative SEO work across screens and components.

## 6. Non-Duplication Rules

Future SEO tasks must follow these rules.

### 6.1 Do not create a separate AI SEO task if an SEO foundation or public-route task already covers it

Examples of duplicate task shapes to avoid:

- one task for metadata
- another task for "AI snippet optimization"

If both tasks target the same public route quality, they should be one task.

### 6.2 Do not put SEO business logic inside reusable UI components

Examples:

- `MatchRow` should not know canonical rules
- `TrustProofBlock` should not emit structured data by itself
- `PageHero` should not decide robots behavior

### 6.3 Do not create per-page robots or canonical rules if the rule belongs to the route family

Prefer one route-family rule over many page-local exceptions.

### 6.4 Do not create content tasks for pages that are not approved for the public indexable surface

There is no value in SEO-writing dashboard pages, personalized result flows, or logged-in messages.

### 6.5 Do not create phase 1.5 SEO tasks before phase 1 public route foundations are complete

Subject and service expansion should not outrun the shared SEO infrastructure.

## 7. What Counts As A Valid Future SEO Task

A future SEO task is valid only if it meets all of these conditions:

- it belongs to an approved route family
- it supports an approved phase
- it does not duplicate an existing foundation rule
- it has a clear owner
- it has a defined acceptance outcome
- it improves a public discovery surface or the shared infrastructure that supports it

If a task fails those checks, it should not be created yet.

## 8. Foundation Tasks That Should Exist Once

These are the shared SEO implementation tasks that should be done once and then reused.

## 8.1 Public route ownership matrix

Purpose:

- define which route families are public and indexable
- define which route families are public but non-indexable
- define which route families are operational only

Why it prevents duplication:

- future teams stop inventing route-level SEO rules ad hoc

## 8.2 Metadata ownership and generator boundaries

Purpose:

- define where metadata is generated
- define which route families use static metadata versus `generateMetadata`
- define how canonical values are resolved

Why it prevents duplication:

- future route work inherits one system instead of re-implementing metadata locally

## 8.3 Robots and sitemap infrastructure

Purpose:

- define production robots defaults
- define preview noindex behavior
- define sitemap inclusion rules
- define where exclusions are enforced

Why it prevents duplication:

- indexation policy stops being spread across unrelated route files

## 8.4 JSON-LD helper boundaries

Purpose:

- define which schema helpers exist
- define what data they accept
- define where they are called from

Why it prevents duplication:

- schema logic stays centralized and route-aware

## 8.5 Public-page SEO acceptance checklist

Purpose:

- create one repeatable done-check for public routes

Why it prevents duplication:

- every public route does not need a custom SEO review process from scratch

## 8.6 Measurement baseline

Purpose:

- define basic measurement setup for discoverability

Examples:

- Search Console setup
- sitemap submission
- preview environment indexation checks
- route-level metadata QA checks

Why it prevents duplication:

- teams stop inventing one-off measurement practices page by page

## 9. Route-Level SEO Task Template

Once the shared foundation exists, a public-route SEO task should follow one consistent pattern.

Each task should define:

- route family
- route purpose
- indexation rule
- metadata source
- canonical rule
- robots rule
- structured data rule
- content template source
- AI discoverability checks
- done criteria

## 10. AI Discoverability Rule

AI discoverability should not become its own speculative task stream.

For Mentor IB, AI discoverability is satisfied when a public page:

- is crawlable and indexable where appropriate
- renders meaningful content on the server
- answers a clear user need
- uses specific headings and visible structure
- presents trustworthy proof and context
- avoids thin, generic, mass-produced copy
- uses only truthful structured data

If a task already improves those things, it is already doing the AI-discoverability job.

## 11. AI Discoverability Acceptance Checks

Every indexable public page should pass these checks:

- the primary question or intent is answered clearly near the top
- the page has specific, scannable headings
- the page explains who it is for
- the page contains visible proof, context, or decision support
- the page content is specific enough that a summary would sound grounded
- the page does not rely on hidden content or speculative markup

These are not extra checks layered on top of SEO.

They are the same quality checks expressed in AI-search language.

## 12. Interaction With Other Workstreams

SEO foundation work should connect to other implementation layers without colliding with them.

### 12.1 Route work

SEO attaches to public route ownership and acceptance criteria.

It should not create a second route backlog.

### 12.2 Component work

Components should remain SEO-agnostic except where they need to support visible semantics such as headings, links, or ordered lists.

The component backlog should not contain metadata or robots work.

### 12.3 Content work

Content work should inherit from the public page inventory and content template spec.

It should not create new indexable route families by itself.

### 12.4 Analytics and growth work

Measurement should consume the shared SEO foundation.

It should not redefine what counts as a public SEO page.

## 13. Recommended Sequencing

The right sequence is:

1. lock the public route inventory and phase scope
2. implement shared SEO foundations once
3. attach SEO acceptance criteria to phase 1 public routes
4. ship the phase 1 public routes
5. measure
6. only then expand into phase 1.5 subject and service pages

This sequencing protects the team from scaling weak public pages before the foundation is stable.

## 14. Public Route Done Criteria

Every indexable public route should be considered done only if:

- the route is approved in the public page inventory
- the route renders meaningful primary content on the server
- metadata matches the route-family matrix
- canonical behavior is correct
- robots behavior is correct
- required structured data is present and truthful
- visible content matches the content template rules
- AI discoverability checks pass
- the route is included in or excluded from the sitemap correctly

## 15. Routes That Must Not Generate SEO Tasks

The following route families should not produce future SEO tasks unless the product model changes materially:

- auth
- callback routes
- personalized match flow steps
- personalized results
- compare
- booking flow
- messages
- lessons
- tutor dashboards
- student dashboards

These routes can have functional metadata.

They should not create search-growth work.

## 16. Anti-Patterns To Avoid

Do not:

- create "AI SEO" tickets that duplicate existing public-page quality work
- attach SEO logic to reusable UI components
- treat every public route as an SEO route
- expand into subject and service pages before phase 1 route quality is proven
- create content tasks before route-family indexation rules are stable
- let growth work override the public-page inventory without a product decision

## 17. Next Planning Deliverables

If the team wants to continue immediately, the next useful planning artifacts are:

1. `seo-route-ownership-map-v1.md`
2. `seo-foundation-task-pack-v1.md`
3. `public-route-seo-acceptance-checklist-v1.md`

These should be implementation-facing and should inherit from the approved SEO architecture docs rather than restating them.

The route ownership map now exists and should be used as the first child planning artifact.
The SEO foundation task pack now exists and should be used as the one-time shared implementation sequence.
The public-route SEO acceptance checklist now exists and should be used as the shared done-check for Class A routes.

## 18. Final Recommendation

Mentor IB should not treat SEO and AI discoverability as a separate platform inside the product.

The right approach is:

- one shared SEO foundation
- one clear contract for public routes
- one acceptance model that already covers AI discoverability
- no duplication across routes, components, and growth work
