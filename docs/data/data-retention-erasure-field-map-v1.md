# Mentor IB Data Retention And Erasure Field Map v1

**Date:** 2026-04-09
**Status:** Standalone data-layer field map for privacy classification, retention posture, deletion and erasure handling, public deindexing, anonymization, redaction, and AI-agent-safe lifecycle rules
**Scope:** table-family retention posture, field-level sensitive data handling, erasure workflow sequencing, public route removal, storage/media deletion, projection cleanup, financial/safety retention exceptions, and future implementation review rules

## 1. Why This Document Exists

Mentor IB already has a privacy architecture and a schema outline.

What was still missing was the bridge between them:

**For each data family, what should happen when data is no longer needed or a user asks for deletion?**

Without a field-level retention and erasure map, implementation can drift into:

- deleting auth users before storage objects and product references are handled
- leaving public tutor pages or public projections visible after account deletion
- keeping stale matching artifacts forever
- retaining message bodies without a clear safety or product reason
- deleting records that are needed for payment, dispute, safety, or audit context
- treating projections as if they own retention decisions
- making AI agents guess which fields should be redacted, anonymized, archived, or retained

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because retention and erasure must be applied to concrete table families and fields.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/projection-maintenance-strategy-v1.md`
- `docs/data/projection-sql-patterns-v1.md`
- `docs/data/data-ownership-boundary-map-v1.md`
- `docs/data/data-subject-request-workflow-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/data/database-change-review-checklist-v1.md`

It inherits higher-level policy posture from:

- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/analytics-and-product-telemetry-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- final privacy policy wording
- final legal retention schedule
- final jurisdiction-specific compliance review
- final DSAR tooling
- final backup provider retention documentation
- final Stripe, Supabase, Vercel, or email-provider deletion procedures

It is not legal advice.

It defines the product/data architecture posture that implementation should preserve until exact legal rules are finalized.

If there is a conflict:

- high-level privacy posture comes from `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- compliance scope comes from `docs/architecture/compliance-and-regulatory-posture-v1.md`
- table-family shape comes from `docs/data/database-schema-outline-v1.md`
- public indexing behavior comes from the SEO architecture docs
- access control comes from the auth/RLS docs

## 4. Core Recommendation

Mentor IB should use a **purpose-limited, field-aware retention model**:

1. public data is removed from public exposure first
2. highly sensitive data is minimized and deleted as soon as its purpose ends
3. operational tutoring data is retained only while it supports continuity, safety, support, or disputes
4. financial and safety records can be retained longer when there is a legitimate reason
5. projections and indexes never own independent retention; they are rebuilt or purged from canonical source decisions
6. user deletion is a workflow with dependency checks, not a single destructive operation

The practical rule:

**Delete or redact what no longer has a purpose, restrict what must be retained, and never leave public exposure behind after a removal decision.**

## 5. Retention Action Vocabulary

Use these action labels consistently in implementation notes and task specs.

## 5.1 `retain_active`

Keep while the account, listing, lesson, conversation, or operational object remains active.

## 5.2 `deindex_and_hide`

Remove from public routes, sitemap eligibility, public projections, structured data, and public rendering paths.

Use for:

- public tutor profile removal
- public review comment removal
- public media removal
- public slug/page removal

## 5.3 `redact_field`

Remove or replace sensitive field values while keeping the row for operational integrity.

Examples:

- message body replaced with a removed marker
- meeting URL removed after use
- free-text learning need note removed after erasure
- lesson report free-text summaries removed

## 5.4 `anonymize_link`

Keep the row but break or pseudonymize the direct identity link where product, safety, or financial continuity allows.

Examples:

- label a participant as deleted user
- keep a review aggregate without student display identity
- keep a lesson financial record without user-facing profile details

## 5.5 `restricted_archive`

Retain in a non-public, tightly permissioned archive because a legitimate operational, safety, financial, or legal purpose remains.

Examples:

- moderation case evidence
- payment reconciliation record
- admin action log
- dispute-related lesson history

## 5.6 `hard_delete`

Physically remove the row or file when no legitimate retention purpose remains and deletion will not corrupt required records.

Use especially for:

- obsolete verification files
- stale derived match artifacts
- notification body summaries
- transient job payloads
- unused storage objects

