# Mentor IB Database Schema Outline v1

**Date:** 2026-04-08
**Status:** Standalone data-model outline for the canonical relational schema, projection layer, and table-family boundaries
**Scope:** folder placement, schema-layer rules, canonical table families, key relationships, projection strategy, access boundaries, and next data-model artifacts

## 1. Why This Document Exists

This document defines the first canonical database shape for Mentor IB.

It exists now because the approved architecture already establishes:

- one shared object model across student and tutor flows
- one Supabase-backed relational core
- one matching-first product loop
- one messaging domain
- one scheduling and lesson domain
- one trust, moderation, and notification layer

Without an explicit schema outline, later implementation usually drifts into:

- table design that mirrors screens instead of domain objects
- duplicated state across unrelated tables
- ad hoc join logic with no clear source of truth
- read models built before the write model is stable
- AI agents creating local schema patterns that do not match each other

## 2. Why This Lives In `docs/data`

This document should start a dedicated `docs/data` folder.

That is the better long-term placement because this artifact is no longer only a high-level architecture note.

It is the first canonical data-model document, and future related artifacts will likely belong beside it, for example:

- RLS matrix
- enum and status glossary
- migration conventions
- projection maintenance rules
- integration idempotency model

Keeping those under `docs/architecture` would make the architecture folder too broad and harder to navigate.

## 3. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/foundations/ux-object-model.md`
- `docs/architecture/matching-and-ranking-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/query-performance-slos-and-scaling-thresholds-v1.md`

It inherits from those documents and translates them into a relational model outline.

It does not define:

- exact SQL DDL
- final migration file names
- final RLS policies
- final index list for every query
- final API DTO shapes

Those should become later data and implementation artifacts.

## 4. Core Recommendation

Mentor IB should use one normalized relational write model plus a small explicit projection layer.

The practical rule is:

- canonical product objects map to canonical table families
- write models stay normalized and domain-led
- projections exist for search, matching, trust, and list performance
- public exposure should come from controlled views or DTOs, not direct table sprawl
- AI agents should extend shared table families instead of inventing feature-local schema islands

## 5. Data-Layer Style For AI-Driven Implementation

This project is expected to be implemented largely by AI agents.

That means the schema rules should be:

- explicit
- low-ambiguity
- object-aligned
- easy to migrate incrementally
- strict about source-of-truth ownership

The schema should not rely on:

- one giant catch-all table
- free-form status values with no controlled meaning
- duplicated public and private profile tables for the same object unless truly required
- JSON blobs for fields that should be relational filters
- screen-specific tables that re-encode the same business state

## 6. Canonical Schema Layers

The data model should be organized in four layers.

## 6.1 Managed provider schemas

These are owned primarily by Supabase and related managed systems:

- `auth.users`
- `auth.identities`
- `storage.objects`

Mentor IB should reference them, not recreate them.

## 6.2 Canonical application write model

This is the main relational source of truth for product state.

Recommended posture:

- keep canonical application tables in `public` for MVP
- use disciplined exposure and RLS rather than too many custom schemas immediately

## 6.3 Internal-only operational support layer

If the product needs tables that should never be treated as normal client-facing data surfaces, add a small `private` schema later for items such as:

- sync cursors
- provider event raw records
- internal outbox helpers
- internal admin-only operational support tables

Phase 1 does not need many custom schemas, but it should keep this escape hatch available.

## 6.4 Projection layer

Projections can be implemented as:

- views
- materialized views
- dedicated projection tables

Choose the simplest shape that satisfies the approved performance targets.

## 7. Global Table Rules

## 7.1 Naming rule

Use plural `snake_case` table names.

Examples:

- `app_users`
- `student_profiles`
- `learning_needs`
- `match_candidates`

## 7.2 Key rule

Use UUID primary keys across canonical application tables.

This keeps identity consistent with Supabase Auth and avoids mixed key strategies.

## 7.3 Timestamp rule

