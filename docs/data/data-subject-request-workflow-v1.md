# Mentor IB Data Subject Request Workflow v1

**Date:** 2026-04-09
**Status:** Standalone data-layer workflow document for privacy request intake, verification, access/export, correction, deletion/erasure, restriction, objection, provider coordination, and AI-agent-safe execution rules
**Scope:** operational handling of data subject requests, request record shape, identity verification, role-scope classification, minor/guardian cases, legal and safety holds, public deindexing, storage cleanup, provider follow-up, response artifacts, audit trail, and implementation review rules

## 1. Why This Document Exists

Mentor IB already has a field-level retention and erasure map.

What was still missing was the request workflow:

**When a real student, tutor, guardian, or account holder asks for access, correction, export, deletion, or restriction, what operational path should the product follow?**

Without this workflow, implementation can drift into:

- treating deletion as a single auth-user delete
- answering privacy requests from normal support notes with no due date
- exporting too much internal data
- forgetting to remove public tutor profile exposure before deleting private data
- deleting records that are needed for payments, disputes, moderation, or safety
- leaving storage objects, projections, cache, sitemap eligibility, or external provider references behind
- making AI agents infer legal/privacy behavior from table names instead of following an explicit process

This document exists to prevent that.

## 2. Why This Lives In `docs/data`

This document belongs in `docs/data` because request handling must execute against concrete product data, DTO boundaries, retention rules, projections, storage references, and provider records.

It is the direct companion to:

- `docs/data/data-retention-erasure-field-map-v1.md`
- `docs/data/database-observability-and-maintenance-v1.md`
- `docs/data/database-schema-outline-v1.md`
- `docs/data/auth-and-authorization-matrix-v1.md`
- `docs/data/database-rls-boundaries-v1.md`
- `docs/data/data-dto-and-query-boundary-map-v1.md`
- `docs/data/integration-idempotency-model-v1.md`
- `docs/data/database-change-review-checklist-v1.md`
- `docs/data/api-and-server-action-contracts-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`

It inherits higher-level privacy and compliance posture from:

- `docs/architecture/privacy-and-data-retention-architecture-v1.md`
- `docs/architecture/compliance-and-regulatory-posture-v1.md`
- `docs/architecture/security-architecture-v1.md`
- `docs/architecture/admin-and-moderation-architecture-v1.md`
- `docs/architecture/file-and-media-architecture-v1.md`
- `docs/architecture/message-architecture-v1.md`
- `docs/architecture/meeting-and-calendar-architecture-v1.md`
- `docs/architecture/seo-app-architecture-v1.md`
- `docs/architecture/search-console-and-observability-architecture-v1.md`

## 3. What This Document Does Not Redefine

This document does not replace:

- final legal advice
- final privacy policy text
- final jurisdiction-specific retention durations
- final data processing agreement review
- final vendor/subprocessor inventory
- exact admin UI implementation
- exact SQL or TypeScript implementation

It defines the product and data workflow posture that future implementation should preserve.

If there is a conflict:

- field-level lifecycle actions come from `docs/data/data-retention-erasure-field-map-v1.md`
- public deindexing and Search Console behavior come from the SEO architecture docs
- role authorization comes from the auth/RLS docs
- DTO output rules come from `docs/data/data-dto-and-query-boundary-map-v1.md`
- incident handling comes from `docs/architecture/observability-and-incident-architecture-v1.md`

## 4. Core Recommendation

Mentor IB should implement data subject requests as a **durable, reviewed, role-scoped workflow**.

The practical rule is:

1. receive the request through a clear channel
2. create a restricted request record
3. verify requester identity with minimal extra data
4. classify request type and role scope
5. check legal, safety, financial, moderation, and dispute holds
6. execute the approved access, correction, export, deletion, restriction, or objection workflow
7. update projections, storage, caches, public routes, and provider references
8. send a clear response or denial reason
9. keep only a minimal restricted audit record

Do not implement privacy requests as ad hoc support notes or one-off SQL scripts.

## 5. Request Types

Use these request types consistently in implementation.

## 5.1 `access_request`

A request to know what personal data Mentor IB processes about the person.

This is broader than data portability.

It can include:

- categories of data
- purposes
- recipients or provider categories
- retention posture
- relevant copies of personal data where safe

Do not include:

- another person's private data
- raw internal security secrets
- raw payment instrument data
- internal-only moderation reasoning that would compromise safety or rights of others without review
- raw system logs unless there is a clear reviewed reason

## 5.2 `export_or_portability_request`

A request for a machine-usable copy of personal data the requester provided or generated through automated product use, where the product posture supports portability.

Default export formats should be:

- JSON for structured account/product data
- CSV for table-like histories where useful

Do not use PDF as the only portability format.

## 5.3 `correction_request`

A request to correct inaccurate, incomplete, or stale personal data.

Examples:

- display name correction
- profile information correction
- timezone or language correction
- tutor profile fact correction

Some corrections should be self-serve.

Others require review because they affect:

- public tutor claims
- credential/trust proof
- lesson history
- payment records
- moderation records
- reliability events

## 5.4 `deletion_or_erasure_request`

A request to delete, erase, anonymize, or deactivate personal data.

This does not mean every row must be hard-deleted.

The workflow should apply the action vocabulary from `docs/data/data-retention-erasure-field-map-v1.md`:

- `deindex_and_hide`
- `redact_field`
- `anonymize_link`
- `restricted_archive`
- `hard_delete`
- `rebuild_or_purge_projection`

## 5.5 `restriction_request`

A request to restrict processing.

In practice, this can mean:

- retain a record but stop non-essential processing
- freeze a disputed field while accuracy is reviewed
- stop using a disputed item in matching, public display, analytics, or marketing

Restriction is not the same as deletion.

## 5.6 `objection_request`

A request to stop a particular processing activity.

Most likely MVP cases:

- stop marketing communications
- object to optional analytics where applicable
- object to a public-facing profile claim or review use

Marketing objection should be handled as an immediate suppression path, not as a generic support preference.

## 5.7 `guardian_or_minor_request`

A request from a parent or guardian for a learner's data, or a request connected to actual knowledge that a learner is under 13.

This needs extra verification and extra caution.

Do not disclose a student's data to an adult merely because the adult claims to be a guardian.

## 5.8 `public_removal_request`

A request to remove public tutor data, review text, profile media, intro video references, or publicly indexed content.

This can overlap with deletion, correction, safety, or moderation.

Public removal should be treated as urgent because public content can be crawled, cached, and summarized outside the product.

## 6. Request Channels

MVP request channels should be simple and visible.

Recommended channels:

- authenticated account settings request path
- public support/privacy email or form
- internal admin-created request record when support receives a request in another channel

Do not require a person to create a new account only to submit a privacy request.

If the person already has an account, it is acceptable to prefer an authenticated path for higher-confidence verification.

## 7. Deadline Posture

This is not final legal advice, but implementation should preserve deadline readiness.

Default product posture:

- create `received_at` immediately when the request is received
- set `due_at` from a configurable policy, not hardcoded UI copy
- use a conservative default operational target of 30 calendar days for GDPR-style handling
- support 45 calendar day handling where a CCPA-style posture applies
- support recorded extensions when complexity or request volume justifies it
- notify the requester within the original response window if more time is needed

Do not:

- leave requests in an inbox with no due date
- silently restart the clock when a request moves between tools
- hardcode one jurisdictional deadline into domain logic as if it applies everywhere forever

## 8. Recommended Request Record

The implementation should include a restricted operational record, conceptually `data_subject_requests`.

Suggested fields:

- `id`
- `request_type`
- `request_status`
- `source_channel`
- `received_at`
- `due_at`
- `extended_due_at`
- `extension_reason`
- `requester_app_user_id`
- `requester_email_hash`
- `subject_app_user_id`
- `subject_email_hash`
- `relationship_to_subject`
- `role_scope`
- `jurisdiction_hint`
- `verification_status`
- `verification_method`
- `verified_at`
- `hold_status`
- `hold_reason_summary`
- `execution_plan_summary`
- `response_status`
- `response_sent_at`
- `closed_at`
- `closure_reason`
- `assigned_operator_id`
- `last_reviewed_at`

Rules:

- store minimal request text
- avoid storing raw identity documents by default
- hash email fields where exact value is not required for lookup
- restrict access to authorized internal operators
- never expose this record through public or ordinary role DTOs

## 9. Request Status Model

Use a small status set.

Recommended statuses:

- `received`
- `needs_verification`
- `verified`
- `triage_in_progress`
- `blocked_by_hold`
- `execution_in_progress`
- `waiting_on_requester`
- `waiting_on_provider`
- `ready_for_response`
- `completed`
- `partially_completed`
- `denied`
- `cancelled`

