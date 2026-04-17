# Mentor IB Cross-Role Journey Inventory v1

**Date:** 2026-04-11
**Status:** Canonical product-journey inventory for student, tutor, admin, and system-driven flows
**Scope:** meaningful public, authenticated, private, internal, happy-path, and failure-path journeys that the current Mentor IB docs pack intends to support
**Companion docs:**
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/foundations/ux-object-model.md`
- `docs/foundations/ia-map-two-sided.md`
- `docs/planning/end-to-end-use-case-gap-audit-v1.md`

## 1. Purpose

This document turns the current Mentor IB product pack into one explicit journey inventory.

It exists to answer:

- which journeys the system must support
- which routes and objects those journeys use
- what the happy path looks like
- what the main unhappy or blocked cases look like
- what result or user-facing message should appear

This is not route-by-route UI polish.

It is the canonical list of meaningful product journeys.

## 2. Reading Rules

### 2.1 Journey format

Each journey includes:

- role
- phase
- route or entry point
- the core click-and-navigation path
- outcome
- main unhappy cases
- typical user-facing messages

### 2.2 Message rule

The user-facing messages in this document are canonical UX-intent messages, not frozen final copy.

They describe the meaning users must receive even if final wording changes later.

### 2.3 Phase keys

- `Phase 1`: MVP
- `Phase 1.5`: first continuity expansion
- `Phase 2`: broader product expansion
- `Internal`: privileged operational flow
- `Always`: applies across phases when that area exists

### 2.4 Boundary rule

This inventory covers the current approved Mentor IB scope.

The parent or guardian payer flow remains out of current scope.

## 3. Public And Shared-Account Journeys

### J-PUB-001 Home to match start

- `Role`: Public visitor or signed-in student
- `Phase`: `Phase 1`
- `Entry`: `/`
- `Flow`:
  1. `Visitor` lands on Home.
  2. `Visitor` clicks `Get Matched`.
  3. `System` navigates to `/match` if the user is already allowed into student flow, or to `/auth/sign-in` with a return path if not.
- `Outcome`: the user enters the guided match flow.
- `Unhappy cases`:
  - unauthenticated user must sign in first
  - authenticated user without a role is routed to `/setup/role`
- `User sees`:
  - success: `Let's find tutors for your exact IB need.`
  - auth required: `Sign in to continue and save your progress.`
  - role required: `Tell us how you'll use Mentor IB first.`
- `Task coverage`: `P1-PUBLIC-002`, `P1-MATCH-001`, `P1-AUTH-001`, `P1-AUTH-002`

### J-PUB-002 Home to browse tutors

- `Role`: Public visitor or signed-in student
- `Phase`: `Phase 1`
- `Entry`: `/`
- `Flow`:
  1. `Visitor` lands on Home.
  2. `Visitor` clicks `Browse Tutors`.
  3. `System` navigates to the browse or results surface.
- `Outcome`: the user explores tutors through the secondary browse path.
- `Unhappy cases`:
  - empty public inventory for a narrow filter
- `User sees`:
  - success: `Browse tutors by fit, subject, and availability.`
  - empty state: `No tutors match these filters right now. Try widening your criteria.`
- `Task coverage`: `P1-PUBLIC-002`, `P1-MATCH-002`

### J-PUB-003 Public tutor profile evaluation

- `Role`: Public visitor, signed-in student, or signed-in tutor previewing a profile
- `Phase`: `Phase 1`
- `Entry`: `/tutors/[slug]`
- `Flow`:
  1. `Visitor` lands on a public tutor profile.
  2. `Visitor` reviews fit summary, trust proof, teaching style, pricing, and availability cues.
  3. `Signed-in student` can click `Message`, `Book`, `Save`, or `Compare` where the current product phase supports it.
  4. `Logged-out visitor` is routed into sign-in when a protected CTA is pressed.
  5. `Tutor viewer` sees the profile in read-only mode without student CTAs.
- `Outcome`: the user either evaluates the tutor and leaves, or continues into messaging, saving, compare, or booking.
- `Unhappy cases`:
  - tutor is no longer publicly listed
  - tutor profile does not pass public-quality gate
- `User sees`:
  - unavailable state: `This tutor profile is not currently available.`
  - gated state: `This tutor is not open for new requests right now.`
- `Task coverage`: `P1-PUBLIC-003`, `P1-BOOK-001`, `P1-MSG-001`, `P15-DATA-001`, `P15-COMP-001`

### J-PUB-004 Trust and safety, how-it-works, and support reading

- `Role`: Any public or signed-in user
- `Phase`: `Phase 1`
- `Entry`: `/how-it-works`, `/trust-and-safety`, `/support`
- `Flow`:
  1. `User` clicks a supporting public route from the header, footer, or contextual link.
  2. `System` navigates to the selected route.
  3. `User` reads process, trust, and support guidance.
- `Outcome`: the user gets reassurance or clarification without leaving the Mentor IB ecosystem.
- `Unhappy cases`:
  - user expected a live support chat that does not exist
- `User sees`:
  - support expectation: `Use support guidance and in-product notifications for the next step.`
- `Task coverage`: `P1-PUBLIC-001`

### J-PUB-005 Become-a-tutor acquisition entry

- `Role`: Public visitor who wants to teach
- `Phase`: `Phase 1`
- `Entry`: `/become-a-tutor`
- `Flow`:
  1. `Visitor` lands on the tutor-acquisition page.
  2. `Visitor` clicks `Apply to Teach`.
  3. `System` routes to sign-in or `/tutor/apply` depending on session and role state.
- `Outcome`: the future tutor enters the tutor onboarding path.
- `Unhappy cases`:
  - authenticated student without tutor capability must first add tutor intent through setup or tutor application entry. 
- `User sees`:
  - success: `Start your Mentor IB application.`
  - setup required: `We'll set up your tutor role first.`