Canonical tables should generally include:

- `created_at`
- `updated_at`

Add domain timestamps only when they mean something distinct, such as:

- `scheduled_start_at`
- `accepted_at`
- `published_at`

## 7.4 Status rule

Operational state must never be free-form.

Preferred posture:

- use explicit status columns with controlled values
- keep meaning documented
- add history tables where state transitions matter operationally

For MVP flexibility, controlled text values plus validation are usually easier to evolve than overusing Postgres enums.

## 7.5 Deletion rule

Do not hard-delete important business history by default.

For meaningful records such as lessons, reviews, payments, moderation actions, and provider events:

- prefer archival, visibility, or status transitions
- reserve hard deletion for privacy-driven erasure or truly transient data

## 7.6 Source-of-truth rule

Each important fact should have one canonical owner.

Examples:

- identity -> `app_users`
- tutor public profile content -> `tutor_profiles`
- recurring availability rules -> `availability_rules`
- booking state -> `lessons`
- message body -> `messages`
- public review evidence -> `reviews`

## 7.7 Timezone rule

Use one shared timezone format everywhere:

- validated IANA timezone identifiers

But do not force every timezone-bearing concept to read from one physical column.

The correct rule is:

- one personal default timezone lives on `app_users`
- one operational scheduling timezone lives on `schedule_policies`
- one submitted-context timezone lives on `learning_needs`
- one booked snapshot timezone lives on `lessons`

Child scheduling rows such as `availability_rules` should inherit the schedule timezone rather than duplicating it.

## 7.8 Language rule

Use one central language vocabulary.

The `languages` table is the shared source for allowed language codes and display labels.

Other tables should reference that vocabulary rather than inventing local language strings.

## 8. Reference And Taxonomy Tables

Reference data should be explicit where it powers filters, matching, or SEO-sensitive public content.

## 8.1 `subjects`

Purpose:

- canonical IB subject list used by tutor capability, learning needs, lessons, and public browse surfaces

Key notes:

- one row per supported subject
- include stable slug-like identifiers for routing and query reuse if needed later

## 8.2 `subject_focus_areas`

Purpose:

- canonical IB-specific focus areas such as IA, EE, TOK essay, IO, exam prep, commentary, or problem classes used in matching and trust language

Key notes:

- keep these structured instead of burying them only inside free text

## 8.3 `languages`

Purpose:

- canonical language options for tutoring, profile display, and student preferences

Key notes:

- use one central list
- prefer stable ISO-style codes as the shared identifier
- `app_users`, `learning_needs`, and `tutor_language_capabilities` should all reuse this vocabulary

## 8.4 `countries`

Purpose:

- canonical country list used for tutor residency, payout-readiness checks, admin reference management, and country-safe filtering where product scope requires it

Key notes:

- use one central ISO-style country vocabulary
- do not duplicate country labels in app constants or page-local option arrays

## 8.5 `meeting_providers`

Purpose:

- supported external meeting providers for lesson access

Examples:

- `google_meet`
- `zoom`
- `microsoft_teams`
- `generic_external`

Use this as a controlled provider vocabulary, even if the exact implementation stores provider identifiers directly.

## 8.6 `video_media_providers`

Purpose:

- supported external video providers for public tutor intro videos and similar media

Examples:

- `youtube`
- `vimeo`
- `loom`

## 9. Identity And Role Core

## 9.1 `app_users`

Purpose:

- canonical application-level identity for every authenticated person

Key relationships:

- references `auth.users`
- parent identity for student, tutor, and admin capabilities

Recommended columns:

- `id`
- `auth_user_id`
- `email`
- `full_name`
- `avatar_url`
- `timezone`
- `preferred_language_code`
- `onboarding_state`
- `account_status`
- `primary_role_context`

Notes:

- one verified person should map to one canonical `app_user`
- Google and magic-link flows must converge here

## 9.2 `user_roles`

