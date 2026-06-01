begin;

select plan(2);

-- The migration `20260601140000_moderation_review_case_kind.sql` widens the
-- `moderation_cases.case_kind` CHECK constraint to allow the `review` value
-- used by the report-a-review surface (P2-ADMIN-TRUST-001). The shared
-- admin-only RLS posture from `20260526120000_admin_foundations_baseline.sql`
-- continues to apply.

insert into public.app_users (id, auth_user_id, email, account_status, onboarding_state, timezone)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'review-report@mentorib.test',
  'active',
  'complete',
  'UTC'
)
on conflict (id) do nothing;

select lives_ok(
  $$insert into public.moderation_cases (case_kind, subject_kind, subject_id)
    values (
      'review',
      'tutor_profile',
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    )$$,
  'review case_kind is accepted'
);

select throws_ok(
  $$insert into public.moderation_cases (case_kind, subject_kind, subject_id)
    values (
      'not_a_kind',
      'tutor_profile',
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    )$$,
  '23514',
  null,
  'unknown case_kind remains rejected after migration'
);

select * from finish();
rollback;
