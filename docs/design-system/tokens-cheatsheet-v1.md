# Mentor IB Design System — Tokens Cheatsheet v1

**Date:** 2026-05-06
**Status:** Created in `P1-DS-FOUND-001-E`. Living reference — any task that adds, renames, or removes a token must update this cheatsheet in the same commit per `docs/design-system/agent-ui-rules.md`.
**Scope:** the public token vocabulary defined on `:root` in `src/styles/globals.css`. This cheatsheet groups those tokens by purpose, names the intended consumers, and shows minimal usage examples so future agents do not invent ad-hoc values for things the token system already covers.
**Companion doc:** `docs/design-system/component-inventory-v1.md` for the primitives that consume these tokens.

## 1. How to use this doc

- Read this doc before adding any color, spacing, radius, shadow, motion, or focus-ring value to a route-local module CSS file.
- If the value you need does not exist as a token, escalate per `docs/design-system/agent-ui-rules.md` rather than inlining a literal — a missing token is a signal that the DS needs to be extended, not bypassed.
- All tokens are exposed as CSS Custom Properties on `:root`. Consume them via `var(--token-name)` in `*.module.css`. Do not redefine these values inside route-local modules.
- Tokens are the **only** approved source for color, spacing, radius, shadow, motion, and state styling under `src/app/**` and shared component CSS modules.
- The hardcoded literal values shown alongside each token are documentation only — never copy them into code.

## 2. Typography

Type ramp values are fluid (`clamp(min, vw, max)`) so headings scale gracefully between phone and desktop breakpoints.

| Token | Value | Intended use |
|---|---|---|
| `--font-sans` | `var(--font-ui-sans), system-ui, sans-serif` | default body, headings, and UI text |
| `--font-serif` | `var(--font-ui-serif), "Times New Roman", serif` | editorial / marketing display moments only |
| `--font-mono` | `var(--font-ui-mono), "SFMono-Regular", monospace` | code samples, structured-data debug surfaces |
| `--display-xl` | `clamp(2.125rem, 2.45vw + 1.575rem, 3.5rem)` | landing hero |
| `--display-lg` | `clamp(1.875rem, 1.55vw + 1.525rem, 2.75rem)` | secondary marketing display |
| `--title-xl` | `clamp(1.625rem, 0.9vw + 1.425rem, 2.125rem)` | route hero titles inside `AppFrame` |
| `--title-lg` | `clamp(1.375rem, 0.65vw + 1.225rem, 1.75rem)` | `Panel` titles, top-level section heads |
| `--title-md` | `clamp(1.125rem, 0.4vw + 1.025rem, 1.375rem)` | `Section` titles, `Card` headings |
| `--body-lg` | `clamp(1rem, 0.2vw + 0.955rem, 1.125rem)` | lead paragraphs, hero descriptions |
| `--body-md` | `1rem` | default body text (set on `body`) |
| `--body-sm` | `0.875rem` | secondary body, helper text |
| `--caption` | `0.75rem` | captions, eyebrows, micro-labels |
| `--utility-sm` | `0.8125rem` | dense control labels, chip text |
| `--line-tight` | `1.15` | display + title line-height |
| `--line-body` | `1.65` | body text line-height (default on `body`) |
| `--line-utility` | `1.45` | dense / utility text line-height |

```css
.heading {
  font-size: var(--title-lg);
  line-height: var(--line-tight);
}
```

## 3. Color palette

The palette is paper-based: warm neutrals (`paper-*`, `ink-*`) plus three brand families (`forest-*`, `clay-*`, `gold-*`) and two ambient accents (`mist-*`, plus the three `success/warning/danger` 500s used by state tokens).

### 3.1 Neutrals

| Token | Value | Intended use |
|---|---|---|
| `--paper-0` | `#fcfaf4` | page background (`--surface-page`) |
| `--paper-1` | `#f6f1e7` | section background (`--surface-section`) |
| `--paper-2` | `#ede4d4` | rarely used directly; reserved for warmer fills |
| `--ink-900` | `#1e1b18` | default text color |
| `--ink-700` | `#3d3832` | secondary text, headings on light surfaces |
| `--ink-500` | `#6a625a` | tertiary text, helper copy, placeholders |
| `--ink-300` | `#b4aa9c` | disabled text, dividers when extra subtle |

### 3.2 Brand and accent

