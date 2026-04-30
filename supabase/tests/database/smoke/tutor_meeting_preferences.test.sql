begin;

select plan(6);

select has_table(
  'public',
  'tutor_meeting_preferences',
  'tutor_meeting_preferences exists'
);

select col_is_unique(
  'public',
  'tutor_meeting_preferences',
  'tutor_profile_id',
  'tutor_meeting_preferences stays one-to-one with tutor_profiles'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_meeting_preferences_default_link_consistency_chk'
  ),
  'tutor_meeting_preferences ties provider and url together'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_meeting_preferences_default_meeting_url_https_chk'
  ),
  'tutor_meeting_preferences requires https meeting urls'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.tutor_meeting_preferences'::regclass
  ),
  'tutor_meeting_preferences has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_meeting_preferences'
      and policyname = 'tutor_meeting_preferences_select_self'
  ),
  'tutor_meeting_preferences has the self-read policy'
);

select * from finish();
rollback;
