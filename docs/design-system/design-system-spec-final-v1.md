# Mentor IB Final Reusable Design System Spec v1

**Date:** 2026-04-07
**Status:** Standalone design-system extraction
**Scope:** Approved tokens, component states, responsive rules, and reusable screen patterns

## 1. Why This Document Exists

This document is the extracted reusable design system for the approved Mentor IB design direction.

It consolidates what is now stable enough to standardize after:

- research and strategy work
- service blueprint and IA definition
- shared component planning
- component-spec waves
- hi-fi desktop screens
- hi-fi responsive and mobile screens

It is intentionally self-contained and does not depend on earlier drafts for interpretation.

This document should be strong enough to act as the starting point for:

- future design work
- future component implementation
- design QA
- cross-role consistency review

## 2. Product And Experience Model

Mentor IB is:

- an IB-native tutoring product
- matching-first, not marketplace-first
- one ecosystem with two operating modes:
  - student guidance mode
  - tutor operating mode

The design system must protect that product model.

It must prevent drift into:

- a generic tutor marketplace
- a student-facing polished storefront plus a separate tutor back office
- a default AI startup visual language

## 3. Approved Direction Summary

The approved visual route is:

- `Route A: Editorial Guidance` as the main product language
- `Route B: Academic Studio` as a structural influence for denser tutor workflows

That means the final system should feel:

- calm
- specific
- intelligent
- warm
- trustworthy
- operational where needed

It should not feel:

- purple AI SaaS
- blue-white startup template
- endless white card marketplace
- enterprise dashboard software
- child-oriented edtech

## 4. System Principles

### Principle 1

Design around shared objects and shared workflows, not around page ownership.

### Principle 2

Student mode and tutor mode use the same design language.

### Principle 3

Role differences usually change:

- density
- visible fields
- helper copy
- available actions

They do not justify:

- separate component libraries
- separate state language
- separate interaction grammar

### Principle 4

When space compresses, context stays visible.

The most important continuity anchors are:

- `NeedSummaryBar`
- `LessonSummary`
- `PersonSummary`
- `ContextChipRow`

### Principle 5

Every major screen must have one clearly dominant surface and one clearly dominant action path.

### Principle 6

Branded emails should still feel like Mentor IB.

## 5. Token System

## 5.1 Typography tokens

### Font families

| Token | Value | Use |
|---|---|---|
| `font-sans` | `IBM Plex Sans` | UI, body, headings, operational text |
| `font-serif` | `Instrument Serif` | controlled editorial emphasis |
| `font-mono` | `IBM Plex Mono` | time, timezone, utility meta, compact labels |

### Typography role rules

- Sans is the default system font.
- Serif is selective emphasis, not the main heading system.
- Mono is utility-only and should stay sparse.

### Type scale

| Token | Desktop | Tablet | Mobile | Use |
|---|---|---|---|---|
| `display-xl` | 56 | 48 | 34 | home hero emphasis |
| `display-lg` | 44 | 38 | 30 | large landing statements |
| `title-xl` | 34 | 30 | 26 | page titles |
| `title-lg` | 28 | 24 | 22 | major section titles |
| `title-md` | 22 | 20 | 18 | sub-section titles |
| `body-lg` | 18 | 17 | 16 | high-priority intro copy |
| `body-md` | 16 | 16 | 16 | default body |
| `body-sm` | 14 | 14 | 14 | supporting text |
| `caption` | 12 | 12 | 12 | labels and secondary meta |
| `utility-sm` | 13 | 13 | 13 | mono time and state support |

### Line-height guidance

| Token | Value |
|---|---|
| `line-tight` | 1.1 to 1.2 |
| `line-body` | 1.55 to 1.7 |
| `line-utility` | 1.4 to 1.5 |

### Approved typography usage

- Use serif in hero emphasis, fit statements, and very selective editorial highlights.
- Tutor operational screens remain mostly sans-led.
- Time, slot, timezone, and compact schedule data should prefer mono when that improves scanning.

## 5.2 Color tokens

### Core palette

