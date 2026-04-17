# Mentor IB Low-Fi Wireframe Spec

**Date:** 2026-04-07
**Status:** Low-fi content and layout specification
**Companion docs:**
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/foundations/ux-object-model.md`
- `docs/foundations/ia-map-two-sided.md`

## 1. Purpose

This document is not a visual design system. It is a low-fidelity wireframe specification.

It defines:

- the objective of each priority screen
- the required blocks
- the primary actions
- the shared components that should be reused
- the desktop/mobile intent

## 2. Screen Set

This first wireframe pack covers:

1. Home
2. Match flow
3. Results / Search
4. Tutor profile
5. Compare
6. Booking flow
7. Student lessons hub
8. Student messages
9. Tutor application
10. Tutor overview
11. Tutor lessons hub
12. Tutor students
13. Tutor schedule
14. Tutor earnings

## 3. Wireframe Spec

## 3.1 Home

### Objective

Move users into guided matching while proving IB specificity and trust.

### Primary user

Prospective student

### Required blocks

- top navigation
- hero with problem-led entry
- quick problem options
- "how matching works" block
- trust proof block
- featured-fit tutors or sample matches
- reassurance / trust and safety block
- tutor CTA section
- FAQ teaser
- footer

### Primary CTA

`Get matched`

### Secondary CTA

`Browse tutors`

### Shared components

- header
- problem chips
- trust proof block
- tutor summary card
- CTA buttons

### Mobile note

Problem options should appear early, before large supporting sections.

## 3.2 Match flow

### Objective

Turn a vague or urgent student need into a structured `LearningNeed`.

### Required steps

1. Problem type
2. Subject/component
3. Urgency and support style
4. Language/timezone
5. Results intro

### Required blocks

- progress indicator
- single-question focus area
- answer options
- guidance / reassurance side note
- summary of selected answers
- next / back controls

### Primary CTA

`Show my best fits`

### Shared components

- progress header
- selectable option cards
- summary strip
- primary/secondary button set

### Mobile note

One decision cluster per screen. Avoid dense multi-field stacks.

## 3.3 Results / Search

### Objective

Present a small set of strong options with visible fit rationale.

### Required blocks

- sticky context bar showing active need
- filter row
- sort control
- result count and explanation
- result list or 2-column layout
- save / compare controls
- empty state / no-fit fallback

### Result item anatomy

- tutor photo
- name and trust/proof cue
- best-for statement
- 2-3 fit reasons
- ratings and lesson proof
- languages / timezone overlap
- next availability
- price
- actions: view, save, compare, book

### Primary CTA

`View profile` or `Book`

### Shared components

- context bar
- match row
- filter pills
- save / compare toggle
- status/proof chips

### Desktop note

Prefer list or comparison-weighted layout over a dense 3-column card wall.

## 3.4 Tutor profile

### Objective

Help the student decide confidently, fast.

### Required blocks

- profile header with fit summary
- best-for scenarios
- why students choose this tutor
- teaching style
- trust proof and credentials
- reviews and outcomes
- availability snapshot
- booking module
- message/save actions
- detailed background

### Above-the-fold requirement

The first screen must answer:

- who is this tutor best for
- why they fit this need
- whether I can book confidently

### Shared components

- person summary
- fit proof block
- availability snapshot
- review cards
- booking module

## 3.5 Compare

### Objective

Reduce choice anxiety by supporting side-by-side evaluation.

### Required blocks

- active need summary
- compared tutor columns
- comparison rows
- decision CTA row

### Comparison rows

- best for
- subject/component fit
- teaching style
- language/timezone overlap
- availability
- reviews
- price
- trust proof

### Primary CTA

`Book with this tutor`

### Shared components

- compare table
- tutor summary header
- need summary bar

### Mobile note

Use stacked comparison cards with section-by-section toggles rather than a tiny horizontal table.

## 3.6 Booking flow

### Objective

Turn match confidence into a confirmed lesson request with minimal friction.

### Required steps

1. Confirm need / subject
2. Pick time
3. Optional note or goal
4. Review summary
5. Submitted state

### Required blocks

- lesson summary header
- timezone-aware schedule picker
- request context
- policy reminders
- primary CTA

### Shared components

- lesson summary
- schedule surface
- note field
- status / policy notice

## 3.7 Student lessons hub

### Objective

Give the student one place to manage lesson lifecycle and continuity.

### Required blocks

- page title and status tabs
- requests
- upcoming
- past
- cancelled
- lesson detail drawer or deep link

### Lesson item anatomy

- tutor
- subject/component
- status
- time
- price / trial
- quick action

### Shared components

- lesson tabs
- lesson card
- empty state

## 3.8 Student messages

### Objective

Keep message context tied to tutors and lessons.

### Required blocks

- thread list
- active thread
- thread header with tutor summary
- lesson context chip(s)
- message composer

### Shared components

- conversation shell
- person summary
- context chips

### Mobile note

Use the same conversation architecture as tutor mode.

## 3.9 Tutor application

### Objective

Help qualified tutors complete a strong application without overwhelm.

### Required stages

1. Eligibility / fit
2. Identity and photo
3. IB teaching credibility
4. Subjects and scenarios
5. Languages and timezone
6. Availability
7. Pricing and lesson setup
8. Credentials and links
9. Review and submit

### Required blocks

- progress tracker
- short helper guidance
- required vs recommended labels
- profile-quality hints
- save and continue

### Shared components

- progress header
- form fields
- schedule surface
- uploader
- inline guidance panel

## 3.10 Tutor overview

### Objective

Help the tutor prioritize today.

### Required blocks

- greeting and role status
- next lesson
- pending requests
- unread messages
- availability issues
- earnings snapshot
- profile health
- recent student momentum

### Primary CTA cluster

- accept request
- join next lesson
- open messages
- edit schedule

### Shared components

- lesson summary
- notification items
- metric tiles
- profile health panel

## 3.11 Tutor lessons hub

### Objective

Provide one operational place for request review and lesson management.

### Required blocks

- status tabs
- request list
- upcoming list
- past list
- cancelled list
- lesson detail

### Tutor lesson actions

- accept
- decline
- reschedule
- join
- mark complete
- add report

### Shared components

- same lesson card system as student mode
- same status tabs
- role-adapted action row

## 3.12 Tutor students

### Objective

Turn student management into a lightweight teaching CRM.

### Required blocks

- student roster
- search/filter
- stage markers
- next lesson
- lesson count
- progress/report cue

### Student detail

- overview
- lessons
- notes/reports
- messages
- files/links

### Shared components

- person summary
- lesson list
- conversation entry point
- report summary

## 3.13 Tutor schedule

### Objective

Let tutors manage true booking readiness, not just raw time slots.

### Required blocks

- recurring weekly hours
- timezone controls
- date-specific exceptions
- blackout dates
- notice and buffer settings
- booking preview

### Shared components

- schedule surface
- timezone selector
- availability notices
- preview module

### Critical requirement

The screen should show both:

- what the tutor is editing
- what the student will effectively see

## 3.14 Tutor earnings

### Objective

Show financial state and quality-linked operations in one understandable view.

### Required blocks

- payout status
- available / pending / paid summary
- transaction history
- issue states
- performance/quality context

### Shared components

- status banners
- metric tiles
- filterable history table/list

## 4. Shared Components To Reuse Across The First Wireframe Pack

- Header
- Footer
- Bottom nav
- Page title block
- Person summary
- Match row
- Lesson card
- Schedule surface
- Conversation shell
- Metric tile
- Status badge
- Filter bar
- Empty state
- Proof block

## 5. Wireframing Rules

### Rule 1

Stay structural. Do not make visual style decisions in these wireframes.

### Rule 2

Start each screen from its primary object.

### Rule 3

Prefer one canonical block reused often over many bespoke layouts.

### Rule 4

Keep tutor and student lesson, chat, and schedule structures visibly related.

### Rule 5

Use copy labels that reinforce the new positioning:

- `Get matched`
- `Best fits`
- `Why this tutor fits`
- `Requests and Lessons`
- `My students`

## 6. Suggested Production Order

If these are turned into actual wireframes next, use this order:

1. Match flow
2. Results / search
3. Tutor profile
4. Booking flow
5. Tutor overview
6. Tutor lessons
7. Tutor students
8. Tutor schedule
9. Home
10. Compare
11. Messages
12. Earnings
13. Tutor application

This order follows the most important object and service dependencies first.
