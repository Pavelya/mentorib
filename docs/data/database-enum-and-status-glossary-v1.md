# Mentor IB Database Enum And Status Glossary v1

**Date:** 2026-04-08
**Status:** Standalone canonical glossary for database statuses, controlled vocabularies, and enum-eligibility rules
**Scope:** status-family ownership, allowed values, semantic definitions, lifecycle notes, and guidance for when to use Postgres enums versus validated text values

## 1. Why This Document Exists

This document defines the canonical meanings of database status and state values in Mentor IB.

It exists now because the approved schema and architecture already depend on many controlled values:

- account and onboarding state
- role state
- tutor application and listing state
- lesson state
- conversation and message state
- review, moderation, notification, and payment state

Without a canonical glossary, teams usually drift into:

- multiple words for the same underlying business state
- similar columns with subtly different meanings
- AI agents inventing new values ad hoc
- status strings leaking into UI copy without a stable domain definition

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because it is the canonical vocabulary contract for the schema.

It is the direct companion to:

- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- `docs/architecture/configuration-and-governance-architecture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/rating-and-review-trust-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`

It inherits from those documents and turns their status language into one canonical glossary.

It does not define:

- final UI copy labels
- final color tokens for state display
- exact SQL enum creation statements

## 4. Core Recommendation

Mentor IB should use one canonical status glossary and keep it versioned as a first-class data artifact.

The practical rule is:

- every status-bearing column must map to one documented status family
- every allowed value must have one stable meaning
- new values require glossary updates, not silent invention
- UI copy can vary, but domain meaning must stay stable

## 5. Enum Eligibility Rule

Not every controlled value family should become a Postgres enum.

## 5.1 Use a true database enum only when:

- the value set is small
- the value set is operationally stable
- changes should be rare
- strict DB-level validation is worth migration friction

## 5.2 Prefer validated text values when:

- the set may expand during product discovery
- naming may evolve
- migration friction would slow iteration
- the values are still controlled, but not mature enough to hard-freeze

## 5.3 MVP recommendation

For MVP, most status families should start as:

- validated text values
- documented in this glossary
- checked in application/domain code and database constraints where appropriate

Good candidates for eventual hard enums later:

- `role`
- `meeting_provider`
- `video_media_provider`
- `notification_channel`

Good candidates to keep as validated text for longer:

- lesson status families
- application and listing states
- moderation and trust states
- job and delivery states

## 6. Global Status Rules

## 6.1 One family, one meaning

If two columns use the same value word, the word should mean the same thing unless the glossary explicitly says otherwise.

## 6.2 No UI-label leakage

Database values should be machine-friendly and stable.

Use:

- `snake_case`

Do not use:

- human-facing sentence labels
- color words
- temporary UI phrasing

## 6.3 No overloaded values

Do not use one status to mean two different things.

Examples to avoid:

- `active` meaning both "listed publicly" and "allowed to sign in"
- `pending` meaning both "awaiting tutor decision" and "awaiting admin review"

## 6.4 Status versus timestamp rule

Use status columns for lifecycle meaning.

Use timestamps for when something happened.

Do not try to replace one with the other.

## 6.5 Status versus visibility rule

Access and visibility are not always the same as workflow state.

When the distinction matters, prefer separate fields.

Example:

- application review state
- public listing state

## 7. Identity And Account Status Families

## 7.1 `app_users.onboarding_state`

Purpose:

- tracks account-resolution and onboarding progression

Allowed values:

- `role_pending`
- `student_setup`
- `tutor_application_started`
- `completed`

Definitions:

- `role_pending`: account exists, but no role path has been chosen
- `student_setup`: student onboarding is in progress
- `tutor_application_started`: tutor onboarding/application has begun
- `completed`: minimum onboarding path is resolved

Notes:

- keep this separate from account health or suspension

## 7.2 `app_users.account_status`

Purpose:

- tracks whether the overall product account is operationally usable

Allowed values:

- `active`
- `limited`
- `suspended`
- `closed`

Definitions:

- `active`: normal use allowed
- `limited`: some capabilities are restricted
- `suspended`: normal product use blocked
- `closed`: account is intentionally closed/deactivated as a product account state

## 7.3 `user_roles.role`

Purpose:

- role capability type

Allowed values:

- `student`
- `tutor`
- `admin`

