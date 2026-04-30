create table public.tutor_meeting_preferences (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null unique references public.tutor_profiles (id) on delete cascade,
  preferred_provider text references public.meeting_providers (provider_key),
  default_meeting_url text,
  display_label text,
  is_active boolean not null default true,
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_meeting_preferences_default_meeting_url_not_blank_chk check (
    default_meeting_url is null or btrim(default_meeting_url) <> ''
  ),
  constraint tutor_meeting_preferences_default_meeting_url_https_chk check (
    default_meeting_url is null or default_meeting_url ~ '^https://.+'
  ),
  constraint tutor_meeting_preferences_display_label_not_blank_chk check (
    display_label is null or btrim(display_label) <> ''
  ),
  constraint tutor_meeting_preferences_default_link_consistency_chk check (
    (
      preferred_provider is null
      and default_meeting_url is null
    )
    or (
      preferred_provider is not null
      and default_meeting_url is not null
    )
  )
);

comment on table public.tutor_meeting_preferences is
  'Tutor-scoped default meeting access preference used to seed lesson meeting access snapshots.';

create trigger set_tutor_meeting_preferences_updated_at
before update on public.tutor_meeting_preferences
for each row execute function public.set_updated_at();

alter table public.tutor_meeting_preferences enable row level security;

create policy tutor_meeting_preferences_select_self
on public.tutor_meeting_preferences
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = tutor_meeting_preferences.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

insert into public.meeting_providers (
  provider_key,
  display_name,
  sort_order,
  is_active
)
values
  ('google_meet', 'Google Meet', 10, true),
  ('zoom', 'Zoom', 20, true),
  ('microsoft_teams', 'Microsoft Teams', 30, true),
  ('whereby', 'Whereby', 40, true),
  ('other', 'Other secure link', 90, true)
on conflict (provider_key) do update
set
  display_name = excluded.display_name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