- `Task coverage`: `P1-PUBLIC-001`, `P1-AUTH-001`, `P1-AUTH-002`, `P2-APPLY-001`

### J-AUTH-001 Existing account sign-in

- `Role`: Returning user
- `Phase`: `Phase 1`
- `Entry`: `/auth/sign-in`
- `Flow`:
  1. `User` clicks `Continue with Google` or enters email for a magic link.
  2. `System` authenticates through the shared auth flow.
  3. `System` returns the user to the intended route or a valid default destination.
- `Outcome`: the user is signed in without choosing between separate products.
- `Unhappy cases`:
  - expired magic link
  - provider callback error
- `User sees`:
  - magic-link send: `Check your email for your sign-in link.`
  - expired link: `This sign-in link has expired. Request a new one.`
  - callback failure: `We couldn't complete sign-in. Please try again.`
- `Task coverage`: `P1-AUTH-001`, `P1-AUTH-003`

### J-AUTH-002 New account creation and role choice

- `Role`: New user
- `Phase`: `Phase 1`
- `Entry`: `/auth/sign-in` then `/setup/role`
- `Flow`:
  1. `New user` signs in with Google or magic link.
  2. `System` creates the account.
  3. `System` routes to `/setup/role`.
  4. `User` chooses learner or tutor intent.
- `Outcome`: the account becomes role-aware and can enter the correct product lane.
- `Unhappy cases`:
  - user leaves before choosing a role
- `User sees`:
  - setup prompt: `Tell us how you'll use Mentor IB.`
  - incomplete setup: `Choose a role to continue.`
- `Task coverage`: `P1-AUTH-001`, `P1-AUTH-002`, `P1-AUTH-003`

### J-AUTH-003 Authenticated but role-pending user hits a protected route

- `Role`: Authenticated user without an active student or tutor role
- `Phase`: `Always`
- `Entry`: any protected student or tutor route
- `Flow`:
  1. `User` navigates directly to a protected route.
  2. `System` checks session and role state.
  3. `System` redirects the user to `/setup/role`.
- `Outcome`: product access is blocked until role setup is complete.
- `Unhappy cases`:
  - repeated deep-link attempts without setup completion
- `User sees`:
  - `You need to finish setup before using this area.`
- `Task coverage`: `P1-AUTH-002`, `P1-FOUND-001`

### J-ACC-001 Shared account settings, notifications, privacy, and billing

- `Role`: Signed-in student or tutor
- `Phase`: `Phase 1`
- `Entry`: `/settings`, `/notifications`, `/privacy`, `/billing`
- `Flow`:
  1. `User` opens the account menu.
  2. `User` clicks the account destination.
  3. `System` navigates to the selected shared account route.
- `Outcome`: the user manages account-level preferences and records inside the same ecosystem.
- `Unhappy cases`:
  - user expects role-specific operational tools from shared account pages
- `User sees`:
  - settings: `Update your account details and preferences.`
  - notifications: `Messages stay in chat. Product updates appear here.`
  - privacy: `Manage your data and privacy choices.`
  - billing: `View your payment-related records for this account.`
- `Task coverage`: `P1-ACCOUNT-001`, `P1-DATA-005`, `P1-NOTIF-001`

### J-ACC-002 Limited or suspended account access

- `Role`: Any signed-in user with limited or suspended access
- `Phase`: `Always`
- `Entry`: any private route
- `Flow`:
  1. `User` navigates to a private route.
  2. `System` detects limitation or suspension.
  3. `System` blocks or narrows access and routes the user to a safe surface.
- `Outcome`: the account cannot continue normal product actions until the restriction is resolved.
- `Unhappy cases`:
  - messaging-only block
  - listing hidden
  - payout hold
  - broader suspension
- `User sees`:
  - limited: `Some parts of your account are temporarily limited. Check notifications for the next step.`
  - suspended: `This account is currently suspended from normal use.`
- `Task coverage`: `P1-DATA-001`, `P1-FOUND-001`, `P2-OPS-002`

## 4. Student Journeys

### J-STU-001 Student home resume flow

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: student home
- `Flow`:
  1. `Student` signs in.
  2. `Student` lands on Home.
  3. `System` shows active need, next lesson, saved tutors, recommended tutors, and pending actions.
  4. `Student` clicks the most relevant continuation point.
- `Outcome`: the student resumes progress instead of restarting from scratch.
- `Unhappy cases`:
  - no active need yet
  - no upcoming lesson
- `User sees`:
  - empty state: `Start by telling us what kind of IB help you need.`
- `Task coverage`: `P1-PUBLIC-002`, `P1-FOUND-003`

### J-STU-002 Guided match flow completion

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: `/match`
- `Flow`:
  1. `Student` navigates to `/match`.
  2. `Student` clicks through problem selection, subject or component, urgency, support style, and language or timezone steps.
  3. `Student` submits the learning need.
  4. `System` navigates to results.
- `Outcome`: Mentor IB creates or updates an active `LearningNeed` and shows match results.
- `Unhappy cases`:
  - the student exits mid-flow
  - the student submits incomplete required fields
- `User sees`:
  - success: `Here are your best-fit tutors.`
  - validation: `Please complete the required steps to see your matches.`
- `Task coverage`: `P1-MATCH-001`, `P1-DATA-003`

### J-STU-003 Secondary browse and filter journey

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: browse or results route
- `Flow`:
  1. `Student` opens browse or results.
  2. `Student` changes filters or sort controls.
  3. `System` refreshes the result set using approved public or student-safe data.
- `Outcome`: the student can explore beyond the first recommendation set without leaving the shared discovery model.
- `Unhappy cases`:
  - filters narrow the result set to zero
- `User sees`:
  - empty state: `No tutors match this filter combination. Try widening your criteria.`
- `Task coverage`: `P1-MATCH-002`