## 5.7 `rebuild_or_purge_projection`

Remove from projections, materialized views, public search export surfaces, cache layers, and derived read models.

Projections do not decide retention.

They mirror canonical retention decisions.

## 6. Privacy Class Mapping

Use the privacy classes from `docs/architecture/privacy-and-data-retention-architecture-v1.md`.

| Class | Meaning | Default retention posture |
| --- | --- | --- |
| `P1` | public approved data | retain while public; deindex/hide when no longer public |
| `P2` | account and profile data | retain while active; redact/anonymize/delete on account deletion depending dependencies |
| `P3` | operational educational data | retain for continuity/support/disputes; redact or archive when stale |
| `P4` | communications and trust data | retain only for continuity/safety/dispute purpose; restricted if retained |
| `P5` | verification or financial linkage data | minimize; restricted; delete files when no longer required |

Minor-aware rule:

- student data should default to conservative retention and public non-exposure because IB students may be minors.

## 7. Erasure Workflow Order

Use this sequence for account-level deletion or meaningful privacy-erasure requests.

1. Confirm identity and request scope.
2. Classify role scope: student, tutor, admin, payer, or multiple roles.
3. Check legal, financial, dispute, safety, and moderation holds.
4. Remove public exposure first: public routes, sitemap eligibility, projections, structured data, and external search removal workflow where relevant.
5. Remove or detach storage objects and public media references.
6. Redact or anonymize high-risk product fields.
7. Retain restricted financial, safety, moderation, or audit records only where purpose remains.
8. Rebuild or purge projections, search export rows, caches, and derived snapshots.
9. Delete or deactivate Supabase Auth identity after product and storage dependencies are handled.
10. Record the deletion workflow outcome in a minimal restricted audit trail.

Do not delete the Supabase auth user first if product-owned storage objects, profile records, lessons, or references still need cleanup.

## 8. Public Exposure Rule

Public removal is urgent.

When a tutor profile, review, public media asset, or public page should no longer be public:

- set public listing or publication status to non-public
- remove from public projections
- remove from sitemap eligibility
- update route metadata or route handling if needed
- remove structured data output
- remove public media references
- trigger search-console/removal workflow when the case is sensitive

Do not rely on database deletion alone to remove public exposure.

## 9. Reference And Taxonomy Tables

Applies to:

- `subjects`
- `subject_focus_areas`
- `languages`
- `meeting_providers`
- `video_media_providers`

Privacy class:

- usually not personal data

Retention posture:

- `retain_active`
- avoid hard deletion if referenced by historical lessons, profiles, or learning needs

Erasure posture:

- no user erasure action normally required

Notes:

- reference rows should use active/deprecated status rather than hard deletion when they have historical references.

## 10. `app_users`

Sensitive fields:

- `auth_user_id`
- `email`
- `full_name`
- `avatar_url`
- `timezone`
- `preferred_language_code`
- `onboarding_state`
- `account_status`
- `primary_role_context`

Privacy class:

- `P2`

Default retention:

- `retain_active` while account is active
- `restricted_archive` or `anonymize_link` when referenced by retained lessons, payments, moderation, messages, or audit records

Erasure posture:

- remove or hash email where no login/support purpose remains
- remove `full_name`
- remove `avatar_url`
- keep a minimal deleted-account marker if referenced records remain
- delete or deactivate Supabase Auth identity after storage/product dependencies are handled

Recommended deleted-account posture:

- `account_status = deleted` or equivalent
- `email = null` or irreversible internal marker, depending final auth needs
- `full_name = null`
- `avatar_url = null`
- `primary_role_context = null` unless required for restricted audit context

Do not:

- keep a live email on a deleted account without purpose
- keep public avatar/profile linkage after account deletion
- hard-delete if it would orphan required financial, safety, or audit records without a replacement identity strategy

## 11. `user_roles`

Sensitive fields:

- `app_user_id`
- `role`
- `role_status`
- `granted_at`
- `revoked_at`

Privacy class:

- `P2`, with higher sensitivity for admin roles

Default retention:

- retain active/revoked role history while it supports account integrity and auditability

Erasure posture:

- revoke active non-required roles
- keep minimal role history if needed for safety, admin audit, or financial traceability
- anonymize through the parent `app_user` where possible

Do not:

- erase admin action context without an audit review

## 12. `student_profiles`

Sensitive fields:

- `app_user_id`
- `display_name`
- `current_stage_summary`
- `notes_visibility_preference`

Privacy class:

- `P2`, with minor-aware handling

Default retention:

- `retain_active` while student account is active
- retain only as long as needed for lessons, support, disputes, or safety review

Erasure posture:

- delete or anonymize `display_name`
- remove `current_stage_summary`
- keep only a deleted-student marker if participant references remain
- avoid retaining student-identifying details in lessons, messages, reviews, or analytics

Do not:

- expose student identity publicly
- retain free-form student background detail after account deletion without a clear purpose

## 13. `tutor_profiles`

Sensitive/public fields:

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
- `intro_video_provider`
- `intro_video_external_id`
- `intro_video_url`

Privacy class:

- `P1` for approved public fields while published
- `P2` for owner/internal tutor profile state

Default retention:

- public data retained only while listing is active and approved
- private tutor profile data retained while account/application needs exist

Erasure posture:

- set `public_listing_status` to non-public
- remove public projection rows
- remove sitemap and structured data eligibility
- remove intro video provider/id/url from public rendering
- redact public bio/headline if no longer needed
- keep minimal application/status/audit trail only if legitimate review, safety, or financial need remains

Slug posture:

- do not immediately reuse `public_slug` after removal unless final policy explicitly allows it
- keep a restricted slug tombstone if needed to prevent impersonation or accidental republishing

Do not:

- leave a deleted tutor in public search projection
- leave public video metadata visible after delisting
- treat public profile text as safe to retain forever just because it was once public

## 14. Tutor Capability Tables

Applies to:

- `tutor_subject_capabilities`
- `tutor_language_capabilities`

Sensitive fields:

- `tutor_profile_id`
- `experience_summary`
- `display_priority`

Privacy class:

- `P1` when approved and publicly displayed
- `P2` while draft/private

Default retention:

- retain while tutor profile is active or application review requires it

Erasure posture:

- delete or archive with tutor profile removal
- remove from public projections and matching projection
- redact `experience_summary` if it contains personal free text and no retention purpose remains

Do not:

- retain capability rows as public search facts after tutor delisting

## 15. `tutor_credentials`

Sensitive fields:

- `credential_type`
- `title`
- `issuing_body`
- `storage_object_path`
- `review_status`
- `reviewed_at`
- `public_display_preference`

Privacy class:

- `P5`

Default retention:

- retain only while verification, audit, or trust-review purpose remains

Erasure posture:

- delete credential storage files when no longer required
- remove `storage_object_path`
- retain only minimal reviewed proof state if needed for trust/audit
- remove public trust proof if the tutor is delisted or proof is withdrawn

Do not:

- expose raw credential files publicly
- retain credential files "just in case"
- copy credential contents into logs, analytics, projections, or public DTOs

## 16. Scheduling And Availability

Applies to:

- `schedule_policies`
- `availability_rules`
- `availability_overrides`
- `tutor_availability_projection`

Sensitive fields:

- `tutor_profile_id`
- timezone and recurring availability
- override reason
- acceptance/new-student status

Privacy class:

- `P2` for private exact schedule
- limited `P1` for public availability summaries if approved

Default retention:

- retain while tutor is active
- keep historical lesson snapshots on `lessons`, not by preserving obsolete availability rules forever

Erasure posture:

- delete future availability rules and overrides when tutor account is deleted or delisted
- remove from public and matching availability projections
- redact free-text override reasons if no retention purpose remains
- keep lesson-specific snapshots separately where lesson history requires them

Do not:

- use availability history as a hidden retention substitute for lesson records
- expose exact private availability if only a summary is needed publicly

## 17. `learning_needs`

Sensitive fields:

- `student_profile_id`
- `need_status`
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

Privacy class:

- `P3`, often minor-aware

Default retention:

- retain while the need is active, connected to a lesson, or useful for continuity/support
- archive stale needs rather than keeping every submitted need active forever

Erasure posture:

- redact `free_text_note` aggressively when stale or deletion is requested
- anonymize or delete learning needs not tied to retained lessons/safety records
- preserve only minimal structured context where needed for lesson continuity or dispute support

Do not:

- use free-text notes as the durable matching record if structured fields are enough
- copy learning need free text into analytics, logs, or public surfaces

## 18. Matching Tables

Applies to:

- `match_runs`
- `match_candidates`
- `tutor_matching_projection`

Sensitive fields:

- `learning_need_id`
- `need_signature`
- `matching_projection_version`
- `fit_summary`
- `best_for_summary`
- `availability_signal`
- `trust_signal_snapshot`
- match score/rank

Privacy class:

- `P3`

Default retention:

- retain meaningful match runs while they support user continuity, booking flow, analytics at an aggregate level, or support
- avoid indefinite retention of stale candidate lists

Erasure posture:

- delete stale match runs/candidates when no booked lesson or support purpose remains
- anonymize or aggregate match analytics if needed
- rebuild or purge matching projections when source tutor/student data changes

Do not:

- retain raw match explanations tied to deleted learning needs without purpose
- expose internal matching projections publicly

## 19. `lessons`

Sensitive fields:

- `student_profile_id`
- `tutor_profile_id`
- `learning_need_id`
- `match_candidate_id`
- `lesson_status`
- schedule timestamps and timezone
- `meeting_method`
- `price_amount`
- `currency_code`
- `subject_snapshot`
- `focus_snapshot`
- `student_note_snapshot`
- lifecycle timestamps

Privacy class:

- `P3`, with financial overlap

Default retention:

- retain for tutoring continuity, support, disputes, cancellations, refunds, and financial reconciliation

Erasure posture:

- redact `student_note_snapshot` when no longer needed or when erasure request requires it
- keep minimal lesson status, time, tutor/student pseudonymous linkage, subject/focus, and financial fields where legitimate purposes remain
- anonymize participant display through related profile/account deletion state
- do not hard-delete completed/paid/disputed lessons without financial and safety review

Do not:

- corrupt historical lesson records by deleting profile rows without a pseudonymization plan
- keep meeting URLs on the lesson if they belong in meeting access and no longer need to be active

## 20. `lesson_status_history`

Sensitive fields:

- `lesson_id`
- `from_status`
- `to_status`
- `changed_by_app_user_id`
- `change_reason`
- `created_at`

Privacy class:

- `P3`

Default retention:

- retain as restricted operational history while it supports disputes, safety, refunds, or audit

Erasure posture:

- anonymize `changed_by_app_user_id` through parent account deletion where possible
- redact `change_reason` if it contains free-text personal data and no purpose remains

Do not:

- delete status history if it is needed to resolve lesson disputes or financial questions

## 21. `lesson_meeting_access`

Sensitive fields:

- `provider`
- `meeting_url`
- `normalized_host`
- `access_status`
- `updated_by_app_user_id`

Privacy class:

- `P3`

Default retention:

- retain active link only while the lesson requires meeting access

Erasure posture:

- redact `meeting_url` after completion window, cancellation, or deletion request unless a dispute requires short restricted retention
- keep provider/host summary only if needed for support or audit
- anonymize updater identity through parent account state

Do not:

- keep expired private meeting URLs indefinitely
- put meeting URLs into logs or notifications beyond what the user needs

## 22. `lesson_reports`

Sensitive fields:

- `lesson_id`
- `goal_summary`
- `coverage_summary`
- `student_confidence_signal`
- `next_steps_summary`
- `student_visible_at`

Privacy class:

- `P3`, potentially high sensitivity because it contains educational context

Default retention:

- retain for continuity while the tutoring relationship or relevant lesson sequence is active
- review stale reports for redaction or archival

Erasure posture:

- redact free-text summaries when no continuity/safety/support purpose remains
- restrict archive if needed for dispute or safety review
- never expose publicly

Do not:

- copy lesson reports into analytics, logs, public profiles, or tutor marketing content

## 23. Conversation Tables

Applies to:

- `conversations`
- `conversation_participants`

Sensitive fields:

- `student_profile_id`
- `tutor_profile_id`
- `lesson_id`
- `learning_need_id`
- `last_message_at`
- `last_message_id`
- `app_user_id`
- `participant_role`
- mute/archive state

Privacy class:

- `P4`

Default retention:

- retain while conversation is active or needed for continuity, reports, blocks, disputes, or safety review

Erasure posture:

