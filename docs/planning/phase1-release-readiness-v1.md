# Mentor IB — Phase 1 Release Readiness v1

**Date:** 2026-05-06
**Task:** `P1-QUALITY-002` Phase 1 release and verification checklist pass
**Scope:** explicit verification outcome for every Phase 1 route, core mutation, and shared system; named blockers; one-pass readiness review of the MVP.
**Companion docs:**
- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/planning/public-route-seo-acceptance-checklist-v1.md`
- `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

## 1. Verification posture at the time of this pass

| Verification | Status | Notes |
|---|---|---|
| `pnpm lint` | pass | clean |
| `pnpm typecheck` | pass | clean |
| `pnpm build` | pass | clean; route table renders all expected static + dynamic routes |
| `pnpm lint:arch` | pass | `Architectural audit OK (0 warnings).` (ESLint architectural rules + `scripts/audit-architectural-rules.ts`) |
| Automated unit / integration tests | **missing** | no Vitest config, no test runner, no `*.test.ts` / `*.test.tsx` / `*.spec.*` files anywhere |
| Automated E2E tests | **missing** | no Playwright config, no `e2e/` directory |
| CI build / typecheck / test workflow | **missing** | only `.github/workflows/architectural-lint.yml` exists |
| Post-deploy smoke verification automation | **missing** | no scripted post-deploy smoke routine |

`pnpm lint:arch` is the only mechanically enforced gate in CI today.

## 2. Release blockers

### B1 — `RESEND_FROM_*` env-var name mismatch (critical)

