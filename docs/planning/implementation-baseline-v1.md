# Mentor IB Implementation Baseline v1

**Date:** 2026-04-10
**Status:** Repo-bootstrap implementation contract for the first coding phase
**Scope:** runtime and package-manager baseline, framework and tooling choices, implementation conventions, version-selection rules, and how future AI agents should combine this baseline with the existing planning and architecture docs

## 1. Why This Document Exists

Mentor IB now has enough product, UX, architecture, data, SEO, privacy, and planning material to start coding.

What was still missing was one repo-level implementation contract.

Without that contract, the first coding agent would still need to guess:

- which exact Node.js line to use
- which exact Next.js and React line to use
- which package manager to use
- whether to start with App Router or Pages Router
- whether to use Tailwind or CSS Modules
- which validation, testing, and data-access libraries to standardize on

That is not a product-architecture gap.

It is a repo-bootstrap gap.

This document exists to close that gap once, so future coding agents do not invent different local baselines in an empty repo.

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/planning/agent-execution-playbook-v1.md`
- `docs/planning/engineering-guardrails-v1.md`
- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/design-system/agent-ui-rules.md`
- `docs/design-system/design-system-spec-final-v1.md`
- `docs/planning/implementation-readiness-pack-v1.md`
- `docs/planning/service-dependency-baseline-v1.md`
- the phase task packs

Those documents still define:

- how agents should execute a task
- which engineering rules and repo hygiene constraints are non-negotiable
- what the product should do
- which routes exist
- how the system should behave
- which providers and service SDKs are approved
- what each implementation task means

This document only defines the repo and toolchain baseline that coding should start from.

## 3. Core Recommendation

Mentor IB should start coding from a conservative 2026 server-first baseline:

- Node.js LTS, not an EOL line and not a bleeding-edge Current line
- Next.js App Router
- React 19 line
- TypeScript in strict mode
- pnpm as the package manager
- Node runtime by default on Vercel
- CSS variables plus CSS Modules, not Tailwind-first utilities
- native forms plus Server Actions plus Zod validation
- Drizzle for SQL access and Supabase clients only where Supabase is actually the right boundary

Short version:

**Freeze one practical stack, pin exact versions during scaffold, and then let future agents read versions from the repo instead of from memory.**

## 4. 2026 Reality Check

This section exists so the baseline matches current reality instead of stale assumptions.

### 4.1 Node.js

As of 2026-04-10:

- Node.js `v24` is `Active LTS`
- Node.js `v25` is `Current`
- Node.js `v22` and `v20` are in `Maintenance LTS`
- Node.js `v16` reached `EOL` on `2023-08-08` and must not be used

Practical rule:

- use `Node 24.x` as the Mentor IB development and production baseline
- do not use `Node 16`
- do not use `Node 25` as the default baseline for the first production build

Why:

- Node's own release policy says production applications should use `Active LTS` or `Maintenance LTS`
- `Node 24.x` is the cleanest current production baseline

### 4.2 Next.js

As of 2026-04-10:

- the current stable documented line is `Next.js 16.2`
- the App Router installation docs require at least `Node.js 20.9`

Practical rule:

- use `next 16.2.x`
- use App Router only
- use Turbopack as the default dev bundler

### 4.3 React

As of 2026-04-10:

- the latest official stable React blog release in the current line is `React 19.2`

Practical rule:

- declare `react 19.2.x` and `react-dom 19.2.x`
- when scaffolding, pin the latest stable patch in the `19.2` line on that day

Important note:

- Next.js App Router uses framework-validated React canary internals where needed
- `react` and `react-dom` should still be declared in `package.json` for tooling compatibility

### 4.4 TypeScript

As of 2026-04-10:

- the latest official TypeScript stable announcement in the current line is `TypeScript 5.9`

Practical rule:

- use `typescript 5.9.x`
- enable strict mode from the beginning

### 4.5 Supabase SSR package

As of 2026-04-10:

- Supabase officially recommends `@supabase/ssr` for SSR frameworks such as Next.js
- the package is still documented as `beta`
- the older auth-helpers path is no longer the preferred direction

Practical rule:

- use `@supabase/supabase-js` plus `@supabase/ssr`
- pin exact versions at scaffold time
- do not start from deprecated auth-helper patterns

### 4.6 Package manager

As of 2026-04-10:

- the current stable `pnpm` major line is `10.x`

Practical rule:

- use `pnpm 10.x`
- pin the exact `pnpm` version in the root `packageManager` field during scaffold

## 5. Baseline Version Targets

These are the baseline targets for repo bootstrap.

They are not a replacement for `package.json`.

