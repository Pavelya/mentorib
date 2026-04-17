# Mentor IB Service Dependency Baseline v1

**Date:** 2026-04-10
**Status:** Execution-facing service and SDK baseline for the first implementation phase
**Scope:** approved external services, approved integration SDKs, deferred or rejected providers, installation timing, and agent rules for service-related implementation decisions

## 1. Why This Document Exists

Mentor IB already has:

- product and UX direction
- architecture decisions
- data and security boundaries
- SEO, observability, and privacy posture
- task packs for phased implementation
- a runtime and toolchain baseline

What was still missing was one explicit baseline for service and integration choices.

Without this document, a coding agent could still guess:

- whether to add Resend, SendGrid, or Postmark
- whether to use PostHog, GA4, or only Vercel analytics
- whether to add Algolia on day one
- whether to add a logging library or error tracker immediately
- whether to use a workflow platform such as Inngest or Trigger.dev
- whether to add media vendors such as Cloudinary, UploadThing, or Mux

That would create stack drift very quickly.

This document exists to freeze the approved provider and SDK posture once, so future agents do not invent parallel service stacks while implementing tasks.

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/planning/agent-execution-playbook-v1.md`
- `docs/planning/engineering-guardrails-v1.md`
- `docs/planning/implementation-baseline-v1.md`
- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/search-platform-decision-v1.md`
- the phase task packs

Those documents still own:

- task execution workflow
- general engineering guardrails
- product behavior
- domain rules
- route behavior
- data boundaries
- security rules
- when a feature should be built

This document only owns:

- which provider or service should be used for each approved capability
- which SDKs or packages are approved for those providers
- which providers or SDK categories should stay out of the repo by default
- when service packages should be installed during phased implementation

## 3. Source-Of-Truth Rule

Use this priority order for service-related decisions:

1. domain architecture doc for behavior and security rules
2. this document for provider and SDK choice
3. `docs/planning/implementation-baseline-v1.md` for repo and toolchain rules
4. `package.json` and the lockfile for exact installed versions after scaffold

Practical rule:

- this document chooses the provider and package family
- the implementation baseline chooses the runtime and framework line
- the repo pins the exact versions

If a task requires a new third-party service that is not approved here, the agent should stop, explain the gap, and propose a doc update instead of silently adding a new vendor.

## 4. Core Recommendation

Mentor IB should keep the MVP service stack intentionally small:

- `Vercel` for hosting, previews, runtime, and platform observability
- `Supabase` for Postgres, Auth, Storage, and Realtime
- `Resend` for email delivery
- `PostHog` for product telemetry
- `Stripe` for billing when payments actually enter scope

Short version:

**One approved provider per capability, official SDKs only, and no duplicate vendor layers unless the docs explicitly change.**

## 5. 2026 Reality Check

This section exists so the service baseline matches current reality instead of old assumptions.

## 5.1 Supabase Auth email is not enough for production by itself

As of 2026-04-10, Supabase still documents that the default SMTP service:

- is not meant for production use
- only sends to pre-authorized team addresses
- is rate-limited to `2 messages per hour`

Supabase explicitly recommends configuring custom SMTP for real production use.

Implication for Mentor IB:

- development can temporarily use the default Supabase email behavior for private testing
- any public auth flow, invite flow, or real magic-link MVP requires custom SMTP

## 5.2 Supabase passwordless behavior fits the approved auth flow

Supabase passwordless email login still supports Magic Link and OTP.

Its docs also state that if the user has not signed up yet, they are automatically created by default unless `shouldCreateUser` is set to `false`.

Implication for Mentor IB:

- the approved product flow remains valid
- one entry action can support both existing-user login and new-user account creation
- the app should collect the role choice after first successful authentication, not through separate auth systems

## 5.3 Supabase custom domains are still a paid add-on

Supabase custom domains are documented as a paid add-on for projects on a paid plan.

Implication for Mentor IB:

- development and early private testing can live with the default Supabase domain during Google OAuth
- branded auth-domain cleanup can happen when the project moves to the paid MVP posture
- this is not a reason to change auth providers

## 5.4 Resend covers both SMTP and API email paths

As of 2026-04-10, Resend officially supports:

- SMTP via `smtp.resend.com`
- the `resend` Node.js SDK for direct API sends

Implication for Mentor IB:

- one provider can cover Supabase Auth SMTP and app-originated transactional email
- we do not need a second email vendor for MVP

## 5.5 Vercel observability and cron constraints matter

As of 2026-04-10, Vercel documents that:

- Web Analytics uses `@vercel/analytics`
- Speed Insights uses `@vercel/speed-insights`
- runtime logs include `console.log` output and each stdout write becomes a separate log entry
- Hobby cron jobs are limited to once per day and have hourly scheduling precision
- Pro cron jobs support once-per-minute schedules with per-minute precision

Implication for Mentor IB:

- structured server logs should be single-line and machine-readable
- reminder and scheduled-job precision must not depend on Hobby cron behavior
- exact reminder scheduling belongs to the paid MVP posture, not free-tier assumptions

## 5.6 PostHog still fits the low-cost telemetry posture

As of 2026-04-10, PostHog still documents:

- `posthog-js` for browser capture
- `posthog-node` for server capture
- a generous free tier for analytics

Implication for Mentor IB:

- PostHog remains the approved product-telemetry provider
- Vercel Web Analytics should stay focused on anonymous route traffic and not become the only product analytics system

## 5.7 Stripe hosted Checkout with manual capture still fits the MVP

Stripe still documents:

- `stripe` as the official server-side Node SDK
- Checkout Sessions as the low-complexity path to a Stripe-hosted payment page
- webhook signature verification using the `Stripe-Signature` header and `constructEvent()`
- Connect Express as a low-integration hosted onboarding path for platforms that control payouts

Implication for Mentor IB:

- billing should start with hosted Checkout, not custom Elements flows
- booking can authorize once and capture on tutor acceptance if the request-expiry rule stays safely inside Stripe's authorization window
- the server-side `stripe` SDK is enough at first
- client-side Stripe packages are not required until a later payment UI genuinely needs them

## 6. Approved Service Stack

| Capability | Approved provider or approach | Approved packages | Installation posture | Notes |
| --- | --- | --- | --- | --- |
| Hosting, previews, deploy runtime | `Vercel` | no app package required | required from scaffold | Vercel is the only approved hosting target for the first implementation |
| Anonymous route traffic analytics | `Vercel Web Analytics` | `@vercel/analytics` | install when public-route analytics work lands | route traffic only, not the canonical product-event system |
| Field performance and Core Web Vitals | `Vercel Speed Insights` | `@vercel/speed-insights` | install when public-route performance work lands | complements Search Console Core Web Vitals visibility |
| Runtime logs and request debugging | `Vercel Runtime Logs` via shared app logger | no extra logging package by default | required from scaffold | use one internal `appLogger` wrapper over console methods |
| Database, auth, storage, realtime | `Supabase` | `@supabase/supabase-js`, `@supabase/ssr` | required from scaffold | single managed backend boundary for Postgres, Auth, Storage, and Realtime |
| SQL access | internal query layer on Supabase Postgres | `drizzle-orm`, `drizzle-kit`, `postgres` | required from scaffold | already chosen in `implementation-baseline-v1.md` |
| Magic link and Google login | `Supabase Auth` | same Supabase packages as above | install-ready from scaffold | callback allowlist and Google provider config must follow the shared auth boundary; no Auth.js, Clerk, Firebase Auth, or Auth0 baseline |
| Auth email delivery | `Supabase Auth` with `Resend` SMTP | no app SMTP package required | configure before public auth testing | default Supabase SMTP is not production-ready |
| App transactional email | `Resend` API | `resend` | install when the first app-originated email task lands | use for lesson lifecycle, tutor application, payout, legal, and similar transactional sends |
| Branded app email templates | `React Email` rendered through the app email service | `@react-email/components`, `@react-email/render` | install with the first transactional email task | keep email templates brand-aligned but email-safe; do not send raw provider HTML from random features |
| Product telemetry | `PostHog` | `posthog-js`, `posthog-node` | install when telemetry tasks land | use one internal analytics adapter instead of vendor calls scattered through UI code |
| Search discoverability monitoring | `Google Search Console` | none | operational only | no runtime SDK needed |
| Public browse search | internal Postgres-backed read model | no extra vendor SDK | required by search implementation | no Algolia dependency at launch |
| Matching and ranking | internal application logic on Postgres | no extra vendor SDK | required by matching implementation | never delegate core matching ownership to a search vendor |
| Owned file storage | `Supabase Storage` | same Supabase packages as above | install-ready from scaffold | private verification assets and public media both stay on approved storage boundaries |
| Public tutor video previews | normalized external references | no extra SDK | implement when profile media task lands | allowlisted providers start with `YouTube`, `Vimeo`, and `Loom` |
| Lesson meeting links | normalized external provider links | no extra SDK | implement when lesson/booking tasks land | recognized providers start with `Google Meet`, `Zoom`, `Microsoft Teams`, and `Whereby` |
| Add-to-calendar behavior | provider-neutral deep links and `.ics` export | no Google Calendar API dependency by default | implement when lesson/calendar task lands | no Google OAuth calendar sync for MVP |
| Background jobs | internal durable jobs in Postgres | no separate workflow platform package by default | implement when async tasks land | use app-owned job tables and domain events |
| Short post-response work | Next.js post-response hook | no extra package | use when relevant | safe only for short non-critical follow-up work |
| Scheduled sweeps and reminders | `Vercel Cron` invoking app routes | no extra package | use only when schedule precision matches plan limits | do not design precise reminder logic around Hobby cron restrictions |
| Payments | `Stripe` | `stripe` | install only when payment tasks land | hosted Checkout for request-time authorization, capture on tutor acceptance, `Stripe Connect Express` for tutor payout onboarding when tutor finance flow enters scope |