| Token | Value | Intended use |
|---|---|---|
| `--forest-700` | `#173c34` | strong brand surfaces (e.g. `Panel` `forest` tone start) |
| `--forest-600` | `#215347` | brand button defaults, focused interactions |
| `--forest-500` | `#2c6a59` | brand button hover / accent fills |
| `--forest-100` | `#dcebe4` | selected-state surface (`--state-selected-surface`) |
| `--forest-50` | `#eff6f1` | softest brand wash |
| `--clay-600` | `#b4573e` | clay accent stronger |
| `--clay-500` | `#c56a50` | clay accent default |
| `--clay-100` | `#f3ded7` | clay wash, danger-tinted state |
| `--gold-500` | `#b8913d` | trust accent stronger |
| `--gold-100` | `#f2e8c8` | trust wash, gold-tinted state |
| `--mist-100` | `#e7eef0` | info wash |
| `--mist-300` | `#b7c7cc` | info border / divider |
| `--success-500` | `#2f7a58` | success / positive emphasis |
| `--warning-500` | `#a8762a` | warning emphasis |
| `--danger-500` | `#b2473b` | danger / destructive emphasis |

```css
.eyebrow {
  color: var(--forest-600);
}
```

## 4. Surfaces, panels, borders

These are derived tokens that compose neutrals + brand colors into the actual surfaces a primitive renders. Always reach for these instead of re-mixing `paper-*` + alpha by hand.

| Token | Value | Intended use |
|---|---|---|
| `--surface-page` | `var(--paper-0)` | route page background |
| `--surface-section` | `var(--paper-1)` | `Section` background where one is appropriate |
| `--surface-panel` | `rgb(255 255 255 / 0.72)` | `Panel` `default` surface |
| `--surface-panel-soft` | `rgb(255 255 255 / 0.58)` | `Panel` `soft` surface |
| `--surface-raised` | `rgb(255 255 255 / 0.84)` | `Panel` `raised`, modal surfaces |
| `--surface-support` | `rgb(231 238 240 / 0.78)` | `Panel` `mist`, support panels, info chrome |
| `--surface-overlay` | `rgb(252 250 244 / 0.96)` | sticky headers, sheet overlays |
| `--panel-warm` | `linear-gradient(...clay-100 → paper-0)` | `Panel` `warm` |
| `--panel-forest` | `linear-gradient(...forest-700 → forest-500)` | `Panel` `forest` (high-contrast brand panel) |
| `--border-subtle` | `rgb(61 56 50 / 0.12)` | default card and panel borders |
| `--border-strong` | `rgb(61 56 50 / 0.2)` | emphasized borders, focused inputs |
| `--border-support` | `rgb(183 199 204 / 0.58)` | borders on `mist`/`support` surfaces |

## 5. Radius

Step-based; pick the smallest that matches the surface.

| Token | Value | Intended use |
|---|---|---|
| `--radius-sm` | `0.75rem` | chips, small inputs, dense pills |
| `--radius-md` | `1rem` | `Card`, `TextField`, `SelectField` defaults |
| `--radius-lg` | `1.375rem` | `Panel`, large grouped surfaces |
| `--radius-xl` | `1.75rem` | hero / billboard surfaces, sticky overlays |

```css
.card {
  border-radius: var(--radius-md);
}
```

## 6. Spacing

Spacing scale is `--space-{1,2,3,4,5,6,8,10,12,16,20}` (`0.25rem` per step until `--space-6`, then larger jumps). Use spacing tokens for `padding`, `margin`, and `gap` — never hardcode `rem`/`px`.

| Token | Value | Typical use |
|---|---|---|
| `--space-1` | `0.25rem` | hairline gap, badge padding |
| `--space-2` | `0.5rem` | tight gap between adjacent inline elements |
| `--space-3` | `0.75rem` | dense list rows, chip rows |
| `--space-4` | `1rem` | default gap between siblings inside a card |
| `--space-5` | `1.25rem` | comfortable gap inside a `Section` |
| `--space-6` | `1.5rem` | gap between `Section`s inside a `Panel`, default page padding |
| `--space-8` | `2rem` | major vertical rhythm inside a route shell |
| `--space-10` | `2.5rem` | between hero and content blocks |
| `--space-12` | `3rem` | between large page regions |
| `--space-16` | `4rem` | desktop hero padding |
| `--space-20` | `5rem` | top-of-page hero or footer breathing room |

```css
.card {
  padding: var(--space-5);
}

.list {
  display: grid;
  gap: var(--space-3);
}
```

## 7. Shadows

| Token | Value | Intended use |
|---|---|---|
| `--shadow-soft` | `0 18px 50px rgb(26 23 17 / 0.09)` | resting elevation for `Panel` and `Card` |
| `--shadow-raised` | `0 28px 90px rgb(26 23 17 / 0.12)` | dialogs, sticky overlays, `Panel` `raised` |
| `--shadow-action` | `0 18px 50px rgb(23 60 52 / 0.22)` | primary brand call-to-action surfaces |