They are the version policy the first scaffold task should implement.

| Area | Baseline target |
| --- | --- |
| Node.js | `24.x` |
| Package manager | `pnpm 10.x` |
| Framework | `next 16.2.x` |
| UI runtime | `react 19.2.x`, `react-dom 19.2.x` |
| Language | `typescript 5.9.x` |
| Supabase client | `@supabase/supabase-js 2.x` |
| Supabase SSR helper | `@supabase/ssr` pinned exact at scaffold time |
| SQL ORM | `drizzle-orm` current stable line pinned exact at scaffold time |
| SQL migration tool | `drizzle-kit` matching stable line pinned exact at scaffold time |

Rule:

- this doc chooses the version lines
- the scaffold task pins the exact versions
- after scaffold, `package.json` and the lockfile become the operational source of truth

## 6. Repo And Framework Baseline

The app should start with these framework choices:

- Next.js `App Router` only
- `src/` directory enabled
- import alias `@/*`
- TypeScript from day one
- React Compiler enabled from the start
- Node runtime by default
- no Pages Router unless a later task explicitly requires it

Practical rule:

- do not use create-next-app recommended defaults blindly
- customize the scaffold to match this baseline

## 7. Styling And UI Baseline

Mentor IB already has a strong design-system direction.

The implementation baseline should support that instead of default utility sprawl.

### 7.1 Main styling choice

Use:

- global CSS variables for tokens
- CSS Modules for component-level styling
- a small classname helper such as `clsx`

Do not start with:

- Tailwind as the primary styling system

Why:

- the design system is custom and expressive
- CSS variables map cleanly to the token model already defined in the docs
- CSS Modules reduce framework lock-in and help avoid generic utility-first page assembly

For UI-affecting implementation work, pair this baseline with:

- `docs/design-system/agent-ui-rules.md`
- the canonical design-system and component-spec docs required by the task

### 7.2 Token rule

All design tokens should come from central CSS variable definitions.

Do not hardcode:

- colors
- spacing scales
- radii
- shadows
- z-index values
- breakpoint values

inside random components.

## 8. Forms, Validation, And State Baseline

### 8.1 Form model

Default to:

- native HTML forms
- Next.js Server Actions
- server-owned mutation handling
- Zod for schema parsing and validation

Do not adopt:

- React Hook Form by default in v1

React Hook Form can be added later if a specific workflow genuinely needs it.

### 8.2 State model

Default to:

- Server Components for data-heavy route composition
- local component state for local interaction state
- URL state only where the route meaningfully depends on it

Do not start with:

- Zustand
- Jotai
- Redux
- a global client-state layer

unless a later task clearly proves the need.

## 9. Data Access Baseline

### 9.1 Main rule

Use the approved server-first data boundaries.

Default access path:

- Route -> Server Component or Server Action
- domain service
- repository
- Drizzle / SQL

### 9.2 Supabase usage rule

Use Supabase clients for:

- Auth
- Storage
- Realtime
- selected server-side admin operations where appropriate

Do not use Supabase clients as the default replacement for:

- core app SQL queries
- core domain repositories

### 9.3 SQL driver rule

Use Drizzle with a Node-friendly Postgres driver in the initial scaffold.

Recommended direction:

- `drizzle-orm`
- `drizzle-kit`
- `postgres`

If later deployment behavior reveals a strong reason to adjust the driver choice, do it through a dedicated maintenance task, not inside feature work.

## 10. Testing Baseline

Use this initial test stack:

- `Vitest` for unit and server-side module tests
- `@testing-library/react` for component behavior tests where needed
- `Playwright` for end-to-end route and flow verification

Practical rule:

- do not block the first scaffold on a huge test harness
- do standardize on these tools early so future agents do not mix Jest, Vitest, Cypress, and ad hoc scripts

## 11. Linting, Formatting, And Typechecking Baseline

Use:

- `eslint` with the current Next.js-compatible config
- `tsc --noEmit` for typechecking

Formatting rule:

- do not add a second formatter by default in baseline v1
- if formatting churn becomes real during implementation, add a formatter later as an explicit tooling task rather than casually inside a feature task

This is a deliberate simplification, not a missing decision.

## 12. Date, Timezone, And Scheduling Baseline

Because Mentor IB includes booking, availability, scheduling, and timezone-sensitive UX, the baseline should not leave date handling undefined.

Use:

- UTC as the canonical storage basis
- explicit timezone fields from the data model
- a dedicated timezone-capable date library for application logic

Recommended direction:

- `luxon`

Do not rely on:

- ad hoc string slicing
- inconsistent browser-local conversions
- random mixtures of native `Date` helpers across features

