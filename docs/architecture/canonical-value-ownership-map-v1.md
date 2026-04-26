# Mentor IB Canonical Value Ownership Map v1

**Date:** 2026-04-25
**Status:** Implementation-facing ownership map for shared vocabularies, discovery filters, timezone semantics, and pricing values
**Scope:** exact code-module owners for the core values reused across match, search, settings, booking, tutor, and account surfaces

## 1. Why This Document Exists

Mentor IB already has strong governance docs for:

- reference data
- centralized configuration
- anti-hardcoding rules
- reusable UI patterns

What implementation still needs is a direct answer to this question:

**Which code module owns each shared value family?**

Without that answer, future agents are likely to:

- recreate subject or language lists inside a page
- add another local match/search filter helper
- format currency differently on different routes
- treat timezone meaning as page copy instead of shared behavior

This document exists to stop that drift.

## 2. Canonical Owner Rule

For every core cross-surface value family, there must be one primary code owner.

Pages and UI components may adapt those values for display, but they must not redefine the source of truth.

## 3. Canonical Owners

### 3.1 DB-backed reference vocabularies

Owns:

- IB subjects
- subject focus areas
- languages
- learning-need option values used across discovery flows
- other slow-moving shared vocabularies

Primary owners:

- `src/modules/reference/schema.ts`
- `src/modules/reference/catalog.ts`

Rule:

- database-backed reference rows are canonical
- app code consumes them through `catalog.ts`
- no route-local arrays for these vocabularies

### 3.2 Match and search discovery adapters

Owns:

- shared option-building for discovery-style student flows
- the option sets reused by `/match`, `/settings`, and future `/search`

Primary owner:

- `src/modules/reference/discovery.ts`

Rule:

- match-like and search-like UI should consume discovery options from this module
- do not rebuild language or subject card options inside route files

### 3.3 Shared visual mappings for reference data

Owns:

- subject icon mapping
- language flag mapping

Primary owner:

- `src/modules/reference/visuals.ts`

Rule:

- if a shared domain value has an icon or flag, the mapping belongs here
- pages and components should not define their own copies
- the mapping resolves to DS icon keys and flag codes that are rendered through `src/components/ui/icon.tsx` and `src/components/ui/flag.tsx`; no other consumer renders subject icons or language flags

### 3.3a Icon library

Owns:

- the single icon library used across the product (`lucide-react`)
- the typed `IconKey` union and the `Icon` component that renders it

Primary owner:

- `src/components/ui/icon.tsx`

Rule:

- all icons in app code render through `Icon`
- adding a new icon means adding a new `IconKey` and registry entry, never importing from `lucide-react` outside this wrapper
- inline SVG icon definitions in route or component files are forbidden

### 3.3b Country-flag library

Owns:

- the single country-flag library used across the product (`country-flag-icons`)
- the typed `FlagCode` union and the `Flag` component that renders it

Primary owner:

- `src/components/ui/flag.tsx`

Rule:

- all country flags in app code render through `Flag`
- adding a new flag means adding a new `FlagCode` entry, never importing from `country-flag-icons` outside this wrapper
- inline flag SVGs in route or component files are forbidden

### 3.4 Timezone validation and meaning

Owns:

- canonical timezone normalization
- timezone fallback behavior
- timezone labels and formatting context

Primary owners:

- `src/lib/datetime/timezone.ts`
- `src/lib/datetime/format.ts`

Rule:

- pages may present timezone context differently
- they must not redefine what counts as a valid timezone or what the fallback is

### 3.5 Currency defaults and money formatting

Owns:

- default platform currency code
- formatting of amounts stored in minor units

Primary owner:

- `src/modules/pricing/money.ts`

Rule:

- booking, billing, and future search or tutor surfaces should use this module for currency defaults and amount formatting
- do not scatter `USD` literals or local `Intl.NumberFormat` helpers for the same product money concepts

## 4. Surface Rules

The following surfaces must consume the canonical owners above:

- `/match`
- future `/search`
- `/settings` when showing preferred language or other shared vocabularies
- `/results`
- `/book/[context]`
- public tutor profile surfaces
- tutor dashboards and tutor capability editors

## 5. Allowed Adaptation Layer

These local adaptations are allowed:

- choosing which subset of canonical options to show
- route-specific helper copy
- route-specific layout or section structure
- presentation-only grouping of already-canonical values

These are not allowed:

- page-local copies of IB subject or language lists
- separate flag/icon maps for the same reference values
- route-local timezone validation rules
- route-local currency-default constants for shared payment behavior

## 6. Anti-Patterns

Do not:

- add `const languages = [...]` inside a route when languages already come from reference data
- add another subject lookup helper that queries the same tables in a new place
- define a second icon or flag map for the same subject or language keys
- introduce a new `DEFAULT_CURRENCY_CODE` outside `src/modules/pricing`
- treat search, match, settings, and tutor surfaces as separate sources for the same core vocabulary

## 7. Enforcement

The mechanically-detectable parts of this ownership map are enforced by `pnpm lint:arch` (ESLint architectural rules + the audit script in `scripts/audit-architectural-rules.ts`). The pre-commit hook and CI workflow run the same command. See `docs/design-system/agent-ui-rules.md` §10 for the full list of rules; the rules tied to this document are:

- icon and flag library ownership (no direct `lucide-react` / `country-flag-icons` imports outside the DS wrappers)
- pricing currency ownership (no `Intl.NumberFormat` or currency-code literals outside `src/modules/pricing/**`)
- typed env access (no `process.env.*` outside `src/lib/**/env.ts`)
- shared reference vocabulary ownership (a soft review-only warning for route-local `{ value, label }` arrays that look like reference data)