| Token | Hex | Role |
|---|---|---|
| `paper-0` | `#FCFAF4` | main page background |
| `paper-1` | `#F6F1E7` | secondary section background |
| `paper-2` | `#EDE4D4` | dividers and soft raised warmth |
| `ink-900` | `#1E1B18` | primary text |
| `ink-700` | `#3D3832` | default body text |
| `ink-500` | `#6A625A` | secondary text |
| `ink-300` | `#B4AA9C` | quiet borders and disabled text |
| `forest-700` | `#173C34` | primary action |
| `forest-600` | `#215347` | hover and strong active state |
| `forest-500` | `#2C6A59` | secondary active brand surfaces |
| `forest-100` | `#DCEBE4` | fit and active support backgrounds |
| `forest-50` | `#EFF6F1` | light supportive success surface |
| `clay-600` | `#B4573E` | controlled accent emphasis |
| `clay-500` | `#C56A50` | warm emphasis support |
| `clay-100` | `#F3DED7` | soft warm highlight |
| `gold-500` | `#B8913D` | trust, merit, review signal |
| `gold-100` | `#F2E8C8` | merit support surface |
| `mist-100` | `#E7EEF0` | data-support surface |
| `mist-300` | `#B7C7CC` | cool support borders |
| `success-500` | `#2F7A58` | positive state |
| `warning-500` | `#A8762A` | pending or caution |
| `danger-500` | `#B2473B` | destructive and error |

### Semantic mapping

| Semantic role | Token |
|---|---|
| page background | `paper-0` |
| secondary section background | `paper-1` |
| primary text | `ink-900` |
| secondary text | `ink-500` |
| divider | `paper-2` or `ink-300` |
| primary CTA | `forest-700` |
| primary CTA hover | `forest-600` |
| accent emphasis | `clay-600` |
| trust and merit | `gold-500` |
| positive state | `success-500` |
| warning state | `warning-500` |
| destructive state | `danger-500` |
| data-support surface | `mist-100` |

### Color rules

- Forest is the primary interactive family.
- Clay is an accent, not the main interface color.
- Gold is reserved for trust, review, and merit moments.
- Warm paper backgrounds must stay visible in both public and app surfaces.
- Do not introduce indigo or purple as parallel brand families.

## 5.3 Surface tokens

### Surface model

| Token | Intent | Typical treatment |
|---|---|---|
| `surface-page` | base page field | `paper-0` background |
| `surface-section` | grouped page band | `paper-1` or subtle contrast shift |
| `surface-panel` | default module | white-warm translucent panel |
| `surface-raised` | priority module | stronger contrast, stronger shadow |
| `surface-support` | supportive data or operational context | mist or soft warm panel |
| `surface-overlay` | drawer, modal, focus layer | elevated panel with stronger shadow |

### Approved panel treatments

| Surface style | Suggested formula | Use |
|---|---|---|
| `panel-default` | white at ~72% with soft border | default modules |
| `panel-soft` | white at ~58% | quiet groupings |
| `panel-mist` | mist at ~78% | tutor support modules, data context |
| `panel-warm` | clay-100 to paper gradient | helper, onboarding, reassurance |
| `panel-forest` | forest gradient with white text | selective high-emphasis callouts |

### Borders and corners

| Token | Value |
|---|---|
| `radius-xl` | 28 |
| `radius-lg` | 22 |
| `radius-md` | 16 |
| `radius-sm` | 12 |
| `border-subtle` | 1px solid low-contrast warm or neutral border |

### Corner rules

- Prefer medium-soft corners.
- Avoid over-rounding every component to the same radius.
- Section edges can occasionally be straighter than panels when editorial separation helps.

## 5.4 Shadow and elevation tokens

| Token | Value | Use |
|---|---|---|
| `shadow-soft` | `0 18px 50px rgba(26, 23, 17, 0.09)` | default raised panel |
| `shadow-raised` | `0 28px 90px rgba(26, 23, 17, 0.12)` | key artboard or priority surface |
| `shadow-action` | similar to soft with color tint | primary CTA or active selection accents |

### Elevation rules

- Use elevation selectively for booking, shortlist, priority next-step, and focused task layers.
- Avoid card-on-card-on-card stacking as the default product language.

