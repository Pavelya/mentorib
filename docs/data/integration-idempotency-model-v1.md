# Mentor IB Integration Idempotency Model v1

**Date:** 2026-04-08
**Status:** Standalone data-layer contract for idempotent execution across requests, jobs, webhooks, provider calls, and repeatable database mutations
**Scope:** definition of idempotency, operation families that require it, canonical key types, uniqueness and replay rules, retry-safe patterns, and AI-agent-safe implementation boundaries

## 1. Why This Document Exists

Mentor IB already approved:

- SQL-first migrations
- a durable jobs and notifications architecture
- webhook verification and recording
- a shared modular-monolith data layer
- explicit projection refresh rules

What was still missing was the actual model for making repeated execution safe.

Without an explicit idempotency contract, teams usually drift into:

- duplicate payment or booking side effects
- duplicate webhook handling
- retry loops that resend emails or notifications
- repeated projection refreshes that behave differently each time
- AI agents deduping the wrong actions and not deduping the dangerous ones

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because safe repeated execution depends on durable data boundaries:

- unique constraints
- stable operation keys
- durable webhook records
- durable job state
- repeatable write patterns

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/migration-conventions-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/database-test-conventions-v1.md`
- `docs/data/drizzle-schema-and-query-conventions-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`

It also inherits constraints from:

- `docs/architecture/background-jobs-and-notifications-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/observability-and-incident-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- business-state ownership
- webhook security verification
- the async job model
- the schema outline
- the migration contract

It does not define:

- the final exact table or column names for every future idempotency helper
- the exact retry schedule of each job kind
- the final provider-specific SDK wrappers

Those can come later.

## 4. Core Recommendation

Mentor IB should use a **durable idempotency model** based on:

1. natural unique business boundaries where they already exist
2. explicit operation keys where the same user intent may be retried
3. provider event identifiers for inbound webhook replay safety
4. dedupe keys for durable jobs and side effects
5. rerunnable SQL patterns for projections and repair work

The main rule is:

- every operation that can be retried or replayed must either be safely repeatable by design or carry a durable dedupe boundary

## 5. What Idempotency Means Here

In this project, idempotency means:

- repeating the same logical operation should not create unsafe duplicate side effects

It does **not** mean:

- every repeated request becomes a no-op
- every operation should reject repeated intent
- every duplicate-looking action is accidental

The key question is:

- if the exact same logical intent is replayed, what must remain true?

## 5.1 Safe same-outcome rule

The expected result of a replayed operation should be:

- the same durable business outcome
- or a clean recognized replay of that same outcome

## 5.2 Important nuance

Some actions should be idempotent.

Examples:

- create Stripe checkout for one intended payment
- process one Stripe webhook event
- enqueue one reminder job for one scheduled reminder window

Some actions should **not** be blindly deduped because repeated intent can be valid.

Examples:

- sending the same message text twice
- creating two different lessons that happen to look similar

## 6. Canonical Operation Families

## 6.1 Client-initiated mutation replay

This covers:

- repeated form submissions
- page refresh during mutation
- browser retry after timeout
- user double-clicks

These operations often need explicit operation keys or strong natural uniqueness boundaries.

## 6.2 Inbound provider event replay

This covers:

- duplicate Stripe webhook deliveries
- provider resend behavior after timeout or 5xx responses

These operations must use provider event identifiers and durable receive records.

## 6.3 Background job replay

This covers:

- duplicate enqueue
- retry after failure
- retry after partial success
- scheduler overlap

These operations need durable job state and dedupe rules.

## 6.4 Outbound provider request replay

This covers:

- retrying calls to Stripe or other providers
- app-level retry after network ambiguity

These operations should use provider-supported idempotency keys where available.

## 6.5 Projection and repair replay

This covers:

- repeat projection refresh
- rebuild after interruption
- replayed maintenance job

These operations should use deterministic upsert-style SQL and not rely on "run once only" assumptions.

## 7. Canonical Idempotency Key Families

Mentor IB should use a small number of explicit key families.

## 7.1 Natural business uniqueness

Use natural uniqueness first when the business model already defines it.

Examples:

- one `user_roles` row per user-role capability
- one tutor profile slug per listed tutor
- one provider event id per provider event

