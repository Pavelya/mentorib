# Mentor IB Hi-Fi Direction Boards v1

**Date:** 2026-04-07
**Status:** Standalone visual-direction document
**Scope:** Hi-fi routes for the fresh-start product

## 1. Why This Document Exists

This document translates the product strategy and design foundations into concrete visual directions for hi-fi design.

It is intentionally self-contained and does not rely on earlier drafts for context.

Its job is to prevent the product from drifting back into:

- generic AI startup styling
- blue-white SaaS sameness
- marketplace card clutter
- separated student and tutor visual systems

## 2. Brand Stance

Mentor IB should feel like:

- serious but not severe
- academic but not institutional
- warm but not childish
- premium but not luxury
- operational but not corporate

The visual system should communicate:

- “we understand the specific IB problem”
- “we can guide you toward the right tutor”
- “the tutor workflow is part of the same product, not a back-office tool”

## 3. Core Visual Tension

The brand should hold four tensions at once:

1. editorial and operational
2. warm and precise
3. human and structured
4. memorable and highly usable

If a future design choice only satisfies one side of those tensions, it is probably too generic.

## 4. Shared Visual Constants

These constants should remain true across all routes:

- Primary sans: `IBM Plex Sans`
- Accent serif: `Instrument Serif`
- Utility mono: `IBM Plex Mono`
- warm paper backgrounds
- dark ink text
- forest as primary action color
- clay as controlled emphasis
- gold as proof and distinction cue
- real human imagery only
- no default marketplace card wall
- no purple AI glow

## 5. Recommended Direction

The recommended primary route is:

**Route A: Editorial Guidance**

It best supports:

- the matching-first strategy
- the pressure-point framing
- the trust-heavy tutor decision
- the one-ecosystem student and tutor system

Routes B and C are useful supporting explorations, but Route A should be the default production track unless testing shows a major issue.

## 6. Route A: Editorial Guidance

### Core feeling

Calm academic confidence with human warmth and clear decision support.

### Visual keywords

- editorial
- precise
- warm
- grounded
- high-trust
- modern but not trendy

### Typography usage

- serif appears in the hero and selective emphasis moments only
- sans handles all navigation, body, forms, and operational screens
- mono is used for time, timezone, schedule labels, and compact metrics

### Color emphasis

- `paper-0` and `paper-1` dominate backgrounds
- `ink-900` and `ink-700` dominate reading surfaces
- `forest-700` anchors primary actions
- `clay-600` is used for selective highlights and urgency accents
- `gold-500` and `gold-100` signal proof, merit, and trusted validation

### Surface style

- broad warm sections
- low-gloss panels
- visible but quiet borders
- occasional mist surfaces for data-heavy support areas
- fewer boxes, more strong content bands

### Image style

- real tutors and students in focused academic moments
- natural lighting
- close or medium crops
- desks, notebooks, annotated documents, laptops, oral practice moments
- no staged handshake photos
- no sterile office stock

### Iconography

- simple line icons with modest stroke weight
- geometric but not techy
- used as helpers, not decoration

### Motion style

- short, restrained transitions
- section reveals feel deliberate, not flashy
- comparison, save, and booking actions use subtle state changes rather than dramatic animation

### Best fit screens

- home
- match flow
- results
- tutor profile
- booking

### Tutor mode adaptation

- same colors and typography
- slightly denser panels
- more mist surfaces in support modules
- stronger grid alignment

### Main risk

If overdone, it can become too quiet and lose product energy.

### Guardrail

Use strong hierarchy, visible action color, and high-quality human imagery to keep it alive.

## 7. Route B: Academic Studio

### Core feeling

Sharper, more structured, more studio-like precision with a stronger sense of expertise.

### Visual keywords

- focused
- intelligent
- composed
- premium
- exacting

### Typography usage

- sans does most of the work
- serif is used more sparingly than in Route A
- mono becomes more visible in operational contexts

### Color emphasis

- more contrast between paper and ink
- forest remains primary
- mist surfaces appear more often
- clay becomes rarer and more surgical

### Surface style

- firmer grid
- more defined panel boundaries
- slightly tighter density
- more visible structure lines and dividers

### Image style

- fewer images overall
- stronger use of document fragments, notebook details, and cropped human moments
- less lifestyle warmth than Route A

### Iconography

- tighter and slightly more technical

### Motion style

- crisper transitions
- more direct state changes

### Best fit screens

- tutor overview
- tutor lessons
- tutor students
- tutor schedule

### Student mode adaptation

- can work if softened with larger spacing and more paper surfaces

### Main risk

It can drift toward “professional dashboard” and lose emotional memorability.

### Guardrail

