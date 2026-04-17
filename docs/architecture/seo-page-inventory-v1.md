# Mentor IB SEO Page Inventory v1

**Date:** 2026-04-08
**Status:** Standalone public-page inventory and indexation policy
**Scope:** route inventory, page purpose, crawl and index rules, rendering mode, and quality thresholds

## 1. Why This Document Exists

This document turns the approved SEO strategy into a concrete public-page inventory.

It exists to answer:

- which routes should exist for search discovery
- which routes should be indexable
- which routes should stay operational and non-indexable
- what belongs in phase 1 versus phase 1.5
- what quality threshold a page must meet before it can enter the index

This is the route-level operating document for public discoverability.

## 2. Core Recommendation

Mentor IB should launch with a deliberately small, high-quality SEO surface.

The rule is:

- fewer public pages
- stronger page quality
- clearer entity structure
- stricter non-index policy for personalized product surfaces

The product should not try to win search by publishing a large volume of thin route variants.

## 3. Route Families

Mentor IB's routes fall into four families.

### 3.1 Foundational public pages

These explain the product, trust, support, and tutor acquisition model.

Examples:

- home
- how it works
- trust and safety
- support
- become a tutor

### 3.2 Public discovery pages

These are the routes with the highest search potential.

Examples:

- tutor profiles
- subject pages
- service pages
- subject-plus-service pages

### 3.3 Public but low-priority utility pages

These pages can exist publicly without being major acquisition targets.

Examples:

- legal pages
- contact page
- basic policy pages

They may be indexable, but they should not be treated as primary SEO assets.

### 3.4 Product and operational pages

These are product-use surfaces, not discovery surfaces.

Examples:

- auth
- matching flow
- results
- compare
- booking
- messages
- lessons
- tutor dashboards

These should not be indexable.

## 4. Phase 1 SEO Inventory

Phase 1 should stay intentionally narrow.

## 4.1 Required phase 1 public routes

### `/`

- purpose:
  establish category, trust, and the matching-first value proposition
- audience:
  students, parents, and tutors evaluating the platform
- indexation:
  index
- rendering:
  server-rendered or statically generated
- primary entity:
  organization and website

### `/how-it-works`

- purpose:
  explain how matching, tutor selection, booking, and lessons work
- audience:
  students and parents who need clarity before signing up
- indexation:
  index
- rendering:
  server-rendered or statically generated
- primary entity:
  explanatory product page

### `/trust-and-safety`

- purpose:
  explain verification, matching quality, reporting, blocking, and trust signals
- audience:
  parents and cautious buyers
- indexation:
  index
- rendering:
  server-rendered or statically generated
- primary entity:
  trust and policy page

### `/support`

- purpose:
  answer common questions and support confidence before signup
- audience:
  students, parents, and tutors
- indexation:
  index if the page has real standalone value
- rendering:
  server-rendered or statically generated
- primary entity:
  support or help page

### `/become-a-tutor`

- purpose:
  recruit qualified IB tutors and explain standards
- audience:
  prospective tutors
- indexation:
  index
- rendering:
  server-rendered or statically generated
- primary entity:
  tutor recruitment page

### `/tutors/[slug]`

- purpose:
  present one approved tutor as a real public entity with enough trust and fit context
- audience:
  students and parents evaluating a tutor
- indexation:
  index only if the page clears the tutor quality gate
- rendering:
  server-rendered or statically generated with revalidation
- primary entity:
  tutor profile

## 4.2 Recommended phase 1 public supporting routes

These can exist in phase 1, but they are not the primary SEO launch set.

### `/contact`

- purpose:
  provide a low-friction contact path
- indexation:
  index allowed
- SEO priority:
  low

### `/privacy`

- purpose:
  legal transparency
- indexation:
  index allowed
- SEO priority:
  very low

### `/terms`

- purpose:
  legal transparency
- indexation:
  index allowed
- SEO priority:
  very low

## 4.3 Phase 1 non-indexable routes

These routes may exist, but they are not part of the public search surface.

### Auth and session routes

- `/login`
- `/signup`
- `/auth/*`

Rule:

- noindex
- exclude from sitemap

### Match and discovery workflow routes

- `/match`
- `/match/*`
- `/search`
- `/results`
- `/compare`

Rule:

- noindex
- exclude from sitemap
- query-param and personalized states must not create crawlable variants

### Transaction and communication routes

- `/booking`
- `/booking/*`
- `/messages`
- `/messages/*`

Rule:

- noindex
- exclude from sitemap

### Operational account routes

- `/student/*`
- `/tutor/*`
- `/dashboard/*`
- `/lessons/*`
- `/schedule/*`