- anonymize participant links where possible when an account is deleted
- preserve thread integrity only where legitimate purposes remain
- delete or archive conversation shell if no retained message/safety/lesson dependency remains

Do not:

- expose conversation existence to non-participants
- keep participant identity public after account deletion

## 24. `messages`

Sensitive fields:

- `conversation_id`
- `sender_app_user_id`
- `reply_to_message_id`
- `body`
- `message_status`
- `edited_at`
- `removed_at`

Privacy class:

- `P4`

Default retention:

- retain while needed for conversation continuity, support, dispute handling, abuse reports, or safety review

Erasure posture:

- redact `body` when a valid erasure request applies and no retention hold requires the content
- mark `message_status` or `removed_at` to preserve thread order where needed
- anonymize sender identity through parent account deletion where possible
- retain restricted copies only when required for active safety/dispute review

Do not:

- assume messages are retained forever
- include message bodies in notifications, analytics, logs, or search indexes beyond the minimum needed
- implement whole-message-body search in phase 1

## 25. `message_reads`

Sensitive fields:

- `message_id`
- `app_user_id`
- `read_at`

Privacy class:

- `P4`

Default retention:

- retain only while needed for active unread/read state

Erasure posture:

- hard delete read receipts for a deleted account unless a specific safety/audit reason exists

Do not:

- retain read-state telemetry as behavioral analytics by default

## 26. Blocks And Abuse Reports

Applies to:

- `user_blocks`
- `abuse_reports`

Sensitive fields:

- blocker/reporter user ids
- blocked/reported user ids
- conversation or lesson references
- report type/status
- report summary

Privacy class:

- `P4`

Default retention:

- retain while block is active or trust-and-safety review may need the record
- reports may outlive casual UI history because they support safety

Erasure posture:

- keep active blocks enforceable until they are no longer needed
- restrict archive reports rather than deleting automatically
- redact `summary` when it contains unnecessary personal detail and no longer supports safety review
- anonymize reporter identity where feasible after closure, unless safety process requires it

Do not:

- delete a block or abuse report solely because one party deletes their account if it is still needed to protect other users
- expose report details outside moderation boundaries

## 27. Reviews And Trust Signals

Applies to:

- `reviews`
- `tutor_reliability_events`
- `tutor_rating_snapshot`
- `tutor_trust_snapshot`

Sensitive fields:

- lesson/student/tutor references
- rating value
- review comment
- published/flagged timestamps
- reliability event type/severity
- trust snapshots

Privacy class:

- `P1` for approved public review/trust output
- `P3`/`P4` for underlying lesson-linked and reliability records

Default retention:

- public review content retained only while approved, relevant, and safe
- reliability events retained for trust, ranking, and safety where legitimate

Erasure posture:

- remove or anonymize public review comments when required
- hide/deindex public review output when the review should no longer be public
- keep aggregate rating only if it is sufficiently deidentified and policy allows it
- retain restricted reliability events when needed for tutor quality/safety review
- rebuild rating/trust snapshots after any source retention change

Do not:

- show student identity publicly
- keep review text public after account deletion without a reviewed basis
- let public rating snapshots persist stale or deleted review content

## 28. Notifications And Deliveries

Applies to:

- `notifications`
- `notification_deliveries`

Sensitive fields:

- `app_user_id`
- `notification_type`
- `object_type`
- `object_id`
- `title`
- `body_summary`
- `provider_message_id`
- delivery status/timestamps

Privacy class:

- `P2`/`P3` depending linked object

Default retention:

- retain active in-app notifications while useful to the recipient
- retain delivery records only as long as needed for troubleshooting and delivery accountability

Erasure posture:

- delete or redact `title` and `body_summary`
- retain minimal provider message id/status only if needed for operational audit
- delete recipient-scoped notifications after account deletion unless linked to retained safety/financial workflow

Do not:

- store full message bodies, lesson reports, or sensitive learning context in notification summaries

## 29. Jobs And Webhook Events

Applies to:

- `job_runs`
- `webhook_events`

Sensitive fields:

- provider
- provider event id
- event type
- processing status
- trigger object references
- failure codes
- timestamps

Privacy class:

- usually operational metadata, but can become `P2`/`P5` if payloads or provider ids identify users

Default retention:

- retain minimal idempotency and operational metadata for retry, reconciliation, and incident review

