# Mentor IB Privacy And Data Retention Architecture v1

**Date:** 2026-04-08
**Status:** Standalone privacy and data-lifecycle architecture for the shared application stack
**Scope:** data classification, minimization, public-versus-private boundaries, retention posture, deletion flows, public search removal, and lifecycle rules for user, lesson, message, payment, and file data

## 1. Why This Document Exists

This document defines how Mentor IB should treat personal and operational data across its lifecycle.

It exists now because the product handles:

- student and tutor identity data
- educational and lesson-related data
- tutor verification materials
- public tutor profile data
- messages
- reports and trust-and-safety events
- billing references and payout state

This document should become the canonical privacy and retention architecture reference for later topics.

## 2. What This Document Does Not Redefine

This document does not replace the approved architecture or security docs.

It inherits from:

- `docs/architecture/architecture-discussion-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`

It does not define:

- final legal terms or privacy policy text
- final jurisdiction-specific compliance mapping
- detailed admin tooling
- detailed backup vendor procedures

Those should become later companion artifacts.

## 3. Core Recommendation

Mentor IB should use a conservative privacy architecture built around:

- collecting the minimum useful data
- separating public, private, and highly sensitive data clearly
- retaining data only as long as product, safety, or financial needs require it
- making public search removal part of deletion handling where relevant
- using explicit lifecycle rules that AI-driven implementation can follow without guessing

The practical rule is:

- minimize by default
- classify data explicitly
- retain intentionally
- delete in the right order
- deindex public data before assuming it is gone from the web

## 4. Privacy Architecture Style

This project is expected to be implemented largely by AI agents.

That means privacy rules should be:

- explicit
- field-aware
- lifecycle-aware
- default-conservative

The architecture should not rely on:

- informal assumptions about what is "probably safe"
- humans remembering which data is public
- deletion being handled ad hoc after features ship

## 5. Privacy Goals

The privacy architecture should protect:

- student and tutor personal identity data
- educational interaction history
- private lesson and conversation context
- tutor verification materials
- internal moderation and trust-and-safety data
- payment and payout references

It should also ensure:

- public data is intentionally public
- private data does not leak into public routes or search surfaces
- deletion requests have a clear execution path
- retention behavior is understandable and auditable

## 6. Data Classification Model

Every important data family should belong to an explicit privacy class.

## 6.1 Class P1: Public approved data

This is data intentionally meant for public routes and search visibility.

Examples:

- public tutor display name
- approved tutor bio
- approved subject coverage
- public profile photo
- approved trust proof that is intentionally visible

Rule:

- this data may be public only after explicit approval or explicit public-safe status

## 6.2 Class P2: Account and profile data

This is ordinary private product data tied to a user account.

Examples:

- email address
- onboarding state
- student profile preferences
- tutor internal profile details not meant for public display

Rule:

- private by default

## 6.3 Class P3: Operational educational data

This is data created through tutoring activity and product use.

Examples:

- lessons
- learning needs
- lesson reports
- booking trail
- internal matching outcomes

Rule:

- private and role-scoped

## 6.4 Class P4: Communications and trust data

This is sensitive operational data with safety implications.

Examples:

- messages
- reports
- blocks
- moderation notes

Rule:

- private, role-scoped, and often retention-sensitive

## 6.5 Class P5: High-sensitivity verification or financial linkage data

This is data that deserves the strictest handling.

Examples:

- tutor credential uploads
- verification documents
- payout account linkage references
- external payment identifiers

Rule:

- tightly scoped, minimally stored, and never public

## 7. Collection And Minimization Rules

## 7.1 Collect only what supports product value or safety

The system should not collect data "just in case" it becomes useful later.

## 7.2 Minimize high-risk fields

Avoid collecting high-risk sensitive fields unless a real feature requires them.

Examples of fields to avoid by default:

- unnecessary government identifiers
- unnecessary date of birth fields
- unnecessary address details
- rich freeform notes containing private background information

## 7.3 Minor-aware posture

Because IB students may be minors, the product should be especially conservative about collecting and exposing student information.

Default rule:

- do not collect more student personal data than necessary for tutoring operations
- do not expose student identifying information publicly

## 7.4 Metadata minimization rule

Public metadata, logs, and analytics should not contain more personal data than needed to operate the feature.

## 8. Public Data Architecture

## 8.1 Public routes are the only intended public surface

Only approved Class A public routes should expose public data.

## 8.2 Public DTO rule

Public routes must use explicit public DTOs and approved fields only.

## 8.3 Approval rule

Data should not become public simply because it exists in the database.

Tutor public profiles require explicit public-safe shaping and quality approval.

## 8.4 Searchability rule

Once public data is on an indexable route, it can be copied, cached, indexed, and summarized externally.

That means public exposure decisions should be treated as intentional publication decisions.

## 9. Identity Data Lifecycle

## 9.1 Canonical account model

