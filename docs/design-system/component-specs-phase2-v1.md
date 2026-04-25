# Mentor IB Shared Component Specs Phase 2 v1

**Date:** 2026-04-07
**Status:** Standalone component-spec document
**Scope:** Phase 2 shared and mode-adjacent components

## 1. Why This Document Exists

This document is intentionally self-contained.

It is the second wave of reusable component specs for Mentor IB and is written to stand on its own without requiring context from earlier drafts.

It should still make sense if copied on its own, though it is best paired with:

- `component-specs-core-v1.md`
- `design-system-foundations-v3.md`

> **Implementation note:** `docs/design-system/agent-ui-rules.md` is the operational companion for coding agents applying these specs in the repo. If it conflicts with this document, the component specs and final design-system spec win.

## 2. Product Assumptions

Mentor IB is:

- an IB-native tutoring product
- matching-first, not marketplace-first
- one ecosystem with two modes:
  - student guidance mode
  - tutor operating mode

The system should not split into separate student and tutor component libraries.

## 3. Shared System Assumptions

### Typography

- Primary sans: `IBM Plex Sans`
- Accent serif: `Instrument Serif`
- Utility mono: `IBM Plex Mono`

### Core visual roles

- page background uses warm paper tones
- primary text uses dark ink tones
- primary action uses forest tones
- accent emphasis uses clay tones
- merit and review cues use gold tones
- pending uses amber-warning
- success uses green-success
- destructive uses red-danger

### Layout and surface assumptions

- public/student mode is more spacious and guided
- tutor mode is denser and more operational
- both still use the same visual DNA
- avoid default SaaS card spam and generic marketplace grids

## 4. Shared State Language

These labels should remain consistent across the system:

- Pending
- Accepted
- Declined
- Cancelled
- Upcoming
- Completed
- Reviewed
- Available
- Blocked
- Unread
- Muted
- Connected
- Reconnecting
- Error

## 5. Reuse Rules

### Rule 1

If a component exists to support a shared object or shared workflow, it should start shared.

### Rule 2

Mode-specific wrappers are acceptable for:

- copy
- action sets
- density
- emphasis

They are not acceptable as an excuse to create a second design language.

### Rule 3

Phase 2 components extend the grammar established in phase 1 and support screen-level continuity.

This phase covers:

1. `ConversationShell`
2. `TrustProofBlock`
3. `CompareTable`
4. `MetricTile`
5. `ChecklistPanel`
6. `LessonDetail`

## 6. Component Spec Format

Each spec includes:

- purpose
- object
- use cases
- variants
- anatomy
- states
- interaction rules
- content rules
- role wrappers
- responsive behavior
- accessibility
- anti-patterns

---

## 7. `ConversationShell`

### Purpose

Provides one unified conversation architecture for student and tutor messaging.

It should make messages feel like part of the learning and lesson workflow, not like a detached messenger app.

### Primary object

`Conversation`

### Used in

- student messages
- tutor messages
- lesson-linked thread entry points
- student detail message tab
- future notification deep links

### Why it is phase 2

It sits on top of the phase-1 identity and lesson grammar:

- `PersonSummary`
- lesson context chips
- shared status language

### Variants

- `split_pane`
  - desktop thread list + active thread
- `mobile_stack`
  - list screen and thread screen
- `lesson_context`
  - thread header shows linked lesson information
- `empty`
  - no conversations yet
- `muted`
  - conversation is present but muted

### Anatomy

Required structure:

1. Thread list
2. Active thread header
3. Participant identity via shared person grammar
4. Context row
   - subject
   - lesson timing
   - urgency or next action where relevant
5. Message stream
6. Composer
7. Optional auxiliary actions
   - book
   - reschedule
   - open lesson detail

### States

- `empty`
- `loading`
- `active`
- `unread`
- `muted`
- `blocked`
- `reconnecting`
- `error`

### Interaction rules

- selecting a thread must preserve lesson context in the thread header when available
- mobile should open the active thread as a full-screen focused state
- empty states should suggest the most natural next action for the role
- do not overload the shell with admin-like controls

### Content rules

- the header should explain who the person is in context
- the context row should be concise and immediately scannable
- message empty states should be practical, not chatty

### Role wrappers

#### Student wrapper