### J-STU-004 Save and shortlist tutor candidates

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: results, tutor profile, or saved entry points
- `Flow`:
  1. `Student` clicks `Save`.
  2. `System` stores shortlist state tied to the student and active need.
  3. `Student` revisits the saved state later from Home or the relevant evaluation surface.
- `Outcome`: the student can continue evaluating tutors without losing context.
- `Unhappy cases`:
  - save action fails
- `User sees`:
  - success: `Tutor saved to your shortlist.`
  - failure: `We couldn't save this tutor right now. Please try again.`
- `Task coverage`: `P15-DATA-001`, `P15-COMP-001`

### J-STU-005 Compare shortlisted tutors

- `Role`: Student
- `Phase`: `Phase 1.5`
- `Entry`: results, profile, or `/compare`
- `Flow`:
  1. `Student` clicks `Compare` on shortlisted tutors.
  2. `System` adds them to the active compare set.
  3. `Student` navigates to `/compare`.
  4. `System` shows side-by-side fit, trust, availability, and pricing cues.
- `Outcome`: the student chooses a stronger next action with less comparison friction.
- `Unhappy cases`:
  - compare set is full
  - compare set is empty
- `User sees`:
  - compare full: `Your compare list is full. Remove one tutor to add another.`
  - compare empty: `Add tutors to compare them side by side.`
- `Task coverage`: `P15-DATA-001`, `P15-COMP-001`, `P15-COMP-002`

### J-STU-006 Tutor profile to booking handoff

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: `/tutors/[slug]`
- `Flow`:
  1. `Student` opens a tutor profile.
  2. `Student` reviews fit, trust proof, availability, and pricing.
  3. `Student` clicks `Book`.
  4. `System` navigates to `/book/[context]`.
- `Outcome`: the student enters booking with preserved tutor and learning-need context.
- `Unhappy cases`:
  - tutor is not taking new requests
  - booking context cannot be resolved safely
- `User sees`:
  - unavailable: `This tutor is not accepting new requests right now.`
  - invalid context: `We couldn't prepare this booking. Please return to the tutor profile and try again.`
- `Task coverage`: `P1-PUBLIC-003`, `P1-BOOK-001`

### J-STU-007 Student starts a conversation before booking

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: results, compare, tutor profile, or booking entry
- `Flow`:
  1. `Student` clicks `Message tutor`.
  2. `System` opens an existing conversation if one already exists, or creates the first student-initiated thread.
  3. `Student` sends the first message.
- `Outcome`: one persistent tutor-student conversation is created or reopened.
- `Unhappy cases`:
  - the tutor has blocked the student
  - account limitations block messaging
- `User sees`:
  - success: `Conversation started.`
  - blocked: `You can't message this tutor right now.`
- `Task coverage`: `P1-DATA-004`, `P1-MSG-001`, `P1-MSG-002`

### J-STU-008 Student message continuation, reply, block, and report

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: `/messages`
- `Flow`:
  1. `Student` navigates to `/messages`.
  2. `Student` opens a conversation.
  3. `Student` sends a reply, blocks the tutor, or reports abuse if needed.
- `Outcome`: the student can continue the real relationship conversation while retaining safety actions.
- `Unhappy cases`:
  - non-participant access
  - blocked conversation
- `User sees`:
  - denied access: 404 page
  - block confirmation: `You won't receive new messages from this user.`
  - report confirmation: `Report received. We'll review it.`
- `Task coverage`: `P1-MSG-001`, `P1-MSG-002`, `P2-OPS-001`

### J-STU-009 Booking request with payment authorization

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: `/book/[context]`
- `Flow`:
  1. `Student` chooses a lesson option and reviews request details.
  2. `Student` clicks `Request lesson`.
  3. `System` opens Stripe Checkout for payment authorization.
  4. `Student` completes the authorization step.
  5. `System` returns the student to the booking result state.
- `Outcome`: the lesson request is submitted and payment is authorized, but not captured yet.
- `Unhappy cases`:
  - invalid booking context
  - slot no longer available
  - payment authorization fails
- `User sees`:
  - success: `Request sent. Your payment method is authorized and will only be charged if the tutor accepts.`
  - unavailable slot: `This time is no longer available. Choose another slot.`
  - payment failure: `We couldn't place the payment hold. Try again or use another payment method.`
- `Task coverage`: `P1-BOOK-001`

### J-STU-010 Pending booking request waiting state

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: lessons hub, lesson detail, notifications
- `Flow`:
  1. `Student` opens Lessons after submitting a request.
  2. `System` shows the request as pending until tutor action or expiry.
  3. `Student` monitors status through Lessons and Notifications rather than manual tutor chasing.
- `Outcome`: the student can see a clear waiting state with expiry logic.
- `Unhappy cases`:
  - the tutor never responds before the cutoff
- `User sees`:
  - pending: `Waiting for tutor response.`
  - expiry warning: `This request will expire if the tutor does not respond in time.`
- `Task coverage`: `P1-BOOK-001`, `P1-LESS-001`, `P1-NOTIF-001`

### J-STU-011 Tutor response outcomes for a booking request

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: lessons hub or notifications
- `Flow`:
  1. `Tutor` accepts, declines, or does nothing.
  2. `System` updates the lesson state.
  3. `System` captures payment on acceptance, or releases authorization on decline or expiry.
- `Outcome`: the student gets one of three clear outcomes.
- `Unhappy cases`:
  - accepted but post-acceptance state fails to refresh immediately
- `User sees`:
  - accepted: `Lesson confirmed. Payment captured. Your join details will appear in Lessons.`
  - declined: `This request was declined. Your payment authorization has been released.`
  - expired: `This request expired because the tutor did not respond in time. Your payment authorization has been released.`