Purpose:

- role capability table that allows one person to hold more than one role over time

Recommended columns:

- `id`
- `app_user_id`
- `role`
- `role_status`
- `granted_at`
- `revoked_at`

Typical roles:

- `student`
- `tutor`
- `admin`

Notes:

- MVP uses one internal role, `admin`
- trust, review, listing, payout, and report operations still stay capability-gated even when they sit under the `admin` role
- finer internal role splits can be introduced later without changing the external product-role model

## 9.3 `student_profiles`

Purpose:

- learner-specific data that should not live directly on the generic account record

Recommended columns:

- `id`
- `app_user_id`
- `display_name`
- `current_stage_summary`
- `notes_visibility_preference`

## 9.4 `tutor_profiles`

Purpose:

- canonical tutor object for both public display and owner editing

Recommended columns:

- `id`
- `app_user_id`
- `display_name`
- `public_slug`
- `headline`
- `bio`
- `teaching_style_summary`
- `best_for_summary`
- `pricing_summary`
- `profile_visibility_status`
- `application_status`
- `public_listing_status`
- `payout_readiness_status`
- `intro_video_provider`
- `intro_video_external_id`
- `intro_video_url`

Notes:

- this should remain one underlying tutor object
- public consumption should come from controlled shaping, not a second unrelated table for the same concept
- `intro_video_provider` should reference the `video_media_providers` vocabulary, not `meeting_providers`
- `public_slug` should normally be generated from `display_name` on first listing and remain stable unless explicitly regenerated or manually changed
- public listing should usually require admin approval, minimum profile readiness, and payout readiness when paid lessons are active

## 9.5 `tutor_subject_capabilities`

Purpose:

- structured representation of which subjects and focus areas a tutor can teach

Recommended columns:

- `id`
- `tutor_profile_id`
- `subject_id`
- `subject_focus_area_id`
- `experience_summary`
- `display_priority`

## 9.6 `tutor_language_capabilities`

Purpose:

- structured tutoring language support per tutor

Recommended columns:

- `id`
- `tutor_profile_id`
- `language_code`
- `display_priority`

Notes:

- this is the relationship layer between tutors and the shared `languages` vocabulary

## 9.7 `tutor_credentials`

Purpose:

- private evidence records for tutor verification and trust review

Recommended columns:

- `id`
- `tutor_profile_id`
- `credential_type`
- `title`
- `issuing_body`
- `storage_object_path`
- `review_status`
- `reviewed_at`
- `public_display_preference`

Notes:

- raw credential files belong to private verification flows
- public trust proof should be derived from reviewed evidence, not by exposing raw files directly

## 10. Availability And Scheduling Core

## 10.1 `schedule_policies`

Purpose:

- tutor-level booking rules that shape slot generation

Recommended columns:

- `id`
- `tutor_profile_id`
- `timezone`
- `minimum_notice_minutes`
- `buffer_before_minutes`
- `buffer_after_minutes`
- `daily_capacity`
- `weekly_capacity`
- `is_accepting_new_students`

Notes:

- `is_accepting_new_students` should normally default to `true` when an approved tutor becomes active
- it is only one eligibility signal, not the sole public-listing gate

## 10.2 `availability_rules`

Purpose:

- recurring weekly availability rules

Recommended columns:

- `id`
- `tutor_profile_id`
- `day_of_week`
- `start_local_time`
- `end_local_time`
- `visibility_status`

## 10.3 `availability_overrides`

Purpose:

- date-specific changes to the recurring schedule

Recommended columns:

- `id`
- `tutor_profile_id`
- `override_date`
- `override_type`
- `start_local_time`
- `end_local_time`
- `reason`

Typical override types:

- `open_extra`
- `blocked`
- `edited_window`

## 10.4 Availability helper projection

Purpose:

- query-friendly representation of upcoming availability and overlap-relevant signals

Suggested shape:

- `tutor_availability_projection`

