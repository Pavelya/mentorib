# Mentor IB Two-Sided UI/UX Ecosystem Research

**Date:** 2026-04-07
**Status:** Research and recommendation brief
**Scope:** Student + tutor UX ecosystem, shared design language, tutor operations UX, next-step roadmap

## 1. Core Recommendation

Mentor IB should be designed as **one product ecosystem with two operating modes**, not as two separate UI worlds.

That means:

- one visual language
- one design system
- one object model
- one interaction grammar
- shared components wherever the underlying job is the same

The tutor side should feel more operational and management-oriented, but it should still look and behave like the same product students use.

## 2. Why This Matters

Two-sided platforms often drift into this failure mode:

- the public/student side is branded and polished
- the tutor side becomes a generic dashboard admin
- the visual rhythm, navigation logic, and component behavior change completely
- users who switch roles feel like they entered another product

That is exactly what Mentor IB should avoid.

This matters even more because:

- some users may eventually act in more than one role
- trust is built across the whole platform, not only the public-facing side
- tutors are part of the brand experience, not just operators behind it
- reusable components reduce both design drift and implementation cost

## 3. Desired Shared Product Scope

Mentor IB should support a meaningful two-sided product scope that includes:

- student lessons
- student saved tutors
- student chat
- tutor onboarding
- tutor dashboard
- tutor students
- tutor lessons
- tutor earnings
- tutor reviews
- tutor schedule
- tutor profile editing
- tutor certificates

That is enough scope to justify a shared ecosystem rather than separate role-specific products.

## 4. Shared Product Intent

The product direction should explicitly support:

- shared components across roles
- one icon system
- one mobile navigation logic
- one account-management approach

What matters is not only the desire for shared components, but the **UI thesis** behind them.

The shared foundation should be matching-first and academically specific.

## 5. External Research

I looked at tutor-side and operational patterns from:

- Wyzant
- Preply
- GoStudent
- TutorCruncher
- Calendly

## 6. What The Research Shows

### 6.1 Avoid separate role universes

Wyzant explicitly allows someone to be both a student and a tutor, but those accounts are separate and even recommend separate email addresses. That is a useful negative example.

This is operationally understandable, but from a UX perspective it is a warning sign:

- identity splits
- context splits
- settings splits
- mental-model fragmentation

Mentor IB should avoid this model.

### 6.2 Tutor dashboards should be a business snapshot, not an admin maze

Wyzant describes the tutor dashboard as the tutor homepage where they can get a snapshot of their business, see response data, new messages, upcoming lessons, and edit availability directly.

That framing is good.

The tutor home should answer:

- what needs my attention now?
- who am I teaching next?
- where is money blocked or at risk?
- what is improving or declining?

### 6.3 Student management should be tied to conversations and lessons

Wyzant surfaces student information in two key places:

- messages
- students page

That is a strong pattern. Tutors usually think about students in context:

- the conversation
- the next lesson
- the learning trajectory

A standalone “CRM table” is useful, but it should not become the only way to understand a student.

### 6.4 Onboarding should be staged, not giant-form based

GoStudent describes a five-step process:

- register
- subject quiz
- interview
- onboarding
- start teaching

Preply describes a 3-step structure with an 8-section application including:

- profile photo
- certifications
- education
- description
- video
- calendar
- rate

Common pattern:

- staged progression
- low-friction first step
- profile credibility elements early
- schedule and pricing later
- review/approval checkpoint before full activation

That pattern fits Mentor IB well.

### 6.5 Availability UX must go beyond a weekly grid

Calendly and TutorCruncher both make it clear that good availability management includes more than recurring weekly hours.

Important capabilities repeatedly shown in their documentation:

- reusable schedules
- event-type-specific schedules
- weekly hours
- non-weekly / date-specific overrides
- holidays and blackout days
- meeting limits
- buffer times
- external calendar conflict handling
- mutual availability views

For Mentor IB, this means the tutor schedule UX should not stop at “pick your weekly slots.”

### 6.6 Lesson operations are more than calendar events

TutorCruncher’s lesson model treats lessons as operational objects with states, edits, cancellation flows, filtering, repetition, reminders, reporting, and billing consequences.

That is the right direction.

For Mentor IB, lessons should be a central shared object with:

- request state
- acceptance state
- upcoming state
- completed state
- cancellation state
- reporting / notes
- attendance
- join link
- payment implications

### 6.7 Progress visibility is part of tutor UX, not a postscript

TutorCruncher emphasizes lesson reports and progress tracking for students and clients.

This is especially relevant for Mentor IB because the service promise is academic improvement, not generic time-booking.

Even if detailed progress tools are later-phase, the UX should be designed with that future in mind now.

## 7. Strategic Principle

