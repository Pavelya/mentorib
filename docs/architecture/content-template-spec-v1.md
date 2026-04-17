# Mentor IB Content Template Spec v1

**Date:** 2026-04-08
**Status:** Standalone public-page content template specification
**Scope:** page-section templates, content quality rules, internal-linking expectations, and CTA structure for public discovery pages

## 1. Why This Document Exists

This document defines how public SEO-facing pages should be structured at the content level.

It exists to make sure:

- public pages are genuinely useful on their own
- route families have a repeatable content shape
- AI-generated filler does not become the default writing style
- subject and service pages feel like purposeful product surfaces, not keyword wrappers

This is not a final copy deck.

It is the structural content spec for the main public page families.

## 2. Core Content Rule

Every public discovery page should answer a real user question and move the user toward a credible next step.

The page should not exist just because the route pattern allows it.

## 3. Shared Writing Principles

All public pages should be:

- clear
- concrete
- IB-specific
- people-first
- trust-rich
- non-generic

Avoid:

- fluffy academic cliches
- generic AI phrasing
- vague claims like "unlock your potential"
- copy that could belong to any tutoring marketplace

## 4. Shared Section Rules

Across all public page templates, the content should usually include:

- a clear page promise near the top
- one explanation of who the page is for
- one explanation of what kind of help is available
- one trust block
- one action path into matching, profile review, or tutor application
- one internal-link path to related public pages

## 5. Tutor Profile Template

Route:

- `/tutors/[slug]`

Primary intent:

- help a student or parent decide whether this tutor is a strong fit

Required sections:

### 5.1 Hero identity block

Must include:

- public tutor name
- primary IB subjects or help areas
- one concise fit statement
- one primary CTA

### 5.2 Why this tutor fits

Must explain:

- who the tutor is best for
- what kinds of IB pressure points they help with
- what style or strengths make them distinctive

### 5.3 Expertise and experience

Must include:

- real teaching or subject expertise
- visible evidence or context

### 5.4 Learning-support modes

Examples:

- IA feedback
- exam preparation
- essay support
- oral practice

This section should make the page problem-aware, not just subject-aware.

### 5.5 Teaching style or session approach

Must explain:

- what lessons feel like
- what kind of student tends to work well with this tutor

### 5.6 Trust proof

Examples:

- approved status
- verified experience
- visible reviews if real
- response reliability if real and governed

### 5.7 Practical details

May include:

- availability summary
- lesson format
- languages
- pricing if publicly shown

### 5.8 Related next steps

Must include at least one:

- book or request
- compare
- back to related subject or service page

Quality rule:

- at least half the page must be genuinely tutor-specific content, not reusable boilerplate

## 6. Subject Page Template

Route:

- `/subjects/[subject-slug]`

Primary intent:

- help a student understand what support looks like for one IB subject and choose a credible next path

Required sections:

### 6.1 Subject-focused hero

Must include:

- subject name
- a direct statement of what kind of help the page offers
- one primary CTA

### 6.2 Common pressure points in this subject

Examples:

- content difficulty
- exam technique
- IA structure
- oral preparation

This section should sound like student reality, not brochure language.

### 6.3 What good help looks like

Must explain:

- what a useful tutor actually helps with in this subject
- how Mentor IB approaches matching or tutor choice here

### 6.4 Tutor options or matching path

Must include either:

- a visible curated tutor list
- or a strong route into matching if the list is not shown

### 6.5 Fit guidance

Must help the user decide:

- what kind of tutor they may need
- whether they likely need broad subject help or a specific service page

### 6.6 Related service links

Examples:

- IA feedback
- exam prep
- oral practice

### 6.7 Trust block

Must reinforce:

- tutor quality
- product standards
- safe next step

Quality rule:

- the page must contain meaningful subject-specific content and not read like a token-swapped template

## 7. Service Page Template

Route:

- `/services/[need-slug]`

Primary intent:

- help a student with a clearly named IB problem find the right kind of support

Required sections:

### 7.1 Need-led hero

Must include:

- need name in student language
- concise explanation of the problem
- one primary CTA

