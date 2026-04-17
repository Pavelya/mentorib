# Mentor IB Rating, Review, And Trust Architecture v1

**Date:** 2026-04-08
**Status:** Standalone architecture for tutor reviews, derived ratings, trust proof, and operational reliability signals
**Scope:** review eligibility, rating aggregation, public trust surfaces, reliability signals, moderation of review content, public-versus-private trust data, and how trust contributes to ranking without becoming the whole ranking system

## 1. Why This Document Exists

This document defines how Mentor IB should represent trust in a way that is credible, explainable, and safe.

It exists now because the product already implies the need for:

- public tutor reviews
- visible rating or review strength cues
- verified trust proof
- penalties or gates for poor tutor behavior
- matching signals that use trust without becoming review-only sorting

Without an explicit architecture, trust usually becomes:

- a naive star average
- mixed together with moderation state
- vulnerable to noisy low-sample reviews
- hard for AI-driven implementation to handle consistently

## 2. What This Document Does Not Redefine

This document does not replace the approved matching, moderation, privacy, or media architecture.

It inherits from:

- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/foundations/ux-object-model.md`

It does not define:

- the exact numeric rating formula constants
- the final copywriting style for public review cards
- the final review dispute process wording
- the final internal trust dashboard

Those can come later as companion artifacts.

## 3. Core Recommendation

Mentor IB should treat trust as one system made of several distinct inputs:

- lesson-linked reviews
- derived rating aggregates
- verified trust proof
- operational reliability signals
- moderation and safety state

The practical rule is:

- collect real review evidence only from real lesson relationships
- derive public rating and internal trust signals from that evidence
- keep reliability and moderation separate from raw reviews
- show a curated public trust surface, not all internal trust data
- use trust as one family in matching, not the entire ranker

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means trust logic should be:

- explicit
- stateful
- versionable
- role-aware
- separated into public and internal layers

The architecture should not rely on:

- hardcoded review math in UI components
- using raw average rating as the only truth
- public display of all internal trust inputs
- implicit assumptions about which reviews should count

## 5. Goals

The rating, review, and trust architecture should:

- help students decide confidently
- reward genuinely reliable and effective tutors
- avoid overreacting to tiny sample sizes
- preserve fairness for new tutors
- support moderation and dispute handling
- stay privacy-safe, especially for minors

## 6. Trust System Split

Mentor IB should treat trust as five related but distinct layers.

## 6.1 Review evidence

This is the direct lesson-linked feedback artifact.

Examples:

- a star rating
- a short comment
- subject or context reference

## 6.2 Rating aggregate

This is a derived summary of eligible published review evidence.

Examples:

- public rating score
- published review count

## 6.3 Operational reliability

This is a separate derived trust family based on tutor behavior, not just student sentiment.

Examples:

- no-show behavior
- cancellation or reschedule behavior
- responsiveness
- lesson completion consistency

## 6.4 Verified trust proof

This is approved trust evidence derived from review, verification, or other approved signals.

Examples:

- verified credential
- reviewed experience label
- lesson volume cue
- strong review history cue

## 6.5 Moderation and safety state

This is the safety and governance layer.

Examples:

- under investigation
- suspended
- hidden from public listing

Rule:

- moderation state is not just another rating penalty

## 7. Canonical Objects

## 7.1 Main rule

Trust should use explicit domain objects instead of one overloaded tutor score field.

## 7.2 Recommended core objects

The architecture should support at least:

- `Review`
- `RatingAggregate`
- `ReliabilitySignal`
- `TrustProof`
- `TrustSnapshot` or equivalent derived internal projection

The exact schema can vary, but the separation should exist.

## 7.3 `Review`

Purpose:

- the lesson-linked feedback record

Suggested attributes:

- lesson id
- reviewer user id
- reviewed tutor id
- rating value
- comment
- subject or component context
- submission time
- moderation status
- publication status

## 7.4 `RatingAggregate`

Purpose:

- the derived display and analysis summary from eligible reviews

Suggested attributes:

- tutor id
- published review count
- smoothed rating value
- last recomputed at
- aggregation version

## 7.5 `ReliabilitySignal`

Purpose:

- the internal operational trust projection

Suggested attributes:

- tutor id
- signal type
- current value or band
- evaluation window
- last updated at

## 7.6 `TrustSnapshot`

Purpose:

- a derived internal trust projection used by ranking and internal review

Suggested attributes:

- tutor id
- trust-quality band
- rating contribution
- reliability contribution
- verification contribution
- caution flags
- version

## 8. Review Eligibility Architecture

## 8.1 Main rule

A review should come from a real lesson relationship, not from open public profile traffic.

## 8.2 Recommended MVP eligibility

Phase 1 should allow public tutor reviews only when:

- the lesson actually existed
- the lesson was completed or meaningfully delivered
- the reviewer is the legitimate lesson participant on the student side

## 8.3 Public review direction rule

For MVP, public reviews should be student-to-tutor reviews only.

Tutor-to-student feedback may exist later as internal operational context, but it should not become a public reputation surface by default.

## 8.4 One-review-per-lesson rule

The system should not allow multiple public tutor reviews from the same lesson relationship unless an intentional edited-review model is introduced later.

## 8.5 Completion rule

Cancelled or no-show lessons should not automatically produce public tutor reviews as though teaching was completed.

Operational incidents should flow into reliability and moderation handling instead.

## 9. Review State Model

## 9.1 Main rule

Review submission is not the same thing as public visibility.

## 9.2 Recommended review states

The architecture should support a lifecycle such as:

- pending
- submitted
- under_review
- published
- hidden
- rejected

The exact names can vary, but the distinction should exist.

## 9.3 Flagging rule

Reviews should be flaggable for moderation concerns such as:

- abuse
- harassment
- spam
- obvious irrelevance
- privacy leakage

## 9.4 Edit posture

MVP does not need complex multi-version review editing.

If edits are later allowed, the architecture should preserve the review trail rather than mutating history invisibly.

## 10. Public Review Content Architecture

## 10.1 Main rule

Public review content should be useful but privacy-conservative.

## 10.2 Reviewer identity rule

Public review cards should use a constrained reviewer identity summary rather than full student identity.

Examples:

- first name and initial
- student stage summary
- anonymized role context

The exact display choice can vary, but minor or student identity should be protected.

## 10.3 Content rule

Public review text should remain:

- concise
- relevant
- lesson-grounded

Do not encourage long unstructured personal narratives as the core review format in MVP.

## 10.4 Structured context rule

Where useful, public reviews may show structured context such as:

- subject or component
- lesson recency
- support scenario

## 11. Rating Aggregation Architecture

## 11.1 Main rule

The public rating should be a derived aggregate, not a naive average over every raw score.

## 11.2 Eligibility rule

Only eligible published reviews should contribute to the public rating aggregate.

Hidden, rejected, or moderation-blocked reviews should not be treated as public rating input.

## 11.3 Sparse-sample rule

The rating system should protect against misleading early averages from tiny sample sizes.

That means the aggregation should support smoothing or other low-sample stabilizing behavior.

Recommended MVP posture:

- use a Bayesian-smoothed rating rather than a raw arithmetic average
- use the current platform-wide tutor rating mean as the prior center
- use a prior weight equivalent to about `5` published reviews

## 11.4 Public-threshold posture

The public surface may choose not to foreground a star rating until the tutor has enough published review evidence to make it meaningful.

Recommended MVP display threshold:

- do not foreground a public star rating until the tutor has at least `3` published reviews

Before that threshold, the trust surface should emphasize:

- verified proof
- lesson volume
- clear best-for language
- new-on-platform trust framing

## 11.5 Internal-versus-public rule

The internal trust layer may use richer trust calculations than the public display layer.

The public rating should stay simple and understandable.

## 12. Reliability Architecture

## 12.1 Main rule

Operational reliability is a distinct trust family and should not be reduced to review stars.

## 12.2 Recommended reliability inputs

The reliability layer may include:

- no-show history
- short-notice cancellation behavior
- repeated reschedule behavior
- response reliability
- lesson completion consistency

## 12.3 Severity posture

Not every reliability issue should be treated the same.

Recommended MVP internal posture:

- maintain a rolling `180-day` internal reliability score starting from `100`
- confirmed tutor no-show: `-35`
- tutor cancellation under `2` hours before lesson start: `-25`
- tutor cancellation at or above `2` hours before lesson start: `-10`
- request timeout or non-response that causes auto-cancel: `-12`
- confirmed tutor-fault wrong or invalid meeting link that prevents the lesson: `-15`
- student no-show: `0` tutor penalty
- disputed incidents: `0` until resolved
- clean completed lessons may recover `+1` each, capped at `+10` recovery points per rolling window

Recommended score bands:

- `90-100`: healthy
- `75-89`: watch
- `60-74`: caution and visible ranking drag
- `<60`: hidden from new public matching until reviewed

## 12.4 Public visibility rule

Detailed internal reliability metrics should not be shown publicly by default.

The public trust surface may show positive cues derived from reliability, but internal negative operational detail should stay internal unless there is a deliberate product reason.

## 13. Penalty And Gate Architecture

## 13.1 Main rule

Poor tutor behavior should influence trust, but in a structured way.

## 13.2 Soft-penalty layer

These should generally lower internal trust quality or ranking contribution:

- weak review quality
- repeated reschedule friction
- lower responsiveness
- stale operational readiness

## 13.3 Hard-gate layer

These should generally affect eligibility or public visibility, not just ranking weight:

- suspension
- `2` confirmed tutor no-shows in a rolling `60-day` window
- `3` tutor-fault cancellations or no-shows in a rolling `30-day` window
- unresolved trust-and-safety state
- hidden or unpublished public listing state

## 13.4 No-permanent-hidden-punishment rule

The trust system should not use opaque permanent punishments with no review path.

Serious actions should flow through explicit moderation or operational state, not only through a hidden score.

## 14. Trust Proof Architecture

## 14.1 Main rule

Public trust proof should be curated from approved trust signals, not dumped from internal tables.

## 14.2 Recommended MVP trust-proof inputs

Public trust proof may draw from:

- verified credentials
- approved experience labels
- meaningful published review strength
- lesson volume or teaching-history cues

## 14.3 Proof-label rule

Public trust proof labels should be:

- truthful
- clear
- backed by actual state
- understandable to students

## 14.4 Public honesty rule

Do not imply that a tutor is "top rated" or "highly trusted" unless the architecture actually supports and governs that label consistently.

## 15. Public Trust Surface Architecture

## 15.1 Main rule

The public tutor profile should show a balanced trust surface rather than a single star-centric reputation block.

## 15.2 Recommended MVP public trust mix

The first public trust surface should combine:

- review strength if eligible
- verified trust proof
- lesson-history cues where appropriate
- clear fit rationale

## 15.3 New-tutor fairness rule

The public design must not make new but qualified tutors look automatically untrustworthy simply because they have not accumulated reviews yet.

## 16. Relationship To Matching

## 16.1 Main rule

Trust feeds matching, but trust is not the entire ranker.

## 16.2 Matching inheritance rule

This architecture aligns with the approved matching rule:

- ratings and reviews are one trust family
- reliability is another trust family
- moderation state is a gate

## 16.3 Public-versus-internal distinction

The ranking layer may use a richer internal trust-quality signal than what the public page displays.

That is acceptable as long as:

- it stays truthful
- it stays explainable
- it does not rely on hidden arbitrary punishment

## 17. Moderation And Dispute Architecture

## 17.1 Main rule

Review content must be reviewable without making moderation part of the public rating formula by accident.

## 17.2 Review-moderation rule

Flagged review text should be reviewable through the moderation architecture.

## 17.3 Dispute posture

The architecture should support review disputes later without requiring public star values to be edited directly in random admin screens.

## 17.4 Lesson-issue case rule

Operational lesson failures such as no-show, wrong meeting link, or major technical failure should enter one lesson-issue path rather than being handled through scattered support notes.

## 17.5 Auto-resolution rule

If the student-side and tutor-side lesson issue reports materially agree, the product may auto-resolve the case and apply the approved refund, payout, and reliability rules.

## 17.6 Conflicting-claim rule

If the reports conflict or evidence is insufficient, the case should move to internal review and remain trust-neutral until resolution.

## 17.7 Penalty-application rule

Reliability penalties, ranking drag, or listing gates should only be applied from:

- policy-qualified auto-resolved incidents
- internally reviewed outcomes

Do not let a one-sided raw accusation immediately reduce tutor trust or public visibility.

## 17.8 Safety-state rule

If a tutor enters a serious moderation state, that state should affect listing and trust through the moderation architecture, not through review text tricks.

## 18. Privacy And Security Boundaries

## 18.1 Privacy rule

Public reviews must not expose more student identity than necessary.

## 18.2 Minor-aware rule

Because learners may be minors, review identity and review text must be especially conservative.

## 18.3 Analytics rule

Analytics may track review submission and trust-surface interactions, but should not capture:

- raw review text by default
- moderation notes
- internal trust calculations in ways that leak sensitive details

## 18.4 Security rule

Only authorized participants and internal operators should be able to create, moderate, or inspect non-public review state.

## 19. Analytics And Learning Loop

## 19.1 Main rule

Trust architecture should be measurable without exposing sensitive content.

## 19.2 Useful telemetry outputs

The system should be able to relate:

- published review count
- rating-band changes
- trust-surface views
- profile conversion
- reliability-status changes
- booking outcomes

## 19.3 No-auto-punishment rule

The MVP trust system should not automatically reconfigure itself from analytics feedback.

Tuning should remain deliberate and reviewable.

## 20. Recommended Phase Scope

## 20.1 Phase 1

Phase 1 should support:

- student-to-tutor lesson-linked reviews
- public review publication state
- derived public rating aggregate
- internal reliability signals
- verified public trust proof
- ranking integration through derived trust-quality inputs

## 20.2 Phase 1.5

Good next candidates:

- stronger review moderation tooling
- better reliability windows and thresholds
- richer public trust-proof combinations
- internal trust snapshots for ops dashboards

## 20.3 Phase 2

Consider later:

- review dispute workflows
- more nuanced reviewer context
- controlled experiments on trust-surface presentation
- deeper rating-model refinement if real scale justifies it

## 21. What This Architecture Prevents

This architecture is meant to prevent:

- naive raw-average star sorting
- fake or non-lesson-based public reviews
- moderation state being hidden inside a reputation score
- no-show behavior being ignored just because reviews are good
- new tutors being buried only because they lack review volume
- future AI agents inventing trust math inconsistently across the app

## 22. Decisions To Lock Now

The architecture should lock the following decisions now:

- public tutor reviews must be lesson-linked
- public tutor reviews are student-to-tutor only in MVP
- public rating is a derived aggregate, not a naive raw average
- sparse-review smoothing or equivalent stabilization is required
- reliability is a separate trust family from review sentiment
- severe operational or safety issues can become hard gates
- public trust proof is curated and truthful, not a dump of internal trust fields
- trust contributes to matching, but does not replace matching

## 23. Final Recommendation

Mentor IB should implement trust as a layered system:

- real lesson-linked review evidence
- derived public rating
- internal reliability signals
- verified public trust proof
- explicit moderation state

This gives students a believable trust surface, gives matching a better trust input than naive stars, and gives the platform a fairer way to respond to both strong and weak tutor behavior.
