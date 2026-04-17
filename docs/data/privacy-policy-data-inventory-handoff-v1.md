# Mentor IB Privacy Policy Data Inventory Handoff v1

**Date:** 2026-04-10
**Status:** Standalone data inventory handoff for final privacy policy, cookie notice, subprocessor review, and implementation-agent privacy checks
**Scope:** product data categories, collection sources, processing purposes, candidate legal-basis notes, public exposure, provider recipients, retention references, data subject request support, minor-aware disclosures, policy gaps, and AI-agent-safe implementation rules

## 1. Why This Document Exists

Mentor IB now has:

- a privacy and retention architecture
- a compliance posture
- a data retention and erasure field map
- a data subject request workflow
- a DTO and API boundary contract
- a database schema outline
- a provider and architecture direction

What was still missing was the handoff document for one policy-facing question:

**What concrete personal data does Mentor IB expect to collect, where does it live, why is it used, who may receive it, and what must a final privacy policy disclose?**

Without this handoff, implementation can drift into:

- privacy policy copy that is too generic to match the real system
- data categories added by agents without policy review
- analytics or embedded media added without disclosure review
- public tutor profile exposure not reflected in the policy
- data subject request tooling exporting raw rows instead of reviewed categories
- provider and subprocessor lists becoming stale
- legal review starting from UI assumptions instead of a concrete data inventory

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because privacy policy readiness depends on concrete data inventory and data flows.

It is the direct companion to:

- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`

It inherits higher-level legal and product posture from:

- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- final legal advice
- final privacy policy wording
- final cookie notice wording
- final terms of service
- final data processing agreement review
- final subprocessor list
- final jurisdiction-specific applicability analysis
- final legal basis selection
- final retention durations
- final DPO, EU representative, UK representative, or regulator-facing disclosures

It is not legal advice.

It is a product and data inventory handoff so legal/policy review and implementation agents can start from the same map.

If there is a conflict:

- field lifecycle behavior comes from `docs/data/data-retention-erasure-field-map-v1.md`
- request workflow behavior comes from `docs/data/data-subject-request-workflow-v1.md`
- security posture comes from `docs/architecture/security-architecture-v1.md`
- compliance posture comes from `docs/architecture/compliance-and-regulatory-posture-v1.md`
- public route exposure comes from the SEO architecture docs
- DTO exposure comes from `docs/data/data-dto-and-query-boundary-map-v1.md`

## 4. Core Recommendation

Mentor IB should maintain a **living data inventory that feeds the privacy policy, cookie notice, data subject request workflow, and implementation review process**.

The practical rule is:

1. every product data category must map to a source-of-truth table or provider boundary
2. every category must have a purpose and privacy class
3. every public exposure path must be explicit
4. every provider recipient must be listed and reviewed
5. every optional analytics, marketing, or embedded third-party feature must have a consent/disclosure decision
6. every retention statement must trace back to the field map until final legal durations are approved
7. agents must update this inventory when introducing new personal-data categories or recipients

This gives Mentor IB a privacy-policy handoff without hardcoding legal text too early.

## 5. Policy Writer Output Checklist

A final privacy policy or privacy notice should be able to answer:

- who operates Mentor IB and how to contact them
- what personal data is collected
- where the data comes from
- why the data is used
- what legal basis or permission posture applies, where relevant
- who receives or processes the data
- whether data is publicly visible
- whether data is transferred internationally
- how long data is kept or how retention is determined
- how users can access, correct, delete, restrict, object, or export data where applicable
- how minors and guardians are handled
- how cookies, analytics, and embedded third-party content are handled
- how payments are handled without Mentor IB storing raw card data
- how policy changes are communicated
- how users can complain or contact a supervisory authority where applicable

This doc provides the product-data side of those answers.

It does not provide final legal wording.

## 6. Privacy Classes Used In This Handoff

Use the existing privacy class model.

| Class | Meaning | Policy posture |
| --- | --- | --- |
| `P1` | Public approved data | Disclose that it may appear on public routes, search engines, metadata, and structured data |
| `P2` | Account and profile data | Private account operation and communication data |
| `P3` | Operational educational data | Role-scoped learning, lesson, matching, booking, and schedule data |
| `P4` | Communications and trust data | Sensitive role-scoped messages, reports, blocks, moderation, and safety records |
| `P5` | Verification or financial linkage data | Highly restricted credential, verification, payment, payout, and provider-linkage data |

Minor-aware rule:

- student data should be treated conservatively because IB students may be minors, even when the MVP is not designed as a child-directed under-13 product.

## 7. Candidate Legal-Basis Notes

Final legal basis selection requires legal review.

Use these only as policy-review prompts:

- account, authentication, booking, lesson, message, and tutor operations may often align with service delivery or contract necessity
- security, abuse prevention, fraud prevention, support, reliability, and product integrity may often align with legitimate interests or legal obligations, depending on jurisdiction and context
- payment, tax, accounting, disputes, and compliance records may often align with legal obligation, contract, or legitimate interests
- optional marketing, optional non-essential cookies, optional analytics in some jurisdictions, and certain third-party video embeds may require consent or opt-out mechanisms depending on jurisdiction and implementation
- public tutor profile publication should be grounded in explicit tutor action, approval state, and clear disclosure
- under-13 or guardian-managed scenarios require separate review before launch

Agents should not hardcode legal basis labels in product code unless a final policy/legal decision exists.

## 8. Data Inventory Summary

| Data family | Privacy class | Source | Primary purpose | Public exposure | Main provider recipients |
| --- | --- | --- | --- | --- | --- |
| Account identity | `P2` | user, Google OAuth, Supabase Auth | login, account, security | no | Supabase, Google OAuth, Resend if used |
| Role and onboarding | `P2` | user | student/tutor setup | no | Supabase |
| Student learning needs | `P3` | student | matching, booking, lesson context | no | Supabase, tutor through role-scoped DTOs |
| Tutor public profile | `P1` after approval | tutor and review/admin state | public discovery and booking trust | yes | Vercel, Supabase, search crawlers |
| Tutor private profile | `P2`/`P3` | tutor | operations and application review | no | Supabase |
| Tutor credential evidence | `P5` | tutor upload | verification and trust review | no raw file exposure | Supabase Storage |
| Derived public trust proof | `P1` after approval | admin/tutor review outcome | public confidence | yes | Vercel, Supabase, search crawlers |
| Availability and schedule | `P3` | tutor | booking and lesson planning | limited public-safe summaries only | Supabase |
| Lessons and bookings | `P3` | student/tutor/system | lesson continuity and operations | no | Supabase, Stripe if payment-linked |
| Meeting links | `P3`/`P4` | tutor/student/provider link | lesson access | no | meeting provider only when user follows link |
| Conversations and messages | `P4` | student/tutor | communication and continuity | no | Supabase, Resend for minimal notifications if used |
| Reports, blocks, moderation | `P4`/`P5` | user/admin/system | safety and platform integrity | no | Supabase |
| Reviews and ratings | `P1`/`P3`/`P4` | student/tutor/admin/system | trust, quality, ranking | public only after approval | Supabase, Vercel, search crawlers |
| Billing and payments | `P5` | Stripe and product records | payment, refunds, disputes, payouts | no | Stripe, Supabase |
| Notifications and emails | `P2`/`P3`/`P4` | product events | transactional communication | no | Resend if used |
| Analytics and telemetry | `P2`/pseudonymous where possible | browser/server | product improvement | no | Vercel Web Analytics, PostHog if used |
| Logs and audit records | `P2`/`P4`/`P5` depending content | server/provider/system | security, debugging, audit | no | Vercel, Supabase, provider logs |
| Public SEO projections | `P1` only | canonical public-safe sources | discoverability | yes | Vercel, search engines, Search Console |
| File and media assets | `P1`/`P5` by asset class | user/admin/provider | profile media or verification | only public profile media | Supabase Storage, external video providers |
| Privacy request records | `P4`/`P5` | requester/admin/system | rights handling | no | Supabase, providers if follow-up needed |

## 9. Detailed Data Inventory

## 9.1 Account identity

Data examples:

- auth user id
- email address
- Google OAuth identity reference
- magic link/auth state
- app user id
- account status
- created and updated timestamps

Source:

- user
- Google OAuth
- Supabase Auth

Purpose:

- account creation
- login
- session management
- account recovery
- security and abuse prevention
- service communication

Privacy class:

- `P2`

Provider recipients:

- Supabase Auth
- Google OAuth when selected by the user
- Resend if configured for custom auth or transactional email
- Vercel for app request handling and logs

Policy notes:

- disclose magic link and Google login options
- disclose that Google login may involve Google account data according to Google settings
- disclose service emails separate from optional marketing emails
- do not promise users can opt out of essential service/security emails

Implementation notes:

- do not expose auth provider ids in public DTOs
- do not log tokens, magic links, or OAuth payloads
- account deletion must follow the data subject request workflow, not only delete `auth.users`

## 9.2 Role selection and onboarding

Data examples:

- selected role: learning or teaching
- onboarding completion state
- student profile link
- tutor profile link
- timezone and language preferences if collected during setup

Source:

- user

Purpose:

- route the user to student or tutor mode
- configure the shared account experience
- enable role-based authorization

Privacy class:

- `P2`

Provider recipients:

- Supabase
- Vercel request/runtime logs at a minimal operational level

Policy notes:

- explain that users can choose learning or teaching flows
- avoid implying there are separate accounts when the product uses one shared account model

Implementation notes:

- role choice is app-level product state, not just provider auth metadata
- role claims must not be trusted only from client state

## 9.3 Student learning needs

Data examples:

- subject or course interest
- IB level or programme context
- learning goal
- urgency
- preferred tutor traits
- availability preferences
- timezone
- budget or booking preferences if introduced
- free-text learning notes

Source:

- student
- guardian/parent if a guardian-managed path is introduced later

Purpose:

- matching
- tutor evaluation
- booking context
- lesson continuity

Privacy class:

- `P3`

Provider recipients:

- Supabase
- matched or booked tutor only through role-scoped DTOs
- PostHog only as aggregated/non-sensitive event categories, never free text

Policy notes:

- disclose that learning need data is used to recommend and match tutors
- disclose that relevant learning context may be shared with selected/booked tutors
- disclose that free-text content should not include unnecessary sensitive data
- include minor-aware wording because learners may be minors

Implementation notes:

- do not send free-text notes to product analytics
- do not expose learning needs publicly
- DSR exports should use reviewed DTOs, not raw rows

## 9.4 Tutor public profile data

Data examples:

- display name
- slug
- public bio
- subjects
- languages
- public timezone or availability summary if approved
- public profile photo
- public video reference
- approved trust proof
- public rating or review summaries

Source:

- tutor
- admin/moderation review
- derived trust/review systems

Purpose:

- public discovery
- tutor evaluation
- booking confidence
- SEO and AI discoverability

Privacy class:

- `P1` only after publication and quality gates

Provider recipients:

- Supabase
- Vercel and CDN/runtime logs
- search engine crawlers
- Google Search Console as discoverability measurement
- YouTube, Vimeo, or Loom when users interact with embedded or linked video references

Policy notes:

- disclose that approved tutor profile information is public
- disclose that public pages may appear in search engines and AI/search snippets
- disclose that profile removal can remove Mentor IB exposure, but search engines may retain cached/indexed copies for a time
- disclose third-party video provider behavior if embedded video players are used

Implementation notes:

- public profile data must come from public DTOs or approved projections
- private credential files do not become public profile content
- cache, sitemap, metadata, structured data, and projections must update when public status changes

## 9.5 Tutor private profile and application data

Data examples:

- application status
- private tutor profile details
- internal review notes
- eligibility fields
- teaching history details not shown publicly
- private schedule settings
- payout readiness if later introduced

Source:

- tutor
- admin/moderation review
- system status transitions

Purpose:

- tutor application review
- tutor operations
- scheduling
- trust and safety review
- support

Privacy class:

- `P2` and `P3`, with some `P4` or `P5` depending field

Provider recipients:

- Supabase
- Vercel operational logs at a minimal level

Policy notes:

- distinguish public tutor profile data from private application/review data
- disclose that some private information may be reviewed by authorized Mentor IB staff

Implementation notes:

- public DTOs must not read directly from private application fields
- moderation/admin DTOs are still scoped and restricted

## 9.6 Tutor credential and verification evidence

Data examples:

- certificate file metadata
- credential evidence file paths
- qualification claims
- verification status
- verification reviewer and timestamps
- derived public trust proof

Source:

- tutor upload
- admin/moderation review

Purpose:

- verify tutor claims
- derive public trust proof
- handle disputes or safety review where necessary

Privacy class:

- `P5` for raw files and evidence
- `P1` only for approved derived trust proof

Provider recipients:

- Supabase Storage
- Supabase database metadata
- Vercel only through secure server access and logs

Policy notes:

- disclose credential upload/review if the MVP includes it
- disclose that raw credential files are private and not public profile content
- disclose that approved trust proof may be public when derived from review

Implementation notes:

- raw storage object paths must not appear in public DTOs
- deletion workflows must remove storage objects through Storage APIs, not just database metadata
- final policy must define how long rejected or stale credential files are retained

## 9.7 Availability, schedule, booking, and lessons

Data examples:

- availability rules
- schedule policies
- booking request status
- lesson status
- scheduled lesson time
- timezone
- lesson subject/focus snapshot
- cancellation or reschedule reason
- attendance or reliability signals
- meeting link

Source:

- tutor
- student
- system state transitions

Purpose:

- booking
- scheduling
- lesson delivery
- operational continuity
- dispute/support context
- tutor reliability and matching quality

Privacy class:

- `P3`
- meeting links and sensitive notes can behave like `P4`

Provider recipients:

- Supabase
- Stripe if payment state is linked to lesson state
- Resend for minimal transactional reminders if used
- external meeting provider only when users follow their own meeting links

Policy notes:

- disclose that lesson and booking data is shared between the relevant student and tutor
- disclose calendar export behavior if `.ics` download is offered
- disclose that third-party meeting links are controlled by the provider or the tutor/student who created them

Implementation notes:

- meeting links must not appear on public pages or in public DTOs
- `.ics` files require participant access or signed access
- lesson retention should preserve needed financial/safety context while redacting stale private content when appropriate

## 9.8 Conversations, messages, blocks, and reports

Data examples:

- conversation membership
- message body
- reply references
- reactions if introduced
- unread state
- typing/presence metadata if introduced
- block records
- report records
- moderation review state

Source:

- student
- tutor
- admin/moderation action
- Realtime presence if enabled

Purpose:

- tutor-student communication
- lesson continuity
- safety and moderation
- notification of new activity

Privacy class:

- `P4`

Provider recipients:

- Supabase Postgres
- Supabase Realtime
- Resend for minimal notifications if used
- Vercel operational logs without message bodies

Policy notes:

- disclose that messages are private to participants and may be reviewed for safety, support, reports, or legal reasons where appropriate
- disclose block/report handling at a high level
- disclose notification emails without promising message body inclusion

Implementation notes:

- do not log message bodies
- do not send message bodies to analytics
- email notifications should minimize message content
- duplicate text alone is not an idempotency key

## 9.9 Reviews, ratings, trust, and ranking signals

Data examples:

- rating
- review text if public reviews are supported
- review status
- review author relationship
- tutor aggregate rating
- reliability events
- moderation outcome
- ranking feature inputs

Source:

- student
- tutor
- lesson state
- admin/moderation review
- system-derived calculations

Purpose:

- trust
- marketplace quality
- tutor ranking
- public profile quality
- safety and dispute handling

Privacy class:

- `P1` for approved public review outputs
- `P3` or `P4` for private review context, reliability events, and moderation details

Provider recipients:

- Supabase
- Vercel/search crawlers for approved public outputs
- PostHog only for aggregated event categories if used

Policy notes:

- disclose when reviews or ratings are public
- disclose that internal reliability and moderation signals may affect ranking or eligibility
- avoid claiming fully automated consequential decisions unless legally reviewed

Implementation notes:

- public rating/review DTOs must not expose private report or reliability details
- ranking explanations should remain product-safe and not disclose abuse controls

## 9.10 Billing, payments, refunds, and payouts

Data examples:

- Stripe customer id
- checkout/session id
- payment intent id
- subscription/payment status if introduced
- refund/dispute reference
- payout/earning summary if introduced
- invoice or receipt metadata

Source:

- Stripe
- user payment flow
- app provider event records

Purpose:

- payment processing
- refunds
- receipts
- dispute handling
- tutor earnings and payout operations where applicable
- accounting and compliance

Privacy class:

- `P5`

Provider recipients:

- Stripe
- Supabase for app-facing payment summaries and provider ids
- Vercel for webhook handling logs without raw payment instrument data

Policy notes:

- disclose Stripe as payment provider when payments are introduced
- disclose that Mentor IB should not store raw card numbers
- disclose that Stripe may act under its own privacy terms for certain processing
- disclose financial record retention may differ from normal account deletion

Implementation notes:

- webhook payloads are restricted operational records
- never log raw payment method details
- payment webhooks follow verify-record-dispatch
- DSR deletion may retain restricted financial records where legally or operationally required

## 9.11 Notifications and transactional email

Data examples:

- email address
- notification type
- notification status
- delivery status
- minimal subject or template key
- unsubscribe state for marketing if introduced

Source:

- product events
- user account
- email provider delivery status

Purpose:

- magic link or account verification if configured
- booking and lesson notifications
- message activity notifications
- privacy request responses
- service and security notices
- optional marketing only if later approved

Privacy class:

- `P2`
- `P3` or `P4` if notification content reveals lesson/message context

Provider recipients:

- Resend if used
- Supabase if using Supabase-managed auth emails

Policy notes:

- distinguish service/transactional emails from optional marketing emails
- disclose email provider use
- disclose that users cannot opt out of essential security or service emails

Implementation notes:

- prefer template keys and object ids over storing full private content in notification logs
- avoid putting private message body text in email subject lines

## 9.12 Analytics, traffic, and product telemetry

Data examples:

- route page views
- event name
- flow step
- conversion state
- route family
- anonymous or pseudonymous id if used
- device/browser metadata if collected by provider
- referrer or UTM data where configured

Source:

- browser
- server events
- analytics provider SDK

Purpose:

- understand product funnels
- improve UX
- monitor public-route traffic
- measure SEO and discoverability

Privacy class:

- ideally aggregated, anonymous, or pseudonymous
- `P2` if tied to a user id or account

Provider recipients:

- Vercel Web Analytics for anonymous traffic insight
- PostHog if product telemetry is adopted
- Google Search Console for public discoverability

Policy notes:

- disclose analytics providers actually used
- disclose whether analytics are essential or optional
- disclose cookie or tracking behavior where applicable
- disclose that product telemetry should not include private message bodies or free-text learning notes

Implementation notes:

- do not use broad autocapture as the main product truth without privacy review
- do not send sensitive free text into analytics
- keep audit/security logs separate from product analytics

## 9.13 Logs, audit records, jobs, and provider events

Data examples:

- request id
- safe actor id
- route/action id
- IP address if captured by platform/provider logs
- user agent if captured by platform/provider logs
- provider event id
- job status
- webhook status
- admin action id
- security/audit reason

Source:

- Vercel
- Supabase
- Stripe webhooks
- app server
- admin/moderation actions

Purpose:

- security
- debugging
- incident response
- auditability
- provider reconciliation
- job retry and maintenance

Privacy class:

- `P2`, `P4`, or `P5` depending content

Provider recipients:

- Vercel
- Supabase
- Stripe for payment events
- Resend for email delivery events if used

Policy notes:

- disclose that logs may be used for security, debugging, abuse prevention, and service reliability
- disclose that retention may differ for security/audit logs

Implementation notes:

- do not store private content in general logs
- restrict raw provider payloads
- keep durable operational records for jobs and webhooks

## 9.14 Public SEO projections and search exposure

Data examples:

- public tutor slug
- public tutor profile fields
- public rating/trust summaries
- public subject/language coverage
- public profile media references
- metadata and structured data fields
- sitemap eligibility

Source:

- approved public tutor profile data
- public-safe projection
- route metadata helpers

Purpose:

- public tutor discovery
- search engine indexing
- AI/search result summarization
- route metadata and structured data

Privacy class:

- `P1`

Provider recipients:

- Vercel
- search engine crawlers
- Google Search Console
- any future external public search provider if adopted

Policy notes:

- disclose that public tutor data can be indexed by search engines
- disclose that deindexing from third-party search may take time
- disclose that public structured data may be generated from approved public fields

Implementation notes:

- public projections must contain only public-safe fields
- delisting must update routes, sitemap, metadata, structured data, projections, and caches

## 9.15 Files, profile media, and external video references

Data examples:

- profile image metadata
- public media publication state
- credential evidence files
- video provider
- video URL or normalized video id
- video moderation/publication status

Source:

- tutor upload
- tutor-provided external video URL
- admin/moderation review

Purpose:

- public tutor profile media
- private credential review
- public intro video preview

Privacy class:

- `P1` for approved public profile media and public video references
- `P5` for private credential evidence

Provider recipients:

- Supabase Storage
- YouTube, Vimeo, or Loom if embedded or linked
- Vercel for route rendering and operational logs

Policy notes:

- disclose that third-party video providers may process data when users interact with embedded or linked video content
- disclose that raw credential uploads are private and not public profile content
- final cookie/consent review should decide whether video embeds need a click-to-load or consent gate

Implementation notes:

- store normalized video references, not arbitrary embed HTML
- prefer privacy-conscious embed modes where available
- avoid loading third-party video players before consent if legal review requires gating

## 9.16 Support and privacy requests

Data examples:

- support request text
- privacy request type
- verification evidence
- request due date
- request status
- export artifact id
- response timestamp
- denial or hold reason
- provider follow-up status

Source:

- requester
- admin/support user
- system workflow

Purpose:

- support
- data subject request handling
- identity verification
- legal/compliance response
- audit trail

Privacy class:

- `P4` and sometimes `P5`

Provider recipients:

- Supabase
- Resend for response emails if used
- relevant providers if deletion/export follow-up is needed

Policy notes:

- disclose how users can make privacy requests
- disclose that identity verification may be required
- disclose that some records may be retained where legal, safety, financial, or dispute reasons apply

Implementation notes:

- DSR exports are DTO-safe, not raw database dumps
- export files are private and short-lived
- privacy request records are restricted operational records

## 10. Candidate Provider And Recipient Inventory

This inventory is a policy-review input, not a final subprocessor list.

| Provider | Expected role | Expected data categories | Policy action |
| --- | --- | --- | --- |
| Supabase | auth, database, storage, realtime | account, product data, messages, files, logs | DPA/subprocessor review; disclose as hosting/data platform |
| Vercel | hosting, CDN, server runtime, logs, web analytics if enabled | request metadata, public pages, server logs, route analytics | DPA/subprocessor review; disclose hosting and analytics if used |
| Resend | transactional email, possibly auth email if configured | email address, template metadata, minimal notification content | DPA/subprocessor review; disclose email provider |
| Stripe | payments, refunds, disputes, payout support if used | payment identifiers, billing records, payment status | DPA/privacy review; disclose payment provider and independent role where applicable |
| PostHog | product telemetry if adopted | event data, pseudonymous/user ids if configured | DPA/subprocessor review; disclose analytics and consent/opt-out posture |
| Google OAuth | sign-in option | Google account identity fields selected by auth scope | disclose optional Google sign-in |
| Google Search Console | search performance | public route/search performance data | disclose if appropriate in analytics/discoverability section |
| Google/YouTube | external video provider if used | video interaction data when embedded/played | disclose third-party video behavior; consent/cookie review |
| Vimeo | external video provider if used | video interaction data when embedded/played | disclose third-party video behavior; consent/cookie review |
| Loom | external video provider if used | video interaction data when embedded/played | disclose third-party video behavior; consent/cookie review |
| Google Meet, Microsoft Teams, Zoom, or similar | tutor-provided meeting links, not owned meeting stack | data shared when users follow external meeting links | disclose third-party meeting links if used |
| Search engines | crawl public pages | public profile fields, metadata, structured data | disclose public search indexing |

Rules:

- do not list a provider in the final policy until it is actually used or clearly planned for launch
- do not adopt a new processor without adding it to this inventory and checking DPA/subprocessor posture
- distinguish processors from independent third-party services where legal review requires it

## 11. Public Exposure Inventory

These are the only expected public product surfaces in MVP:

- public marketing pages
- approved tutor profile pages
- approved tutor profile metadata
- approved structured data
- public sitemap entries
- public trust proof derived from approved review
- approved public profile media
- approved external video reference or embed

These must not be public:

- student profiles
- student learning needs
- messages
- meeting links
- booking details
- lesson reports
- tutor credential files
- private tutor application notes
- payment details
- reports and moderation evidence
- privacy request records
- raw logs or provider payloads

Policy note:

- final policy should clearly explain that tutor public profile data may be publicly visible and indexed, while student and operational lesson data remain private and role-scoped.

## 12. Retention Handoff

Final retention durations remain legal/policy work.

Use the following source docs until final durations are approved:

- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`

