# Mentor IB End-to-End Use-Case Gap Audit v1

**Date:** 2026-04-11
**Status:** Cross-role product-flow audit before implementation
**Scope:** end-to-end student, tutor, admin, and support flows; booking, billing, cancellations, no-shows, tutor approval, notifications, mobile navigation, search versus match, and operational edge cases

## 1. Why This Document Exists

Mentor IB now has a large design, architecture, data, and planning corpus.

That is a strength, but it also creates a real implementation risk:

- some flows are fully defined
- some flows are structurally modeled but not policy-complete
- some flows are referenced in one document family but not yet reflected in the backlog or canonical status model

This audit exists to answer one practical question before coding expands:

**Do the current docs fully cover the real user and operator flows the product needs, or are there remaining policy gaps that would cause avoidable rework?**

## 2. Audit Method

This audit checked:

- product and UX foundations
- architecture docs
- data and status-model docs
- planning and phase-pack docs
- current hi-fi comps where they imply product behavior

It also checked current external references for 2026-relevant guidance on:

- Stripe onboarding and payout-country posture
- Stripe hosted payment flows
- mobile primary-navigation patterns
- tutoring-marketplace cancellation and issue-handling patterns

## 3. Executive Summary

The current Mentor IB documentation is strong on:

- shared cross-role object model
- match-first product positioning
- search boundaries
- message versus notification separation
- meeting-link and calendar posture
- moderation and approval architecture

The biggest remaining gaps are not "missing screens."

They are **product-policy gaps** in flows where money, trust, or operational failure are involved.

Decision update after product review on `2026-04-11`:

- conversation entry before booking is student-initiated and tutor-level, not lesson-level
- booking stays tutor-approved for now
- payment is authorized at booking request and captured on tutor acceptance
- unresolved requests should expire before lesson start and release the authorization
- parent or guardian payer flow is deferred
- student mobile keeps bottom navigation, while tutor mobile becomes hamburger-driven and desktop-primary

The following areas have been resolved since the original audit:

1. lesson-issue and dispute object model → resolved in `docs/data/lesson-issue-and-dispute-model-v1.md`
2. tutor listing gate and payout readiness → resolved in `docs/data/tutor-listing-readiness-model-v1.md`
3. internal trust thresholds and recovery math → resolved in `docs/data/tutor-reliability-thresholds-v1.md`
4. payment scope and Phase 1 billing → resolved in `docs/planning/phase1-payment-scope-decision-v1.md`
5. Phase 1 task pack now includes background job infrastructure (`P1-JOBS-001`) and SEO/AI discoverability foundations (`P1-SEO-001`)
6. Stripe Connect Express onboarding is explicitly quick: pre-fill tutor data, tutor only provides verification docs and bank account
7. tutor mobile navigation anti-pattern locked in design system (no bottom nav on tutor mobile)

The planning mismatch between architecture and backlog is now resolved:

- Phase 1 ships real payment (authorization at booking request, capture on tutor acceptance)
- Phase 1 task pack explicitly includes payment-bearing booking, Stripe Connect quick onboarding, and webhook handling

## 4. Coverage Matrix

