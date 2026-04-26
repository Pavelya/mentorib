# Mentor IB — Codex Project Memory

This file is the auto-loaded project entrypoint for the Codex/OpenAI coding agent in this repo.
Use it as the fast path. Do not rely on prior chat memory when this file and the docs can answer the question.
This file is canonical project memory and must be treated as relevant context, not as an unrelated local file.

## Product identity

- Product name: **Mentor IB**
- Domain: `mentorib.com`
- Product model: **match-first, not marketplace-first**
- Architecture principle: **one shared ecosystem for students and tutors, not two separate apps**
- Old names `Tutor IB`, `tutorib`, and `ibcamp` are dead. Use **Mentor IB** in code, copy, metadata, comments, and config.

## Current repo status

- Active execution phase: **Phase 1**
- Completed task: **`P1-FOUND-001`**
- The repo is no longer docs-only. It already has:
  - a Next.js 16 App Router scaffold
  - route-family layouts and placeholders under `src/app`
  - shared shell primitives under `src/components/shell`
  - routing helpers under `src/lib/routing`
  - global CSS token entrypoint in `src/styles/globals.css`
- Verification for `P1-FOUND-001` already passed:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build`
- Local environment caveat:
  - the repo baseline targets `Node 24.x`
  - the current machine may still be on `Node 22.x`
  - if you see an engine warning from `pnpm`, that mismatch is expected until the machine switches to Node 24

## Frozen baseline

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 24.x LTS |
| Framework | Next.js 16.2.x App Router |
| UI | React 19.2.x with React Compiler enabled |
| Language | TypeScript 5.9.x strict |
| Styling | CSS Variables + CSS Modules |
| Package manager | pnpm 10.x |
| Database | Supabase Postgres + Auth + Storage + Realtime |
| ORM | Drizzle ORM + drizzle-kit + `postgres` |
| Payments | Stripe Checkout + Stripe Connect Express |
| Email | Resend |
| Analytics | PostHog |
| Hosting | Vercel |
| Validation | Zod |
| Dates | `luxon` |
| Icons | `lucide-react` (single icon library, accessed only through `src/components/ui/icon.tsx`) |
| Country flags | `country-flag-icons` (single flag library, accessed only through `src/components/ui/flag.tsx`) |
| Tests | Vitest + Testing Library + Playwright |

Do not add by default:

- Tailwind
- React Hook Form
- Zustand, Jotai, Redux
- Firebase Auth, Clerk, Auth0
- Algolia
- SendGrid
- Cloudinary
- Inngest, Trigger.dev, Temporal
- Jest or Cypress

If a task truly needs something outside this list, stop and escalate instead of silently adding it.

## Existing scaffold anchors

Before implementing later tasks, preserve and extend these shared foundations instead of rebuilding them:

- `src/app/layout.tsx`
- `src/app/loading.tsx`
- `src/app/global-error.tsx`
- family layouts and `error.tsx` files under `src/app`
- `src/components/shell/app-frame.tsx`
- `src/components/shell/route-placeholder.tsx`
- `src/components/shell/route-family-error.tsx`
- `src/lib/routing/route-families.ts`
- `src/lib/routing/navigation.ts`
- `src/lib/routing/access-rules.ts`
- `src/lib/routing/redirects.ts`
- `src/styles/globals.css`

Important nuance:
The route-family scaffold intentionally includes some reserved future routes because `P1-FOUND-001` required the approved topology. Future tasks may fill those routes in, but should not redesign the topology unless a source doc explicitly changes it.

## Repo shape

```text
src/
  app/          # routes and layouts
  components/   # shared UI
  modules/      # domain logic
  lib/          # cross-cutting helpers
  styles/       # tokens and shared CSS
  test/         # test utilities
  server/       # server-only DB and infrastructure wiring