Each authenticated person should map to one canonical `app_user`.

## 9.2 Identity storage rule

Identity data should stay minimal:

- auth identity in Supabase Auth
- canonical product identity in `app_users`
- role capability layered through product profile tables

## 9.3 Retention posture

Identity data may need to outlive an active session to support:

- account access
- billing records
- support history
- trust and safety decisions

But it should not survive indefinitely without purpose.

## 10. Student And Tutor Profile Lifecycle

## 10.1 Student profiles

Student profile data should remain private by default.

Recommended contents:

- learning preferences
- timezone
- minimal scheduling context
- product-use state

Avoid unnecessary biographical data.

## 10.2 Tutor profiles

Tutor profiles should be split conceptually into:

- private tutor account data
- private operational tutor data
- public approved tutor profile data

These should not be conflated.

## 10.3 Public tutor profile rule

Public tutor profile data should be removable from the public surface without requiring immediate destruction of all underlying private tutor account data.

That separation is important for:

- deindexing
- temporary unlisting
- trust and safety actions
- later account deletion handling

## 11. Lesson And Educational Data Lifecycle

## 11.1 Lessons and lesson history

Lessons are operational records and should be retained longer than transient UI state.

They support:

- product continuity
- dispute resolution
- tutor operations
- support context

## 11.2 Lesson reports

Lesson reports may contain more detailed educational context and should be treated as private educational records.

They should not be publicly exposed or casually duplicated into analytics or logs.

## 11.3 Learning needs and match history

Learning needs and match results can contain sensitive educational context.

They should be retained only as long as they support:

- active product use
- continuity
- support or safety review

Stale matching artifacts should not live forever without reason.

## 12. Messaging Retention Architecture

## 12.1 Message privacy rule

Messages are private operational communications.

They should never become part of the public surface.

## 12.2 Retention posture

Messages should be retained long enough to support:

- active tutoring continuity
- support review
- dispute handling
- block and report investigations

But the system should still define a retention decision instead of assuming "forever by default."

## 12.3 Deleted user rule

If an account is deleted or deactivated, the system should preserve message-thread integrity only as far as legitimate operational or safety needs require.

The architecture should support redaction, anonymization, or account-state labeling where full deletion would break records.

## 13. Reports, Blocks, And Moderation Retention

## 13.1 Report rule

Reports are safety-critical records and should outlive casual UI history if needed for trust and safety review.

## 13.2 Block rule

Block records should be retained long enough to ensure the block remains enforceable and auditable.

## 13.3 Moderation rule

Internal moderation notes should never be public and should have a tighter access boundary than ordinary operational data.

## 14. Payment And Payout Privacy Architecture

## 14.1 Keep sensitive payment data out of product storage

The product should store references and operational billing state, not raw payment instrument data.

## 14.2 Stripe object rule

Stripe should remain the system of record for payment-method details and sensitive billing internals.

Mentor IB should store only the minimum needed to:

- link product state to Stripe objects
- support receipts, reconciliation, and support

## 14.3 Retention posture

Billing and payout records may need longer retention than ordinary product records because of:

- accounting
- refunds and disputes
- audit and reconciliation

That means privacy deletion flows may need to separate:

- user-facing personal-profile deletion
- financial record retention required for legitimate business reasons

## 14.4 Redaction rule

When deletion or privacy requests affect Stripe-linked data, the architecture should support:

- deleting or deactivating unneeded customer links where appropriate
- using Stripe's redaction capabilities where needed

## 15. File And Storage Lifecycle

## 15.1 Storage classes

At minimum, storage should be divided conceptually into:

- public profile media
- private verification or credential files
- future private attachments

## 15.2 Ownership rule

Files should be owned through domain metadata, not only by bucket location.

That metadata should determine:

- who can access the file
- whether the file is public
- when the file should be deleted or retained

## 15.3 Deletion dependency rule

Supabase user deletion can fail if the user still owns storage objects.

That means user-deletion flows must account for:

- deleting or reassigning owned objects
- removing public objects from exposure before deleting the identity

## 15.4 Public media rule

Public tutor media should be removable from public routes and search surfaces before or alongside storage deletion.

## 16. Search And Public Removal Architecture

## 16.1 Public-search rule

Removing a record from the database is not enough if the route has already been publicly indexed.

## 16.2 Deindexing rule

When a public tutor profile or other public route should disappear, the system should support:

- removing it from sitemap eligibility
- changing route robots posture if needed
- removing or replacing the live public content

## 16.3 Search Console removal posture

For serious public-data removal events, the architecture should assume the team may need to use Search Console removal workflows in addition to changing the live site.

## 16.4 Redaction rule

Public documents or images must be properly redacted before publication.

The architecture should not assume that visually hidden data is safely removed.

## 17. Deletion And Erasure Architecture

## 17.1 Multi-step deletion rule

