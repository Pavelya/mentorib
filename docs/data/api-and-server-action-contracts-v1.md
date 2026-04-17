# Mentor IB API And Server Action Contracts v1

**Date:** 2026-04-10
**Status:** Standalone data-layer contract for Server Actions, Route Handlers, app-facing mutation boundaries, provider callbacks, DTO-safe responses, validation, authorization, idempotency, cache invalidation, and AI-agent-safe implementation rules
**Scope:** when to use Server Actions, when to use Route Handlers, when not to create an internal API, how request and response contracts should behave, how side effects are coordinated, and how future implementation agents should review app boundary changes

## 1. Why This Document Exists

Mentor IB already has:

- a Next.js App Router architecture
- a route-layout implementation map
- a DTO and query boundary map
- auth and RLS boundary docs
- idempotency, job, and webhook architecture
- database observability and data subject request docs

What was still missing was the contract for one recurring implementation question:

**When should a future agent create a Server Action, a Route Handler, or no HTTP endpoint at all?**

Without this contract, implementation can drift into:

- building a generic internal REST API before the product needs one
- putting ordinary page data behind route handlers by habit
- returning raw database rows from mutations
- spreading auth, validation, idempotency, and cache invalidation differently per feature
- treating provider webhooks like normal form submissions
- creating duplicate mutation paths for the same domain behavior
- making AI agents guess whether a change belongs in route code, domain services, repositories, or background work

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because app boundary contracts are data contracts once they:

- read or mutate canonical product data
- return DTO-safe shapes
- coordinate cache invalidation
- trigger jobs, notifications, provider calls, or webhooks
- enforce authorization and object-level access
- shape export, privacy, billing, lesson, message, and tutor profile behavior

It is the direct companion to:

- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/supabase-folder-and-file-conventions-v1.md`

It inherits application-shape rules from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/route-layout-implementation-map-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/search-and-query-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- final TypeScript function names
- final file and module paths
- final validation library choice
- final DTO interfaces
- final database schema
- final RLS policy SQL
- final provider-specific SDK wrappers
- final public external API, if one is ever created

It defines boundary behavior and review rules.

If there is a conflict:

- route ownership comes from `docs/architecture/route-layout-implementation-map-v1.md`
- DTO class and query shape come from `docs/data/data-dto-and-query-boundary-map-v1.md`
- auth and role rules come from `docs/data/auth-and-authorization-matrix-v1.md`
- RLS defense-in-depth rules come from `docs/data/database-rls-boundaries-v1.md`
- idempotency rules come from `docs/data/integration-idempotency-model-v1.md`
- async and webhook handling rules come from `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- privacy request lifecycle comes from `docs/data/data-subject-request-workflow-v1.md`

## 4. Core Recommendation

Mentor IB should use **Next.js Server Components and domain services as the default read boundary, Server Actions as the default in-app mutation boundary, and Route Handlers only for explicit HTTP endpoint needs**.

The practical rule is:

1. Server Components read page data through domain services.
2. Server Actions handle authenticated or product-owned UI mutations.
3. Route Handlers handle provider callbacks, auth callbacks, file-like responses, webhooks, export downloads, and intentionally public machine-readable endpoints.
4. Domain services own business rules, object-level authorization, DTO shaping, and side-effect decisions.
5. Repositories own database query composition and transactions.
6. The app should not create a generic internal REST or GraphQL BFF for routine in-app page data in phase 1.

This keeps the MVP small without hiding important boundaries.

## 5. Boundary Vocabulary

Use these terms consistently.

## 5.1 Server Component read

A server-rendered route, page, or component reads data by calling domain query functions and receiving DTO-safe results.

Use this for:

- public tutor profile pages
- public search and discovery pages
- authenticated dashboards
- lesson and message views
- account and privacy settings
- internal admin pages

Rule:

- do not create a Route Handler just so a page can fetch its own app data.

## 5.2 Server Action

A server-side mutation function invoked from forms or client interactions.

Use this for:

- role selection after signup
- tutor application draft and submission
- booking request creation
- lesson reschedule or cancellation requests
- message send actions
- block and report actions
- profile edits
- schedule and availability changes
- privacy request submission
- internal moderation decisions

Rule:

- Server Actions return minimal operation results and then revalidate or redirect intentionally.

## 5.3 Route Handler

A file-based HTTP endpoint in the Next.js app route tree.

Use this for:

- Supabase Auth callback handling, where applicable
- Stripe webhook ingest
- calendar `.ics` responses
- data export download responses
- storage signed-download handoff, if required
- limited public machine-readable endpoints
- future provider callbacks that cannot be modeled as Server Actions

Rule:

- Route Handlers are narrow integration endpoints, not the default internal data layer.

## 5.4 Domain service

A server-only use-case function that owns business logic.

Use this for:

- deciding if an actor can mutate or read an object
- checking lesson, booking, conversation, or tutor state
- calling repositories
- shaping DTOs
- deciding whether to enqueue jobs or notification work
- selecting cache invalidation targets

Rule:

- Server Actions and Route Handlers should be thin boundary wrappers around domain services.

## 5.5 Repository

A server-only data-access function that owns database query composition.

Use this for:

- Drizzle queries
- SQL fragments
- transactions
- projection reads
- canonical table writes

Rule:

- repositories do not return broad raw rows to route or client boundaries.

## 5.6 Provider webhook

An inbound provider-originated HTTP request.

Use this for:

- Stripe payment and payout state
- future external provider callbacks

Rule:

- webhooks are untrusted until signature verification passes and must be idempotent.

## 5.7 Export or file-like endpoint

A Route Handler that returns non-page content.

Examples:

- lesson `.ics`
- privacy export download
- future CSV export for internal admin

Rule:

- validate ownership, scope, and expiry before returning content or redirecting to a signed URL.

## 6. Boundary Decision Matrix

| Need | Preferred boundary | Why |
| --- | --- | --- |
| Render public marketing page | Server Component | No mutation and no separate API needed |
| Render public tutor profile | Server Component plus public DTO | SEO and public DTO control stay in route/domain layer |
| Render authenticated dashboard | Server Component plus role-safe DTO | Keeps auth and DTO shaping server-side |
| Submit a booking request form | Server Action | In-app mutation initiated by UI |
| Send a message | Server Action | User-initiated mutation with validation, auth, idempotency review, and possible notifications |
| Update tutor availability | Server Action | Authenticated product mutation |
| Approve tutor application | Server Action | Internal admin mutation with audit requirement |
| Receive Stripe webhook | Route Handler | External provider HTTP callback with signature verification |
| Return lesson calendar file | Route Handler | File-like HTTP response |
| Download privacy export | Route Handler | Access-controlled file/download response |
| Expose page data to the same Next.js app | Server Component/domain service | Avoid internal REST or GraphQL BFF drift |
| Expose data to a future mobile app | Later external API decision | Not phase 1 unless a real client exists |

## 7. Golden Path For In-App Reads

The default read path should be:

1. route receives params and search params
2. route validates route shape and route family
3. route calls a server-only domain query function
4. domain query resolves actor context when required
5. domain query checks object-level authorization
6. repository reads canonical tables or approved projections
7. domain query maps result to the smallest safe DTO
8. route passes DTO to Server Components or Client Components
9. route metadata and structured data use the public DTO or a narrower metadata DTO where needed

Do not:

- fetch private product data from a Client Component
- pass Drizzle row types into UI props
- let a page own a large cross-domain join by convenience
- create an `api/` endpoint because the page needs data

## 8. Golden Path For Server Actions

The default Server Action path should be:

1. UI submits a form or intentional client interaction
2. Server Action resolves the authenticated actor server-side
3. Server Action validates input at the server boundary
4. Server Action normalizes safe values
5. Server Action creates or resolves the idempotency key when required
6. Server Action calls a domain command service
7. domain command checks object-level authorization and product state
8. repository performs the mutation or transaction
9. domain command records audit, event, job, notification, or projection refresh intent when required
10. action returns a minimal operation result, redirects, or triggers cache revalidation

