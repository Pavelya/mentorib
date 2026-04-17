# Mentor IB Tutor Listing Readiness Model v1

**Date:** 2026-04-13
**Status:** Canonical model for tutor listing gates, state transitions, and tutor-facing messaging
**Scope:** the lifecycle from application approval to public listing, payout readiness gates, profile completeness requirements, and post-listing quality maintenance

## 1. Why This Document Exists

Multiple documents reference tutor listing readiness without defining the full lifecycle in one place.

This document resolves:

- what "approved but not listed" means
- what gates must pass before a tutor appears in public discovery
- how payout readiness interacts with listing status
- what happens when a listed tutor is paused or suspended
- what the tutor sees at each stage

## 2. Companion Documents

- `docs/data/database-enum-and-status-glossary-v1.md` (sections 8.1, 8.2, 8.3, 15.3)
- `docs/planning/phase1-payment-scope-decision-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/seo-page-inventory-v1.md`

## 3. Core Principle

Listing readiness is a composite gate, not a single status field.

A tutor must pass all gates simultaneously to be publicly discoverable. Failing any single gate removes the tutor from public discovery without affecting their ability to use the product privately.

## 4. Listing Gate Requirements

### 4.1 Gate 1: Application approved

The tutor's `application_status` must be `approved`.

### 4.2 Gate 2: Profile minimum complete

The tutor profile must contain at minimum:

- display name
- real profile photo (not placeholder)
- headline or short bio
- at least one IB subject with component coverage
- at least one "best for" scenario
- teaching style summary
- timezone
- hourly rate

### 4.3 Gate 3: Schedule set

The tutor must have at least one active recurring availability rule producing bookable slots within the next 14 days.

### 4.4 Gate 4: Meeting link configured

The tutor must have a default meeting provider and meeting link set.

### 4.5 Gate 5: Payout ready

The tutor's `payout_account_status` must be `enabled`.

This means the Stripe Connect Express account is fully set up and capable of receiving payouts.

### 4.6 Gate 6: No active suspension or hold

The tutor's `account_status` must be `active` and `public_listing_status` must not be `paused` or `delisted` by admin action.

## 5. State Transitions

### 5.1 Full lifecycle

```
application submitted
  → under_review
  → approved (Gate 1 passes)
    → tutor completes profile (Gate 2)
    → tutor sets schedule (Gate 3)
    → tutor sets meeting link (Gate 4)
    → tutor completes Stripe onboarding (Gate 5)
      → all gates pass → public_listing_status = "listed"
```

### 5.2 Listing status values

| Status | Meaning | Tutor-facing message |
|---|---|---|
| `not_listed` | Default after approval; gates not yet passed | "Complete your setup to go live" |
| `eligible` | All gates pass; system can list | Transition state; should auto-promote to `listed` |
| `listed` | Publicly visible in discovery, search, and matching | "Your profile is live" |
| `paused` | Temporarily removed from discovery by admin | "Your profile is temporarily paused — check notifications for details" |
| `delisted` | Removed from discovery by admin action | "Your profile has been removed from public listing — check notifications for details" |

### 5.3 Gate failure after listing

If any gate fails after a tutor is already listed:

| Gate that fails | Effect | Tutor message |
|---|---|---|
| Payout restricted by Stripe | Move to `not_listed` | "Your payout account needs attention — update it to restore your listing" |
| Schedule emptied | Move to `not_listed` | "Add availability to restore your listing" |
| Meeting link removed | Move to `not_listed` | "Set a meeting link to restore your listing" |
| Account suspended | Move to `delisted` | "Your account has been suspended — check notifications" |
| Admin pauses listing | Move to `paused` | "Your profile is temporarily paused" |

### 5.4 Restoration

When a failed gate is corrected and all gates pass again, the tutor moves back to `eligible` → `listed` automatically.

Admin-initiated `paused` and `delisted` states require admin action to restore.

## 6. Payout Readiness and Quick Stripe Onboarding

### 6.1 Onboarding approach

Mentor IB uses Stripe Connect Express with hosted onboarding.

The onboarding flow must be as quick and frictionless as possible for the tutor.

### 6.2 Pre-filled information

When creating the Stripe Connect Express account, Mentor IB pre-fills all information already collected during the application process:

- legal name (from application identity step)
- email address (from auth)
- country (from application)
- date of birth (if collected during application)

### 6.3 What the tutor must provide

The tutor's remaining obligations during Stripe onboarding are limited to:

- identity verification documents (government ID, as required by Stripe for the tutor's country)
- bank account or debit card for payouts
- any additional Stripe-required fields that could not be pre-filled

### 6.4 Onboarding UX

The onboarding experience should:

- use Stripe's hosted onboarding page (not a custom KYC form)
- clearly explain why payout setup is needed ("to receive lesson payments")
- show the tutor what has already been pre-filled
- provide a single CTA to complete the remaining steps
- return the tutor to the Mentor IB earnings or overview page after completion
- handle incomplete onboarding gracefully (tutor can return later)

### 6.5 Stripe account lifecycle sync

Mentor IB listens to Stripe Connect webhooks to track payout account status:

- `account.updated` → update `payout_account_status` based on `requirements` and `charges_enabled` / `payouts_enabled`
- When `charges_enabled` and `payouts_enabled` are both true and no `currently_due` requirements remain → status = `enabled`
- When requirements become due or restricted → status = `restricted` or `pending_verification`

## 7. Tutor-Facing Readiness Checklist

After approval, the tutor overview route shows a readiness checklist:

| Step | Gate | Status display |
|---|---|---|
| Complete your profile | Gate 2 | Shows which fields are missing |
| Set your availability | Gate 3 | Shows whether bookable slots exist |
| Add a meeting link | Gate 4 | Shows current link status |
| Set up payouts | Gate 5 | Shows Stripe account status with CTA |

The checklist uses the `ChecklistPanel` component from the design system.

When all steps are complete, the checklist is replaced with a "Your profile is live" confirmation.

## 8. SEO and Indexation Interaction

### 8.1 Quality gate for indexation

A tutor profile page is eligible for indexation only when:

- `public_listing_status` is `listed`
- profile meets the content quality threshold defined in `docs/architecture/seo-page-inventory-v1.md`

### 8.2 Post-listing suspension

When a listed tutor moves to `paused` or `delisted`:

- the profile page returns a 404 or a soft "not available" message
- the sitemap is regenerated to exclude the tutor
- Search Console will naturally deindex the page

### 8.3 Restoration after suspension

When a paused tutor is restored to `listed`, the profile page becomes available again and is re-added to the sitemap.

## 9. Decisions Locked

- Listing readiness is a composite gate requiring all 6 conditions
- Stripe Connect Express with hosted onboarding and pre-filled tutor data
- Tutor only needs to provide verification docs and bank account
- Gate failure after listing auto-removes from discovery
- Gate restoration auto-restores listing (except admin-initiated holds)
- Readiness checklist shown on tutor overview until all gates pass
- Tutor profile indexation requires `listed` status

## 10. Implementation Handoff

This model should be used by:

- `P1-TUTOR-001` for readiness checklist on overview
- `P1-TUTOR-005` for payout readiness flow and Stripe Connect integration
- `P1-PUBLIC-003` for tutor profile indexation gate
- `P1-DATA-002` for listing status schema
