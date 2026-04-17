# Mentor IB Message Architecture v1

**Date:** 2026-04-08
**Status:** Standalone messaging architecture recommendation
**Scope:** conversation model, realtime approach, moderation, security, notifications, and phased delivery

## 1. Why This Document Exists

This document isolates messaging as its own architecture topic.

That matters because messaging is important enough to influence:

- auth choices
- data modeling
- realtime strategy
- moderation
- notifications
- trust and safety

It is intentionally written to be:

- standalone
- aligned with the approved design and architecture pack
- self-contained
- pragmatic for a small-team MVP

## 2. Decision Summary

The recommended direction is:

- build messaging as an internal product module
- keep the canonical message and conversation data in `Supabase Postgres`
- use `Supabase Realtime` as the live delivery layer where it adds clear value
- do not adopt a full external chat SaaS for phase 1

Short version:

**Own the messaging domain, rent the infrastructure primitives.**

## 3. Why Messaging Is A Core Product Module

Mentor IB messaging is not generic community chat.

It is tightly connected to:

- a specific student and a specific tutor
- booking and rescheduling context
- active lesson context when relevant
- safety actions like block and report
- unread and follow-up state
- future lesson continuity

That means messaging belongs inside the product domain, not beside it.

If chat is outsourced to a separate product too early, the team still has to build and maintain:

- user identity mapping
- lesson context mapping
- moderation rules
- notification rules
- block and report logic
- admin visibility

In other words:

- an external chat tool can reduce some transport and SDK work
- it does not remove the need for a strong internal message domain

## 4. Product Requirements This Architecture Must Support

The approved product direction implies the messaging system should support:

- one-to-one tutor-student conversations
- student-initiated first contact before booking
- one persistent tutor-student thread that survives across lessons
- conversation list
- unread state
- message reply
- block user
- report user
- notifications for new activity

It should also leave room for:

- reactions
- typing indicators
- online presence
- future file attachments

## 4.1 Conversation-initiation rule

For MVP:

- the student may start the first conversation
- the first conversation can begin from tutor profile, match results, compare, or booking entry points
- tutors may respond inside an existing student-linked conversation
- tutors should not be able to send broad cold-outreach messages to students

## 5. Options Considered

## 5.1 Option A: Internal messaging module on Supabase primitives

### Summary

Use:

- `Supabase Postgres` for canonical conversation and message state
- `Supabase Realtime` for live delivery
- Next server domain services for writes, moderation, and shaping

### Why it fits best

- one shared product model
- one identity system
- one tutor-student relationship thread
- strong control over block and report behavior
- no second source of truth for critical tutoring relationships
- lower long-term product coupling

### Tradeoffs

- the team owns the conversation schema and rules
- moderation and notification logic must be designed deliberately
- there is less out-of-the-box UI than with chat vendors

## 5.2 Option B: External chat SaaS from day one

Examples in this category include products like `Twilio Conversations`, `Stream Chat`, or `Sendbird`.

### Why it is not recommended for phase 1

- it adds a second core platform for a feature that is tightly bound to lessons and users
- it introduces another data model that still has to be mapped back to Mentor IB objects
- it adds another pricing line as messaging usage grows
- it does not remove the need for internal trust and safety logic

### What those tools are good at

External chat vendors are strongest when the product needs:

- multi-channel messaging
- native mobile SDK depth immediately
- large group or community chat
- advanced off-the-shelf moderation
- heavy chat scale early

That is not the Mentor IB MVP profile.

## 5.3 Option C: Internal messaging with no realtime at all

### Summary

Persist messages internally and rely only on polling and refresh behavior.

### Why it is not the preferred recommendation

This can work as a fallback, but the product benefits enough from live message delivery that using `Supabase Realtime` is a reasonable addition once `Supabase Auth` is already in the stack.

It is especially useful for:

- new message delivery
- unread freshness
- typing state if included

## 6. Recommendation

Use **Option A**:

- internal message domain
- Postgres as source of truth
- Realtime as delivery layer
- no external chat SaaS for phase 1

This is the best fit for the approved product and the current "minimal tools" principle.

## 7. Recommended Scope By Phase

## 7.1 Phase 1 MVP

The recommended MVP message scope is:

- one-to-one conversations only
- student-initiated first contact
- text messages only
- conversation list
- unread state
- send message
- reply to message
- block user
- report user
- in-app new message indicators
- email notifications for new messages

## 7.2 Phase 1.5

Good candidates for the next wave:

- reactions
- typing indicator
- online presence
- better filtering and search within conversations

## 7.3 Phase 2

Consider later:

- browser push notifications
- native mobile push notifications
- file uploads in messaging
- richer moderation tooling
- admin review surfaces for reports

## 8. Confidence By Feature Area

## 8.1 High-confidence MVP features

These are low-risk and strongly recommended for the first implementation:

- conversation list
- unread state
- message send
- message reply
- block user
- report user
- in-app indicators
- email notifications

## 8.2 Medium-confidence phase 1.5 features

These are very achievable, but they add more coordination and state handling:

- reactions
- typing indicator
- online presence

## 8.3 Deliberately deferred features

These should not be pulled into phase 1 unless product priorities change:

- file attachments
- browser push
- mobile push
- advanced moderation automation

## 9. Domain Model

## 9.1 Core objects

The core messaging objects should be:

- `Conversation`
- `ConversationParticipant`
- `Message`
- `MessageReadState`
- `UserBlock`
- `AbuseReport`
- `Notification`

## 9.2 Suggested conversation rules

