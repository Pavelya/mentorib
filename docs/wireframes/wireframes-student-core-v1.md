# Mentor IB Student Core Wireframes v1

**Date:** 2026-04-07
**Status:** Low-fi structural wireframes
**Companion docs:**
- `docs/wireframes/wireframes-review-guide.md`
- `docs/foundations/service-blueprint-two-sided.md`
- `docs/foundations/ux-object-model.md`
- `docs/foundations/ia-map-two-sided.md`

## 1. Shared Student Components Used In This Pack

- `[Header]`
- `[BottomNav]`
- `[PageTitleBlock]`
- `[ProblemChip]`
- `[NeedSummaryBar]`
- `[MatchRow]`
- `[PersonSummary]`
- `[LessonCard]`
- `[ConversationShell]`
- `[ScheduleSurface]`
- `[StatusBadge]`
- `[TrustProofBlock]`
- `[EmptyState]`

## 2. Home

**MODE:** Public / Student
**OBJECT:** `LearningNeed`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]  Home | Get Matched | Browse Tutors | Become a Tutor | Trust & Safety | Log In         |
+--------------------------------------------------------------------------------------------------+
| HERO                                                                                            |
| "IB help for the part that feels hard right now."                                               |
| [ProblemChip] IA feedback   [ProblemChip] TOK essay   [ProblemChip] IO practice                 |
| [ProblemChip] EE planning   [ProblemChip] HL exam rescue   [ProblemChip] Weekly support         |
| [P] Get matched                               [S] Browse tutors                                  |
+------------------------------------------------------+-------------------------------------------+
| HOW MATCHING WORKS                                   | TRUST / REASSURANCE                       |
| 1. Tell us the problem                               | - IB-specific tutors only                 |
| 2. See best fits                                     | - Clear fit reasons                       |
| 3. Book with confidence                              | - Safe booking and messaging              |
+------------------------------------------------------+-------------------------------------------+
| SAMPLE MATCHES / FEATURED TUTORS                                                                 |
| [MatchRow] [MatchRow] [MatchRow]                                                                 |
+--------------------------------------------------------------------------------------------------+
| TRUST PROOF                                                                                      |
| [TrustProofBlock] reviews | credentials | student feedback | support policy                      |
+--------------------------------------------------------------------------------------------------+
| FOR TUTORS                                                                                       |
| "Teach the part of IB you know best."  [S] Become a Tutor                                        |
+--------------------------------------------------------------------------------------------------+
| FAQ TEASER                                                                                       |
+--------------------------------------------------------------------------------------------------+
| [Footer]                                                                                         |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]  Logo                         Menu       |
+--------------------------------------------------+
| HERO                                             |
| "IB help for the part that feels hard right now" |
| [P] Get matched                                  |
| [S] Browse tutors                                |
+--------------------------------------------------+
| QUICK START                                      |
| [ProblemChip] IA feedback                        |
| [ProblemChip] TOK essay                          |
| [ProblemChip] IO practice                        |
| [ProblemChip] HL exam rescue                     |
+--------------------------------------------------+
| HOW MATCHING WORKS                               |
+--------------------------------------------------+
| TRUST PROOF                                      |
+--------------------------------------------------+
| SAMPLE MATCHES                                   |
| [MatchRow]                                       |
| [MatchRow]                                       |
+--------------------------------------------------+
| FOR TUTORS                                       |
+--------------------------------------------------+
| FAQ                                              |
+--------------------------------------------------+
| [Footer]                                         |
+--------------------------------------------------+
```

### Notes

- The problem chips must appear above the fold.
- The homepage routes into matching, not into a generic grid.

## 3. Match Flow

**MODE:** Student
**OBJECT:** `LearningNeed`

### Desktop step template

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [ProgressHeader] Step 2 of 5                                                                     |
| Need so far: [NeedSummaryBar] IA feedback | English A | urgent | evening                         |
+--------------------------------------------------------------------------------------------------+
| QUESTION AREA                                        | GUIDANCE PANEL                            |
| "Which IB subject or component is involved?"         | "We use this to narrow your best fits."   |
|                                                      | "You can change this later."              |
| [OptionCard] English A HL                            |                                           |
| [OptionCard] English A SL                            |                                           |
| [OptionCard] TOK                                     |                                           |
| [OptionCard] EE                                      |                                           |
| [OptionCard] Other                                   |                                           |
+------------------------------------------------------+-------------------------------------------+
| [S] Back                                                      [P] Continue                       |
+--------------------------------------------------------------------------------------------------+
```