Rule:

- noindex
- exclude from sitemap

### Tutor application flow routes

- `/become-a-tutor/apply`
- `/become-a-tutor/apply/*`

Rule:

- the main explainer page may be indexable
- form steps and account-specific application states should be noindex

## 5. Phase 1.5 SEO Inventory

These pages should launch only after phase 1 quality is stable.

## 5.1 Subject pages

Pattern:

- `/subjects/[subject-slug]`

Examples:

- `/subjects/biology-hl`
- `/subjects/math-aa-hl`

Purpose:

- capture subject-level tutoring demand
- explain how support works for that subject
- surface tutors with real coverage

Indexation:

- index only if the page clears the subject-page quality gate

## 5.2 Service pages

Pattern:

- `/services/[need-slug]`

Examples:

- `/services/tok-essay-help`
- `/services/ia-feedback`
- `/services/oral-practice`

Purpose:

- capture problem-led tutoring demand
- explain the learning need in plain language
- connect the need to the matching model

Indexation:

- index only if the page clears the service-page quality gate

## 5.3 Subject-plus-service pages

Pattern:

- `/subjects/[subject-slug]/[need-slug]`

Examples:

- `/subjects/biology-hl/ia-feedback`
- `/subjects/english-a/oral-practice`

Purpose:

- capture high-intent combinations with clear real-world demand
- give more precise help than either a broad subject page or a broad service page

Indexation:

- index only for curated combinations
- do not generate every theoretical pair

## 5.4 Optional phase 1.5 public trust routes

Potential additions:

- `/become-a-tutor/standards`
- `/become-a-tutor/faq`
- `/online-ib-tutoring-faq`

Rule:

- only launch if the page has clear standalone value
- avoid creating support-like page sprawl

## 6. Quality Gates

No discovery page should be indexable by default just because the route exists.

## 6.1 Tutor profile quality gate

A tutor profile may enter the index only if all of the following are true:

- the tutor is approved for public listing
- the tutor has a stable public slug
- the page includes real name or approved public display name
- the page includes a real photo or approved visual identity
- the page includes a meaningful bio
- the page clearly lists supported IB subjects or services
- the page includes real trust proof visible on the page
- the page includes a clear next action
- the page is not mostly duplicate boilerplate

Recommended additional thresholds:

- at least one strong expertise block
- at least one real teaching-style or fit block
- enough body copy to be genuinely useful on its own

## 6.2 Subject page quality gate

A subject page may enter the index only if:

- the subject has real tutor coverage
- the page includes unique subject-specific copy
- the page explains what help looks like for that subject
- the page lists real tutor options or a matching path
- the page is not a thin variation of another subject page

## 6.3 Service page quality gate

A service page may enter the index only if:

- the service or need reflects real user demand
- the page explains the need clearly in student language
- the page includes unique, helpful copy
- the page has a credible route into matching or tutor evaluation
- the page is not a generic keyword wrapper

## 6.4 Subject-plus-service page quality gate

This is the strictest gate.

The page should be indexable only if:

- the combination has real search value
- the combination is supported by real tutors
- the copy is clearly more useful than the broader parent pages
- the page offers distinct examples, fit logic, or proof

If not, the combination should not exist as a public SEO page.

## 7. Sitemap Policy

The sitemap should include:

- approved foundational public pages
- approved public tutor profiles
- approved subject pages
- approved service pages
- approved subject-plus-service pages

The sitemap should not include:

- auth pages
- personalized flow pages
- booking or compare pages
- dashboard pages
- thin draft or pending public pages

Recommended implementation:

- one main sitemap entry point
- optional segmented sitemaps later for tutors and landing pages if volume grows

## 8. Ownership And Governance

Public page creation should not be ungoverned.

The operating rule is:

- product defines route families
- content and design define page quality expectations
- engineering enforces indexation and sitemap rules

No new indexable route family should launch without an explicit decision.

## 9. Anti-Patterns To Avoid

Do not:

- make every filter state crawlable
- expose search results as indexable SEO pages
- auto-generate every subject-service combination
- index tutor profiles before they are complete
- create multiple public routes that compete for the same intent with weak differentiation
- let preview or staging deployments become indexable

## 10. Final Recommendation

Mentor IB should treat its public search surface as a curated product, not as exhaust.

The best phase 1 launch set is:

- `/`
- `/how-it-works`
- `/trust-and-safety`
- `/support`
- `/become-a-tutor`
- `/tutors/[slug]`

Then, after quality and coverage are proven, expand carefully into:

- `/subjects/[subject-slug]`
- `/services/[need-slug]`
- `/subjects/[subject-slug]/[need-slug]`
