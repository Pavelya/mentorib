# Mentor IB SEO And AI Discoverability v1

**Date:** 2026-04-08
**Status:** Standalone technical SEO and discoverability recommendation
**Scope:** rendering policy, crawl and index rules, metadata, structured data, and AI-search principles

## 1. Why This Document Exists

This document defines the SEO and AI-discoverability policy for Mentor IB at the architecture level.

It exists now because discoverability decisions affect:

- public route strategy
- rendering choices
- metadata architecture
- structured data
- indexation policy
- content modeling

This is not a full content marketing plan.

It is the technical and product-policy layer that content and implementation should build on later.

## 2. Core Recommendation

Mentor IB should treat SEO and AI discoverability as one shared discipline, not as two unrelated workstreams.

The main recommendation is:

- build strong technical SEO into the product now
- structure public pages for clear entity understanding
- create people-first, trust-rich content
- avoid thin programmatic landing-page sprawl
- do not chase separate "AI SEO hacks"

Short version:

**Good SEO architecture is the foundation of AI discoverability.**

## 3. What "AI SEO" Means In Practice

For Mentor IB, "AI SEO" should not mean:

- a separate crawling stack
- special AI-only landing pages
- mass-generated answer pages
- speculative markup added just to target AI tools

The official Google guidance is clear:

- the same foundational SEO best practices still apply to AI features
- there are no additional technical requirements for AI Overviews or AI Mode
- there is no special schema.org markup required just for those features

That means the practical job is to make Mentor IB:

- crawlable
- indexable where appropriate
- textually clear
- trustworthy
- entity-rich
- snippet-eligible

## 4. Product Discoverability Model

Mentor IB has several distinct kinds of discoverability demand.

## 4.1 High-intent tutoring demand

Examples:

- "IB biology HL tutor"
- "IB math AA tutor online"
- "IB economics tutor"

These queries map best to:

- strong tutor directory architecture
- strong tutor profile pages
- strong subject pages

## 4.2 Problem-led demand

Examples:

- "help with TOK essay"
- "IB IA feedback tutor"
- "IB oral practice tutor"
- "last minute IB exam tutor"

These queries map best to:

- problem-specific landing pages
- subject plus need pages
- helpful editorial pages that connect naturally into matching

## 4.3 Trust and comparison demand

Examples:

- "best IB tutor platform"
- "IB tutor reviews"
- "is Mentor IB legit"

These queries map best to:

- clear trust pages
- how-it-works pages
- safety and quality explanation pages

## 4.4 Tutor acquisition demand

Examples:

- "become IB tutor online"
- "teach IB online"

These queries map best to:

- become-a-tutor public pages
- tutor standards pages
- application explainer pages

## 5. Crawl And Index Policy

Not every route should be indexable.

Mentor IB should separate:

- public pages intended for discovery
- operational or personalized pages intended for product use

## 5.1 Indexable public pages

The recommended indexable set is:

- home page
- how-it-works page
- trust and safety page
- support and FAQ pages that have standalone value
- become-a-tutor landing page
- approved tutor profile pages
- curated subject pages
- curated problem or service pages
- future editorial resource pages

## 5.2 Do not index these pages

The recommended non-indexable set is:

- auth and callback pages
- booking flow pages
- compare pages
- personalized match flow pages
- personalized results pages
- messages
- lessons
- tutor operational dashboard pages
- tutor application flow steps after the public explainer

## 5.3 Conditional page rule

Some page types should be indexable only if they clear a quality threshold.

That applies especially to:

- tutor profile pages
- subject or service landing pages

If the page is too thin, duplicated, or incomplete, it should not be indexable.

## 6. Recommended Public Page Inventory

## 6.1 Phase 1

The recommended public SEO set for phase 1 is:

- `/`
- `/tutors/[slug]`
- `/how-it-works`
- `/trust-and-safety`
- `/become-a-tutor`
- `/support`

## 6.2 Phase 1.5

The recommended SEO expansion after the MVP core is:

- `/subjects/[subject-slug]`
- `/services/[need-slug]`
- `/subjects/[subject-slug]/[need-slug]`

Examples:

- `/subjects/biology-hl`
- `/services/tok-essay-help`
- `/subjects/english-a-io/oral-practice`

## 6.3 Why this phased approach is recommended

It avoids launching a large number of weak landers before the team can ensure:

- useful unique copy
- real tutor coverage
- clear fit logic
- trustworthy metadata

## 7. Rendering Strategy

## 7.1 Core rule

All public SEO-targeted pages should render meaningful primary content on the server.

This aligns with both the approved architecture and Google's JavaScript SEO guidance.

## 7.2 Recommended rendering split

### Server-rendered or statically generated

Use server rendering or static generation for:

- home
- public subject pages
- public service pages
- tutor profiles
- trust pages
- editorial resources

### Client-enhanced only where needed

Use client-side interactivity only for:

- filters
- shortlists
- saved states
- matching interactions
- compare mechanics

### Rule

Important discoverable content must not depend on client-only hydration to exist.

## 7.3 Search-sensitive public route rule

Do not build public SEO pages as empty app shells that fetch primary content only after load.

The meaningful heading, copy, links, and structured data should already be present in the rendered HTML.

## 8. URL Strategy

## 8.1 Recommended principles

URLs should be:

- descriptive
- stable
- human-readable
- hyphenated
- low in unnecessary parameters

## 8.2 Recommended examples

- `/tutors/ivan-petrov`
- `/subjects/biology-hl`
- `/services/ia-feedback`
- `/subjects/math-aa-hl/exam-prep`

## 8.3 Parameter rule

Do not let filter or sorting parameters become the core SEO surface.

Search pages with many parameter combinations should not become the main indexable landing pages.

## 8.4 Canonical rule

Use one canonical URL per substantive page.

This matters especially for:

- tutor pages reachable from multiple contexts
- filtered directory pages
- sort variants
- subject or service pages with alternate query-string versions

## 9. Metadata Strategy

## 9.1 Core metadata rule

Every indexable public page should define:

- unique title
- unique meta description
- canonical URL
- robots directives where needed
- Open Graph fields

## 9.2 Next.js implementation rule

Use the App Router metadata APIs as the canonical system for metadata generation.

That means:

- static metadata where the page is stable
- `generateMetadata` where the metadata depends on fetched page data
- file-based metadata for robots, sitemap, icons, and share images where useful

## 9.3 Metadata anti-patterns

Avoid:

- duplicated titles across tutor pages
- generic descriptions reused at scale
- indexable pages with placeholder metadata
- titles driven only by template words with no real specificity

## 10. Structured Data Strategy

## 10.1 Core rule

Use structured data to clarify real page meaning, not to manufacture artificial search features.

## 10.2 Recommended types

The recommended core structured data set is:

- `Organization` on home and organizational info pages
- `BreadcrumbList` on hierarchical public pages
- `ProfilePage` for tutor profile pages where the page truly centers on one tutor
- `FAQPage` only where there is visible, page-specific FAQ content
- `Article` for future editorial resources

## 10.3 Tutor profile rule

Tutor profile pages should be eligible for `ProfilePage` style structured data only if:

- the page clearly centers on one tutor
- the tutor is truly part of the platform
- the visible content matches the markup

## 10.4 Structured data integrity rule

Structured data must match visible page content.

Do not mark up:

- fake reviews
- hidden information
- generic placeholders
- misleading fields that are not actually supported by the page

## 10.5 Next.js implementation rule

Use JSON-LD rendered from server components or page components.

Sanitize the payload before insertion.

## 11. Internal Linking Strategy

## 11.1 Core rule

Important discovery pages must be reachable through normal HTML links.

## 11.2 Required link types

The public site should expose crawlable links between:

- home and subject pages
- home and service pages
- subject pages and relevant tutor profiles
- service pages and relevant tutor profiles
- tutor profiles and related subjects or services
- trust pages and core conversion pages

## 11.3 Link anti-patterns

Avoid:

- button-only navigation for important discovery paths
- JS-only navigation without proper `href` links
- public pages that are only discoverable through internal app state

## 12. Robots, Indexation, And Preview Controls

## 12.1 Robots rule

Use `robots.txt` for broad crawl management, not as the main per-page indexation system.

Use page-level robots directives for:

- `noindex`
- snippet limits where needed
- non-public operational surfaces

## 12.2 AI feature control rule

Google's current guidance is that AI features in Search are controlled through the normal Search controls:

- crawl access
- snippet controls
- `noindex`

That means there is no separate AI-search technical control plane required for Mentor IB.

## 12.3 Practical policy

The default public rule should be:

- allow crawling for public pages
- allow snippet eligibility for pages we want discovered

The default product rule should be:

- noindex or authentication gating for personalized and operational pages

## 13. AI Discoverability Principles

## 13.1 Core rule

Treat AI discoverability as an outcome of:

- good crawlability
- strong snippet eligibility
- trustworthy content
- explicit entity structure
- useful public pages

## 13.2 What not to do

Do not build:

- mass AI-generated subject pages
- generic answer-farm articles
- pages written primarily to attract AI citations
- thin city plus subject plus tutor variants at scale

## 13.3 People-first content rule

The content should be created to help a real IB student or tutor, not simply to capture search impressions.

This matters even more if AI is used in the content workflow.

## 13.4 Who, how, and why rule

Where appropriate, the content system should make it clear:

- who created the content
- how it was created
- why it exists

That is especially important for:

- editorial guidance content
- AI-assisted educational pages
- trust-sensitive tutoring claims

## 13.5 No special AI file rule

Do not treat special machine-readable files or AI-only markup as a core requirement.

Google's current guidance explicitly says there are no additional technical requirements and no special structured data needed to appear in AI Overviews or AI Mode.

## 14. Content Quality Policy

## 14.1 Tutor pages

Tutor pages should not be thin profile shells.

They should contain:

- clear expertise
- fit statements
- subject coverage
- credibility signals
- availability context
- distinctive explanatory copy

## 14.2 Subject and service pages

Subject and service pages should answer:

- what the need is
- who it is for
- when support matters
- what kind of tutor fit helps
- what next action the user should take

## 14.3 Editorial rule

Future content should be selective and depth-first.

Do not produce many pages across many topics just because they have search volume.

## 15. Measurement Strategy

## 15.1 Core measurement tools

The default measurement stack should be:

- Google Search Console
- Google Analytics or equivalent product analytics

## 15.2 AI feature measurement rule

Google's guidance is that AI feature traffic is included in the overall `Web` search reporting in Search Console.

So the team should not wait for a separate "AI SEO dashboard" before measuring discoverability.

## 15.3 Metrics to watch

The most useful early metrics are:

- indexed page count
- clicks and impressions by page type
- CTR by page type
- branded versus non-branded growth
- conversions from public landing pages
- tutor profile landing conversion

## 16. Decisions To Lock Now

These decisions are mature enough to lock now:

- public SEO pages must be server-rendered
- personalized or operational pages are not part of the SEO surface
- results and compare pages should not be core indexable pages
- metadata must be generated through Next.js metadata APIs
- robots and sitemap should be generated through Next.js metadata files
- structured data should be real, visible, and conservative
- AI discoverability should be approached through strong SEO fundamentals, not separate hacks

## 17. Decisions To Defer Slightly

These should be discussed later, not blocked now:

- exact editorial calendar
- exact keyword map
- how broad the subject and service page library becomes
- whether multilingual SEO becomes important in phase 2
- whether a resource hub launches in phase 1.5 or phase 2

## 18. Anti-Patterns To Avoid

Do not:

- index auth, booking, dashboard, compare, or personalized match pages
- launch dozens of thin tutor or subject pages
- rely on client-only rendering for core public copy
- use structured data that does not match visible content
- mass-generate AI content without original value
- create pages primarily to manipulate search rankings

## 19. Recommended Next Deliverables

The main SEO-specific companion docs are:

1. `seo-page-inventory-v1.md`
2. `metadata-matrix-v1.md`
3. `structured-data-map-v1.md`
4. `content-template-spec-v1.md`

A Search Console setup and monitoring checklist can be added as a later operational companion.

## 20. Final Recommendation

Mentor IB should lock technical SEO now and treat AI discoverability as part of the same system.

The right approach is:

- strong public page architecture
- conservative indexation rules
- server-rendered discoverable content
- disciplined metadata and structured data
- people-first, trust-rich public content

This gives the product the best chance to perform in both classic search and AI-assisted search surfaces without turning discoverability into a separate speculative platform project.

## 21. Official Source Notes

This recommendation is informed by current official documentation for:

- Google Search Essentials and the SEO Starter Guide
- Google JavaScript SEO guidance
- Google AI features and generative AI content guidance
- Google robots, sitemap, canonical, link, and structured data guidance
- Next.js metadata, robots, sitemap, and JSON-LD guidance