## 5.5 Spacing tokens

| Token | Value |
|---|---|
| `space-1` | 4 |
| `space-2` | 8 |
| `space-3` | 12 |
| `space-4` | 16 |
| `space-5` | 20 |
| `space-6` | 24 |
| `space-8` | 32 |
| `space-10` | 40 |
| `space-12` | 48 |
| `space-16` | 64 |
| `space-20` | 80 |

### Spacing rules

- Public and student screens use more whitespace around decisions.
- Tutor screens use tighter groupings but the same scale.
- Do not invent a separate spacing scale for tutor mode.

## 5.6 Motion tokens

### Motion intent

Motion exists for:

- orientation
- continuity
- confirmation

Motion does not exist for:

- novelty
- startup polish theater

### Motion durations

| Token | Duration | Use |
|---|---|---|
| `motion-fast` | 120 to 160ms | hover, chip state, quick feedback |
| `motion-default` | 180 to 220ms | section reveal, small panel change |
| `motion-panel` | 220 to 280ms | drawer, sheet, detail panel |

### Motion rules

- Use low travel distances.
- Avoid bounce by default.
- Tutor operational screens animate less than student discovery screens.

## 5.7 Branded email-template rules

Email templates should inherit the Mentor IB visual identity in a simplified, email-safe way.

Use:

- `font-sans` styling direction first
- the `paper`, `ink`, and `forest` token families as the core brand reference
- one primary CTA per email
- concise hierarchy and short paragraphs

Avoid:

- copying dense app layouts into email
- multiple competing CTAs
- decorative motion or app-only layout tricks
- full chat-message bodies in notification emails

The first branded email families should cover:

- lesson request and lesson decision updates
- cancellation and issue outcomes
- tutor application state updates
- payout processed
- legal or policy updates

## 5.8 Iconography

### Icon system

- Use one clean line-icon family.
- The implemented source of truth is the shared SVG icon set in `src/components/ui/app-icons.tsx`.
- Avoid mixing heavy filled icons with fine outline icons.
- Do not introduce page-local CSS-drawn icons or second icon libraries.

### Icon rules

- Icons clarify, they do not decorate.
- Operational cues should usually be icon plus text, not icon-only guessing.
- Avoid playful classroom icon sets or emoji-driven affordances.
- Subject icons, utility icons, and flag assets should all come through the shared icon module plus configuration mapping, not ad hoc page code.

## 5.8 Imagery

### Imagery policy

- Use real tutor portraits.
- Use real study-context photography where imagery is needed.
- Use restrained editorial textures only when they help atmosphere.

### Avoid

- synthetic-looking portraits
- visibly mixed AI photo styles
- staged handshake business stock
- cartoon or infantilizing illustration systems

## 6. Breakpoints And Responsive System

## 6.1 Breakpoints

| Token | Range | Use |
|---|---|---|
| `phone` | 360 to 767 | primary small-screen experience |
| `tablet` | 768 to 1199 | compressed but still multi-panel capable |
| `desktop` | 1200 and above | full desktop layout |

## 6.2 Responsive principles

### Principle 1

Context moves up, not out.

### Principle 2

Primary actions move closer to the thumb on phone.

### Principle 3

Desktop side rails usually become:

- inline helper blocks
- bottom summary strips
- stacked support sections

### Principle 4

Desktop tables do not shrink into unreadable phone layouts.

They should convert into:

- stacked cards
- sectioned comparison blocks
- full-screen states

## 6.3 Responsive patterns

| Desktop pattern | Tablet shift | Phone shift |
|---|---|---|
| right booking rail | narrower side panel or lower summary | sticky bottom summary strip |
| helper rail | inline helper block | short helper text below the task |
| compare table | simplified matrix or paired columns | stacked tutor compare cards |
| split messages | split if space allows | list state then thread state |
| editor + preview split | stacked with preview near editor | vertical sequence with preview still nearby |
| panel grid overview | fewer columns | urgency-ordered vertical stack |

## 6.4 Navigation rules

