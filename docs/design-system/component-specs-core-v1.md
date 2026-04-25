# Mentor IB Core Shared Component Specs v1

**Date:** 2026-04-07
**Status:** Standalone component-spec document
**Scope:** Phase 1 core shared components

## 1. Why This Document Exists

This document is intentionally self-contained.

It includes the minimum strategic, UX, and visual assumptions needed to define the first wave of core reusable components without depending on external comparison docs.

If only one component-spec file is used on its own, this should still make sense.

> **Implementation note:** `docs/design-system/agent-ui-rules.md` is the operational companion for coding agents applying these specs in the repo. If it conflicts with this document or the final design-system spec, this document and the final design-system spec win.

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

### Core color roles

- Page background: warm paper
- Primary text: dark ink
- Primary action: forest
- Accent emphasis: clay
- Merit / reviews: gold
- Success: green-success
- Warning / pending: amber-warning
- Danger: red-danger

### Surface rules

- public/student screens: more spacious, fewer repeated cards
- tutor screens: denser, more operational, same visual DNA
- avoid generic card walls and default SaaS panel spam

## 4. Shared State Language

These labels should stay consistent across all components:

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

## 5. Reuse Rules

### Rule 1

If student and tutor both touch the same object, start from one canonical component.

### Rule 2

Role wrappers are allowed for:

- different actions
- different density
- helper copy
- slightly different field emphasis

Role wrappers are not a license to redesign the component.

### Rule 3

The five highest-priority shared components in phase 1 are:

1. `NeedSummaryBar`
2. `MatchRow`
3. `PersonSummary`
4. `LessonCard`
5. `ScheduleSurface`

These five define the product grammar.

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

## 7. `NeedSummaryBar`

### Purpose

Keeps the active student need visible as context across matching, browsing, compare, booking, and tutor-side request review.

This component is central to the shift from generic tutor marketplace to guided matching product.

### Primary object

`LearningNeed`

### Used in

- match flow
- results / search
- compare
- booking flow
- tutor-side request context

### Why it is core

Without persistent need context, the product falls back into generic directory behavior.

### Variants

- `compact`
  - single-line, low-height, used in dense result headers or mobile
- `standard`
  - default multi-attribute summary
- `stacked`
  - two-line version for narrower layouts or more detailed review states
- `editable`
  - includes “Edit” or back-navigation affordance
- `read_only`
  - tutor or confirmation context, no editing affordance

### Anatomy

Required structure:

1. Optional label
   - examples: `Your need`, `Current need`, `Request context`
2. Primary need statement
   - example: `IA feedback`
3. Key qualifiers
   - subject/component
   - urgency
   - support style
   - language
   - timezone
4. Optional affordance
   - edit
   - change
   - view full request

### Information priority

Always show:

- need type
- subject or component if known

Show next, based on space:

- urgency
- support style
- timezone
- language

Hide first when crowded:

- language
- timezone

Never hide:

- the need type itself

### States

- `draft`
  - incomplete answers, lower-confidence summary
- `active`
  - fully formed and currently driving recommendations
- `locked`
  - fixed for a specific booking or confirmed request
- `truncated`
  - overflowed into `+2 more` style summary

### Interaction rules

- editable version should allow lightweight revision, not full reset by default
- editing the bar should return the user to the right step or filter context
- on compare and booking screens, the bar should remain visible near the top

### Content rules

- use plain-language labels
- avoid internal jargon if it is not user-entered
- summarize, do not narrate
- keep chip/text fragments short

Good:

- `IA feedback`
- `TOK exhibition`
- `Urgent`
- `Evening support`

Bad:

- `Need Type: Internal Assessment Coursework Feedback`
- long sentence summaries that wrap across the screen

### Role wrappers

#### Student wrapper

- editable
- can open refine flow or filters
- may include “change” affordance

#### Tutor wrapper

- read-only
- may include submission time or urgency flag
- may foreground the student’s requested focus

### Responsive behavior

Desktop:

- horizontal with grouped chips/text
- edit action aligned right when present

Mobile:

- wraps into 2 lines
- if long, use stacked summary or controlled overflow
- never let it push primary CTAs off-screen

### Accessibility

- summary must remain readable as text, not icon-only chips
- edit/change affordance must be keyboard reachable
- urgency states should not rely on color alone

### Anti-patterns

- turning this into a breadcrumb
- stuffing all questionnaire answers into one bar
- using it only on student screens and dropping it for tutor request review

---

## 8. `MatchRow`

### Purpose

Represents a tutor candidate as a contextual match, not just a marketplace listing.

It is the main replacement for generic tutor cards.

### Primary object

`Match`

### Used in

- guided results
- search / browse
- saved tutors
- shortlist

### Why it is core

This component carries the strongest expression of the new product thesis:

- why this tutor fits
- what they are best for
- whether they are available soon
- why they are trustworthy

### Variants

- `recommendation`
  - strongest fit-rationale emphasis
