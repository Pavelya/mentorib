begin;

select plan(2);

-- The migration `20260529120000_moderation_finance_intervention_case_kind.sql`
-- widens the `moderation_cases.case_kind` CHECK constraint to allow the
-- `finance_intervention` value used by the admin user-detail surface
-- (P2-OPS-002). The shared admin-only RLS posture from
-- `20260526120000_admin_foundations_baseline.sql` continues to apply.

insert into public.app_users (id, auth_user_id, email, account_status, onboarding_state, timezone)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'finance-intervention@mentorib.test',
  'active',
  'complete',
  'UTC'
)
on conflict (id) do nothing;

select lives_ok(
  $$insert into public.moderation_cases (case_kind, subject_kind, subject_id)
    values (
      'finance_intervention',
      'app_user',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
    )$$,
  'finance_intervention case_kind is accepted'
);

select throws_ok(
  $$insert into public.moderation_cases (case_kind, subject_kind, subject_id)
    values (
      'unknown_kind',
      'app_user',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
    )$$,
  '23514',
  null,
  'unknown case_kind remains rejected after migration'
);

select * from finish();
rollback;