| Use-case family | Coverage state | Current strength | Current gap or risk | Recommendation |
|---|---|---|---|---|
| Auth and role resolution | `mostly_defined` | Shared auth and role-confirmation posture exists | Dual-role edge behavior and payer-versus-learner nuance are still light | Keep current auth direction; do not widen scope yet |
| Student discovery and matching | `strong` | Match-first positioning is clear and consistent | Logged-in student default destination is still slightly open in IA | Keep `Get Matched` primary and close the signed-in home default soon |
| Browse and search | `strong` | Search is clearly secondary to matching, with constrained fields and scoped query surfaces | None at blocker level | Keep current direction |
| Tutor profile evaluation and compare | `strong` | Public profile, compare, trust proof, and fit rationale are well covered | None at blocker level | Keep current direction |
| Booking request submission | `decided` | Shared lesson object and request-review model are clear | Must stay aligned with request-expiry and authorization-release behavior | Keep tutor approval as the MVP booking model |
| Payment capture and lesson confirmation | `mostly_defined` | Payment now follows request-time authorization and tutor-accept capture | Backlog and schema layers must stay aligned with this flow | Keep hosted Checkout plus capture on acceptance |
| Cancellation, reschedule, and no-show | `mostly_defined` | Platform-wide 2-hour cancellation and no-show direction now exists | Reporting-window timing and implementation details must stay aligned with the shared lesson-issue flow | Keep one platform rule set, not tutor-specific policies |
| Lesson delivery and meeting access | `mostly_defined` | External meeting-link model is clear and practical, and a shared lesson-issue flow now exists | Exact reporting-window timing and review operations still need implementation discipline | Keep the lesson-scoped issue flow tied to the lesson object |
| Messaging versus notifications | `decided` | System notifications are already separated from user conversations | Keep tutor cold outreach out of MVP | Keep the split |
| Tutor application flow | `partial` | IA and future task pack both support staged onboarding and a readiness checklist | Missing-info and request-changes lifecycle is not fully canonicalized | Add tutor-facing application status and missing-items policy |
| Tutor approval and public listing | `partial` | Approval, credential review, and public listing are correctly separated | Tutor-facing explanation of "approved to teach but not publicly listed" needs a clearer product rule | Add a tutor-facing readiness and listing-state model |
| Tutor payout onboarding | `partial` | Hosted Stripe onboarding with payout-readiness gating is now clear | Exact launch-country scope and rollout timing still need operational confirmation | Use hosted onboarding and block public listing until payout readiness is complete |
| Tutor operational continuity | `partial` | Overview, lessons, students, schedule, and reports are well modeled structurally | Fast rebook or repeat-lesson policy is still light | Start with one-off lessons plus fast rebook, not subscriptions |
| Admin, moderation, and trust operations | `strong` | Queue-driven approval, moderation, and auditability are well covered | Tutor-facing reflection of internal review outcomes is still partial | Keep internal architecture; improve outward-facing status clarity |
| Parent or guardian billing | `decided` | Scope is intentionally simple for now | Revisit only if a later billing model requires it | Keep one tutor, one student, no parent payer flow in MVP |
| Mobile primary navigation | `decided` | Student and tutor mobile behavior is now intentionally different | Ensure the implementation does not accidentally reintroduce tutor bottom nav | Student bottom nav with scroll-hide, tutor hamburger menu |

## 5. Concrete Recommendations For The Highest-Risk Flows

## 5.1 Booking should stay request-first in MVP

The current service blueprint already leans this way:

- student sends booking request
- tutor reviews request
- lesson moves toward confirmation

That is the right default for Mentor IB because the product is:

- match-first rather than instant-marketplace-first
- built around external tutor-owned meeting links
- expected to support nuanced IB contexts and urgency
- not yet using a fully automated payout and attendance stack

**Decision**

- do not auto-approve lessons in MVP
- use tutor approval as the default

**Additional rules that should be made explicit**

- booking request expiry window
- reminder timing for unanswered requests
- what happens if the tutor accepts but payment is not completed
- whether the schedule slot is temporarily held during payment completion

## 5.2 Payment should sit between tutor acceptance and final lesson confirmation

The architecture now says payment should work like this:

- student places the request and payment authorization once
- tutor accepts or declines inside the request window
- acceptance captures payment
- decline or timeout releases the authorization

But the current task packs do not yet reflect that.

For MVP, the product flow is:

1. student submits booking request
2. student completes the payment-authorization step once
3. tutor accepts or declines
4. acceptance captures payment and confirms the lesson
5. decline or timeout releases the authorization

## 5.3 Use one platform-wide cancellation and no-show policy

Mentor IB should not start with tutor-specific cancellation rules.

That would:

- add decision friction for students
- make trust harder to understand
- complicate refunds and support
- create ranking ambiguity

**Current product direction**

- student cancels or reschedules `>= 2 hours` before lesson start: full refund
- student cancels `< 2 hours` before lesson start: no refund and tutor is paid
- tutor cancels at any time: full refund to the student and reliability penalty path
- tutor no-show: full refund to the student and reliability penalty path
- student no-show: tutor receives full payment

## 5.4 No-show handling needs a dispute-aware product flow

Because Mentor IB does **not** run the actual video room, it cannot reliably auto-detect attendance from first-party call telemetry.

That means "no-show" is not only a status question.

It is a support and evidence question.

