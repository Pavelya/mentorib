# Mentor IB Analytics And Product Telemetry Architecture v1

**Date:** 2026-04-08
**Status:** Standalone measurement architecture for product analytics, public-route traffic insight, and privacy-safe telemetry
**Scope:** analytics-system boundaries, event taxonomy rules, identity model, vendor posture, session-replay posture, product funnel measurement, and privacy constraints for measurement data

## 1. Why This Document Exists

This document defines how Mentor IB should measure product behavior and outcomes without turning analytics into a second ungoverned platform.

It exists now because the approved product already implies the need to understand:

- whether students start and complete the match flow
- which tutor profiles and trust surfaces convert
- whether bookings and lessons actually happen
- whether tutors become operationally active after approval
- whether public pages are bringing in useful traffic

Without an explicit architecture, measurement work usually becomes:

- duplicated across multiple tools
- inconsistent between client and server
- leaky with private or sensitive data
- hard for AI-driven implementation to execute consistently

## 2. What This Document Does Not Redefine

This document does not replace the approved SEO, privacy, security, or async-work architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/seo-and-ai-discoverability-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`

It does not define:

- the final legal consent program
- final dashboard layouts
- final KPI targets
- the final performance-observability stack

Those can come later as dedicated companion artifacts.

## 3. Core Recommendation

Mentor IB should use one shared measurement architecture with four distinct systems:

- public discoverability measurement
- privacy-friendly web traffic analytics
- product telemetry
- audit and security logging

The practical rule is:

- do not treat all events as one giant bucket
- use Vercel Web Analytics for anonymous route-level traffic insight
- use PostHog for event-based product telemetry
- keep audit and security records outside the product analytics stream
- keep the canonical event contract inside Mentor IB, not inside any vendor SDK

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means measurement rules should be:

- explicit
- typed
- vendor-agnostic at the domain boundary
- privacy-conservative
- easy to validate

The architecture should not rely on:

- direct vendor calls scattered through components
- broad autocapture as the main product truth
- raw private text flowing into analytics properties
- humans remembering which events matter

## 5. Why Analytics Can Be Defined Now

Analytics is safe to define now because the core architecture already establishes:

- canonical product objects
- public versus private route boundaries
- security and privacy constraints
- lesson, scheduling, messaging, and media boundaries

That is enough to define what should be measured without yet locking every later implementation detail such as matching math, performance tuning, or final KPI thresholds.

## 6. Measurement System Split

Mentor IB should treat measurement as four related but distinct systems.

## 6.1 Discoverability measurement

This covers the public search surface.

Primary sources:

- Google Search Console
- the approved SEO observability architecture

This system answers:

- are indexable public pages being discovered
- are tutor profiles earning impressions and clicks
- are public landing pages producing useful traffic

## 6.2 Web traffic analytics

This covers privacy-friendly anonymous route traffic measurement.

Recommended MVP source:

- Vercel Web Analytics

This system answers:

- which public pages get traffic
- what referrers and route groups matter
- basic visitor and page-view trends

## 6.3 Product telemetry

This covers meaningful product behavior inside the application and across authenticated flows.

Recommended MVP source:

- PostHog product analytics

This system answers:

- whether students move through match, evaluation, and booking flows
- whether tutors become active and operational
- where users get stuck
- what actions correlate with activation and repeat use

## 6.4 Audit and security logging

This is not product analytics.

It covers:

- privileged actions
- moderation decisions
- webhook processing records
- incident and abuse investigation support

Primary source:

- the approved security and moderation architecture

Rule:

- audit logs must not be implemented as a substitute for product analytics
- product analytics must not be treated as a substitute for audit logs

## 7. Recommended Vendor Posture

## 7.1 Recommended MVP stack

The recommended measurement stack is:

- Google Search Console for discoverability
- Vercel Web Analytics for anonymous public traffic insight
- PostHog for product telemetry

## 7.2 Why this split is recommended

This gives Mentor IB:

- one tool optimized for public-route traffic on Vercel
- one tool optimized for product funnels and event analysis
- one search-focused source for discoverability truth

It also stays compatible with the current low-cost and minimal-tools principle.

## 7.3 Why Vercel Web Analytics is not enough by itself

Vercel Web Analytics is strong for privacy-friendly route insight, but on Vercel's current docs, custom events are available only on Pro and Enterprise plans.

That makes it a poor sole foundation for product telemetry in a cost-sensitive MVP.

## 7.4 Why PostHog is recommended for product telemetry

PostHog's official docs and pricing support the kind of product analytics Mentor IB needs:

- explicit event capture
- identified and anonymous event handling
- event properties
- funnels and activation analysis later
- a generous free tier for analytics events

## 7.5 Why not start with Google Analytics as the main product telemetry tool

GA4 is valid for traffic and marketing reporting, but it is not the best primary home for the application's internal product-learning loop.

Mentor IB needs product telemetry centered on:

- lessons
- matching
- tutor activation
- role-aware flows

That is better served by an event-first product analytics tool than by a marketing-first analytics property.

## 8. Canonical Event Contract

## 8.1 Main rule

Mentor IB should define one internal canonical analytics event contract and let vendor adapters send the events outward.

## 8.2 Boundary rule

Components and route handlers should call an internal analytics layer, not vendor SDKs directly.

The internal analytics layer should decide:

- event name
- allowed properties
- user identity mode
- destination or destinations

## 8.3 Naming rule

Because the wider architecture already uses machine-friendly identifiers, canonical analytics events should use stable `snake_case` names.

Examples:

- `match_started`
- `match_submitted`
- `tutor_profile_viewed`
- `booking_request_submitted`
- `lesson_join_clicked`

This keeps naming consistent with the existing product and background-event architecture.

## 8.4 Property rule

Event properties should be explicit and typed.

Do not allow arbitrary caller-defined property bags as the main product pattern.

## 8.5 Source-of-truth rule

If an important business action is already represented in canonical domain state, analytics should describe that action.

It should not invent a second version of reality that can drift from the product model.

## 9. Identity Model

## 9.1 Anonymous visitor rule

Anonymous traffic should be measurable before login for public flows such as:

- home
- match start
- tutor profile landing

## 9.2 Identified user rule

Once a user is authenticated, telemetry should use a stable internal user identifier rather than email.

Recommended identity attributes for product telemetry:

- internal `app_user_id`
- role context
- timezone
- locale if relevant

## 9.3 Prohibited identity properties

Do not send as analytics identity:

- raw email address
- message content
- meeting links
- uploaded file paths
- private credential details

## 9.4 Anonymous-to-identified merge rule

The measurement system should preserve a path from anonymous pre-auth behavior into identified post-auth behavior when the analytics tool supports it.

This matters for flows like:

- public landing page to signup
- tutor profile view to booking request

## 10. Event Capture Strategy

## 10.1 Explicit-event rule

Meaningful product telemetry should be captured explicitly.

Examples:

- match started
- result opened
- tutor profile viewed
- booking request submitted
- lesson confirmed

## 10.2 Autocapture posture

Broad autocapture should not be the canonical source of product truth.

It may be useful for low-stakes supporting signals, but the system should not depend on generic click capture to understand the product.

## 10.3 Server-event rule

Any event tied to a confirmed business mutation should ideally be emitted from the server-side mutation boundary or be corroborated there.

Examples:

- booking request submitted
- lesson confirmed
- tutor application approved

## 10.4 Client-event rule

Pure UI exploration or pre-submit behavior may be emitted from the client.

Examples:

- match flow step viewed
- compare opened
- add-to-calendar clicked

## 11. Recommended Phase 1 Event Families

The first implementation should stay focused on a small set of high-signal event families.

## 11.1 Public route and acquisition events

Examples:

- `public_page_viewed`
- `match_entry_clicked`
- `tutor_profile_landed`
- `become_a_tutor_started`

## 11.2 Auth and onboarding events

Examples:

- `auth_started`
- `auth_completed`
- `role_choice_submitted`
- `student_onboarding_completed`
- `tutor_application_started`

## 11.3 Matching and discovery events

Examples:

- `match_started`
- `match_submitted`
- `results_viewed`
- `result_shortlisted`
- `compare_opened`
- `tutor_profile_viewed`

## 11.4 Booking and lesson events

Examples:

- `booking_started`
- `booking_request_submitted`
- `lesson_confirmed`
- `lesson_rescheduled`
- `lesson_join_clicked`
- `calendar_add_clicked`

## 11.5 Messaging events

Examples:

- `conversation_opened`
- `message_sent`
- `report_submitted`
- `user_blocked`

Rule:

- do not capture message body content

## 11.6 Tutor activation and operations events

Examples:

- `tutor_application_submitted`
- `tutor_application_reviewed`
- `tutor_availability_published`
- `tutor_first_request_received`
- `lesson_report_submitted`

## 12. Canonical Property Families

Allowed event properties should come from a small approved set of property families.

## 12.1 Safe context properties

These are generally safe and useful:

- route family
- object id in internal pseudonymous form
- role mode
- subject code or structured category
- lesson state
- provider label such as `google_meet` or `youtube`
- match source

## 12.2 Avoid raw free text

Do not send raw free text by default from:

- learning-need notes
- messages
- lesson reports
- moderation notes

If a flow needs analysis, send structured categories instead.

## 12.3 Redacted or enumerated properties

When product insight needs detail, prefer:

- enumerated values
- booleans
- range buckets
- sanitized labels

instead of raw user content.

## 13. Session Replay Posture

## 13.1 Main rule

Do not enable broad session replay across sensitive authenticated surfaces in the first MVP.

## 13.2 Why this is the default

Mentor IB handles:

- lessons
- private messaging
- tutor credential workflows
- meeting links
- trust and moderation data

That makes unrestricted replay unnecessarily risky.

## 13.3 Recommended MVP posture

If session replay is used at all in MVP, keep it narrow and conservative.

Good candidates:

- selected public marketing or acquisition pages
- tightly controlled low-risk product surfaces used for UX debugging

Bad candidates for replay:

- messages
- lesson detail with sensitive context
- payment or billing screens
- tutor credential upload flows
- admin and moderation surfaces

## 13.4 Privacy-control rule

If replay is enabled later, use the vendor's privacy controls aggressively and assume masking by default.

## 14. Dashboard And Output Model

## 14.1 Main rule

The first goal is not to build many dashboards.

The first goal is to make sure the event model can answer the product's most important questions.

## 14.2 Recommended first question groups

The early measurement layer should answer:

- how many users begin and finish the match flow
- how many results views lead to tutor profile views
- how many tutor profile views lead to booking starts
- how many booking requests become confirmed lessons
- how many approved tutors become operationally active

## 14.3 Derived metrics rule

Derived KPIs such as activation or conversion rates should be computed from the canonical event model and domain state, not hardcoded into one-off UI logic.

## 15. Privacy And Compliance Posture For Analytics

## 15.1 Privacy inheritance rule

This architecture inherits the approved privacy and retention rules.

## 15.2 Minimization rule

Analytics should collect the minimum data needed for product learning.

## 15.3 Minor-aware rule

Because IB students may be minors, the measurement architecture should be especially conservative about:

- free-text capture
- session replay on authenticated learning flows
- identity enrichment

## 15.4 Future compliance rule

Jurisdiction-specific consent and compliance handling should be able to tighten this system later without requiring the canonical event model to be rewritten.

This is why:

- the internal event contract comes first
- vendor usage comes second

## 16. Development, Preview, And Environment Rules

## 16.1 Environment separation rule

Development and preview environments should not pollute production product analytics.

## 16.2 Recommended posture

The architecture should support:

- no analytics in local development by default, or clearly isolated dev projects
- isolated preview or staging destinations if telemetry is enabled there
- a clean production project for real product learning

## 16.3 Test-user rule

The system should preserve a way to exclude:

- internal team activity
- AI-agent test activity
- synthetic QA flows

from normal product analysis where practical.

## 17. What This Architecture Prevents

This architecture is meant to prevent:

- product telemetry being confused with audit logging
- discoverability measurement being confused with in-app product behavior
- private data leaking into analytics
- one-off direct vendor calls from random components
- autocapture becoming the only source of truth
- future AI agents inventing their own event names ad hoc

## 18. Recommended Phase Scope

## 18.1 Phase 1

Phase 1 should support:

- Search Console for discoverability
- Vercel Web Analytics for public route traffic
- PostHog for explicit product events
- anonymous to identified telemetry continuity where supported
- no broad session replay on sensitive authenticated surfaces

## 18.2 Phase 1.5

Good next candidates:

- tighter activation dashboards
- selected replay on low-risk surfaces
- funnel and cohort refinement
- more structured tutor activation measurement

## 18.3 Phase 2

Consider later:

- warehouse exports
- richer attribution models
- more advanced experiments
- broader replay usage only if privacy posture and real need justify it

## 19. Decisions To Lock Now

The architecture should lock the following decisions now:

- measurement is split into discoverability, web traffic analytics, product telemetry, and audit logging
- the canonical event contract belongs to Mentor IB, not to any vendor SDK
- Vercel Web Analytics is for privacy-friendly route insight, not the sole product telemetry system
- PostHog is the recommended MVP product telemetry tool
- meaningful product actions should be captured explicitly
- raw private text and sensitive links do not belong in analytics payloads
- session replay is conservative and limited, not broad by default

## 20. Final Recommendation

Mentor IB should measure the product through one clear internal analytics contract and a small toolset rather than through scattered scripts.

The recommended MVP architecture is:

- Search Console for discoverability truth
- Vercel Web Analytics for anonymous route traffic insight
- PostHog for explicit event-based product telemetry
- strict separation between product analytics and audit or security logs

This gives the team enough measurement power to learn quickly without creating a noisy or privacy-unsafe analytics system.

## 21. Official Source Notes

The recommendation above is informed by current official documentation for:

- Vercel Web Analytics overview: `https://vercel.com/docs/analytics`
- Vercel Web Analytics quickstart: `https://vercel.com/docs/analytics/quickstart`
- Vercel Speed Insights overview: `https://vercel.com/docs/speed-insights/`
- PostHog event capture: `https://posthog.com/docs/product-analytics/capture-events`
- PostHog JavaScript web SDK: `https://posthog.com/docs/libraries/js`
- PostHog session replay privacy controls: `https://posthog.com/docs/session-replay/privacy`
- PostHog pricing: `https://posthog.com/pricing`
- Google Analytics event model: `https://support.google.com/analytics/answer/9322688?hl=en`
- Google Analytics event setup: `https://developers.google.com/analytics/devguides/collection/ga4/events`