- `.env.example` lists `RESEND_FROM_EMAIL=`.
- [src/lib/email/env.ts:21](src/lib/email/env.ts#L21) reads `process.env.RESEND_FROM_ADDRESS`.
- Effect: a human following `.env.example` and setting `RESEND_FROM_EMAIL` in production will silently fall back to the hardcoded `DEFAULT_FROM_ADDRESS` (`Mentor IB <notifications@mentorib.com>`). All branded auth and transactional email will originate from the default address regardless of operator intent.
- Resolution path (out of scope for `P1-QUALITY-002`): pick one canonical name (recommend `RESEND_FROM_ADDRESS` to match the code) and update either the `.env.example` entry or the code reader in a single follow-up. Track as a follow-up issue.

### B2 — Verification stack absent at MVP gate (high)

- CLAUDE.md frozen baseline mandates Vitest + Testing Library + Playwright.
- `docs/architecture/testing-and-release-architecture-v1.md` §6, §9, §12, §16 mandate Vitest, Playwright, GitHub Actions CI, and post-production smoke verification as Phase 1 defaults.
- Repo has none of the above. There is no executable smoke or regression suite, no preview verification gate, and no automated post-deploy check for the routes listed in §16.2 (homepage, auth entry, match/results, booking critical path, messages critical path).
- Effect: every Phase 1 release must be human-driven from a checklist. Regressions in any of the 30+ routes below will only be caught by manual verification at release time.
- Resolution path (out of scope for `P1-QUALITY-002`): a follow-up task to install Vitest + Playwright, write a minimal critical-path E2E smoke suite, and add a CI workflow that runs `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, and the smoke suite on every PR.

### B3 — No public legal surface (medium, Phase 1 release-only)

- Repo has no public `/privacy-policy`, `/terms`, or equivalent route. The existing `/privacy` route is the authenticated `(account)` privacy snapshot, not a publicly indexable legal page.
- Effect: there is no canonical URL to link from auth flows, marketing pages, account-deletion confirmations, or external listings. Several existing flows (sign-in, sign-up, payment) implicitly assume such a page exists.
- Resolution path: introduce a public `/privacy-policy` (and `/terms`) route under `(public)` consuming `buildStaticPublicRouteMetadata` and `JsonLd` like the other Class A pages. Track as a follow-up.

### B4 — No favicon / app icon (low)

- No `src/app/favicon.*`, `src/app/icon.*`, or `src/app/apple-icon.*` files. `public/` is empty. Only `opengraph-image.tsx` exists.
- Effect: browsers and crawlers fall back to a 404 favicon; mobile devices render a generic letter glyph for any home-screen install. Cosmetic at MVP; should be fixed before any external launch announcement.
- Resolution path: add `src/app/icon.png`, `src/app/apple-icon.png`, and `src/app/favicon.ico` under the Next.js metadata-icon convention. Track as a follow-up.

## 3. Documented gaps that are not release blockers

These are acknowledged deviations from the CLAUDE.md frozen baseline. They do not block the MVP from going live but should be tracked.

| Gap | Where | Why it is not a blocker |
|---|---|---|
| Zod is not installed and not used anywhere in `src/` | `package.json` deps; CLAUDE.md baseline says "Validation: Zod" | Server actions validate inputs through typed `FormData` getters + allowlist checks (see [src/app/(student)/match/actions.ts](src/app/(student)/match/actions.ts), [src/app/(student)/book/[context]/actions.ts](src/app/(student)/book/[context]/actions.ts), [src/app/auth/actions.ts](src/app/auth/actions.ts)). The validation surface is sound; the deviation is stylistic. Adopt Zod when a new feature genuinely benefits from schema-driven validation rather than retrofitting it broadly. |
| Internal route family is `RoutePlaceholder` shells only | `src/app/internal/**` | Internal moderation, reference-data, tutor-reviews, and user-detail surfaces are explicitly Phase 1.5 / Phase 2 work. The route-family topology, layout, error boundary, and non-indexable metadata are all in place; the surfaces simply have no implementation yet. |
| `LessonCard` and `ScheduleSurface` (component-specs-core-v1.md §10–§11) not yet built | `src/components/continuity/**` | Documented in `docs/design-system/component-inventory-v1.md` §5 and in the spec doc itself. Routes today render through `LessonSummary` (the booking/continuity sibling) and route-local schedule layouts. Adoption is queued for the routes that need it. |
| `src/app/auth/sign-in/sign-in.module.css` `.cardTop` | auth route | Recorded in `P1-DS-FOUND-001-D1` as a follow-up to reconcile against `Panel`/`Section` during the next auth surface review. Does not violate the DS-first rule today (it is not a card/chip/panel pattern the DS already covers). |

## 4. Route-by-route verification matrix

Status legend: **OK** = route renders, layout posture (indexable / non-indexable) is correct, expected SEO/auth/privacy posture verified by source review. **OK (placeholder)** = route is intentionally a `RoutePlaceholder` shell. **OK (manual)** = route is real and reviewed at the source level; no automated regression coverage exists (see B2).

### 4.1 Public route family (`src/app/(public)/**`) — Class A, indexable

All entries consume `buildStaticPublicRouteMetadata` (or `generateMetadata` for the dynamic tutor profile) and emit JSON-LD via `@/lib/seo/schema/json-ld`. `robots.ts` does not disallow these paths. `sitemap.ts` includes the static routes through `staticPublicRoutes` and the tutor profile entries through `listPublicTutorProfileSitemapEntries`.

| Route | Status | Notes |
|---|---|---|
| `/` (home) | OK (manual) | renders match-first hero, consumes `MatchRow` and DS primitives; structured data present |
| `/how-it-works` | OK (manual) | static content, structured data present |
| `/trust-and-safety` | OK (manual) | static content, structured data present |
| `/support` | OK (manual) | static content, structured data present |
| `/become-a-tutor` | OK (manual) | static tutor-funnel content, structured data present |
| `/tutors/[slug]` | OK (manual) | server-rendered profile, `generateMetadata` per slug, structured data present, DS-first chrome verified by `P1-DS-FOUND-001-D1` |

### 4.2 Auth route family (`src/app/auth/**`) — non-indexable, server-rendered

Layout consumes `buildNonIndexableSectionMetadata`. `robots.ts` disallows `/auth/`.

| Route | Status | Notes |
|---|---|---|
| `/auth/sign-in` | OK (manual) | magic link + Google entry; `sendMagicLinkAction`/`startGoogleSignInAction` validate input via `EMAIL_PATTERN` and the auth-boundary providers. |
| `/auth/verify` | OK (manual) | post-magic-link verification surface |
| `/auth/callback` (route handler) | OK (manual) | uses `getSafeRedirectPath` allowlist for the `next` param; `getAuthVerifyStatusForCallbackError` shapes upstream provider errors instead of leaking strings |

### 4.3 Setup route family (`src/app/setup/**`) — non-indexable

| Route | Status | Notes |
|---|---|---|
| `/setup/role` | OK (manual) | role selection consumes `Card` `instantSubmit` per `P1-DS-FOUND-001-D4`; action validates allowed role values |

### 4.4 Student route family (`src/app/(student)/**`) — non-indexable

Layout consumes `buildNonIndexableSectionMetadata`. `robots.ts` disallows `/match`, `/results`, `/compare`, `/book/`, `/lessons`, `/messages`.

| Route | Status | Notes |
|---|---|---|
| `/match` | OK (manual) | match wizard + `submitMatchFlowAction`; reference options come from `loadDiscoveryOptions` (no DB-error fallback) |
| `/results` | OK (manual) | match results + filters; `Loading.tsx` is DS-first |
| `/compare` | OK (manual) | comparison surface |
| `/book/[context]` | OK (manual) | booking flow + `submitBookingRequestAction` and Stripe checkout return |
| `/lessons` | OK (manual) | lesson list, role-aware grouping |
| `/lessons/[id]` | OK (manual) | lesson detail + accept/decline/cancel/rate actions |
| `/messages` | OK (manual) | conversation shell |

### 4.5 Tutor route family (`src/app/tutor/**`) — non-indexable

Layout consumes `buildNonIndexableSectionMetadata`. `robots.ts` disallows `/tutor/`.

| Route | Status | Notes |
|---|---|---|
| `/tutor/apply` | OK (manual) | tutor onboarding entry |
| `/tutor/overview` | OK (manual) | tutor dashboard |
| `/tutor/schedule` | OK (manual) | weekly availability rules + meeting preferences + booking policy actions |
| `/tutor/lessons` | OK (manual) | tutor lesson list |
| `/tutor/lessons/[id]` | OK (manual) | tutor lesson detail + actions |
| `/tutor/messages` | OK (manual) | tutor conversation shell |
| `/tutor/earnings` | OK (manual) | Stripe Connect onboarding state + monthly earnings |
| `/tutor/students` | OK (placeholder) | reserved Phase 1.5 placeholder |

### 4.6 Account route family (`src/app/(account)/**`) — non-indexable

Layout consumes `buildNonIndexableSectionMetadata`. `robots.ts` disallows `/billing`, `/notifications`, `/privacy`, `/settings`.

| Route | Status | Notes |
|---|---|---|
| `/settings` | OK (manual) | profile + identity + role badges; consumes `buildAccountRoleBadges` |
| `/billing` | OK (manual) | account billing snapshot |
| `/notifications` | OK (manual) | preferences + notice history |
| `/privacy` | OK (manual) | account privacy snapshot (note: this is the authenticated snapshot, not the public legal page — see B3) |

### 4.7 Internal route family (`src/app/internal/**`) — non-indexable, placeholders only

Layout consumes `buildNonIndexableSectionMetadata`. `robots.ts` disallows `/internal/`.

| Route | Status | Notes |
|---|---|---|
| `/internal` | OK (placeholder) | reserved entry shell |
| `/internal/moderation` | OK (placeholder) | reserved Phase 2 |
| `/internal/reference-data` | OK (placeholder) | reserved Phase 2 |
| `/internal/tutor-reviews` | OK (placeholder) | reserved Phase 2 |
| `/internal/users/[id]` | OK (placeholder) | reserved Phase 2 |

### 4.8 Route handlers (`src/app/api/**`)

| Handler | Status | Notes |
|---|---|---|
| `POST /api/webhooks/stripe` | OK (manual) | verifies `stripe-signature` via `verifyAndParseStripeWebhook`; idempotent receipt via `recordStripeWebhookReceipt` |
| `GET /api/cron/jobs` | OK (manual) | requires `Authorization: Bearer ${CRON_SECRET}` |
| `GET /api/stripe/checkout/return` | OK (manual) | post-checkout return surface |
| `GET /api/stripe/connect/refresh` | OK (manual) | Stripe Connect refresh URL handler |
| `GET /api/calendar/lessons/[lessonId]/ics` | OK (manual) | participant-only ICS download |

## 5. Cross-cutting system verification

### 5.1 Authentication and authorization

| Item | Status | Notes |
|---|---|---|
| One shared auth path for Google + magic-link | OK | `src/lib/auth/auth-boundary.ts` and `src/lib/auth/account-service.ts` are the single boundary |
| Redirect allowlist on `next` param | OK | `getSafeRedirectPath` enforced at callback and at action entry |
| Role-gated access (student / tutor / shared) | OK | enforced server-side in modules (`requiresRoleSelection`, `hasRole`, `isRestrictedAccount`); UI hiding is never the only check |
| Service-role Supabase client confined to server | OK | `src/lib/supabase/service-role.ts` is server-only and consumed only by server modules |
| Branded auth emails | partial | code path is in place via Resend, but env-var mismatch (B1) means the `from` address falls back silently to the default unless `RESEND_FROM_ADDRESS` is explicitly set in production |

### 5.2 Payments and payouts (Stripe + Stripe Connect)

| Item | Status | Notes |
|---|---|---|
| Stripe Checkout authorization at booking-request time | OK | [src/modules/lessons/booking.ts](src/modules/lessons/booking.ts) |
| Capture on tutor accept; release on decline / expiry | OK | `lesson-actions.ts` orchestrates accept/decline/expiry transitions |
| Webhook signature verification | OK | `verifyAndParseStripeWebhook` |
| Webhook idempotency | OK | `recordStripeWebhookReceipt` |
| Stripe Connect Express onboarding for tutors | OK | `src/modules/payouts/connect.ts` + `/tutor/earnings` flow |
| Currency centralized in `src/modules/pricing/**` | OK | architectural rule enforced by `pnpm lint:arch` (no currency-code literals outside `pricing/**`) |

### 5.3 SEO and discoverability

| Item | Status | Notes |
|---|---|---|
| Public Class A routes have `metadata` / `generateMetadata` | OK | all six public routes |
| Public Class A routes emit JSON-LD | OK | all six public routes consume `@/lib/seo/schema/json-ld` |
| Private routes carry non-indexable metadata | OK | `(account)`, `(student)`, `auth`, `setup`, `internal`, `tutor` layouts all consume `buildNonIndexableSectionMetadata` |
| `robots.ts` disallows private paths | OK | covers `/auth/`, `/billing`, `/book/`, `/compare`, `/internal/`, `/lessons`, `/match`, `/messages`, `/notifications`, `/privacy`, `/results`, `/settings`, `/setup/`, `/tutor/` |
| `robots.ts` blocks all paths in preview deployments | OK | `isPreviewDeployment()` short-circuits to `disallow: "/"` |
| `sitemap.ts` exposes Class A statics + tutor profiles | OK | `buildSitemapEntries` |
| Public legal surfaces (`/privacy-policy`, `/terms`) | **missing** | see B3 |
| Brand icon assets (favicon, icon, apple-icon) | **missing** | see B4 |

### 5.4 Accessibility (per `docs/architecture/accessibility-and-inclusive-ux-architecture-v1.md`)

The architecture's mechanical rules are addressed through the DS layer; semantic verification is checklist-driven and recorded here as **OK (manual, source review)**.

| Rule area | Status | Notes |
|---|---|---|
| Native-first semantics in shared primitives | OK (manual) | `Button`, `TextField`, `SelectField`, `Textarea`, `OptionCardGroup`, `Card` (`as` polymorphism) all use native elements; route code never reaches for ARIA-only buttons |
| Landmark / heading rhythm | OK (manual) | `AppFrame` provides the route shell; `Section` and `Panel` carry titles with proper heading tag selection |
| Focus visible / focus ring tokens | OK | `--focus-outline` and `--focus-ring` standardized in `globals.css` and consumed by DS primitives (see `docs/design-system/tokens-cheatsheet-v1.md` §10.1) |
| Reduced motion | OK | `globals.css` `prefers-reduced-motion` block neutralizes animations and transitions globally |
| Keyboard / no trap | OK (manual) | no custom focus traps in route code; `ConversationShell` and `OptionCardGroup` use native focus order |
| Form labeling | OK (manual) | `TextField` / `Textarea` / `SelectField` consume the shared `field-shell.tsx` with explicit `<label>` association |
| Error identification | OK (manual) | server actions return `fieldErrors` shapes consumed by the client forms (e.g. `MatchFlowActionState`, `BookingRequestActionState`) |

### 5.5 DTO and privacy-sensitive exposure

| Item | Status | Notes |
|---|---|---|
| Service-role Supabase client confined to `src/lib/**` and `src/modules/**` (server-only) | OK | no client-side imports of `service-role.ts` |
| PII redaction on logging | OK | `src/lib/observability/redaction.ts` |
| `process.env.*` reads outside the typed env modules | OK | `pnpm lint:arch` ESLint rule blocks reads outside `src/lib/**/env.ts`-style boundaries |
| Inline SVG outside `src/components/ui/**` | OK | `pnpm lint:arch` audit confirms zero matches |
| `loadDiscoveryOptions` does not silently swallow DB errors | OK | verified at [src/modules/reference/discovery.ts:34](src/modules/reference/discovery.ts#L34) |

### 5.6 Database (per `docs/data/database-change-review-checklist-v1.md`)

| Item | Status | Notes |
|---|---|---|
| Migrations under `supabase/migrations/**` are versioned | OK | 10 timestamped migrations from baseline through `20260502120000_tutor_stripe_connect_payout_state.sql` |
| RLS enabled on user-data tables | OK | every baseline migration that introduces user-bearing tables enables RLS and registers policies |
| No application code holds the service-role key in the browser bundle | OK | `service-role.ts` is server-only; `NEXT_PUBLIC_*` env vars only carry the publishable key |
| Phase 1 schema review owners signed off (per checklist) | OK | each Phase 1 data task (`P1-DATA-001..005`) closed independently before consumer tasks |
| Forward-safe / rollback-aware migrations | OK | no destructive in-place changes outside the two-step rule; data tasks have not yet performed a destructive change |

### 5.7 Background jobs / notifications

| Item | Status | Notes |
|---|---|---|
| In-app notifications as canonical object | OK | `src/modules/notifications/**` and the schema baseline at `supabase/migrations/20260421130000_notification_delivery_legal_notice_baseline.sql` |
| Email delivery tracked separately from canonical state | OK | delivery rows are independent of notification rows |
| Cron sweep secured | OK | Bearer-secret check at [src/app/api/cron/jobs/route.ts:43](src/app/api/cron/jobs/route.ts#L43) |
| Idempotent provider-event handling | OK | Stripe webhook receipts |

### 5.8 Observability and analytics

| Item | Status | Notes |
|---|---|---|
| Server logger | OK | `src/lib/observability/logger.ts` |
| Server-side analytics events | OK | `src/lib/analytics/server.ts`; client surface in `src/lib/analytics/client.tsx` |
| Redaction on logged objects | OK | `src/lib/observability/redaction.ts` |
| PostHog server + client wiring | OK | per `P1-QUALITY-001` |

## 6. Required environment variables for production

Source: `.env.example`. Every variable below must be set in the production Vercel environment before MVP cutover. Items in **bold** are critical and missing or misnamed today (see §2).

| Variable | Purpose | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | required |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | required |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side privileged client | required, server-only |
| `NEXT_PUBLIC_SITE_URL` | canonical origin for absolute URLs | required |
| `STRIPE_SECRET_KEY` | Stripe API secret | required |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | required |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret | required |
| `RESEND_API_KEY` | transactional email sender | required |
| **`RESEND_FROM_ADDRESS`** (code) / **`RESEND_FROM_EMAIL`** (env.example) | branded sender address | **B1** — env.example uses a different name than the runtime reads. Operators must set `RESEND_FROM_ADDRESS` regardless of env.example. |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key (public) | required for analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog region host | required for analytics |
| `CRON_SECRET` | shared secret for `/api/cron/jobs` | required for cron sweep |

## 7. Manual smoke checklist (recommended for the first production cutover)

Until B2 is resolved, every release should be smoke-tested against this list. The list mirrors `testing-and-release-architecture-v1.md` §16.2 plus the Phase 1 critical paths.

1. Public homepage `/` loads, renders match-first hero, sitemap and robots return expected content.
2. `/auth/sign-in` magic-link send succeeds; the resulting email originates from the intended `from` address (verifies B1 was actually fixed in this environment).
3. Google sign-in completes, redirects through `/auth/callback` to a permitted `next` path, and the resulting session establishes a Mentor IB account row.
4. `/match` wizard submits and the flow lands on `/results` with discovery options sourced from the DB (no fallback object).
5. `/book/[context]` initiates Stripe Checkout in authorize-only mode; tutor `accept` captures; tutor `decline` releases.
6. Stripe webhook delivers an event, the receipt row exists and is idempotent on retry.
7. `/lessons/[id]` renders the lesson with status badges, role-aware actions, and ICS download for participants only.
8. `/messages` and `/tutor/messages` render the shared `ConversationShell`; threads list with unread/mute/archive signals.
9. `/tutor/earnings` renders Stripe Connect onboarding state and monthly earnings.
10. Cron sweep at `/api/cron/jobs` succeeds with the production `CRON_SECRET` and rejects unauthenticated calls.

## 8. Follow-up items captured by this pass

These do not block reviewing the MVP release state from this single summary, but each should become a tracked task before any user-facing launch:

- **F1** — Fix `RESEND_FROM_*` env-var name mismatch (B1).
- **F2** — Install Vitest + Testing Library + Playwright; add minimal critical-path E2E smoke; add a CI workflow that runs `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm lint:arch`, and the smoke suite (B2).
- **F3** — Add a public `/privacy-policy` (and `/terms`) route under `(public)` consuming the same metadata + JSON-LD pattern as the other Class A pages (B3).
- **F4** — Add `src/app/icon.png`, `src/app/apple-icon.png`, and `src/app/favicon.ico` (B4).
- **F5** — Consider whether to retrofit Zod onto existing server actions or relax the CLAUDE.md baseline to acknowledge the manual-validation pattern that is in use today.
- **F6** — Schedule the `LessonCard` and `ScheduleSurface` adoption work referenced in `docs/design-system/component-inventory-v1.md` §5.

## 9. Conclusion

The Phase 1 surface area — auth, match, results, booking, lessons, messages, account, tutor onboarding/scheduling/earnings, public marketing, public tutor profiles, and the Stripe + Stripe Connect payment-bearing flow — is implemented, type-safe, lint-clean, build-clean, and architecturally clean per `pnpm lint:arch`. Every Phase 1 route has an explicit verification outcome in §4. The four release blockers and the three documented gaps are named in §2 and §3 respectively rather than left implicit. The MVP can ship to a controlled audience after B1 is fixed; B2–B4 should be resolved before any general-availability launch.