**Current product direction**

- add a product-facing lesson-issue flow for:
  - tutor absent
  - student absent
  - wrong or missing meeting link
  - major technical failure
  - lesson delivered only partially
- let both participants report through the lesson surface rather than generic support only
- auto-resolve when both sides materially agree
- send conflicting claims to internal review
- auto-cancel unresolved requests when the tutor has not accepted by `2` hours before lesson start
- do not let one-sided raw accusations immediately affect tutor ranking
- record reliability penalties only after policy-qualified or reviewed outcomes

The current docs now treat this as a normal lesson-operations flow rather than a vague support edge case.

## 5.5 Tutor ranking should be penalized for confirmed tutor-fault reliability problems

This direction already fits the trust architecture.

The important qualifier is that the penalty should be:

- dispute-aware
- threshold-aware
- internal first

**Recommendation**

- repeated tutor no-shows, repeated late cancellations, and repeated response timeouts should lower internal trust and ranking eligibility
- student no-shows should never hurt tutor rank
- one-off disputed incidents should not immediately collapse public visibility
- public trust proof should stay curated; the raw penalty math should remain internal

## 5.6 Tutor Stripe onboarding should be hosted, late in the funnel, and country-gated

Mentor IB should not ask tutors to fill payment-compliance forms during the first application step.

That adds friction too early.

The easier product sequence is:

1. tutor completes product application
2. admin approves tutor capability
3. tutor completes profile and schedule readiness
4. payout setup is requested only when payout readiness truly matters
5. Stripe-hosted onboarding collects the regulated payout details

**Current product direction**

- keep tutor product onboarding separate from Stripe onboarding
- use Stripe-hosted onboarding rather than a custom KYC form
- keep the tutor off public discovery until payout readiness is complete

## 5.7 Tutor application review needs a request-changes status that is canonical everywhere

Current docs are close, but not fully aligned.

Examples:

- the admin architecture supports `needs_more_information` at credential-review level
- the Phase 2 application-review task expects `request-changes`
- the glossary does not yet make that application-facing state canonical

**Current product direction**

- add a canonical tutor-facing status such as `changes_requested`
- keep internal credential-review detail separate from the simpler tutor-facing application state
- show missing items in:
  - application dashboard status
  - readiness checklist
  - notification center
- do not route this through ordinary tutor-student chat

## 5.8 Notifications and messages should remain separate

The current architecture is already correct here.

**Recommendation**

- messages remain only for tutor-student relationship conversations
- system events go to notifications
- critical operational events may also send email
- notification click-through should open the relevant object detail, not create fake "system chat"

This is especially important for:

- tutor application review updates
- booking approval or decline
- payment-needed follow-up
- lesson cancellation or meeting-link change

## 5.9 Bottom navigation should be the mobile primary-navigation baseline

The current IA already points in the right direction.

**Current product direction**

- student mobile uses bottom navigation as the primary navigation model
- student bottom navigation may hide or shrink on scroll
- tutor mobile should not use a dense bottom navigation pattern
- tutor mobile should use a hamburger or drawer model and remain desktop-primary for heavier operational work

## 5.10 Match should stay primary and search should stay secondary

This is one of the best-defined areas in the current docs.

**Recommendation**

- keep `Get Matched` as the primary discovery path
- keep `Browse Tutors` visible but secondary
- do not let signed-in home or search UI accidentally reposition the product as a catalog-first marketplace

## 6. Additional Gaps Found Beyond The Sample Questions

## 6.1 Conversation initiation rules are now mostly resolved

The current product direction is:

- students may initiate the first conversation from profile, match, compare, or booking entry
- tutors respond inside that existing conversation
- the conversation is tied to the student-tutor relationship, not to a single lesson
- broad tutor cold outreach should remain out of MVP

## 6.2 Parent or guardian payer scope is now intentionally deferred

The product is minor-aware, but the current payment-bearing scope is intentionally simpler than a guardian-managed billing model.

Current product direction:

- MVP stays simple with one tutor and one student
- parent or guardian payer flow is not part of the current payment-bearing scope

## 6.3 Fast rebook and repeat-lesson behavior is not yet explicit enough

The product promises continuity, but the docs are still light on:

- whether lessons are one-off only
- whether recurring lesson series exist in MVP
- how a repeat lesson is initiated after a successful relationship starts

**Recommendation**

- Phase 1 should support one-off lessons plus fast rebook
- recurring series or subscription logic should stay later unless the business model proves it is essential

## 6.4 Default schedule-policy values — resolved

Decision confirmed on `2026-04-13`:

- minimum booking notice: **8 hours** — slots closer than 8 hours to lesson start are hidden from the student booking surface
- all times are always displayed in the **user's local timezone**, for both students and tutors
- buffer between lessons, default session lengths, and reschedule constraints should be confirmed during booking implementation but the 8-hour minimum notice is canonical

## 6.5 IA decisions — resolved

All previously open IA decisions were confirmed on `2026-04-13` and locked in `docs/foundations/ia-map-two-sided.md` section 11:

- `Get Matched` is the signed-in student first destination
- `Saved` and `Compare` are combined (compare lives inside Saved)
- tutor `Requests and Lessons` is one combined hub
- `Reviews and Outcomes` remains combined

## 7. Planning And Canonical-Doc Mismatches

## 7.1 Payment is architecturally in scope but not yet operationalized in the backlog

Current mismatch:

- architecture says Phase 1 includes student payment capture
- phase packs do not yet include a billing or payments implementation stream

This should be corrected before booking becomes "done" in implementation.

## 7.2 Tutor application request-changes behavior is not canonically aligned

Current mismatch:

- internal review tasks expect request-changes behavior
- status docs do not yet fully canonicalize it at the application-surface level

This should be closed before tutor-application implementation begins.

## 7.3 Visual comps imply policy values that are not yet source-of-truth

Examples visible in the comps include:

- free reschedule timing
- same-day booking notice
- buffer expectations

These should not be treated as authoritative until promoted into a canonical policy doc.

## 8. What Is Already Solid Enough To Build With Confidence

These areas are in good shape:

- one shared student-tutor ecosystem
- match-first positioning
- constrained search behavior
- shared lesson object model
- meeting-link architecture
- messages versus notifications split
- moderation and approval architecture
- shared mobile-navigation system with role-specific adaptation
- trust modeled as reviews plus operational reliability rather than stars only

## 9. Highest-Priority Decisions To Lock Before Booking And Payment Work

The following decisions are now locked:

1. lesson-issue and dispute path → locked in `docs/data/lesson-issue-and-dispute-model-v1.md`
2. tutor application request-changes and missing-items model → `changes_requested` is canonical in the enum glossary (section 8.2)
3. tutor payout onboarding posture → locked in `docs/planning/phase1-payment-scope-decision-v1.md` (Stripe Connect Express, pre-filled, quick)
4. internal trust thresholds and recovery tuning → locked in `docs/data/tutor-reliability-thresholds-v1.md`

## 10. Current Remaining Focus

The strongest remaining focus is not more broad research.

It is to keep the existing source-of-truth docs aligned around:

1. lesson-issue and dispute handling
2. payout-readiness gating
3. reliability thresholds and recovery math

If those four exist, the remaining implementation work becomes much less ambiguous for AI agents.

## 11. External 2026 Reference Check

The following current references informed this audit:

- [Stripe hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding)
- [Stripe Connect accounts and onboarding posture](https://docs.stripe.com/connect/accounts)
- [Stripe API onboarding for connected accounts](https://docs.stripe.com/connect/api-onboarding)
- [Stripe Checkout](https://docs.stripe.com/payments/checkout)
- [Stripe refunds API and refund handling surface](https://docs.stripe.com/api/refunds)
- [Stripe global availability](https://stripe.com/global)
- [Preply auto-confirmation and issue-report timing](https://help.preply.com/en/articles/4179432-auto-confirmation)
- [Wyzant instant-book cancellation and reschedule handling](https://support.wyzant.com/tutors/tutor-account/how-do-i-reschedule-or-cancel-an-instant-book-lesson-already-claimed-by-a-student/)

## 12. Final Audit Verdict

Mentor IB is **not missing another broad architecture phase**.

It is missing a **small number of policy-clarity artifacts** in the flows where trust, money, and operational failure intersect.

The current system is ready to keep moving, but booking, billing, tutor approval, and lesson-failure handling should not be implemented on inference alone.
