# Mentor IB Metadata Matrix v1

**Date:** 2026-04-08
**Status:** Standalone metadata policy and page-type matrix
**Scope:** title rules, description rules, canonical logic, robots policy, and social metadata by route type

## 1. Why This Document Exists

This document defines how metadata should work across the public SEO surface.

It exists to make sure:

- every public page has clear, useful metadata
- titles and descriptions match the visible page promise
- canonical and robots rules stay consistent
- social sharing previews are strong and trustworthy
- implementation can map route types cleanly into Next.js metadata APIs

## 2. Core Metadata Rules

Every public page type should have:

- one unique title
- one unique meta description
- one canonical URL
- one defined robots policy
- one Open Graph treatment

The metadata must describe the actual visible page, not a hypothetical future version.

## 3. Global Standards

## 3.1 Brand format

Use this pattern by default:

- page-specific value first
- brand second

Example:

- `IB Biology HL Tutors for IA Feedback and Exam Prep | Mentor IB`

Avoid leading with the brand on most discovery pages.

## 3.2 Title rule

Titles should:

- be specific
- match user intent
- use natural language
- stay concise

Avoid:

- keyword stuffing
- repeated pipes
- boilerplate titles that differ only by one token

## 3.3 Description rule

Descriptions should:

- explain what the page helps with
- mention the user or learning context where helpful
- stay factual
- read well as a search snippet

Descriptions should not:

- overpromise results
- repeat the title
- include internal product jargon

## 3.4 Canonical rule

Every indexable page needs a self-referencing canonical unless there is an intentional canonical target.

Do not canonical multiple distinct useful pages into one generic parent just to simplify implementation.

## 3.5 Robots rule

Indexable public pages:

- `index, follow`

Non-indexable product or personalized pages:

- `noindex, nofollow` or `noindex, follow` depending on the route purpose

Preview deployments:

- noindex by default

## 3.6 Open Graph rule

Every public page should define:

- `og:title`
- `og:description`
- `og:url`
- `og:type`
- `og:image`

Tutor profiles and landing pages should use route-aware social images where practical.

## 3.7 Ownership rule

Metadata should be generated in the route layer through Next.js metadata APIs, not manually sprinkled through random components.

## 4. Page-Type Matrix

## 4.1 Home page

Route:

- `/`

Title pattern:

- `Find the Right IB Tutor for the Help You Actually Need | Mentor IB`

Description pattern:

- explain the matching-first value proposition, subject coverage, and confidence benefits

Canonical:

- self

Robots:

- `index, follow`

OG image:

- brand-wide homepage visual

Notes:

- this page should establish both category and product distinction

## 4.2 How it works page

Route:

- `/how-it-works`

Title pattern:

- `How Mentor IB Matching Works for Students and Parents | Mentor IB`

Description pattern:

- explain the steps from need definition to tutor selection and booking

Canonical:

- self

Robots:

- `index, follow`

OG image:

- product-process visual

## 4.3 Trust and safety page

Route:

- `/trust-and-safety`

Title pattern:

- `How Mentor IB Reviews Tutors, Safety, and Student Fit | Mentor IB`

Description pattern:

- explain screening, moderation, reporting, and trust signals

Canonical:

- self

Robots:

- `index, follow`

OG image:

- trust-focused brand visual

## 4.4 Support page

Route:

- `/support`

Title pattern:

- `Mentor IB Support and Common Questions | Mentor IB`

Description pattern:

- explain what support topics the page answers

Canonical:

- self

Robots:

- `index, follow`

OG image:

- default support visual

Conditional rule:

- if the page becomes thin or purely logged-in support, re-evaluate indexability

## 4.5 Become a tutor page

Route:

- `/become-a-tutor`

Title pattern:

- `Become an IB Tutor on Mentor IB | Standards, Fit, and Application`

Description pattern:

- explain who the platform is for, expectations, and how the application works

Canonical:

- self

Robots:

- `index, follow`

OG image:

- tutor-recruitment visual

## 4.6 Tutor profile page

Route:

- `/tutors/[slug]`

Title pattern:

- `[Tutor Name], IB [Primary Subject] Tutor for [Primary Need] | Mentor IB`

Fallback title pattern:

- `[Tutor Name], IB Tutor | Mentor IB`

Description pattern:

- summarize the tutor's expertise, supported learning needs, and strongest fit signal

Canonical:

- stable public tutor URL

Robots:

- `index, follow` only if the tutor profile passes the public quality gate
- otherwise `noindex, nofollow`

OG image:

- route-aware tutor card image with name, subject area, and one trust signal

Notes:

- do not put unverified superlatives in the title
- do not expose sensitive internal status in metadata

## 4.7 Subject page

Route:

- `/subjects/[subject-slug]`

Title pattern:

- `IB [Subject Name] Tutors for [Primary Outcome] | Mentor IB`

Description pattern:

- explain what kind of help students get for the subject and how the page helps them choose

Canonical:

- stable public subject URL

Robots:

- `index, follow` only if the page clears the subject quality gate

OG image:

- subject-led dynamic social image

Notes:

- avoid titles that differ only by tiny keyword variations

## 4.8 Service page

Route:

- `/services/[need-slug]`

Title pattern:

- `IB Tutors for [Need Name] | Mentor IB`

Examples:

- `IB Tutors for TOK Essay Help | Mentor IB`
- `IB Tutors for IA Feedback | Mentor IB`

Description pattern:

- explain the need in student language and what kind of support the page offers

Canonical:

- stable public service URL

Robots:

- `index, follow` only if the page clears the service quality gate

OG image:

- need-led dynamic social image

## 4.9 Subject-plus-service page

Route:

- `/subjects/[subject-slug]/[need-slug]`

Title pattern:

- `IB [Subject Name] Tutors for [Need Name] | Mentor IB`

Description pattern:

- explain the more precise learning need and how this page differs from the broader parent pages

Canonical:

- stable curated combination URL

Robots:

- `index, follow` only for curated combinations with unique value

OG image:

- combined subject-and-need social image

## 4.10 Non-indexable discovery workflow pages

Routes:

- `/match`
- `/search`
- `/results`
- `/compare`
- `/booking/*`

Title pattern:

- utility-oriented titles are acceptable

Description pattern:

- optional

Canonical:

- self if needed, but not SEO-critical

Robots:

- `noindex, nofollow`

OG image:

- optional or default

Notes:

- these pages are product tools, not SEO assets

## 4.11 Logged-in and operational pages

Routes:

- `/messages/*`
- `/lessons/*`
- `/student/*`
- `/tutor/*`
- `/dashboard/*`

Canonical:

- optional

Robots:

- `noindex, nofollow`

Notes:

- keep metadata functional, not optimized for search

## 4.12 Preview and staging deployments

Environment rule:

- all preview environments should be noindex

Notes:

- do not let test deployments become crawlable duplicates of production

## 5. Query Parameter Rules

Query parameters should not create unique SEO pages.

Examples:

- sorting
- filtering
- step state
- temporary campaign parameters

Rule:

- canonical to the clean base route unless there is an explicit reason not to

## 6. Dynamic OG Image Rules

Dynamic social images are recommended for:

- tutor profiles
- subject pages
- service pages
- subject-plus-service pages

The image content should stay factual.

Allowed inputs:

- tutor name
- subject
- need
- short trust signal that is already visible on the page

Avoid:

- fake badges
- unverifiable rankings
- claims that are not visible in the page content

## 7. Metadata QA Checklist

Before a page type launches, confirm:

- title is unique
- description is unique
- canonical resolves correctly
- robots policy matches the route purpose
- OG image exists
- page metadata matches visible content
- preview deployments are protected from indexation

## 8. Anti-Patterns To Avoid

Do not:

- reuse the same description across many public pages
- put keyword lists into titles
- canonical filtered product states into unrelated public pages
- index low-value utility routes
- include claims in metadata that the page itself does not support

## 9. Final Recommendation

Metadata should behave like a disciplined public interface, not an afterthought.

The best implementation model is:

- one route-type policy
- one metadata generator approach per route family
- one strict robots and canonical standard
- one factual social-preview system