Rule:

- MVP uses only `student`, `tutor`, and `admin` as product roles
- finer internal capability splits can be added later without changing the MVP public role model

## 7.4 `user_roles.role_status`

Purpose:

- lifecycle state of that specific role capability

Allowed values:

- `active`
- `pending`
- `revoked`
- `suspended`

Definitions:

- `active`: role can be exercised
- `pending`: role exists but is not fully usable yet
- `revoked`: role was removed
- `suspended`: role is temporarily blocked

## 8. Tutor Profile, Application, And Listing Status Families

## 8.1 `tutor_profiles.profile_visibility_status`

Purpose:

- owner-level visibility/edit posture of the tutor profile object

Allowed values:

- `draft`
- `private_preview`
- `public_visible`
- `hidden`

Definitions:

- `draft`: incomplete owner-edit state
- `private_preview`: owner-previewable but not publicly visible
- `public_visible`: publicly viewable
- `hidden`: intentionally not visible publicly

## 8.2 `tutor_profiles.application_status`

Purpose:

- tutor application workflow state

Allowed values:

- `not_started`
- `in_progress`
- `submitted`
- `under_review`
- `changes_requested`
- `approved`
- `rejected`
- `withdrawn`

Definitions:

- `not_started`: no meaningful application yet
- `in_progress`: tutor is filling it out
- `submitted`: application submitted by tutor
- `under_review`: internal review in progress
- `changes_requested`: tutor must update missing or insufficient information before approval can continue
- `approved`: approved for tutor capability/use
- `rejected`: rejected by internal review
- `withdrawn`: withdrawn by tutor before completion or approval

## 8.3 `tutor_profiles.public_listing_status`

Purpose:

- public discovery eligibility and listing visibility

Allowed values:

- `not_listed`
- `eligible`
- `listed`
- `paused`
- `delisted`

Definitions:

- `not_listed`: not yet on the public tutor surface
- `eligible`: passes core gates such as approval, readiness, and payout setup, and can be listed
- `listed`: currently visible on public discovery surfaces
- `paused`: temporarily withheld from new discovery while preserving the profile
- `delisted`: intentionally removed from public discovery

Notes:

- keep separate from `application_status`
- a tutor can be approved but not listed if payout readiness or another operational gate is incomplete

## 8.4 `tutor_credentials.review_status`

Purpose:

- internal review state for credential evidence

Allowed values:

- `uploaded`
- `pending_review`
- `approved`
- `rejected`
- `expired`

Definitions:

- `uploaded`: received but not yet queued/processed fully
- `pending_review`: awaiting internal review
- `approved`: accepted as valid evidence
- `rejected`: rejected as insufficient or invalid
- `expired`: previously valid but no longer current

## 9. Scheduling And Availability Status Families

## 9.1 `availability_rules.visibility_status`

Purpose:

- rule-level visibility or activation posture inside the tutor schedule system

Allowed values:

- `active`
- `hidden`
- `disabled`

Definitions:

- `active`: contributes to slot generation
- `hidden`: not currently exposed for booking
- `disabled`: retained for history or editing but not operational

## 9.2 `availability_overrides.override_type`

Purpose:

- date-specific schedule override kind

Allowed values:

- `open_extra`
- `blocked`
- `edited_window`

## 10. Learning Need And Matching Status Families

## 10.1 `learning_needs.need_status`

Purpose:

- lifecycle of the student's support request

Allowed values:

- `draft`
- `active`
- `matched`
- `booked`
- `archived`

Definitions:

- `draft`: not yet submitted meaningfully
- `active`: eligible for matching/discovery use
- `matched`: meaningful match results exist
- `booked`: converted into a booked lesson path
- `archived`: no longer an active need

## 10.2 `match_runs.run_status`

Purpose:

- system lifecycle of a match execution

Allowed values:

- `queued`
- `running`
- `completed`
- `failed`
- `expired`

Definitions:

- `queued`: accepted for processing
- `running`: currently generating results
- `completed`: usable result set produced
- `failed`: run did not complete successfully
- `expired`: old run should no longer be treated as current

## 10.3 `match_candidates.candidate_state`

Purpose:

- student-facing lifecycle of a specific tutor candidate

Allowed values:

- `candidate`
- `shortlisted`
- `compared`
- `contacted`
- `booked`
- `dismissed`