## 7. Explicitly Deferred Or Rejected By Default

The following are not part of the approved MVP baseline and should not be added unless the docs are explicitly revised:

- `Algolia` for day-one search
- `Firebase Auth`
- `Clerk`
- `Auth0`
- `Stream Chat`
- `Twilio Conversations`
- `Sendbird`
- `Cloudinary`
- `UploadThing`
- `Mux`
- `Inngest`
- `Trigger.dev`
- `Temporal`
- `LaunchDarkly`
- `Statsig`
- `Flagsmith`
- `Sentry`
- `Datadog`
- `New Relic`

These are not necessarily bad tools.

They are simply outside the approved minimal-tools baseline for this product phase.

## 8. Installation Timing Rule

Do not bulk-install every future SDK during repo bootstrap.

Use this rule instead:

- install foundational backend packages at scaffold time
- install service SDKs only when the first approved task actually needs them
- keep the repo lean until the capability is in active scope

Practical examples:

- install `@supabase/supabase-js` and `@supabase/ssr` during scaffold
- do not install `stripe` until a payment task enters active scope
- do not install `posthog-js` and `posthog-node` until telemetry work actually starts
- do not install `resend` until app-originated transactional email enters scope
- do not install React Email packages until branded app email templates enter scope
- do not install `@vercel/analytics` and `@vercel/speed-insights` until public-route measurement work lands

After a package is installed:

- pin the exact version in `package.json`
- let the lockfile become the exact source of truth
- do not upgrade it casually inside unrelated feature tasks

## 9. Integration Boundary Rules

Service SDKs should never be sprinkled through random components or route files.

Use internal adapters or service modules instead.

Recommended boundary pattern:

- auth helpers own Supabase session and auth-entry behavior
- email service owns Resend usage
- email service owns React Email template rendering
- billing service owns Stripe usage
- analytics service owns PostHog event mapping
- logger owns structured server logging
- media service owns storage and external-video normalization
- meeting service owns provider recognition and URL validation
- search service owns public discovery queries and later adapter switching

Practical rule:

- React components should mostly call internal application functions
- vendor SDK calls should live in server-safe or adapter-safe modules
- client code should import only browser-safe packages that are explicitly approved for client use

## 10. Hardcoded-Value Rule For Service Work

Service integration work must not introduce scattered hardcoded operational values.

Do not hardcode these in feature code:

- provider ids
- auth callback paths
- SMTP hosts
- bucket names
- storage paths with domain meaning
- analytics event destinations
- search provider names
- meeting-provider allowlists
- video-provider allowlists
- webhook paths and secrets

Instead:

- keep env access in typed env modules
- keep provider identifiers and allowlists in centralized config modules
- keep user-facing labels separate from raw provider ids
- keep canonical enums and statuses aligned with the data glossary and reference-data docs

This document does not replace the broader governance rules.

