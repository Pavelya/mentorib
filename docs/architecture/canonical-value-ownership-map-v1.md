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