Definitions:

- `candidate`: generated candidate not yet acted on
- `shortlisted`: saved as a likely option
- `compared`: used in a compare action/state
- `contacted`: moved into interaction or booking path
- `booked`: led to lesson booking
- `dismissed`: intentionally removed from consideration

## 11. Lesson And Meeting Status Families

## 11.1 `lessons.lesson_status`

Purpose:

- canonical operational state for the lesson object

Allowed values:

- `draft_request`
- `pending`
- `accepted`
- `declined`
- `cancelled`
- `upcoming`
- `in_progress`
- `completed`
- `reviewed`

Definitions:

- `draft_request`: request flow exists but is not yet fully submitted
- `pending`: submitted and awaiting tutor/system resolution
- `accepted`: accepted but not yet in the upcoming-live time window
- `declined`: request was declined
- `cancelled`: lesson was cancelled after creation
- `upcoming`: confirmed and scheduled in the future
- `in_progress`: lesson is currently happening
- `completed`: lesson happened and is closed operationally
- `reviewed`: post-lesson review/report follow-up has been completed enough to mark closure

Notes:

- `accepted` and `upcoming` are intentionally distinct
- `accepted` is a decision state
- `upcoming` is a scheduled-operational state

## 11.2 `lesson_meeting_access.access_status`

Purpose:

- readiness state of lesson meeting access

Allowed values:

- `missing`
- `ready`
- `invalid`
- `replaced`

Definitions:

- `missing`: no valid meeting access yet
- `ready`: valid meeting access present
- `invalid`: current meeting access is malformed or unsupported
- `replaced`: old access was superseded by a newer one

## 11.3 `lesson_reports.report_status`

Purpose:

- tutor report lifecycle

Allowed values:

- `due`
- `drafted`
- `submitted`
- `shared`
- `acknowledged`

Definitions:

- `due`: report is expected but not drafted yet
- `drafted`: tutor started draft
- `submitted`: finalized by tutor
- `shared`: intentionally visible to the student
- `acknowledged`: student has seen or acknowledged it where that product behavior exists

## 11.4 `lesson_issue_cases.case_status`

Purpose:

- lifecycle of an operational lesson-issue case

Allowed values:

- `reported`
- `counterparty_matched`
- `under_review`
- `resolved`
- `dismissed`

Definitions:

- `reported`: one participant submitted a lesson issue and the case is awaiting counterparty input or policy handling
- `counterparty_matched`: both sides materially agree on the lesson issue and the case is eligible for automatic resolution
- `under_review`: claims conflict or need manual internal review
- `resolved`: outcome recorded and downstream effects can be applied
- `dismissed`: duplicate, invalid, or withdrawn issue case

## 11.5 `lesson_issue_cases.resolution_outcome`

Purpose:

- normalized outcome used to drive refund, payout, and reliability effects

Allowed values:

- `student_no_show_confirmed`
- `tutor_no_show_confirmed`
- `wrong_link_tutor_fault`
- `technical_issue_no_fault`
- `partial_delivery_adjusted`
- `lesson_completed`
- `duplicate_or_invalid`

Definitions:

- `student_no_show_confirmed`: tutor was available and the student did not attend according to the final outcome
- `tutor_no_show_confirmed`: student was ready and the tutor did not attend according to the final outcome
- `wrong_link_tutor_fault`: tutor-provided meeting access prevented the lesson
- `technical_issue_no_fault`: lesson failed for a technical reason without confirmed tutor-fault penalty
- `partial_delivery_adjusted`: lesson happened only partially and required an operational adjustment
- `lesson_completed`: the issue was reported, but the lesson is treated as successfully delivered after review
- `duplicate_or_invalid`: no operational consequence should be applied

## 12. Messaging Status Families

## 12.1 `conversations.conversation_status`

Purpose:

- overall state of the conversation thread

Allowed values:

- `active`
- `blocked`
- `archived`

Definitions:

- `active`: normal messaging allowed
- `blocked`: messaging is blocked by policy or user action
- `archived`: thread remains in history but is not in active focus

## 12.2 `messages.message_status`

Purpose:

- lifecycle of a single message

Allowed values:

- `sent`
- `edited`
- `removed`
- `flagged`

Definitions:

- `sent`: normal visible message
- `edited`: visible message that has been edited
- `removed`: removed from normal display according to policy/product behavior
- `flagged`: flagged for review or policy handling

## 12.3 `user_blocks.block_status`

Purpose:

- state of a block relationship

Allowed values:

- `active`
- `lifted`

Definitions:

- `active`: block is currently enforced
- `lifted`: block existed historically but is no longer enforced

## 12.4 `abuse_reports.report_status`

Purpose:

- lifecycle of a user-submitted abuse report

Allowed values:

- `submitted`
- `under_review`
- `resolved`
- `dismissed`

Definitions:

- `submitted`: received and waiting for handling
- `under_review`: being investigated
- `resolved`: action or conclusion reached
- `dismissed`: closed without action beyond dismissal

## 13. Review, Trust, And Moderation Status Families

## 13.1 `reviews.review_status`

Purpose:

- moderation/publication state of a review

Allowed values:

- `pending`
- `submitted`
- `published`
- `flagged`
- `removed`

Definitions:

- `pending`: draft or not yet finalized for publication handling
- `submitted`: submitted by the student and awaiting final publication path
- `published`: publicly visible
- `flagged`: flagged for moderation review
- `removed`: intentionally removed from public display

## 13.2 `tutor_reliability_events.event_type`

Purpose:

- operational reliability signal type

Allowed values:

- `no_show`
- `late_cancellation`
- `reschedule_by_tutor`
- `response_timeout`

Rule:

- these are event types, not workflow statuses

## 13.3 `moderation_cases.case_status`

Purpose:

- lifecycle of an internal moderation case

Allowed values:

- `open`
- `under_review`
- `actioned`
- `closed`

Definitions:

- `open`: case exists and has not yet been actively worked
- `under_review`: currently being investigated
- `actioned`: an intervention was taken and case is nearing closure
- `closed`: case resolved and operationally closed

## 13.4 `tutor_application_reviews.review_status`

Purpose:

- internal review state for tutor application handling

Allowed values:

- `queued`
- `under_review`
- `changes_requested`
- `approved`
- `rejected`

Definitions:

- `queued`: waiting for reviewer handling
- `under_review`: actively being reviewed
- `changes_requested`: reviewer requires more information or profile changes before approval
- `approved`: approved by internal reviewer
- `rejected`: rejected by internal reviewer

## 14. Notification, Job, And Delivery Status Families

## 14.1 `notifications.notification_status`

Purpose:

- in-app notification lifecycle

Allowed values:

- `unread`
- `read`
- `dismissed`

Definitions:

- `unread`: not yet seen/read by the owner
- `read`: seen/read but still retained
- `dismissed`: intentionally cleared from normal attention state

## 14.2 `notification_deliveries.delivery_status`

Purpose:

- outbound notification attempt state

Allowed values:

- `queued`
- `attempted`
- `accepted`
- `failed`

Definitions:

- `queued`: waiting for provider attempt
- `attempted`: dispatch attempt was made
- `accepted`: provider accepted the request
- `failed`: delivery attempt failed or was rejected

## 14.3 `job_runs.job_status`

Purpose:

- background job lifecycle

Allowed values:

- `queued`
- `running`
- `succeeded`
- `failed`
- `retrying`
- `cancelled`

Definitions:

- `queued`: waiting to execute
- `running`: currently executing
- `succeeded`: completed successfully
- `failed`: failed without immediate further retry
- `retrying`: failed and scheduled for retry
- `cancelled`: intentionally cancelled

## 14.4 `webhook_events.verification_status`

Purpose:

- signature/authenticity verification result for provider webhook receipt

Allowed values:

- `pending`
- `verified`
- `rejected`

Definitions:

- `pending`: not yet verified
- `verified`: authenticity checks passed
- `rejected`: authenticity checks failed

## 14.5 `webhook_events.processing_status`

Purpose:

- internal handling state for the verified event

Allowed values:

- `received`
- `processing`
- `processed`
- `ignored`
- `failed`

Definitions:

- `received`: stored but not yet actively handled
- `processing`: handling in progress
- `processed`: handled successfully
- `ignored`: intentionally ignored as duplicate or irrelevant
- `failed`: handling failed

## 15. Payment And Earnings Status Families

## 15.1 `payments.payment_status`

Purpose:

- application-facing payment lifecycle summary