## 7.2 Client operation key

Use a request or operation key when one logical user intent may be retried and duplicate execution would be harmful.

Examples:

- create one checkout session for one payment intent
- submit one tutor application finalization request
- create one booking confirmation action for one booking attempt

## 7.3 Provider event key

Use the provider's event identifier as the canonical dedupe key for inbound event processing.

Examples:

- `provider = stripe`
- `provider_event_id = evt_...`

## 7.4 Job dedupe key

Use a dedupe key for durable jobs when duplicate enqueue or replay should collapse to one logical job outcome.

Examples:

- one reminder-generation job per lesson and reminder window
- one notification-delivery retry job per delivery object and attempt boundary

## 7.5 Derived side-effect key

Use a stable derived key when a side effect should happen once per aggregate event and recipient.

Examples:

- one in-app notification for one event-recipient-type tuple
- one email delivery record per notification-channel-recipient tuple

## 8. Canonical Implementation Patterns

## 8.1 Pattern A: unique constraint plus upsert

Use this when the business row itself is the durable dedupe boundary.

Good for:

- reference data
- projection refresh rows
- provider event receipt rows
- relationship rows with one clear uniqueness rule

## 8.2 Pattern B: explicit operation record

Use this when the request intent is not the same thing as the final business row and needs its own replay contract.

Good for:

- checkout or payment creation attempts
- externally retried workflow steps
- client-request replay where the business action spans multiple tables

## 8.3 Pattern C: verify, record, dispatch

Use this for inbound webhooks:

1. verify authenticity
2. record the event with its provider key
3. decide whether it is new, duplicate, or irrelevant
4. dispatch safely into domain or job handling

## 8.4 Pattern D: rerunnable projection mutation

Use deterministic recompute plus `insert ... on conflict do update` for projection refresh and rebuild work.

## 8.5 Pattern E: selective locking

If plain uniqueness and state checks are not enough for a specific hot operation, transaction-scoped advisory locks may be used sparingly for narrow aggregate-level contention.

This is an exception tool, not the default answer.

## 9. Operation-Specific Rules For Mentor IB

## 9.1 Auth account resolution

The system must not create duplicate canonical users for the same verified person.

The main idempotency boundaries are:

- one canonical `app_user` per resolved auth identity
- one role capability row per user-role pair where applicable

Repeated callback completion or repeated post-auth resolution should converge on the same canonical user state.

## 9.2 Booking and lesson confirmation

Booking-related writes are sensitive because duplicate execution can:

- create duplicate lessons
- trigger duplicate notifications
- create duplicate payment side effects

If one logical booking-confirmation intent can be retried, it should have either:

- a strong natural uniqueness boundary
- or an explicit operation key

## 9.3 Stripe payment creation

Outbound Stripe create/update requests that represent one logical payment intent should use Stripe idempotency keys.

The local system should also tie the intent to durable application records so provider replay safety and local replay safety reinforce each other.

## 9.4 Stripe webhook handling

Stripe webhooks must:

- verify signature
- record event receipt durably
- dedupe by provider event id
- treat duplicate deliveries as safe replay, not as a new mutation

## 9.5 Messaging

Messaging needs nuance.

The default rule should be:

- do not dedupe ordinary message sends only by body text or timing

Why:

- users may intentionally send the same text twice

However, surrounding side effects may still need idempotency.

Examples:

- unread-state updates
- conversation summary refresh
- notification creation tied to one message id

## 9.6 Block and report actions

These operations are closer to one-time state changes than free-form content sends.

They should usually have natural or explicit dedupe boundaries so the same action replay does not create uncontrolled duplicates.

## 9.7 Notifications and deliveries

Notification creation and notification delivery are separate idempotency surfaces.

Recommended posture:

- one canonical notification per event-recipient-intent where product semantics say "inform once"
- separate delivery attempts tracked under that notification
- retryable delivery should not create duplicate canonical notifications

## 9.8 Background jobs

Durable jobs must be safe against:

- duplicate enqueue
- duplicate pickup
- retry after partial success

The system should be able to answer:

- is this the same logical job?
- is it already completed?
- is retry allowed?

## 9.9 Projection refresh and rebuild

Projection refreshes must be repeatable.