### 7.2 Who this page is for

Must explain:

- what kind of student situation this page fits
- what this page is not for if necessary

### 7.3 What support actually includes

Examples:

- feedback process
- practice format
- planning support
- revision strategy

### 7.4 How matching works for this need

Must explain:

- what signals matter when choosing a tutor for this problem
- why not every tutor is equally suited

### 7.5 Tutor options or guided path

Must include either:

- a curated tutor list
- or a direct path into the guided match flow

### 7.6 Related subject links

Examples:

- biology HL
- economics HL
- English A

### 7.7 Trust and expectation-setting

Must explain:

- what Mentor IB can help with
- what it cannot honestly promise

Quality rule:

- the page must offer real explanation, not just repeat the same generic tutoring pitch

## 8. Subject-Plus-Service Template

Route:

- `/subjects/[subject-slug]/[need-slug]`

Primary intent:

- serve a high-intent user who needs precise help in a precise context

Required sections:

### 8.1 Specific hero promise

Must combine:

- subject
- need
- clear user situation

### 8.2 What makes this combination different

Must explain:

- why this need looks different in this subject than in general

### 8.3 What the right tutor fit looks like

Must explain:

- what expertise and style matter here

### 8.4 Curated options

Must include:

- visible curated tutors if the page is indexable

### 8.5 Related broader pages

Must link to:

- the parent subject page
- the parent service page

Quality rule:

- if the content is not materially more helpful than the parent pages, this route should not exist

## 9. Become A Tutor Template

Route:

- `/become-a-tutor`

Primary intent:

- help strong tutors decide whether Mentor IB is a good fit before applying

Required sections:

### 9.1 Tutor-facing hero

Must include:

- who Mentor IB is looking for
- one primary CTA

### 9.2 Why teach here

Must explain:

- value proposition for tutors

### 9.3 Standards and expectations

Must explain:

- who should apply
- what quality bar exists

### 9.4 Application process

Must explain:

- what happens before approval
- what information is required

### 9.5 FAQ or objections block

Must answer:

- practical concerns
- role expectations

### 9.6 Final CTA

Must include:

- apply now
- learn more if not ready

## 10. Support Page Template

Route:

- `/support`

Primary intent:

- reduce uncertainty and friction before or after signup

Required sections:

### 10.1 Topic navigation

Must include:

- clear entry points for students, parents, and tutors

### 10.2 Answer blocks

Each answer should:

- be concrete
- be scannable
- answer one real question

### 10.3 Escalation path

Must include:

- how to get more help if the answer is not enough

Quality rule:

- do not turn the support page into thin filler questions purely for SEO

## 11. Internal Linking Rules

Public templates should link intentionally.

Required patterns:

- tutor profiles link back to relevant subject or service pages where appropriate
- subject pages link to relevant service pages
- service pages link to relevant subject pages
- specific combination pages link to their broader parents
- trust or support pages link back into product entry points

Avoid:

- excessive in-copy link stuffing
- orphan public pages

## 12. CTA Rules

Every public page should have a clear next action.

Allowed primary CTAs:

- start matching
- explore tutors
- book with this tutor
- apply as a tutor
- get support

The CTA should match the page's intent and stage.

## 13. AI Discoverability Writing Rules

If a page is meant to be strong for AI-assisted search surfaces, it should:

- answer likely questions directly
- use clear headings
- explain who the content is for
- show what Mentor IB actually knows through the page content
- avoid vague keyword padding

A good test:

- if an LLM summarized the page, would the summary sound grounded and specific?

## 14. Anti-Patterns To Avoid

Do not:

- create pages with only a short intro and a list of tutor cards
- use nearly identical body copy across many subject pages
- write tutor profiles that sound machine-generated and interchangeable
- create subject-service pages without distinct value
- promise score outcomes or academic guarantees

## 15. Final Recommendation

Mentor IB's public pages should behave like guided decision pages, not marketplace filler.

The content system should therefore optimize for:

- specificity
- trust
- IB-context clarity
- useful page structure
- strong internal links into the matching journey