Erasure posture:

- do not store raw provider payloads longer than needed
- redact personal payload fragments
- keep provider event ids and processing state only where needed for idempotency, reconciliation, or audit

Do not:

- store sensitive webhook payloads casually
- delete idempotency records in a way that causes duplicate financial or notification side effects

## 30. Payments And Earnings

Applies to:

- `payments`
- `earnings`
- future `payout_accounts`
- future `payouts`

Sensitive fields:

- payer/tutor references
- Stripe identifiers
- amounts and currency
- payment/refund/capture timestamps
- payout linkage

Privacy class:

- `P5`

Default retention:

- retain minimal financial records for reconciliation, refunds, disputes, accounting, and audit

Erasure posture:

- do not store raw card or bank details in Mentor IB tables
- redact user-facing personal profile linkage where possible
- retain minimal Stripe ids and transaction state where legitimate financial purpose remains
- coordinate external Stripe redaction/deletion only when appropriate and legally allowed

Do not:

- delete financial records in a way that prevents refund, chargeback, payout, accounting, or fraud review
- store payment method details locally

## 31. Admin, Moderation, And Audit

Applies to:

- `tutor_application_reviews`
- `moderation_cases`
- `moderation_case_events`
- `admin_action_logs`

Sensitive fields:

- reviewer/actor ids
- reported/affected user ids
- decision summaries
- case type/status
- moderation notes
- action type and object references

Privacy class:

- `P4`/`P5`

Default retention:

- retain in restricted archive while needed for trust-and-safety, abuse prevention, appeal, audit, or legal defense

Erasure posture:

- restrict access instead of public/user deletion
- redact unnecessary free-text personal detail
- anonymize direct identity links only where it does not compromise safety/audit purpose
- preserve privileged-action audit trail where required for accountability

Do not:

- expose moderation or admin data to public/student/tutor routes
- erase audit logs casually because an account was deleted

## 32. Public Projections And Search Exports

Applies to:

- `public_tutor_search_projection`
- public profile DTOs
- public review/trust projections
- future external search index records

Privacy class:

- mirrors source class, but must contain only `P1` public-safe data

Default retention:

- no independent retention
- projections are regenerated from canonical sources

Erasure posture:

- delete projection rows when public eligibility ends
- remove deleted or delisted tutor data from future search exports
- clear caches/tags tied to public routes
- remove from sitemap and structured data

Do not:

- keep public projection data after source public status is revoked
- store private fields in public projections for convenience

## 33. Files, Storage, And External Media

Applies to:

- public profile images
- private credential files
- future attachments
- external intro video links

Sensitive fields:

- storage object paths
- bucket identifiers
- provider ids
- public URLs
- external media URLs

Privacy class:

- `P1` for approved public media
- `P5` for credential files and private attachments

Default retention:

- public media retained while public listing uses it
- credential/private files retained only while review, trust, audit, or safety purpose remains

Erasure posture:

- remove public rendering references first
- remove sitemap/structured data exposure if relevant
- delete private storage objects when no longer needed
- clear `storage_object_path` after file deletion where appropriate
- remove external video URLs and provider ids from public profile rendering
- remember that Mentor IB can stop referencing external media, but may not control provider-side deletion

Do not:

- delete auth users before handling user-owned storage dependencies
- expose raw credential files
- keep public media attached to delisted profiles

## 34. Analytics, Logs, And Observability

Sensitive fields:

- user identifiers
- route/object ids
- error messages
- request metadata
- event payloads

Privacy class:

- depends on payload; default to `P2` or higher if user-linked

Default retention:

- short by default unless a clear operational or security reason exists

Erasure posture:

- avoid storing direct personal content in analytics/logs so erasure work is smaller
- pseudonymize user identifiers where feasible
- delete or aggregate product analytics according to final vendor/tool retention policy

Do not log:

- message bodies
- credential contents
- private lesson report text
- meeting URLs
- payment instrument data
- auth secrets or magic links

## 35. Backup And Restore Posture

Backups are not the first layer of deletion UX.

Default rule:

- remove live product access, public exposure, projections, and storage references first
- document provider backup expiry separately
- do not restore deleted public visibility automatically after a backup restore

Restore safety requirement:

- any restore workflow must re-run public visibility and deletion-state checks before public routes are eligible again

