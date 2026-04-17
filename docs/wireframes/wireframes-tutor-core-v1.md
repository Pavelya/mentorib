# Mentor IB Core Wireframes v1

**Date:** 2026-04-07
**Status:** Low-fi structural wireframes
**Companion docs:**
- `docs/wireframes/wireframes-review-guide.md`
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/foundations/ux-object-model.md`
- `docs/foundations/ia-map-two-sided.md`

## 1. Shared Tutor Components Used In This Pack

- `[Header]`
- `[BottomNav]`
- `[PageTitleBlock]`
- `[ProgressHeader]`
- `[LessonCard]`
- `[ConversationShell]`
- `[ScheduleSurface]`
- `[PersonSummary]`
- `[MetricTile]`
- `[StatusBadge]`
- `[ProfileHealthPanel]`
- `[Uploader]`
- `[EmptyState]`

## 2. Become a Tutor Application

**MODE:** Tutor onboarding
**OBJECT:** `Tutor` + `TutorProfile` + `Credential` + `Availability`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [ProgressHeader] Application step 4 of 9                                                         |
| required vs recommended explained                                                                |
+------------------------------------------------------+-------------------------------------------+
| FORM SECTION                                          | HELPER PANEL                             |
| section title                                         | why this matters                         |
| fields                                                | profile tips                             |
| fields                                                | "strong profiles do..."                  |
| [Uploader] / [ScheduleSurface] / selectors            |                                           |
|                                                        |                                           |
+------------------------------------------------------+-------------------------------------------+
| [S] Save and exit                            [S] Back              [P] Continue                  |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [ProgressHeader]                                 |
| required vs recommended                           |
+--------------------------------------------------+
| section title                                     |
| fields                                            |
| fields                                            |
| helper copy                                       |
+--------------------------------------------------+
| [S] Save and exit                                |
| [S] Back                    [P] Continue         |
+--------------------------------------------------+
```

### Notes

- One section focus at a time.
- This must not become a giant dashboard-like form.

## 3. Pending Review State

**MODE:** Tutor onboarding / approval
**OBJECT:** `TutorProfile` + `Credential`

### Desktop and mobile

```text
+--------------------------------------------------------------------------------------------------+
| application status: Pending review                                                               |
| submitted on: date                                                                               |
| expected review time: X days                                                                     |
+--------------------------------------------------------------------------------------------------+
| WHAT WE RECEIVED                                   | WHAT YOU CAN STILL IMPROVE                 |
| profile basics                                     | add stronger "best for" statements        |
| subjects and scenarios                             | add more credentials                       |
| schedule                                            | refine headline                            |
| credentials                                         | preview public profile                     |
+----------------------------------------------------+-------------------------------------------+
| [S] Edit application                               [S] Preview profile                           |
+--------------------------------------------------------------------------------------------------+
```

### Notes

- Waiting should feel informative, not dead.

## 4. Tutor Overview

**MODE:** Tutor
**OBJECT:** `Lesson` + `Notification` + `Earning`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header] Tutor nav: Overview | Lessons | Students | Messages | Schedule | Earnings | Profile     |
+--------------------------------------------------------------------------------------------------+
| [PageTitleBlock] Good morning, Ivan                                                              |
+--------------------------------------------------------------------------------------------------+
| [NextLessonPanel]                               | [ProfileHealthPanel]                            |
+-------------------------------------------------+-----------------------------------------------+
| [PendingRequestsPanel]                          | [UnreadMessagesPanel]                           |
+-------------------------------------------------+-----------------------------------------------+
| [AvailabilityIssuesPanel]                       | [EarningsSnapshotPanel]                         |
+-------------------------------------------------+-----------------------------------------------+
| [RecentStudentMomentumPanel]                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [PageTitleBlock] Overview                        |
+--------------------------------------------------+
| [NextLessonPanel]                                |
+--------------------------------------------------+
| [PendingRequestsPanel]                           |
+--------------------------------------------------+
| [UnreadMessagesPanel]                            |
+--------------------------------------------------+
| [AvailabilityIssuesPanel]                        |
+--------------------------------------------------+
| [EarningsSnapshotPanel]                          |
+--------------------------------------------------+
| [BottomNav] Overview | Lessons | Messages | Students | More |
+--------------------------------------------------+
```

### Notes

- This is a prioritization screen, not a stat wall.

## 5. Tutor Lessons Hub

**MODE:** Tutor
**OBJECT:** `Lesson`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [PageTitleBlock] Requests and Lessons                                                            |
| [TabBar] Pending | Upcoming | Past | Cancelled                                                   |
+--------------------------------------------------------------------------------------------------+
| [LessonCard - tutor actions enabled]                                                             |
| actions: Accept | Decline | Reschedule | Join | Mark complete | Add report                       |
+--------------------------------------------------------------------------------------------------+
| [LessonCard]                                                                                     |
+--------------------------------------------------------------------------------------------------+
| lesson detail drawer / page                                                                      |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [PageTitleBlock] Lessons                         |
| [TabBar - pills]                                 |
+--------------------------------------------------+
| [LessonCard - stacked]                           |
| [LessonCard - stacked]                           |
+--------------------------------------------------+
| [BottomNav]                                      |
+--------------------------------------------------+
```