- `Task coverage`: `P1-BOOK-001`, `P1-TUTOR-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-STU-012 Lessons hub and lesson detail navigation

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: `/lessons`
- `Flow`:
  1. `Student` navigates to `/lessons`.
  2. `Student` filters or opens pending, upcoming, past, or cancelled lessons.
  3. `Student` opens lesson detail.
- `Outcome`: the student sees the shared lesson object and the next valid action.
- `Unhappy cases`:
  - no lessons yet
- `User sees`:
  - empty state: `You don't have lessons yet. Start by getting matched with a tutor.`
- `Task coverage`: `P1-LESS-001`

### J-STU-013 Join lesson and add to calendar

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: lesson detail
- `Flow`:
  1. `Student` opens an upcoming lesson.
  2. `Student` clicks `Join lesson` when the lesson is ready.
  3. `Student` optionally clicks `Add to calendar`.
  4. `System` opens the external meeting provider or calendar export. 
- `Outcome`: the student joins the tutor-provided session or saves the event to calendar.
- `Unhappy cases`:
  - meeting link missing
  - meeting link invalid
- `User sees`:
  - join ready: `Join lesson`
  - missing link: `Meeting link is not ready yet. We'll notify you when it becomes available.`
  - invalid link: `Meeting link needs attention.`
- `Task coverage`: `P1-LESS-002`

### J-STU-014 Student cancellation and reschedule outcome

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: lesson detail
- `Flow`:
  1. `Student` opens a confirmed lesson.
  2. `Student` clicks `Cancel` or `Reschedule` where allowed.
  3. `System` checks the `2-hour` policy window.
  4. `System` shows the confirmation popup.
  5. `Student` clicks on the relevant CTA on the confirmation popup
  6. `System` applies the correct payout and refund outcome.
- `Outcome`: the student sees the policy consequence before or after confirming the action.
- `Unhappy cases`:
  - cancellation is too close to lesson start for a full refund
- `User sees`:
  - `>= 2 hours`: `Lesson cancelled. Your full refund is on the way.`
  - `< 2 hours`: `This lesson is inside the 2-hour cancellation window. Cancelling now means no refund.`
- `Task coverage`: `P1-LESS-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-STU-015 Student reports a lesson issue

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: lesson detail
- `Flow`:
  1. `Student` opens a recent or active lesson.
  2. `Student` clicks `Report issue`.
  3. `Student` chooses tutor absent, wrong link, technical problem, partial lesson, or student-side issue.
  4. `System` creates or updates the lesson issue case.
- `Outcome`: the lesson issue enters the shared issue flow.
- `Unhappy cases`:
  - reporting window has passed
- `User sees`:
  - success: `Issue reported. We'll compare both sides before applying any outcome.`
  - window closed: `This lesson can no longer be reported from here.`
- `Task coverage`: `P1-LESS-001`, `P1-LESS-002`

### J-STU-016 Student receives lesson-issue resolution

- `Role`: Student
- `Phase`: `Phase 1`
- `Entry`: notifications and lesson detail
- `Flow`:
  1. `System` auto-resolves the issue if both sides materially agree, or internal review resolves it.
  2. `System` updates the lesson and payment outcome.
  3. `Student` opens the notification or lesson detail.
- `Outcome`: the student sees a clear result tied to the lesson issue outcome.
- `Unhappy cases`:
  - issue not resolved in the student's favor
- `User sees`:
  - refund outcome: `Lesson issue resolved. Your refund is being processed.`
  - no refund outcome: `Lesson issue resolved. This lesson remains payable under the current policy.`
- `Task coverage`: `P1-NOTIF-001`, `P1-NOTIF-002`, `P2-OPS-001`

### J-STU-017 Student review and continuity

- `Role`: Student
- `Phase`: `Phase 2`
- `Entry`: lesson detail or notification
- `Flow`:
  1. `Student` receives a review prompt after an eligible lesson.
  2. `Student` clicks `Leave review`.
  3. `Student` submits rating and optional comment.
  4. `System` records the review against the lesson.
- `Outcome`: the review becomes lesson-linked trust evidence.
- `Unhappy cases`:
  - lesson is not eligible for public review
- `User sees`:
  - prompt: `How did the lesson go?`
  - ineligible: `This lesson isn't eligible for a review.`
- `Task coverage`: `P2-TRUST-001`, `P2-REPORT-001`

### J-STU-018 Student rebooks or continues with the same tutor

- `Role`: Student
- `Phase`: `Phase 1` with stronger continuity in later phases
- `Entry`: lessons, messages, or tutor profile
- `Flow`:
  1. `Student` returns after a prior lesson.
  2. `Student` clicks `Book again` or re-enters the tutor's booking path.
  3. `System` preserves prior tutor context and current learning need where appropriate.
- `Outcome`: the product feels like continuity, not a fresh marketplace reset.
- `Unhappy cases`:
  - tutor no longer accepts new requests
- `User sees`:
  - blocked rebook: `This tutor isn't taking new lesson requests right now.`
- `Task coverage`: `P1-BOOK-001`, `P2-REPORT-001`

## 5. Tutor Journeys

### J-TUT-001 Tutor application start

- `Role`: Future tutor
- `Phase`: `Phase 2` with tutor-acquisition entry in `Phase 1`
- `Entry`: `/become-a-tutor` then `/tutor/apply`
- `Flow`:
  1. `Future tutor` clicks `Apply to Teach`.
  2. `System` routes through shared sign-in if needed.
  3. `Tutor` lands on `/tutor/apply`.
  4. `Tutor` starts the staged application flow.
- `Outcome`: the tutor enters the formal application path.
- `Unhappy cases`:
  - authenticated account lacks the needed tutor setup state
- `User sees`:
  - start: `Let's get your tutor application started.`
- `Task coverage`: `P1-PUBLIC-001`, `P1-AUTH-001`, `P2-APPLY-001`

### J-TUT-002 Tutor saves, resumes, and submits the application