Notes:

- do not recalculate expensive overlap logic from scratch on every repeated match query

## 11. Learning Need And Matching Core

## 11.1 `learning_needs`

Purpose:

- normalized record of a student's current IB support request

Recommended columns:

- `id`
- `student_profile_id`
- `need_status`
- `need_type`
- `subject_id`
- `subject_focus_area_id`
- `urgency_level`
- `support_style`
- `language_code`
- `timezone`
- `session_frequency_intent`
- `free_text_note`
- `submitted_at`
- `archived_at`

Notes:

- this is the canonical match input object
- free text may exist, but matching should rely on structured columns
- `timezone` here is the student's effective timezone context at submission time, not a replacement for the user's default profile timezone

## 11.2 `match_runs`

Purpose:

- versioned record of a meaningful matching execution for a submitted learning need

Recommended columns:

- `id`
- `learning_need_id`
- `ranking_version`
- `need_signature`
- `matching_projection_version`
- `run_status`
- `candidate_count`
- `created_at`

## 11.3 `match_candidates`

Purpose:

- one candidate tutor result within a specific match run

Recommended columns:

- `id`
- `match_run_id`
- `tutor_profile_id`
- `candidate_state`
- `rank_position`
- `match_score`
- `confidence_label`
- `fit_summary`
- `best_for_summary`
- `availability_signal`
- `trust_signal_snapshot`

Typical states:

- `candidate`
- `shortlisted`
- `compared`
- `contacted`
- `booked`
- `dismissed`

Notes:

- this makes `Match` a first-class domain object
- booking and shortlist history should resolve back to this object where possible

## 11.4 Matching projection

Purpose:

- one query-friendly tutor projection for structured filtering and weighted ranking

Suggested shape:

- `tutor_matching_projection`

It should capture at least:

- tutor listability
- subject and focus coverage
- languages
- trust snapshot
- availability helper fields
- reliability snapshot

## 12. Lessons, Booking, And Meeting Access

## 12.1 `lessons`

Purpose:

- single canonical operational object for booking requests, confirmed lessons, upcoming sessions, and completed lesson history

Recommended columns:

- `id`
- `student_profile_id`
- `tutor_profile_id`
- `learning_need_id`
- `match_candidate_id`
- `lesson_status`
- `scheduled_start_at`
- `scheduled_end_at`
- `request_expires_at`
- `lesson_timezone`
- `meeting_method`
- `price_amount`
- `currency_code`
- `is_trial`
- `subject_snapshot`
- `focus_snapshot`
- `student_note_snapshot`
- `accepted_at`
- `declined_at`
- `cancelled_at`
- `completed_at`

Notes:

- lesson history must not be corrupted by later profile or availability edits
- keep stable booking snapshot fields on the lesson itself
- `lesson_timezone` is the booking snapshot timezone and should remain stable for the historical lesson record
- `request_expires_at` should normally be derived from the lesson start time and the platform request-cutoff rule

## 12.2 `lesson_status_history`

Purpose:

- durable transition history for operationally important lesson-state changes

Recommended columns:

- `id`
- `lesson_id`
- `from_status`
- `to_status`
- `changed_by_app_user_id`
- `change_reason`
- `created_at`

## 12.3 `lesson_meeting_access`

Purpose:

- lesson-scoped access record for external meeting links

Recommended columns:

- `id`
- `lesson_id`
- `provider`
- `meeting_url`
- `normalized_host`
- `access_status`
- `updated_by_app_user_id`

Notes:

- phase 1 should store normalized external meeting access
- Mentor IB owns lesson scheduling and lesson state, not native video conferencing

## 12.4 `lesson_reports`

Purpose:

- private post-lesson continuity record written by the tutor

Recommended columns:

- `id`
- `lesson_id`
- `report_status`
- `goal_summary`
- `coverage_summary`
- `student_confidence_signal`
- `next_steps_summary`
- `student_visible_at`

