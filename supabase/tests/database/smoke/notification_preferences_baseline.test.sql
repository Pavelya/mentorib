begin;

select plan(18);

select has_table(
  'public',
  'notification_preferences',
  'notification_preferences table exists'
);

select has_column(
  'public',
  'notification_preferences',
  'in_app_enabled',
  'notification_preferences exposes an in-app channel toggle'
);

select has_column(
  'public',
  'notification_preferences',
  'email_enabled',
  'notification_preferences exposes an email channel toggle'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'notification_preferences_app_user_category_key'
  ),
  'notification_preferences keeps one row per (user, category) pair'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'notification_preferences_category_chk'
  ),
  'notification_preferences keeps controlled category values'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_notification_preferences_updated_at'
  ),
  'notification_preferences keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'notification_preferences'
      and cls.relrowsecurity
  ),
  'notification_preferences has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_preferences'
      and policyname = 'notification_preferences_select_self'
  ),
  'notification_preferences has an owner read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_preferences'
      and policyname = 'notification_preferences_insert_self'
  ),
  'notification_preferences has an owner insert policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_preferences'
      and policyname = 'notification_preferences_update_self'
  ),
  'notification_preferences has an owner update policy'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_preferences'
      and cmd = 'DELETE'
  ),
  'notification_preferences has no delete policy (cascade-only removal)'
);

-- RLS verb coverage: owner can write and read their own row; non-owner cannot.

-- Seed two app users via the service role context (current role for tests is
-- a superuser-equivalent and bypasses RLS, so insert directly).
insert into public.app_users (id, auth_user_id, email, account_status, onboarding_state, timezone)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'owner@mentorib.test',
    'active',
    'complete',
    'UTC'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'other@mentorib.test',
    'active',
    'complete',
    'UTC'
  )
on conflict (id) do nothing;

-- Owner perspective: simulate auth.uid() = owner via local override.
set local role authenticated;
set local "request.jwt.claim.sub" to '11111111-1111-4111-8111-111111111111';

select lives_ok(
  $$insert into public.notification_preferences (app_user_id, notification_category, in_app_enabled, email_enabled)
    values ('11111111-1111-4111-8111-111111111111', 'reviews', false, true)$$,
  'owner can insert their own preference row'
);

select is(
  (select count(*) from public.notification_preferences where app_user_id = '11111111-1111-4111-8111-111111111111')::int,
  1,
  'owner can read back their inserted row'
);

select lives_ok(
  $$update public.notification_preferences
       set in_app_enabled = true
     where app_user_id = '11111111-1111-4111-8111-111111111111'
       and notification_category = 'reviews'$$,
  'owner can update their own preference row'
);

-- Non-owner perspective: cannot read or insert someone else's row.
set local "request.jwt.claim.sub" to '22222222-2222-4222-8222-222222222222';

select is(
  (select count(*) from public.notification_preferences where app_user_id = '11111111-1111-4111-8111-111111111111')::int,
  0,
  'non-owner cannot read another user''s preference row'
);

select throws_ok(
  $$insert into public.notification_preferences (app_user_id, notification_category)
    values ('11111111-1111-4111-8111-111111111111', 'lesson_reminders')$$,
  '42501',
  null,
  'non-owner is blocked from inserting on behalf of another user'
);

-- Anonymous perspective: every verb is denied.
set local role anon;
reset "request.jwt.claim.sub";

select is(
  (select count(*) from public.notification_preferences)::int,
  0,
  'anonymous cannot read any preference rows'
);

reset role;

select * from finish();
rollback;
