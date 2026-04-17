# Mentor IB Public Route SEO Acceptance Checklist v1

**Date:** 2026-04-08
**Status:** Standalone reusable acceptance checklist for Class A public routes
**Scope:** launch readiness checks for SEO and AI discoverability on indexable public pages

## 1. Why This Document Exists

This document is the reusable done-check for Class A public routes.

It exists so future route teams can answer one clear question:

**Is this public route ready to be indexable and discoverable?**

It is designed to stop three problems:

- launch of indexable routes with incomplete metadata or indexation behavior
- inconsistent route-by-route SEO review quality
- separate "AI SEO" reviews that duplicate normal public-route quality checks

## 2. What This Document Does Not Redefine

This document does not replace the approved discoverability source docs.

It inherits from:

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/content-template-spec-v1.md`
- `docs/planning/seo-implementation-foundation-v1.md`
- `docs/planning/seo-route-ownership-map-v1.md`
- `docs/planning/seo-foundation-task-pack-v1.md`

This document only defines the acceptance standard for individual Class A public routes.

A route-task companion now exists for the approved phase 1 Class A set:

- `docs/planning/phase1-class-a-route-seo-task-pack-v1.md`

## 3. When To Use This Checklist

Use this checklist for:

- new Class A public routes
- major revisions to existing Class A public routes
- any public route that is about to enter the sitemap or index

Do not use this full checklist for:

- Class B public but non-indexable routes
- Class C operational or authenticated routes
- purely internal admin pages

Those routes only need functional metadata and correct noindex behavior.

## 4. How To Use This Checklist

The route owner should run this checklist before a Class A route is considered launch-ready.

The checklist should be used:

- before route launch
- before a route is added to the sitemap
- when a route changes enough to affect search or AI discoverability quality

Each item should be evaluated as one of:

- pass
- fail
- not applicable

Any blocker-level failure means the route should not ship as indexable yet.

## 5. Blocker Rule

A route must not launch as indexable if any of these are false:

- the route is approved for the public indexable surface
- meaningful primary content renders on the server
- metadata is present and route-appropriate
- canonical behavior is correct
- robots behavior is correct
- required structured data is truthful and valid
- visible content is genuinely useful and not thin
- AI discoverability checks pass at a basic quality level

If those conditions are not met, the route can still exist, but it should remain non-indexable until fixed.

## 6. Evidence Required For Review

Before sign-off, the route owner should be able to show:

- the final route path or route family
- rendered HTML or server-rendered output evidence
- final metadata output
- robots behavior
- canonical output
- JSON-LD output if applicable
- visible content and heading structure
- sitemap inclusion or exclusion behavior

This does not need a heavy process.

It does need enough evidence that the review is based on the real route, not assumptions.

## 7. Core Acceptance Checklist

These checks apply to every Class A public route.

## 7.1 Route eligibility

- the route family is approved in the public route inventory
- the route is Class A in the route ownership map
- the route belongs to the approved current phase
- the route has a clearly named implementation owner

## 7.2 Rendering and crawlability

- meaningful primary content is present in the server-rendered HTML
- the primary heading is visible without relying on delayed client fetches
- the main explanatory copy is present in rendered output
- core internal links are crawlable and use real link elements
- the route is not an empty app shell with post-load primary content

## 7.3 Metadata

- the title is unique and route-appropriate
- the description is unique and route-appropriate
- metadata matches the visible page promise
- metadata is generated in the route layer, not inside reusable components
- the route follows the approved metadata pattern for its route family

## 7.4 Canonical behavior

- the route has the correct canonical URL
- canonical output is stable and production-valid
- parameterized or temporary states do not create conflicting canonical behavior
- the route does not canonical to an unrelated page just to simplify implementation

## 7.5 Robots and indexation

- the route has the correct robots posture for an indexable public page
- the route is not accidentally blocked by a broader noindex rule
- preview or staging versions are protected from indexation
- non-indexable variants of the route do not leak into the crawlable surface

## 7.6 Structured data

- only route-approved schema types are used
- schema matches visible page content
- schema values are truthful and current
- schema is generated from the route layer or approved helpers
- no speculative or unsupported markup is included

## 7.7 Content quality

- the page clearly explains what it is for
- the page is specific enough to stand on its own
- the page contains real decision-support or trust context
- the page is not mostly boilerplate with token-swapped nouns
- the page uses the correct content template for its route family

## 7.8 Internal linking and continuity

- the route links to the right related public pages
- the route provides a clear next step into the product
- the route is not orphaned from the public information architecture
- the page fits the approved matching-first product model

## 7.9 Sitemap readiness

- the route should be included in the sitemap only if it passes this checklist
- the route's inclusion or exclusion behavior is known and intentional
- thin, draft, or pending variants cannot enter the sitemap by accident

## 7.10 AI discoverability quality

- the page answers a clear user need near the top
- the heading structure is specific and scannable
- the page explains who it is for
- the page contains visible context, proof, or explanation that a summary could rely on
- the language is specific and grounded, not generic filler
- the route does not rely on hidden content or speculative AI-targeted tricks

## 8. Route-Family Add-On Checks

These checks are applied in addition to the core checklist.

## 8.1 Home page

- the page clearly states what Mentor IB is and how it differs from a generic marketplace
- the first viewport establishes category, trust, and matching-first value
- the page provides a credible route into matching
- homepage schema and brand metadata are present and truthful

## 8.2 How it works page

- the page clearly explains the product flow from need to tutor to booking
- the page reduces uncertainty rather than adding marketing fluff
- the route is strong enough to answer process-intent queries directly

## 8.3 Trust and safety page

- the page explains verification, reporting, blocking, and trust standards clearly
- claims about safety or quality are supported by visible content
- the page is helpful enough for legitimacy-focused search intent

## 8.4 Support page

- the page has real standalone help value
- the page is organized by clear question or topic clusters
- answers are specific and not only login-dependent
- if `HelpPage` or `FAQPage` markup is used, the visible structure genuinely supports it

## 8.5 Become a tutor page

- the page clearly states who should apply and who should not
- the page explains standards and process with enough detail to stand alone
- the route serves tutor acquisition intent directly, not indirectly

## 8.6 Tutor profile pages

- the route passes the tutor quality gate before becoming indexable
- the profile contains meaningful tutor-specific content
- the page shows clear fit guidance, not just biography
- trust proof is visible and truthful
- public profile schema is supported by visible page content
- the route should not enter the sitemap until quality approval is complete

## 8.7 Subject pages

- the page has real tutor coverage behind it
- the page contains meaningful subject-specific guidance
- the page explains what support looks like in that subject
- the page is more useful than a generic subject keyword wrapper

## 8.8 Service pages

- the page speaks in student-language about the named problem or need
- the page explains what support for that need actually includes
- the page offers real value beyond a broad tutoring landing page

## 8.9 Subject-plus-service pages

- the route exists only for a curated combination with real value
- the page explains why this combination is distinct from the parent pages
- the page is materially more useful than either broader page on its own

## 9. Fail Conditions That Should Force Noindex

If any of these conditions are true, the route should not be indexable yet:

- placeholder title or description
- thin or incomplete visible content
- missing canonical or incorrect canonical
- incorrect robots behavior
- unsupported or misleading structured data
- low-specificity generic copy
- route not approved for the current phase
- route not approved for the public SEO surface
- tutor profile or landing page failing its quality gate

## 10. Class B And Class C Reminder

This checklist does not apply in full to:

- `/match`
- `/search`
- `/results`
- `/compare`
- `/book/*`
- `/messages`
- `/lessons`
- `/tutor/*`
- `/student/*`
- `/dashboard/*`

For those routes, the right acceptance bar is:

- functional metadata if needed
- correct noindex behavior
- exclusion from the sitemap where applicable

## 11. Ticket Integration Format

When this checklist is attached to a future route task, the task should state:

- route family
- route class
- owner
- current phase
- metadata source
- canonical rule
- robots rule
- schema helper path
- checklist result
- launch decision: index or keep noindex

## 12. Review Ownership

Before launch, the checklist should be reviewed by:

- route implementation owner
- architecture owner for shared-rule compliance
- product or content owner for route-purpose quality

Design review should be involved when visible information hierarchy or clarity is at risk.

## 13. Anti-Patterns To Avoid

Do not:

- treat passing metadata alone as enough for launch
- approve an indexable route that is still mostly placeholder content
- create separate AI SEO review steps outside this checklist
- let reusable components decide canonical, robots, or schema behavior
- launch phase 1.5 landing pages before the shared foundation is complete

## 14. Final Recommendation

Every Class A public route should pass one shared acceptance gate before it becomes indexable.

The correct model is:

- one checklist
- one launch decision
- one owner chain
- one combined SEO and AI discoverability standard