## One Ecosystem, Dual Modes

The product should have:

- a shared foundation
- a student guidance mode
- a tutor operating mode

The student side emphasizes:

- confidence
- clarity
- guidance
- matching
- reassurance

The tutor side emphasizes:

- overview
- efficiency
- responsiveness
- planning
- follow-through

But both sides should share:

- visual language
- typography
- color logic
- components
- interaction patterns
- tone of voice

## 8. Design Principle Set For A Unified Ecosystem

### 8.1 Shared object model

Design around product objects, not around roles.

Core objects:

- Person
- Tutor
- Student
- Match
- Lesson
- Availability
- Conversation
- Review
- Report
- Earning
- Credential
- Notification

Each object should have one canonical design pattern that can be adapted by permissions, density, and context.

Example:

- A `LessonCard` should not exist as separate student and tutor species unless the information architecture truly diverges.
- A `ConversationPanel` should not be reinvented for each role.
- A `ScheduleSurface` should reuse the same calendar grammar with different edit rights.

### 8.2 Shared interaction grammar

The same actions should look and behave the same across roles:

- save
- compare
- accept
- decline
- cancel
- reschedule
- join
- message
- complete
- review
- upload

If “pending” is amber in one part of the product, it should not become gray or blue somewhere else.

### 8.3 Shared shell logic

Do not make one side “marketing pages” and the other side “generic admin SaaS.”

Recommended shell model:

- same brand header language
- same core page grid
- same page-title rhythm
- same status badge logic
- same card/list conventions
- same mobile navigation logic

Role differences can appear in:

- primary navigation labels
- page priorities
- task modules
- density

### 8.4 Shared tone

Student tone:

- reassuring
- precise
- anti-overwhelm

Tutor tone:

- supportive
- clear
- capable
- professional

Both should still sound like Mentor IB.

## 9. UX Architecture Recommendation

### 9.1 Shared zones

These should feel nearly identical across roles:

- auth
- account settings
- profile identity basics
- notifications
- chat
- lesson detail view
- schedule/timezone patterns
- file upload behaviors
- status system

### 9.2 Student-specific zones

- matching flow
- search / shortlist / compare
- tutor profile exploration
- booking request flow
- review submission

### 9.3 Tutor-specific zones

- application / approval status
- operational dashboard
- student roster
- schedule control
- lesson fulfillment
- progress reporting
- earnings
- profile quality and visibility

## 10. Tutor Flow Recommendations

## 10.1 Tutor acquisition and application

Mentor IB should include a `become-a-tutor` flow, and the journey should be sharp, staged, and confidence-building.

Recommended stages:

1. Landing page for tutor value proposition
2. Quick eligibility / fit check
3. Account creation
4. Structured application
5. Review / approval state
6. Guided first-run activation

### UX recommendations

- Keep the first step lightweight
- Ask for commitment only after value and fit are clear
- Use staged sections, never a giant master form
- Show progress clearly
- Explain why each requested item matters
- Separate “required to get approved” from “recommended to stand out”

### Recommended application sections

- Identity and photo
- IB teaching credibility
- Subjects and components
- Languages
- Teaching style and ideal student types
- Availability and timezone
- Pricing and trial options
- Meeting setup
- Credentials and links
- Final review

### Important addition for Mentor IB

Do not ask only “which subject do you teach?”

Also ask:

- which IB scenarios are you strongest in?
- what are you best at helping students with?
- what kind of student need are you best for?

That data should power matching later.

## 10.2 Approval and pending-review UX

Tutor approval should be a first-class UX state, not a dead waiting page.

Recommended pending-review experience:

- clear application status
- what has been submitted
- what is still missing
- expected review timing
- examples of what makes profiles strong
- allowed actions while waiting

This can become a confidence-building space instead of a vague limbo page.

## 10.3 Tutor first-run activation

After approval, guide tutors into readiness.

Recommended checklist:

- complete public profile
- set weekly availability
- add exceptions / blackout dates
- connect meeting tool or verify lesson setup
- upload credentials
- write “best for” statements
- preview public profile

The goal is not just account completion, but booking readiness.

## 10.4 Tutor dashboard overview

The tutor dashboard should be a prioritization surface, not a stat cemetery.

Recommended modules:

- next lesson
- pending booking requests
- unread messages
- weekly availability gaps or conflicts
- earnings snapshot
- profile strength / visibility health
- recent student momentum

Avoid:

- too many equal-weight cards
- decorative analytics with no action
- burying urgent requests below historical summaries

## 10.5 Student management UX

`My Students` should evolve from a contact list into a lightweight teaching CRM.

Each student record should show:

- current stage: new / active / paused / completed
- subjects and IB components
- next lesson
- recent lesson count
- recent progress / concern signal
- notes / report access
- parent or billing context if applicable

