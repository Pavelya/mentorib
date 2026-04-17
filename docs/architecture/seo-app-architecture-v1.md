# Mentor IB SEO App Architecture v1

**Date:** 2026-04-08
**Status:** Standalone app-layer architecture for SEO and AI discoverability
**Scope:** Next.js App Router boundaries, metadata composition, robots and sitemap architecture, JSON-LD helper boundaries, dynamic route quality gates, and observability

## 1. Why This Document Exists

This document completes the SEO architecture at the application layer.

It exists to answer:

- where SEO lives inside the Next.js app
- how public versus non-public routes differ architecturally
- where metadata, canonical, robots, sitemap, and JSON-LD are composed
- how dynamic public routes like tutor profiles become indexable safely
- how AI discoverability is handled without creating a separate technical stack

This is the missing bridge between:

- SEO strategy and page policy
- route ownership and planning
- the actual application architecture

## 2. What This Document Does Not Redefine

This document does not replace the approved SEO policy or planning docs.

It inherits from:

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/content-template-spec-v1.md`
- `docs/architecture/architecture-discussion-v1.md`
- `docs/planning/seo-route-ownership-map-v1.md`

This document only defines the technical and structural architecture for how SEO and AI discoverability should be implemented in the app.

## 3. Core Recommendation

Mentor IB should implement SEO as a first-class route-layer system inside the shared Next.js App Router application.

The practical rule is:

- SEO belongs in the route layer
- metadata belongs in the route layer
- structured data belongs in the route layer
- robots and sitemap belong at the app boundary
- reusable UI components stay SEO-agnostic

AI discoverability is not a separate system.

It is the result of the same architecture producing:

- crawlable public routes
- correct indexation behavior
- server-rendered answerable content
- truthful metadata and structured data
- strong public-page information structure

## 4. Architectural Principles

These principles should govern every SEO-related implementation decision.

## 4.1 Route-first, not component-first

SEO should be implemented around route families and route classes.

It should not be implemented inside low-level UI components.

## 4.2 One app, one discoverability system

The app already uses one shared Next.js App Router architecture.

SEO should follow the same principle.

There should not be:

- a second SEO app
- a separate AI-search rendering stack
- route-specific ad hoc metadata systems

## 4.3 Public route quality gates

Not every public route should be indexable just because it exists.

Dynamic public routes need architectural quality gates before:

- indexing
- sitemap inclusion
- structured-data emission where applicable

## 4.4 Server-first public pages

All Class A public pages should render meaningful content on the server.

Client enhancement is allowed.

Client-only primary content is not.

## 4.5 Shared helpers, route-specific invocation

Shared helpers should exist for:

- metadata building
- canonical URL resolution
- robots defaults
- sitemap generation
- JSON-LD builders

But these helpers must be invoked from route-layer code, not from presentation components.

## 5. Route-Class Architecture

The route-class model should become a first-class application concept.

## 5.1 Route classes

The app has three SEO-relevant route classes:

- Class A: public and indexable
- Class B: public but non-indexable
- Class C: operational or authenticated

## 5.2 Architectural meaning of each class

### Class A

Class A routes require:

- full route metadata
- canonical behavior
- indexable robots posture
- sitemap eligibility
- structured-data eligibility
- AI discoverability quality support

### Class B

Class B routes require:

- functional metadata only
- noindex behavior
- exclusion from sitemap
- no SEO-growth surface

### Class C

Class C routes require:

- functional metadata only where helpful
- strong noindex defaults
- no sitemap eligibility

## 5.3 Route-class implementation rule

Route class should be treated as explicit application knowledge, not tribal knowledge.

The system should have one central route-class map or equivalent route-family policy source.

That source should drive:

- metadata defaults
- robots posture
- sitemap inclusion logic
- quality-gate checks for dynamic public routes

## 6. App Router Topology

The approved product architecture already uses one shared App Router shell.

SEO should map onto that shell directly.

## 6.1 Recommended route topology

```text
src/app/
  layout.tsx
  robots.ts
  sitemap.ts
  (public)/
    layout.tsx
    page.tsx
    how-it-works/page.tsx
    trust-and-safety/page.tsx
    support/page.tsx
    become-a-tutor/page.tsx
    tutors/[slug]/page.tsx
  (student)/
    layout.tsx
    match/page.tsx
    results/page.tsx
    compare/page.tsx
    book/[context]/page.tsx
    messages/page.tsx
    lessons/page.tsx
  tutor/
    layout.tsx
    overview/page.tsx
    lessons/page.tsx
    schedule/page.tsx
    messages/page.tsx
    students/page.tsx
    apply/page.tsx
src/lib/seo/
  route-class.ts
  metadata/
    defaults.ts
    build-metadata.ts
    canonical.ts
    open-graph.ts
  schema/
    organization.ts
    webpage.ts
    breadcrumb.ts
    help-page.ts
    profile-page.ts
  sitemap/
    include-route.ts
    build-entries.ts
  quality/
    public-indexability.ts