- a conversation belongs to exactly one student and one tutor in phase 1
- a conversation should be relationship-scoped, not recreated per lesson
- a conversation may carry entry-point provenance such as a `LearningNeed` or booking origin
- lesson surfaces may deep-link into the same conversation without making the thread lesson-owned
- a conversation should have one canonical status model

### Suggested statuses

- active
- blocked
- archived

## 9.3 Suggested message rules

A message should support:

- body
- sender
- conversation
- created time
- reply target
- edited state
- visibility state

### Suggested message states

- sent
- edited
- removed
- flagged

## 9.4 Suggested support tables

The exact names can evolve, but the data model should cover:

- `conversations`
- `conversation_participants`
- `messages`
- `message_reads`
- `user_blocks`
- `abuse_reports`
- `conversation_notification_state`

Optional later:

- `message_reactions`
- `message_attachments`

## 10. Realtime Strategy

## 10.1 Core rule

Realtime should deliver freshness.

It should not become the primary store.

The canonical path is:

1. server validates the write
2. domain service persists the message in Postgres
3. live clients receive a delivery event
4. thread state rehydrates from canonical data

## 10.2 Recommended realtime usage

Use `Supabase Realtime` for:

- new message delivery
- conversation list freshness
- unread updates
- optional typing indicator

## 10.3 Presence rule

Presence is additive.

It is useful for:

- online now
- typing
- active thread awareness

It should not be required for the messaging UX to remain usable.

## 10.4 Realtime scaling note

`Postgres Changes` is simple and useful, but Supabase explicitly notes scaling and authorization costs because every change event must be checked against access rules.

That means the system should start modestly:

- subscribe only where needed
- keep active thread subscriptions tight
- avoid broad table-wide subscriptions on many screens

If usage grows, the delivery layer can move toward more targeted patterns like `Broadcast` while keeping Postgres canonical.

## 11. Security Model

## 11.1 Core security rule

Messaging security must be enforced at more than one layer.

Use:

- application-layer authorization in the Next domain services
- database protection with `RLS`
- Realtime authorization for private channels where used

## 11.2 Minimum security requirements

The message system should guarantee these rules by design:

- only conversation participants can read a conversation
- only conversation participants can send into that conversation
- blocked users cannot continue message exchange
- reported content is retained for moderation review
- service-role privileges are never exposed to the browser

## 11.3 Block rule

Blocking should be enforced in both:

- send paths
- conversation list and thread access paths

This should be product-level logic, not just a UI affordance.

## 11.4 Report rule

Reporting should create a durable record that can later support:

- manual review
- trust and safety workflows
- audit history

## 11.5 Rate limiting rule

Message send actions should be rate-limited to reduce abuse and accidental spam.

## 12. Performance Model

## 12.1 Why performance is manageable

Mentor IB messaging is expected to be:

- one-to-one
- relatively low-volume
- tied to tutoring relationships

That is much lighter than a social or community chat product.

## 12.2 First performance rules

Use:

- paginated thread queries
- indexed conversation and message lookups
- unread counters or read-state shaping
- active-thread subscriptions only
- text-only MVP payloads

## 12.3 Performance anti-patterns

Avoid:

- subscribing every screen to broad table changes
- loading entire message history at once
- mixing attachments into phase 1 if they are not required
- storing ephemeral typing data as regular durable message rows

## 13. Notification Strategy

## 13.1 Recommended MVP notifications

For MVP, support:

- in-app unread indicators
- in-app new message indicators
- email notification for new messages

## 13.2 Deferred notification layers

Later, add:

- browser push
- mobile push
- digest controls
- quiet hours

## 13.3 Delivery rule

Notifications should be a separate product module that reacts to message events.

Messaging should not directly hardcode all outbound delivery behavior.

## 14. File Upload Policy

The current recommendation is:

- no file upload support in messaging for phase 1

### Why

- it increases abuse and moderation complexity
- it introduces storage and scanning questions
- it complicates message rendering and permissions
- it is not necessary to validate the tutoring communication loop

### Later rule

If attachments are added later, they should be:

- explicit
- size-limited
- type-limited
- scanned or otherwise moderated
- stored outside the core message row with metadata references

## 15. Why External Chat Tools Are Not Recommended Now

## 15.1 They solve the wrong hardest problem

The hardest part of Mentor IB messaging is not socket transport.

It is:

- identity
- lesson context
- permissions
- trust and safety
- notification behavior

Those remain product responsibilities either way.

## 15.2 They create another product center of gravity

With an external chat platform, the team now has:

- Supabase for product data
- Stripe for billing
- a chat platform for conversations

That increases operational and conceptual complexity.

## 15.3 They are more justified later if the product changes shape

An external chat platform becomes more reasonable if Mentor IB later needs:

- group classes
- large-scale communities
- omnichannel messaging
- native mobile chat parity at high speed
- advanced out-of-the-box moderation

## 16. When To Revisit This Decision

Re-evaluate the "no external chat SaaS" decision if:

- messaging becomes a much larger share of product value
- native mobile becomes core
- moderation needs become much more advanced
- concurrency and delivery guarantees materially outgrow the current design

## 17. Final Recommendation

Mentor IB should build messaging **internally as a product module**, not buy it as a separate chat platform in phase 1.

The recommended phase 1 stack is:

- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Realtime`
- Next server domain services

The recommended phase 1 feature scope is:

- text-only
- one-to-one
- lesson-aware
- secure
- notification-capable

This is the smallest architecture that still gives Mentor IB a trustworthy and product-specific messaging system.

## 18. Official Source Notes

This recommendation is informed by current official documentation for:

- Supabase Realtime, Authorization, Presence, Postgres Changes, and API security
- Twilio Conversations feature scope
- Stream Chat feature and pricing positioning
- Sendbird chat pricing and packaging
