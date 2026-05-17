-- P2-MEDIA-001-01 Migration foundation for tutor-owned media.
--
-- This migration is data-structure only. It introduces the new
-- `tutor_public_media_assets` table (M2 public profile media model),
-- extends `tutor_profiles` with two intro-video publication-state
-- columns (M4 external video), seeds the supported video providers,
-- and creates the two Supabase Storage buckets that subsequent
-- subtasks (`-03` private credentials, `-04` public profile photos)
-- will write through.
--
-- No query, repository, Server Action, public DTO, readiness gate,
-- or notification kind is introduced here; those live in subtasks
-- `-02` through `-09`.

create table public.tutor_public_media_assets (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  media_role text not null,
  storage_object_path text not null,
  alt_text text,
  publication_status text not null default 'uploaded',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_public_media_assets_media_role_chk check (
    media_role in ('profile_photo')
  ),
  constraint tutor_public_media_assets_storage_object_path_not_blank_chk check (
    btrim(storage_object_path) <> ''
  ),
  constraint tutor_public_media_assets_alt_text_not_blank_chk check (
    alt_text is null or btrim(alt_text) <> ''
  ),
  constraint tutor_public_media_assets_publication_status_chk check (
    publication_status in ('uploaded', 'pending_review', 'approved', 'published', 'hidden')
  ),
  constraint tutor_public_media_assets_sort_order_nonnegative_chk check (
    sort_order >= 0
  )
);

comment on table public.tutor_public_media_assets is
  'Tutor-owned public media (M2): one published profile photo per tutor today; structure permits later media roles without schema change.';

create index tutor_public_media_assets_tutor_profile_id_idx
  on public.tutor_public_media_assets (tutor_profile_id);

create index tutor_public_media_assets_tutor_role_status_idx
  on public.tutor_public_media_assets (tutor_profile_id, media_role, publication_status);

create unique index tutor_public_media_assets_one_published_photo_per_tutor_idx
  on public.tutor_public_media_assets (tutor_profile_id)
  where media_role = 'profile_photo' and publication_status = 'published';

create trigger set_tutor_public_media_assets_updated_at
before update on public.tutor_public_media_assets
for each row execute function public.set_updated_at();

alter table public.tutor_public_media_assets enable row level security;

create policy tutor_public_media_assets_select_self
on public.tutor_public_media_assets
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = tutor_public_media_assets.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

-- Intro-video publication state (M4 external video).
-- The URL columns (`intro_video_provider`, `intro_video_external_id`,
-- `intro_video_url`) already exist on `tutor_profiles`; these two
-- columns add the publication-state pair required by file-and-media
-- § 15.2. A separate `tutor_video_references` table is intentionally
-- not introduced (file-and-media § 7.6 permits attaching a single
-- provider video per tutor directly to the profile).

alter table public.tutor_profiles
  add column intro_video_publication_status text not null default 'hidden',
  add column intro_video_last_validated_at timestamptz,
  add constraint tutor_profiles_intro_video_publication_status_chk check (
    intro_video_publication_status in ('hidden', 'published')
  );

-- Seed supported video providers (file-and-media § 13). Idempotent.

insert into public.video_media_providers (provider_key, display_name, sort_order, is_active)
values
  ('youtube', 'YouTube', 0, true),
  ('vimeo', 'Vimeo', 1, true),
  ('loom', 'Loom', 2, true)
on conflict (provider_key) do nothing;

-- Storage buckets.
--
-- `tutor-credentials` is private (M1 credential evidence). No
-- anon/authenticated read or write policy is created; access flows
-- exclusively through the service role and signed URLs.
--
-- `tutor-public-media` is public (M2 profile photo). Anon and
-- authenticated SELECT is granted; writes flow through the service
-- role (server-owned upload Server Actions in `-04`).

insert into storage.buckets (id, name, public)
values ('tutor-credentials', 'tutor-credentials', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('tutor-public-media', 'tutor-public-media', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'tutor_public_media_objects_select_public'
  ) then
    create policy tutor_public_media_objects_select_public
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'tutor-public-media');
  end if;
end
$$;