- `Role`: Tutor applicant
- `Phase`: `Phase 2`
- `Entry`: `/tutor/apply`
- `Flow`:
  1. `Tutor` completes one staged section at a time.
  2. `Tutor` clicks `Save and continue` or leaves and returns later.
  3. `Tutor` clicks `Submit application`.
  4. `System` records the application as submitted.
- `Outcome`: the application moves from draft to submitted without becoming one giant brittle form.
- `Unhappy cases`:
  - missing required sections
- `User sees`:
  - save: `Progress saved.`
  - submit: `Application submitted. We'll notify you about the next step.`
  - validation: `Please complete the required sections before submitting.`
- `Task coverage`: `P2-APPLY-001`

### J-TUT-003 Tutor review-pending and changes-requested states

- `Role`: Tutor applicant
- `Phase`: `Phase 2`
- `Entry`: application status surface
- `Flow`:
  1. `Tutor` opens the application status.
  2. `System` shows `pending review`, `changes requested`, `approved`, or `rejected`.
  3. `Tutor` follows the next action if changes are required.
- `Outcome`: the tutor sees one clear, shaped status rather than internal review language.
- `Unhappy cases`:
  - application rejected
- `User sees`:
  - pending: `Your application is under review.`
  - changes requested: `Changes requested. Update the highlighted sections to continue review.`
  - rejected: `We can't approve this application right now.`
- `Task coverage`: `P2-APPLY-001`, `P2-APPLY-002`

### J-TUT-004 Tutor approved but payout setup missing

- `Role`: Approved tutor
- `Phase`: `Phase 1` operational rule with stronger UI in `Phase 2`
- `Entry`: tutor dashboard and earnings area
- `Flow`:
  1. `Admin` approves the tutor.
  2. `Tutor` signs in and opens tutor mode.
  3. `System` grants dashboard access but keeps public listing gated.
  4. `Tutor` sees the payout-readiness CTA.
- `Outcome`: the tutor can enter operations but is not publicly bookable until payout readiness is completed.
- `Unhappy cases`:
  - tutor assumes approval automatically means public listing
- `User sees`:
  - `You're approved to teach, but you need to finish payout setup before becoming publicly bookable.`
- `Task coverage`: `P2-APPLY-002`, `P1-TUTOR-005`

### J-TUT-005 Tutor payout onboarding completion

- `Role`: Approved tutor
- `Phase`: `Phase 1` operational rule with stronger UI in `Phase 2`
- `Entry`: `/tutor/overview` or Earnings
- `Flow`:
  1. `Tutor` clicks the payout setup CTA.
  2. `System` sends the tutor into Stripe hosted onboarding.
  3. `Tutor` completes the required payout information.
  4. `System` marks payout readiness complete and can allow listing.
- `Outcome`: the tutor becomes payout-ready and eligible for public listing.
- `Unhappy cases`:
  - tutor abandons setup
  - payout country or verification issue blocks completion
- `User sees`:
  - success: `Payout setup complete. Your listing can now go live.`
  - incomplete: `Finish payout setup to become publicly bookable.`
  - blocked: `We couldn't complete payout setup yet. Check the required information and try again.`
- `Task coverage`: `P1-TUTOR-005`

### J-TUT-006 Tutor overview next-actions journey

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: `/tutor/overview`
- `Flow`:
  1. `Tutor` opens Overview.
  2. `System` shows next lesson, pending requests, unread messages, availability issues, profile health, and earnings snapshot.
  3. `Tutor` clicks into the highest-priority action.
- `Outcome`: the tutor starts from a teaching workflow, not a blank admin surface.
- `Unhappy cases`:
  - no requests or lessons yet
- `User sees`:
  - empty state: `You're ready for your first student request.`
- `Task coverage`: `P1-TUTOR-001`

### J-TUT-007 Tutor reviews a booking request

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: `/tutor/lessons` or Overview
- `Flow`:
  1. `Tutor` clicks a pending request.
  2. `System` shows student need, timing, request cutoff, pricing, and lesson context.
  3. `Tutor` clicks `Accept` or `Decline`.
- `Outcome`: the request moves to a confirmed lesson or a declined request.
- `Unhappy cases`:
  - tutor takes no action before the cutoff
- `User sees`:
  - accept: `Lesson confirmed. Student payment has been captured.`
  - decline: `Request declined. The student's payment authorization has been released.`
  - expiry: `This request expired because no decision was made before the cutoff.`
- `Task coverage`: `P1-TUTOR-002`, `P1-BOOK-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-TUT-008 Tutor lesson hub and lesson detail management

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: `/tutor/lessons`
- `Flow`:
  1. `Tutor` opens Requests and Lessons.
  2. `Tutor` navigates between pending, upcoming, past, and cancelled states.
  3. `Tutor` opens lesson detail for meeting access and next action.
- `Outcome`: the tutor manages lesson lifecycle from one operational hub.
- `Unhappy cases`:
  - no upcoming lessons
- `User sees`:
  - empty state: `No lessons here yet. New requests will appear in this hub.`
- `Task coverage`: `P1-TUTOR-002`

### J-TUT-009 Tutor messaging and reply flow

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: `/tutor/messages`
- `Flow`:
  1. `Tutor` opens Messages.
  2. `Tutor` selects an existing student conversation.
  3. `Tutor` replies in the shared persistent thread.
- `Outcome`: the tutor communicates inside the existing relationship thread.
- `Unhappy cases`:
  - tutor tries to start a brand-new cold conversation
- `User sees`:
  - restriction: `You can reply in existing conversations, but you can't start new outbound student chats here.`
- `Task coverage`: `P1-TUTOR-004`, `P1-MSG-002`

### J-TUT-010 Tutor schedule management

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: `/tutor/schedule`
- `Flow`:
  1. `Tutor` opens Schedule.
  2. `Tutor` sets recurring availability.
  3. `Tutor` adds date-specific exceptions or blackout periods.
  4. `System` shows booking preview behavior.