- empty state may point to `Browse tutors` or `Continue booking`
- thread header may foreground the tutor’s expertise cue

#### Tutor wrapper

- empty state may explain that students message when interested or when lessons are active
- thread header may foreground the student’s current need or next lesson

### Responsive behavior

Desktop:

- split pane by default
- stable thread list
- active thread stays visible

Mobile:

- list-first view
- tap thread -> focused full-screen thread
- preserve context chips near the top of the thread

### Accessibility

- thread list must be keyboard navigable
- unread state must not rely on color only
- reconnecting or error states should be announced clearly
- message composer needs explicit labels and sensible focus behavior

### Anti-patterns

- building separate student and tutor messaging systems
- making messages feel detached from lessons
- hiding useful context behind overflow menus

---

## 8. `TrustProofBlock`

### Purpose

Groups trust signals into a structured, readable proof section without becoming badge soup.

### Primary object

`TutorProfile` plus supporting proof objects:

- `Credential`
- `Review`
- platform verification states

### Used in

- tutor profile
- compare
- home trust sections
- result expansions
- tutor profile preview / management context

### Why it is phase 2

This component carries the credibility layer that sits above identity and matching.

### Variants

- `compact`
  - small trust strip or summary
- `standard`
  - balanced public trust section
- `prominent`
  - detail-rich profile block
- `improvement`
  - tutor-facing view with guidance on what is missing

### Anatomy

Required structure:

1. Title or trust label
2. Verification / review status
3. Credentials or qualifications summary
4. Review proof summary
5. Platform trust cues
   - lessons taught
   - response reliability
   - platform-approved status if applicable
6. Optional explanation or note

### Information priority

Lead with the most decision-relevant proof:

- verified or not
- review strength
- relevant qualifications

Avoid leading with decorative trust marks.

### States

- `verified`
- `partially_verified`
- `new_tutor_low_review_count`
- `under_review`
- `needs_more_proof`

### Interaction rules

- if collapsed, summary must still answer “can I trust this person?”
- public version should never expose internal moderation details
- tutor-facing improvement version may show what to complete next

### Content rules

- use factual proof, not vague praise
- review counts and qualifications should be short and concrete
- platform trust labels should be understandable and not sound gamified

Good:

- `Verified qualifications`
- `42 reviews`
- `Strong track record in TOK support`

Bad:

- `Elite mentor`
- `Top 1% genius tutor`
- meaningless badge stacks

### Role wrappers

#### Student/public wrapper

- consumption-oriented
- decision-friendly
- focuses on proof already earned

#### Tutor wrapper

- shows what is complete
- highlights what would strengthen credibility further

### Responsive behavior

Desktop:

- can use grouped clusters or two-column proof blocks

Mobile:

- stack proof signals in clear priority order
- keep verification and reviews near the top

### Accessibility

- proof signals need readable text labels
- do not use icons without labels for trust states
- review and verification states must not rely on color alone

### Anti-patterns

- badge soup
- giant ratings-first trust panels with no qualification context
- tutor-facing improvement copy leaking into student-facing views

---

## 9. `CompareTable`

### Purpose

Supports side-by-side evaluation of shortlisted tutors for one active learning need.

### Primary object

`Match`

### Used in

- compare page
- shortlist review moments
- future advisor or guided-choice experiences

### Why it is phase 2

This component builds directly on:

- `NeedSummaryBar`
- `MatchRow`
- `PersonSummary`
- `TrustProofBlock`

### Variants

- `desktop_matrix`
  - column-based comparison
- `mobile_stacked`
  - per-tutor cards with comparable sections
- `two_way`
  - two tutors only
- `three_way`
  - up to three tutors

### Anatomy

Required structure:

1. Active need summary
2. Tutor comparison headers
3. Fixed comparison categories
4. Decision row
5. Remove / edit shortlist controls

### Comparison categories

These should remain mostly fixed:

- best for
- fit reasons
- subject/component fit
- teaching style
- language/timezone overlap
- availability
- review strength
- price
- trust proof

### States

- `ready`
- `partial_data`
- `over_limit`
- `empty`

### Interaction rules

- compare should cap the number of tutors to keep the decision manageable
- removing one tutor should preserve layout stability
- categories should stay in a fixed order
- the table should help decision-making, not become data overload

### Content rules