## 36. Account Deletion Scenarios

## 36.1 Student deletion

Primary actions:

- remove or anonymize `student_profiles`
- redact `learning_needs.free_text_note`
- delete stale match runs/candidates
- restrict or redact lessons/reports where no retention purpose remains
- redact messages where valid and no safety/dispute hold exists
- remove read receipts and notifications
- preserve financial/safety records only where needed

## 36.2 Tutor deletion

Primary actions:

- immediately delist public profile
- remove public projections, sitemap eligibility, structured data, and intro video references
- remove future availability
- delete credential files when no audit/trust purpose remains
- preserve paid lesson/earnings records where needed
- preserve moderation/reliability records where needed

## 36.3 Multi-role account deletion

If a user is both student and tutor:

- process each role domain separately
- do not assume student deletion implies tutor public-data deletion unless request scope includes both or account deletion is complete
- do not preserve a public tutor profile after full account deletion unless there is an explicit business/legal reason and user-facing policy supports it

## 36.4 Admin deletion

Primary actions:

- remove login and active privileges
- preserve admin/moderation audit logs as restricted records
- anonymize display identity where possible
- do not erase privileged-action trails casually

## 37. Field-Map Review Checklist

Before adding or changing a field, answer:

- What privacy class is it?
- Is it public, private, educational, communication, verification, financial, or audit data?
- Does it contain free text?
- Can it contain minor/student identity?
- Is it copied into a projection, DTO, cache, notification, analytics event, or log?
- What happens on account deletion?
- What happens when public listing is revoked?
- Can it be redacted while preserving row integrity?
- Does it need a restricted archive reason?
- Does it need a hard-delete path?
- Does it affect external providers such as Supabase Storage, Stripe, Resend, Google Search, YouTube, Vimeo, or Loom?

If the answer is unclear, do not add the field until the owning data doc is updated.

## 38. AI-Agent Implementation Rules

Agents should:

- classify new fields before adding them
- keep free-text retention conservative
- remove public exposure before deleting canonical records
- purge or rebuild projections after source data deletion/redaction
- avoid copying private fields into public DTOs, analytics, logs, notifications, or search exports
- preserve financial, safety, moderation, and audit records only with restricted access and clear purpose
- delete private storage objects when their purpose ends
- keep deletion workflows ordered and idempotent
- add tests for public removal, projection cleanup, and sensitive redaction paths when implemented

Agents should not:

- hard-delete important business records without reviewing financial/safety dependencies
- keep stale matching artifacts forever
- leave public tutor rows in search projections after delisting
- retain meeting URLs indefinitely
- expose student names in public reviews or public tutor pages
- treat provider backups as the product deletion mechanism
- assume Supabase Auth deletion handles product data and storage cleanup automatically

## 39. Decisions To Lock Now

The system should lock the following decisions now:

- deletion is an ordered workflow, not a single SQL delete
- public exposure removal happens before or alongside canonical deletion
- public projections have no independent retention rights
- student data is minor-aware and private by default
- credential files and meeting URLs are high-risk and should be deleted/redacted when purpose ends
- messages, lesson reports, and learning need free text require explicit retention decisions
- financial, moderation, and audit records may require restricted retention after account deletion
- exact retention durations remain a later legal/policy task, but implementation must preserve the ability to enforce them

## 40. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 41. Final Recommendation

Mentor IB should implement retention as a field-aware lifecycle system.

The clean operating model is:

- classify each field
- remove public visibility first
- redact sensitive text when purpose ends
- hard-delete private files and transient data when safe
- retain restricted financial, safety, and audit records only where justified
- rebuild projections from source truth after every lifecycle change

That gives future AI agents a concrete map for deletion and retention without pretending that final legal retention durations are already settled.

## 42. Official Source Notes

The guidance above is aligned with current official and primary-source guidance for:

- GDPR Article 5 principles, including data minimization, storage limitation, integrity/confidentiality, and accountability: `https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng`
- GDPR Article 17 right to erasure and exceptions for legal obligation, public interest, and legal claims: `https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng`
- FTC COPPA rule summary for under-13 online privacy scope: `https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa`
- Google Search Console Removals behavior for temporary removals and permanent removal requirements: `https://support.google.com/webmasters/answer/9689846`
