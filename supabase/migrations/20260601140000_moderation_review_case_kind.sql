-- Extend `moderation_cases.case_kind` to include `review` for
-- `P2-ADMIN-TRUST-001` (tutor-review moderation + report-a-review).
--
-- A user who finds a published tutor review inappropriate can report it
-- from the public profile. That report opens a `review` moderation case
-- (subject = the tutor profile the review lives on, with the reported
-- review id captured in `triggering_event_id`) so it joins the shared
-- case lifecycle (`queued` -> `under_review` -> `resolved`/`dismissed`)
-- via `moderation-case-service.ts` instead of forking a parallel table.
-- The hide/redact decision itself flips `reviews.review_status` and is
-- audited separately via the `review.set_status` action key.
--
-- This migration only widens the CHECK constraint; no new columns,
-- indexes, RLS, or DTO changes. The shipped admin-only RLS posture
-- (set in `20260526120000_admin_foundations_baseline.sql`) continues
-- to apply.

alter table public.moderation_cases
  drop constraint moderation_cases_case_kind_chk;

alter table public.moderation_cases
  add constraint moderation_cases_case_kind_chk check (
    case_kind in (
      'report',
      'block',
      'lesson_issue',
      'public_content_takedown',
      'finance_intervention',
      'review'
    )
  );