## 12.5 `lesson_issue_cases`

Purpose:

- canonical operational case for no-show, wrong-link, major technical-failure, or partial-delivery incidents linked to a lesson

Recommended columns:

- `id`
- `lesson_id`
- `case_status`
- `student_claim_type`
- `student_reported_at`
- `tutor_claim_type`
- `tutor_reported_at`
- `resolution_outcome`
- `resolution_note`
- `resolved_by_app_user_id`
- `resolved_at`

Notes:

- one open lesson issue case per lesson is enough for MVP
- this is distinct from `abuse_reports`
- refund, payout, and trust consequences should derive from the resolved lesson issue outcome rather than a one-sided raw claim

## 13. Messaging Core

## 13.1 `conversations`

Purpose:

- canonical thread between exactly one student and one tutor in phase 1

Recommended columns:

- `id`
- `student_profile_id`
- `tutor_profile_id`
- `conversation_status`
- `origin_learning_need_id`
- `last_message_at`
- `last_message_id`

Notes:

- phase 1 should keep one persistent conversation per student-tutor relationship
- lesson detail and booking surfaces may deep-link into the same conversation without making the conversation lesson-owned

## 13.2 `conversation_participants`

Purpose:

- participant state and thread-specific preferences

Recommended columns:

- `id`
- `conversation_id`
- `app_user_id`
- `participant_role`
- `is_muted`
- `is_archived`
- `joined_at`

## 13.3 `messages`

Purpose:

- canonical message store

Recommended columns:

- `id`
- `conversation_id`
- `sender_app_user_id`
- `reply_to_message_id`
- `body`
- `message_status`
- `edited_at`
- `removed_at`

## 13.4 `message_reads`

Purpose:

- unread and read-state tracking

Recommended columns:

- `id`
- `message_id`
- `app_user_id`
- `read_at`

## 13.5 `user_blocks`

Purpose:

- blocking rule between users that affects messaging and interaction eligibility

Recommended columns:

- `id`
- `blocker_app_user_id`
- `blocked_app_user_id`
- `block_status`
- `created_at`

## 13.6 `abuse_reports`

Purpose:

- user-submitted report object for moderation and trust review

Recommended columns:

- `id`
- `reporter_app_user_id`
- `reported_app_user_id`
- `conversation_id`
- `lesson_id`
- `report_type`
- `report_status`
- `summary`

Optional later:

- `message_reactions`
- `message_attachments`

## 14. Review, Trust, And Reliability Core

## 14.1 `reviews`

Purpose:

- lesson-linked public review evidence

Recommended columns:

- `id`
- `lesson_id`
- `student_profile_id`
- `tutor_profile_id`
- `review_status`
- `rating_value`
- `comment`
- `published_at`
- `flagged_at`

Notes:

- reviews should be lesson-linked
- public rating is a derived aggregate, not the primary table value alone

## 14.2 `tutor_reliability_events`

Purpose:

- operational reliability signals that should stay separate from reviews

Recommended columns:

- `id`
- `tutor_profile_id`
- `lesson_id`
- `event_type`
- `severity`
- `recorded_at`

Examples:

- `no_show`
- `late_cancellation`
- `reschedule_by_tutor`
- `response_timeout`

## 14.3 Trust and rating projections

Purpose:

- curated derived trust outputs for public use and ranking use

Suggested projections:

- `tutor_rating_snapshot`
- `tutor_trust_snapshot`

These should compute:

- stabilized public rating
- review count
- review recency indicators
- reliability indicators
- approved trust proof indicators
- moderation/listability gating signals

## 15. Notifications, Async Work, And Provider Events

## 15.1 `notifications`

Purpose:

- in-app user notification object

Recommended columns:

- `id`
- `app_user_id`
- `notification_type`
- `notification_status`
- `object_type`
- `object_id`
- `title`
- `body_summary`
- `read_at`

## 15.2 `notification_deliveries`