- `browse`
  - lighter fit context, more exploratory
- `shortlist`
  - comparison-friendly, more compact
- `unavailable`
  - preserves fit but signals booking friction

### Anatomy

Required structure:

1. Tutor visual identity
   - photo
   - name
   - trust/proof cue
2. Best-for statement
   - one-line role statement
3. Fit reasons
   - 2 to 3 bullets max
4. Proof block
   - ratings
   - review count
   - lessons taught or similar proof
5. Overlap block
   - language
   - timezone overlap
   - next availability
6. Price
7. Action rail
   - save
   - compare
   - primary CTA

### Information priority

Must appear above the fold / first scan:

- tutor identity
- best-for statement
- at least 1 fit reason
- trust signal
- primary CTA

### Fit reason rules

Each row should show specific rationale, not generic traits.

Good:

- `Experienced with TOK essay structure`
- `Available this week in your timezone`
- `Strong review history for oral prep`

Bad:

- `Friendly and passionate`
- `Experienced tutor`
- `Great communication`

### States

- `default`
- `saved`
- `in_compare`
- `limited_availability`
- `trial_available`
- `new_tutor`
- `high_confidence_match`

### Interaction rules

- the row can be clickable, but the main CTA must still be explicit
- save and compare should be independent, low-friction actions
- adding to compare should visibly confirm the action
- only a limited number of compare selections should be allowed

### Content rules

- best-for statement should be written in student-need language
- fit reasons should be short and scannable
- use real proof, not marketing adjectives
- price should be clear but not dominate the row

### Role wrappers

Primary use is public/student, but admin/tutor preview can reuse the same base row with actions removed.

### Responsive behavior

Desktop:

- row or panel-row with clear horizontal grouping
- fit reasons remain visible without expansion

Mobile:

- stack into vertical sections:
  - photo + identity
  - best for
  - fit reasons
  - proof/availability/price
  - actions

### Accessibility

- actions must remain reachable independently from the row click target
- fit reasons should be text, not only icons
- saved/compared states must use text or aria labels, not color only

### Anti-patterns

- reverting to a generic 3-column tutor card wall
- making price larger than the fit rationale
- hiding the reason for recommendation

---

## 9. `PersonSummary`

### Purpose

Provides a shared identity block for any human in the system: tutor, student, or message participant.

### Primary object

`Person`

### Used in

- tutor profile header
- lesson cards
- message headers
- student roster
- student detail
- compare headers

### Why it is core

It is the shared identity grammar across both modes. If this forks too early, the ecosystem stops feeling unified.

### Variants

- `compact`
  - small row for lists and messages
- `standard`
  - default identity block
- `header`
  - profile or detail header version
- `operational`
  - roster / dashboard version with quick facts

### Anatomy

Base structure:

1. Avatar or portrait
2. Name
3. Secondary descriptor
   - depends on role/context
4. Optional metadata row
   - country / timezone / language / lesson count / trust cue
5. Optional action slot
   - message
   - open detail
   - save

### Field emphasis by context

#### Tutor in student-facing context

- name
- best-for or credibility cue
- trust markers
- timezone / language overlap

#### Student in tutor-facing context

- name
- current stage
- active subject/component
- next lesson / recent activity

### States

- `default`
- `verified`
- `new`
- `attention_needed`
- `muted_context` for conversation or low-priority views

### Interaction rules

- the identity block may be clickable, but embedded actions must remain explicit
- action slot should be optional and not break spacing when absent
- use the same alignment rules across roles

### Content rules

- never overload the secondary line
- one primary descriptor is better than three weak ones
- trust markers should be close to the name or immediately below it

### Role wrappers

#### Tutor wrapper

- may foreground trust proof and availability

#### Student wrapper

- may foreground lesson continuity and current stage

### Responsive behavior

Desktop:

- can support 2-line identity plus quick facts

Mobile:

- stack metadata below name
- keep action slot visible but compact

### Accessibility

- name must always be present as text
- avatar is decorative when redundant, informative when no name is visible
- trust markers need readable labels

### Anti-patterns

- creating separate “TutorHeader” and “StudentHeader” systems that share nothing
- stuffing too many metadata fragments into the identity block

---

## 10. `LessonCard`

### Purpose

Represents a lesson consistently across student and tutor modes.

### Primary object

`Lesson`

### Used in

- student lessons
- tutor lessons
- tutor overview modules
- upcoming lesson blocks
- request queues

### Why it is core

`Lesson` is the most important shared object in the ecosystem. This component is the clearest test of whether the platform truly feels unified.

### Variants

- `request`
  - pending, decision-oriented
- `upcoming`
  - confirmed and join-oriented
- `completed`
  - continuity and report/review-oriented
- `compact`
  - dashboard / side module version

### Anatomy

Required structure:

1. Status row
   - lesson state badge
   - optional countdown / urgency
2. Core identity
   - other person via `PersonSummary`