- `Outcome`: availability becomes explicit and bookable.
- `Unhappy cases`:
  - schedule rules conflict or leave no bookable slots
- `User sees`:
  - save: `Schedule updated.`
  - empty coverage: `No bookable availability is currently visible to students.`
- `Task coverage`: `P1-TUTOR-003`

### J-TUT-011 Tutor meeting-link management

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: schedule, lesson detail, or tutor settings
- `Flow`:
  1. `Tutor` saves a default meeting link or sets a lesson-specific override.
  2. `System` validates the provider and URL.
  3. `System` stores the link in the lesson-scoped meeting model when relevant.
- `Outcome`: students get a consistent join action without exposing public media or unsafe links.
- `Unhappy cases`:
  - link is invalid
  - link is missing for a confirmed lesson
- `User sees`:
  - invalid: `Enter a valid secure meeting link.`
  - missing: `Add a meeting link before this lesson can be joined.`
- `Task coverage`: `P1-TUTOR-003`, `P1-LESS-002`

### J-TUT-012 Tutor cancellation and lesson-issue reporting

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: lesson detail
- `Flow`:
  1. `Tutor` opens a lesson.
  2. `Tutor` clicks `Cancel` if the lesson cannot go ahead, or `Report issue` if the lesson failed operationally.
  3. `System` applies cancellation or issue-case logic.
- `Outcome`: the lesson enters a clear cancellation or issue path with policy consequences.
- `Unhappy cases`:
  - repeated tutor-fault cancellations or no-shows
- `User sees`:
  - cancel: `Lesson cancelled. The student will be refunded.`
  - issue report: `Issue reported. The final outcome will depend on the lesson review result.`
- `Task coverage`: `P1-TUTOR-002`, `P1-LESS-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-TUT-013 Tutor students roster

- `Role`: Active tutor
- `Phase`: `Phase 1.5`
- `Entry`: `/tutor/students`
- `Flow`:
  1. `Tutor` opens Students.
  2. `System` shows a roster of active and recent student relationships.
  3. `Tutor` filters or searches the roster.
- `Outcome`: the tutor sees relationship continuity, not just isolated lessons.
- `Unhappy cases`:
  - no student relationships yet
- `User sees`:
  - empty state: `Your students will appear here once you start teaching.`
- `Task coverage`: `P15-STUD-001`, `P15-STUD-002`

### J-TUT-014 Tutor student detail relationship view

- `Role`: Active tutor
- `Phase`: `Phase 1.5`
- `Entry`: `/tutor/students`
- `Flow`:
  1. `Tutor` clicks a student in the roster.
  2. `System` opens the relationship detail surface.
  3. `Tutor` reviews lesson history, messages, and continuity context.
- `Outcome`: the tutor gets one lightweight teaching CRM view for that relationship.
- `Unhappy cases`:
  - stale or inaccessible student relationship
- `User sees`:
  - denied access: 404 page
- `Task coverage`: `P15-STUD-003`

### J-TUT-015 Tutor earnings and payout history

- `Role`: Active tutor
- `Phase`: `Phase 1`
- `Entry`: earnings route or finance section
- `Flow`:
  1. `Tutor` opens Earnings.
  2. `System` shows payout readiness, earnings balance, payout cycle information, and transaction history.
  3. `Tutor` reviews payout status.
- `Outcome`: the tutor understands what has been earned, what is pending, and whether payout readiness is complete.
- `Unhappy cases`:
  - payout hold or missing setup
- `User sees`:
  - hold: `Payouts are temporarily on hold. Check notifications for the next step.`
- `Task coverage`: `P1-TUTOR-005`

### J-TUT-016 Tutor review, report, profile, credential, and intro-video management

- `Role`: Active tutor
- `Phase`: `Phase 2`
- `Entry`: reviews and outcomes, public profile, credentials
- `Flow`:
  1. `Tutor` opens the relevant management surface.
  2. `Tutor` reviews public reviews and lesson outcomes, edits the public profile, uploads credentials, or adds an intro video link.
  3. `System` keeps public and private data boundaries intact.
- `Outcome`: the tutor can improve public quality and teaching continuity without leaving the shared ecosystem.
- `Unhappy cases`:
  - unsupported media link
  - credential rejected
- `User sees`:
  - video error: `This video link isn't supported. Use a supported public video provider.`
  - credential rejection: `This credential needs an update before it can count as approved proof.`
- `Task coverage`: `P2-PROFILE-001`, `P2-MEDIA-001`, `P2-TRUST-001`, `P2-REPORT-001`

## 6. Admin Journeys

### J-INT-001 Internal access gate

- `Role`: Admin
- `Phase`: `Internal`
- `Entry`: `/internal/*`
- `Flow`:
  1. `Internal operator` navigates to an internal route.
  2. `System` verifies authentication, internal role, and capability.
  3. `System` grants or denies access.
- `Outcome`: internal surfaces remain capability-gated and non-public.
- `Unhappy cases`:
  - operator lacks the required capability
- `User sees`:
  - denied: 404 page
- `Task coverage`: `P1-FOUND-001`, `P2-APPLY-002`, `P2-OPS-001`, `P2-OPS-002`, `P2-OPS-003`

### J-INT-002 Tutor review queue

- `Role`: Admin
- `Phase`: `Phase 2` and `Internal`
- `Entry`: `/internal/tutor-reviews`
- `Flow`:
  1. `Admin` opens the tutor review queue.
  2. `System` shows pending applications and credential review cues.
  3. `Admin` claims or opens a review item.
- `Outcome`: tutor review work is queue-driven and attributable.
- `Unhappy cases`:
  - queue item already claimed or resolved
- `User sees`:
  - stale item: `This review item is no longer available in its previous state.`
- `Task coverage`: `P2-APPLY-002`

### J-INT-003 Tutor application approval, rejection, and changes requested

