# Mentor IB SEO Foundation Task Pack v1

**Date:** 2026-04-08
**Status:** Standalone implementation-facing task pack for shared SEO and AI discoverability foundations
**Scope:** one-time foundation tasks, sequencing, dependencies, ownership, outputs, and exit criteria

## 1. Why This Document Exists

This document turns the approved SEO planning foundation into an actual implementation task pack.

It exists to answer:

- which shared SEO tasks should be built once before route-by-route work begins
- in what order those tasks should happen
- who owns each task
- what each task must produce
- when the foundation is strong enough for future public-route SEO work

This is not a strategy document.

This is the one-time shared SEO and AI discoverability work package for the app layer.

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

This document only defines the one-time implementation tasks that operationalize those decisions.

## 3. Core Recommendation

Mentor IB should complete the shared SEO foundation before creating multiple route-specific SEO tasks.

The practical rule is:

- first build shared SEO infrastructure once
- then attach SEO and AI discoverability acceptance to Class A public routes
- do not let route teams invent metadata, robots, sitemap, or schema behavior independently

## 4. Pack Usage Rule

This task pack should be treated as a prerequisite layer for future Class A public-route SEO tasks.

Until this pack is complete:

- phase 1 public routes may still be built
- but their SEO implementation should stay provisional
- phase 1.5 subject and service SEO work should not start

## 5. Task Pack Scope

This pack covers only shared foundations.

Included:

- route classification implementation
- metadata ownership boundaries
- canonical and robots policy implementation
- sitemap infrastructure
- JSON-LD helper boundaries
- public-route SEO acceptance integration
- discoverability measurement baseline

Not included:

- page-by-page copywriting
- keyword strategy
- phase 1.5 subject or service expansion
- growth experiments
- operational-route metadata cleanup beyond basic protections

## 6. Recommended Sequencing

The recommended order is:

1. SEO-F01 route classification implementation
2. SEO-F02 metadata ownership boundaries
3. SEO-F03 canonical and robots policy
4. SEO-F04 sitemap infrastructure
5. SEO-F05 JSON-LD helper layer
6. SEO-F06 public-route acceptance integration
7. SEO-F07 discoverability measurement baseline

This order matters because later tasks inherit assumptions from the earlier ones.

## 7. Task Pack

## 7.1 SEO-F01 Route classification implementation

Purpose:

- encode the route classes from the ownership map into the application-level implementation model

Primary owners:

- architecture
- platform or app-shell implementation owner

Supporting owners:

- product

Depends on:

- `seo-route-ownership-map-v1.md`

Outputs:

- one route classification source for Class A, Class B, and Class C route families
- one clear mapping from route families to public indexability behavior
- one implementation note for how route groups and layouts should inherit these classes

Done when:

- every known phase 1 and phase 1.5 route family maps to a route class
- Class A routes are explicitly identifiable in the app layer
- Class B and Class C routes are explicitly marked as non-indexable by default
- no major route family remains unclassified

AI discoverability note:

- this task prevents future AI SEO drift by ensuring only Class A routes can carry discoverability work

## 7.2 SEO-F02 Metadata ownership boundaries

Purpose:

- define how metadata is generated and owned in the Next.js app

Primary owners:

- architecture
- public routes implementation owner

Supporting owners:

- design
- product and content

Depends on:

- SEO-F01
- `metadata-matrix-v1.md`

Outputs:

- one metadata ownership rule by route family
- one convention for static metadata versus `generateMetadata`
- one shared metadata helper boundary if needed
- one rule for where default metadata lives versus route-specific metadata

Done when:

- each Class A route family has a defined metadata generation approach
- Class B and Class C routes have a defined functional metadata posture
- metadata is owned in the route layer, not inside reusable UI components
- no route family needs to invent metadata behavior ad hoc

AI discoverability note:

- good AI discoverability depends on correct titles, descriptions, canonicals, and route-level clarity, so this is not SEO-only work

## 7.3 SEO-F03 Canonical and robots policy implementation

Purpose:

- turn the approved canonical and indexation rules into enforceable app behavior

Primary owners:

- architecture
- platform or app-shell implementation owner

Supporting owners:

- public routes implementation owner

Depends on:

- SEO-F01
- SEO-F02

Outputs:

- one canonical behavior model for Class A public routes
- one noindex default model for Class B and Class C routes
- one preview-environment noindex policy
- one rule for query-parameter handling on search-sensitive routes

Done when:

- Class A routes have a clear canonical strategy
- Class B and Class C routes default to non-indexable behavior
- preview deployments cannot accidentally become indexable
- query-state routes cannot create crawlable variant sprawl

AI discoverability note:

- canonical discipline and correct noindex behavior reduce low-quality or misleading surface area for both search engines and AI systems

## 7.4 SEO-F04 Sitemap infrastructure

Purpose:

- implement the shared sitemap system for approved public routes

Primary owners:

- architecture
- platform or app-shell implementation owner

Supporting owners:

- public routes owner
- product

Depends on:

- SEO-F01
- SEO-F03
- `seo-page-inventory-v1.md`

Outputs:

- one main sitemap entry point
- one inclusion rule for approved Class A routes
- one exclusion rule for Class B, Class C, thin, draft, or unapproved public pages
- one later-extension rule for segmented sitemaps if volume grows

Done when:

- the sitemap includes only approved indexable route families
- non-indexable route families are excluded by rule, not by manual memory
- tutor profiles enter the sitemap only after quality approval
- phase 1.5 landing pages cannot accidentally appear before approval

AI discoverability note:

- the sitemap is not a special AI feature, but it helps define the authoritative public surface that AI systems may later consume indirectly

## 7.5 SEO-F05 JSON-LD helper layer

Purpose:

- define and implement the shared structured-data helper boundaries for public routes

Primary owners:

- architecture
- public routes implementation owner

Supporting owners:

- product and content

Depends on:

- SEO-F01
- SEO-F02
- `structured-data-map-v1.md`

Outputs:

- one helper or helper set for route-approved schema types
- one input contract for each schema helper
- one rule for where JSON-LD is invoked in the route layer
- one prohibition against schema logic inside reusable UI components

Done when:

- home, informational pages, and tutor profiles have a clear schema-helper path
- schema helpers accept only truthful, visible-content-backed inputs
- route teams do not need to hand-roll JSON-LD per page from scratch
- unsupported schema types cannot creep in casually

AI discoverability note:

- truthful structured data supports entity clarity, which helps both search and AI summaries

## 7.6 SEO-F06 Public-route acceptance integration

Purpose:

- integrate SEO and AI discoverability checks into the definition of done for Class A public routes

Primary owners:

- product
- architecture

Supporting owners:

- design
- public routes implementation owner

Depends on:

- SEO-F01
- SEO-F02
- SEO-F03
- SEO-F04
- SEO-F05

Outputs:

- one reusable public-route SEO acceptance checklist
- one rule that Class A routes must satisfy this checklist before launch
- one rule that Class B and Class C routes only need functional metadata and noindex correctness

Done when:

- the team has one reusable checklist for Class A routes
- acceptance criteria clearly include AI discoverability checks without creating a separate AI task stream
- future route tickets can reference one shared done-check instead of inventing their own

AI discoverability note:

- this is where AI discoverability becomes operationally attached to normal route acceptance, not treated as a parallel track

## 7.7 SEO-F07 Discoverability measurement baseline

Purpose:

- establish the minimal measurement and validation setup for the public discoverability surface

Primary owners:

- architecture
- growth or analytics owner

Supporting owners:

- product

Depends on:

- SEO-F03
- SEO-F04

Outputs:

- one Search Console setup and ownership plan
- one sitemap submission plan
- one preview-indexation verification step
- one metadata and schema QA spot-check rule
- one baseline reporting view for public-route discoverability health

Done when:

- production has a clear verification path in Search Console
- the sitemap can be submitted and checked
- preview noindex behavior is validated
- the team has a repeatable way to spot-check metadata, robots, canonical, and JSON-LD output

AI discoverability note:

- this task does not create a fake AI dashboard
- it creates the baseline observability needed to judge whether public discoverability work is behaving well

## 8. Task Dependencies Summary

The critical dependency chain is:

- SEO-F01 -> SEO-F02 -> SEO-F03 -> SEO-F04
- SEO-F02 -> SEO-F05
- SEO-F01 to SEO-F05 -> SEO-F06
- SEO-F03 and SEO-F04 -> SEO-F07

If the team needs to parallelize, the safest pattern is:

- do SEO-F01 first
- then do SEO-F02 and SEO-F03 close together
- then do SEO-F04 and SEO-F05
- then do SEO-F06 and SEO-F07

## 9. What Future Route Teams Should Inherit

Once this pack is complete, any future Class A route task should inherit:

- its route class
- its metadata boundary
- its canonical and robots rule
- its sitemap rule
- its schema helper path
- its SEO and AI discoverability done-check

That means future route teams should not need to reopen these questions.

## 10. What This Pack Prevents

This pack is meant to prevent:

- metadata rules being invented inside components
- route-by-route robots improvisation
- sitemap inclusion based on memory instead of policy
- hand-rolled JSON-LD on every public page
- separate AI SEO tickets that duplicate SEO quality work
- phase 1.5 landing-page growth starting before the foundation is stable

## 11. Pack Exit Criteria

This task pack should be considered complete only if:

- all seven tasks are complete
- the shared rules are documented and usable by route teams
- Class A, Class B, and Class C route behavior is enforceable
- AI discoverability checks are integrated into normal public-route acceptance
- the team can begin Class A route implementation without reopening foundation questions

## 12. After This Pack

Once this task pack is complete, the next useful child artifact is:

- `public-route-seo-acceptance-checklist-v1.md`

After that, the next useful work is:

- attaching the checklist to the phase 1 Class A route tasks
- leaving Class B and Class C routes on functional metadata and noindex protection only

The acceptance checklist now exists and should be used as the reusable done-check for Class A routes.
The phase 1 Class A route SEO task pack now exists and should be used as the first route-level application of that checklist.

## 13. Final Recommendation

Mentor IB should build its discoverability foundation once, centrally, and in the route layer.

The correct model is:

- shared foundations first
- public-route inheritance second
- no separate AI SEO stream
- no component-level SEO ownership
