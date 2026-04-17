# Mentor IB Route Layout Implementation Map v1

**Date:** 2026-04-08
**Status:** Standalone application-shape document for Next.js App Router route families, layout boundaries, auth gating posture, and implementation ownership
**Scope:** route groups, visible URL segments, layout responsibilities, auth and SEO boundaries, loading and error boundaries, route-handler placement, and the canonical app-folder topology for phase 1

## 1. Why This Document Exists

Mentor IB already approved:

- one shared Next.js App Router application
- one ecosystem across public, student, and tutor modes
- one auth model with shared identity and capability-based access
- one SEO route-class system

What was still missing was the concrete implementation map for the app directory.

Without an explicit route-layout map, teams usually drift into:

- duplicated route trees that act like separate products
- auth checks placed only in layouts
- metadata, robots, or noindex rules scattered per page
- inconsistent URL shapes between student and tutor flows
- loading and error handling added ad hoc

This document exists to prevent that.

## 2. Why This Lives In `docs/architecture`

This document belongs in `docs/architecture` because it defines the top-level application shape for the approved Next.js product.

It is the direct companion to:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/planning/implementation-readiness-pack-v1.md`

It also translates approved route and IA work from:

- `docs/foundations/ia-map-two-sided.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- the UX IA
- the auth and authorization matrix
- the SEO metadata and sitemap architecture
- the data schema

It does not define:

- the final feature-module folder structure outside routing
- final component internals
- the exact route task backlog

Those should come later.

## 4. Core Recommendation

Mentor IB should use one root `app/layout.tsx`, then organize the product with a small number of route families:

1. public marketing and discovery routes
2. auth entry and callback routes
3. authenticated bootstrap and shared account routes
4. student workflow routes
5. tutor workflow routes
6. internal admin and moderation routes
7. narrow route handlers for explicit server endpoints and provider callbacks

The main rule is:

- one product shell
- one routing system
- nested layouts for section chrome
- auth and data checks close to the page or data source
- no multiple disconnected root layouts unless the product truly becomes separate applications later

## 5. Next.js Rules This Map Is Based On

The current official Next.js guidance supports the posture already approved elsewhere:

- route groups organize routes without affecting the URL path
- navigating between different root layouts causes a full page reload
- the root layout must define `<html>` and `<body>`
- layouts are not the right place for sole auth enforcement because they do not re-run on every navigation
- `loading.tsx` and local `Suspense` should be used deliberately for progressive rendering
- `error.tsx` is a client-side error boundary file

This is why Mentor IB should keep one root layout and use route groups for organization rather than multiple root app shells.

## 6. Canonical App Router Topology

Phase 1 should use a topology like this:

```text
src/app/
  layout.tsx
  global-error.tsx
  robots.ts
  sitemap.ts

  (public)/
    layout.tsx
    page.tsx
    how-it-works/page.tsx
    trust-and-safety/page.tsx
    support/page.tsx
    become-a-tutor/page.tsx
    tutors/
      [slug]/page.tsx
      [slug]/not-found.tsx

  auth/
    layout.tsx
    sign-in/page.tsx
    callback/route.ts
    verify/page.tsx

  setup/
    layout.tsx
    role/page.tsx

  (account)/
    layout.tsx
    settings/page.tsx
    notifications/page.tsx
    privacy/page.tsx
    billing/page.tsx

  (student)/
    layout.tsx
    match/page.tsx
    results/page.tsx
    compare/page.tsx
    book/[context]/page.tsx
    messages/page.tsx
    lessons/page.tsx

  tutor/
    layout.tsx
    apply/page.tsx
    overview/page.tsx
    lessons/page.tsx
    schedule/page.tsx
    messages/page.tsx
    students/page.tsx
    earnings/page.tsx

  internal/
    layout.tsx
    page.tsx
    tutor-reviews/page.tsx
    moderation/page.tsx
    reference-data/page.tsx
    users/[id]/page.tsx

  api/
    stripe/
      webhook/route.ts
    calendar/
      lessons/[lessonId]/ics/route.ts

src/lib/routing/
  route-families.ts
  access-rules.ts
  redirects.ts
  navigation.ts
```

This is a canonical topology map, not a promise that every reserved route must ship on day one.

## 7. Route-Family Map

## 7.1 Public family

URL posture:

- root-level marketing and discovery routes

Examples:

- `/`
- `/how-it-works`
- `/trust-and-safety`
- `/support`
- `/become-a-tutor`
- `/tutors/[slug]`

Route class:

- mostly Class A public SEO routes

Primary layout:

- `src/app/(public)/layout.tsx`

## 7.2 Auth family

URL posture:

- explicit `/auth/*` segment

Examples:

- `/auth/sign-in`
- `/auth/verify`
- `/auth/callback`

Route class:

- Class B public but non-indexable

Primary layout:

- `src/app/auth/layout.tsx`

## 7.3 Setup family

URL posture:

- explicit `/setup/*` segment

Examples:

- `/setup/role`

Route class:

- Class C authenticated operational route

