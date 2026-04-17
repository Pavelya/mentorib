# Mentor IB Design System Foundations v3

**Date:** 2026-04-07
**Status:** Fresh-start foundation direction
**Scope:** Typography, color, surfaces, spacing, iconography, motion, imagery, density rules
**Companion docs:**
- `docs/design-system/component-specs-core-v1.md`
- `docs/foundations/ux-object-model.md`
- `docs/wireframes/wireframes-student-core-v1.md`
- `docs/wireframes/wireframes-tutor-core-v1.md`

## 1. Intent

This document replaces the old generic marketplace / startup visual logic with a new foundation system.

The design goal is:

**Editorial academic guidance with operational clarity.**

It should feel:

- calm
- sharp
- intelligent
- specific
- trustworthy
- memorable

It should not feel:

- generic SaaS
- AI template blue-on-white
- consumer marketplace grid-first
- child-oriented edtech
- enterprise admin software

## 2. Core Experience Principle

Student mode and tutor mode use the same visual DNA.

The difference is:

- student mode is lighter, more guided, more spacious
- tutor mode is denser, more operational, more task-forward

The same foundations apply to both.

## 3. Typography

## 3.1 Font system

### Primary sans

`IBM Plex Sans`

Why:

- clear and highly legible
- more human and academic than default geometric startup sans fonts
- strong at both UI and dense operational views

### Accent serif

`Instrument Serif`

Why:

- editorial and distinctive
- elegant without becoming luxury-brand or magazine-theatrical
- useful for emphasis and identity

### Utility mono

`IBM Plex Mono`

Why:

- works for time, slots, schedules, compact data labels, and system cues

## 3.2 Typography roles

| Role | Font | Use |
|---|---|---|
| Display emphasis | `Instrument Serif` | Hero emphasis, section highlights, selected nouns |
| UI heading | `IBM Plex Sans` | Page titles, section heads, panel titles |
| Body | `IBM Plex Sans` | General reading text |
| Utility / meta | `IBM Plex Mono` | Time, timezone, status codes, dense labels |

## 3.3 Typography rules

### Rule 1

Do not use serif for every heading.

Serif is controlled emphasis, not the default system font.

### Rule 2

Major operational screens should still primarily use the sans system.

### Rule 3

Mono should be used sparingly, in moments where utility improves clarity:

- time slots
- timezone indicators
- lesson IDs or compact system labels
- metric annotations

## 3.4 Suggested type scale

| Token | Suggested size | Use |
|---|---|---|
| `display-xl` | 56 | Home hero emphasis |
| `display-lg` | 44 | Major landing statements |
| `title-xl` | 34 | Page title |
| `title-lg` | 28 | Major section title |
| `title-md` | 22 | Subsection title |
| `body-lg` | 18 | Key body intro copy |
| `body-md` | 16 | Default body |
| `body-sm` | 14 | Supporting text |
| `caption` | 12 | Labels, status support, secondary meta |

## 4. Color System

## 4.1 Palette direction

Avoid:

- generic indigo startup palettes
- purple AI gradients
- cold gray-heavy surfaces

Recommended palette families:

- paper
- ink
- forest
- clay
- gold
- mist

## 4.2 Core tokens

### Neutrals

| Token | Hex | Purpose |
|---|---|---|
| `paper-0` | `#FCFAF4` | Main page background |
| `paper-1` | `#F6F1E7` | Secondary background blocks |
| `paper-2` | `#EDE4D4` | Light dividers and raised warm surfaces |
| `ink-900` | `#1E1B18` | High-emphasis text |
| `ink-700` | `#3D3832` | Default body text |
| `ink-500` | `#6A625A` | Secondary text |
| `ink-300` | `#B4AA9C` | Quiet borders and disabled text |

### Primary brand family

| Token | Hex | Purpose |
|---|---|---|
| `forest-700` | `#173C34` | Primary CTA, active state, key anchors |
| `forest-600` | `#215347` | Hover / strong supportive actions |
| `forest-500` | `#2C6A59` | Secondary active brand surfaces |
| `forest-100` | `#DCEBE4` | Soft brand-tinted surfaces |
| `forest-50` | `#EFF6F1` | Light success/fit backgrounds |

### Accent family

| Token | Hex | Purpose |
|---|---|---|
| `clay-600` | `#B4573E` | Accent CTA moments, key emphasis, urgency accents |
| `clay-500` | `#C56A50` | Warm emphasis |
| `clay-100` | `#F3DED7` | Soft highlight backgrounds |

### Merit / proof family

| Token | Hex | Purpose |
|---|---|---|
| `gold-500` | `#B8913D` | Ratings, merit cues, distinction accents |
| `gold-100` | `#F2E8C8` | Merit surface background |

### Utility family

| Token | Hex | Purpose |
|---|---|---|
| `mist-100` | `#E7EEF0` | Cool support surface for data panels |
| `mist-300` | `#B7C7CC` | Quiet data borders |
| `danger-500` | `#B2473B` | Errors, destructive actions |
| `success-500` | `#2F7A58` | Confirmations and success |
| `warning-500` | `#A8762A` | Pending / caution |

## 4.3 Semantic mapping

| Semantic role | Token |
|---|---|
| Page background | `paper-0` |
| Secondary section background | `paper-1` |
| Primary text | `ink-900` |
| Secondary text | `ink-500` |
| Divider | `paper-2` or `ink-300` |
| Primary action | `forest-700` |
| Primary action hover | `forest-600` |
| Accent highlight | `clay-600` |
| Trust / merit | `gold-500` |
| Success | `success-500` |
| Warning / pending | `warning-500` |
| Danger | `danger-500` |