Rules:

- every terminal status should have a reason
- denial should include a reviewed reason category
- partial completion should identify what was completed and what was retained or withheld
- status changes should be auditable

## 10. Identity Verification

Verification should be proportional.

Preferred verification paths:

- authenticated in-account request
- magic-link verification to the account email
- existing account session plus step-up confirmation for sensitive actions
- verified guardian workflow for minor-related requests

Rules:

- ask only for information needed to confirm identity or authority
- use verification data only for verification
- do not ask for government ID by default
- do not send sensitive exports to an unverified email
- do not disclose whether an email exists in the system to unauthenticated requesters when that would create enumeration risk

If verification fails:

- do not execute access, export, correction, or deletion
- record the reason narrowly
- respond with a safe, non-enumerating message where appropriate

## 11. Role-Scope Classification

A single account can have multiple product roles.

Request handling must classify scope before execution.

Supported role scopes:

- `student_scope`
- `tutor_scope`
- `payer_scope`
- `guardian_scope`
- `admin_scope`
- `multi_role_scope`
- `unknown_or_unverified_scope`

Rules:

- a student data request should not automatically delete tutor public data on the same account unless the request is full account deletion or scope is clarified
- a tutor deletion request should immediately address public tutor exposure if the public profile is in scope
- an admin deletion request must preserve privileged action audit trails where required
- payer-related requests must account for financial records and Stripe references
- guardian requests require proof of authority before student data is disclosed

## 12. Hold Review

Before deletion, erasure, or restriction, check whether any legitimate hold applies.

Potential holds:

- open payment dispute
- refund or chargeback window
- tax, accounting, or reconciliation record need
- open trust and safety case
- abuse report or block enforcement need
- legal claim or threatened claim
- platform security investigation
- active lesson obligation
- pending tutor payout or earnings reconciliation
- underage safety concern

Hold outcomes:

- `no_hold`
- `partial_hold`
- `full_hold`
- `manual_legal_review_required`

Rules:

- a hold should block only the data necessary for the purpose
- public exposure should still be removed unless there is an exceptional reviewed reason not to
- retained data should become restricted where possible
- the requester response should explain the retained category at a high level without revealing sensitive internal investigations

## 13. Access Request Workflow

Use this workflow for `access_request`.

1. Create restricted request record.
2. Verify requester identity.
3. Confirm subject and role scope.
4. Locate personal data across canonical tables, projections, storage metadata, provider references, notifications, and support/moderation records.
5. Exclude or redact other people's personal data.
6. Exclude secrets, security internals, and unsafe internal-only details.
7. Summarize provider categories and retention posture.
8. Prepare a secure response package.
9. Record response sent and close request.

Access output should be understandable.

It should not be a raw database dump.

## 14. Export And Portability Workflow

Use this workflow for `export_or_portability_request`.

1. Verify requester identity.
2. Identify whether the requested data fits export/portability posture.
3. Export user-provided and automated-use data in structured formats.
4. Separate public profile data, private profile data, learning needs, lessons, messages, and notification preferences by section.
5. Exclude derived internal scoring, moderation reasoning, and provider secrets unless reviewed as required access data.
6. Generate a short-lived export artifact.
7. Deliver through a secure authenticated route or verified email flow.
8. Delete the export artifact after a short retention period.

Recommended artifact rules:

- not public
- not indexed
- short-lived
- access logged
- no raw credential files unless explicitly reviewed
- no other participant message content beyond what is valid to provide

## 15. Correction Workflow

Use this workflow for `correction_request`.

1. Verify requester identity.
2. Classify whether the field is user-controlled, public-reviewed, operational, financial, or moderation-related.
3. Apply self-serve correction where safe.
4. Route public tutor claim corrections through tutor profile review if public trust language is affected.
5. Route payment, lesson status, review, reliability, or moderation corrections through manual review.
6. Refresh affected DTOs, projections, public metadata, and sitemap eligibility if the corrected field is public or search-relevant.
7. Record the correction outcome.

Do not:

- allow users to rewrite historical lesson/payment state directly
- allow tutors to self-approve public verification claims
- update public structured data without updating the canonical source and public projection

## 16. Deletion And Erasure Workflow

Use this workflow for `deletion_or_erasure_request`.