```

## 6.2 Public layout rule

`(public)/layout.tsx` should be the public-route SEO boundary.

It should provide:

- shared public metadata defaults
- shared public Open Graph defaults
- shared public structural assumptions

It should not hardcode page-specific values.

## 6.3 Student and tutor layout rule

`(student)` and `tutor` sections should default toward:

- functional metadata
- non-indexable posture
- no sitemap participation

This protects product surfaces from accidental discoverability drift.

## 7. Metadata Architecture

Metadata should be treated as a compositional route-layer system.

## 7.1 Root metadata

`src/app/layout.tsx` should define:

- global brand metadata defaults
- default title template strategy if used
- base social defaults
- default icons

It should not define route-specific public-page intent.

## 7.2 Public layout metadata

`src/app/(public)/layout.tsx` should define:

- public-site defaults
- default Open Graph image behavior
- any shared canonical base utilities or metadata inheritance assumptions

It should not replace route-level titles or descriptions.

## 7.3 Per-route metadata

Each Class A route should own its final route metadata.

Use:

- static metadata for stable pages such as `/how-it-works` or `/trust-and-safety`
- `generateMetadata` where metadata depends on dynamic data such as `/tutors/[slug]`

## 7.4 Metadata builder rule

If helpers are used, they should build route metadata from a route-owned input object.

The route should remain the final owner of:

- title intent
- description intent
- canonical target
- route-level robots posture

## 7.5 Canonical architecture

Canonical URLs should be built from:

- one production site origin source
- one route-aware path builder
- one parameter-handling policy

Do not let routes manually concatenate canonicals ad hoc.

## 7.6 Non-public route metadata rule

Class B and Class C routes may use:

- light functional titles
- minimal descriptions if useful
- route-level noindex posture

They should not participate in search optimization logic.

## 7.7 Open Graph architecture

Open Graph should follow the same route-family approach as metadata.

Recommended model:

- default public OG behavior at the public layout level
- route-family overrides for homepage, informational pages, and tutor profiles
- dynamic OG generation later for tutor profiles or landing pages if useful

## 8. Robots Architecture

Robots behavior should be split between global and route-level concerns.

## 8.1 `robots.ts`

`src/app/robots.ts` should define:

- the site-wide crawl policy
- sitemap location
- broad environment-aware protections

This is the global crawl boundary.

## 8.2 Route-level robots

Route-level robots behavior should be applied through metadata on each route family.

Use it for:

- Class A indexable routes
- Class B non-indexable public routes
- Class C operational routes

## 8.3 Preview environment protection

Preview or staging environments should default to noindex.

This should be architecture-enforced, not remembered manually during deployment.

## 8.4 Robots anti-pattern

Do not treat `robots.txt` as the only indexation control layer.

Per-route metadata is still required for correct route behavior.

## 9. Sitemap Architecture

The sitemap should be generated from route-family policy, not manually curated page lists.

## 9.1 `sitemap.ts`

`src/app/sitemap.ts` should be the canonical sitemap entry point.

It should source entries from:

- stable Class A static routes
- approved dynamic Class A routes

It should exclude:

- Class B routes
- Class C routes
- thin or pending dynamic public routes

## 9.2 Dynamic route inclusion rule

Dynamic public routes such as `/tutors/[slug]` should enter the sitemap only if the route-family quality gate says they are indexable.

## 9.3 Segmentation rule

Phase 1 should keep one main sitemap unless scale clearly requires more.

Segmented sitemaps are a later optimization, not a day-one requirement.

## 10. JSON-LD Architecture

Structured data should be implemented as route-layer composition using shared helpers.

## 10.1 Helper location

Recommended location:

- `src/lib/seo/schema/*`

This keeps schema logic centralized and reusable.

## 10.2 Invocation rule

JSON-LD should be emitted from:

- the route page
- or the route's immediate server-side composition layer

It should not be emitted from presentation components like:

- hero blocks
- card components
- person summary blocks

## 10.3 Approved helper families

Initial helper set should match approved schema usage:

- organization
- website or webpage
- breadcrumb
- help-page
- profile-page

## 10.4 Input contract rule

Every helper should accept only:

- route-relevant data
- visible-content-backed values
- production-safe URLs

It should reject or avoid:

- hidden moderation state
- internal-only data
- unsupported rating or review claims

## 10.5 Route-family examples

### Home

Can use:

- `Organization`
- `WebSite`

### Informational public pages

Can use:

- `WebPage`
- `BreadcrumbList` where appropriate

### Support

Can use:

- `HelpPage`
- `FAQPage` only if visibly supported

### Tutor profiles

Can use:

- `ProfilePage`
- `Person`

Only after the route-family quality rules are satisfied.

## 11. Dynamic Public Route Architecture

Dynamic public routes need stricter architecture than static informational routes.

## 11.1 Tutor profile route family

`/tutors/[slug]` should be treated as a dynamic public-route family with a quality-gated public indexability model.

That means the route family should support:

- dynamic metadata generation
- dynamic canonical generation
- quality-gated robots posture
- quality-gated sitemap inclusion
- quality-gated structured-data emission where required

## 11.2 Quality-gate architecture

The app should have one server-side quality-gate function for dynamic public routes.

Its job is to answer:

- is this route publicly valid
- is this route indexable
- is this route sitemap-eligible
- is this route schema-eligible

This should be the same architectural decision point used by:

- page rendering logic if needed
- metadata generation
- sitemap inclusion
- schema invocation

## 11.3 Rendering-state rule

If a tutor profile exists but does not clear the quality gate:

- the route may still render as a controlled public page if product wants it
- but it must stay non-indexable
- and it must not enter the sitemap as a normal public SEO page

## 12. Content-Source And Data-Source Boundaries

SEO architecture depends on clean data boundaries.

## 12.1 Route DTO rule

Routes should not pull raw database records directly into metadata or schema logic.

They should consume:

- DTO-safe route data
- public-only fields
- route-ready canonical values

## 12.2 Public-field rule

Metadata and schema must use only fields safe for public exposure.

Examples:

- public tutor name
- public bio summary
- approved subject coverage
- visible trust proof

They must not use:

- internal moderation state
- hidden platform metrics
- private operational notes

## 12.3 Content-template alignment

Visible content must still follow the route-family content templates.

The architecture should not allow metadata and schema to get ahead of page reality.

## 13. Caching And Revalidation Architecture

Public SEO routes need explicit cache and freshness rules.

## 13.1 Stable informational pages

Pages like:

- `/`
- `/how-it-works`
- `/trust-and-safety`
- `/become-a-tutor`

can be:

- statically generated
- or server-rendered with long revalidation windows

depending on actual implementation convenience

## 13.2 Conditional public pages

Pages like `/support` should be treated based on how frequently content changes.

The main rule is not freshness for its own sake.

The main rule is that the rendered output remains:

- useful
- stable
- index-safe

## 13.3 Dynamic tutor profiles

Tutor profiles should use a revalidation strategy that balances:

- discoverability freshness
- content approval stability
- operational simplicity

The quality gate should remain authoritative even if data freshness is delayed by caching.

## 14. AI Discoverability Architecture

AI discoverability should be implemented through the same route architecture, not through a second layer.

## 14.1 No special AI route family

There should be no:

- AI-only landing pages
- AI-only metadata system
- AI-only structured-data layer

## 14.2 Route answerability

Class A public pages should be architected so they can be summarized well.

That means the server-rendered page should contain:

- a clear answer near the top
- a visible purpose
- specific headings
- visible trust or explanatory context

This is a route-content architecture concern, not a growth hack.

## 14.3 Entity clarity

AI discoverability benefits when the route clearly communicates:

- what the page is
- who it is for
- what entity it represents
- what next action belongs to it

Metadata, schema, and visible structure should all agree on those points.

## 15. Validation And Observability Architecture

SEO architecture is incomplete if there is no way to verify it.

## 15.1 Validation layers

The system should support routine checks for:

- rendered metadata output
- rendered robots output
- rendered canonical output
- rendered JSON-LD output
- sitemap contents
- preview noindex posture

## 15.2 Search Console

Search Console should be treated as the operational validation layer for:

- sitemap visibility
- coverage and indexing behavior
- URL inspection for important routes

## 15.3 Architecture rule

Observability should validate the discoverability system.

It should not redefine the route classes or route rules.

A dedicated operational companion now exists:

- `search-console-and-observability-architecture-v1.md`

## 16. What This Architecture Prevents

This architecture is meant to prevent:

- metadata logic spreading into components
- route-by-route SEO improvisation
- accidental indexing of product workflow pages
- tutor profiles entering the index before they are ready
- duplicate AI discoverability systems
- mismatch between visible content and structured data

## 17. Decisions To Lock Now

These decisions are mature enough to lock now:

- SEO lives in the App Router route layer
- `(public)` is the main Class A boundary
- `(student)` and `tutor` default to non-indexable product surfaces
- metadata is composed at root layout, public layout, and route levels
- robots and sitemap live at the app boundary
- JSON-LD uses shared helpers but route-level invocation
- dynamic public routes require shared quality-gate logic
- AI discoverability is implemented through the same route architecture as SEO

## 18. Final Recommendation

Mentor IB should complete SEO architecture by making discoverability a route-layer capability of the shared Next.js app.

The correct model is:

- one route-class system
- one metadata composition model
- one robots and sitemap boundary
- one JSON-LD helper layer
- one quality-gate architecture for dynamic public routes
- one combined SEO and AI discoverability system