Deletion should be treated as a workflow, not a single table operation.

Recommended high-level sequence:

1. determine what must be retained for safety, billing, or legal reasons
2. remove public visibility and public indexability where relevant
3. delete or reassign storage objects as needed
4. remove or anonymize product-layer data according to policy
5. delete or deactivate auth identity as appropriate

## 17.2 Soft versus hard deletion rule

Different data families may require different deletion approaches:

- public routes may require immediate deindexing and eventual hard removal
- account records may require deactivation before full deletion
- safety records may require retention or restricted archival

## 17.3 Supabase auth user deletion rule

Because auth-user deletion and sign-out semantics are not the same, account-deletion flows should be explicit about:

- product-state deactivation
- auth-user deletion timing
- session invalidation expectations

## 17.4 External-system deletion rule

Deletion flows that touch Stripe or other external systems should define whether the system should:

- delete
- redact
- retain minimal references

depending on the data class and business need

## 18. Backup And Deleted-Data Posture

## 18.1 Backup realism rule

Data removed from the live product may still exist in provider backups for a period of time.

The architecture should be honest about that.

## 18.2 Product rule

Deletion flows should remove live access and active product use first.

Backup expiry and provider-level recovery windows should be treated as a separate operational layer.

## 18.3 Restoration rule

If restoration is ever needed, the architecture should avoid restoring deleted public visibility accidentally.

In other words:

- recovering data should not automatically republish it

## 19. Logging, Analytics, And Privacy

## 19.1 Logging minimization rule

Logs should not casually capture:

- message bodies
- verification document contents
- private lesson-report detail
- secrets

unless a specific operational reason justifies it

## 19.2 Analytics rule

Product analytics should prefer event-level product insight over unnecessary personal-data duplication.

## 19.3 Public-route analytics rule

Public-route discoverability measurement should not require copying private product data into analytics systems.

## 20. Retention Schedule Architecture

The exact schedule can be tuned later, but the architecture should start with a clear posture by data family.

## 20.1 Public approved profile data

Retention posture:

- retain while public listing is active
- deindex immediately when listing should no longer be public
- delete or archive underlying public content according to account and policy state

## 20.2 Account identity data

Retention posture:

- retain while account is active
- on deletion, remove or deactivate according to deletion workflow and legitimate operational needs

## 20.3 Lessons, lesson history, and lesson reports

Retention posture:

- retain for continuity, support, and dispute context
- review later for exact duration

## 20.4 Messages

Retention posture:

- retain for continuity and safety review
- review later for exact duration and anonymization behavior

## 20.5 Reports, blocks, and moderation data

Retention posture:

- retain longer than casual UI history when needed for safety and audit reasons

## 20.6 Credential and verification files

Retention posture:

- retain only while verification or trust processes require them
- delete when no longer needed for legitimate verification or audit purpose

## 20.7 Billing and payout references

Retention posture:

- retain according to legitimate financial and reconciliation needs

## 20.8 Logs and analytics

Retention posture:

- keep short by default unless a stronger operational reason exists

## 21. Data Export And Access Request Posture

## 21.1 Access rule

The architecture should support the ability to retrieve a user's own relevant product data in a structured way later.

## 21.2 Correction rule

The architecture should support correction of user-controlled profile data without requiring unsafe direct mutation of internal records.

## 21.3 Deletion-request rule

The architecture should support deletion workflows that are:

- explicit
- reviewable
- ordered

rather than a direct destructive action with no lifecycle controls

## 22. Privacy Decisions To Lock Now

These decisions are mature enough to lock now:

- data must be explicitly classified by public and privacy sensitivity
- public tutor profile data is a separate class from private tutor account data
- IB student data should be collected conservatively because minors may be involved
- public-route removal requires deindexing logic, not only row deletion
- deletion is a multi-step workflow, not a single delete call
- storage ownership must be considered before auth-user deletion
- financial records may need longer retention than general product data
- logs and analytics should minimize personal-data duplication
- AI-agent implementation should follow explicit lifecycle rules rather than inventing retention behavior

## 23. Decisions To Defer Slightly

These can be designed later as companion topics:

- exact retention durations by jurisdiction
- final legal-policy wording
- advanced DSAR workflow tooling
- exact backup retention documentation
- moderation-archive workflow details

## 24. Final Recommendation

Mentor IB should use a deliberate privacy architecture that separates:

- what is intentionally public
- what is private product data
- what is safety-critical
- what is financially required
- what should eventually be deleted or deindexed

The right practical model is:

- classify explicitly
- minimize by default
- publish intentionally
- delete in stages
- deindex public data when needed

## 25. Official Source Notes

This recommendation is informed by current official documentation for:

- Supabase user management and user deletion behavior
- Supabase object ownership and storage deletion behavior
- Supabase sign-out and session semantics
- Stripe customer deletion and redaction capabilities
- Google Search removal and redaction guidance
