# Mentor IB SEO Route Ownership Map v1

**Date:** 2026-04-08
**Status:** Standalone planning map for public-route SEO and AI discoverability ownership
**Scope:** route-family ownership, implementation responsibility, phase boundaries, and handoff rules

## 1. Why This Document Exists

This document turns the SEO implementation foundation into a concrete route-ownership map.

It exists to answer:

- which route families generate SEO work
- which route families only need functional metadata
- who owns the SEO contract for each route family
- where AI discoverability responsibility lives
- how future implementation tasks should inherit these boundaries

This is the ownership layer for future public-route SEO work.

## 2. What This Document Does Not Redefine

This document does not replace the approved architecture or public-page definitions.

It inherits from:

- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`
- `docs/architecture/metadata-matrix-v1.md`
- `docs/architecture/structured-data-map-v1.md`
- `docs/architecture/content-template-spec-v1.md`
- `docs/planning/seo-implementation-foundation-v1.md`

This document only maps:

- route families to owners
- route families to implementation boundaries
- route families to SEO task eligibility

## 3. Ownership Terms

To keep later tasks consistent, this document uses five ownership labels.

### 3.1 Architecture owner

Owns shared route rules, rendering boundaries, metadata infrastructure, robots, sitemap, and schema-helper boundaries.

### 3.2 Route implementation owner

Owns the specific route family in application code.

This owner wires the route into:

- page rendering
- metadata generation
- content assembly
- structured data helpers
- route-level done criteria

### 3.3 Product and content owner

Owns page purpose, public-route approval, quality gate policy, and visible copy direction.

### 3.4 Design owner

Owns visible information hierarchy, clarity, and search-facing usability of the page.

### 3.5 AI discoverability owner

This is not a separate owner.

For every public indexable route family, the AI discoverability owner is the same as the route implementation owner, using the same acceptance model as SEO.

## 4. Global Route Classes

Every route family must belong to one of these classes.

### 4.1 Class A: Public and indexable

These routes are part of the search and AI-discoverability surface.

They generate full SEO tasks.

### 4.2 Class B: Public but non-indexable

These routes are publicly reachable or shareable, but they are not search assets.

They can have functional metadata.

They do not generate SEO growth tasks.

### 4.3 Class C: Operational or authenticated

These routes exist for product use only.

They should not generate SEO tasks.

## 5. Global Ownership Rules

These rules apply across the whole product.

## 5.1 Shared infrastructure owner

The architecture owner is responsible for:

- route classification defaults
- Next.js metadata boundaries
- robots and sitemap implementation shape
- JSON-LD helper boundaries
- preview deployment noindex defaults

This work should be done once and inherited everywhere.

## 5.2 Route-family owner

Each public route family should have one route implementation owner.

That owner is responsible for:

- correct metadata usage
- correct canonical usage
- correct robots behavior
- correct structured data wiring
- route-level AI discoverability checks

## 5.3 No separate AI owner rule

There must not be a separate "AI SEO owner" for any route family.

If a route is Class A, the same route owner is responsible for:

- search discoverability
- AI discoverability
- visible content clarity
- truthful structured data

## 6. Route-Family Ownership Map

## 6.1 Shared SEO infrastructure

Route family:

- cross-route infrastructure

Class:

- shared foundation

Phase:

- before phase 1 public launch

Architecture owner:

- architecture and platform

Route implementation owner:

- platform or app-shell implementation owner

Product and content owner:

- product

Design owner:

- design systems and public-page UX

AI discoverability owner:

- same as route implementation owner

Scope includes:

- metadata generation boundaries
- robots defaults
- sitemap generation
- JSON-LD helper map
- preview noindex behavior

Task eligibility:

- yes, but only as one-time foundation work

## 6.2 Home page

Route family:

- `/`

Class:

- Class A: public and indexable

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- public routes owner

Product and content owner:

- product and brand content

Design owner:

- public-page design owner

AI discoverability owner:

- public routes owner

SEO task eligibility:

- yes

Required inherited contracts:

- home-page metadata pattern
- homepage schema wiring
- inclusion in sitemap
- AI discoverability checks for category clarity and trust

## 6.3 How it works page

Route family:

- `/how-it-works`

Class:

- Class A: public and indexable

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- public routes owner

Product and content owner:

- product and content

Design owner:

- public-page design owner

AI discoverability owner:

- public routes owner

SEO task eligibility:

- yes

Required inherited contracts:

- explanatory-page metadata pattern
- canonical self-reference
- breadcrumb support if used
- clear AI-discoverability answerability for process questions

## 6.4 Trust and safety page

Route family:

- `/trust-and-safety`

Class:

- Class A: public and indexable

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- public routes owner

Product and content owner:

- product, trust, and policy content owner

Design owner:

- public-page design owner

AI discoverability owner:

- public routes owner

SEO task eligibility:

- yes

Required inherited contracts:

- trust-page metadata pattern
- visible trust structure
- truthful schema choice
- strong answerability for legitimacy and safety intent

## 6.5 Support page

Route family:

- `/support`

Class:

- Class A: public and indexable, conditionally

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- public routes owner

Product and content owner:

- support content owner

Design owner:

- support-page design owner

AI discoverability owner:

- public routes owner

SEO task eligibility:

- yes, only if the page remains a real public help asset

Required inherited contracts:

- support-page metadata pattern
- help-page structured data if applicable
- clear topic navigation
- answerability checks for common questions

## 6.6 Become a tutor page

Route family:

- `/become-a-tutor`

Class:

- Class A: public and indexable

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- public routes owner

Product and content owner:

- tutor acquisition owner

Design owner:

- public-page design owner

AI discoverability owner:

- public routes owner

SEO task eligibility:

- yes

Required inherited contracts:

- recruitment-page metadata pattern
- public tutor-acquisition content template
- inclusion in sitemap
- clear AI-discoverability answerability for tutor acquisition intent

## 6.7 Tutor profile pages

Route family:

- `/tutors/[slug]`

Class:

- Class A: public and indexable only after quality gate approval

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- tutor public-profile owner

Product and content owner:

- tutor marketplace quality owner

Design owner:

- public-profile design owner

AI discoverability owner:

- tutor public-profile owner

SEO task eligibility:

- yes

Required inherited contracts:

- tutor-profile metadata generator
- tutor-profile canonical rule
- tutor-profile schema helper usage
- tutor-profile sitemap inclusion only after approval
- AI discoverability checks for fit clarity, trust, and specificity

Additional ownership note:

- the tutor operations team may own tutor data quality inputs, but it should not own the public SEO contract by default

## 6.8 Low-priority public utility pages

Route family:

- `/contact`
- `/privacy`
- `/terms`

Class:

- Class A or low-priority public utility, depending on route

Phase:

- phase 1 if present

Architecture owner:

- architecture

Route implementation owner:

- public routes owner

Product and content owner:

- policy or operations content owner

Design owner:

- public-page design owner

AI discoverability owner:

- public routes owner when indexable

SEO task eligibility:

- limited

Rule:

- these routes can inherit default metadata and indexation policies, but they should not attract major SEO expansion work

## 6.9 Match flow routes

Route family:

- `/match`
- `/match/*`

Class:

- Class B: public but non-indexable

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- student acquisition flow owner

Product and content owner:

- product

Design owner:

- student-flow design owner

AI discoverability owner:

- none as a separate stream

SEO task eligibility:

- no growth SEO tasks

Allowed work:

- functional metadata
- correct noindex behavior
- exclusion from sitemap

## 6.10 Search and results routes

Route family:

- `/search`
- `/results`

Class:

- Class B: public but non-indexable

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- student discovery owner

Product and content owner:

- product

Design owner:

- discovery UX owner

AI discoverability owner:

- none as a separate stream

SEO task eligibility:

- no growth SEO tasks

Allowed work:

- functional metadata
- correct noindex behavior
- prevention of crawlable parameter sprawl

## 6.11 Compare route

Route family:

- `/compare`

Class:

- Class B: public but non-indexable

Phase:

- phase 1.5

Architecture owner:

- architecture

Route implementation owner:

- student decision-flow owner

Product and content owner:

- product

Design owner:

- decision UX owner

AI discoverability owner:

- none as a separate stream

SEO task eligibility:

- no growth SEO tasks

Allowed work:

- functional metadata
- correct noindex behavior

## 6.12 Booking route

Route family:

- `/book/[context]`

Class:

- Class B or Class C depending on auth model, always non-indexable

Phase:

- phase 1

Architecture owner:

- architecture

Route implementation owner:

- booking owner

Product and content owner:

- product

Design owner:

- booking-flow design owner

AI discoverability owner:

- none as a separate stream

SEO task eligibility:

- no

Allowed work:

- functional metadata
- correct noindex behavior

## 6.13 Messages, lessons, and tutor operations

Route family:

- `/messages`
- `/lessons`
- `/tutor/*`
- `/student/*`
- `/dashboard/*`

Class:

- Class C: operational or authenticated

Phase:

- phase 1 and later

Architecture owner:

- architecture

Route implementation owner:

- domain-specific feature owners

Product and content owner:

- product

Design owner:

- workflow design owners

AI discoverability owner:

- none

SEO task eligibility:

- no

Allowed work:

- only functional metadata where needed

## 6.14 Tutor application steps

Route family:

- `/become-a-tutor/apply`
- `/become-a-tutor/apply/*`

Class:

- public explainer route is Class A
- application steps are Class B or C and non-indexable

Phase:

- phase 2 or when implemented

Architecture owner:

- architecture

Route implementation owner:

- tutor application owner

Product and content owner:

- tutor acquisition owner

Design owner:

- tutor application UX owner

AI discoverability owner:

- public explainer route follows public routes owner
- application steps have no separate AI stream

SEO task eligibility:

- only the explainer route can generate SEO growth tasks

## 6.15 Subject pages

Route family:

- `/subjects/[subject-slug]`

Class:

- Class A: public and indexable only after quality gate approval

Phase:

- phase 1.5

Architecture owner:

- architecture

Route implementation owner:

- public discovery landing-pages owner

Product and content owner:

- subject-content owner

Design owner:

- discovery landing-pages design owner

AI discoverability owner:

- public discovery landing-pages owner

SEO task eligibility:

- yes, after phase 1 foundations are complete

Required inherited contracts:

- subject-page metadata pattern
- subject-page schema usage
- subject-page content template
- sitemap inclusion only after quality approval
- AI discoverability checks for subject-specific usefulness

## 6.16 Service pages

Route family:

- `/services/[need-slug]`

Class:

- Class A: public and indexable only after quality gate approval

Phase:

- phase 1.5

Architecture owner:

- architecture

Route implementation owner:

- public discovery landing-pages owner

Product and content owner:

- service-content owner

Design owner:

- discovery landing-pages design owner

AI discoverability owner:

- public discovery landing-pages owner

SEO task eligibility:

- yes, after phase 1 foundations are complete

Required inherited contracts:

- service-page metadata pattern
- service-page schema usage
- service-page content template
- sitemap inclusion only after quality approval
- AI discoverability checks for problem-led specificity

## 6.17 Subject-plus-service pages

Route family:

- `/subjects/[subject-slug]/[need-slug]`

Class:

- Class A: public and indexable only for curated combinations

Phase:

- phase 1.5

Architecture owner:

- architecture

Route implementation owner:

- public discovery landing-pages owner

Product and content owner:

- subject-service content owner

Design owner:

- discovery landing-pages design owner

AI discoverability owner:

- public discovery landing-pages owner

SEO task eligibility:

- yes, only for curated combinations

Required inherited contracts:

- combination-page metadata pattern
- combination-page schema usage
- combination-page content template
- strict quality gate before sitemap inclusion
- AI discoverability checks for distinct value beyond parent pages

## 7. Task Creation Rules By Route Class

## 7.1 Class A routes

These routes may generate:

- SEO foundation tasks if the shared system is missing
- route-family implementation tasks
- content quality tasks
- metadata refinement tasks
- structured-data wiring tasks
- AI discoverability quality tasks, but only inside the same route task stream

## 7.2 Class B routes

These routes may generate only:

- functional metadata tasks
- noindex and canonical correctness tasks
- crawl-control tasks

They must not generate:

- content expansion tasks for search growth
- AI discoverability optimization tasks

## 7.3 Class C routes

These routes should not generate SEO tasks.

They may only receive:

- functional metadata fixes if needed
- technical noindex protections if needed

## 8. Handoff Rules For Future Tasks

When a future route task is created, it must inherit this map.

The task should explicitly declare:

- the route family from this document
- the route class from this document
- the implementation owner from this document
- whether the task is phase 1 or phase 1.5
- which SEO source docs it inherits from

If a route task cannot map itself cleanly into this ownership model, it should be reconsidered before entering the backlog.

## 9. Anti-Patterns To Avoid

Do not:

- create separate SEO and AI SEO owners for the same route
- let operational routes generate search-growth work
- let tutor operations teams define public tutor-profile SEO behavior by default
- create content tasks for subject or service pages before the route family is approved for phase 1.5
- attach metadata or schema ownership to reusable UI components

## 10. Final Recommendation

Mentor IB should manage discoverability through route-family ownership, not through scattered page-by-page improvisation.

The practical rule is:

- Class A routes own full SEO and AI discoverability work
- Class B routes own only functional metadata and noindex correctness
- Class C routes own no SEO growth work
- AI discoverability always follows the same owner as the public route SEO contract