Purpose:

- delivery-attempt tracking for important outbound notifications

Recommended columns:

- `id`
- `notification_id`
- `channel`
- `delivery_status`
- `provider_message_id`
- `attempted_at`

Notes:

- Phase 1 uses in-app notification records as canonical product objects
- important lifecycle notifications also track email delivery through this table
- new chat-message notifications stay in-app only in MVP

## 15.3 `policy_notice_versions`

Purpose:

- canonical versioned legal-notice record for terms, privacy, or similar mandatory policy broadcasts

Recommended columns:

- `id`
- `notice_type`
- `version_label`
- `published_at`
- `effective_at`
- `requires_acknowledgement`
- `title`
- `summary`
- `document_url`

## 15.4 `policy_notice_receipts`

Purpose:

- per-user receipt and acknowledgement state for product-visible legal notices

Recommended columns:

- `id`
- `policy_notice_version_id`
- `app_user_id`
- `first_shown_at`
- `viewed_at`
- `acknowledged_at`

## 15.5 `job_runs`

Purpose:

- durable background-job visibility for retries and operations

Recommended columns:

- `id`
- `job_type`
- `job_status`
- `trigger_object_type`
- `trigger_object_id`
- `attempt_number`
- `started_at`
- `finished_at`
- `failure_code`

## 15.4 `webhook_events`

Purpose:

- provider webhook receipt, verification, and idempotency record

Recommended columns:

- `id`
- `provider`
- `provider_event_id`
- `event_type`
- `verification_status`
- `processing_status`
- `received_at`
- `processed_at`

Notes:

- this is especially important for Stripe

## 16. Payments And Earnings Core

## 16.1 `payments`

Purpose:

- application-facing payment record tied to Stripe lifecycle

Recommended columns:

- `id`
- `lesson_id`
- `payer_app_user_id`
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `payment_status`
- `amount`
- `currency_code`
- `authorized_at`
- `authorization_expires_at`
- `captured_at`
- `capture_cancelled_at`
- `refunded_at`

Notes:

- phase 1 should authorize payment at booking-request submission
- tutor acceptance should capture the authorization
- tutor decline or request expiry should cancel the uncaptured authorization and release funds
- MVP may start with `USD` only

## 16.2 `earnings`

Purpose:

- tutor-facing earning record linked to lesson fulfillment

Recommended columns:

- `id`
- `lesson_id`
- `tutor_profile_id`
- `earning_status`
- `gross_amount`
- `platform_fee_amount`
- `net_amount`
- `available_at`
- `paid_at`

Notes:

- tutor earnings should become visible as an internal earnings balance, not a separate stored-value wallet product
- MVP payouts may run on a regular monthly cycle
## 16.3 `payout_accounts`

Purpose:

- tutor payout-readiness and Stripe Connect onboarding state

Recommended columns:

- `id`
- `tutor_profile_id`
- `stripe_connected_account_id`
- `payout_account_status`
- `onboarding_started_at`
- `onboarding_completed_at`
- `charges_enabled_at`
- `payouts_enabled_at`
- `requirements_due_at`

## 16.4 `payouts`

Purpose:

- scheduled payout record for tutor earnings settlements

Recommended columns:

- `id`
- `tutor_profile_id`
- `payout_status`
- `scheduled_for`
- `gross_amount`
- `net_amount`
- `stripe_payout_id`
- `paid_at`

## 17. Admin, Moderation, And Audit Core

## 17.1 `tutor_application_reviews`

Purpose:

- structured internal review record for tutor approval and profile listing decisions

Recommended columns:

- `id`
- `tutor_profile_id`
- `review_status`
- `reviewed_by_app_user_id`
- `decision_summary`
- `reviewed_at`

## 17.2 `moderation_cases`

Purpose:

- canonical internal trust-case object

Recommended columns:

- `id`
- `case_type`
- `case_status`
- `reported_app_user_id`
- `owner_app_user_id`
- `opened_at`
- `resolved_at`