supabase/       # canonical SQL migrations, seeds, DB tests, and Supabase config
public/         # static assets
docs/           # architecture, planning, and source-of-truth docs
```

Important note:
The older bootstrap baseline used `drizzle/` as a placeholder for DB work.
The current canonical database contract is:

- `supabase/` owns SQL migrations, seeds, DB tests, and local Supabase config
- `src/server/db` owns shared Drizzle wiring
- `src/modules/**/schema.ts` owns module-level Drizzle table declarations

Do not split database ownership across both `drizzle/` and `supabase/`.

## Default execution model

### 1. Prefer explicit task IDs

The normal workflow is:

- the human gives a task ID such as `P1-FOUND-002`
- the agent implements exactly that task

If no task ID is given:

- if the human asks for “the next task,” choose the next `ready` task using the active phase pack
- otherwise ask for the task ID instead of inventing a broad workstream

### 2. Read order for a task

For any nontrivial implementation task, read in this order:

1. this `CLAUDE.md`
2. the **detailed task section** for the task ID
3. every doc listed under **Required source docs** for that task
4. existing repo files in the touched area
5. `docs/README.md` only if orientation is still needed

Do not reread the entire docs pack by default.
Do not implement from the backlog row alone.

For UI-affecting tasks, also read:

- `docs/design-system/agent-ui-rules.md`
- the relevant canonical design-system docs named by the task
- the existing repo screen or shared component that already solves the same interaction, if one exists

For tasks that affect shared vocabularies, discovery filters, timezones, or currency handling, also read:

- `docs/data/reference-data-governance-v1.md`
- `docs/architecture/configuration-and-governance-architecture-v1.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`

### 3. Pre-flight before coding

Before editing code, explicitly answer:

- exact task ID
- task status
- whether dependencies are satisfied
- the task’s **Scope**
- the task’s **Out of scope**
- files you expect to touch
- packages you expect to add, if any
- whether the task needs migrations, RLS, DTO, env, provider, or SEO work
- for UI work, which existing screen or shared component pattern you are reusing
- for UI work, which canonical config or loader owns any reference-backed labels, icons, flags, or options
- for UI work, whether copy can be removed instead of added

If any of that is unclear, read more before coding.
If it cannot be resolved safely, report a blocker.

## Hard boundaries

- One implementation task at a time.
- The task’s **Scope** is the hard boundary.
- The task’s **Out of scope** list is binding.
- Do not widen scope because adjacent work looks easy.
- Do not install packages unless the current task genuinely requires them.
- Do not create future-task behavior, data models, or provider integrations early.
- Do not create placeholders for future work unless the current task explicitly requires structural topology, layout scaffolding, or reserved route ownership.
- Do not refactor unrelated code while doing feature work.
- Do not implement `draft` or `planned` tasks unless the human explicitly asks for clarification work.
- DS-first: if a needed pattern, primitive, icon, or flag is not in the design system, extend the design system before using it locally. Route-local card, chip, panel, icon, or flag CSS and inline SVGs are forbidden. Icons must come from `src/components/ui/icon.tsx`; country flags must come from `src/components/ui/flag.tsx`. Anything that adds a new DS primitive, variant, or token must update `docs/design-system/component-inventory-v1.md` and (if tokens changed) `docs/design-system/tokens-cheatsheet-v1.md` in the same commit.

When in doubt, the work is out of scope.

## Architecture defaults

- One shared Next.js application. Never split student and tutor into separate apps.
- Server Components for server-rendered reads.
- Server Actions for mutations.
- Route Handlers only for callbacks, webhooks, exports, and narrow machine-facing endpoints.
- Do not create internal `/api/*` page-data endpoints by default.
- Keep business logic out of page files.
- Domain services own business rules.
- Repositories own DB queries.
- Use Supabase clients for Auth, Storage, Realtime, and selected server admin operations.
- Use Drizzle for SQL access and domain data work.
- UI hiding is never security.
- Authorization belongs in server and domain boundaries.

## Data and config defaults

- UTC for canonical storage.
- Always display time in the user’s local timezone.
- Use typed env modules. No scattered `process.env.*` reads.
- Commit `.env.example`, never real secrets.
- Do not hardcode shared design tokens, business statuses, provider IDs, webhook paths, analytics destinations, or policy content in random feature files.
- Reference-backed UI options, labels, icons, and flags must come from shared loaders or configs, not route-local arrays.
- Core shared vocabularies for match, search, settings, results, booking, and tutor surfaces must flow through `src/modules/reference/**`, not route-local helpers.
- Timezone normalization and fallback behavior must flow through `src/lib/datetime/**`.
- Currency defaults and shared money formatting must flow through `src/modules/pricing/**`.
- Centralize meaningful config in shared modules rather than route-local literals.

## Phase 1 product rules that matter during coding

- Phase 1 is **payment-bearing**, not a fake checkout stub.
- Booking flow uses Stripe authorization at request time and capture on tutor acceptance.
- Decline or expiry releases the authorization.
- Tutor payouts use Stripe Connect Express.
- Match-first student experience remains the primary product path.
- Public pages are server-rendered and SEO-sensitive.
- Auth, student, tutor, account, setup, and internal routes default to non-indexable posture.

## Verification standard

Unless the task says otherwise, finish with:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm lint:arch` (architectural-rule lint plus the audit script in `scripts/audit-architectural-rules.ts` — see `docs/design-system/agent-ui-rules.md` and `docs/architecture/canonical-value-ownership-map-v1.md`)

Add task-specific tests or manual checks when the task requires them.
If any relevant verification could not be run, say exactly what was not run and why.
If a task introduces or depends on SQL migrations, Supabase dashboard changes, seed scripts, or other operational steps, call those out explicitly instead of implying they are included in app verification.
Do not call code “done” if it is unverified.

## Report format

End each task with:

- task ID and outcome
- high-signal summary of what changed
- verification run and result
- blockers or caveats
- required manual steps, if any
- local testing checklist for the human, if any

For `required manual steps`, be explicit about:

- whether the human needs to run SQL, migrations, seeds, or dashboard/provider configuration
- the exact file, command, route, or dashboard area involved
- whether the step is required now, later, or only in production
- any environment-variable changes required for the task

For `local testing checklist`, be explicit about:

- which routes, flows, or edge cases the human should test locally
- the minimum smoke-test path to confirm the task works
- whether there is no extra local testing needed beyond automated verification

If there are no manual steps, say so explicitly.
If there is no extra local testing checklist, say so explicitly.

If a task requires environment changes, explicitly list:

- the exact variable names
- whether each belongs in `.env.local`, `.env.example`, or provider/dashboard configuration
- where the human should get each value
- whether missing env vars blocked any verification or runtime behavior

## Git rule

- Do not create commits, branches, or pushes unless the human explicitly asks.

## When to stop and escalate

Stop instead of improvising when:

- the task is not `ready`
- a dependency is missing
- source docs conflict
- a new vendor or package would be required
- secrets or third-party setup are missing for in-scope behavior
- acceptance criteria cannot be met without widening scope
- existing code conflicts with the needed change in a way the docs do not resolve

## How to choose “what’s next”

If the human asks for the next task:

1. use the active phase pack
2. follow the pack’s step order
3. confirm the task is `ready`
4. confirm dependencies are satisfied
5. prefer the highest-priority available task in the current step

Use both **step order and dependencies**.
Do not ignore the detailed `Depends on:` lines.

## Useful doc entrypoints

- `docs/README.md`
- `docs/design-system/agent-ui-rules.md`
- `docs/architecture/canonical-value-ownership-map-v1.md`
- `docs/planning/implementation-backlog-index-v1.md`
- `docs/planning/phase1-mvp-task-pack-v1.md`
- `docs/planning/phase1-5-task-pack-v1.md`
- `docs/planning/phase2-task-pack-v1.md`
- `docs/planning/agent-implementation-decision-index-v1.md`
