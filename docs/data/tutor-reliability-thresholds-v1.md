# Mentor IB Tutor Reliability Thresholds And Recovery v1

**Date:** 2026-04-13
**Status:** Canonical model for reliability penalty math, threshold rules, and recovery paths
**Scope:** penalty point values, rolling window rules, ranking impact thresholds, recovery mechanics, and internal visibility rules

## 1. Why This Document Exists

The trust architecture and matching architecture both reference reliability penalties but do not define the specific math, thresholds, or recovery rules.

Without this document:

- agents cannot implement ranking adjustments
- there is no canonical definition of when a tutor's reliability affects their visibility
- recovery paths are not defined, making penalties feel permanent and opaque

## 2. Companion Documents

- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/data/lesson-issue-and-dispute-model-v1.md`
- `docs/data/database-enum-and-status-glossary-v1.md` (section 13.2)

## 3. Core Principles

### 3.1 Dispute-aware

Penalties are applied only after a case is resolved with a confirmed tutor-fault outcome.

One-sided raw accusations never immediately affect tutor ranking.

### 3.2 Threshold-aware

A single incident does not collapse a tutor's visibility. Penalties accumulate within a rolling window and only affect ranking after crossing defined thresholds.

### 3.3 Recoverable

Tutors can recover from reliability penalties through consistent positive performance. No penalty is permanent.

### 3.4 Internal first

The raw penalty score is internal. Tutors see operational guidance ("your response time has improved") not raw numbers.

## 4. Reliability Event Types

| Event type | Code | Penalty points | Source |
|---|---|---|---|
| Confirmed tutor no-show | `no_show` | 35 | Lesson issue resolution |
| Late cancellation by tutor | `late_cancellation` | 20 | Tutor cancels < 2h before lesson |
| Early cancellation by tutor | `reschedule_by_tutor` | 5 | Tutor cancels >= 2h before lesson |
| Request response timeout | `response_timeout` | 10 | Tutor does not respond to booking request before expiry |

### 4.1 Non-penalty events

These events do not create reliability penalties:

- student no-show
- student cancellation
- technical failure with no confirmed tutor fault
- lesson completed successfully

## 5. Rolling Window

### 5.1 Window period

Reliability scores are calculated over a rolling 180-day window.

Events older than 180 days are excluded from the active penalty calculation.

### 5.2 Window refresh

The rolling window is recalculated:

- when a new reliability event is recorded
- when a periodic trust snapshot refresh runs (daily)

## 6. Penalty Score Calculation

### 6.1 Active penalty score

The active penalty score is the sum of penalty points from all reliability events within the rolling 180-day window.

```
active_penalty_score = SUM(penalty_points) for events in last 180 days
```

### 6.2 Lesson volume context

The penalty score is interpreted in the context of the tutor's lesson volume within the same window.

A tutor with 100 completed lessons and 1 no-show is in a very different situation from a tutor with 3 completed lessons and 1 no-show.

### 6.3 Reliability ratio

```
reliability_ratio = active_penalty_score / max(completed_lessons_in_window, 5)
```

The floor of 5 prevents new tutors with very few lessons from being overly penalized by a single incident.

## 7. Ranking Impact Thresholds

| Reliability ratio | Effect on matching rank | Tutor guidance |
|---|---|---|
| 0 to 3 | No effect | No action needed |
| 3 to 7 | Mild ranking demotion (tutor appears slightly lower in results) | "Keep up your reliable track record" |
| 7 to 15 | Moderate ranking demotion | "Your reliability score needs attention — consistent lessons will help" |
| 15 to 30 | Strong ranking demotion; excluded from "top match" positions | "Your reliability is affecting your visibility — review your schedule and commitments" |
| > 30 | Excluded from new matching entirely; existing students can still book | "Your profile is not appearing in new matches — contact support if you need help" |

### 7.1 Implementation note

Ranking demotion is applied as a multiplier on the tutor's match score within the matching algorithm, not as a hard filter (except at > 30 where exclusion from new matching applies).

### 7.2 Existing relationship preservation

Even when a tutor is excluded from new matching, existing students who have previously booked with the tutor can still:

- view the tutor's profile
- send messages
- book new lessons

## 8. Recovery Mechanics

### 8.1 Time-based recovery

Events naturally age out of the 180-day window. A tutor with no new incidents will see their penalty score decrease over time.

### 8.2 Lesson-based recovery

Each completed lesson without incident improves the reliability ratio by increasing the denominator.

### 8.3 Recovery rate examples

| Starting state | Recovery path |
|---|---|
| 1 no-show (35 pts) with 10 lessons | Complete 7 more lessons without incident to reach ratio < 3 |
| 2 late cancellations (40 pts) with 20 lessons | Complete 5 more lessons or wait for events to age out |
| 1 no-show + 1 late cancel (55 pts) with 5 lessons | Complete 14 more lessons without incident |

### 8.4 No permanent punishment

There is no permanent blacklist based on reliability. If all penalty events age out and the tutor maintains consistent delivery, their ranking returns to normal.

## 9. Public Trust Display

### 9.1 Public rating

The public-facing tutor rating (Bayesian-smoothed review average) is separate from the reliability score.

Reliability does not directly affect the displayed star rating.

### 9.2 Public trust proof

The public trust proof block shows:

- review count and average
- lessons completed count
- verified credentials

It does not show the raw reliability score or penalty points.

### 9.3 Internal trust snapshot

The internal trust snapshot used by matching includes:

- public rating
- reliability ratio
- response time average
- lesson completion rate

This snapshot is refreshed daily and used by the matching algorithm.

## 10. Admin Visibility

Admins can view:

- the full reliability event history for any tutor
- the current active penalty score and ratio
- the current ranking impact tier
- the projected recovery timeline

Admins can also:

- override a reliability event if it was incorrectly attributed
- manually adjust the penalty score with an audit trail
- exempt a tutor from reliability penalties temporarily (with reason and expiry)

## 11. Decisions Locked

- Penalty points: no-show = 35, late cancel = 20, early cancel = 5, timeout = 10
- Rolling 180-day window
- Reliability ratio = penalty score / max(completed lessons, 5)
- Five ranking impact tiers from "no effect" to "excluded from new matching"
- Recovery through time (aging) and volume (completed lessons)
- No permanent penalties
- Raw scores are internal; tutors see guidance not numbers
- Existing student relationships are preserved even during matching exclusion

## 12. Implementation Handoff

This model should be used by:

- matching algorithm for rank adjustment
- trust snapshot refresh job
- tutor overview for reliability guidance display
- admin tooling for reliability review