- Public and tablet can keep a larger header with selected links.
- Phone header should keep brand plus one clear contextual action.
- Bottom navigation is justified on phone for app-mode student surfaces.
- Student mobile uses bottom navigation as the primary navigation model with up to 5 destinations.
- Tutor mobile must NOT use bottom navigation. Tutor mobile uses a hamburger or drawer navigation model because the tutor IA is wider and tutor usage is desktop-primary.
- Do not accidentally reintroduce bottom navigation on tutor mobile surfaces during implementation.

## 7. Shared State System

## 7.1 State language

The approved shared system language is:

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

## 7.2 State family mapping

| State family | Visual family | Typical use |
|---|---|---|
| `positive` | forest / success | accepted, upcoming, connected |
| `warning` | warning / warm surface | pending, under review, caution |
| `destructive` | danger | declined, cancelled, error |
| `trust` | gold | review proof, verified, merit |
| `informational` | mist | system context, neutral support |

## 7.3 Interaction states

### Shared primitives

Every interactive primitive should define:

- default
- hover
- active
- focus-visible
- disabled

### Focus-visible rule

Focus must be crisp and visible. Do not rely on browser-default thin blue rings if they clash with the product system.

### Disabled rule

Disabled states should reduce contrast and shadow, but keep the control understandable.

## 8. Primitive Components

## 8.1 Primitive set

The approved reusable primitives are:

- `Button`
- `IconButton`
- `TextField`
- `Textarea`
- `SelectField`
- `MultiSelect`
- `SearchField`
- `FilterPill`
- `StatusBadge`
- `SegmentedControl`
- `TabBar`
- `Panel`
- `InlineNotice`
- `Divider`
- `Avatar`

## 8.2 Primitive rules table

| Component | Variants | Core rule | Responsive rule |
|---|---|---|---|
| `Button` | primary, secondary, ghost, danger, accent | primary uses forest, accent uses clay sparingly | full-width is acceptable on phone for key flow steps |
| `IconButton` | quiet, utility, destructive | never rely on icon-only meaning for critical actions | pair with text where ambiguity exists |
| `TextField` | default, compact | warm surface, visible label, crisp focus | field width becomes full-width on phone |
| `Textarea` | default, long-form | same visual language as text field | height should stay generous on tutor application and notes |
| `SelectField` | default, compact | avoid generic browser-looking gray shells | use sheets or drawers when option lists are long on phone |
| `SearchField` | default, compact | same grammar across student and tutor | stays near the top on mobile list screens |
| `FilterPill` | inactive, active, removable | lightweight control, not dominant chrome | phone may collapse many pills into a single filter trigger |
| `StatusBadge` | positive, warning, destructive, trust, info | text label required | same state language everywhere |
| `TabBar` | default, scrollable | same pill grammar across lessons, compare, student detail | scrollable pills are acceptable on phone |
| `Panel` | default, soft, mist, warm, raised | do not repeat indistinguishable cards endlessly | preserve hierarchy when stacked |
| `InlineNotice` | info, warning, success, action-needed | use for explanation and support, not long essays | keep notices short and close to the relevant action |

## 8.3 Primitive specifics

### Buttons

- Primary: forest family, white text, clear elevation.
- Secondary: paper/white support surface, ink text, visible border.
- Ghost: minimal fill, clear hover state.
- Danger: danger family only for real destructive actions.
- Accent: clay family, reserved for a few directional emphasis moments only.

### Fields

- Labels stay visible.
- Focus states must be obvious.
- Avoid thin gray generic SaaS input styling.

### Chips, pills, and tabs

- Use one pill grammar across filters, tags, tabs, and support chips where possible.
- Active state should usually use forest-tinted support, not bright saturated fills.

### Panels

- Strong section headers matter.
- Visual hierarchy comes from composition first, not only from color.

## 9. Canonical Shared Components

## 9.1 Core component set