Allowed values:

- `pending`
- `authorized`
- `paid`
- `refunded`
- `failed`
- `cancelled`

Definitions:

- `pending`: payment intent or payment flow started but not completed
- `authorized`: payment hold exists and can be captured or released according to booking outcome
- `paid`: successful paid state
- `refunded`: refunded in full or treated as refunded summary state
- `failed`: payment attempt failed
- `cancelled`: payment flow intentionally cancelled

Notes:

- Stripe-native sub-states can remain provider-specific
- this column should reflect the app's canonical summary state

## 15.3 `payout_accounts.payout_account_status`

Purpose:

- tutor payout-readiness lifecycle

Allowed values:

- `not_started`
- `pending_setup`
- `pending_verification`
- `enabled`
- `restricted`
- `disabled`

Definitions:

- `not_started`: no payout account setup started
- `pending_setup`: tutor must still complete hosted onboarding
- `pending_verification`: setup submitted but Stripe requirements are still pending
- `enabled`: payout account is ready for charges and payouts
- `restricted`: account exists but currently cannot operate normally
- `disabled`: payout account intentionally disconnected or closed

## 15.2 `earnings.earning_status`

Purpose:

- tutor-facing earning lifecycle summary

Allowed values:

- `projected`
- `pending`
- `available`
- `paid`
- `refunded`
- `adjusted`

Definitions:

- `projected`: expected earning before final availability
- `pending`: not yet available for payout
- `available`: available for payout or settlement
- `paid`: paid out
- `refunded`: reversed due to refund
- `adjusted`: changed by manual or system adjustment

## 16. Vocabulary Families That Are Not Workflow Statuses

These are controlled vocabularies, but they are not lifecycle statuses.

## 16.1 `meeting_provider`

Allowed values:

- `google_meet`
- `zoom`
- `microsoft_teams`
- `generic_external`

## 16.2 `video_media_provider`

Allowed values:

- `youtube`
- `vimeo`
- `loom`

## 16.3 `notification_channel`

Allowed values:

- `in_app`
- `email`

## 17. Ambiguity Rules

## 17.1 `pending`

Do not use `pending` casually across every table.

It is allowed only where the surrounding status family clearly defines what is pending.

## 17.2 `active`

Do not use `active` unless the family clearly means "currently operational."

Examples where `active` is acceptable:

- account status
- role status
- block status
- conversation status

Examples where `active` should not replace a richer lifecycle:

- lesson lifecycle
- payment lifecycle
- application review lifecycle

## 17.3 `hidden` versus `delisted`

Keep them distinct:

- `hidden` usually means not visible in a local object/view context
- `delisted` means removed from public discovery as a listing state

## 18. Rules For Future Additions

Before adding a new status or enum family, ask:

1. Is this really a new family or should an existing family be reused?
2. Is this a status, a type, a visibility flag, or a timestamped event?
3. Does the value need to be public, internal, or both?
4. Is the family stable enough for a real DB enum, or should it stay validated text for now?

If a new value is added, update:

- this glossary
- schema constraints or validators
- affected UI/status mapping logic

## 19. Decisions To Lock Now

The system should lock the following now:

- all status values must come from documented families
- status values use stable `snake_case`
- UI labels are not database values
- most status families remain validated text in MVP
- only stable vocabularies should be early DB-enum candidates
- application, listing, review, and moderation states stay explicitly separate

## 20. Implementation Handoff Status

The implementation handoff path is:

1. use `docs/architecture/route-layout-implementation-map-v1.md` for app route shape
2. use `docs/planning/agent-implementation-decision-index-v1.md` and `docs/planning/implementation-task-template-v1.md` to create concrete implementation tasks

## 21. Final Recommendation

Mentor IB should treat status language as part of the data architecture, not as incidental implementation detail.

One glossary, used consistently, will make:

- schema design cleaner
- authorization safer
- UI state mapping more coherent
- AI-agent implementation more accurate

## 22. Official Source Notes

The guidance above is aligned with current official documentation for:

- PostgreSQL enum types: `https://www.postgresql.org/docs/current/datatype-enum.html`
- PostgreSQL check constraints: `https://www.postgresql.org/docs/current/ddl-constraints.html`
- Supabase Postgres overview: `https://supabase.com/docs/guides/database/overview`