The same refresh running twice should converge on the same projection state, not append duplicate rows or drift.

## 10. Payload Consistency Rule

An idempotency key is only meaningful if the replayed operation still represents the same logical intent.

Therefore:

- the same key reused with materially different payload semantics should be treated as invalid or suspicious

Do not silently let one key mean two different operations.

## 11. Data Model Requirements

The data layer should support idempotency through a combination of:

- unique constraints
- provider event receipt rows
- durable job state
- operation records where needed
- replay-safe write patterns

## 11.1 Existing approved support surfaces

The approved schema already points to some of the right carriers:

- `webhook_events`
- `job_runs`
- projection tables with upsert-friendly identities

## 11.2 Future optional support surface

If client-operation replay becomes important across multiple domains, the schema may later add a dedicated operation-record family for request idempotency.

This document does not force that table now, but it explicitly allows it as a clean next step.

## 12. Retry And Failure Semantics

## 12.1 Main rule

Retryable operations must record enough state to distinguish:

- never started
- started but not finished
- safely completed
- failed and retryable
- failed and terminal

## 12.2 Ambiguous external result rule

If a provider call times out or returns an ambiguous failure, the retry path must assume the first attempt may have partially succeeded.

That is exactly where outbound idempotency keys matter.

## 12.3 Duplicate inbound event rule

Duplicate inbound webhooks should normally become:

- a recorded duplicate
- an `ignored` or equivalent processing result
- no duplicate business mutation

## 13. Observability Rule

Idempotency handling should be observable.

The system should be able to inspect:

- the dedupe key or event id
- whether the operation was first-seen or replayed
- the final processing result
- retry count where relevant

This is especially important for:

- webhooks
- notifications
- payments
- jobs

## 14. Anti-Patterns To Avoid

Do not:

- dedupe by human-facing text labels
- treat ordinary message text equality as a universal replay key
- process webhooks inline with no durable event record
- rely on in-memory dedupe only
- assume retries never happen
- reuse one idempotency key for different payload intents
- solve every contention problem with advisory locks first

## 15. AI-Agent Implementation Rules

Future AI agents should:

- identify the real logical operation before choosing an idempotency boundary
- prefer natural uniqueness when it already exists
- add explicit operation keys when replay would be harmful
- use provider event ids for inbound webhook dedupe
- use provider-supported idempotency keys for outbound provider requests
- keep projection and repair SQL rerunnable
- make replay outcomes inspectable in durable state

Agents should not:

- add dedupe behavior to actions where repeated intent can be legitimate
- hide idempotency logic only in route-local memory
- create duplicate side-effect paths around the same business mutation
- treat idempotency as a payment-only concern

## 16. Decisions To Lock Now

The system should lock the following decisions now:

- idempotency is required across requests, jobs, provider events, and projection refreshes
- inbound webhooks must use verify-record-dispatch handling
- outbound Stripe operations representing one logical intent should use Stripe idempotency keys
- projection refreshes must be rerunnable and upsert-friendly
- message sends are not globally deduped by text
- duplicate side effects must be prevented through durable boundaries, not memory-only tricks

## 17. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 18. Final Recommendation

Mentor IB should treat idempotency as a shared system contract, not as an ad hoc payment trick.

The clean phase 1 model is:

- natural uniqueness where possible
- explicit operation keys where needed
- provider event ids for inbound replay
- provider idempotency keys for outbound replay
- durable job dedupe
- rerunnable SQL for projections and repairs

That gives the product a much safer foundation for retries, duplicate deliveries, user resubmits, and AI-driven implementation than route-local guesswork ever could.

## 19. Official Source Notes

The guidance above is aligned with current official documentation for:

- Stripe API idempotent requests: `https://docs.stripe.com/api`
- Stripe API v2 idempotency overview: `https://docs.stripe.com/api-v2-overview`
- Stripe webhook delivery behavior: `https://docs.stripe.com/workbench/webhooks`
- Stripe event destinations and webhook integrations: `https://docs.stripe.com/event-destinations`
- PostgreSQL `INSERT ... ON CONFLICT`: `https://www.postgresql.org/docs/current/sql-insert.html`
- PostgreSQL advisory locks: `https://www.postgresql.org/docs/current/explicit-locking.html`
