# Mentor IB Search Console And Observability Architecture v1

**Date:** 2026-04-08
**Status:** Standalone operational architecture for SEO and AI discoverability validation
**Scope:** production verification, Search Console ownership, sitemap monitoring, route validation, release gates, and incident handling

## 1. Why This Document Exists

This document defines how Mentor IB should verify and monitor the SEO system after it is implemented.

It exists to answer:

- how we know public-route SEO is working in production
- how Search Console fits into the architecture
- how sitemap, robots, canonical, metadata, and JSON-LD behavior are checked
- how dynamic public routes are monitored
- how AI discoverability is observed without inventing a fake second measurement system

This is the operational companion to the SEO app architecture.

## 2. What This Document Does Not Redefine

This document does not replace the approved SEO policy or app architecture.

It inherits from:

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/planning/seo-route-ownership-map-v1.md`

This document only defines how the discoverability system is observed, validated, and kept healthy in production.

## 3. Core Recommendation

Mentor IB should treat Search Console and route-level validation as part of the SEO architecture, not as an afterthought after launch.

The practical rule is:

- one production Search Console property
- one authoritative sitemap path
- one repeatable URL validation routine
- one route-level verification standard
- one observability model for both SEO and AI discoverability proxies

AI discoverability should not create a separate observability stack.

It should be monitored through the same public-route quality and search-surface health signals that support normal SEO.

## 4. Observability Goals

The observability architecture should answer five questions reliably:

1. Are the right public routes indexable?
2. Are the wrong routes protected from indexation?
3. Are metadata, canonical, robots, and schema outputs correct?
4. Are dynamic public routes entering and leaving the public surface correctly?
5. Is the public search surface becoming healthier or drifting?

## 5. Environment Model

Observability rules should differ by environment.

## 5.1 Production

Production is the only environment that should be treated as a true search surface.

Production should have:

- canonical production domain
- indexable Class A routes
- live sitemap
- live Search Console ownership

## 5.2 Preview and staging

Preview and staging environments should be treated as verification environments, not search surfaces.

They should have:

- default noindex posture
- no expectation of Search Console indexing behavior
- verification focused on rendered output rather than search inclusion

## 5.3 Local development

Local environments should be used only for:

- metadata output checks
- robots output checks
- schema output checks
- route-class behavior checks

They are not part of the live observability surface.

## 6. Search Console Property Architecture

Search Console should be modeled as a production operations dependency.

## 6.1 Recommended property model

Use one primary production property for the canonical production domain.

Recommended posture:

- one production domain property if domain-level verification is feasible
- otherwise one canonical URL-prefix property for the exact production origin

The key rule is consistency:

- Search Console should observe the same domain that canonicals and sitemaps point to

## 6.2 Ownership rule

Search Console ownership should not depend on one individual person's account as an architectural single point of failure.

The recommended model is:

- primary owner tied to the business or shared operations identity
- at least one backup verified owner
- clear internal record of who can access and change property settings

## 6.3 Property scope rule

Do not spread attention across multiple overlapping production properties without a good reason.

The canonical production property should be the main operational source of truth.

## 7. Sitemap Observability Architecture

The sitemap is one of the core health surfaces for the public SEO system.

## 7.1 Authoritative sitemap path

There should be one authoritative sitemap entry point in production.

This should correspond to the app-layer `sitemap.ts` behavior defined in the SEO app architecture.

## 7.2 Submission rule

The production sitemap should be submitted in Search Console.

The architecture assumption is:

- one live submitted sitemap
- later segmentation only if scale requires it

## 7.3 What the sitemap monitoring should detect

The team should be able to confirm:

- the sitemap is reachable
- the sitemap contains only approved Class A routes
- non-indexable routes are absent
- dynamic public routes enter only when quality-gate rules allow them

## 7.4 Drift signals

Sitemap drift should be suspected if:

- route counts change unexpectedly
- tutor profile URLs appear before approval logic is ready
- support or other conditional pages appear before meeting quality rules
- Class B or Class C routes show up at all

## 8. URL-Level Validation Architecture

Important public routes need URL-level inspection, not only aggregate monitoring.

## 8.1 Route classes that require direct checks

Direct route inspection should be standard for:

- homepage
- informational Class A pages
- support if indexable
- become-a-tutor
- tutor profile routes

## 8.2 What should be checked at the URL level

For an important public route, the validation routine should confirm:

- rendered title
- rendered meta description
- canonical URL
- robots posture
- JSON-LD presence if expected
- expected internal links
- correct sitemap presence or absence

## 8.3 Dynamic route spot checks

Dynamic public route families such as tutor profiles need recurring spot checks because their output depends on data quality and approval state.

The team should be able to inspect:

- one clearly valid tutor profile
- one incomplete or non-indexable tutor profile state
- one recently updated tutor profile

## 9. Search Console Monitoring Model

Search Console should be treated as the main production feedback surface, not the only source of truth.

## 9.1 Core surfaces to monitor

The core Search Console checks should focus on:

- index coverage health
- sitemap processing health
- URL inspection for critical pages
- canonical interpretation on important routes
- structured-data warnings where relevant

## 9.2 Coverage interpretation rule

Coverage changes should be interpreted through the route-class model.

Examples:

- more indexed Class A pages may be good
- indexed Class B or Class C routes are a problem
- excluded Class A routes may indicate quality-gate or technical issues

## 9.3 Canonical interpretation rule

If Search Console reports canonical outcomes that differ from the intended route policy, that should be treated as an architecture signal, not just a content issue.

## 10. Application-Level Verification Architecture

Search Console alone is not enough.

The app should also have a direct verification layer based on rendered output.

## 10.1 Render verification targets

The team should be able to inspect rendered output for:

- metadata
- canonical links
- robots tags
- JSON-LD blocks
- crawlable links

## 10.2 Verification scope

The minimum route verification set should include:

- homepage
- one informational route
- one trust route
- one tutor acquisition route
- one support route if indexable
- one approved tutor profile
- one intentionally non-indexable product route

## 10.3 Why this matters

This catches issues before or alongside Search Console signals, which can lag.

## 11. Dynamic Public Route Observability

Dynamic public routes need their own observability logic because they can drift as data changes.

## 11.1 Tutor profile health

For tutor profiles, the team should be able to observe:

- count of publicly approved profiles
- count of sitemap-eligible profiles
- count of profiles currently withheld by quality-gate logic
- sampled profile output quality

## 11.2 Quality-gate observability rule

If the app architecture uses one quality-gate function for dynamic public routes, observability should track its outcomes.

That means the team should be able to answer:

- how many routes are eligible
- how many routes are public but non-indexable
- whether eligibility changed unexpectedly after data changes

## 11.3 Failure examples

This layer should help detect:

- profiles entering the sitemap too early
- missing metadata on approved profiles
- schema being emitted for incomplete profiles
- public-profile counts drifting from expected approval counts

## 12. AI Discoverability Observability

AI discoverability should be monitored through proxy signals, not through a fictional direct metric.

## 12.1 What we can observe

We can observe:

- health of the public searchable surface
- specificity and quality of Class A public pages
- indexation correctness
- canonical correctness
- structured-data integrity
- query impressions and clicks for public routes

## 12.2 What we should not pretend to observe directly

We should not pretend to have:

- a direct "AI SEO score"
- exact visibility into every AI summary system
- a separate architectural dashboard just for AI search

## 12.3 Architecture rule

If the public-route SEO system is healthy and the pages are answerable, specific, and trustworthy, that is the correct operational posture for AI discoverability too.

## 13. Release-Gate Architecture

Important public-route releases should include explicit discoverability verification.

## 13.1 Class A release gate

Before a Class A route launches as indexable, confirm:

- the route passes the shared public-route acceptance checklist
- metadata and canonical outputs are correct
- robots posture is correct
- schema output is correct if applicable
- sitemap behavior is correct

## 13.2 Class B and Class C release gate

Before a Class B or Class C route launches, confirm:

- noindex posture is correct
- the route is excluded from sitemap behavior where expected
- functional metadata does not accidentally imply search intent

## 13.3 Deployment rule

Production deployment should not be the first time a route's discoverability behavior is observed.

## 14. Incident Architecture

Observability is not complete unless the team knows what counts as an incident.

## 14.1 SEO incidents

Examples of incidents:

- Class B or Class C routes becoming indexable
- broken or missing canonical tags on Class A routes
- missing robots tags on sensitive public routes
- malformed or missing sitemap output
- schema drift that no longer matches visible content

## 14.2 Severity logic

High-severity examples:

- sensitive product pages getting indexed
- homepage canonical or robots failure
- sitemap outage
- tutor profiles entering the public surface without quality-gate protection

Medium-severity examples:

- one informational route with broken metadata
- support page accidentally staying indexable after becoming thin

## 14.3 Incident response rule

When an incident affects discoverability behavior, fix the route or app boundary first.

Do not patch around the issue with ad hoc content changes if the real problem is architectural.

## 15. Ownership Model

Observability should follow the same ownership logic as the rest of the SEO architecture.

## 15.1 Architecture owner

Owns:

- the global verification model
- sitemap and robots architecture
- route-class observability boundaries
- quality-gate observability for dynamic public routes

## 15.2 Route implementation owner

Owns:

- route output correctness
- route-level metadata correctness
- route-level schema correctness
- route-level checklist evidence

## 15.3 Product and content owner

Owns:

- whether the page still deserves indexability
- whether visible content quality remains strong enough

## 15.4 Operations rule

Search Console access and production verification should have shared continuity, not single-person dependency.

## 16. Operational Artifacts Recommended

This architecture does not require a huge tooling stack, but it does benefit from a few lightweight artifacts:

- one canonical list of Class A public routes
- one list of dynamic public route families and their quality-gate rules
- one production Search Console access record
- one recurring verification checklist for public routes

## 17. Decisions To Lock Now

These decisions are mature enough to lock now:

- production is the only true search surface
- preview and staging must default to noindex
- one primary production Search Console property should be the operational source of truth
- one authoritative sitemap entry point should exist
- URL-level inspection should be standard for critical Class A routes
- dynamic public route quality-gate outcomes should be observable
- AI discoverability should be monitored through the same public-route health system as SEO

## 18. Final Recommendation

Mentor IB should complete the SEO architecture by treating Search Console and route validation as operational parts of the same discoverability system.

The correct model is:

- one production property
- one sitemap boundary
- one route-level verification routine
- one dynamic-route quality-gate observability layer
- one shared operational model for both SEO and AI discoverability proxies