| Component | Reuse type | Primary object | Approved role |
|---|---|---|---|
| `NeedSummaryBar` | Shared | `LearningNeed` | context anchor in matching and compare |
| `MatchRow` | Shared | `Match` | primary decision unit in results |
| `PersonSummary` | Shared Base + Role Wrapper | `TutorProfile` or `Student` | shared identity grammar |
| `TrustProofBlock` | Shared | trust and proof bundle | proof before biography |
| `CompareTable` | Shared Base + Role Wrapper | `Match` | desktop matrix and mobile stacked compare |
| `LessonSummary` | Shared | `Lesson` | booking and continuity anchor |
| `LessonCard` | Shared Base + Role Wrapper | `Lesson` | shared lesson object card |
| `LessonDetail` | Shared Base + Role Wrapper | `Lesson` | expanded lesson workflow |
| `ScheduleSurface` | Shared Base + Role Wrapper | `Availability` | booking and scheduling grammar |
| `AvailabilityPreview` | Shared | student-visible outcome | scheduling confirmation surface |
| `ConversationShell` | Shared Base + Role Wrapper | `Conversation` | one message architecture |
| `ConversationListItem` | Shared | `Conversation` | one thread-row grammar |
| `ContextChipRow` | Shared | lesson or conversation context | support continuity context |
| `MetricTile` | Shared | derived metric | operational summary tile |
| `ChecklistPanel` | Shared | readiness sequence | activation and setup guidance |
| `Uploader` | Shared Base + Role Wrapper | proof upload | onboarding and credential submission |

## 9.2 Component hierarchy rules

### `NeedSummaryBar`

- stays visible across matching and compare
- may compress on smaller screens but should keep its silhouette
- should not become a chaotic tag cloud

### `MatchRow`

- remains the default results unit
- fit statement carries the strongest text emphasis inside the row
- price and stars never outrank fit reasoning
- on phone it stacks, but still stays row-like in information order

### `PersonSummary`

- one identity grammar for tutor profile, students, lessons, and messages
- role wrappers may change visible fields and actions, not the base identity structure

### `LessonCard`

- one lesson object system across student and tutor
- actions differ by role and state
- state and time are primary
- cards must not split into separate student and tutor visual families

### `ScheduleSurface`

- one scheduling grammar across booking and tutor scheduling
- phone version must remain usable and timezone-visible
- the system must handle recurring hours plus exceptions, not only a weekly grid

### `ConversationShell`

- person and lesson context stay above message content
- student and tutor variants share the same shell
- phone moves from split-view to state-view, not to a different chat system

## 9.3 Role-wrapper rules

Thin wrappers are justified for:

- role-specific actions
- helper copy
- density
- context emphasis

Thin wrappers are not justified for:

- separate visual style
- different state labels
- different interaction grammar

## 10. Component State Matrices

## 10.1 `Lesson` state matrix

| State | Preferred badge family | Primary action direction |
|---|---|---|
| `pending` | warning | accept, decline, withdraw, review request |
| `accepted` | positive | confirm continuity, message, join if near |
| `upcoming` | positive | join, message, reschedule |
| `completed` | informational or trust | review, report, next step |
| `reviewed` | trust | continuity or archive |
| `declined` | destructive | no primary forward action |
| `cancelled` | destructive | continuity, policy, reschedule path if relevant |

## 10.2 `ScheduleSurface` state matrix

| State | Meaning |
|---|---|
| `available` | selectable or open recurring availability |
| `selected` | active student choice |
| `blocked` | unavailable due to rules or conflict |
| `unavailable` | not offered |
| `override` | exception to base schedule |
| `conflict` | scheduling issue requiring attention |
| `past` | no longer actionable |
| `loading` | temporary system state |

## 10.3 `ChecklistPanel` state matrix

| State | Meaning |
|---|---|
| `not_started` | no progress yet |
| `in_progress` | partial completion |
| `complete` | no action needed |
| `blocked` | cannot proceed without resolution |
| `under_review` | submitted, awaiting review |

## 10.4 `MetricTile` state matrix

| State | Meaning |
|---|---|
| `normal` | neutral metric |
| `positive` | healthy state or strong result |
| `warning` | action needed soon |
| `critical` | action needed now |
| `empty` | no relevant data yet |
| `loading` | data incoming |

## 11. Reusable Screen Pattern Library

## 11.1 Approved screen patterns