Recommended entry points:

- from dashboard
- from lessons
- from messages
- from student roster

Recommended student detail tabs:

- Overview
- Lessons
- Notes / Reports
- Messages
- Files / Links

## 10.6 Lessons UX

Lessons are the most important shared operational object in the whole platform.

Both roles should use the same lesson grammar, with role-based actions.

Shared lesson anatomy:

- person
- subject / component
- status
- date / time / timezone
- meeting mode
- price / trial state
- notes / message preview
- actions

Tutor actions:

- accept
- decline
- reschedule
- join
- mark complete
- add report

Student actions:

- withdraw
- reschedule request
- join
- message
- review

### Important recommendation

Do not split lessons into completely different card systems for tutors and students.

Keep one canonical `LessonCard`, `LessonList`, and `LessonDetail` pattern.

## 10.7 Scheduling and availability UX

This area deserves deeper treatment because it is one of the easiest places for tutor-side UX to become crude.

Recommended availability model:

- weekly recurring availability
- date-specific overrides
- vacation / blackout mode
- minimum notice
- buffer before / after lessons
- daily / weekly lesson caps
- lesson-type rules where relevant
- external calendar conflict sync
- local + student timezone visibility

Recommended views:

- weekly list editor for simple recurring hours
- calendar override view for exceptions
- booking preview showing what students actually see

### Key principle

Tutors should manage availability in the language of teaching workload, not only in the language of raw time slots.

Examples:

- max lessons per day
- no back-to-back oral practice sessions
- no lessons after 9pm local time
- buffer before TOK review sessions

## 10.8 Messaging UX

Messaging should stay shared between roles.

Recommended conversation structure:

- same thread layout
- same attachment and scheduling affordances
- role-specific empty-state copy only

Important additions:

- student quick facts in the thread header for tutors
- tutor quick facts in the thread header for students
- lesson context chips
- “book from chat” and “reschedule from chat” hooks

## 10.9 Reports and progress UX

This should be planned now even if implemented later.

Recommended post-lesson report structure:

- lesson goal
- what was covered
- student confidence / understanding
- action items before next session
- recommended next focus

Students should not see this as bureaucratic admin.
They should see it as academic continuity.

Tutors should not see it as paperwork.
They should see it as part of high-quality teaching.

## 10.10 Earnings and performance UX

Do not make the earnings page only a payout ledger.

Recommended combined model:

- payout status
- available / pending / paid amounts
- transaction history
- lesson-based earnings
- visibility / reliability metrics
- profile-health guidance

Preply’s tutor standards policy is useful here: operational behavior and reliability affect discoverability.

Mentor IB should eventually surface a tutor-quality panel including:

- response time
- decline rate
- tutor-initiated cancellations
- no-show risk
- review momentum
- profile completeness

This makes quality metrics feel like coaching, not punishment.

## 11. Shared Component Strategy

## 11.1 Components that should be shared

- Header
- Footer
- Mobile nav logic
- Page title block
- Status badges
- Buttons
- Inputs
- Selects
- Empty states
- Alerts / inline notices
- Message thread
- Conversation list
- Lesson card
- Lesson list
- Lesson detail
- Schedule surface
- Avatar
- File uploader
- Review card
- Notification item
- Profile section blocks

## 11.2 Components that can share a base but diverge in composition

- Dashboard home
- Search results
- Tutor profile
- Student record view
- Earnings analytics
- Compare view

These should use shared primitives but can be assembled differently.

## 11.3 Design system guidance

Build the system in layers:

### Layer 1: Foundations

- typography
- color
- spacing
- radius
- shadows
- motion

### Layer 2: Primitives

- text
- icon
- button
- field
- chip
- badge
- divider
- surface

### Layer 3: Shared composites

- person summary
- lesson summary
- status row
- schedule editor
- conversation shell
- filter bar
- metric tile
- proof block

### Layer 4: Page patterns

- match flow
- tutor application
- dashboard overview
- roster
- lesson hub
- compare screen

## 12. Visual-System Implications

The same fresh-start visual territory from the first research brief should apply to both roles.

That means:

- no student side as warm editorial and tutor side as generic dashboard SaaS
- no font switch between roles
- no different shape language
- no different status language

Tutor pages can be denser, but they should still feel:

- editorial
- calm
- academic
- trustworthy
- distinctly Mentor IB

## 13. Recommended Product Rules

### Rule 1

No role should require a second mental model for the same object.

### Rule 2

If student and tutor both touch the same thing, start from one shared component.

### Rule 3

Role-specific differences should mostly live in:

- permissions
- actions
- information priority

Not in visual reinvention.

### Rule 4