Policy-facing retention posture:

- public tutor data is retained while public/listed and removed from public exposure when delisted
- account and profile data is retained while the account is active and then deleted, redacted, anonymized, or restricted according to dependencies
- educational operational data is retained only while needed for continuity, safety, support, or disputes
- messages and trust/safety data are retention-sensitive and may be restricted or redacted rather than always hard-deleted
- credential files should be minimized and deleted when no longer needed for verification, dispute, safety, or legal reasons
- financial records may need longer restricted retention
- logs and audit records may have distinct security and operational retention
- derived projections and caches do not own retention and must be purged or rebuilt after canonical lifecycle changes

Do not write final duration numbers in the privacy policy until legal review approves them.

## 13. Data Subject Request Handoff

The policy should point users to a clear request channel for:

- access
- correction
- deletion/erasure
- restriction
- objection
- portability/export where applicable
- consent withdrawal where applicable

Implementation must use:

- `docs/data/data-subject-request-workflow-v1.md`

Policy notes:

- identity verification may be required
- guardian authority may be required for minor-related requests
- some records may be retained or restricted for legal, safety, payment, dispute, or audit reasons
- export responses should not include other users' private data
- public profile removal may require search deindexing and cache/projection cleanup

## 14. Minors And Guardian Handoff

Mentor IB should be minor-aware.

