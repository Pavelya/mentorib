# Mentor IB Background Jobs And Notifications Architecture v1

**Date:** 2026-04-08
**Status:** Standalone async-execution and notifications architecture for the shared application stack
**Scope:** domain events, notification channels, job execution boundaries, scheduling posture, retries, idempotency, webhooks, and operational rules for asynchronous work

## 1. Why This Document Exists

This document defines how Mentor IB should handle work that should not always happen inside the original request-response cycle.

It exists now because the approved product already implies the need for:

- in-app notifications
- transactional email notifications
- lesson reminders
- unread and message-driven alerts
- tutor application status updates
- moderation follow-up actions
- billing and payout reconciliation work later

Without an explicit architecture, asynchronous work usually becomes:

- scattered across route handlers
- inconsistent in retry behavior
- hard for AI-driven implementation to reason about safely
- vulnerable to duplicate sends or silent failures

## 2. What This Document Does Not Redefine

This document does not replace the approved core, security, privacy, messaging, or moderation architecture.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`

It does not define:

- final notification copy or email templates
- final notification UI screens
- final operational staffing
- final analytics dashboard design

Those can come later as implementation or operations artifacts.

## 3. Core Recommendation

Mentor IB should use one internal asynchronous-work architecture built around:

- domain-owned trigger events
- explicit notification objects
- explicit background job objects
- short post-response work only where safe
- durable persisted jobs for anything retryable, delayed, or externally dependent

The practical rule is:

- keep user-visible domain state changes synchronous
- move non-blocking side effects behind an explicit async boundary
- persist durable work before depending on retries
- treat notifications as product objects, not direct UI side effects
- keep the MVP on minimal tools and avoid introducing a separate workflow platform on day one

## 4. Architecture Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means async behavior should be:

- explicit
- stateful
- idempotent
- retry-aware
- channel-aware

The architecture should not rely on:

- humans remembering which handler also sends an email
- implicit fire-and-forget behavior
- ad hoc cron endpoints with undocumented meaning
- duplicated side-effect logic across multiple routes

## 5. Goals

The background-jobs and notifications architecture should:

- keep interactive requests fast
- preserve reliable execution for important follow-up work
- avoid duplicate notifications
- keep channel logic reusable across student and tutor flows
- support future growth without forcing a larger platform too early
- remain understandable and safe for AI-driven implementation

## 6. Async Boundary Model

Not all work belongs in the same execution lane.

Mentor IB should distinguish between five lanes.

## 6.1 Lane A: synchronous domain work

This is the work that must complete before the user-facing mutation is considered successful.

Examples:

- creating a booking record
- saving a message
- updating tutor application status
- persisting a block or report action

Rule:

- if the user would reasonably expect the mutation itself to exist immediately, it belongs here

## 6.2 Lane B: short post-response work

This is small non-blocking work that can happen immediately after the response completes.

Examples:

- lightweight audit logging
- lightweight event recording
- enqueueing follow-up work that has already been made durable

Recommended mechanism:

- `after()` in Next.js for short post-response work only

Rule:

- Lane B may improve latency, but it is not the place for long-running or business-critical work unless the durable state has already been recorded

## 6.3 Lane C: durable deferred jobs

This is work that may fail, retry, or run later and therefore must be explicitly persisted.

Examples:

- sending transactional emails
- generating reminder notifications
- retrying external-provider calls
- reconciliation and cleanup work

Rule:

- if the work needs retries, scheduling, backoff, or external dependency handling, it belongs here

## 6.4 Lane D: scheduled scans and reminder generation

This is time-based work triggered on a schedule.

Examples:

- lesson reminder generation
- digest generation later
- retry sweeps for stuck jobs
- deindexing or cleanup follow-up later if needed

Rule:

- scheduled work should run through the same jobs boundary, not as a second independent system

## 6.5 Lane E: external inbound events

This is work triggered by external providers.

Examples:

- Stripe webhook events
- email-provider delivery events later

Rule:

- inbound provider events should be verified, recorded, and translated into internal jobs or domain actions

## 7. Event Architecture

## 7.1 Domain events are internal contracts

Mentor IB should use explicit domain events to describe that something meaningful happened in the product.

Examples:

- `tutor_application_submitted`
- `tutor_application_reviewed`
- `lesson_booked`
- `lesson_cancelled`
- `lesson_issue_reported`
- `lesson_issue_resolved`
- `message_created`
- `user_blocked`
- `report_created`
- `payment_checkout_completed`

## 7.2 No full event-sourcing requirement

The architecture does not require the product to become event-sourced.

The canonical state still lives in ordinary relational domain tables.

The event layer exists to:

- trigger async work predictably
- support notifications
- support observability
- reduce duplicated side-effect logic

## 7.3 Event envelope rule

Every important emitted event should carry a consistent envelope shape.

At a minimum, the architecture should support:

- event type
- occurred at
- aggregate type
- aggregate id
- actor id if known
- event version
- idempotency key or unique event id

## 7.4 Event ownership rule

Events should be emitted by domain modules, not by generic UI components.

The UI may trigger a mutation, but the domain layer decides whether a business event occurred.

## 8. Notification Architecture

## 8.1 Notifications are product objects

A notification is not just an email and not just a badge.

It is a product object that represents:

- who should know
- what happened
- why it matters
- which channels should be used

## 8.2 Recommended notification object families

The architecture should support at least:

- `Notification`
- `NotificationDelivery`
- `NotificationPreference` later if needed

The exact schema can vary, but the separation should exist.

## 8.3 Canonical user-facing channel rule

In-app notification state should be the canonical user-facing record for product notifications.

Email and future push delivery are channel-specific delivery outcomes, not the canonical notification itself.

## 8.4 MVP channels

The recommended MVP notification channels are:

- in-app
- email

Later channels can include:

- browser push
- native mobile push

## 8.5 MVP notification families

Phase 1 should focus on a small set of high-signal product notifications:

- new message in-app alert only
- lesson request submitted
- lesson accepted and payment captured
- lesson declined and payment authorization released
- lesson auto-cancelled on expiry and payment authorization released
- lesson cancelled or rescheduled update
- lesson issue reported acknowledgement
- lesson issue resolution update
- upcoming lesson reminder
- review submitted
- tutor application submitted confirmation
- tutor application changes requested, approved, or rejected update
- payout processed
- terms or privacy update

Channel rule for MVP:

- new chat-message alerts stay in-app only
- lesson lifecycle, tutor application, payout, and legal notices send both in-app and email
- terms or privacy updates also trigger a visible post-login notice so the update is not hidden only inside the bell surface

## 8.6 Auth-email exception

Supabase Auth emails such as magic links are provider-managed auth flows.

They are not part of the product notification module and should not be mixed into the same notification object model.

## 8.7 Notification preference posture

Do not start with a complex preference center.

Use a simple product rule:

- required transactional notifications send by policy
- optional engagement notifications can arrive later as a separate preference layer

## 8.8 Branded email-template rule

Mentor IB transactional emails should use a branded template system that derives from the main design language without trying to mirror the app pixel-for-pixel.

Required traits:

- Mentor IB brand name, typography direction, and color family stay recognizable
- layouts stay email-safe and conservative
- primary CTA is singular and obvious
- legal, payout, and booking emails link back to authenticated product surfaces for detail
- message-body notifications should not send full chat content by email in MVP

## 8.9 Legal-update visibility rule

When terms or privacy content is updated, the system should:

- create an in-app notification
- send the required transactional email
- show a visible notice after the next login

Default MVP behavior:

- show a post-login modal or top-level blocking notice until the user opens the latest policy update
- keep the legal update available later in Notifications

If a future policy version explicitly requires acknowledgement, the product can escalate this into a stronger acknowledgement gate.

## 9. Background Job Architecture

## 9.1 Jobs are durable product infrastructure objects

If a unit of async work needs durable retry behavior, it should be represented as an explicit job record.

## 9.2 Recommended job object families

The architecture should support at least:

- `Job`
- `JobAttempt`

Optional later objects can include:

- `JobSchedule`
- `DeadLetterRecord`

## 9.3 Recommended job status model

The durable job lifecycle should support a clear status model such as:

- pending
- running
- succeeded
- failed_retryable
- failed_terminal
- cancelled

The exact names can vary, but the distinction should exist.

## 9.4 Job kind rule

Every durable job should belong to an explicit job kind.

Examples:

- `send_transactional_email`
- `create_lesson_reminder_notifications`
- `process_provider_webhook_event`
- `retry_notification_delivery`
- `run_reconciliation_sweep`

## 9.5 Idempotency rule

Jobs must be safe against duplicate enqueue or duplicate execution.

The architecture should assume:

- duplicate user submissions can happen
- duplicate webhook deliveries can happen
- retries can happen after partial success

## 9.6 Job payload rule

Job payloads should be small, explicit, and versionable.

Prefer storing stable identifiers and looking up current domain state when safe over embedding large mutable snapshots.

If the business action depends on a historical snapshot, record that snapshot intentionally.

## 9.7 Failure rule

A job failure should never disappear silently.

The system should retain:

- the current job status
- the last error class or reason
- attempt count
- next retry time if retryable

## 10. Scheduling Architecture

## 10.1 Scheduling principle

Time-based work should be separated into:

- schedule calculation
- durable job creation
- job execution

Do not bury reminder timing logic inside ad hoc handlers.

## 10.2 Recommended MVP scheduler

For MVP, use `Vercel Cron Jobs` to trigger internal scheduled runners.

This fits the current stack and keeps the tool count low.

## 10.3 Cron runner rule

Cron endpoints should not directly contain business logic.

They should:

- authenticate the trigger source as needed
- call a small internal runner
- claim due work
- dispatch through the shared jobs boundary

## 10.4 Timezone rule

Vercel cron schedules run in UTC.

User-facing reminder timing should therefore be computed from stored lesson and user timezone context into UTC-based due times.

## 10.5 Reminder rule

Do not rely on one cron expression per user or lesson.

Instead:

- store due reminder times in durable state
- let scheduled runners claim due records in batches

This is simpler and scales better.

## 11. Execution Model And Tooling Choice

## 11.1 Recommended MVP execution model

The recommended MVP stack is:

- synchronous domain mutations in the app
- `after()` for small post-response work
- Postgres-backed durable jobs
- Vercel Cron Jobs for scheduled triggering
- transactional email provider API for sends

## 11.2 Why this is the default

This keeps the architecture:

- minimal
- explicit
- durable where needed
- compatible with the approved Vercel and Supabase stack

## 11.3 Why not start with a separate workflow platform

Mentor IB does not need a second orchestration platform on day one for:

- simple reminders
- notification sends
- small reconciliation tasks

Starting with a dedicated queue or workflow platform too early would add:

- another operational surface
- another failure mode
- more architecture for AI agents to navigate

## 11.4 Future upgrade path

If async complexity grows materially later, the clean upgrade paths are:

- Vercel Queues for more durable queue semantics
- Vercel Workflow for long-running multi-step orchestration

Those should remain optional later layers, not day-one architectural dependencies.

## 12. Webhook-To-Job Architecture

## 12.1 Core inbound-event rule

External webhook handlers should do only enough work to:

- verify
- parse
- record
- dispatch

## 12.2 Translation rule

Webhook events should be translated into internal domain events or durable jobs.

Do not spread provider-specific branching throughout unrelated modules.

## 12.3 Stripe posture

Stripe webhooks should remain the canonical inbound mechanism for payment and payout state changes that originate outside the direct request-response cycle.

Webhook verification and idempotency rules are inherited from the security architecture.

## 13. Security And Privacy Boundaries

## 13.1 Security inheritance rule

This architecture inherits the approved security rules for:

- webhook verification
- secrets handling
- rate limiting
- logging
- storage access

## 13.2 Privacy inheritance rule

Notification and job payloads should respect the approved privacy and retention model.

Do not copy more personal data into:

- jobs
- logs
- notification payloads
- provider metadata

than the feature actually requires.

## 13.3 Email-content rule

Transactional emails should avoid unnecessary sensitive detail.

Especially for student-related flows, email content should be conservative and link users back into authenticated product surfaces for detail when appropriate.

They should also reuse the approved branded email template system rather than one-off provider HTML.

## 14. Observability Architecture For Async Work

## 14.1 Core observability rule

Async work is not operationally real unless it can be inspected.

The architecture should support visibility into:

- queued job volume
- retry volume
- terminal failures
- notification send success and failure
- reminder generation health
- webhook ingest success and failure

## 14.2 Minimal MVP observability expectation

Even in MVP, the system should provide enough operational visibility to answer:

- was the job created
- was the job attempted
- did the notification send
- did the provider reject it
- is the work stuck or merely delayed

## 14.3 Audit boundary

User-visible notification events and privileged moderation-triggered actions should be traceable without exposing unnecessary private content in logs.

## 15. Recommended Phase Scope

## 15.1 Phase 1

Phase 1 should support:

- in-app notification records
- transactional email sends
- durable notification-delivery tracking
- reminder generation through scheduled runners
- async handling for provider-driven payment events
- explicit job retry behavior

## 15.2 Phase 1.5

Good candidates for the next wave:

- richer notification preferences
- typing or presence-adjacent notification tuning
- digest-style notifications
- improved operational dashboards for jobs and deliveries

## 15.3 Phase 2

Consider later:

- browser push notifications
- native mobile push notifications
- durable external queue adoption if needed
- multi-step workflow orchestration if product complexity justifies it

## 16. Decisions To Lock Now

The architecture should lock the following decisions now:

- notifications are a domain module
- in-app notification state is canonical for product notifications
- auth emails are provider-managed and separate
- durable async work uses persisted job records
- scheduled work uses Vercel Cron Jobs in MVP
- short post-response work may use `after()` only when safe
- external provider events are recorded and dispatched through the same shared async boundary

## 17. Final Recommendation

Mentor IB should implement notifications and background work as one explicit internal platform layer inside the application, not as scattered side effects.

The recommended MVP architecture is:

- domain events as internal triggers
- `Notification` and `NotificationDelivery` as product objects
- `Job` and `JobAttempt` as durable async infrastructure objects
- `after()` for short post-response work
- Vercel Cron Jobs for scheduled runners
- email delivery through a transactional provider
- webhook ingestion that verifies, records, and dispatches

This keeps the product aligned with the minimal-tools principle while still giving the team a reliable path for reminders, alerts, and future automation.

## 18. Official Source Notes

The recommendation above is informed by current official documentation for:

- Next.js `after()`: `https://nextjs.org/docs/app/api-reference/functions/after`
- Vercel Cron Jobs: `https://vercel.com/docs/cron-jobs`
- Vercel cron management and `CRON_SECRET`: `https://vercel.com/docs/cron-jobs/manage-cron-jobs`
- Vercel function configuration and duration: `https://vercel.com/docs/functions/configuring-functions`
- Vercel Queues: `https://vercel.com/docs/queues`
- Vercel Workflow: `https://vercel.com/docs/workflow/`
- Resend email sending API: `https://resend.com/docs/api-reference/emails`
- Stripe webhooks: `https://docs.stripe.com/webhooks`
