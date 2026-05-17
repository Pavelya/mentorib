begin;

select plan(30);

-- Table shape -------------------------------------------------------

select has_table(
  'public',
  'tutor_public_media_assets',
  'tutor_public_media_assets table exists'
);

select has_column(
  'public',
  'tutor_public_media_assets',
  'tutor_profile_id',
  'tutor_public_media_assets carries tutor_profile_id'
);

select has_column(
  'public',
  'tutor_public_media_assets',
  'media_role',
  'tutor_public_media_assets carries media_role'
);

select has_column(
  'public',
  'tutor_public_media_assets',
  'storage_object_path',
  'tutor_public_media_assets carries storage_object_path'
);

select has_column(
  'public',
  'tutor_public_media_assets',
  'alt_text',
  'tutor_public_media_assets carries alt_text'
);

select has_column(
  'public',
  'tutor_public_media_assets',
  'publication_status',
  'tutor_public_media_assets carries publication_status'
);

select has_column(
  'public',
  'tutor_public_media_assets',
  'sort_order',
  'tutor_public_media_assets carries sort_order'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_public_media_assets_media_role_chk'
  ),
  'tutor_public_media_assets restricts media_role to the controlled vocabulary'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_public_media_assets_publication_status_chk'
  ),
  'tutor_public_media_assets restricts publication_status to the documented states'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_tutor_public_media_assets_updated_at'
  ),
  'tutor_public_media_assets keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'tutor_public_media_assets'
      and indexname = 'tutor_public_media_assets_one_published_photo_per_tutor_idx'
  ),
  'tutor_public_media_assets has the partial unique index for one published profile photo per tutor'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'tutor_public_media_assets'
      and cls.relrowsecurity
  ),
  'tutor_public_media_assets has row level security enabled'
);

-- tutor_profiles intro-video state additions -----------------------

select has_column(
  'public',
  'tutor_profiles',
  'intro_video_publication_status',
  'tutor_profiles carries the new intro_video_publication_status column'
);

select has_column(
  'public',
  'tutor_profiles',
  'intro_video_last_validated_at',
  'tutor_profiles carries the new intro_video_last_validated_at column'
);

select col_type_is(
  'public',
  'tutor_profiles',
  'intro_video_last_validated_at',
  'timestamp with time zone',
  'intro_video_last_validated_at is a timestamptz column'
);

select col_is_null(
  'public',
  'tutor_profiles',
  'intro_video_last_validated_at',
  'intro_video_last_validated_at is nullable until a publication-state subtask validates the URL'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_profiles_intro_video_publication_status_chk'
  ),
  'tutor_profiles restricts intro_video_publication_status to (hidden, published)'
);

-- video_media_providers seed ---------------------------------------

select is(
  (select count(*) from public.video_media_providers where provider_key in ('youtube', 'vimeo', 'loom') and is_active)::int,
  3,
  'video_media_providers contains the three supported active providers'
);

-- Storage buckets --------------------------------------------------

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'tutor-credentials' and public = false
  ),
  'tutor-credentials storage bucket exists and is private'
);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'tutor-public-media' and public = true
  ),
  'tutor-public-media storage bucket exists and is public'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tutor_public_media_objects_select_public'
  ),
  'storage.objects has a public-read policy for the tutor-public-media bucket'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and qual ilike '%tutor-credentials%'
  ),
  'storage.objects has no anon/authenticated policy for the tutor-credentials bucket (service-role only)'
);

-- tutor_credentials posture preserved ------------------------------

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'tutor_credentials'
      and cls.relrowsecurity
  ),
  'tutor_credentials retains row level security'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_credentials'
      and policyname = 'tutor_credentials_select_self'
  ),
  'tutor_credentials retains its owner select-self policy'
);

-- Fixture seeding via the test role (which bypasses RLS like the
-- service role) so we can exercise the partial unique index and the
-- owner-vs-anon read posture.

insert into public.app_users (id, auth_user_id, email, account_status, onboarding_state, timezone)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'media-owner@mentorib.test',
  'active',
  'complete',
  'UTC'
)
on conflict (id) do nothing;

insert into public.tutor_profiles (id, app_user_id, application_status)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'approved'
)
on conflict (id) do nothing;

-- intro_video_publication_status defaults to 'hidden' for a freshly
-- seeded row that did not specify the column.
select is(
  (select intro_video_publication_status from public.tutor_profiles where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'),
  'hidden',
  'intro_video_publication_status defaults to hidden for new tutor_profiles rows'
);

-- First published profile photo is accepted.
select lives_ok(
  $$insert into public.tutor_public_media_assets
      (tutor_profile_id, media_role, storage_object_path, publication_status)
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'profile_photo',
      'ffffffff-ffff-4fff-8fff-ffffffffffff/photo-a.png',
      'published'
    )$$,
  'first published profile_photo for a tutor is accepted'
);

-- Second published profile photo for the same tutor violates the
-- partial unique index.
select throws_ok(
  $$insert into public.tutor_public_media_assets
      (tutor_profile_id, media_role, storage_object_path, publication_status)
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'profile_photo',
      'ffffffff-ffff-4fff-8fff-ffffffffffff/photo-b.png',
      'published'
    )$$,
  '23505',
  null,
  'second published profile_photo per tutor violates the partial unique index'
);

-- A second non-published row is still accepted (only one *published*
-- photo is constrained).
select lives_ok(
  $$insert into public.tutor_public_media_assets
      (tutor_profile_id, media_role, storage_object_path, publication_status)
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'profile_photo',
      'ffffffff-ffff-4fff-8fff-ffffffffffff/photo-c.png',
      'uploaded'
    )$$,
  'second profile_photo with non-published status is allowed alongside the published one'
);

-- Anonymous role cannot read tutor_public_media_assets rows.
set local role anon;

select is(
  (select count(*) from public.tutor_public_media_assets)::int,
  0,
  'anonymous cannot read tutor_public_media_assets rows'
);

-- Signed-in owner can read their own rows via the select-self policy.
set local role authenticated;
set local "request.jwt.claim.sub" to 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select is(
  (select count(*) from public.tutor_public_media_assets where tutor_profile_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff')::int,
  2,
  'signed-in owner can select their own tutor_public_media_assets rows via the select-self policy'
);

reset role;
reset "request.jwt.claim.sub";

select * from finish();
rollback;