Operational tutor pages should feel like “teaching workflow,” not “back-office admin.”

### Rule 5

Every tutor-management screen should support one of these jobs:

- respond
- prepare
- teach
- follow up
- improve visibility
- get paid

## 14. What To Avoid

- Separate tutor and student accounts with separate identities if avoidable
- Separate component libraries by role
- Tutor dashboard in generic B2B admin style
- A schedule UI limited to one repeating weekly grid
- Student CRM as a dead table without lesson and message context
- Progress tracking bolted on later without room in the UX
- Different visual personalities for the public and logged-in areas

## 15. Concrete Next Steps

The next phase should expand from “design strategy” into a full product design program.

### Deliverable 1: Cross-role service blueprint

Map the entire lifecycle:

- student discovers need
- student gets matched
- student books
- tutor responds
- lesson happens
- review / report / payout
- repeat lesson / ongoing support

### Deliverable 2: Canonical object model for UX

Define the shared design patterns for:

- person
- lesson
- availability
- conversation
- review
- report
- earning

### Deliverable 3: Full IA and navigation system

Design:

- public IA
- student IA
- tutor IA
- mobile navigation rules
- switching / role context rules if needed

### Deliverable 4: Low-fidelity wireframes

Priority screens:

- Home
- Match flow
- Search results
- Tutor profile
- Compare
- Tutor application
- Tutor dashboard
- My students
- Lessons hub
- Schedule
- Earnings

### Deliverable 5: Shared design system foundations

Define:

- typography pairing
- color system
- surface system
- iconography
- motion rules
- density rules for public vs operational pages

### Deliverable 6: Component inventory and reuse matrix

For each component:

- shared across all
- shared base / role-specific wrapper
- role-specific only

### Deliverable 7: High-fidelity prototype set

Build a coherent prototype covering both sides, not only the student-facing marketing and search flow.

### Deliverable 8: Usability testing plan

Test with:

- IB students
- IB tutors
- ideally one or two users who can evaluate both sides

Key questions:

- does matching feel easier than browsing?
- does the tutor side feel like the same product?
- can tutors manage workload without friction?
- does progress feel visible and professional?

## 16. Suggested Sequencing

Recommended order:

1. Positioning and brand territory
2. Cross-role service blueprint
3. Shared object model
4. Information architecture and navigation
5. Low-fi wireframes across both roles
6. Design-system foundations
7. High-fi prototype
8. Validation and iteration

## 17. Product-Level Recommendation

Yes, the redesign should explicitly include the whole tutor lifecycle now.

If you only redesign the public and student-facing side first, there is a high chance the tutor side becomes the “other product” later.

The safer move is:

- define both roles together
- design one ecosystem
- build one shared system
- allow density and task differences without creating brand or UX fragmentation

## 18. Source Notes

Internal context reviewed:

- `src/app/(student)/lessons/LessonsClient.tsx`
- `src/app/(tutor)/dashboard/lessons/DashboardLessonsClient.tsx`
- `src/app/(student)/chat/StudentChatClient.tsx`
- `src/app/(tutor)/dashboard/messages/TutorChatClient.tsx`
- `src/app/become-a-tutor/TutorApplicationForm.tsx`
- `src/app/(tutor)/dashboard/schedule/ScheduleEditor.tsx`
- `src/components/features/LessonCard.tsx`

External sources reviewed:

- `https://support.wyzant.com/students-parents/student-account/if-im-a-student-can-i-also-sign-up-as-a-tutor-or-vice-versa/`
- `https://support.wyzant.com/tutors/tutor-home/what-is-my-tutor-dashboard/`
- `https://support.wyzant.com/tutors/tutor-home/where-can-i-find-information-about-my-students/`
- `https://support.wyzant.com/students-parents/find-a-tutor/how-do-i-find-a-tutor/`
- `https://www.gostudent.org/en-gb/blog/how-to-become-a-gostudent-tutor`
- `https://help.preply.com/en/articles/4175138-register-to-teach-on-preply`
- `https://help.preply.com/en/articles/4179411-evaluation-of-tutors`
- `https://help.preply.com/en/articles/11405781-tutoring-standards-policy`
- `https://calendly.com/help/how-to-set-your-availability`
- `https://calendly.com/help/availability-overview`
- `https://calendly.com/help/mutual-availability-overview`
- `https://calendly.com/help/how-to-set-meeting-limits`
- `https://help.tutorcruncher.com/en/articles/8225226-calendar`
- `https://help.tutorcruncher.com/en/articles/10098367-tutor-guide-calendar`
- `https://help.tutorcruncher.com/en/articles/10097966-tutor-guide-lesson-reports`
- `https://help.tutorcruncher.com/en/articles/8173363-students`