Policy-facing posture:

- the MVP should not be designed as a child-directed under-13 product
- if the product has actual knowledge that a user is under 13, the user should be blocked or routed to a reviewed guardian-managed path
- student public reputation should not exist in MVP
- student identity exposure should be minimal
- guardian-managed billing or communication paths require separate policy and workflow review

Implementation notes:

- do not collect exact date of birth by default unless there is a clear reviewed reason
- do not add child-directed copy or flows without compliance review
- do not enable behavioral advertising to known minors

## 15. Cookie, Analytics, And Embedded Media Handoff

Final cookie/consent design remains legal/policy work.

Policy-facing surfaces to review:

- Supabase auth/session cookies
- Vercel hosting and Web Analytics if enabled
- PostHog product telemetry if enabled
- Resend email open/click tracking if enabled
- third-party video embeds from YouTube, Vimeo, or Loom
- marketing pixels, if ever introduced

Default implementation posture:

- essential auth/session cookies can be treated separately from optional tracking
- product analytics must not collect private free text
- embedded third-party video players should be reviewed for consent or click-to-load behavior before public launch
- marketing pixels are out of scope unless explicitly approved later

## 16. Policy Gaps To Resolve Before Launch

Legal/policy review still needs to decide:

- legal entity name and contact details
- privacy contact email
- whether a DPO is required
- whether an EU or UK representative is required
- final jurisdiction scope
- final legal bases by processing purpose
- final retention durations
- final processor/subprocessor list
- final DPA acceptance status for each provider
- international transfer mechanism statements
- final cookie and analytics consent model
- final marketing email consent and unsubscribe model
- final under-13 and guardian-managed account handling
- final public tutor profile removal/deindexing wording
- final payment provider wording
- final data subject request channel and response wording
- final complaints/supervisory authority wording
- final privacy policy change-notice process