3. Lesson context
   - subject/component
   - date and time
   - timezone
4. Commercial / booking context
   - price
   - trial state if relevant
5. Optional supporting context
   - message preview
   - request note
   - next step
6. Action row

### Shared fields

Always include:

- person
- subject/component
- status
- date/time

Include when relevant:

- timezone
- meeting link state
- trial / price
- request note preview

### State model

- `pending`
- `accepted`
- `declined`
- `cancelled`
- `upcoming`
- `completed`
- `reviewed`

### Action wrappers

#### Student actions

- withdraw request
- reschedule request
- join
- message
- review

#### Tutor actions

- accept
- decline
- reschedule
- join
- mark complete
- add report

### Interaction rules

- action row should adapt by role and lesson state
- if there are no actions, preserve structure without awkward gaps
- countdown/urgency should appear only when useful
- completed lessons should pivot from action to continuity

### Content rules

- keep the message preview short
- use the same status wording across all tabs and cards
- do not show every operational detail on the card; detail view can hold the rest

### Responsive behavior

Desktop:

- allows horizontal grouping of identity, context, and action

Mobile:

- stack:
  - status
  - person
  - context
  - actions

Actions should not wrap into a confusing cluster.

### Accessibility

- status should be announced clearly
- action buttons must have explicit labels
- date/time should be text, not icon-only
- join actions need clear meeting context

### Anti-patterns

- separate student and tutor lesson-card systems
- treating tutor requests as an unrelated dashboard widget style
- hiding status language behind icon-only signals

---

## 11. `ScheduleSurface`

### Purpose

Provides one shared availability and slot-selection grammar for both booking and tutor scheduling.

### Primary object

`Availability`

### Used in

- booking flow
- reschedule flow
- tutor schedule management
- tutor availability preview

### Why it is core

This is the component most likely to split into two products if not defined carefully:

- a student booking calendar
- a tutor admin scheduler

It must instead behave like one component with different modes.

### Variants

- `select_mode`
  - student selects one available slot
- `edit_mode`
  - tutor creates and edits recurring availability
- `preview_mode`
  - student-visible outcome, no interaction
- `exception_mode`
  - tutor manages overrides / blackout dates

### Anatomy

Required structure:

1. Timezone and date context
2. Mode indicator
3. Main scheduling canvas
4. Legend / state key
5. Optional side or lower panel
   - booking preview
   - rules
   - exceptions

### Core scheduling canvas expectations

The system may use a grid, a list, or a hybrid, but it must support:

- weekly recurring availability
- date-specific overrides
- clear available vs blocked distinction
- timezone visibility

### State model

- `available`
- `selected`
- `blocked`
- `unavailable`
- `override`
- `conflict`
- `past`
- `loading`

### Interaction rules

#### In select mode

- only selectable slots are interactive
- selection must immediately update lesson summary / booking context
- if no slots exist, explain why and offer fallback path

#### In edit mode

- adding/removing slots must be visually obvious
- repeated editing should be fast and low-friction
- exceptions should not destroy the weekly base schedule silently

### Content rules

- show local timezone clearly
- if translating between tutor and student timezones, name that explicitly
- legends must use text and not rely on color alone

### Role wrappers

#### Student wrapper

- select-mode only
- fewer controls
- stronger booking confirmation cues

#### Tutor wrapper

- edit-mode controls
- exceptions
- rule settings
- student-visible preview

### Responsive behavior

Desktop:

- can use split view:
  - edit/select left
  - preview/rules right

Mobile:

- must become a usable stacked flow
- keep timezone visible near the top
- avoid tiny calendar hit areas

### Accessibility

- every slot state must be keyboard navigable where interactive
- selected slot must be announced clearly
- blocked vs available must not rely on color only
- timezone text must be readable and persistent

### Anti-patterns

- one weekly grid with no exceptions or overrides
- completely separate booking picker and tutor scheduler systems
- hiding timezone changes in tiny meta text

---

## 12. Cross-Component Relationship Rules

These five components should work together consistently.

### `NeedSummaryBar` -> `MatchRow`

The need context must explain why the match exists.

### `MatchRow` -> `PersonSummary`

`MatchRow` uses tutor identity through the same person grammar as the rest of the system.

### `PersonSummary` -> `LessonCard`

Lessons should rely on the same identity block, not invent their own header style.

### `LessonCard` -> `ScheduleSurface`

Booking and rescheduling should preserve lesson context while using the same scheduling grammar.

## 13. Phase 2 Queue

After these five are approved, the next wave should cover:

- `ConversationShell`
- `TrustProofBlock`
- `CompareTable`
- `MetricTile`
- `ChecklistPanel`
- `LessonDetail`

## 14. Companion Note

This file works best alongside:

- `design-system-foundations-v3.md`
- whichever component implementation or design-spec files come next

But this file is intentionally written so it still makes sense if those files are temporarily missing.