| Pattern | Dominant object | Core structure | Mobile adaptation |
|---|---|---|---|
| `HomeHero` | `LearningNeed` | hero, chips, trust, sample matches | one vertical narrative block |
| `MatchFlowStep` | `LearningNeed` | progress, summary, one decision surface, helper | helper becomes inline, bottom CTA grows stronger |
| `ResultsList` | `Match` | summary, lightweight filters, stacked `MatchRow` list, shortlist tray | shortlist becomes bottom tray |
| `TutorProfileDecision` | `TutorProfile` | identity, fit, trust, booking rail | booking becomes top action block plus bottom CTA |
| `CompareDecision` | `Match` | active need plus compare surface | matrix becomes stacked compare cards |
| `BookingFlow` | `Lesson` | lesson summary, schedule, note, review, side summary | bottom summary strip |
| `ConversationPattern` | `Conversation` | thread list plus active shell | list state then thread state |
| `TutorOverview` | lesson-led operational stack | next action row, readiness, support panels | urgency-ordered stack |
| `TutorLessonsHub` | `Lesson` | tabs, card list, detail | drill-in detail on phone |
| `TutorSchedulePattern` | `Availability` | editor plus preview | vertical edit then preview flow |
| `TutorStudentsPattern` | `Student` | search, filters, identity-first rows, detail | stacked cards, full-page detail |
| `TutorApplicationStep` | onboarding task | one step surface plus helper | helper collapses inline |

## 11.2 Pattern rules

### Home

- Chips must appear early.
- Sample fit evidence should stay stronger than marketplace browsing language.

### Match flow

- One major decision cluster per screen.
- Helper content supports, but never dominates.

### Results

- Ranking explanation stays visible.
- The list remains decision-led, not inventory-led.

### Tutor profile

- Fit and trust precede long biography.
- Booking confidence stays in the first viewport.

### Compare

- Keep compare small.
- Highlight differences that change the decision.

### Booking

- Timezone visibility is non-negotiable.
- Policy appears before submission.

### Messages

- The person and the lesson context remain stronger than chat decoration.

### Tutor overview

- The first question is always "What should I do now?"

### Tutor schedule

- Editing and student-visible outcome must stay visibly connected.

## 12. Mode Rules

## 12.1 Public and student mode

Should feel:

- calmer
- more guided
- more spacious
- less data-heavy

Use:

- larger section rhythm
- stronger hierarchy
- fewer competing modules
- clearer primary CTA

## 12.2 Tutor mode

Should feel:

- efficient
- capable
- structured
- operational

Use:

- denser grouping
- action-first panels
- higher information density
- more mist support surfaces where helpful

But retain:

- the same fonts
- the same color families
- the same state language
- the same component silhouettes

## 13. Accessibility Rules

### Rule 1

Do not encode meaning by color alone.

### Rule 2

Status labels must be explicit text.

### Rule 3

Time, timezone, and booking state must be readable as text, not icon-only.

### Rule 4

Compare categories, lesson states, and interactive slot states must remain understandable to assistive technology.

### Rule 5

Keyboard order must follow reading order in panels, detail views, and drawers.

## 14. Anti-Patterns

The final system should explicitly avoid:

- indigo or purple AI styling
- endless 12px-radius white cards
- generic marketplace grids as the main discovery pattern
- stat cemetery dashboards
- separate student and tutor component libraries
- giant biography-first tutor profiles
- tiny unreadable compare tables on phone
- booking and scheduling as separate visual systems
- generic CRM tables for tutor students
- giant dashboard-like onboarding forms
- bottom navigation on tutor mobile surfaces (tutor uses hamburger or drawer)

## 15. Standardization Priorities

If this system moves into implementation planning later, the standardization priority should be:

1. foundational tokens
2. primitive controls
3. continuity anchors
4. core shared composites
5. responsive shell patterns
6. mode wrappers

## 16. Final Rule

If a new screen looks like it could belong to:

- a generic AI tool
- a tutor marketplace template
- a B2B admin dashboard

then this design system is not being applied strongly enough.

## 17. Migration Note

This document is intended to be copied into a future repo as the main reusable design-system reference.

It can be used on its own.

If companion material is carried with it, the most useful companions are:

- the approved hi-fi desktop decks
- the approved responsive and mobile pack
- the shared component-spec docs