- `Role`: Admin
- `Phase`: `Phase 2` and `Internal`
- `Entry`: tutor review detail
- `Flow`:
  1. `Admin` opens a tutor application.
  2. `Admin` clicks `Approve`, `Request changes`, or `Reject`.
  3. `System` records the state transition and audit trail.
  4. `System` notifies the tutor with shaped status and next steps.
- `Outcome`: the tutor application moves through an explicit review state.
- `Unhappy cases`:
  - insufficient evidence for approval
- `User sees`:
  - internal confirmation: `Decision recorded.`
  - tutor-facing result is sent through Notifications, not tutor-student chat
- `Task coverage`: `P2-APPLY-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-INT-004 Credential review

- `Role`: Admin
- `Phase`: `Phase 2` and `Internal`
- `Entry`: tutor review detail or credentials queue
- `Flow`:
  1. `Admin` opens a credential item.
  2. `Admin` approves, rejects, or flags it for more information.
  3. `System` records the review outcome.
- `Outcome`: the tutor's trust proof is reviewed without exposing private files publicly.
- `Unhappy cases`:
  - invalid or expired credential
- `User sees`:
  - internal confirmation: `Credential review updated.`
- `Task coverage`: `P2-APPLY-002`, `P2-MEDIA-001`

### J-INT-005 Public listing pause, delist, and restore

- `Role`: Admin
- `Phase`: `Internal`
- `Entry`: tutor review, user detail, or moderation queue
- `Flow`:
  1. `Admin` opens a tutor's internal record.
  2. `Admin` changes listing state to paused, delisted, or restorable.
  3. `System` updates public visibility and downstream SEO eligibility.
- `Outcome`: public tutor visibility is controllable without deleting the account.
- `Unhappy cases`:
  - operator lacks listing capability
- `User sees`:
  - tutor-facing notification: `Your public listing is currently paused. Check notifications for the next step.`
- `Task coverage`: `P2-APPLY-002`, `P2-PROFILE-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-INT-006 Abuse-report moderation

- `Role`: Admin
- `Phase`: `Internal`
- `Entry`: `/internal/moderation`
- `Flow`:
  1. `Admin` opens the moderation queue.
  2. `Admin` reviews message-related or user-behavior reports.
  3. `Admin` resolves, escalates, or applies the approved action.
- `Outcome`: trust-and-safety cases are handled through explicit internal state transitions.
- `Unhappy cases`:
  - insufficient evidence
- `User sees`:
  - internal resolution: `Report outcome recorded.`
  - reporter-facing message stays shaped and minimal
- `Task coverage`: `P2-OPS-001`

### J-INT-007 Lesson-issue review for conflicting claims

- `Role`: Admin
- `Phase`: `Internal`
- `Entry`: moderation or operational review surface
- `Flow`:
  1. `Internal operator` opens a lesson issue case that could not auto-resolve.
  2. `Internal operator` reviews both claims and relevant lesson evidence.
  3. `Internal operator` resolves the case.
  4. `System` applies refund, payout, and trust consequences based on the resolution outcome.
- `Outcome`: unresolved no-show or wrong-link disputes gain a clear final outcome.
- `Unhappy cases`:
  - evidence remains insufficient
- `User sees`:
  - internal confirmation: `Lesson issue resolved.`
  - participant-facing message: `Lesson issue resolved. Check lesson detail for the outcome.`
- `Task coverage`: `P2-OPS-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-INT-008 Internal user lookup and account intervention

- `Role`: Admin
- `Phase`: `Internal`
- `Entry`: `/internal/users/[id]`
- `Flow`:
  1. `Operator` opens a user record.
  2. `System` shows role-scoped internal DTOs.
  3. `Operator` reviews account state, relevant activity, and permitted actions.
- `Outcome`: internal support can inspect and resolve real user cases without unrestricted raw-table access.
- `Unhappy cases`:
  - operator expects fields outside their capability scope
- `User sees`:
  - internal restriction: 404 page
- `Task coverage`: `P2-OPS-002`

### J-INT-009 Finance or payout anomaly intervention

- `Role`: Admin
- `Phase`: `Internal`, later operational layer
- `Entry`: internal finance or user detail surface
- `Flow`:
  1. `Admin` reviews a payout hold, billing anomaly, or reconciliation issue.
  2. `Admin` records the intervention outcome.
  3. `System` updates payout or account state and notifies the tutor where appropriate.
- `Outcome`: money-affecting states are handled through auditable internal actions.
- `Unhappy cases`:
  - missing finance capability
- `User sees`:
  - tutor-facing notice: `Payouts are temporarily on hold. Check notifications for the next step.`
- `Task coverage`: `P2-OPS-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-INT-010 Terms or privacy update broadcast

- `Role`: Admin
- `Phase`: `Internal`
- `Entry`: internal policy or content publish workflow
- `Flow`:
  1. `Admin` publishes an updated terms or privacy notice.
  2. `System` creates the required product notification.
  3. `Users` receive the update in Notifications and email.
  4. `Users` also see a visible post-login notice the next time they sign in.
- `Outcome`: policy changes are communicated through the proper notification channel, not through chat.
- `User sees`:
  - `We've updated our terms or privacy policy. Review the latest version.`