- highlight meaningful differences
- avoid category sprawl
- keep category labels short and plain
- if a category is missing for one tutor, show that clearly rather than collapsing the row

### Role wrappers

Primary use is student-facing, but a read-only internal or preview wrapper can reuse the same data model.

### Responsive behavior

Desktop:

- table / matrix structure
- tutor headers stay visible when scanning categories

Mobile:

- stacked tutor cards
- each card keeps the same category order
- category toggles or accordions are acceptable if they preserve comparability

### Accessibility

- table headers and labels must remain understandable to screen readers
- mobile stacked comparisons must not hide the category labels
- actions like remove and book need explicit labels

### Anti-patterns

- allowing too many tutors in compare
- free-form category order that changes by tutor
- turning compare into a spec-sheet dump

---

## 10. `MetricTile`

### Purpose

Displays one meaningful metric with enough context to support action or understanding.

### Primary object

A metric tile is a display wrapper for a shared metric concept, not a domain object by itself. It usually represents state derived from:

- `Lesson`
- `Earning`
- `Notification`
- `Availability`

### Used in

- tutor overview
- tutor earnings
- future student home
- future admin-lite or account summaries

### Why it is phase 2

This component supports overview and operational clarity, especially on the tutor side.

### Variants

- `value_first`
  - large number/value, small label
- `status_first`
  - critical state or label emphasized
- `trend`
  - includes comparison or delta
- `action_needed`
  - includes clear next step or issue state

### Anatomy

Required structure:

1. Label
2. Primary value or status
3. Supporting context
   - delta
   - timeframe
   - reason
4. Optional action cue

### States

- `normal`
- `positive`
- `warning`
- `critical`
- `empty`
- `loading`

### Interaction rules

- do not make every metric tile clickable by default
- only add action behavior when there is a strong next step
- avoid decorative microcharts unless they are genuinely helpful

### Content rules

- one tile = one message
- the metric should be interpretable without opening another screen
- labels should not be generic

Good:

- `Pending requests`
- `Payout setup needed`
- `Upcoming lessons this week`

Bad:

- `Performance`
- `Stats`
- any tile that needs a paragraph to explain itself

### Role wrappers

#### Student wrapper

- use sparingly and only for actionable, calming guidance

#### Tutor wrapper

- more frequent use
- denser but still focused on action and clarity

### Responsive behavior

Desktop:

- tiles can sit in a grid or paired panel layout

Mobile:

- stack or use 2-up only when labels remain readable

### Accessibility

- do not encode the entire meaning via color
- metrics need explicit labels and values
- action tiles need clear button semantics if interactive

### Anti-patterns

- stat cemetery dashboards
- decorative KPI tiles with no decision value
- too many equal-weight metrics on one screen

---

## 11. `ChecklistPanel`

### Purpose

Turns readiness, setup, or next-step flows into a clear action-oriented sequence.

### Primary object

`ChecklistPanel` is a structured wrapper around a readiness or completion state, often derived from multiple objects such as:

- `TutorProfile`
- `Credential`
- `Availability`
- account or payout readiness

### Used in

- tutor pending review state
- tutor activation / onboarding completion
- future student setup or account readiness

### Why it is phase 2

It helps the platform move from static status to guided action.

### Variants

- `activation`
  - first-run tutor readiness
- `review_state`
  - pending review and missing pieces
- `inline`
  - smaller embedded checklist
- `expanded`
  - richer guided panel

### Anatomy

Required structure:

1. Title and progress summary
2. Checklist items
3. Item states
4. Optional guidance note
5. Optional CTA per item or global CTA

### Checklist item anatomy

Each item should include:

- item label
- item state
- short reason or benefit
- action if incomplete

### States

- `not_started`
- `in_progress`
- `complete`
- `blocked`
- `under_review`

### Interaction rules

- completed items should remain visible
- blocked items should explain the blocker
- avoid hiding incomplete items behind accordion-only structures unless the list is very long

### Content rules

- item labels should be action-oriented
- reasons should explain value, not just procedure
- progress language should feel supportive, not bureaucratic

Good:

- `Add your best-for statement`
- `Set weekly availability`
- `Upload one verified credential`

Bad:

- `Complete profile section 3`
- `Resolve issue`

### Role wrappers

#### Tutor wrapper