1. Verify requester identity.
2. Confirm account and role scope.
3. Check holds.
4. Immediately delist in-scope public tutor/profile/review/media surfaces where appropriate.
5. Remove sitemap eligibility and public structured data.
6. Purge or refresh public projections and cache tags.
7. Remove or detach public media and external video references.
8. Delete or redact private storage objects according to the retention field map.
9. Redact high-risk free-text fields where no retention purpose remains.
10. Anonymize links where row integrity is needed.
11. Retain restricted financial, safety, moderation, or audit records only where purpose remains.
12. Delete stale match artifacts, notifications, and transient job payloads when safe.
13. Redact meeting URLs when their purpose has ended.
14. Execute provider follow-up tasks.
15. Delete, soft-delete, or deactivate Supabase Auth identity only after product/storage dependencies are handled.
16. Rebuild or verify projections.
17. Record a minimal restricted audit trail.
18. Send completion or partial-completion response.

Do not:

- delete `auth.users` first
- use database deletion as the only public removal mechanism
- leave public tutor rows in projections after delisting
- assume Supabase Storage objects are deleted by SQL row deletion
- assume provider backups disappear immediately

## 17. Restriction And Objection Workflow

Use this workflow for `restriction_request` or `objection_request`.

Likely MVP actions:

- suppress marketing communications
- stop optional analytics where supported
- remove disputed data from public display while reviewed
- freeze or mark a disputed field
- suppress use of a field in matching if the field is disputed and non-essential

Rules:

- transactional communications should remain separate from marketing suppression
- lesson, payment, safety, and support processing may continue where necessary
- objection to direct marketing should be treated as a high-confidence suppression task
- restriction should be visible to services that might otherwise use the data

## 18. Minor And Guardian Workflow

Mentor IB is minor-aware but should not support general self-service under-13 accounts for MVP.

If the product receives a request involving a minor:

1. identify whether the subject is the learner, guardian, tutor, or payer
2. verify the requester's authority before disclosure
3. avoid collecting more verification data than necessary
4. do not disclose student information to an unverified adult
5. handle actual knowledge of under-13 self-service use through the approved compliance posture
6. preserve safety records where necessary
7. keep student public exposure at zero by default

If actual knowledge indicates an under-13 self-service account exists without an approved guardian/institution path:

- restrict account use
- stop non-essential processing
- route to guardian or support handling
- delete or retain data according to lawful/safety posture and final policy

## 19. Public Removal And Deindexing

Public removal is a special fast path.

Use it when a request affects:

- public tutor profile
- public tutor image
- public intro video reference
- public review text
- public trust proof
- sitemap eligibility
- JSON-LD or metadata

Required actions:

- set canonical publication state to non-public or removed
- refresh public projection
- invalidate public cache
- remove sitemap eligibility
- remove structured data output
- remove public media/video references
- use Search Console removal workflow for sensitive removals where appropriate
- record completion in the request workflow

Do not wait for full account deletion to remove unsafe public exposure.

## 20. Provider Coordination

Provider follow-up should be explicit and minimal.

Potential provider surfaces:

- Supabase Auth
- Supabase Storage
- Stripe
- Resend or email delivery provider
- Vercel logs and hosting telemetry
- analytics provider if enabled
- Google Search Console for removal workflows
- YouTube, Vimeo, or Loom only as external media references

Rules:

- Mentor IB controls its own references to external videos, not provider-side media owned by the tutor
- Supabase Storage objects must be deleted through the Storage API, not only SQL metadata deletion
- Stripe data should be retained, deleted, or redacted according to financial and provider capability review
- email providers may retain delivery logs according to provider policy; do not store private content in email metadata
- logs and analytics should be minimized so request handling is smaller
- provider tasks should have durable status if asynchronous

## 21. Export Artifact Security

Access and export artifacts are sensitive.

Rules:

- generate artifacts server-side
- store in a private bucket or equivalent restricted storage
- use short-lived access
- require authenticated or verified access
- log access to the artifact
- expire and delete artifacts after the configured retention window
- do not email large sensitive exports as unprotected attachments by default
- do not include magic links, auth secrets, raw payment instruments, credential file paths, or private storage paths

## 22. Audit Trail

Every request should leave a minimal restricted audit trail.

Record:

- request id
- request type
- received date
- verified status
- role scope
- hold status
- high-level action summary
- response status
- completion date
- operator id or system job id