## 8. Motion

| Token | Value | Intended use |
|---|---|---|
| `--motion-fast` | `140ms` | micro-interactions, hover state transitions |
| `--motion-default` | `200ms` | default transition for most state changes |
| `--motion-panel` | `260ms` | panel/sheet enter and leave |

The `prefers-reduced-motion` media query in `globals.css` already neutralizes animations and transitions, so consumers can use these tokens without manually duplicating reduced-motion guards.

```css
.button {
  transition: background-color var(--motion-default) ease;
}
```

## 9. Breakpoints

| Token | Value | Intended use |
|---|---|---|
| `--breakpoint-phone` | `22.5rem` | phone-sized minimum (also the body `min-width: 320px` floor) |
| `--breakpoint-tablet` | `48rem` | tablet breakpoint (768px) |
| `--breakpoint-desktop` | `75rem` | desktop breakpoint (1200px) |

Use these via `@media (min-width: var(--breakpoint-tablet))` or by reading the value into JS at the layout boundary. Avoid hardcoding `768px` or `1200px` in route CSS.

## 10. Focus and state

The DS standardizes focus rings and stateful surface fills so every primitive surfaces selection, success, warning, and danger consistently.

### 10.1 Focus

| Token | Value | Intended use |
|---|---|---|
| `--focus-outline` | `rgb(23 60 52 / 0.42)` | `outline-color` for focusable elements |
| `--focus-ring` | `0 0 0 3px rgb(23 60 52 / 0.18)` | `box-shadow`-style focus ring on inputs and cards |

```css
.button:focus-visible {
  outline: 2px solid var(--focus-outline);
  box-shadow: var(--focus-ring);
}
```

### 10.2 State surfaces

State tokens come in `surface` + `border` pairs. Use them for tone-mapped chrome on `Chip`, `StatusBadge`, `InlineNotice`, and selected `Card` variants.

| Surface token | Border token | Intended tone |
|---|---|---|
| `--state-disabled-surface` | `--state-disabled-border` (text: `--state-disabled-text` → `var(--ink-300)`) | disabled controls |
| `--state-selected-surface` (`var(--forest-100)`) | `--state-selected-border` | radio/select-card selection |
| `--state-info-surface` | `--state-info-border` | informational notices, neutral chips |
| `--state-positive-surface` | `--state-positive-border` | success notices, positive chips, `success-500` text |
| `--state-warning-surface` | `--state-warning-border` | warnings, `warning-500` text |
| `--state-danger-surface` | `--state-danger-border` | destructive / error, `danger-500` text |
| `--state-trust-surface` | `--state-trust-border` | trust / verified pill, gold accent |

```css
.chip[data-tone="positive"] {
  background: var(--state-positive-surface);
  border: 1px solid var(--state-positive-border);
  color: var(--success-500);
}
```

## 11. Stacking

The DS exposes a single z-index token for the portal layer; route-local stacking values remain forbidden.

| Token | Value | Intended use |
|---|---|---|
| `--z-popover` | `1000` | portal-rendered overlays (`Popover`, `Menu`, future `Tooltip`/`Dialog`) so they layer above `AppFrame` chrome without colliding |

Introduced in `P2-DS-MENU-001` alongside the `Popover` primitive. Future floating primitives (Tooltip, Dialog) should reuse this token until the DS has reason to introduce a multi-step stacking scale; the bare numeric literal `1000` must never appear in route-local CSS.

## 12. What is **not** a token

The following are intentionally **not** exposed as tokens; do not invent them:

- per-route accent palettes — extend a state pair instead
- per-component spacing scales — use `--space-*` only
- multi-step z-index scale — only `--z-popover` is defined today (§11). If a route needs a stacking value that does not match the portal layer, escalate per `agent-ui-rules.md` rather than inlining a magic number
- font-weight scale — pick from CSS-supported weights (`400`, `500`, `600`, `700`); do not introduce a `--weight-*` family without DS sign-off

## 13. Maintenance contract

- Every change to `:root` in `src/styles/globals.css` must update this cheatsheet in the same commit.
- Every new DS primitive must consume only the tokens documented here. New primitive variants that need a new token must add the token to `globals.css` and document it here at the same time.
- `pnpm lint:arch` enforces the structural side of the DS-first rule (no inline SVG, no route-local `.card`/`.chip`/`.panel`, no currency literals outside `pricing/**`). It does not yet enforce token usage; reviewers must catch hardcoded color/spacing/radius values during review until that audit grows.
