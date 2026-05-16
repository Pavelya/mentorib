begin;

select plan(7);

select has_column(
  'public',
  'tutor_profiles',
  'self_paused_at',
  'tutor_profiles carries the self_paused_at timestamp introduced by P2-PROFILE-001'
);

select col_type_is(
  'public',
  'tutor_profiles',
  'self_paused_at',
  'timestamp with time zone',
  'self_paused_at is a timestamptz column'
);

select col_is_null(
  'public',
  'tutor_profiles',
  'self_paused_at',
  'self_paused_at is nullable so unlisted profiles without a tutor-initiated pause stay NULL'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'tutor_profiles'
      and indexname = 'tutor_profiles_self_paused_at_idx'
  ),
  'tutor_profiles_self_paused_at_idx index exists for filtered lookups'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'tutor_profiles'
      and cls.relrowsecurity
  ),
  'tutor_profiles retains row level security after the migration'
);

-- Seed an owner row through the test role (service-role bypasses RLS).
insert into public.app_users (id, auth_user_id, email, account_status, onboarding_state, timezone)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'paused-owner@mentorib.test',
  'active',
  'complete',
  'UTC'
)
on conflict (id) do nothing;

insert into public.tutor_profiles (id, app_user_id, application_status, public_listing_status, self_paused_at)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'approved',
  'not_listed',
  now()
)
on conflict (id) do nothing;

-- Anonymous role can neither write nor read self_paused_at.
set local role anon;

select throws_ok(
  $$update public.tutor_profiles
      set self_paused_at = now()
      where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,
  '42501',
  null,
  'anonymous cannot update tutor_profiles.self_paused_at directly'
);

-- Authenticated (signed-in non-owner) role is also denied write authority on
-- the column. tutor_profiles has only a SELECT-self policy; no INSERT/UPDATE
-- policies exist, so authenticated writes resolve to 42501.
set local role authenticated;
set local "request.jwt.claim.sub" to 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

select throws_ok(
  $$update public.tutor_profiles
      set self_paused_at = now()
      where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,
  '42501',
  null,
  'signed-in tutors cannot write self_paused_at directly; writes flow through service-role only'
);

reset role;
reset "request.jwt.claim.sub";

select * from finish();
rollback;
