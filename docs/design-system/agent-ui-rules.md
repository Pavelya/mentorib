# Mentor IB Agent UI Rules v1

**Date:** 2026-04-24
**Status:** Operational implementation companion for AI agents and human reviewers
**Scope:** how UI-affecting implementation should apply the canonical design-system docs, existing repo patterns, shared configs, and copy discipline without creating drift

## 1. Why This Document Exists

Mentor IB already has strong canonical UI sources:

- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/component-specs-phase2-v1.md`
- the approved hi-fi review materials

What was still missing was an operational layer for implementation.

Without that layer, agents can still drift by:

- rebuilding an existing pattern locally instead of reusing it
- making something "similar" instead of matching the existing interaction
- pulling the right data from a shared config but rendering it with a new card or layout
- adding extra helper copy that explains the UI instead of clarifying the user decision

This document exists to prevent that drift.

## 2. What This Document Does Not Replace

This document does not replace:

- `CLAUDE.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/design-system/component-specs-core-v1.md`
- `docs/design-system/component-specs-phase2-v1.md`
- `docs/planning/engineering-guardrails-v1.md`

Those documents still own:

- task execution protocol
- canonical design language and component rules
- approved component anatomy and states
- repo-wide reuse and hardcoding policy

This document only operationalizes how agents should apply them during UI implementation.

If this document conflicts with a canonical design-system or guardrail doc, the canonical doc wins.

## 3. UI Source-Of-Truth Order

For UI-affecting tasks, use this order:

1. `CLAUDE.md`
2. the detailed task section and its required source docs
3. `docs/design-system/design-system-spec-final-v1.md`
4. the relevant component spec doc
5. the approved hi-fi or responsive reference, if the task points to one
6. the existing repo screen or shared component that already solves the same interaction
7. this document

Important rule:

- prefer live repo patterns only when they already align with the canonical design-system docs
- if an existing implementation has clearly drifted, align it back to the canonical docs instead of copying the drift

## 4. Mandatory UI Workflow

Before building or changing UI, the implementing agent should answer:

- what existing screen already solves the same interaction pattern
- whether the task should reuse an existing shared component, add a variant, or extract a shared component
- which canonical config or loader owns any reference-backed options, labels, icons, or flags
- what copy is truly necessary for the user to complete the action
- whether the proposed layout matches the established rhythm of that route family

If the same interaction pattern already exists:

- reuse it exactly before considering local restyling

If this is the second use of a pattern:

- prefer extracting a shared component instead of duplicating markup and CSS

## 5. Reuse And Composition Rules

- Reuse approved tokens, primitives, shared components, and existing interaction grammar before creating new local UI.
- Role differences can change density, visible fields, helper copy, and actions. They do not justify a new visual language or a different interaction model for the same object.
- Do not create near-match versions of an existing pattern because they feel "close enough."
- Within one screen, use one coherent section rhythm. Avoid mixing two design languages inside the same panel.
- Read-only account values should use one shared treatment across account pages unless the task explicitly requires a different pattern.
- If a pattern is already used on a live page, match its structure, spacing rhythm, and selected or hover states closely unless the task explicitly updates that pattern everywhere.

## 6. Reference Data, Config, And Icon Rules

- Reference-backed options must come from the canonical loader or shared config, not a page-local array.
- Labels, icons, flags, and value mappings for a shared domain object must come from the same source of truth.
- Do not duplicate language lists, subject lists, status lists, or other shared reference data in route-local components.
- Do not hardcode cross-screen design tokens, state colors, or product-facing status language in feature-local files.
- If a page needs the same configurable option card already used elsewhere, reuse the same component and the same source data.
- For Mentor IB core student and tutor surfaces, shared vocabularies should come from `src/modules/reference/**`, timezone meaning from `src/lib/datetime/**`, and shared currency handling from `src/modules/pricing/**`.
- All icons must come from the DS `Icon` wrapper at `src/components/ui/icon.tsx` (the only bridge to `lucide-react`). All country flags must come from the DS `Flag` wrapper at `src/components/ui/flag.tsx` (the only bridge to `country-flag-icons`). Inline SVGs and route-local icon or flag components are forbidden.

## 6a. DS-First Rule

- If a needed pattern is not in the design system, extend the design system before using it locally. Route-local card, chip, panel, icon, or flag CSS and inline SVGs are forbidden.
- Any task that adds a new DS primitive, variant, or token must update `docs/design-system/component-inventory-v1.md` and (if tokens changed) `docs/design-system/tokens-cheatsheet-v1.md` in the same commit. The inventory and cheatsheet are not allowed to lag behind the implementation.

## 7. Human-First Copy Rules

- Default to sparse copy.
- Use one page title and one short subtitle only when the page would otherwise feel contextless.
- Do not repeat the same meaning at page, panel, and section level.
- Do not explain obvious UI.
- Do not add technical helper text by default.
- Add helper copy only when it helps the user choose, understand risk, or avoid a mistake.
- Prefer removing duplicate copy before writing new copy.

Practical test:

- if removing a sentence does not make the task harder for the user, remove it

## 8. Consistency Review Checklist

Before calling a UI task done, verify:

- which existing screen or shared component was used as the reference
- which canonical config or loader owns the reference-backed data
- whether any markup or CSS was duplicated instead of extracted
- whether the screen reads cleanly without technical filler copy
- whether desktop and mobile still preserve the same dominant surface and action path
- whether the result still feels like one Mentor IB product, not a feature-local mini design system

## 9. Anti-Patterns

Do not:

- build a new local card for a choice pattern that already exists elsewhere
- make a "similar" visual treatment instead of reusing or extracting the real one
- add helper text that only describes implementation details or obvious behavior
- create route-local arrays for shared options that already have a canonical source
- introduce separate student and tutor component families for the same object
- mix account-row styling, freeform card styling, and ad hoc field styling in one settings panel without a reason

## 10. Enforcement

Mechanically-detectable parts of the DS-first rule are enforced by `pnpm lint:arch`, which combines ESLint (custom architectural rules in `eslint.config.mjs`) with the audit script in `scripts/audit-architectural-rules.ts`. The pre-commit hook (`simple-git-hooks` + `lint-staged`) and CI (`.github/workflows/architectural-lint.yml`) run the same command.

Rules enforced today:

- no `<svg>` markup in any file under `src/app/**` or `src/modules/**` — icons must come through `@/components/ui/icon`, country flags through `@/components/ui/flag`, and brand marks must be exposed as DS components (see `src/components/ui/google-mark.tsx` for the pattern)
- no bare `.card`, `.chip`, or `.panel` class definitions in any `*.module.css` under `src/app/**` — extend the DS primitives instead
- no direct imports of `lucide-react` or `country-flag-icons` outside `src/components/ui/icon.tsx` and `src/components/ui/flag.tsx`
- no `Intl.NumberFormat` outside `src/modules/pricing/**`
- no `process.env.*` reads outside typed env modules in `src/lib/**/env.ts` (with a small explicit allowlist for legacy env-reading helpers)
- no currency-code string literals (`"USD"`, `"EUR"`, `"GBP"`, `"CAD"`, `"AUD"`) outside `src/modules/pricing/**`
- a soft warning for route-local `{ value, label }` option arrays of length ≥ 4 (likely a hardcoded reference vocabulary that belongs in `src/modules/reference/**`)

Run `pnpm lint:arch:test` to verify the enforcement fixtures still flag the rules they are supposed to flag.