### Mobile step template

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [ProgressHeader] Step 2 of 5                     |
| [NeedSummaryBar] IA feedback | urgent            |
+--------------------------------------------------+
| QUESTION                                         |
| "Which subject or component is involved?"        |
| [OptionCard] English A HL                        |
| [OptionCard] English A SL                        |
| [OptionCard] TOK                                 |
| [OptionCard] EE                                  |
| [OptionCard] Other                               |
+--------------------------------------------------+
| helper text                                      |
+--------------------------------------------------+
| [S] Back                    [P] Continue         |
+--------------------------------------------------+
```

### Final handoff screen

```text
+--------------------------------------------------------------------------------------------------+
| "We found tutors who fit this need"                                                             |
| [NeedSummaryBar] IA feedback | English A | urgent | evenings | Europe                           |
| [P] See best fits                                                                               |
+--------------------------------------------------------------------------------------------------+
```

### Notes

- One decision cluster per screen.
- Right panel on desktop becomes helper text under the options on mobile.

## 4. Results / Search

**MODE:** Student
**OBJECT:** `Match`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [NeedSummaryBar] IA feedback | English A | urgent | evenings | Warsaw timezone                  |
| Refine: [FilterPill] Price  [FilterPill] Language  [FilterPill] Availability  [Sort] Best fit  |
+--------------------------------------------------------------------------------------------------+
| 12 best-fit tutors                                                                               |
| "Ordered by fit for your current IB need"                                                        |
+--------------------------------------------------------------------------------------------------+
| [MatchRow]                                                                                       |
| Photo | Name + proof | Best for statement | Why this fits | overlap | reviews | price | actions|
| [S] Save  [S] Compare  [P] View profile                                                          |
+--------------------------------------------------------------------------------------------------+
| [MatchRow]                                                                                       |
+--------------------------------------------------------------------------------------------------+
| [MatchRow]                                                                                       |
+--------------------------------------------------------------------------------------------------+
| [EmptyState if no results]                                                                       |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [NeedSummaryBar] IA feedback | urgent            |
| [FilterPill] Filters    [Sort] Best fit          |
+--------------------------------------------------+
| 12 best-fit tutors                               |
+--------------------------------------------------+
| [MatchRow - stacked]                             |
| Photo                                            |
| Name + proof                                     |
| Best for                                         |
| Why this fits                                    |
| overlap | reviews | price                        |
| [S] Save  [S] Compare  [P] View profile          |
+--------------------------------------------------+
| [MatchRow - stacked]                             |
+--------------------------------------------------+
```

### Notes

- No dense card wall.
- The active need must stay visible while browsing.

## 5. Tutor Profile

**MODE:** Student
**OBJECT:** `TutorProfile`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| PROFILE HEADER                                                                                   |
| [PersonSummary] Photo | Name | trust proof | rating | next availability                          |
| "Best for students who need..."                                                                  |
+------------------------------------------------------+-------------------------------------------+
| LEFT CONTENT                                         | RIGHT BOOKING PANEL                       |
| WHY THIS TUTOR FITS                                  | price                                     |
| - fit reason 1                                       | next available slots                      |
| - fit reason 2                                       | [P] Book lesson                           |
| - fit reason 3                                       | [S] Save   [S] Message                    |
|                                                      |                                           |
| BEST FOR                                             |                                           |
| [scenario tags]                                      |                                           |
|                                                      |                                           |
| TEACHING STYLE                                       |                                           |
| short paragraph                                      |                                           |
|                                                      |                                           |
| REVIEWS AND OUTCOMES                                 |                                           |
| [ReviewCard] [ReviewCard]                            |                                           |
|                                                      |                                           |
| CREDENTIALS / TRUST                                  |                                           |
| [TrustProofBlock]                                    |                                           |
|                                                      |                                           |
| DETAILED BACKGROUND                                  |                                           |
+------------------------------------------------------+-------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [PersonSummary - stacked]                        |
| "Best for students who need..."                  |
| [P] Book lesson                                  |
| [S] Save   [S] Message                           |
+--------------------------------------------------+
| WHY THIS TUTOR FITS                              |
+--------------------------------------------------+
| BEST FOR                                         |
+--------------------------------------------------+
| TEACHING STYLE                                   |
+--------------------------------------------------+
| REVIEWS AND OUTCOMES                             |
+--------------------------------------------------+
| CREDENTIALS / TRUST                              |
+--------------------------------------------------+
| DETAILED BACKGROUND                              |
+--------------------------------------------------+
```

### Notes

- Biography must not be the first section.
- Fit and booking confidence own the first screen.

## 6. Compare

**MODE:** Student
**OBJECT:** `Match`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [NeedSummaryBar] Current need: TOK essay | urgent | evenings                                     |
+--------------------------------------------------------------------------------------------------+
|                | Tutor A                     | Tutor B                     | Tutor C              |
+--------------------------------------------------------------------------------------------------+
| Summary        | photo + rating + CTA        | photo + rating + CTA        | photo + rating + CTA|
| Best for       | statement                   | statement                   | statement            |
| Fit reasons    | 3 bullets                    | 3 bullets                   | 3 bullets            |
| Subject fit    | strong / medium             | strong / medium             | strong / medium      |
| Teaching style | concise                      | concise                     | concise              |
| Availability   | next slot                    | next slot                   | next slot            |
| Reviews        | count + signal               | count + signal              | count + signal       |
| Price          | amount                        | amount                      | amount               |
| Trust proof    | credentials / tags            | credentials / tags          | credentials / tags   |
+--------------------------------------------------------------------------------------------------+
| [P] Book with Tutor A / B / C                                                             Remove |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [NeedSummaryBar] TOK essay | urgent              |
+--------------------------------------------------+
| [TutorCompareCard] Tutor A                       |
| sections: best for / fit / availability / price  |
| [P] Book with this tutor                         |
+--------------------------------------------------+
| [TutorCompareCard] Tutor B                       |
+--------------------------------------------------+
| [TutorCompareCard] Tutor C                       |
+--------------------------------------------------+
```

