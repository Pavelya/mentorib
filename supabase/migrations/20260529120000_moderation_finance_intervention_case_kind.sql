-- Extend `moderation_cases.case_kind` to include `finance_intervention`
-- for `P2-OPS-002`.
--
-- The admin user-detail page records payout-hold and refund-anomaly
-- notes as `moderation_cases` rows. These never carry a Stripe write —
-- they capture intent only — so they reuse the shared case lifecycle
-- (`queued` → `under_review` → `resolved`/`dismissed`) via
-- `moderation-case-service.ts` instead of forking a parallel table.
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
      'finance_intervention'
    )
  );