## 4.4 Color rules

### Rule 1

Primary interactive color is `forest`, not indigo.

### Rule 2

`Clay` is an accent, not the main UI color.

### Rule 3

`Gold` is reserved for review/rating/merit-type moments.

### Rule 4

Warm paper backgrounds are part of the identity and should be visible across both public and app surfaces.

## 5. Surface System

## 5.1 Surface philosophy

The product should rely less on endless floating cards and more on structured page composition.

Use:

- page sections
- framed content areas
- editorial dividers
- deliberate contrast shifts

Not:

- card-on-card-on-card UI as the default language

## 5.2 Core surfaces

| Surface | Purpose |
|---|---|
| `surface-page` | Main paper background |
| `surface-section` | Section grouping with subtle contrast shift |
| `surface-panel` | Key module or operational panel |
| `surface-raised` | Priority panel, booking module, request module |
| `surface-overlay` | Modal, drawer, focused task layer |

## 5.3 Surface rules

### Rule 1

Public pages should use larger section blocks and fewer repeated cards.

### Rule 2

Operational pages can use panels more often, but should still avoid default SaaS card spam.

### Rule 3

Booking modules, pending requests, and next lesson blocks can use raised surfaces.

## 5.4 Border and edge language

Recommended:

- mostly medium-soft corners
- occasional straighter editorial dividers
- thin warm borders
- visible section rules and separators

Avoid:

- over-rounding everything
- borderless mush
- generic 12px-radius card repetition everywhere

## 6. Spacing and Layout

## 6.1 Layout principle

Generous spacing for public/student decision screens.
Tighter but still breathable spacing for tutor operational screens.

## 6.2 Suggested spacing scale

| Token | Value |
|---|---|
| `1` | 4 |
| `2` | 8 |
| `3` | 12 |
| `4` | 16 |
| `5` | 20 |
| `6` | 24 |
| `8` | 32 |
| `10` | 40 |
| `12` | 48 |
| `16` | 64 |
| `20` | 80 |

## 6.3 Layout rules

### Public / student

- more whitespace around decisions
- larger section gaps
- fewer elements per row

### Tutor

- denser information grouping
- more compact panels
- stronger grid alignment

### Shared

- the same spacing scale should govern both
- only the density rules differ

## 7. Iconography

Use one icon system across the product.

Recommended direction:

- Lucide or similarly clean line icons
- slightly refined stroke consistency
- no mixed filled/outlined chaos

Rules:

- icons should clarify, not decorate
- avoid emoji or playful educational icon sets
- use icon + text for operational cues, not icon-only guessing games

## 8. Motion

Motion should support:

- orientation
- reassurance
- continuity

Not:

- delight for its own sake
- startup polish theater

Recommended motion moments:

- page section reveal
- step transition in match flow
- schedule selection feedback
- compare add/remove confirmation
- request accepted / cancelled confirmation
- drawer and panel transitions

Motion rules:

- short durations
- low travel distances
- no bouncy gimmicks by default
- operational screens should animate less than public discovery screens

## 9. Imagery

## 9.1 Policy

Use a single, high-trust imagery system.

Recommended:

- real tutor portraits
- real study/work context photography
- restrained abstract editorial textures only when helpful

Avoid:

- synthetic-looking portraits
- mixed AI photo styles
- random stock-photo classroom clichés
- illustration systems that infantilize the product

## 9.2 Image direction

Tutor portraits should feel:

- real
- specific
- high-trust
- consistent in crop and quality

## 10. Density Rules By Mode

## 10.1 Student mode

Should feel:

- calmer
- more guided
- more spacious
- less data-heavy

Use:

- stronger hierarchy
- fewer competing modules
- clearer primary CTA

## 10.2 Tutor mode

Should feel:

- efficient
- capable
- structured
- operational

Use:

- compact grouping
- action-first panels
- higher information density

But still retain:

- the same typography
- the same surfaces
- the same state colors
- the same component grammar

## 11. Foundation-Level Component Rules

### Buttons

- Primary: `forest-700`
- Secondary: paper surface + ink text + warm border
- Quiet/Ghost: minimal surface, clear hover state
- Accent CTA: reserved, use `clay` sparingly for directional emphasis

### Badges and status

- Pending -> warm warning
- Confirmed/accepted -> forest/success family
- Cancelled/declined -> danger family
- Informational system states -> mist family

### Inputs

- soft warm surfaces by default
- crisp focus states
- visible labels
- avoid thin gray generic form styling

### Panels

- use strong section headers
- avoid indistinguishable panel repetition
- booking and next-step panels deserve stronger contrast

## 12. What This Foundation Should Change Versus The Old System

### Move away from

- Geist-first startup feeling
- indigo-first marketplace feeling
- endless rounded white cards
- generic search-page visual hierarchy

### Move toward

- IBM Plex Sans + Instrument Serif identity
- forest + paper + clay palette
- editorial section rhythm
- shared object clarity
- calm but distinctive two-sided product language

## 13. Immediate Application Priorities

These foundations should be applied first to:

1. Match flow
2. Results / search
3. Tutor profile
4. Booking flow
5. Tutor overview
6. Tutor lessons
7. Tutor schedule

## 14. Final Rule

If a screen looks like it could belong to:

- a generic AI tool
- a marketplace template
- a B2B admin dashboard

then the foundations are not being applied strongly enough.