Agents should not invent these values in code or copy.

## 17. Implementation Review Triggers

Update this handoff if implementation introduces:

- a new personal-data field family
- a new free-text field
- a new public profile field
- a new provider or processor
- a new analytics event property that can identify a user
- a new message, report, moderation, or safety surface
- a new credential or file upload
- a new payment, payout, refund, or dispute field
- a new export or deletion behavior
- a new embedded third-party media provider
- a new meeting provider integration
- a new cookie, SDK, pixel, or tracking mechanism
- a new role or guardian/minor flow

Do not update this handoff for:

- purely visual refactors
- component code changes that do not change data collection or exposure
- route copy changes that do not alter privacy meaning

## 18. AI-Agent Implementation Rules

Agents should:

- read this handoff before implementing privacy-affecting features
- keep final policy wording out of feature code unless approved
- map new fields to privacy class, source, purpose, recipient, retention, and DSR behavior
- keep public profile data separate from private tutor data
- keep student learning needs private and role-scoped
- keep messages and reports out of analytics/logs
- keep credential files private by default
- check provider inventory before adding an SDK
- update this handoff when a new data category or recipient is introduced

Agents should not:

- use a generic privacy policy generator as source of truth
- copy vendor privacy language into Mentor IB policy without review
- add marketing pixels or broad analytics autocapture by default
- expose raw credential files, meeting links, message bodies, or payment details in public/client DTOs
- treat public tutor profile deletion as complete without cache, sitemap, projection, and search deindexing review
- assume a provider is a processor or independent controller without legal review
- hardcode legal basis or retention duration values without approval

