# Mentor IB Observability And Incident Architecture v1

**Date:** 2026-04-08
**Status:** Standalone production-observability and incident-response architecture for application health, dependency health, runtime signals, alerting posture, and incident handling
**Scope:** signal boundaries, runtime and platform observability, logging rules, health indicators, alerting posture, incident severity, dependency incidents, and AI-agent-safe operational rules

## 1. Why This Document Exists

This document defines how Mentor IB should detect, understand, and respond to production problems.

It exists now because the approved architecture already implies:

- public SEO-sensitive pages
- authenticated student and tutor workflows
- Supabase-backed auth, database, storage, and realtime
- Vercel-hosted deployment and runtime surfaces
- Stripe-backed payment flows
- async jobs, webhooks, and notifications
- AI agents doing a meaningful part of implementation work

Without an explicit observability and incident architecture, teams usually drift into:

- logs scattered across tools with no shared contract
- product analytics being misused as operational monitoring
- incidents discovered only through user complaints
- no shared severity model
- no clean handoff from detection to mitigation to follow-up

## 2. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/performance-and-runtime-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`
- `docs/architecture/testing-and-release-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

It inherits from those documents and defines the cross-cutting production operations layer above them.

It does not redefine:

- the SEO-specific Search Console operating model
- the product analytics event taxonomy
- security audit log requirements
- release-gate policy
- exact future on-call staffing

## 3. Core Recommendation

Mentor IB should use one shared observability model with separate signal lanes and one explicit incident model.

The practical rule is:

- platform and runtime health are not the same as product analytics
- production health must be visible across app, database, async work, and provider dependencies
- structured logs and stable identifiers matter more than tool sprawl
- incidents need severity, ownership, mitigation posture, and follow-up
- AI agents must emit and preserve useful operational signals instead of adding opaque code paths

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means observability rules should be:

- explicit
- low-ambiguity
- consistent across modules
- environment-aware
- difficult to bypass accidentally

The architecture should not rely on:

- "we can add logs later"
- arbitrary `console.log` noise with no structure
- vendor SDK calls scattered through business logic
- manual memory for incident handling
- ad hoc production debugging by reading random tables directly

## 5. Observability Goals

The architecture should answer these questions reliably:

1. Is the app available and behaving correctly for real users?
2. Are public routes fast and healthy enough for user trust and search performance?
3. Are auth, matching, booking, messaging, and lesson operations functioning?
4. Are async jobs, webhooks, and notifications succeeding?
5. Are Vercel, Supabase, Stripe, and GitHub-related failures visible quickly?
6. Can the team isolate a problem fast enough to mitigate it?
7. Can incidents be reviewed and learned from after recovery?

## 6. Signal System Split

Mentor IB should treat observability as several related systems, not one giant event bucket.

## 6.1 Runtime and platform observability

This covers:

- request failures
- latency
- route-level runtime behavior
- build and deployment issues
- middleware and function errors

Primary surfaces:

- Vercel Observability
- Vercel Runtime Logs
- Vercel build and deployment logs

## 6.2 End-user performance observability

This covers:

- Core Web Vitals
- field performance on public routes
- preview versus production performance deltas where useful

Primary surface:

- Vercel Speed Insights

## 6.3 Database and backend observability

This covers:

- auth behavior
- PostgREST and API behavior
- database-level errors
- realtime issues
- storage issues
- edge function logs if used later

Primary surface:

- Supabase Logs Explorer

## 6.4 Async-work observability

This covers:

- job success and failure
- retries
- dead-letter conditions if introduced later
- webhook processing failures
- notification delivery attempts

Primary sources:

- application domain logs
- provider dashboards where relevant

## 6.5 Product telemetry

This remains a separate system.

Primary source:

- the approved product telemetry architecture

Rule:

- product telemetry can help explain behavior, but it is not the primary incident-detection system

## 6.6 Discoverability observability

This also remains a separate system.

Primary source:

- the approved Search Console and SEO observability architecture

## 6.7 Security and audit observability

This remains separate again.

Primary source:

- the approved security and moderation architecture

Rule:

- audit logs are not a substitute for operational monitoring
- operational monitoring is not a substitute for audit logs

## 7. Recommended MVP Tool Posture

## 7.1 Recommended phase 1 stack

The recommended phase 1 observability stack is:

- Vercel Observability for runtime and route insight
- Vercel Runtime Logs for request-level debugging
- Vercel Speed Insights for field performance
- Supabase Logs Explorer for backend and data-platform debugging
- Search Console for public discoverability health
- PostHog for product telemetry
- provider dashboards and status pages for Stripe, Supabase, GitHub, and Vercel dependency checks

## 7.2 What not to add by default

Do not add a full extra APM, tracing, and log-aggregation stack on day one unless the product proves the need.

Examples to avoid by default:

- a second paid log product just to mirror low traffic logs
- a second error tracker with overlapping signals before the first operational model is working
- custom metrics infrastructure before the core health indicators are defined

## 7.3 Why this stack is enough for MVP

The product is operationally meaningful, but not high-scale enough yet to require:

- custom distributed tracing infrastructure
- a dedicated incident platform
- full central log warehousing on day one

If the architecture keeps logs structured and keeps signal boundaries clear, the MVP stack is enough to detect and handle real issues.

## 8. Route, Domain, And Dependency Health Model

The observability system should track health at four levels.

## 8.1 Route level

Examples:

- homepage
- auth entry routes
- match flow entry and results routes
- booking routes
- tutor dashboard routes

## 8.2 Domain flow level

Examples:

- sign-in completion
- match result generation
- booking request creation
- lesson join flow
- message send flow
- tutor approval flow

## 8.3 Job and integration level

Examples:

- magic-link email dispatch
- Stripe webhook processing
- reminder jobs
- notification fan-out
- sitemap generation if later operationalized

## 8.4 Provider dependency level

Examples:

- Vercel deployment and runtime health
- Supabase auth and logs availability
- Stripe webhook and payment-event delivery health
- GitHub Actions availability for build pipeline diagnosis

## 9. Health Indicators And SLO Linkage

This document does not redefine all product SLOs, but it does define what kinds of indicators should exist and be visible.

## 9.1 Availability indicators

Examples:

- request success rate on key public routes
- auth success rate
- booking creation success rate
- message send success rate

## 9.2 Latency indicators

Examples:

- public route render latency
- match result latency
- browse search latency
- booking response latency
- async job completion latency where meaningful

These should align with the existing performance and query-SLO architecture.

## 9.3 Error indicators

Examples:

- 5xx rate by route
- auth callback failures
- webhook verification failures
- failed job retries
- failed email sends
- failed payment event handling

## 9.4 Quality indicators

Examples:

- percentage of good Core Web Vitals on key public routes
- percentage of successful realtime connections if later tracked
- percentage of jobs that complete without retry

## 9.5 Dependency indicators

Examples:

- abnormal Supabase auth failures
- elevated Stripe webhook delivery failures
- deployment or build failures in GitHub Actions or Vercel

## 10. Structured Logging Architecture

## 10.1 Main rule

Operational logs should be structured enough to be filterable and correlatable.

## 10.2 Logging boundary rule

Application code should emit logs through a shared server-side logging layer or shared conventions, not through random unstructured strings spread everywhere.

## 10.3 Minimum useful log fields

Where applicable, logs should preserve:

- timestamp
- environment
- route or job name
- domain area
- severity
- request or correlation id
- actor type if relevant
- object id if relevant
- outcome
- error code or failure class if known

## 10.4 Data minimization rule

Logs must not contain:

- raw auth tokens
- secrets
- payment secrets
- full message text by default
- unbounded personal data dumps

## 10.5 Human readability rule

Structured logs still need concise human-readable messages.

The architecture should avoid:

- giant opaque JSON blobs with no summary
- highly variable message names for the same event

## 10.6 Correlation rule

The app should preserve stable identifiers that help connect:

- a user-visible failure
- the server request
- downstream async work
- provider webhook or retry records

Examples:

- request id
- booking id
- lesson id
- conversation id
- job id
- webhook event id

## 11. Request, Job, And Webhook Correlation

## 11.1 Request correlation

Every high-value server path should make it possible to follow a failure across the relevant logs.

That includes:

- auth callback flows
- match submission
- booking writes
- message sends
- tutor approval actions

## 11.2 Job correlation

Background jobs should log:

- job type
- job id
- triggering object id
- attempt number
- final outcome

## 11.3 Webhook correlation

Webhook handling should preserve:

- provider name
- event id
- endpoint or handler name
- verification result
- idempotency handling result
- resulting domain action

This is especially important for Stripe.

## 12. Runtime And Performance Observability

## 12.1 Runtime posture

Vercel should be treated as the primary runtime observability surface for app-request issues.

Use it for:

- route-level failures
- runtime latency spikes
- external API behavior visible in Vercel
- deployment-specific regressions

## 12.2 Performance posture

Vercel Speed Insights should be the primary field-performance surface for Core Web Vitals and related route health.

The main operational rule is:

- lab tools help during implementation
- field performance is the production truth

## 12.3 Public-route priority rule

Public Class A routes deserve the strictest performance observation because they affect:

- first impression
- conversion
- SEO and page experience

## 13. Database And Supabase Observability

## 13.1 Main rule

Supabase should be treated as the main backend diagnosis surface for auth, PostgREST, database, storage, and realtime issues.

## 13.2 Logs Explorer posture

Use Supabase Logs Explorer as the normal inspection surface for:

- auth failures
- API gateway or PostgREST issues
- database errors
- storage events if relevant
- realtime debugging when enabled

## 13.3 Realtime visibility rule

If realtime becomes important for messaging or live updates, connection and channel logging should be enabled only as needed for diagnosis and not left at noisy debug settings permanently.

## 13.4 Production-readiness reminder

Supabase provider constraints still matter operationally, including auth rate limits, project plan limits, and provider availability.

## 14. Async Job And Notification Observability

## 14.1 Main rule

Async work must be observable as first-class product behavior, not as invisible background magic.

## 14.2 What should be visible

At minimum, the team should be able to understand:

- what job ran
- whether it succeeded
- whether it retried
- whether it failed permanently
- what user or domain object it affected

## 14.3 Notification visibility rule

For important notifications such as sign-in emails, booking notifications, or lesson reminders, the architecture should preserve enough records to answer:

- was the notification enqueued
- was delivery attempted
- did the provider accept it
- did the domain state reflect the right next step

## 15. Deployment And Release Observability

## 15.1 Main rule

Deployments are part of the production signal system.

## 15.2 Required surfaces

The team should be able to inspect:

- build failures
- deployment timing
- preview versus production behavior
- release time correlation with error spikes

## 15.3 Regression correlation rule

When production behavior changes suddenly, the first correlation questions should include:

- what changed in the latest deploy
- what migrations shipped
- whether a feature flag changed
- whether a dependency outage is involved

## 16. Dependency Observability

## 16.1 Main rule

Mentor IB depends on multiple managed providers, so observability must include provider health, not only app health.

## 16.2 Providers that matter most in phase 1

- Vercel
- Supabase
- Stripe
- GitHub Actions

## 16.3 Dependency posture

For each critical provider, the architecture should assume:

- incidents can happen outside our code
- provider dashboards and status pages are legitimate operational inputs
- incident diagnosis should check dependency health early, not last

## 16.4 Status-subscription rule

The business should subscribe to provider status updates for the critical providers used in production.

This is especially important for:

- Vercel
- Supabase
- Stripe
- GitHub

## 16.5 Provider-blame rule

Do not assume a provider outage without evidence.

But also do not waste time debugging only the app when provider status or incident signs strongly suggest an upstream problem.

## 17. Alerting Posture

## 17.1 Main rule

Alerts should exist to speed up action, not to create noise.

## 17.2 Phase 1 alert posture

Because the MVP is cost-sensitive, phase 1 should use a light alerting model:

- provider status subscriptions
- Vercel and Supabase dashboard monitoring
- post-release smoke checks
- explicit review of high-risk flow health after important releases

## 17.3 Higher-maturity alert posture later

If operational load grows, the next step can include:

- Vercel Alerts if the pricing and plan fit becomes worthwhile
- log drains or a dedicated aggregation tool if retention and cross-source correlation become painful
- richer automated anomaly detection

## 17.4 Alert ownership rule

Every alert or recurring warning should have an implied action owner.

If nobody knows what action an alert requires, it should probably not exist in that form.

## 18. Incident Severity Model

## 18.1 Main rule

Incidents should use a small explicit severity scale.

## 18.2 Recommended severity levels

Use:

- `SEV1`: major production outage, broad user impact, security exposure, or payment/auth core failure
- `SEV2`: serious degradation with meaningful user impact, but partial service still works
- `SEV3`: localized defect, lower-risk degradation, or non-critical operational issue

## 18.3 Severity examples

`SEV1` examples:

- broad sign-in failure
- booking creation broken for most users
- sensitive data exposed publicly
- production site major outage

`SEV2` examples:

- tutor schedule editing broken
- message sends failing intermittently
- Stripe webhook failures causing delayed lesson/payment state sync
- major latency regression on match flow

`SEV3` examples:

- one low-priority admin queue view broken
- a preview-only operational issue
- low-risk reporting discrepancy

## 19. Incident Lifecycle

## 19.1 Detection

Incidents may be discovered through:

- dashboards
- logs
- status alerts
- smoke checks
- user reports

## 19.2 Triage

The first triage questions should be:

1. Is this production, preview, or local only?
2. What user-facing surface is affected?
3. Is the issue inside app code, deployment, data, or provider dependency?
4. What is the likely severity?
5. What is the fastest safe mitigation?

## 19.3 Mitigation

Preferred mitigation order:

1. feature flag or kill switch if the issue is isolated
2. code rollback or redeploy if release-induced
3. provider fallback or degraded mode if external dependency is impaired
4. deliberate data repair if schema or state was affected

## 19.4 Communication

For meaningful incidents, the team should keep one clear running record of:

- start time
- current severity
- affected surfaces
- mitigation actions
- current status

## 19.5 Resolution

An incident is resolved only when:

- user-facing impact is removed or acceptably mitigated
- the immediate operational risk is contained
- the team understands whether follow-up work is required

## 20. Dependency Incident Posture

## 20.1 Vercel incident posture

If routing, runtime, or deployment behavior suggests a Vercel-side issue:

- verify dashboard and deployment state
- check provider status
- avoid unnecessary app-only changes until evidence is clearer

## 20.2 Supabase incident posture

If auth, database access, logs, storage, or realtime behavior suggests a Supabase-side issue:

- inspect Supabase logs
- check provider status
- evaluate whether degraded read-only or delayed-operation modes are safer than repeated failing writes

## 20.3 Stripe incident posture

If payment or webhook behavior suggests a Stripe-side issue:

- inspect webhook delivery and event surfaces
- check provider status or operational notices
- avoid duplicate payment-state mutations

## 20.4 GitHub incident posture

If CI or workflow behavior is failing unusually:

- check GitHub Actions status
- distinguish between app regression and CI platform outage

## 21. Post-Incident Review Architecture

## 21.1 Main rule

Meaningful incidents should produce a lightweight review artifact.

## 21.2 Minimum review contents

At minimum, the review should capture:

- what happened
- when it started
- when it was mitigated
- root cause or best current understanding
- impact
- what detection worked or failed
- what follow-up changes are required

## 21.3 Blameless rule

The architecture should optimize for learning and hardening, not blame assignment.

## 21.4 Architecture-feedback rule

If an incident exposed a gap in:

- logging
- correlation ids
- release gates
- migration posture
- provider fallback assumptions

that should become architecture or planning follow-up, not only a one-off fix.

## 22. AI-Agent Operational Rules

## 22.1 Main rule

AI-generated code must preserve or improve observability, not degrade it.

## 22.2 Task-contract rule

Future implementation tasks should specify when relevant:

- which logs or health signals are affected
- whether a new route, job, or webhook needs operational visibility
- whether release verification should inspect new signals
- whether the change affects incident mitigation options

## 22.3 No-silent-failure rule

AI agents should avoid implementing silent catch-and-ignore paths on critical flows.

Critical failures should become:

- visible logs
- explicit error states
- retryable job outcomes
- or user-facing actionable failures

## 22.4 Shared-signal rule

AI agents should extend shared logging and health conventions instead of inventing per-feature ad hoc patterns.

## 23. OpenTelemetry And Future-Proofing Posture

## 23.1 Main rule

The architecture should stay tracing-ready without requiring a full tracing platform in MVP.

## 23.2 Recommended posture

Use Next.js instrumentation and OpenTelemetry compatibility as the forward path if deeper tracing becomes necessary later.

This means:

- do not design observability in a way that blocks future tracing
- but do not force a paid tracing backend before the product actually needs it

## 23.3 Why this matters

This gives the project a path to stronger correlation later without creating immediate tool or cost sprawl now.

## 24. Recommended Phase 1 Defaults

Phase 1 should include:

- Vercel Observability enabled and actively used
- Vercel Runtime Logs as the primary request-debugging surface
- Vercel Speed Insights enabled for field performance
- Supabase Logs Explorer as the primary backend-debugging surface
- provider status subscriptions for critical dependencies
- shared structured server-side logging conventions
- explicit incident severity levels
- lightweight incident recordkeeping for meaningful production issues

## 25. Decisions To Lock Now

The architecture should lock the following decisions now:

- observability is split into separate signal systems, not one event bucket
- product analytics is not the primary operational monitoring layer
- runtime and backend health use Vercel and Supabase as first-class operational surfaces
- field performance uses Speed Insights as the main production truth for web vitals
- structured logs and correlation ids matter from the beginning
- provider status and dependency health are part of diagnosis
- incidents use a small explicit severity model
- AI agents must preserve shared operational visibility
- deeper tracing is future-compatible but not required for MVP

## 26. Final Recommendation

Mentor IB should run production operations on a lightweight but explicit observability model:

- Vercel for runtime, deployment, and field-performance visibility
- Supabase for backend and data-platform diagnosis
- separate systems for analytics, SEO observability, and audit trails
- structured logs with correlation ids
- explicit incident severity and mitigation rules

This gives the project enough operational maturity to ship with confidence, while keeping the MVP toolchain small and understandable for a team working heavily with AI agents.

## 27. Official Source Notes

The recommendation above is informed by current official documentation for:

- Vercel Observability: `https://vercel.com/docs/observability`
- Vercel Runtime Logs: `https://vercel.com/docs/logs/runtime`
- Vercel Speed Insights: `https://vercel.com/docs/speed-insights`
- Vercel Alerts: `https://vercel.com/docs/alerts/`
- Vercel Log Drains: `https://vercel.com/docs/observability/log-drains/`
- Next.js OpenTelemetry guidance: `https://nextjs.org/docs/pages/guides/open-telemetry`
- Supabase Logs: `https://supabase.com/docs/guides/telemetry/logs`
- Supabase production checklist: `https://supabase.com/docs/guides/deployment/going-into-prod`
- Stripe event destinations and webhook delivery visibility: `https://docs.stripe.com/event-destinations`
- Stripe webhook endpoint delivery guidance: `https://docs.stripe.com/webhooks/test`
- GitHub Actions continuous integration guidance: `https://docs.github.com/en/actions/get-started/continuous-integration`
