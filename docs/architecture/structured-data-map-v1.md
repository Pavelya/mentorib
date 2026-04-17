# Mentor IB Structured Data Map v1

**Date:** 2026-04-08
**Status:** Standalone structured data policy and route-type mapping
**Scope:** JSON-LD types, route-specific schema use, visibility requirements, and validation rules

## 1. Why This Document Exists

This document defines how structured data should be used across Mentor IB's public pages.

It exists to make sure:

- schema use stays conservative and truthful
- structured data reflects visible content
- route types use the right schema families
- engineering has a clear route-to-schema map

This is not a license to add markup everywhere.

## 2. Core Rule

Structured data should be:

- accurate
- conservative
- visible-content aligned
- route-aware

If the page does not clearly support a schema type with visible content, Mentor IB should not emit that schema type.

## 3. Implementation Rule

JSON-LD should be generated server-side in the page or layout layer.

The structured data should:

- use stable production URLs
- use the canonical URL for the page
- avoid placeholder or draft values
- be validated before launch

## 4. Global Schema Set

Across the public site, the default reusable schema types are:

- `Organization`
- `WebSite`
- `WebPage`
- `BreadcrumbList`
- `ProfilePage`
- `Person`
- `ItemList`
- `HelpPage`

Optional schema types may be used later only when clearly supported by the page content.

## 5. Route-Type Map

## 5.1 Home page

Route:

- `/`

Recommended schema:

- `WebSite`
- `Organization`

Why:

- the page establishes the platform as a site entity and company or brand entity

Notes:

- include core brand identity, URL, logo, and social links only if they are real and stable

## 5.2 How it works page

Route:

- `/how-it-works`

Recommended schema:

- `WebPage`
- `BreadcrumbList`

Why:

- the page is explanatory and navigational

## 5.3 Trust and safety page

Route:

- `/trust-and-safety`

Recommended schema:

- `WebPage`
- `BreadcrumbList`

Optional:

- `FAQPage` only if the page contains visible FAQ-style question and answer content

Why:

- trust content is best represented as a normal page unless it clearly includes a visible FAQ block

## 5.4 Support page

Route:

- `/support`

Recommended schema:

- `HelpPage`
- `BreadcrumbList`

Optional:

- `FAQPage` only for visible and well-formed FAQ sections

Why:

- support content is a help surface, not a generic marketing page

## 5.5 Become a tutor page

Route:

- `/become-a-tutor`

Recommended schema:

- `WebPage`
- `BreadcrumbList`

Why:

- the page is a public explainer and acquisition page

## 5.6 Tutor profile page

Route:

- `/tutors/[slug]`

Recommended schema:

- `ProfilePage`
- `Person`
- `BreadcrumbList`

Optional:

- `AggregateRating` only if ratings are real, visible, and governed properly
- `ItemList` only if the page visibly lists secondary items worth marking up

Why:

- the route represents a real public profile

Required visible support:

- public tutor name
- public-facing description
- image if present in markup
- supported subjects or learning areas

Recommended `Person` fields:

- `name`
- `description`
- `image`
- `url`
- `worksFor` if the relationship is visible and accurately represented
- `knowsAbout` for real subject expertise areas reflected on the page

Avoid:

- hidden private tutor details
- unverifiable badges
- rating markup when there is no visible rating block

## 5.7 Subject page

Route:

- `/subjects/[subject-slug]`

Recommended schema:

- `WebPage`
- `BreadcrumbList`
- `ItemList` for visibly listed tutors or featured resources

Why:

- the page is a subject-specific landing page with a visible list of choices

Rule:

- use `ItemList` only if the listed tutors or items are visibly present on the page and in the same order

## 5.8 Service page

Route:

- `/services/[need-slug]`

Recommended schema:

- `WebPage`
- `BreadcrumbList`
- `ItemList` if the page visibly lists tutors or recommended options

Why:

- the page is a need-led landing page, not a profile page

## 5.9 Subject-plus-service page

Route:

- `/subjects/[subject-slug]/[need-slug]`

Recommended schema:

- `WebPage`
- `BreadcrumbList`
- `ItemList` if the page visibly lists tutors or curated options

Why:

- the page is a curated landing page with clearer intent than a broad category page

## 5.10 Contact page

Route:

- `/contact`

Recommended schema:

- `WebPage`
- `BreadcrumbList`

## 5.11 Legal pages

Routes:

- `/privacy`
- `/terms`

Recommended schema:

- `WebPage`

Notes:

- these are not priority schema surfaces

## 6. Schema Components By Route Family

## 6.1 BreadcrumbList rule

Use `BreadcrumbList` on public interior pages where breadcrumb navigation is visible or structurally clear.

Recommended route families:

- tutor profiles
- subject pages
- service pages
- subject-plus-service pages
- support pages
- trust pages
- become-a-tutor pages

## 6.2 ItemList rule

Use `ItemList` only when the page visibly presents a list of tutors or other items.

The list should:

- match the visible order
- link to real destination pages
- not represent hidden or personalized ranking

Do not use `ItemList` for:

- hidden recommendation logic
- personalized search results
- incomplete placeholder cards

## 6.3 FAQPage rule

Use `FAQPage` only when:

- the page has real question and answer content
- the content is visible to users without interaction tricks
- the content is genuinely helpful and maintained

Do not add FAQ schema to pages that merely contain short marketing snippets.

## 7. Deferred Or Optional Schema

These schema types are not part of the recommended initial set:

- `Article`
- `BlogPosting`
- `VideoObject`
- `Course`
- `Offer`
- `Review`
- `AggregateRating`

Reason:

- they require stronger content support or governance
- they increase the risk of inaccurate markup
- they are not needed to establish the initial search surface

They can be introduced later only with explicit justification.

## 8. Visibility And Truthfulness Rules

Before shipping schema on any page, confirm:

- the marked-up entity is clearly represented in visible content
- key fields match the page body
- URLs are stable
- images are real
- optional rating or review signals are genuinely supported

The governing principle is simple:

**If a human cannot verify the claim on the page, the schema should not claim it either.**

## 9. Validation And QA

Before launch, validate:

- syntax
- field completeness
- canonical URL alignment
- breadcrumb correctness
- route-type correctness

Recommended checks:

- Google's Rich Results Test where relevant
- Schema Markup Validator
- manual spot checks in rendered HTML

## 10. Anti-Patterns To Avoid

Do not:

- emit `Person` markup for anonymous or incomplete tutors
- emit ratings without visible ratings
- mark up hidden personalized results as `ItemList`
- add unsupported schema types just because they sound impressive
- let schema drift away from visible content over time

## 11. Final Recommendation

Mentor IB should use structured data as a conservative clarity layer.

The initial schema system should be:

- `WebSite` and `Organization` for the home page
- `WebPage` and `BreadcrumbList` for most public informational pages
- `ProfilePage` plus `Person` for real tutor profiles
- `ItemList` only where visible curated lists exist
- `HelpPage` for support surfaces