- `Task coverage`: `P2-OPS-003`, `P1-ACCOUNT-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### J-INT-011 Reference-data management

- `Role`: Admin
- `Phase`: `Internal`
- `Entry`: `/internal/reference-data`
- `Flow`:
  1. `Admin` opens the reference-data surface.
  2. `Admin` updates canonical values such as subjects, subject focus areas, languages, countries, meeting providers, or video media providers.
  3. `System` validates the change, records the audit trail, and updates the shared reference source.
- `Outcome`: shared vocabularies stay editable through the product instead of through ad hoc code edits.
- `Unhappy cases`:
  - attempted duplicate or invalid reference key
  - unauthorized internal actor
- `User sees`:
  - success: `Reference data updated.`
  - denied: 404 page
- `Task coverage`: `P2-OPS-003`

## 7. System-Driven Notification Journeys

### N-001 New message notification | Message in the chats

- `Recipients`: student or tutor participant
- `Trigger`: a new message arrives in an active conversation
- `Outcome`: unread state updates and a message notification is sent inside the product only
- `User sees`: `You have a new message.`
- `Task coverage`: `P1-MSG-002`

### N-002 Lesson request submitted | System notification, bell icon

- `Recipients`: student and tutor
- `Trigger`: a student submits a booking request and completes payment authorization
- `Outcome`: tutor is prompted to review; student gets acknowledgement through in-app notification and email
- `User sees`:
  - student: `Request sent.`
  - tutor: `New lesson request waiting for review.`
- `Task coverage`: `P1-BOOK-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-003 Lesson accepted | System notification, bell icon

- `Recipients`: student
- `Trigger`: tutor accepts the request
- `Outcome`: payment is captured and the lesson becomes confirmed through in-app notification and email
- `User sees`: `Lesson confirmed.`
- `Task coverage`: `P1-BOOK-001`, `P1-TUTOR-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-004 Lesson declined | System notification, bell icon

- `Recipients`: student
- `Trigger`: tutor declines the request
- `Outcome`: authorization is released and the student is notified in-app and by email
- `User sees`: `Request declined. Your payment authorization has been released.`
- `Task coverage`: `P1-BOOK-001`, `P1-TUTOR-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-005 Lesson auto-cancelled on expiry | System notification, bell icon

- `Recipients`: student and tutor
- `Trigger`: the tutor does not respond before the request cutoff
- `Outcome`: request expires, authorization is released, and both sides are notified in-app and by email
- `User sees`: `Request expired.`
- `Task coverage`: `P1-BOOK-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-006 Lesson cancelled or rescheduled | System notification, bell icon

- `Recipients`: student and tutor
- `Trigger`: either participant cancels or an approved reschedule flow updates lesson timing
- `Outcome`: both sides see the new lesson state through in-app notification and email
- `User sees`: `Lesson updated.`
- `Task coverage`: `P1-LESS-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-007 Upcoming lesson reminder | System notification, bell icon

- `Recipients`: student and tutor
- `Trigger`: reminder job reaches the lesson's due window
- `Outcome`: both participants get the reminder through approved in-app and email channels
- `User sees`: `Your lesson starts soon.`
- `Task coverage`: `P1-NOTIF-001`, `P1-NOTIF-002`, `P1-LESS-002`

### N-008 Lesson issue acknowledgement | System notification, bell icon

- `Recipients`: reporting participant
- `Trigger`: a lesson issue is submitted
- `Outcome`: the reporter gets confirmation that the issue entered the lesson-case flow through in-app notification and email
- `User sees`: `Issue reported.`
- `Task coverage`: `P1-LESS-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-009 Lesson issue resolution | System notification, bell icon

- `Recipients`: lesson participants
- `Trigger`: the lesson issue resolves automatically or through internal review
- `Outcome`: participants see the final outcome in context through in-app notification and email
- `User sees`: `Lesson issue resolved.`
- `Task coverage`: `P2-OPS-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-010 Review submitted | System notification, bell icon

- `Recipients`: tutor
- `Trigger`: a student submits a lesson-linked review
- `Outcome`: tutor is notified about new review activity through in-app notification and email
- `User sees`: `A new review has been submitted.`
- `Task coverage`: `P2-TRUST-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-011 Tutor application submitted | System notification, bell icon

- `Recipients`: tutor applicant
- `Trigger`: application submission
- `Outcome`: applicant gets confirmation and waiting-state reassurance through in-app notification and email
- `User sees`: `Application submitted.`
- `Task coverage`: `P2-APPLY-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-012 Tutor application changes requested, approved, or rejected | System notification, bell icon

- `Recipients`: tutor applicant
- `Trigger`: internal review decision
- `Outcome`: the tutor receives shaped application status through in-app notification and email, not raw internal notes
- `User sees`:
  - changes requested: `Changes requested on your application.`
  - approved: `You're approved to teach.`
  - rejected: `Your application wasn't approved.`
- `Task coverage`: `P2-APPLY-002`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-013 Payout processed | System notification, bell icon

- `Recipients`: tutor
- `Trigger`: payout cycle completes
- `Outcome`: tutor gets payout confirmation through in-app notification and email
- `User sees`: `Your payout has been processed.`
- `Task coverage`: `P1-TUTOR-005`, `P1-NOTIF-001`, `P1-NOTIF-002`

### N-014 Terms or privacy updated | System notification, email, and post-login notice

- `Recipients`: student and tutor
- `Trigger`: policy update publication
- `Outcome`: users see the required legal update in Notifications, by email, and through a visible post-login notice
- `User sees`: `We've updated our terms or privacy policy.`
- `Task coverage`: `P2-OPS-003`, `P1-ACCOUNT-001`, `P1-NOTIF-001`, `P1-NOTIF-002`

## 8. Explicitly Unsupported Or Deferred Journeys

These paths should not be implemented as if they already exist:

- parent or guardian payer flow
- tutor auto-approval of bookings by default
- tutor cold-outreach messaging to students
- message attachments in MVP
- native Mentor IB video conferencing
- calendar two-way sync in MVP
- a stored-value wallet model
- tutor-specific cancellation policies
- recurring subscription packages by default
- a giant generic admin suite

## 9. Primary Outcome Of This Inventory

If a future AI agent asks, "What are the actual journeys this system must support?", this file should be the first canonical answer.

The implementation rule is:

- route structure alone is not enough
- task packs alone are not enough
- shared objects alone are not enough

The product needs the journeys, outcomes, and failure states to stay explicit.