It makes the service-specific no-hardcoding rule explicit for implementation work.

## 11. Logging And Error-Handling Baseline

Mentor IB should start with one shared application logging contract:

- one internal `appLogger`
- structured machine-readable logs
- single-line JSON output for server logs where practical
- stable fields such as area, action, entity id, request id, and severity
- redaction of personal data, message bodies, meeting URLs, credential evidence, tokens, and secrets

Do not add by default:

- `pino`
- `winston`
- a second paid log product
- a separate error-tracking vendor

Why:

- the approved observability posture already uses Vercel Runtime Logs, Vercel Observability, Vercel Speed Insights, Supabase logs, Search Console, and provider dashboards
- Vercel logs treat each stdout write as a separate log entry, so disciplined structured logging is more important than early logger-tool sprawl

## 12. Agent Rules For Actual Development

When a task touches auth, email, analytics, payments, jobs, search, logging, media, or meetings, the agent should:

1. read `docs/planning/implementation-baseline-v1.md`
2. read this document
3. read `docs/planning/agent-implementation-decision-index-v1.md`
4. read the task's detailed section in the relevant phase pack
5. read the domain architecture docs listed by that task

Then apply these rules:

- if the capability is already covered in this baseline, use the approved provider
- if the capability is covered but the SDK is not installed yet, install only the approved SDK
- if the task appears to need a new vendor, stop and explain why before adding it
- do not add overlapping packages "just in case"
- do not silently replace an approved provider with a preferred one
- do not widen scope from a feature task into a stack rewrite

## 13. Suggested Config Ownership

The exact file names can change during scaffold, but the architecture should centralize service configuration in one predictable place.

Recommended ownership pattern:

- `src/config/env/server.ts` for server-only environment variables
- `src/config/env/public.ts` for public environment variables
- `src/config/providers.ts` for provider identifiers and allowlists
- `src/server/services/auth/` for Supabase auth boundaries
- `src/server/services/email/` for auth-email and transactional-email boundaries
- `src/server/services/analytics/` for PostHog adapters and event mapping
- `src/server/services/billing/` for Stripe integration
- `src/server/services/logging/` for app logger
- `src/server/services/media/` for storage and video-reference normalization
- `src/server/services/meetings/` for meeting-provider normalization and validation
- `src/server/services/search/` for search adapters and provider switching

## 14. Final Recommendation

The approved MVP service baseline is:

- `Vercel`
- `Supabase`
- `Resend`
- `PostHog`
- `Stripe` when payments enter scope

And the approved non-decisions are just as important:

- no day-one Algolia
- no second auth system
- no external chat SaaS
- no workflow platform
- no media-hosting vendor
- no extra logger or error tracker by default

That gives AI agents a much clearer rule:

**build on the approved providers, add SDKs only when the relevant task lands, and do not invent a wider stack.**

## 15. Official References

- Supabase custom SMTP: `https://supabase.com/docs/guides/auth/auth-smtp`
- Supabase passwordless email login: `https://supabase.com/docs/guides/auth/auth-email-passwordless`
- Supabase Next.js SSR guide: `https://supabase.com/docs/guides/auth/server-side/nextjs`
- Supabase custom domains: `https://supabase.com/docs/guides/platform/custom-domains`
- Resend Node.js quickstart: `https://resend.com/docs/send-with-nodejs`
- Resend SMTP quickstart: `https://resend.com/docs/send-with-smtp`
- Resend pricing: `https://resend.com/pricing`
- Vercel Web Analytics quickstart: `https://vercel.com/docs/analytics/quickstart`
- Vercel Speed Insights quickstart: `https://vercel.com/docs/speed-insights/quickstart`
- Vercel Runtime Logs: `https://vercel.com/docs/observability/runtime-logs`
- Vercel Cron usage and pricing: `https://vercel.com/docs/cron-jobs/usage-and-pricing`
- PostHog JavaScript SDK: `https://posthog.com/docs/libraries/js`
- PostHog Node SDK: `https://posthog.com/docs/libraries/node`
- PostHog pricing: `https://posthog.com/pricing`
- Stripe server-side SDKs: `https://docs.stripe.com/sdks/server-side`
- Stripe Checkout: `https://docs.stripe.com/payments/checkout`
- Stripe webhook signature verification: `https://docs.stripe.com/webhooks/signature`