Primary layout:

- `src/app/setup/layout.tsx`

## 7.4 Shared account family

URL posture:

- root-level authenticated account routes via a route group

Examples:

- `/settings`
- `/notifications`
- `/privacy`
- `/billing`

Route class:

- Class C authenticated operational routes

Primary layout:

- `src/app/(account)/layout.tsx`

## 7.5 Student family

URL posture:

- root-level student workflow routes via a route group

Examples:

- `/match`
- `/results`
- `/compare`
- `/book/[context]`
- `/messages`
- `/lessons`

Route class:

- Class C authenticated operational routes

Primary layout:

- `src/app/(student)/layout.tsx`

## 7.6 Tutor family

URL posture:

- explicit `/tutor/*` operational routes

Examples:

- `/tutor/apply`
- `/tutor/overview`
- `/tutor/lessons`
- `/tutor/schedule`
- `/tutor/messages`
- `/tutor/students`
- `/tutor/earnings`

Route class:

- Class C authenticated operational routes

Primary layout:

- `src/app/tutor/layout.tsx`

## 7.7 Internal family

URL posture:

- explicit `/internal/*` privileged routes

Examples:

- `/internal`
- `/internal/tutor-reviews`
- `/internal/moderation`
- `/internal/reference-data`
- `/internal/users/[id]`

Route class:

- Class C privileged internal routes

Primary layout:

- `src/app/internal/layout.tsx`

## 7.8 Route-handler family

Use route handlers for:

- inbound provider webhooks
- explicit file-like exports such as `.ics`
- narrow server endpoints that are not better modeled as page rendering or server actions

Do not use route handlers as the default internal BFF layer for every page.

## 8. Root Layout Responsibilities

`src/app/layout.tsx` should own only product-wide concerns.

It should define:

- `<html>` and `<body>`
- global fonts
- global theme and token entry
- top-level providers that truly span the whole app
- global metadata defaults
- app-wide toast or announcement mounting points

It should not own:

- student-only chrome
- tutor-only chrome
- public-page-specific hero logic
- sole auth enforcement
- page-specific SEO intent

## 9. Section Layout Responsibilities

## 9.1 Public layout

`src/app/(public)/layout.tsx` should own:

- public header and footer
- public navigation
- shared public metadata defaults
- public-shell spacing and structure

It should not hardcode page-specific titles, descriptions, or structured data.

## 9.2 Auth layout

`src/app/auth/layout.tsx` should own:

- minimal distraction-free auth shell
- clear return-to-product framing
- non-indexable metadata defaults

## 9.3 Setup layout

`src/app/setup/layout.tsx` should own:

- short bootstrap shell
- account-resolution context
- redirects away when setup is already complete

## 9.4 Shared account layout

`src/app/(account)/layout.tsx` should own:

- shared account navigation
- settings and account-support chrome
- noindex defaults

## 9.5 Student layout

`src/app/(student)/layout.tsx` should own:

- student navigation
- student-shell continuity elements
- noindex defaults

## 9.6 Tutor layout

`src/app/tutor/layout.tsx` should own:

- tutor operational navigation
- tutor-shell continuity elements
- noindex defaults

## 9.7 Internal layout

`src/app/internal/layout.tsx` should own:

- privileged internal navigation
- internal audit/moderation context
- strong non-indexable posture

## 10. Auth And Redirect Rules

## 10.1 Main rule

Layouts may shape the shell, but they should not be treated as the only auth enforcement boundary.

## 10.2 Why

Next.js explicitly warns that layouts do not re-render on every navigation, so auth checks should stay close to the data source or the page boundary.

## 10.3 Practical rule

Use layout-level redirects only for coarse family entry behavior when helpful.

Examples:

- redirect an already signed-in user away from `/auth/sign-in`
- redirect a role-pending account into `/setup/role`

But still enforce access again in:

- page-level server components
- server actions
- route handlers
- domain data access

## 10.4 Family entry rules

Recommended coarse rules:

- `unauthenticated` -> allowed on public and auth routes only
- `authenticated_role_pending` -> allowed on setup and shared account routes, blocked from student and tutor workflow routes
- `student_active` -> allowed on student routes and shared account routes
- `tutor_pending_review` -> allowed on `/tutor/apply` and limited tutor setup surfaces
- `tutor_active` -> allowed on full tutor routes
- `admin` -> internal routes only when explicitly granted

## 11. Metadata, Robots, And Route-Class Rules

This document inherits the SEO app architecture.

Practical ownership should be:

- root layout -> global defaults
- public layout -> public defaults
- public route pages -> final public route intent
- `robots.ts` and `sitemap.ts` -> app boundary files
- student, tutor, setup, account, and internal families -> functional metadata plus non-indexable posture

The route family should determine default metadata behavior before individual pages customize anything.

## 12. Loading, Suspense, Error, And Not-Found Rules

## 12.1 `loading.tsx` posture

Use `loading.tsx` at the route-family level only when the family benefits from a shared coarse loading state.