Keep the human and editorial cues visible on student-facing screens.

## 8. Route C: Warm Field Notes

### Core feeling

More textural, more tactile, more visibly human and study-centered.

### Visual keywords

- personal
- encouraging
- lived-in
- warm
- specific

### Typography usage

- serif receives slightly more presence in section headers and highlights
- sans still owns UI and body copy

### Color emphasis

- stronger clay and paper usage
- forest remains primary but feels softer in context
- gold stays important for merit cues

### Surface style

- slightly more textural section backgrounds
- more use of layered papers, dividers, and editorial framing blocks
- less panel rigidity

### Image style

- highly human
- study materials, handwritten notes, oral prep, essay markup
- intimate desk-level compositions

### Iconography

- simple and restrained
- less technical feeling than Route B

### Motion style

- gentle reveals
- softer transitions

### Best fit screens

- home
- tutor profile
- trust sections
- onboarding

### Tutor mode adaptation

- harder to scale into dense operational screens without losing clarity

### Main risk

It can become too lifestyle-oriented and too soft for serious workflow screens.

### Guardrail

Use it only if the operational layer stays disciplined and grid-led.

## 9. Route Comparison

| Dimension | Route A | Route B | Route C |
|---|---|---|---|
| Memorability | High | Medium | High |
| Matching-first clarity | High | Medium | Medium |
| Tutor operational fit | High | High | Medium |
| Trust and warmth | High | Medium | High |
| Risk of generic dashboard | Low | Medium | Low |
| Risk of softness | Low | Low | Medium |

## 10. Final Recommendation

Use:

- Route A as the main production route
- Route B as a controlled influence for tutor operational density
- Route C only as a texture reference for selected public and trust moments

This yields:

- one visual family
- a memorable public/student side
- a disciplined tutor side
- no split into two design worlds

## 11. Key Screen Direction Notes

### Home

- Use Route A
- give the hero an editorial split with one strong human image or one match-story panel
- let chips feel like entry points, not app filters

### Match Flow

- Use Route A
- reduce ornament
- keep the question surface large, quiet, and psychologically easy

### Results

- Use Route A with some Route B structure
- keep the list elegant and evidence-led
- let `MatchRow` feel premium and specific, not card-feed-like

### Tutor Profile

- Use Route A
- identity, fit, proof, and booking should feel like one confident composition

### Booking

- Use Route A with Route B discipline
- `ScheduleSurface` must feel clear and operational without becoming sterile

### Messages

- Use Route A and B together
- thread context and person identity should remain stronger than chat decoration

### Tutor Overview

- Use Route B under Route A’s color and typography system
- urgency, next actions, and lesson continuity should dominate

### Tutor Lessons

- Use Route B under Route A’s brand system
- keep lesson surfaces dense but warm

### Tutor Schedule

- Use Route B under Route A’s brand system
- schedule edit and student-visible preview should feel like one disciplined surface family

## 12. Component-Level Hi-Fi Notes

### `NeedSummaryBar`

- warm paper or forest-tinted support surface
- concise, structured, not tag-cloud-like
- strong rhythm between need attributes

### `MatchRow`

- premium stacked list item, not a boxed card tile
- fit statement receives the largest text emphasis inside the row
- proof and availability use quieter supporting rhythm

### `PersonSummary`

- compact, human, high-trust
- photo quality matters more than container decoration
- should scale across profile, messages, students, and lessons

### `LessonCard`

- state and time are immediately scannable
- preserve warmth through paper surfaces and restrained accents
- avoid dense admin-row feeling

### `ScheduleSurface`

- use mono carefully for time labels
- selection states should be obvious without bright neon colors
- preview surfaces should feel clearly related to edit surfaces

### `ConversationShell`

- minimize chat-app tropes
- emphasize relationship context
- keep system notices clean and integrated

## 13. What To Avoid In Hi-Fi

- glassmorphism
- generic gradient blobs
- purple or electric-blue AI accents
- massive rounded SaaS cards everywhere
- avatar-only social layouts
- app-store illustration style
- luxury editorial styling that slows utility
- enterprise-dashboard density on student screens

## 14. First Hi-Fi Screens To Produce

The first hi-fi screens should be:

1. Home hero and first trust band
2. Match Flow question screen
3. Results list with two or three `MatchRow` examples
4. Tutor Profile first viewport
5. Booking timing step
6. Messages shell
7. Tutor Overview top section
8. Tutor Schedule editor and preview

## 15. Next Step After This Document

After the direction boards are approved, the next deliverables should be:

1. first hi-fi key-screen comps
2. cross-screen component polish pass
3. responsive hi-fi variants
4. clickable prototype flow
