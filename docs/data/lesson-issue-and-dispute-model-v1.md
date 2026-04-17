# Mentor IB Lesson Issue And Dispute Model v1

**Date:** 2026-04-13
**Status:** Canonical model for lesson-issue types, dispute states, resolution paths, refund logic, and reliability penalty rules
**Scope:** lesson-issue object model, dispute lifecycle, auto-resolution rules, refund and payout consequences, and reliability penalty application

## 1. Why This Document Exists

Booking, cancellation, refund, no-show, and reliability penalty logic all depend on one canonical model for lesson issues and disputes.

Without this document, the following remain ambiguous:

- what constitutes a lesson issue versus a cancellation
- how disputes between student and tutor are resolved
- when refunds are automatic versus reviewed
- how reliability penalties are applied to tutor ranking
- what the 2-hour cancellation window means for each party

This document resolves those ambiguities as a first-class data artifact.

## 2. Companion Documents

This document is a direct companion to:

- `docs/data/database-enum-and-status-glossary-v1.md` (section 11.4 and 11.5)
- `docs/data/database-schema-outline-v1.md`
- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/planning/end-to-end-use-case-gap-audit-v1.md`

## 3. Core Principle

The lesson-issue flow is a normal part of lesson operations, not an edge case.

Because Mentor IB does not host the video room, it cannot auto-detect attendance. Lesson issues are resolved through structured participant reporting, not raw call telemetry.

## 4. Lesson Issue Versus Cancellation

These are distinct product flows.

### 4.1 Cancellation

A cancellation is a deliberate decision by one participant to cancel a confirmed lesson before it happens.

Cancellation is a direct action with predictable consequences defined by the platform cancellation policy.

### 4.2 Lesson issue

A lesson issue is a report that something went wrong during or around a scheduled lesson.

Lesson issues require evidence assessment and may involve conflicting claims.

### 4.3 Rule

Do not conflate cancellation and lesson-issue handling. They share the lesson object but follow different resolution paths.

## 5. Platform Cancellation Policy

Mentor IB uses one platform-wide cancellation rule set. Tutors may not define custom cancellation policies.

### 5.1 Student cancellation rules

| Timing | Outcome |
|---|---|
| Student cancels >= 2 hours before lesson start | Full refund to student |
| Student cancels < 2 hours before lesson start | No refund; tutor receives full payment |

### 5.2 Tutor cancellation rules

| Timing | Outcome |
|---|---|
| Tutor cancels at any time | Full refund to student; reliability penalty path for tutor |

### 5.3 Request expiry

| Condition | Outcome |
|---|---|
| Tutor has not accepted by 2 hours before lesson start | Request auto-cancels; payment authorization released; no penalty |

### 5.4 Reschedule

A reschedule is treated as a cancellation of the original lesson plus a new booking request.

The same timing rules apply to the cancellation portion.

## 6. Lesson Issue Types

The canonical issue types are:

| Issue type | Code | Who can report | Description |
|---|---|---|---|
| Tutor absent | `tutor_absent` | Student | Tutor did not join the lesson |
| Student absent | `student_absent` | Tutor | Student did not join the lesson |
| Wrong or missing meeting link | `wrong_meeting_link` | Student or Tutor | The meeting link was invalid, missing, or inaccessible |
| Major technical failure | `technical_failure` | Student or Tutor | The lesson could not proceed due to a technical problem without clear fault |
| Partial delivery | `partial_delivery` | Student or Tutor | The lesson started but was significantly shortened or interrupted |

### 6.1 Reporting window

A lesson issue can be reported from the time the lesson was scheduled to start until 24 hours after the scheduled end time.

After that window, the lesson is treated as completed unless already flagged.

### 6.2 Reporting surface

Lesson issues are reported from the lesson detail surface using structured issue types and an optional free-text summary.

Lesson issues are not reported through chat messages or generic support forms.

## 7. Lesson Issue Case Lifecycle

The canonical lifecycle for a lesson-issue case is:

### 7.1 States

| State | Code | Meaning |
|---|---|---|
| Reported | `reported` | One participant submitted a lesson issue; awaiting counterparty input or policy handling |
| Counterparty matched | `counterparty_matched` | Both sides materially agree on the issue; eligible for auto-resolution |
| Under review | `under_review` | Claims conflict or need manual internal review |
| Resolved | `resolved` | Outcome recorded; downstream effects can be applied |
| Dismissed | `dismissed` | Duplicate, invalid, or withdrawn case |

### 7.2 State transitions

```
reported → counterparty_matched → resolved
reported → under_review → resolved
reported → dismissed
counterparty_matched → under_review (if auto-resolution conditions fail)
```

## 8. Auto-Resolution Rules

Auto-resolution applies when both participants materially agree.

### 8.1 Material agreement

Material agreement means:

- both participants report the same issue type, or
- one participant reports and the other does not dispute within the counterparty response window

### 8.2 Counterparty response window

The counterparty has 12 hours from when the initial issue is filed to submit their own version or confirm the reporter's claim.

If no counterparty response is received within 12 hours, the system treats the original report as uncontested.

### 8.3 Auto-resolution outcomes

| Agreed issue | Resolution outcome | Refund | Tutor payment | Reliability penalty |
|---|---|---|---|---|
| Tutor absent (confirmed) | `tutor_no_show_confirmed` | Full refund | No payment | Yes |
| Student absent (confirmed) | `student_no_show_confirmed` | No refund | Full payment | No |
| Wrong link (tutor fault) | `wrong_link_tutor_fault` | Full refund | No payment | Yes |
| Technical issue (no fault) | `technical_issue_no_fault` | Full refund | No payment | No |
| Partial delivery | `partial_delivery_adjusted` | Partial refund or full refund | Adjusted or no payment | Case-dependent |

### 8.4 Manual review triggers

A case goes to internal review when:

- participants report conflicting issue types
- one participant contests the other's claim within the response window
- the issue type is `partial_delivery` with no clear agreement on the extent
- there is a pattern of repeated issues from the same participant

## 9. Resolution Outcomes

The canonical resolution outcomes are defined in `docs/data/database-enum-and-status-glossary-v1.md` section 11.5.

Each outcome drives exactly one refund posture, one payout posture, and one reliability posture.

### 9.1 Outcome to consequence mapping

| Resolution outcome | Student refund | Tutor payout | Tutor reliability effect |
|---|---|---|---|
| `tutor_no_show_confirmed` | Full | None | Penalty applied |
| `student_no_show_confirmed` | None | Full | No effect |
| `wrong_link_tutor_fault` | Full | None | Penalty applied |
| `technical_issue_no_fault` | Full | None | No effect |
| `partial_delivery_adjusted` | Reviewed | Reviewed | Case-dependent |
| `lesson_completed` | None | Full | No effect |
| `duplicate_or_invalid` | None | No change | No effect |

## 10. Refund Processing

### 10.1 Automatic refunds

Refunds triggered by auto-resolution are processed immediately through the Stripe refund API against the original captured payment.

### 10.2 Reviewed refunds

Refunds from internal review are processed after the case is resolved and the outcome is recorded.

### 10.3 Partial refunds

Partial refunds apply only to `partial_delivery_adjusted` outcomes and are set by the internal reviewer based on the proportion of the lesson delivered.

### 10.4 Refund timing

Refunds should be initiated within 24 hours of case resolution.

## 11. Payout Consequences

### 11.1 Payout hold

When a lesson issue is reported, the associated tutor earning record moves to a hold state until the case is resolved.

### 11.2 Payout release

After resolution, the earning record is either:

- released for payout (lesson completed or student fault)
- cancelled (tutor fault or technical no-fault)
- adjusted (partial delivery)

## 12. Reliability Penalty Application

Reliability penalties are applied only after a case is resolved with a tutor-fault outcome.

### 12.1 Penalty-eligible outcomes

- `tutor_no_show_confirmed`
- `wrong_link_tutor_fault`

### 12.2 Penalty-ineligible outcomes

- `student_no_show_confirmed`
- `technical_issue_no_fault`
- `lesson_completed`
- `duplicate_or_invalid`

### 12.3 Partial delivery

`partial_delivery_adjusted` cases may or may not carry a reliability effect, determined by the internal reviewer based on fault attribution.

### 12.4 Penalty recording

Each penalty-eligible resolution creates a `tutor_reliability_event` record linked to the lesson and the case.

Downstream effects on ranking and trust are governed by `docs/data/tutor-reliability-thresholds-v1.md`.

## 13. Meeting URL Lifecycle

### 13.1 Active lesson

Meeting URLs are private operational data visible only to lesson participants during the active lesson window.

### 13.2 After completion

Meeting URLs are redacted from the lesson record 7 days after lesson completion or lesson issue resolution, whichever is later.

### 13.3 Redaction method

The URL field is replaced with a tombstone value indicating redaction. The original value is not retained.

## 14. Data Model Summary

### 14.1 Lesson issue case record

| Field | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary key |
| `lesson_id` | UUID FK | Link to lesson |
| `reported_by` | UUID FK | Reporting participant |
| `issue_type` | text | One of the canonical issue types |
| `reporter_summary` | text | Optional free-text from reporter |
| `counterparty_response_type` | text | Counterparty's issue type or confirmation |
| `counterparty_summary` | text | Optional free-text from counterparty |
| `case_status` | text | Lifecycle state |
| `resolution_outcome` | text | Normalized outcome |
| `resolved_by` | UUID FK | Internal reviewer if manually reviewed |
| `resolution_notes` | text | Internal notes from reviewer |
| `reported_at` | timestamptz | When the issue was first reported |
| `counterparty_deadline` | timestamptz | When counterparty response window expires |
| `resolved_at` | timestamptz | When the case was resolved |

### 14.2 Constraints

- One active case per lesson at a time
- Issue type values are validated against the canonical set
- Case status values follow the glossary

## 15. Decisions Locked

- Lesson issues are structured reports, not chat messages
- One platform-wide cancellation policy, no tutor-specific rules
- Auto-resolution when both sides agree or counterparty does not contest
- 12-hour counterparty response window
- 24-hour reporting window after scheduled lesson end
- Meeting URLs redacted 7 days after completion
- Reliability penalties only after resolved tutor-fault outcomes
- Refunds initiated within 24 hours of resolution

## 16. Implementation Handoff

This model should be used by:

- `P1-DATA-003` for lesson issue case schema
- `P1-LESS-002` for issue reporting UI
- `P1-BOOK-001` for refund and authorization release logic
- `P1-NOTIF-001` for issue acknowledgement and resolution notifications