## 13. Environment And Config Baseline

Use:

- `.env.local` for local secrets
- `.env.example` committed to the repo
- one server-only env access layer such as `src/lib/env/server.ts`
- one public env access layer only when truly needed

Validation rule:

- validate environment variables through Zod or an equivalent typed schema
- do not scatter direct `process.env.*` access across the app

## 14. Default Project Structure Baseline

The initial scaffold should follow this shape:

```text
src/
  app/
  components/
  modules/
  lib/
  styles/
  test/
  server/
supabase/
public/
```

Meaning:

- `src/app` owns routes and layouts
- `src/components` owns shared UI pieces
- `src/modules` owns domain logic
- `src/lib` owns cross-cutting helpers
- `src/styles` owns tokens and shared CSS
- `src/server` owns shared server-only infrastructure wiring such as DB clients
- `supabase` owns canonical SQL migrations, seeds, database tests, and local Supabase config

This should align with:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/data/supabase-folder-and-file-conventions-v1.md`
- `docs/data/drizzle-schema-and-query-conventions-v1.md`

## 15. Agent Execution Rule

> **Note:** When `CLAUDE.md` exists at the repo root, it is loaded automatically and defines the authoritative execution protocol, read order, and stack identity. The layered model below is the detailed reference. If `CLAUDE.md` and this section conflict, `CLAUDE.md` wins.

This section answers the practical coding question directly.

Future agents should not treat the docs pack as one giant thing to read every time.

They should use it in layers.

### 15.1 Layer 1: repo baseline

For any coding task, read:

- this document
- `package.json`
- the lockfile
- `tsconfig.json`
- `next.config.*`

These files choose the toolchain.

### 15.2 Layer 2: task scope

Read:

- the detailed task section in the relevant phase pack

Example:

- not only the `P1-FOUND-001` row
- the full `P1-FOUND-001` task section with goal, source docs, scope, and acceptance criteria

### 15.3 Layer 3: decision routing

Read:

- `docs/planning/agent-implementation-decision-index-v1.md`

Use it to find:

- which docs own the decisions for this task
- which docs are universal
- which docs are area-specific

### 15.4 Layer 4: task-specific source docs

Read only the docs required by the detailed task section and the decision index.

For UI-affecting tasks, this usually includes:

- `docs/design-system/agent-ui-rules.md`
- the relevant canonical design-system and component-spec docs
- the existing repo screen or shared component already solving the same interaction

This is the intended retrieval model.

Not:

- read everything

Also not:

- guess from memory

## 16. Version Selection Rule After Bootstrap

Before the repo exists:

- this document is the version baseline

During scaffold:

- the bootstrap agent should verify the current official stable patch versions inside the chosen lines and pin them exactly

After scaffold:

- `package.json` and the lockfile override this document for exact version numbers

Feature-task rule:

- feature agents must not browse for newer versions and silently upgrade dependencies during ordinary feature work

Upgrade rule:

- any framework or dependency upgrade should be a dedicated maintenance task

## 17. What This Resolves

After this document exists, the project should not have another foundational "how do we even start coding?" gap.

Small implementation clarifications may still appear later.

That is normal.

But the baseline questions about:

- versions
- package manager
- styling approach
- validation approach
- test tools
- repo shape
- agent retrieval path

should now be resolved well enough to start.

## 18. Final Recommendation

Mentor IB should now move into coding with one explicit rule:

- freeze this baseline first
- scaffold the repo from it
- pin exact versions in the repo
- execute Phase 1 tasks against the pinned repo baseline, not against agent memory

That is the practical bridge from the docs phase into real implementation.

## 19. Source Checkpoints

These external sources informed the 2026 reality check in this document.

- Node.js releases: [https://nodejs.org/en/about/previous-releases](https://nodejs.org/en/about/previous-releases)
- Next.js App Router installation docs: [https://nextjs.org/docs/app/getting-started/installation](https://nextjs.org/docs/app/getting-started/installation)
- Next.js 16.2 release post: [https://nextjs.org/blog/next-16-2](https://nextjs.org/blog/next-16-2)
- React 19.2 release post: [https://react.dev/blog/2025/10/01/react-19-2](https://react.dev/blog/2025/10/01/react-19-2)
- TypeScript 5.9 announcement: [https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/)
- Supabase SSR overview: [https://supabase.com/docs/guides/auth/server-side](https://supabase.com/docs/guides/auth/server-side)
- Supabase Next.js SSR guide: [https://supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- pnpm releases: [https://github.com/pnpm/pnpm/releases](https://github.com/pnpm/pnpm/releases)