Use local `Suspense` inside heavy pages for finer streaming boundaries.

Good candidates:

- results page
- tutor overview
- tutor lessons

## 12.2 `error.tsx` posture

Each major family may have a local `error.tsx` if the family needs its own fallback UX.

Important rule:

- `error.tsx` is a client error boundary

## 12.3 `global-error.tsx` posture

Use `src/app/global-error.tsx` only for catastrophic whole-app failure states.

Do not use it as the normal error UX for everyday domain failures.

## 12.4 `not-found.tsx` posture

Dynamic public routes should use route-local `not-found.tsx` where a missing or non-public object should become a proper not-found response.

The clearest phase 1 case is:

- `src/app/(public)/tutors/[slug]/not-found.tsx`

Private and internal routes should follow the same outward security posture.

If the actor lacks permission to view a route or object detail page, the route should render `notFound()` or an equivalent 404 response instead of a visible permission explanation.

Exception:

- explicit account-state flows such as limited or suspended access can still show shaped restriction messaging on their own safe route

## 12.5 `template.tsx` posture

Do not introduce `template.tsx` by default.

Use it only if a route family specifically needs remount behavior that a normal layout should not preserve.

## 13. Server Data And DTO Rules

Each route page should fetch DTO-safe data from the server/domain layer.

The rule is:

- routes and pages compose data
- domain modules enforce business logic
- DTOs shape what the UI receives

Do not make pages depend on raw database rows when a public or role-safe DTO is required.

This is especially important for:

- tutor public profiles
- lessons
- messages
- billing/account surfaces

## 14. Shared Navigation And Mode Rules

Mentor IB should feel like one product with different modes, not two products.

That means:

- shared account and settings routes stay common where possible
- student and tutor shells may differ, but use the same design system and continuity objects
- a dual-role user switches context through routing and capability checks, not through separate accounts

The URL system may still reflect operational differences.

This is why:

- student workflow routes remain root-level and task-led
- tutor workflow routes remain under `/tutor/*` for clearer operational context

## 15. URL Design Rules

Phase 1 should keep URLs:

- human-readable
- stable
- mode-consistent
- aligned with the approved route map

Avoid:

- deep nesting without real information value
- duplicate route families that resolve to the same intent
- path names that expose implementation details

## 16. Reserved Later Routes

The topology should leave room for later route families without forcing them into phase 1.

Likely later additions:

- `/tutors` browse/search list if the public browse surface ships as a first-class route
- `/internal/reports/*`
- richer tutor billing or earnings routes
- richer lesson detail routes

The rule is:

- reserve space in the route family map
- do not prebuild empty route sprawl

## 17. AI-Agent Implementation Rules

Agents should:

- preserve one root layout
- use route groups for organization without URL pollution
- keep auth checks close to page/data boundaries
- keep metadata and route-class behavior owned by route families
- prefer family-level loading and error boundaries only where they improve UX clearly
- keep route handlers narrow and explicit

Agents should not:

- create multiple root layouts casually
- split student and tutor into separate app shells
- rely on layout-only auth checks
- let reusable components decide route metadata or robots behavior
- add API endpoints for page composition when server components or actions are the better fit

## 18. Decisions To Lock Now

The system should lock the following decisions now:

- one root `app/layout.tsx`
- route groups for public, account, and student organization
- explicit URL segments for `auth`, `setup`, `tutor`, and `internal`
- root-level student workflow routes such as `/match` and `/results`
- tutor operational routes under `/tutor/*`
- auth checks enforced near pages, actions, handlers, and data access, not layouts alone
- one route-family source for metadata and route-class behavior
- local `not-found.tsx` on dynamic public profile routes

## 19. Implementation Handoff Status

The implementation-shape handoff path is:

1. use `docs/planning/agent-implementation-decision-index-v1.md` and `docs/planning/implementation-task-template-v1.md` to create concrete implementation tasks
2. create `docs/planning/implementation-backlog-translation-v1.md` only if a separate backlog translation layer is still needed after task drafting starts

## 20. Final Recommendation

Mentor IB should implement the app as one Next.js App Router product with a single root layout and a small number of explicit route families.

The clean phase 1 shape is:

- public routes in one public family
- auth and setup routes explicit and isolated
- shared account routes reused across roles
- student flows at root-level task paths
- tutor operations under `/tutor/*`
- internal tools under `/internal/*`

That keeps the system aligned with the one-ecosystem product strategy while staying safe, searchable, and predictable for future AI-agent implementation.

## 21. Official Source Notes

The guidance above is aligned with current official documentation for:

- Next.js layout file convention: `https://nextjs.org/docs/app/api-reference/file-conventions/layout`
- Next.js route groups: `https://nextjs.org/docs/app/api-reference/file-conventions/route-groups`
- Next.js loading file convention: `https://nextjs.org/docs/app/api-reference/file-conventions/loading`
- Next.js error file convention: `https://nextjs.org/docs/app/api-reference/file-conventions/error`
- Next.js authentication guide: `https://nextjs.org/docs/app/guides/authentication`
