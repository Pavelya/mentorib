# Mentor IB Architecture Discussion Review Guide v1

**Date:** 2026-04-07
**Status:** Review companion for `architecture-discussion-v1.md`

## 1. Why This Guide Exists

This guide helps review the architecture recommendation quickly without re-reading every section at once.

## 2. Review Goal

The goal is not to debate every possible stack.

The goal is to decide whether the recommended architecture is the right fit for the approved Mentor IB product model.

## 3. Best Sections To Review First

Start here in [architecture-discussion-v1.md](architecture-discussion-v1.md):

- `Embedded Product Constraints`
- `Options Considered`
- `Recommendation Summary`
- `Frontend Application Shape`
- `Data Model And Schema Strategy`
- `Auth And Authorization Model`
- `Realtime And Messaging`
- `Scheduling And Availability`
- `Search And Matching`
- `Billing And Tutor Payouts`
- `Decisions To Lock Now`

## 4. Core Review Questions

Use these questions while reviewing:

1. Does the architecture clearly preserve one shared product ecosystem instead of drifting into student and tutor silos?
2. Does the recommendation keep the core domain centered on shared objects like `LearningNeed`, `Match`, `Lesson`, `Availability`, and `Conversation`?
3. Is the modular monolith recommendation appropriately pragmatic for phase 1, or is there any real reason to split frontend and backend immediately?
4. Does the auth recommendation keep the stack minimal while still supporting the right branded MVP path later?
5. Does the security model feel strong enough, especially around server-side access, DTO shaping, and RLS?
6. Does the scheduling recommendation match the approved UX ambition, or does it underinvest in the booking system?
7. Does the payment and payout phasing feel realistic for the MVP?
8. Does the repo and module structure look like something a small team can actually build and maintain?

## 5. Review Focus By Decision Area

### App shape

Check whether one root app and nested layouts are the right fit for the "one ecosystem" rule.

### Data ownership

Check whether the proposed schema and data access boundaries keep core product logic on the server without making the system overly rigid.

### Realtime

Check whether the MVP recommendation is simple enough now while preserving a scale path later.

### Auth

Check whether using Supabase Auth now, then upgrading branding later with a paid custom domain, is the right low-complexity path.

### Scheduling

Check whether owning availability natively is the right call for this product.

### Billing

Check whether phase 1 should stop at payment capture or whether tutor payouts must be included immediately.

## 6. Official Source Links

These are the main official references used while shaping the recommendation:

- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication)
- [Next.js route groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next.js layout file convention](https://nextjs.org/docs/app/api-reference/file-conventions/layout)
- [Supabase custom domains](https://supabase.com/docs/guides/platform/custom-domains)
- [Supabase Auth `getUser`](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Supabase Auth `getSession`](https://supabase.com/docs/reference/javascript/auth-getsession)
- [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Supabase API security and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Realtime overview](https://supabase.com/docs/guides/realtime)
- [Supabase Realtime architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Stripe Checkout quickstart](https://docs.stripe.com/checkout/quickstart)
- [Stripe Connect onboarding options](https://docs.stripe.com/connect/onboarding)
- [Drizzle ORM overview](https://orm.drizzle.team/docs/overview)

## 7. Likely Next Deliverables

If this architecture direction is approved, the next most useful deliverables are:

1. `docs/data/database-schema-outline-v1.md`
2. `docs/data/auth-and-authorization-matrix-v1.md`
3. `docs/architecture/route-layout-implementation-map-v1.md`
4. `implementation-stack-decision-v1.md`