Do not record:

- full message bodies unnecessarily
- raw credential files
- raw identity documents unless separately approved
- payment instrument data
- full export contents
- excessive private request text

The audit trail exists to prove process and protect users.

It should not become a second copy of the sensitive data being deleted.

## 23. Internal Admin UX Requirements

The eventual internal UI should support:

- request queue by due date and status
- verification status
- role scope
- hold checklist
- public-removal checklist
- provider task checklist
- secure export artifact state
- response template state
- audit event history

Do not build a casual free-form admin text box as the only privacy request system.

## 24. Testing Requirements

When implemented, test at least these scenarios:

- verified student access request
- verified tutor public-profile deletion request
- multi-role account deletion request
- unverified email request that should not disclose account existence
- guardian request that needs authority verification
- deletion request with active payment or safety hold
- public tutor delisting removes projection, sitemap eligibility, metadata, and cache exposure
- private credential file cleanup uses storage deletion path
- export artifact expires and is not public
- request audit trail does not store deleted data contents

## 25. AI-Agent Implementation Rules

Agents should:

- create durable request records before executing privacy work
- classify request type and role scope before touching data
- use the retention field map for field-level actions
- remove public exposure early
- check holds before destructive deletion
- keep provider follow-up explicit and inspectable
- keep export artifacts private and short-lived
- avoid storing excessive request text or identity evidence
- preserve minimal audit trails without duplicating deleted content
- update tests for request workflow behavior when implemented

Agents should not:

- implement account deletion as `delete auth user` only
- export raw database rows directly to users
- disclose other users' message or lesson data without review
- bypass verification because the request came from an email address
- delete financial, safety, moderation, or audit records without a hold review
- rely on cache expiry to remove public exposure
- delete Supabase Storage metadata by SQL and assume the file is gone
- hardcode final legal deadline or legal-response text into domain code

## 26. Decisions To Lock Now

The system should lock the following decisions now:

- data subject requests are durable restricted workflows, not support notes
- deletion is role-scoped and hold-aware
- public exposure removal is an early step, not a final cleanup
- access/export responses are DTO-safe and reviewed, not raw database dumps
- export artifacts are private, short-lived, and access-controlled
- guardian/minor requests require authority verification before disclosure
- provider follow-up must be explicit where product data leaves Mentor IB
- request audit trails must be minimal and restricted
- exact legal wording and jurisdiction-specific deadlines remain policy/legal review tasks

## 27. Implementation Handoff Status

The planning handoff docs now exist:

- `docs/planning/agent-implementation-decision-index-v1.md`
- `docs/data/privacy-policy-data-inventory-handoff-v1.md`
- `docs/planning/implementation-task-template-v1.md`

The next step is to use them to create concrete implementation tasks, not to add more broad data-layer planning docs by default.

## 28. Final Recommendation

Mentor IB should handle privacy requests as a calm, explicit operational workflow.

The clean operating model is:

- verify identity
- classify scope
- check holds
- execute request-specific actions
- remove public exposure early
- update projections, storage, providers, and caches
- respond clearly
- preserve only a minimal restricted audit trail

That gives future AI agents a safe path for privacy-sensitive implementation without asking them to invent legal or lifecycle behavior from scratch.

## 29. Official Source Notes

The guidance above is aligned with current official documentation for:

- European Commission guidance on handling data protection rights requests: `https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/dealing-citizens/how-should-requests-individuals-exercising-their-data-protection-rights-be-dealt_en`
- European Data Protection Board SME guide on data subject rights: `https://www.edpb.europa.eu/sme-data-protection-guide/respect-individuals-rights_en`
- European Commission overview of individual GDPR rights: `https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en`
- European Commission guidance on data portability: `https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/dealing-citizens/can-individuals-ask-have-their-data-transferred-another-organisation_en`
- California Attorney General CCPA rights guidance: `https://www.oag.ca.gov/privacy/ccpa`
- FTC COPPA rule page: `https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa`
- FTC COPPA FAQ: `https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions`
- Supabase Auth user management: `https://supabase.com/docs/guides/auth/managing-user-data`
- Supabase Auth admin user deletion: `https://supabase.com/docs/reference/javascript/auth-admin-deleteuser`
- Supabase Storage object deletion: `https://supabase.com/docs/guides/storage/management/delete-objects`
