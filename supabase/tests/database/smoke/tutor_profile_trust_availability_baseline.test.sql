begin;

select plan(24);

select has_table('public', 'subjects', 'subjects exists');
select has_table('public', 'subject_focus_areas', 'subject_focus_areas exists');
select has_table('public', 'languages', 'languages exists');
select has_table('public', 'video_media_providers', 'video_media_providers exists');
select has_table('public', 'tutor_subject_capabilities', 'tutor_subject_capabilities exists');
select has_table('public', 'tutor_language_capabilities', 'tutor_language_capabilities exists');
select has_table('public', 'tutor_credentials', 'tutor_credentials exists');
select has_table('public', 'schedule_policies', 'schedule_policies exists');
select has_table('public', 'availability_rules', 'availability_rules exists');
select has_table('public', 'availability_overrides', 'availability_overrides exists');

select has_column('public', 'tutor_profiles', 'public_slug', 'tutor_profiles exposes public_slug');
select has_column(
  'public',
  'tutor_profiles',
  'public_listing_status',
  'tutor_profiles exposes public_listing_status'
);
select has_column(
  'public',
  'tutor_profiles',
  'payout_readiness_status',
  'tutor_profiles exposes payout_readiness_status'
);

select col_is_unique(
  'public',
  'tutor_profiles',
  'public_slug',
  'tutor_profiles keeps public_slug unique when present'
);
select col_is_unique(
  'public',
  'schedule_policies',
  'tutor_profile_id',
  'schedule_policies stays one-to-one with tutor_profiles'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_subject_capabilities_scope_key'
  ),
  'tutor_subject_capabilities prevents duplicate tutor subject-focus rows'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_language_capabilities_scope_key'
  ),
  'tutor_language_capabilities prevents duplicate tutor language rows'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'tutor_credentials'
      and cls.relrowsecurity
  ),
  'tutor_credentials has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'availability_rules'
      and cls.relrowsecurity
  ),
  'availability_rules has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'subjects'
      and policyname = 'subjects_select_active'
  ),
  'subjects has an active-row read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_credentials'
      and policyname = 'tutor_credentials_select_self'
  ),
  'tutor_credentials has an owner read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'availability_overrides'
      and policyname = 'availability_overrides_select_self'
  ),
  'availability_overrides has an owner read policy'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_schedule_policies_updated_at'
  ),
  'schedule_policies keeps the shared updated_at trigger'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_profiles_intro_video_provider_fkey'
  ),
  'tutor_profiles intro_video_provider references video_media_providers'
);

select * from finish();
rollback;