- primary use case
- may include profile-quality and visibility guidance

#### Student wrapper

- future use for setup or lesson readiness
- should remain lighter and less operational

### Responsive behavior

Desktop:

- checklist can live in a side panel or dedicated readiness block

Mobile:

- stack items vertically
- keep per-item CTAs easy to tap

### Accessibility

- each item needs visible status text
- do not rely on checked icons only
- progress must be understandable as text

### Anti-patterns

- turning this into a generic form wizard duplicate
- hiding why each step matters
- using vague completion language with no next action

---

## 12. `LessonDetail`

### Purpose

Provides the full lesson view for both student and tutor contexts.

It is the expanded counterpart to `LessonCard`.

### Primary object

`Lesson`

### Used in

- student lesson detail
- tutor lesson detail
- request review
- upcoming lesson management
- post-lesson follow-up

### Why it is phase 2

It extends the phase-1 lesson grammar into a full workflow surface.

### Variants

- `request_detail`
  - pending request, decision-ready
- `confirmed_detail`
  - upcoming confirmed lesson
- `completed_detail`
  - continuity and follow-up
- `cancelled_detail`
  - historical and policy context only

### Anatomy

Required structure:

1. Lesson header
   - status
   - person identity
   - subject/component
   - date/time/timezone
2. Request or goal context
3. Schedule and meeting context
4. Action panel
5. Supporting detail
   - note
   - policy summary
   - commercial context
6. Post-lesson continuity area where relevant
   - review
   - report
   - next steps

### Information emphasis by state

#### Pending request

- student need or request note
- schedule details
- accept/decline / withdraw actions

#### Confirmed upcoming

- countdown
- join / reschedule / message
- pre-lesson context

#### Completed

- lesson outcome
- review or report state
- suggested next step

### States

- `pending`
- `accepted`
- `declined`
- `cancelled`
- `upcoming`
- `completed`
- `reviewed`

### Interaction rules

- the action panel should adapt by role and lesson state
- do not bury the primary action below secondary detail
- preserve conversation and scheduling entry points
- completed lessons should smoothly transition into continuity rather than dead archival detail

### Content rules

- header must answer who / what / when at a glance
- request context should be concise but not lost
- policy and payment context should be present but not dominate unless relevant

### Role wrappers

#### Student wrapper

- may foreground tutor actions available to the student:
  - message
  - join
  - reschedule request
  - review

#### Tutor wrapper

- may foreground operations:
  - accept
  - decline
  - join
  - mark complete
  - add report

### Responsive behavior

Desktop:

- can use a two-column detail layout:
  - main lesson content
  - action / summary side panel

Mobile:

- stack into:
  - header
  - primary action cluster
  - context blocks
  - follow-up blocks

### Accessibility

- status and primary actions must be unambiguous
- meeting/join actions need clear labels
- if the page uses panels, keyboard order should follow reading order

### Anti-patterns

- making request review, upcoming lesson detail, and completed lesson detail look like unrelated screens
- collapsing the detail page into a pile of metadata
- hiding the next best action

---

## 13. Cross-Component Relationship Rules

These phase-2 components should connect back to the phase-1 grammar.

### `ConversationShell` -> `PersonSummary`

Conversations must use the shared identity grammar, not a separate messaging header style.

### `TrustProofBlock` -> `MatchRow`

Trust proof should enrich the match logic rather than replace it.

### `CompareTable` -> `NeedSummaryBar`

Compare is always tied to one active learning need.

### `MetricTile` -> tutor overview

Metric tiles should support prioritization, not decorative dashboards.

### `ChecklistPanel` -> tutor activation

Checklist items should point to real actions and real readiness, not generic completion percentages.

### `LessonDetail` -> `LessonCard` and `ScheduleSurface`

Lesson detail extends the lesson card grammar and must preserve scheduling continuity when rescheduling is possible.

## 14. Phase 3 Queue

After these six are approved, the next wave should cover:

- `TransactionRow`
- `ReportSummary`
- `ProfileHealthPanel`
- `NotificationItem`
- `AvailabilityPreview`
- `Uploader`

## 15. Companion Note

This file works best alongside:

- `component-specs-core-v1.md`
- `design-system-foundations-v3.md`

But it is intentionally written so it still makes sense on its own if those files are temporarily missing.
