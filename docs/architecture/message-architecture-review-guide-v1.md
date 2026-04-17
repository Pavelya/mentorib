# Mentor IB Message Architecture Review Guide v1

**Date:** 2026-04-08
**Status:** Review companion for `message-architecture-v1.md`

## 1. Why This Guide Exists

This guide helps review the messaging decision quickly.

## 2. Review Goal

The goal is to decide whether Mentor IB should:

- own messaging as an internal product module

or:

- adopt an external chat SaaS early

## 3. Best Sections To Review First

Start here in [message-architecture-v1.md](message-architecture-v1.md):

- `Decision Summary`
- `Options Considered`
- `Recommendation`
- `Recommended Scope By Phase`
- `Domain Model`
- `Realtime Strategy`
- `Security Model`
- `Performance Model`
- `Notification Strategy`
- `Why External Chat Tools Are Not Recommended Now`
- `Final Recommendation`

## 4. Core Review Questions

1. Is messaging truly product-specific enough that we should own it instead of buying a chat platform now?
2. Is the proposed phase 1 messaging scope realistic for a small team?
3. Does the security model feel strong enough for student-tutor communication?
4. Is `Supabase Realtime` the right live delivery layer now that `Supabase Auth` is in the stack?
5. Are reactions, typing, and push notifications correctly phased instead of being forced too early?
6. Does the recommendation keep the stack minimal without underinvesting in trust and safety?

## 5. Official Source Links

These are the main official references used for the recommendation:

- [Supabase Realtime overview](https://supabase.com/docs/guides/realtime)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Presence](https://supabase.com/docs/guides/realtime/presence)
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase API security and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Twilio Conversations typing indicator](https://www.twilio.com/docs/conversations/typing-indicator)
- [Twilio Conversations attributes](https://www.twilio.com/docs/conversations/attributes)
- [Twilio Conversations pricing](https://www.twilio.com/en-us/messaging/pricing/conversations-api)
- [Stream typing indicators](https://getstream.io/chat/docs/javascript/typing_indicators/)
- [Stream chat moderation](https://getstream.io/moderation/docs/quick-start/chat/)
- [Stream chat pricing](https://getstream.io/chat/pricing/)
- [Sendbird chat pricing](https://sendbird.com/pricing/chat)

## 6. Likely Next Deliverables

If this direction is approved, the next useful deliverables are:

1. `message-schema-outline-v1.md`
2. `message-authz-rules-v1.md`
3. `message-state-machine-v1.md`
4. `notification-delivery-rules-v1.md`
