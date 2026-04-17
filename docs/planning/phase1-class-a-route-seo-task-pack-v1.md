# Mentor IB Phase 1 Class A Route SEO Task Pack v1

**Date:** 2026-04-08
**Status:** Standalone implementation-facing route task pack for phase 1 Class A public routes
**Scope:** route-level SEO and AI discoverability tasks for `/`, `/how-it-works`, `/trust-and-safety`, `/support`, `/become-a-tutor`, and `/tutors/[slug]`

## 1. Why This Document Exists

This document attaches the shared public-route SEO acceptance checklist to the approved phase 1 Class A public routes.

It exists to answer:

- what the actual route-level SEO tasks are for phase 1
- who owns each task
- what each route must inherit from the shared SEO foundation
- what must be true before each route can launch as indexable

This document is the first route-level application of the shared SEO planning system.

## 2. What This Document Does Not Redefine

This document does not replace the approved SEO architecture, ownership map, or acceptance checklist.

It inherits from:

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/content-template-spec-v1.md`
- `docs/planning/seo-implementation-foundation-v1.md`
- `docs/planning/seo-route-ownership-map-v1.md`
- `docs/planning/seo-foundation-task-pack-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`

This document only defines the concrete phase 1 route tasks that inherit those rules.

## 3. Core Rule

Every route in this pack is a Class A public route.

That means each route:

- can generate full SEO work
- must pass the shared public-route acceptance checklist before becoming indexable
- carries AI discoverability responsibility through the same route owner and the same acceptance model

There must not be separate route tickets for "SEO" and "AI SEO" on these routes.

## 4. Pack Preconditions

These route tasks assume the shared SEO foundations are in place or actively being completed:

- route classification
- metadata ownership boundaries
- canonical and robots policy
- sitemap infrastructure
- JSON-LD helper boundaries
- public-route SEO acceptance checklist

If those shared foundations are missing, these route tasks should stay provisional.

## 5. Recommended Route Sequence

The recommended order is:

1. `/`
2. `/how-it-works`
3. `/trust-and-safety`
4. `/become-a-tutor`
5. `/support`
6. `/tutors/[slug]`

Reason:

- the first four define the highest-confidence public foundation
- `/support` is conditional on real standalone help value
- `/tutors/[slug]` depends on the strongest quality-gate logic and route-family mechanics

## 6. Shared Done Rule For Every Task

Every task in this pack must attach:

- the core checklist in `public-route-seo-acceptance-checklist-v1.md`
- the correct route-family add-on checks from that same document

If the checklist cannot pass, the route should remain non-indexable until fixed.

## 7. Route Tasks

## 7.1 P1-SEO-R01 Home route

Route family:

- `/`

Class:

- Class A

Phase:

- phase 1

Primary owners:

- public routes owner
- architecture

Supporting owners:

- product and brand content
- public-page design owner

Depends on:

- shared SEO foundation tasks
- homepage route implementation

Inherits from:

- home-page metadata pattern
- homepage schema wiring
- sitemap inclusion rule
- home-page add-on checks in the public-route checklist

Implementation scope:

- route-level metadata and canonical behavior
- homepage schema output
- crawlable internal links to key public pages
- visible matching-first category explanation
- visible trust and next-step clarity

Checklist attachment:

- core checklist sections 7.1 to 7.10
- route-family add-on 8.1

Done when:

- the route passes the full shared checklist
- the homepage clearly distinguishes Mentor IB from a generic tutor marketplace
- the route provides a credible path into matching
- metadata, canonical, robots, schema, and sitemap behavior are correct

Launch rule:

- index only after full checklist pass

## 7.2 P1-SEO-R02 How it works route

Route family:

- `/how-it-works`

Class:

- Class A

Phase:

- phase 1

Primary owners:

- public routes owner
- architecture

Supporting owners:

- product and content
- public-page design owner

Depends on:

- shared SEO foundation tasks
- public informational page implementation

Inherits from:

- explanatory-page metadata pattern
- canonical self-reference rule
- breadcrumb support if used
- process-intent add-on checks in the public-route checklist

Implementation scope:

- route-level metadata and canonical behavior
- visible explanation of the matching and booking process
- crawlable links to matching, trust, and tutor-evaluation entry points
- informational-page schema if used

Checklist attachment:

- core checklist sections 7.1 to 7.10
- route-family add-on 8.2

Done when:

- the route answers process-intent questions directly
- the route reduces uncertainty instead of repeating generic marketing copy
- metadata, canonical, robots, schema, and sitemap behavior are correct

Launch rule:

- index only after full checklist pass

## 7.3 P1-SEO-R03 Trust and safety route

Route family:

- `/trust-and-safety`

Class:

- Class A

Phase:

- phase 1

Primary owners:

- public routes owner
- architecture

Supporting owners:

- product, trust, and policy content owner
- public-page design owner

Depends on:

- shared SEO foundation tasks
- trust-page implementation

Inherits from:

- trust-page metadata pattern
- truthful schema rule
- legitimacy-intent add-on checks in the public-route checklist

Implementation scope:

- route-level metadata and canonical behavior
- visible explanation of verification, reporting, blocking, and standards
- trust-focused internal links to support, how it works, and product entry points
- truthful informational schema if used

Checklist attachment:

- core checklist sections 7.1 to 7.10
- route-family add-on 8.3

Done when:

- the route is genuinely useful for safety and legitimacy intent
- trust claims are supported by visible content
- metadata, canonical, robots, schema, and sitemap behavior are correct

Launch rule:

- index only after full checklist pass

## 7.4 P1-SEO-R04 Support route

Route family:

- `/support`

Class:

- Class A, conditional

Phase:

- phase 1

Primary owners:

- public routes owner
- architecture

Supporting owners:

- support content owner
- support-page design owner

Depends on:

- shared SEO foundation tasks
- support-page implementation
- real standalone help content being available

Inherits from:

- support-page metadata pattern
- `HelpPage` or `FAQPage` rules only if visibly supported
- support add-on checks in the public-route checklist

Implementation scope:

- route-level metadata and canonical behavior
- support information architecture and topic structure
- help-page schema only if the visible page genuinely supports it
- crawlable links to relevant public routes and support escalation paths

Checklist attachment:

- core checklist sections 7.1 to 7.10
- route-family add-on 8.4

Done when:

- the page has real standalone help value
- the page is not thin, login-dependent, or filler-heavy
- metadata, canonical, robots, schema, and sitemap behavior are correct

Launch rule:

- index only if the page clears the support quality condition
- otherwise keep noindex until the help surface is strong enough

## 7.5 P1-SEO-R05 Become a tutor route

Route family:

- `/become-a-tutor`

Class:

- Class A

Phase:

- phase 1

Primary owners:

- public routes owner
- architecture

Supporting owners:

- tutor acquisition owner
- public-page design owner

Depends on:

- shared SEO foundation tasks
- tutor-acquisition public page implementation

Inherits from:

- recruitment-page metadata pattern
- tutor-acquisition content template
- sitemap inclusion rule
- tutor-acquisition add-on checks in the public-route checklist

Implementation scope:

- route-level metadata and canonical behavior
- clear tutor acquisition page structure
- truthful explanation of standards, fit, and process
- crawlable internal links to trust and support routes where appropriate

Checklist attachment:

- core checklist sections 7.1 to 7.10
- route-family add-on 8.5

Done when:

- the route clearly serves tutor acquisition intent
- the page explains standards and process with enough independent value
- metadata, canonical, robots, schema, and sitemap behavior are correct

Launch rule:

- index only after full checklist pass

## 7.6 P1-SEO-R06 Tutor profile route family

Route family:

- `/tutors/[slug]`

Class:

- Class A only after quality-gate approval

Phase:

- phase 1

Primary owners:

- tutor public-profile owner
- architecture

Supporting owners:

- tutor marketplace quality owner
- public-profile design owner

Depends on:

- shared SEO foundation tasks
- tutor public-profile route implementation
- tutor-profile quality gate implementation
- tutor-profile metadata generator
- tutor-profile schema helper path

Inherits from:

- tutor-profile metadata generator pattern
- tutor-profile canonical rule
- tutor-profile schema helper usage
- tutor-profile sitemap inclusion only after approval
- tutor-profile add-on checks in the public-route checklist

Implementation scope:

- route-family metadata generation
- route-family canonical behavior
- route-family schema output
- quality-gate logic for indexability and sitemap inclusion
- visible fit and trust-first profile structure
- crawlable links back into relevant public surfaces

Checklist attachment:

- core checklist sections 7.1 to 7.10
- route-family add-on 8.6

Done when:

- the route family supports correct metadata, canonical, robots, and schema output
- individual tutor profiles cannot become indexable until they pass the public quality gate
- sitemap inclusion is gated by approval and content quality
- public profiles are useful, specific, and fit-led rather than thin directory shells

Launch rule:

- the route family can ship
- individual tutor pages must remain noindex until quality-gate conditions are met

## 8. Dependency Summary

The safest sequencing pattern is:

- implement `/`, `/how-it-works`, `/trust-and-safety`, and `/become-a-tutor` first
- treat `/support` as indexable only when it is genuinely strong
- treat `/tutors/[slug]` as the heaviest route-family task because it includes quality-gate and sitemap gating logic

If work needs to parallelize:

- one team can own informational public pages
- one team can own tutor profile route-family mechanics
- both teams should inherit the same shared checklist and route ownership rules

## 9. What This Pack Prevents

This pack is meant to prevent:

- six separate route teams inventing different SEO standards
- homepage and informational pages launching with different quality bars
- support becoming indexable before it is actually useful
- tutor profile pages entering the index before public quality gates exist
- separate AI SEO route tickets that duplicate normal route acceptance work

## 10. Exit Criteria

This pack should be considered complete only if:

- all six route tasks have an explicit owner
- every route task references the shared public-route checklist
- every route task has a clear launch rule
- `/support` has an explicit conditional-index decision
- `/tutors/[slug]` has an explicit quality-gate and sitemap-gate rule

## 11. After This Pack

The next useful move after this pack is:

- convert each route task into implementation backlog items in the actual work tracker
- keep the route tasks tied to the shared acceptance checklist
- leave Class B and Class C routes out of the SEO growth backlog

## 12. Final Recommendation

Mentor IB should treat phase 1 public-route discoverability as a small, high-quality launch surface.

The right practical model is:

- one route task pack
- six phase 1 Class A route tasks
- one shared checklist
- one combined SEO and AI discoverability standard