### Notes

- Mobile compare is section-by-section, not table-first.

## 7. Booking Flow

**MODE:** Student
**OBJECT:** `Lesson`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [ProgressHeader] Book lesson                                                                     |
| [LessonSummary] Tutor | Need | Subject | timezone                                                |
+--------------------------------------------------------------------------------------------------+
| STEP CONTENT                                           | BOOKING SUMMARY                         |
| Step 1: confirm focus                                  | tutor summary                           |
| Step 2: [ScheduleSurface - select mode]                | selected slot                           |
| Step 3: note / goal                                    | policy reminder                         |
| Step 4: review                                         | price / trial state                     |
|                                                        | [P] Request lesson                      |
+--------------------------------------------------------+----------------------------------------+
| [S] Back                                                                 [P] Continue            |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [ProgressHeader]                                 |
| [LessonSummary]                                  |
+--------------------------------------------------+
| Step content                                      |
| - focus                                           |
| - [ScheduleSurface]                               |
| - note                                            |
| - review                                          |
+--------------------------------------------------+
| summary strip                                     |
+--------------------------------------------------+
| [S] Back                    [P] Continue         |
+--------------------------------------------------+
```

### Notes

- Student sees one clear timezone-aware schedule grammar.
- Policy reminders must appear before submit, not after.

## 8. Student Lessons Hub

**MODE:** Student
**OBJECT:** `Lesson`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+--------------------------------------------------------------------------------------------------+
| [PageTitleBlock] Lessons                                                                         |
| [TabBar] Requests | Upcoming | Past | Cancelled                                                  |
+--------------------------------------------------------------------------------------------------+
| [LessonCard] [LessonCard]                                                                        |
| [LessonCard] [LessonCard]                                                                        |
+--------------------------------------------------------------------------------------------------+
| Optional lesson detail drawer / deep link                                                        |
+--------------------------------------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| [PageTitleBlock] Lessons                         |
| [TabBar - scrollable pills]                      |
+--------------------------------------------------+
| [LessonCard - stacked]                           |
| [LessonCard - stacked]                           |
| [LessonCard - stacked]                           |
+--------------------------------------------------+
| [BottomNav]                                      |
+--------------------------------------------------+
```

### Notes

- Same lesson object as tutor mode.
- Only actions differ.

## 9. Student Messages

**MODE:** Student
**OBJECT:** `Conversation`

### Desktop

```text
+--------------------------------------------------------------------------------------------------+
| [Header]                                                                                         |
+------------------------------+-------------------------------------------------------------------+
| THREAD LIST                  | ACTIVE THREAD                                                     |
| [ConversationItem]           | [PersonSummary] Tutor                                            |
| [ConversationItem]           | [ContextChips] upcoming lesson | English A HL                   |
| [ConversationItem]           |-------------------------------------------------------------------|
|                              | messages                                                          |
|                              | messages                                                          |
|                              | messages                                                          |
|                              |-------------------------------------------------------------------|
|                              | composer                                                          |
+------------------------------+-------------------------------------------------------------------+
```

### Mobile

```text
+--------------------------------------------------+
| [Header]                                         |
+--------------------------------------------------+
| THREAD LIST                                      |
| [ConversationItem]                               |
| [ConversationItem]                               |
| [ConversationItem]                               |
+--------------------------------------------------+
| tap thread -> full-screen thread                 |
+--------------------------------------------------+
| THREAD VIEW                                      |
| [PersonSummary]                                  |
| [ContextChips]                                   |
| messages                                         |
| composer                                         |
+--------------------------------------------------+
| [BottomNav]                                      |
+--------------------------------------------------+
```

### Notes

- Lesson context should be visible in the thread header.
- Same conversation shell as tutor mode.
