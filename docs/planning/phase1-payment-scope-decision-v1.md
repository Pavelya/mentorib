# Mentor IB Phase 1 Payment Scope Decision v1

**Date:** 2026-04-13
**Status:** Locked product decision — Phase 1 includes real payment
**Scope:** payment authorization and capture in Phase 1 booking, Stripe Connect quick onboarding for tutors, and the payment-bearing booking lifecycle

## 1. Decision

Phase 1 includes real payment.

Booking requests create a Stripe payment authorization. Tutor acceptance captures the payment. Decline or expiry releases the authorization.

This is not a stub or placeholder. Phase 1 ships a payment-bearing booking flow.

## 2. Why This Decision Matters

Without this explicit decision, the Phase 1 task pack and the architecture docs could be interpreted as either:

- Phase 1 with payment (architecture docs assume this)
- Phase 1 without payment (task pack was previously ambiguous)

This document locks the first interpretation and aligns the backlog accordingly.

## 3. Payment Flow Summary

### 3.1 Booking request

1. Student selects tutor, time slot, and lesson context
2. Student is redirected to Stripe Checkout in authorization-only mode
3. Stripe creates a payment intent with `capture_method: manual`
4. On successful authorization, student returns to Mentor IB
5. Booking request is created with `payment_status: authorized`

### 3.2 Tutor acceptance

1. Tutor reviews the booking request
2. Tutor accepts
3. System captures the authorized payment via Stripe API
4. Lesson moves to `accepted` → `upcoming`
5. Payment moves to `paid`
6. Earning record created as `projected`

### 3.3 Tutor decline

1. Tutor declines the booking request
2. System releases the authorization via Stripe API
3. Lesson moves to `declined`
4. Payment moves to `cancelled`
5. Student is notified

### 3.4 Request expiry

1. Tutor does not respond by 2 hours before lesson start
2. System auto-cancels the request
3. Authorization is released via Stripe API
4. Lesson moves to `cancelled`
5. Payment moves to `cancelled`
6. Both participants are notified

### 3.5 Authorization expiry handling

Stripe authorizations have a limited hold window (typically 7 days for card payments).

If a booking request remains pending long enough for the authorization to expire:

- the system treats this as equivalent to request expiry
- the booking is auto-cancelled
- the student is notified and can rebook

## 4. Stripe Connect Quick Onboarding

### 4.1 Principle

Tutor Stripe onboarding must be quick and easy. The tutor should ideally only need to:

1. Upload required verification documents (government ID)
2. Add their bank account or debit card
3. Confirm

### 4.2 Pre-filling

Mentor IB pre-fills the Stripe Connect Express account with all information already known from the application:

- email (from auth)
- legal first and last name (from application)
- country (from application)
- date of birth (if collected)

### 4.3 Implementation

Use the Stripe Connect Express hosted onboarding flow:

1. Create a Connect Express account via API with pre-filled fields
2. Generate an Account Link for onboarding
3. Redirect tutor to Stripe's hosted onboarding
4. Stripe collects only what is missing (verification docs, bank account)
5. On completion, tutor returns to Mentor IB
6. Listen to `account.updated` webhooks for status changes

### 4.4 Return handling

- On successful completion: redirect to `/tutor/earnings` with success state
- On incomplete exit: redirect to `/tutor/overview` with "complete payout setup" CTA
- Allow tutor to resume onboarding at any time with a fresh Account Link

## 5. Cancellation and Refund Rules

The full cancellation and refund policy is defined in `docs/data/lesson-issue-and-dispute-model-v1.md`.

Summary for payment purposes:

| Scenario | Refund | Tutor payout |
|---|---|---|
| Student cancels >= 2h before | Full refund via Stripe | None |
| Student cancels < 2h before | No refund | Tutor paid |
| Tutor cancels any time | Full refund via Stripe | None |
| Tutor no-show (confirmed) | Full refund via Stripe | None |
| Student no-show (confirmed) | No refund | Tutor paid |
| Technical failure (no fault) | Full refund via Stripe | None |
| Request expired | Authorization released | None |

## 6. Earning and Payout Lifecycle

| State | Meaning |
|---|---|
| `projected` | Earning created when lesson is accepted; payout not yet available |
| `pending` | Lesson completed; waiting for issue-report window to close |
| `available` | No issues; available for next payout cycle |
| `paid` | Paid out to tutor via Stripe Connect |
| `refunded` | Reversed due to refund |
| `adjusted` | Changed by manual or system adjustment |

### 6.1 Payout timing

Payouts follow the Stripe Connect Express payout schedule configured for the platform.

Default: rolling payouts (Stripe standard schedule for the tutor's country).

## 7. Webhook Idempotency

### 7.1 Stripe webhook events to handle

| Event | Action |
|---|---|
| `checkout.session.completed` | Confirm authorization; create booking request |
| `payment_intent.amount_capturable_updated` | Verify authorization is still valid |
| `charge.captured` | Confirm capture; update payment status |
| `charge.refunded` | Confirm refund; update payment and earning status |
| `account.updated` | Update tutor payout account status |

### 7.2 Idempotency rule

Every webhook handler must be idempotent.

Use `provider_event_id` from the webhook payload as the deduplication key.

If a webhook event has already been processed (matching `provider_event_id` exists with `processing_status: processed`), skip silently.

## 8. Phase 1 Task Alignment

This decision confirms that the following Phase 1 tasks are payment-bearing:

- `P1-DATA-003`: includes payment authorization and capture schema
- `P1-BOOK-001`: includes Stripe Checkout authorization and capture flow
- `P1-TUTOR-005`: includes Stripe Connect Express onboarding with pre-filled data
- `P1-LESS-002`: includes cancellation with refund logic
- `P1-NOTIF-001`: includes payment-related notifications
- `P1-JOBS-001`: includes authorization expiry checks and payout processing

## 9. Decisions Locked

- Phase 1 ships real payment, not a stub
- Authorization at booking request, capture on tutor acceptance
- Stripe Connect Express with hosted onboarding and maximum pre-filling
- Tutor only provides verification docs and bank account
- One platform-wide cancellation and refund policy
- Webhook handlers are idempotent using `provider_event_id`
- Authorization expiry auto-cancels the booking