Server Actions should be thin.

They may contain:

- input parsing
- validation result mapping
- actor resolution
- call to one domain command
- `revalidatePath` or `revalidateTag`
- `redirect` when the flow needs a new page

They should not contain:

- raw SQL
- complex cross-domain business logic
- direct provider SDK branching
- direct message body logging
- raw database row returns
- admin bypass logic hidden in a route file

## 9. Golden Path For Route Handlers

The default Route Handler path should be:

1. handler confirms the HTTP method and route intent
2. handler resolves request context that is appropriate for the endpoint
3. handler verifies signatures or tokens where required
4. handler validates route params, search params, headers, and body
5. handler records durable inbound event state when required
6. handler calls one domain service or dispatches one durable job
7. handler returns a narrow HTTP response quickly

Route Handlers should be thin.

They may contain:

- raw body handling for webhooks
- header and signature verification
- file or stream response setup
- response status mapping
- narrow provider callback parsing

They should not contain:

- broad page-data query logic
- UI-specific view model composition
- hidden duplicate mutation logic that bypasses Server Actions
- provider-specific business rules spread through unrelated routes
- unauthenticated state changes without an explicit security design

## 10. Contract Envelope Vocabulary

Future implementation can choose final TypeScript names, but the contract vocabulary should stay stable.

## 10.1 Operation result

Use a minimal operation result for Server Action responses.

Conceptual shape:

```ts
type ActionResult<TData = undefined> = {
  ok: boolean;
  code: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: TData;
};
```

Rules:

- `data` should be absent unless the UI truly needs a small safe DTO fragment
- `code` should be safe for client display or mapping
- `message` should never include raw provider, SQL, or internal error text
- `fieldErrors` should contain form-safe validation feedback only
- raw database rows should never be returned

## 10.2 Route Handler response

Route Handler responses should be explicit by endpoint type.

Use:

- JSON only for intentional machine-readable endpoints
- redirect only for intentional handoff flows
- file or stream response only for explicit export/file-like endpoints
- empty or small JSON response for webhooks after durable recording

Rules:

- response shape belongs to the endpoint contract, not to a convenient repository return type
- provider webhook handlers should not return UI-shaped messages
- export handlers should not return unreviewed raw dumps

## 10.3 Domain command result

Domain command results should be server-only.

They may include:

- mutated object id
- normalized status
- cache tags to invalidate
- event ids or job ids
- audit id
- safe next-route decision

Rules:

- domain command results can be richer than action results, but they should still avoid raw provider payloads unless internal and necessary
- action wrappers decide what, if anything, crosses to the client

## 11. Validation Contract

All mutations and nontrivial route handler requests must validate input at the server boundary.

Validation applies to:

- form fields
- JSON request bodies
- route params
- search params
- headers used for security or provider routing
- uploaded file metadata if uploads are added later
- callback tokens
- idempotency keys

Rules:

- validate before domain logic
- normalize values before persistence
- reject unexpected values rather than silently accepting hidden fields
- keep validation errors user-safe
- validate ownership-sensitive identifiers again in the domain layer

The final validation library can be chosen during implementation.

This contract does not require a specific library, but it does require:

- shared schema definitions where practical
- server-side validation as the source of truth
- no reliance on client-side validation alone

## 12. Authorization Contract

All sensitive reads and all mutations must resolve the actor server-side.

Actor context should include only what the domain needs, such as:

- auth user id
- app user id
- role or capability set
- active profile context, if needed
- internal admin or moderation permission, if applicable

Rules:

- layout gating is not sufficient authorization
- hidden form fields are not trusted
- route params are not proof of ownership
- object-level authorization lives in the domain service or data access layer
- RLS is defense in depth, not a reason to skip application authorization
- service-role access must be isolated to narrow server-only helpers

Examples:

- booking mutation checks the student actor and the tutor/listing state
- lesson update checks participant role and lesson state
- message send checks conversation membership and block/report constraints
- tutor profile edit checks tutor ownership or internal capability
- admin moderation action checks explicit internal permission, not only an `admin` route prefix

## 13. Idempotency And Replay Contract

Any mutation that can be retried, replayed, double-submitted, or delivered more than once must have an idempotency decision.

Use:

- natural unique constraints when the domain already has a unique business fact
- explicit operation keys when the same user intent may be retried
- provider event ids for inbound webhook replay safety
- durable job dedupe keys for async side effects
- rerunnable upsert or merge patterns for projection refreshes and repair work

High-priority idempotency review surfaces:

- booking request creation
- Stripe checkout or billing initiation
- Stripe webhook processing
- tutor application submission
- report and block actions
- data subject request submission
- notification enqueue
- reminder enqueue
- projection refresh
- export generation

Do not globally dedupe:

- message sends by text alone
- valid repeated lesson bookings that happen to look similar
- separate tutor profile edits from the same actor

The right question is:

- if the same logical intent runs twice, what must remain true?

## 14. Error Contract

Boundary errors should be boring, safe, and useful.

Expected errors should return or map to stable codes.

Examples:

- `validation_failed`
- `unauthenticated`
- `forbidden`
- `not_found`
- `conflict`
- `rate_limited`
- `operation_replayed`
- `provider_unavailable`
- `temporary_failure`

Rules:

- do not return raw SQL errors
- do not return raw provider errors
- do not expose whether a private object exists to an unauthorized actor
- page-level unauthorized access should render outwardly as `not_found` or 404 rather than a visible forbidden page
- do not log message bodies, meeting URLs, payment details, or sensitive tutor evidence
- use field errors for form correction
- use generic failure messages for security-sensitive operations
- log enough safe context to debug unexpected failures

Unexpected errors should be logged with:

- operation family
- safe actor reference or internal id where appropriate
- request or correlation id where available
- route or action identifier
- safe error category

Do not log:

- private message content
- free-text learning needs
- raw provider payloads unless restricted and explicitly required
- meeting links
- auth tokens
- signed storage URLs
- payment instrument details

## 15. Cache Revalidation And Redirect Contract

Mutations should make cache and navigation effects explicit.

Use `revalidatePath` or `revalidateTag` only when the affected data surface is understood.

Common examples:

- tutor profile edit revalidates public tutor profile path and relevant public tutor tags
- availability change revalidates booking context and tutor schedule surfaces
- booking status change revalidates student lessons, tutor lessons, booking detail, and notification surfaces
- message send revalidates conversation list and thread surfaces if those surfaces are cached
- data deletion or delisting revalidates public pages, sitemap eligibility, search projections, and metadata

Rules:

- do not rely on cache expiry for privacy or safety changes
- do not revalidate the whole app by reflex
- do not leave public tutor profile caches stale after profile visibility, review, credential, or slug changes
- redirect after success only when the user flow benefits from moving to a new route
- return an operation result when the user remains in the current interaction

## 16. Side Effects And Async Contract

The user-visible domain state should be durable before side effects are scheduled.

Synchronous work should include:

- core domain mutation
- transaction-safe state changes
- security-relevant audit records where required
- durable intent records for jobs, notifications, provider calls, or projection refresh where required

Async work should include:

- notification delivery
- reminder scheduling
- provider follow-up that can retry
- projection refresh when it is not safe or necessary inline
- export generation when it is heavy
- moderation or maintenance follow-up

Rules:

- use durable records for work that must not disappear
- do not send external side effects before the durable business decision is safely recorded
- do not hide critical user-visible state inside `after()` work
- use post-response work only for safe, short tasks where retry loss is acceptable or where a durable record already exists
- provider calls that can charge, email, notify, or change user-facing state need idempotency review

## 17. Provider Webhook Contract

Provider webhook Route Handlers must follow verify-record-dispatch.

The pattern is:

1. receive request
2. read the raw body if the provider requires it
3. verify signature with the environment-specific secret
4. parse only after verification succeeds
5. store a durable provider event record with provider event id
6. dedupe duplicate events safely
7. dispatch to a domain handler or durable job
8. return quickly

Rules:

- invalid signatures return failure and do not create business mutations
- duplicate event ids should not create duplicate side effects
- handler code should not branch into large business workflows inline
- provider event payload access should be restricted and minimized
- webhook routes must not redirect
- webhook logs must not expose secrets or sensitive payload data

Stripe-specific posture:

- Stripe remains the canonical inbound mechanism for Stripe-originated payment and payout state
- signature verification requires the raw request body
- retry behavior must be treated as normal, not exceptional

## 18. Export, File, And Calendar Route Contract

Route Handlers are appropriate for explicit file-like responses.

Approved examples:

- `GET /api/calendar/lessons/[lessonId]/ics`
- privacy export download endpoint
- future internal CSV export endpoint
- signed storage handoff endpoint, if needed

Rules:

- validate actor or signed token before returning content
- validate object ownership and participant access
- avoid exposing predictable private object ids as sufficient access
- return only the minimum file content needed
- set appropriate response headers
- make downloads short-lived where possible
- do not expose raw storage paths in client DTOs
- do not make public buckets the default for private files

Calendar-specific posture:

- public marketing pages never receive meeting access DTOs
- lesson `.ics` responses should include only participant-appropriate details
- meeting links are private participant data

## 19. Public And SEO Route Data Contract

Public pages should use Server Components and public DTOs.

Use route/domain data for:

- page rendering
- metadata
- JSON-LD
- sitemap eligibility
- noindex decisions

Rules:

- do not create separate API endpoints just to feed `generateMetadata`
- public metadata must use public DTOs or narrower metadata DTOs
- public tutor profile data must respect listing visibility, moderation, and quality gates
- no private availability, meeting, student, message, or billing data appears in public DTOs
- public search can later export from public-safe projections if an external search provider is adopted

## 20. Data Subject Request Boundary Contract

Privacy and data subject request flows need explicit boundaries.

Use:

- Server Action for authenticated request creation
- Server Action for authenticated status acknowledgement or account settings updates
- internal Server Action for admin workflow state changes
- Route Handler for secure export download
- durable jobs for heavy export generation or provider follow-up

Rules:

- request submission creates a restricted durable workflow record
- request status and export access are identity-verified
- export responses are DTO-safe and reviewed, not raw table dumps
- export files are private and short-lived
- deletion or correction flows must invalidate public exposure and projections where relevant
- legal wording and exact deadline commitments remain policy/legal review tasks

## 21. Rate Limit And Abuse Contract

Public and authenticated write paths that can be abused require an abuse decision.

High-priority surfaces:

- magic link and auth-related flows, where application-level controls apply
- booking requests
- message sends
- report and block actions
- tutor application submissions
- profile/contact forms
- privacy request submissions
- support forms
- webhook routes, using provider/security posture
- export download attempts

Rules:

- rate limit by actor where possible
- rate limit by IP or fingerprint only where appropriate and privacy-reviewed
- use product-specific rules in addition to platform protections for high-risk mutations
- do not reveal sensitive object existence through rate-limit or error responses

## 22. Observability Contract

Boundary observability should help future agents debug without creating privacy risk.

For Server Actions and Route Handlers, record safe signals such as:

- operation family
- boundary type
- route or action identifier
- success/failure category
- safe actor id where appropriate
- correlation id where available
- provider event id for webhooks
- job id or dedupe key for async work
- latency bucket for hot paths

Do not record:

- message bodies
- free-text learning needs
- meeting links
- raw signed URLs
- raw provider payloads in general application logs
- auth tokens
- payment instrument details

Durable status records should exist for:

- provider webhooks
- jobs and notifications
- projection refreshes
- export generation
- data subject requests
- high-risk admin or moderation actions

## 23. Testing Contract

Boundary tests should match the risk of the operation.

Use application-level tests for:

- Server Action validation and result mapping
- domain command authorization
- route handler method, auth, and response behavior
- cache invalidation expectations where practical
- redirect behavior in critical flows

Use database-level tests for:

- RLS access
- constraints and uniqueness
- projection integrity
- SQL functions and trigger boundaries
- migration safety

Use integration tests for:

- webhook signature and idempotency behavior
- booking request flow
- message participant access
- privacy export access
- tutor public profile visibility after moderation or deletion

Testing rules:

- every new mutation boundary must name its auth, validation, idempotency, and observability tests or explain why a test is not needed
- webhook routes need duplicate-delivery coverage
- public DTO changes need exposure tests
- participant-scoped DTO changes need denied-access tests
- privacy export/download routes need unauthorized-access tests

## 24. Contract Families By Domain

## 24.1 Auth and role setup

Default boundary:

- Supabase Auth for identity
- Server Action for role selection and app profile bootstrap
- Route Handler for auth callback where the auth provider flow requires it

Rules:

- if auth identity exists and app profile does not, route to setup
- role choice creates app-level profile/capability state
- auth callback does not perform broad product onboarding logic

## 24.2 Tutor profile and application

Default boundary:

- Server Components for profile/editor reads
- Server Actions for edits, draft saves, and submissions
- internal Server Actions for review decisions

Rules:

- public profile DTOs are separate from tutor editor DTOs
- credentials/evidence stay private unless explicitly approved for public display
- public cache invalidation happens when public profile fields or visibility change

## 24.3 Matching and search

Default boundary:

- Server Components and domain services for guided matching results
- Server Components and public DTOs for public search
- no Route Handler for ordinary in-app search unless a future external client requires it

Rules:

- matching remains internal and projection-aware
- public search uses public-safe projections only
- result freshness and scoring version should be explicit where cached

## 24.4 Booking and lessons

Default boundary:

- Server Components for booking context and lesson views
- Server Actions for booking request, reschedule, cancellation, and status changes
- Route Handler for calendar `.ics`

Rules:

- participant access is checked in domain services
- meeting links are participant-private
- booking transitions need idempotency and audit review

## 24.5 Messages

Default boundary:

- Server Components for conversation list and thread read models
- Server Actions for send, reaction, block, report, and read state
- Realtime for live delivery where approved by the message architecture

Rules:

- message body is never logged
- participant access is checked before thread DTO return
- duplicate text alone is not an idempotency key
- report/block actions need durable audit and abuse handling

## 24.6 Schedule and availability

Default boundary:

- Server Components for tutor schedule and booking availability reads
- Server Actions for schedule policy and availability rule edits

Rules:

- timezone normalization follows canonical data docs
- changes invalidate affected booking and schedule surfaces
- public availability summaries must remain public-safe

## 24.7 Billing and provider callbacks

Default boundary:

- Server Actions for user-initiated billing flows, if applicable
- Route Handlers for Stripe webhooks
- domain services for payment, payout, and entitlement state

Rules:

- Stripe owns sensitive payment method details
- app DTOs expose only operational summaries
- webhook events are verified, recorded, deduped, and dispatched

## 24.8 Notifications and jobs

Default boundary:

- Server Actions or domain services create durable notification/job intent
- jobs deliver or process later
- Route Handlers only for provider callbacks or explicit job-related endpoints if later needed

Rules:

- notification delivery is not the source of truth for domain state
- retryable work needs dedupe
- failed jobs need durable status and observability

## 24.9 Privacy and data subject requests

Default boundary:

- Server Actions for request submission and admin handling
- Route Handlers for secure export download
- durable jobs for heavy export/provider follow-up

Rules:

- export is restricted, scoped, and short-lived
- deletion workflow is hold-aware
- public exposure is removed early when applicable

## 24.10 Admin internal operations

Default boundary:

- Server Components for internal review screens
- Server Actions for internal review decisions
- no generic admin API by default

Rules:

- MVP uses only the `admin` role for internal operations
- internal capabilities still stay scoped by action family
- internal DTOs are still scoped
- sensitive actions require durable audit records

