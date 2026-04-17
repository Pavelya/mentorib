# Mentor IB Accessibility And Inclusive UX Architecture v1

**Date:** 2026-04-08
**Status:** Standalone accessibility and inclusive-UX architecture for public, student, tutor, and internal product surfaces
**Scope:** accessibility standard target, semantic structure, keyboard and focus behavior, forms, motion, contrast, multimedia, inclusive content posture, shared-component accessibility contracts, and AI-agent-safe implementation rules

## 1. Why This Document Exists

This document defines the accessibility and inclusive-UX architecture for Mentor IB.

It exists now because the approved product already implies:

- public marketing and trust pages
- multi-step matching flows
- dense tutor operational surfaces
- messaging and lesson management
- public tutor profiles with images and external video
- AI-driven implementation across many future tasks

Without an explicit architecture, accessibility usually becomes:

- a late QA exercise
- limited to a few visual fixes
- inconsistent between public and authenticated surfaces
- broken when custom components grow beyond simple HTML
- too ambiguous for implementation agents to apply consistently

## 2. What This Document Does Not Redefine

This document does not replace the approved design-system, performance, media, meeting, compliance, or security architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`

It does not define:

- the exact final QA process or toolchain
- the exact component API of every control
- a full accessibility audit report
- final legal conformance language for every jurisdiction

Those can come later as implementation and QA companions.

## 3. Core Recommendation

Mentor IB should adopt **WCAG 2.2 AA as the baseline product target** with a small number of stronger internal posture rules where the product especially benefits from them.

The practical rule is:

- use native semantic HTML first
- use ARIA only when semantics need to be supplemented
- make all core flows keyboard-usable
- keep focus visible, not obscured, and logically ordered
- do not rely on color, motion, or hover alone
- keep student and tutor mode in one accessibility system, not two quality levels

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means accessibility rules should be:

- explicit
- component-oriented
- testable
- route-aware
- difficult to bypass accidentally

The architecture should not rely on:

- "we will add ARIA later"
- mouse-only interaction assumptions
- focus handling improvised per screen
- visually nice but semantically empty components
- accessibility fixes added only after the screen is considered complete

## 5. Goals

The accessibility and inclusive-UX architecture should:

- support keyboard, screen-reader, zoom, and reduced-motion users across core flows
- preserve accessibility across both student and tutor surfaces
- keep forms understandable and forgiving
- keep public trust and tutor pages readable and navigable
- reduce cognitive burden in time-sensitive tutoring workflows
- create a reusable accessibility contract for shared components

## 6. Baseline Accessibility Standard

## 6.1 Main rule

The product should target `WCAG 2.2 AA` as the minimum baseline for public and authenticated user-facing surfaces.

## 6.2 House rules above the minimum

In addition to the baseline, Mentor IB should strongly prefer:

- clearly visible custom focus indicators
- target sizes that are comfortable on touch devices, not merely technically passable
- reduced cognitive friction in forms and booking flows
- captions or equivalent accessibility support for public tutor intro video where available

## 6.3 Shared-quality rule

Student and tutor interfaces should not have different accessibility standards.

Denser tutor screens may differ in information density, but not in baseline accessibility quality.

## 7. Semantic Structure And Landmarks

## 7.1 Native-first rule

Use native HTML elements first for:

- buttons
- links
- headings
- lists
- tables
- forms
- dialogs

Only introduce ARIA semantics when native HTML alone cannot express the required behavior.

## 7.2 Landmark rule

Pages should use a small, meaningful landmark structure such as:

- header
- navigation
- main
- complementary or aside when justified
- footer

The goal is efficient assistive-technology navigation, not landmark spam.

## 7.3 Heading rule

Every route should have a logical heading structure that reflects the actual content hierarchy.

Heading levels should communicate structure, not purely styling.

## 7.4 Reading-order rule

DOM order should match intended reading and keyboard order.

Do not rely on CSS reordering that creates a mismatch between visual order and focus order.

## 8. Keyboard And Focus Architecture

## 8.1 Keyboard-first rule

All core product functionality must be operable by keyboard.

This includes:

- matching flow
- filtering and comparing tutors
- booking
- messaging
- lesson navigation
- tutor application
- tutor schedule management

## 8.2 No trap rule

Focus must never become trapped except inside intentional modal contexts that provide standard exit behavior.

## 8.3 Focus-visible rule

Interactive elements must provide a clear visible focus state.

The product should not depend on browser-default outlines being preserved by accident.

## 8.4 Focus-not-obscured rule

Sticky bars, drawers, modals, and floating actions must not obscure the focused element in normal use.

This matters especially for:

- the sticky `NeedSummaryBar`
- results filters
- booking panels
- messages composer
- tutor dashboard side panels

## 8.5 Focus-order rule

Focus order should follow reading order and task logic.

For mobile layouts that collapse columns into stacked views, focus order should remain intuitive after layout change.

## 8.6 Focus-return rule

Overlays and dialogs should return focus to the control that opened them unless there is a stronger task-based reason to send focus elsewhere.

## 9. Forms, Inputs, And Error Handling

## 9.1 Explicit-label rule

Every form control must have an explicit accessible label.

Placeholder text is not a label.

## 9.2 Instruction rule

Important form instructions should be available before or with the relevant field, not hidden only in post-error copy.

This is especially important for:

- tutor application uploads
- availability setup
- booking details
- contact and support forms

## 9.3 Error-identification rule

Errors should be:

- clearly identified
- associated with the relevant field where possible
- understandable in plain language
- not conveyed by color alone

## 9.4 Validation-timing rule

Use validation in a way that helps rather than punishes.

Avoid aggressive interruption while the user is still entering data.

## 9.5 Authentication rule

Authentication should avoid unnecessary cognitive barriers.

Because the product already plans `magic link` and `Google login`, it should avoid challenge styles that create accessibility friction unless abuse posture truly requires it.

## 10. Shared Component Accessibility Contract

## 10.1 Main rule

Every reusable interactive component should have an explicit accessibility contract.

At minimum that contract should cover:

- semantics
- accessible name
- keyboard interaction
- focus behavior
- disabled state behavior
- screen-reader announcement implications
- responsive behavior where it affects interaction

## 10.2 Core shared-component rule

The approved shared components should inherit one accessibility grammar.

Examples:

- `NeedSummaryBar`
- `MatchRow`
- `PersonSummary`
- `LessonCard`
- `ScheduleSurface`
- `ConversationShell`

If those components diverge by role, their accessibility behavior should stay aligned unless the interaction is genuinely different.

## 10.3 ARIA restraint rule

Do not add ARIA to compensate for incorrect HTML when correct native elements are available.

The first fix should usually be semantic structure, not extra attributes.

## 11. Visual Accessibility Posture

## 11.1 Contrast rule

Token choices and final component usage must preserve readable text and usable non-text contrast.

Warm, editorial styling is allowed, but readability wins over aesthetic subtlety.

## 11.2 Color-independence rule

State, proof, warning, and selection signals must not rely on color alone.

Use a combination of:

- text
- iconography where useful
- shape or emphasis
- position only when consistent and obvious

## 11.3 Zoom and reflow rule

The layout should support browser zoom and narrow viewports without breaking core tasks.

This is especially important for:

- results rows
- compare views
- booking steps
- lesson cards
- tutor schedule surfaces

## 11.4 Typography clarity rule

Expressive typography is allowed, but readability comes first.

Decorative serif usage should remain selective and should not replace clear body or control text.

## 12. Motion, Animation, And Timing

## 12.1 Reduced-motion rule

Motion should respect user reduced-motion preferences.

Animations that are decorative or transitional should reduce or simplify when the user prefers less motion.

## 12.2 No essential-motion rule

Core understanding and task completion must not depend on perceiving animation.

## 12.3 Timing rule

Avoid unnecessary time pressure in product flows.

If something has a time-sensitive consequence, the UI should communicate it clearly in text.

## 12.4 Motion scope rule

Micro-motion can support clarity, but:

- it should not distract from reading
- it should not block interaction
- it should not become the only cue that state changed

## 13. Multimedia And Rich Media Accessibility

## 13.1 Image rule

Public and product images should follow a purposeful alt-text strategy:

- informative images get meaningful alt text
- decorative images should be ignored by assistive technology
- functional images should describe the action or destination

## 13.2 Tutor intro video rule

Tutor intro videos embedded from supported external providers should have an accessibility-support posture.

For MVP, the architecture should assume:

- the embed must be keyboard usable
- the provider player should expose standard accessible controls
- captions or equivalent accessibility support should be strongly encouraged and preferred for public-facing tutor videos

## 13.3 Media fallback rule

If an embedded video fails, the page should still communicate essential tutor trust and fit information in text.

The video should enhance the profile, not gate understanding.

## 14. Inclusive Content And Interaction Posture

## 14.1 Plain-language rule

Content should favor clear, direct language over unnecessarily complex product wording.

This matters especially for:

- support copy
- booking expectations
- tutor application guidance
- lesson and schedule states

## 14.2 Stress-aware rule

Many students arrive under academic pressure.

Flows should therefore reduce cognitive burden by:

- presenting one dominant action at a time
- preserving context visibly
- avoiding excessive parallel choices
- using meaningful summaries

## 14.3 Global-usage rule

The product should assume users may differ in:

- timezone
- first language
- reading speed
- device quality

Time, timezone, and scheduling information should therefore remain explicit and easy to scan.

## 14.4 Sensitive-identity rule

Because minors may be present, inclusive UX should avoid exposing student identity more broadly than necessary and should keep trust, review, and messaging surfaces conservative.

## 15. Route-Specific Accessibility Priorities

## 15.1 Public Class A routes

Public indexable routes should optimize for:

- semantic structure
- readable headings
- strong contrast and focus visibility
- clear navigation and CTA labeling
- alt-text quality

## 15.2 Matching and booking routes

The match flow and booking flow should optimize for:

- step clarity
- keyboard progression
- forgiving form behavior
- summary continuity
- low cognitive overhead

## 15.3 Messaging routes

Messaging should optimize for:

- thread list keyboard usability
- understandable conversation context
- explicit composer labels
- non-color unread states
- sensible announcement behavior for new content

## 15.4 Tutor operational routes

Tutor operational routes should optimize for:

- dense but readable layouts
- consistent heading structure
- predictable table/list navigation
- accessible schedule interaction
- non-ambiguous status communication

## 16. Testing And Quality Gates Posture

## 16.1 Main rule

Accessibility should be tested as part of normal implementation, not deferred to a final polish pass.

## 16.2 Minimum verification posture

The implementation process should include:

- semantic review
- keyboard-path review
- focus-state review
- basic screen-reader sanity review on key flows
- automated checks where useful

## 16.3 Route-done rule

A route should not be considered done if:

- a core action cannot be completed by keyboard
- labels are missing or misleading
- focus is invisible or lost
- errors are unclear
- meaning depends only on color

## 17. Phase 1 Must-Haves

Phase 1 should include:

- WCAG 2.2 AA as the working baseline
- semantic landmark and heading structure on public and app routes
- keyboard-complete core user flows
- visible custom focus treatment
- explicit form labels and understandable errors
- reduced-motion support
- alt-text rules for tutor/profile imagery
- accessible external-video embedding posture
- shared-component accessibility contracts for the first implementation wave

## 18. Decisions To Lock Now

The architecture should lock the following decisions now:

- `WCAG 2.2 AA` is the baseline target
- native semantic HTML is preferred over ARIA-heavy custom patterns
- student and tutor modes share one accessibility standard
- keyboard completion is required for all core flows
- focus must remain visible and not obscured
- labels, instructions, and errors must be explicit
- color alone must never carry essential meaning
- reduced-motion preferences must be respected
- shared interactive components must define accessibility contracts

## 19. What This Architecture Prevents

This architecture is meant to prevent:

- polished but keyboard-broken matching or booking flows
- focus disappearing inside sticky or overlay-heavy layouts
- form labels replaced by placeholder-only designs
- inaccessible custom component growth
- role-based accessibility drift between tutor and student surfaces
- future AI agents adding visually impressive but semantically weak patterns

## 20. Final Recommendation

Mentor IB should treat accessibility and inclusive UX as a first-class product architecture concern.

The recommended posture is:

- `WCAG 2.2 AA` baseline
- semantic-first implementation
- keyboard and focus correctness by default
- inclusive, low-friction content and form behavior
- one shared accessibility system across public, student, and tutor surfaces

This creates a product that is safer for AI agents to build, easier for humans to review, more resilient across devices and assistive technology, and more aligned with the trust posture the product already wants to project.

## 21. Official Source Notes

The recommendation above is informed by current official guidance for:

- WCAG 2.2: `https://www.w3.org/TR/WCAG22/`
- W3C Accessibility Principles: `https://www.w3.org/WAI/fundamentals/accessibility-principles/`
- Understanding Guideline 2.1 Keyboard Accessible: `https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible`
- Understanding SC 2.4.13 Focus Appearance: `https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html`
- WAI-ARIA APG introduction: `https://www.w3.org/WAI/ARIA/apg/about/introduction/`
- WAI APG landmarks pattern: `https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/`
- WAI Forms Instructions tutorial: `https://www.w3.org/WAI/tutorials/forms/instructions/`
- WAI Images tutorial: `https://www.w3.org/WAI/tutorials/images/`
- web.dev accessibility guidance on focus order, labels, and reduced motion: `https://web.dev/learn/design/accessibility`
- Understanding SC 2.5.8 Target Size (Minimum): `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum`
- What's New in WCAG 2.2: `https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/`
