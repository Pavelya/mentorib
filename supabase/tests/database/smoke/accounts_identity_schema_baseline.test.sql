begin;

select plan(16);

select has_table('public', 'app_users', 'app_users exists');
select has_table('public', 'user_roles', 'user_roles exists');
select has_table('public', 'student_profiles', 'student_profiles exists');
select has_table('public', 'tutor_profiles', 'tutor_profiles exists');

select col_is_pk('public', 'app_users', 'id', 'app_users keeps a UUID primary key');
select col_is_unique('public', 'app_users', 'auth_user_id', 'app_users enforces one auth identity per app user');
select col_is_unique('public', 'student_profiles', 'app_user_id', 'student_profiles stays one-to-one with app_users');
select col_is_unique('public', 'tutor_profiles', 'app_user_id', 'tutor_profiles stays one-to-one with app_users');

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'user_roles_app_user_id_role_key'
  ),
  'user_roles keeps one row per user-role capability'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'app_users'
      and cls.relrowsecurity
  ),
  'app_users has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'user_roles'
      and cls.relrowsecurity
  ),
  'user_roles has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_users'
      and policyname = 'app_users_select_self'
  ),
  'app_users has a self-read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'user_roles_select_self'
  ),
  'user_roles has a self-read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_profiles'
      and policyname = 'student_profiles_select_self'
  ),
  'student_profiles has a self-read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_profiles'
      and policyname = 'tutor_profiles_select_self'
  ),
  'tutor_profiles has a self-read policy'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pronamespace = 'public'::regnamespace
  ),
  'shared updated_at trigger function exists'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'app_users'
      and column_name = 'onboarding_state'
  ),
  'app_users exposes onboarding_state for auth and setup routing'
);

select * from finish();
rollback;