### Notes

- Same lesson card family as student mode.
- Tutor gets more actions, not a different object model.

## 6. Tutor Students

**MODE:** Tutor
**OBJECT:** `Student`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [PageTitleBlock] My Students                                                                     |
| [SearchField] [Filter] active / new / paused / completed                                         |
+--------------------------------------------------------------------------------------------------+
| [StudentRow/Card]                                                                                |
| [PersonSummary] student                                                                          |
| stage | subjects/components | next lesson | recent lesson count | report cue | [P] Open detail  |
+--------------------------------------------------------------------------------------------------+
| [StudentRow/Card]                                                                                |
+--------------------------------------------------------------------------------------------------+
```

### Student detail desktop

```text
+--------------------------------------------------------------------------------------------------+
| [PersonSummary] student                                                                          |
| stage | next lesson | active subjects                                                            |
| [TabBar] Overview | Lessons | Notes/Reports | Messages | Files                                  |
+--------------------------------------------------------------------------------------------------+
| tab content                                                                                      |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [PageTitleBlock] My Students                     |
| [SearchField]                                    |
+--------------------------------------------------+
| [StudentCard - stacked]                          |
| [StudentCard - stacked]                          |
+--------------------------------------------------+
| tap -> student detail                            |
+--------------------------------------------------+
```

### Notes

- This is a lightweight teaching CRM, not a table-first admin page.

## 7. Tutor Schedule

**MODE:** Tutor
**OBJECT:** `Availability`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [PageTitleBlock] Schedule                                                                        |
+--------------------------------------------------------------------------------------------------+
| LEFT: SCHEDULE EDITOR                                | RIGHT: WHAT STUDENTS SEE                 |
| recurring weekly hours                               | booking preview                          |
| [ScheduleSurface - edit mode]                        | next visible slots                       |
|                                                      | timezone note                            |
| exceptions / blackout dates                          |                                           |
| notice / buffer / capacity rules                     |                                           |
+------------------------------------------------------+-------------------------------------------+
| [S] Reset                                         [P] Save changes                               |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [PageTitleBlock] Schedule                        |
+--------------------------------------------------+
| timezone                                          |
| [ScheduleSurface - edit mode]                     |
+--------------------------------------------------+
| exceptions / blackout dates                       |
+--------------------------------------------------+
| notice / buffer / capacity rules                  |
+--------------------------------------------------+
| booking preview                                   |
+--------------------------------------------------+
| [P] Save changes                                  |
| [BottomNav]                                       |
+--------------------------------------------------+
```

### Notes

- The screen must show both edit mode and student-visible outcome.
- Availability is more than a weekly grid.

## 8. Tutor Earnings

**MODE:** Tutor
**OBJECT:** `Earning`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [PageTitleBlock] Earnings                                                                        |
+--------------------------------------------------------------------------------------------------+
| [PayoutStatusBanner]                                                                             |
+--------------------------------------------------------------------------------------------------+
| [MetricTile] Available     [MetricTile] Pending     [MetricTile] Paid out                        |
+--------------------------------------------------------------------------------------------------+
| [TransactionFilters] status | period                                                             |
+--------------------------------------------------------------------------------------------------+
| TRANSACTION HISTORY                                                                                |
| lesson | student | status | amount | payout state | detail                                       |
+--------------------------------------------------------------------------------------------------+
| QUALITY / PERFORMANCE CONTEXT                                                                     |
| response time | decline rate | cancellations | profile health                                     |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [PageTitleBlock] Earnings                        |
+--------------------------------------------------+
| [PayoutStatusBanner]                             |
+--------------------------------------------------+
| [MetricTile] Available                           |
| [MetricTile] Pending                             |
| [MetricTile] Paid out                            |
+--------------------------------------------------+
| [TransactionFilters]                             |
+--------------------------------------------------+
| [TransactionRow - stacked]                       |
| [TransactionRow - stacked]                       |
+--------------------------------------------------+
| performance context                               |
+--------------------------------------------------+
| [BottomNav]                                      |
+--------------------------------------------------+
```

### Notes

- Do not reduce earnings to an accounting ledger only.

## 9. Shared Component Reuse Highlights

These pairings should stay visibly related across student and tutor screens:

- Student lessons + Tutor lessons -> same `[LessonCard]`
- Student messages + Tutor messages -> same `[ConversationShell]`
- Booking schedule + Tutor schedule -> same `[ScheduleSurface]`
- Tutor public profile + Tutor profile editing preview -> same `TutorProfile` structure

## 10. First Review Questions

1. Does tutor overview feel like a teaching workflow?
2. Does tutor schedule feel more capable than a simple slot grid?
3. Do tutor lessons clearly reuse the same lesson ecosystem as student lessons?
4. Does the tutor application feel staged and confidence-building?
