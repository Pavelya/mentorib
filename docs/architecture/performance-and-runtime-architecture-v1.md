# Mentor IB Performance And Runtime Architecture v1

**Date:** 2026-04-08
**Status:** Standalone performance and runtime architecture for route rendering, Core Web Vitals, runtime selection, caching, and asset delivery
**Scope:** Core Web Vitals posture, route performance classes, Next.js rendering defaults, runtime selection, caching and revalidation rules, asset-delivery rules, hydration boundaries, third-party script posture, and request-versus-background execution rules

## 1. Why This Document Exists

This document defines how Mentor IB should stay fast in ways that matter both to users and to Google's real-world page experience metrics.

It exists now because the approved product already implies the need for:

- performant public landing pages
- performant public tutor profiles
- responsive matching and booking flows
- operational tutor screens that feel fast without abusing stale data
- a runtime posture that fits Vercel, Next.js App Router, and Supabase

Without an explicit architecture, performance work usually becomes:

- reactive and page-by-page
- optimized for lab scores only
- weakened by unnecessary client rendering
- inconsistent between public and authenticated routes

## 2. What This Document Does Not Redefine

This document does not replace the approved SEO, analytics, async-work, or core application architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`

It does not define:

- the final deep observability stack beyond the minimal required tools
- the final CI performance gate implementation
- the final component-by-component optimization backlog

Those can come later as companion artifacts.

## 3. Core Recommendation

Mentor IB should use a server-first, route-class-based performance architecture built around:

- strict Core Web Vitals posture for public Class A routes
- React Server Components by default
- narrow client boundaries
- explicit caching and revalidation rules
- Node.js runtime as the default server runtime
- background execution for slow or retryable work

The practical rule is:

- optimize public pages for real user experience first
- keep authenticated operational screens fast through good data shaping and limited hydration
- do not make every route fully dynamic by accident
- do not push slow provider work into the interactive request path

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means performance rules should be:

- explicit
- route-aware
- measurable
- difficult to bypass accidentally

The architecture should not rely on:

- "we will optimize later"
- defaulting everything to client components
- defaulting everything to dynamic no-cache rendering
- broad third-party script inclusion with no route policy

## 5. Goals

The performance and runtime architecture should:

- support good Core Web Vitals on indexable public routes
- keep the product responsive on mobile first
- preserve SEO-friendly server rendering
- keep runtime choices simple and predictable
- prevent slow background-like work from blocking the user path

## 6. Route Performance Classes

Mentor IB should treat performance differently by route class.

## 6.1 Class A public indexable routes

Examples:

- `/`
- `/how-it-works`
- `/trust-and-safety`
- `/support`
- `/become-a-tutor`
- `/tutors/[slug]`

These routes are the strictest performance surface because they affect:

- user trust
- conversion
- SEO
- Core Web Vitals in Search Console

Rule:

- these routes must be optimized for field performance first, especially on mobile

## 6.2 Class B public but non-indexable or transitional routes

Examples:

- auth entry surfaces
- public-but-personalized transitional flows if any

Rule:

- keep them fast, but they do not need to be tuned with the same search-facing rigor as Class A routes

## 6.3 Class C authenticated operational routes

Examples:

- `/match`
- `/results`
- `/book/[context]`
- `/messages`
- `/lessons`
- `/tutor/*`

Rule:

- these routes should feel fast and responsive, but freshness and workflow clarity can matter more than static-page style optimization

## 7. Google Page Experience And Core Web Vitals Posture

## 7.1 Main rule

Mentor IB should optimize public routes for real-world page experience, not only for Lighthouse screenshots.

## 7.2 Core Web Vitals targets

For public routes, the architecture should target Google's current recommended thresholds at the 75th percentile:

- `LCP` within 2.5 seconds
- `INP` under 200 milliseconds
- `CLS` under 0.1

## 7.3 Field-data rule

Production field data is the authoritative performance signal for Core Web Vitals.

Lab tools are useful for debugging, but they are not the final truth.

## 7.4 Search posture rule

Good Core Web Vitals support search success, but they are not the only ranking factor.

The architecture should therefore optimize for overall page experience, not for chasing perfect performance scores in isolation.

## 8. Runtime Strategy

## 8.1 Default runtime rule

Use the Node.js runtime as the default runtime for the application's server work.

## 8.2 Why Node.js is the default

This is the best fit for the current stack because:

- it supports the full application code and library surface
- it works naturally with the current Next.js and database model
- it avoids Edge-runtime caveats for data-heavy and authenticated flows

## 8.3 Edge-runtime posture

Do not adopt Edge runtime as the default for core product routes.

Use it only later for narrow, well-justified cases if real latency benefits appear.

This is especially important because official Next.js docs note that the Edge runtime is more limited and does not support ISR.

## 8.4 Region rule

Vercel functions should execute close to the primary data source where possible.

The practical rule is:

- keep the Vercel project and Supabase region strategy aligned enough to avoid unnecessary round-trip latency

## 8.5 Duration rule

User-facing request handlers should stay short.

If a route or action needs long-running work, move that work into the approved background-jobs architecture rather than raising runtime duration as the normal solution.

## 9. Rendering Architecture

## 9.1 Server-first rule

App Router routes should default to React Server Components.

## 9.2 Client-boundary rule

Client components should exist only where interactivity actually requires them.

Examples:

- booking slot selection
- compare interactions
- message input
- availability editing

## 9.3 Deep-provider rule

Providers and client wrappers should live as deep in the tree as practical.

This follows the official Next.js guidance and keeps more of the tree statically optimizable.

## 9.4 Streaming rule

Use `loading.tsx` and `Suspense` boundaries to avoid blocking whole-route rendering on slower data.

## 9.5 Public-content rule

Important public content for Class A routes must exist in server-rendered HTML and must not depend on client-only hydration to appear.

## 10. Caching And Revalidation Architecture

## 10.1 Main rule

Caching should be explicit and route-class aware.

Do not rely on accidental defaults alone.

## 10.2 Stable public routes

Stable public routes should prefer:

- static rendering
- or long revalidation windows when content changes occasionally

## 10.3 Dynamic public routes

Dynamic public routes such as tutor profiles should use:

- server rendering or generation with explicit revalidation
- shared quality-gate logic
- predictable freshness rules

## 10.4 Authenticated operational routes

Authenticated and personalized routes should default toward fresher data and selective caching, not broad static assumptions.

Use no-store or short-lived strategies only where the data genuinely requires it.

Do not make the entire route tree uncached by habit.

## 10.5 Invalidation rule

When product state changes in ways users should see quickly, prefer targeted revalidation behavior over blanket freshness loss everywhere.

## 11. Data Access Performance Architecture

## 11.1 Main rule

Slow routes are often data-shaping problems before they are framework problems.

## 11.2 Recommended MVP rules

Use:

- DTO-shaped server responses
- indexed hot queries
- paginated list surfaces
- parallel data fetching where safe
- denormalized read models only when actually needed

## 11.3 Waterfall rule

Avoid sequential server waterfalls where independent data can be fetched in parallel.

## 11.4 Route-data rule

Do not force public routes to call many internal APIs when the server route can compose the needed data directly.

## 12. Asset Delivery Architecture

## 12.1 Font rule

Use `next/font` for application fonts.

This aligns with official Next.js guidance and removes unnecessary external font requests.

## 12.2 Image rule

Use `next/image` for public and product images where it fits the rendering model.

## 12.3 Layout-shift rule

Public images must reserve space and preserve aspect ratio to avoid CLS problems.

## 12.4 LCP-image rule

If the hero image is the likely LCP element, it should be treated intentionally with appropriate priority behavior.

## 12.5 Remote-image rule

Remote images should be tightly allowlisted through `remotePatterns` or equivalent configuration rather than left broad.

## 12.6 Video rule

Public tutor intro videos and lesson meeting embeds should not become heavy render blockers.

Use lazy or deferred embed strategies where appropriate, especially below the fold.

## 13. JavaScript And Hydration Architecture

## 13.1 Main rule

Keep JavaScript shipped to the browser intentionally small, especially on public Class A routes.

## 13.2 Shared-shell rule

Do not wrap the whole app in large client-side state shells unless a real product need requires it.

## 13.3 Widget rule

Prefer interactive islands over page-sized client rendering.

## 13.4 Third-party-component rule

Any third-party component that forces a client boundary should justify its cost on the route where it appears.

## 13.5 Route-class rule

Public landing pages should have the smallest client footprint in the product.

## 14. Third-Party Script Posture

## 14.1 Main rule

Third-party scripts are performance debt unless they are clearly justified.

## 14.2 Recommended MVP posture

Keep third-party scripts narrow and intentional.

Especially on public Class A routes, avoid adding:

- unnecessary widgets
- broad marketing script bundles
- heavy personalization layers

## 14.3 Analytics rule

Analytics and web-vitals instrumentation should be integrated with minimal client cost and should not turn every route into a script-heavy page.

## 15. Responsive And Layout Performance

## 15.1 Main rule

Because mobile field data is often the limiting factor for Core Web Vitals, performance should be judged mobile-first.

## 15.2 Layout stability rule

Avoid unexpected layout movement from:

- image loads
- font swaps
- late banners
- injected UI above the fold

## 15.3 Skeleton rule

Loading states should preserve structure rather than causing the page to reflow dramatically when content arrives.

## 16. Request Path Versus Background Work

## 16.1 Main rule

Interactive requests should complete the user-visible mutation and then stop.

## 16.2 Background boundary rule

Move the following out of the critical path when possible:

- transactional email sends
- slow provider enrichment
- reminder generation
- reconciliation work

## 16.3 Webhook rule

Webhook handlers should verify, record, and dispatch quickly rather than doing long processing inline.

## 17. Performance Measurement Architecture

## 17.1 Main rule

Performance must be measured with both field and lab tools.

## 17.2 Recommended MVP measurement stack

Use:

- Search Console Core Web Vitals reporting for public search-facing health
- Vercel Speed Insights for real-user web-vitals visibility
- Next.js `useReportWebVitals` in a small isolated client boundary when sending performance data into the internal analytics layer is useful
- Lighthouse and PageSpeed Insights for local and release debugging

## 17.3 Separation rule

Performance telemetry is not the same as general product analytics.

It may feed the same internal measurement boundary, but it should remain logically separable.

## 17.4 Preview rule

Preview and local performance checks are useful for regression detection, but production field data remains the authoritative signal for public Web Vitals.

## 18. Recommended Route-Class Performance Budgets

## 18.1 Class A public routes

These should target:

- good Core Web Vitals at the 75th percentile
- minimal client JavaScript
- stable above-the-fold layout
- small and justified third-party script footprint

## 18.2 Class C authenticated routes

These should target:

- fast perceived navigation
- responsive interactive behavior
- paginated and scoped data loads
- stable component-level loading states

They do not need to mimic static marketing-page architecture if that would hurt workflow usefulness.

## 19. What This Architecture Prevents

This architecture is meant to prevent:

- public pages rendered mostly on the client by accident
- Edge runtime being chosen by default without need
- slow provider work blocking user actions
- generic no-cache rendering across the whole app
- Core Web Vitals being treated as an afterthought
- future AI agents adding client boundaries and third-party scripts with no route policy

## 20. Recommended Phase Scope

## 20.1 Phase 1

Phase 1 should support:

- Node.js runtime by default
- server-first App Router rendering
- route-aware caching and revalidation
- `next/font` and `next/image` usage on key public routes
- Vercel Speed Insights and Search Console visibility for public pages
- explicit web-vitals-aware performance budgets for Class A routes

## 20.2 Phase 1.5

Good next candidates:

- stronger automated performance regression gates
- richer route-level performance dashboards
- denormalized read models for hot authenticated flows

## 20.3 Phase 2

Consider later:

- carefully chosen Edge-runtime use for narrow cases
- deeper bundle analysis automation
- more advanced cache-handler strategies only if real scale justifies them

## 21. Decisions To Lock Now

The architecture should lock the following decisions now:

- public Class A routes are the strictest performance surface
- Core Web Vitals on public routes matter and should target Google's good thresholds
- Node.js runtime is the default server runtime
- React Server Components are the default rendering mode
- client boundaries stay narrow and explicit
- caching and revalidation are route-aware, not accidental
- slow side effects belong in background work, not the request path
- performance should be judged with production field data, not only lab scores

## 22. Final Recommendation

Mentor IB should use a server-first runtime and performance architecture that is strict where Google and first impressions care most, and pragmatic where authenticated workflows need freshness and operational depth.

The recommended MVP is:

- Node.js runtime by default on Vercel
- React Server Components and narrow client islands
- explicit caching and revalidation by route class
- optimized fonts, images, and lazy embeds
- Vercel Speed Insights plus Search Console for real-world performance feedback

This gives the product a realistic path to good Core Web Vitals on public routes while keeping the rest of the app fast and maintainable.

## 23. Official Source Notes

The recommendation above is informed by current official documentation for:

- Google Core Web Vitals and Search: `https://developers.google.com/search/docs/appearance/core-web-vitals`
- Google page experience guidance: `https://developers.google.com/search/docs/appearance/page-experience`
- web.dev Web Vitals overview: `https://web.dev/articles/vitals`
- Next.js caching deep dive: `https://nextjs.org/docs/app/deep-dive/caching`
- Next.js font optimization: `https://nextjs.org/docs/app/getting-started/fonts`
- Next.js Image component: `https://nextjs.org/docs/app/api-reference/components/image`
- Next.js loading UI and streaming: `https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming`
- Next.js Server Components guidance: `https://nextjs.org/docs/app/building-your-application/rendering/server-components`
- Next.js `useReportWebVitals`: `https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals`
- Vercel Speed Insights overview: `https://vercel.com/docs/speed-insights/`
- Vercel functions configuration: `https://vercel.com/docs/functions/configuring-functions`
- Vercel function duration configuration: `https://vercel.com/docs/functions/configuring-functions/duration`
- Vercel functions overview: `https://vercel.com/docs/functions/`