## 25. Anti-Patterns To Avoid

Avoid:

- creating `/api/*` endpoints for every page query
- creating a generic internal REST or GraphQL layer in phase 1
- letting Client Components fetch sensitive app data directly
- returning Drizzle rows from Server Actions
- passing provider payloads into UI DTOs
- putting complex business workflows inside route handlers
- treating layouts as sufficient authorization
- trusting hidden form fields for ownership or role
- relying on client-side validation as the only validation
- using cache expiry as privacy enforcement
- calling provider APIs before durable app state is recorded
- creating Supabase Edge Functions by reflex when Next.js route handlers fit
- duplicating one domain mutation across both a Server Action and a Route Handler without a single shared domain command

## 26. AI-Agent Implementation Rules

Future AI agents should:

- classify every new boundary as Server Component read, Server Action, Route Handler, domain service, repository, job, or provider webhook
- prefer Server Components/domain services for page reads
- prefer Server Actions for in-app UI mutations
- reserve Route Handlers for explicit HTTP endpoint needs
- validate all mutation input server-side
- resolve actor context server-side
- call domain services rather than putting business logic in route files
- return DTO-safe shapes only
- make idempotency decisions explicit for retryable operations
- make cache revalidation explicit after mutations that affect rendered data
- add or explain tests for auth, validation, idempotency, DTO exposure, and webhook handling
- update this doc when a new boundary family is intentionally introduced

Agents should not:

- build a new internal API layer because it feels familiar
- bypass domain services from a route file
- return raw rows to a Client Component
- expose public data from private tables without public DTO review
- create a Route Handler for a page-only read
- create a second mutation path with different auth rules
- log private content for debugging
- use Supabase service-role access in broad route code
- treat Realtime, RLS, or layout checks as substitutes for domain authorization

## 27. Decisions To Lock Now

The system should lock the following decisions now:

- ordinary in-app page data does not need an internal REST or GraphQL API in phase 1
- Server Actions are the default UI mutation boundary
- Route Handlers are reserved for provider callbacks, auth callbacks, export/file endpoints, and intentionally public machine-readable endpoints
- domain services own authorization, business rules, DTO shaping, and side-effect decisions
- repositories own database access and transactions
- all mutation boundaries validate input and resolve actor context server-side
- retryable operations need explicit idempotency review
- cache revalidation is part of the mutation contract
- webhooks follow verify-record-dispatch
- privacy exports are secure download endpoints, not raw data dumps

## 28. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 29. Final Recommendation

Mentor IB should keep the backend boundary intentionally simple for the MVP:

- reads through Server Components and domain services
- UI mutations through Server Actions
- external callbacks and file-like responses through Route Handlers
- database work through repositories
- business rules through domain services

That gives future AI agents a clear path through the app without creating two backend worlds, while still leaving room for a real external API later if the product actually needs one.

## 30. Official Source Notes

This architecture was checked against current official docs for the relevant platform behaviors:

- Next.js Server Actions and forms: `https://nextjs.org/docs/app/guides/forms`
- Next.js `use server` directive: `https://nextjs.org/docs/app/api-reference/directives/use-server`
- Next.js Route Handlers: `https://nextjs.org/docs/app/api-reference/file-conventions/route`
- Next.js authentication and authorization guide: `https://nextjs.org/docs/app/guides/authentication`
- Next.js data security guide: `https://nextjs.org/docs/app/guides/data-security`
- Next.js `after`: `https://nextjs.org/docs/app/api-reference/functions/after`
- Next.js `revalidatePath`: `https://nextjs.org/docs/app/api-reference/functions/revalidatePath`
- Next.js `revalidateTag`: `https://nextjs.org/docs/app/api-reference/functions/revalidateTag`
- Supabase securing your API: `https://supabase.com/docs/guides/api/securing-your-api`
- Supabase hardening the Data API: `https://supabase.com/docs/guides/database/hardening-data-api`
- Stripe webhooks: `https://docs.stripe.com/webhooks`