## 19. Recommended Next Planning Artifacts

The implementation task template now exists:

- `docs/planning/implementation-task-template-v1.md`

That template requires each future implementation task to list:

- source docs consulted
- data categories touched
- privacy class changes
- provider changes
- DTO exposure changes
- test and review expectations

## 20. Final Recommendation

Mentor IB should treat this handoff as the privacy-policy data inventory baseline.

The operating model is:

- final legal policy text comes later
- this document owns the product data map for policy review
- the retention and DSR docs own lifecycle behavior
- the DTO and API docs own implementation boundaries
- agents update the inventory when implementation changes the actual data picture

That gives policy/legal reviewers and implementation agents the same source map without asking either group to reverse-engineer the product from scattered features.

## 21. Official Source Notes

This handoff was checked against current official or source-of-law references for privacy notice and rights expectations:

- European Commission GDPR rights overview: `https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en`
- Your Europe GDPR business guidance: `https://europa.eu/youreurope/business/dealing-with-customers/data-protection/data-protection-gdpr/index_en.htm`
- EDPB data subject rights guide: `https://www.edpb.europa.eu/sme-data-protection-guide/respect-individuals-rights_en`
- California DOJ CCPA overview: `https://www.oag.ca.gov/privacy/ccpa`
- FTC COPPA FAQ: `https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions`
- Supabase Privacy Policy: `https://supabase.com/privacy`
- Vercel Data Processing Addendum: `https://vercel.com/legal/dpa`
- Stripe Data Processing Agreement: `https://stripe.com/legal/dpa`
- Resend Data Processing Addendum: `https://resend.com/legal/dpa`
- PostHog DPA generator: `https://posthog.com/dpa`
- Google Privacy Policy: `https://policies.google.com/privacy`
- Vimeo Privacy Policy: `https://vimeo.com/privacy`