## 17.3 `moderation_case_events`

Purpose:

- durable timeline of case actions and reasoning

## 17.4 `admin_action_logs`

Purpose:

- privileged action audit trail

Recommended columns:

- `id`
- `actor_app_user_id`
- `action_type`
- `object_type`
- `object_id`
- `summary`
- `created_at`

## 18. Public Projections And Query Surfaces

Phase 1 should not expose canonical write tables casually.

The product should instead prefer a small number of explicit public and query-oriented surfaces.

## 18.1 `public_tutor_search_projection`

Purpose:

- public browse/search/read model for tutor discovery

Should include only:

- listable tutor fields
- public trust proof
- structured subject/language coverage
- intro video metadata if public
- query-friendly availability summaries

## 18.2 `tutor_matching_projection`

Purpose:

- structured matching read model with ranking-friendly fields

## 18.3 `tutor_trust_snapshot`

Purpose:

- derived trust surface for ranking and public display

## 18.4 `lesson_list_projection`

Purpose:

- optional list-friendly lesson summary surface if canonical joins become too expensive for frequent role dashboards

Notes:

- do not build projection sprawl early
- add each projection only when a real SLO or query need justifies it

## 19. Access-Boundary Posture

This document is not the full authorization matrix, but the schema should already reflect the access model.

## 19.1 Public surfaces

Public routes should read from:

- explicit public views
- server-shaped DTOs
- query projections limited to public-safe fields

They should not read from:

- raw private tutor verification records
- internal moderation records
- full lesson or conversation tables

## 19.2 User-owned private surfaces

Examples:

- student profile
- learning needs
- lessons
- conversations
- notifications

These should be protected through:

- server-side authorization
- RLS where client or realtime paths exist

## 19.3 Internal-only surfaces

Examples:

- tutor credential evidence
- moderation cases
- admin action logs
- provider event raw records

These should remain server-owned and not depend on broad client exposure.

## 20. Decisions To Lock Now

The data model should lock the following decisions now:

- `app_users` is the canonical application identity root
- roles are layered through `user_roles`, not separate login universes
- `tutor_profiles` remains one canonical tutor object with controlled public shaping
- `learning_needs`, `match_runs`, and `match_candidates` make matching first-class
- `lessons` is the single shared lesson object across request, upcoming, and completed states
- `messages` is the canonical message store; realtime is only a delivery layer
- reviews and reliability stay separate
- payments and earnings are canonical application records even when Stripe is the payment processor
- projections are explicit and limited
- public discovery should run on controlled projections, not raw operational tables

## 21. Implementation Handoff Status

The implementation handoff path is:

1. use `docs/architecture/route-layout-implementation-map-v1.md` for app route shape
2. use `docs/planning/agent-implementation-decision-index-v1.md` and `docs/planning/implementation-task-template-v1.md` to create concrete implementation tasks

## 22. Final Recommendation

Mentor IB should use a relational schema that mirrors the approved shared object model:

- one canonical identity root
- one tutor object
- one learning-need object
- one first-class match system
- one shared lesson object
- one messaging core
- one trust and moderation layer
- one small projection layer for public discovery and performance-critical queries

That gives the project a schema that is understandable for humans, retrievable for AI agents, and stable enough to guide implementation without prematurely freezing every SQL detail.

## 23. Official Source Notes

The outline above is consistent with current official documentation for:

- Supabase tables and data model basics: `https://supabase.com/docs/guides/database/tables`
- Supabase RLS: `https://supabase.com/docs/guides/database/postgres/row-level-security`
- PostgreSQL constraints: `https://www.postgresql.org/docs/current/ddl-constraints.html`
- PostgreSQL indexes: `https://www.postgresql.org/docs/current/indexes.html`
- PostgreSQL materialized views: `https://www.postgresql.org/docs/current/rules-materializedviews.html`
