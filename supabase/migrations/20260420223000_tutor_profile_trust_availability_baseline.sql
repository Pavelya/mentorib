create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null unique,
  slug text not null unique,
  display_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_subject_code_not_blank_chk check (btrim(subject_code) <> ''),
  constraint subjects_slug_not_blank_chk check (btrim(slug) <> ''),
  constraint subjects_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint subjects_display_name_not_blank_chk check (btrim(display_name) <> ''),
  constraint subjects_sort_order_nonnegative_chk check (sort_order >= 0)
);

comment on table public.subjects is
  'Canonical IB subject vocabulary reused by tutor capabilities, matching, lessons, and public discovery.';

create table public.subject_focus_areas (
  id uuid primary key default gen_random_uuid(),
  focus_area_code text not null unique,
  slug text not null unique,
  display_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subject_focus_areas_focus_area_code_not_blank_chk check (btrim(focus_area_code) <> ''),
  constraint subject_focus_areas_slug_not_blank_chk check (btrim(slug) <> ''),
  constraint subject_focus_areas_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint subject_focus_areas_display_name_not_blank_chk check (btrim(display_name) <> ''),
  constraint subject_focus_areas_sort_order_nonnegative_chk check (sort_order >= 0)
);

comment on table public.subject_focus_areas is
  'Canonical academic support-area vocabulary such as IA, EE, TOK, exam preparation, and similar structured focus tags.';

create table public.languages (
  language_code text primary key,
  display_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint languages_language_code_not_blank_chk check (btrim(language_code) <> ''),
  constraint languages_display_name_not_blank_chk check (btrim(display_name) <> ''),
  constraint languages_sort_order_nonnegative_chk check (sort_order >= 0)
);

comment on table public.languages is
  'Canonical language vocabulary reused across tutor language capabilities and later account or learning-preference flows.';

create table public.video_media_providers (
  provider_key text primary key,
  display_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_media_providers_provider_key_not_blank_chk check (btrim(provider_key) <> ''),
  constraint video_media_providers_provider_key_format_chk check (
    provider_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
  ),
  constraint video_media_providers_display_name_not_blank_chk check (btrim(display_name) <> ''),
  constraint video_media_providers_sort_order_nonnegative_chk check (sort_order >= 0)
);

comment on table public.video_media_providers is
  'Controlled provider vocabulary for public tutor intro-video references such as YouTube, Vimeo, or Loom.';

alter table public.tutor_profiles
  add column display_name text,
  add column public_slug text,
  add column headline text,
  add column bio text,
  add column teaching_style_summary text,
  add column best_for_summary text,
  add column pricing_summary text,
  add column profile_visibility_status text not null default 'draft',
  add column application_status text not null default 'not_started',
  add column public_listing_status text not null default 'not_listed',
  add column payout_readiness_status text not null default 'not_started',
  add column intro_video_provider text,
  add column intro_video_external_id text,
  add column intro_video_url text,
  add constraint tutor_profiles_display_name_not_blank_chk check (
    display_name is null or btrim(display_name) <> ''
  ),
  add constraint tutor_profiles_public_slug_not_blank_chk check (
    public_slug is null or btrim(public_slug) <> ''
  ),
  add constraint tutor_profiles_public_slug_format_chk check (
    public_slug is null or public_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  add constraint tutor_profiles_headline_not_blank_chk check (
    headline is null or btrim(headline) <> ''
  ),
  add constraint tutor_profiles_bio_not_blank_chk check (
    bio is null or btrim(bio) <> ''
  ),
  add constraint tutor_profiles_teaching_style_summary_not_blank_chk check (
    teaching_style_summary is null or btrim(teaching_style_summary) <> ''
  ),
  add constraint tutor_profiles_best_for_summary_not_blank_chk check (
    best_for_summary is null or btrim(best_for_summary) <> ''
  ),
  add constraint tutor_profiles_pricing_summary_not_blank_chk check (
    pricing_summary is null or btrim(pricing_summary) <> ''
  ),
  add constraint tutor_profiles_intro_video_external_id_not_blank_chk check (
    intro_video_external_id is null or btrim(intro_video_external_id) <> ''
  ),
  add constraint tutor_profiles_intro_video_url_not_blank_chk check (
    intro_video_url is null or btrim(intro_video_url) <> ''
  ),
  add constraint tutor_profiles_intro_video_url_https_chk check (
    intro_video_url is null or intro_video_url ~ '^https://.+'
  ),
  add constraint tutor_profiles_intro_video_fields_consistency_chk check (
    (
      intro_video_provider is null
      and intro_video_external_id is null
      and intro_video_url is null
    )
    or (
      intro_video_provider is not null
      and intro_video_url is not null
    )
  ),
  add constraint tutor_profiles_profile_visibility_status_chk check (
    profile_visibility_status in ('draft', 'private_preview', 'public_visible', 'hidden')
  ),
  add constraint tutor_profiles_application_status_chk check (
    application_status in (
      'not_started',
      'in_progress',
      'submitted',
      'under_review',
      'changes_requested',
      'approved',
      'rejected',
      'withdrawn'
    )
  ),
  add constraint tutor_profiles_public_listing_status_chk check (
    public_listing_status in ('not_listed', 'eligible', 'listed', 'paused', 'delisted')
  ),
  add constraint tutor_profiles_payout_readiness_status_chk check (
    payout_readiness_status in ('not_started', 'pending_verification', 'enabled', 'restricted')
  ),
  add constraint tutor_profiles_public_slug_key unique (public_slug),
  add constraint tutor_profiles_intro_video_provider_fkey
    foreign key (intro_video_provider)
    references public.video_media_providers (provider_key);

comment on table public.tutor_profiles is
  'Canonical tutor profile object containing both owner-managed private state and explicitly approved public profile-source fields.';

create table public.tutor_subject_capabilities (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id),
  subject_focus_area_id uuid not null references public.subject_focus_areas (id),
  experience_summary text,
  display_priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_subject_capabilities_experience_summary_not_blank_chk check (
    experience_summary is null or btrim(experience_summary) <> ''
  ),
  constraint tutor_subject_capabilities_display_priority_nonnegative_chk check (
    display_priority >= 0
  ),
  constraint tutor_subject_capabilities_scope_key unique (
    tutor_profile_id,
    subject_id,
    subject_focus_area_id
  )
);

comment on table public.tutor_subject_capabilities is
  'Structured tutor subject and focus-area coverage used by matching, discovery filters, and public capability display.';

create table public.tutor_language_capabilities (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  language_code text not null references public.languages (language_code),
  display_priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_language_capabilities_display_priority_nonnegative_chk check (
    display_priority >= 0
  ),
  constraint tutor_language_capabilities_scope_key unique (tutor_profile_id, language_code)
);

comment on table public.tutor_language_capabilities is
  'Structured tutor language capability rows linked to the shared languages vocabulary.';

create table public.tutor_credentials (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  credential_type text not null,
  title text not null,
  issuing_body text,
  storage_object_path text not null,
  review_status text not null default 'uploaded',
  reviewed_at timestamptz,
  public_display_preference boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_credentials_credential_type_not_blank_chk check (btrim(credential_type) <> ''),
  constraint tutor_credentials_title_not_blank_chk check (btrim(title) <> ''),
  constraint tutor_credentials_issuing_body_not_blank_chk check (
    issuing_body is null or btrim(issuing_body) <> ''
  ),
  constraint tutor_credentials_storage_object_path_not_blank_chk check (
    btrim(storage_object_path) <> ''
  ),
  constraint tutor_credentials_review_status_chk check (
    review_status in ('uploaded', 'pending_review', 'approved', 'rejected', 'expired')
  ),
  constraint tutor_credentials_reviewed_at_consistency_chk check (
    (
      review_status in ('approved', 'rejected', 'expired')
      and reviewed_at is not null
    )
    or (
      review_status in ('uploaded', 'pending_review')
      and reviewed_at is null
    )
  )
);

comment on table public.tutor_credentials is
  'Private verification evidence records for tutor trust review; raw files never become public profile content.';

create table public.schedule_policies (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null unique references public.tutor_profiles (id) on delete cascade,
  timezone text not null default 'UTC',
  minimum_notice_minutes integer not null default 480,
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  daily_capacity integer,
  weekly_capacity integer,
  is_accepting_new_students boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_policies_timezone_not_blank_chk check (btrim(timezone) <> ''),
  constraint schedule_policies_minimum_notice_minutes_nonnegative_chk check (
    minimum_notice_minutes >= 0
  ),
  constraint schedule_policies_buffer_before_minutes_nonnegative_chk check (
    buffer_before_minutes >= 0
  ),
  constraint schedule_policies_buffer_after_minutes_nonnegative_chk check (
    buffer_after_minutes >= 0
  ),
  constraint schedule_policies_daily_capacity_positive_chk check (
    daily_capacity is null or daily_capacity > 0
  ),
  constraint schedule_policies_weekly_capacity_positive_chk check (
    weekly_capacity is null or weekly_capacity > 0
  ),
  constraint schedule_policies_weekly_capacity_gte_daily_capacity_chk check (
    daily_capacity is null
    or weekly_capacity is null
    or weekly_capacity >= daily_capacity
  )
);

comment on table public.schedule_policies is
  'Tutor-level booking policy settings that shape slot generation while keeping raw availability private.';

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  day_of_week integer not null,
  start_local_time time not null,
  end_local_time time not null,
  visibility_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_day_of_week_range_chk check (
    day_of_week between 0 and 6
  ),
  constraint availability_rules_window_order_chk check (
    start_local_time < end_local_time
  ),
  constraint availability_rules_visibility_status_chk check (
    visibility_status in ('active', 'hidden', 'disabled')
  ),
  constraint availability_rules_tutor_day_window_key unique (
    tutor_profile_id,
    day_of_week,
    start_local_time,
    end_local_time
  )
);

comment on table public.availability_rules is
  'Recurring weekly tutor-availability windows expressed in the tutor schedule policy timezone.';

create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  override_date date not null,
  override_type text not null,
  start_local_time time,
  end_local_time time,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_overrides_override_type_chk check (
    override_type in ('open_extra', 'blocked', 'edited_window')
  ),
  constraint availability_overrides_reason_not_blank_chk check (
    reason is null or btrim(reason) <> ''
  ),
  constraint availability_overrides_window_consistency_chk check (
    (
      override_type = 'blocked'
      and start_local_time is null
      and end_local_time is null
    )
    or (
      override_type in ('open_extra', 'edited_window')
      and start_local_time is not null
      and end_local_time is not null
      and start_local_time < end_local_time
    )
  )
);

comment on table public.availability_overrides is
  'Date-specific tutor schedule changes such as extra openings, blocked days, or edited windows.';

create index tutor_profiles_application_status_idx
  on public.tutor_profiles (application_status);

create index tutor_profiles_public_listing_visibility_idx
  on public.tutor_profiles (public_listing_status, profile_visibility_status);

create index tutor_subject_capabilities_subject_id_idx
  on public.tutor_subject_capabilities (subject_id);

create index tutor_subject_capabilities_priority_idx
  on public.tutor_subject_capabilities (tutor_profile_id, display_priority);

create index tutor_language_capabilities_language_code_idx
  on public.tutor_language_capabilities (language_code);

create index tutor_language_capabilities_priority_idx
  on public.tutor_language_capabilities (tutor_profile_id, display_priority);

create index tutor_credentials_tutor_profile_id_review_status_idx
  on public.tutor_credentials (tutor_profile_id, review_status);

create index availability_rules_tutor_profile_id_day_visibility_idx
  on public.availability_rules (tutor_profile_id, day_of_week, visibility_status);

create index availability_overrides_tutor_profile_id_override_date_idx
  on public.availability_overrides (tutor_profile_id, override_date);

create trigger set_subjects_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create trigger set_subject_focus_areas_updated_at
before update on public.subject_focus_areas
for each row execute function public.set_updated_at();

create trigger set_languages_updated_at
before update on public.languages
for each row execute function public.set_updated_at();

create trigger set_video_media_providers_updated_at
before update on public.video_media_providers
for each row execute function public.set_updated_at();

create trigger set_tutor_subject_capabilities_updated_at
before update on public.tutor_subject_capabilities
for each row execute function public.set_updated_at();

create trigger set_tutor_language_capabilities_updated_at
before update on public.tutor_language_capabilities
for each row execute function public.set_updated_at();

create trigger set_tutor_credentials_updated_at
before update on public.tutor_credentials
for each row execute function public.set_updated_at();

create trigger set_schedule_policies_updated_at
before update on public.schedule_policies
for each row execute function public.set_updated_at();

create trigger set_availability_rules_updated_at
before update on public.availability_rules
for each row execute function public.set_updated_at();

create trigger set_availability_overrides_updated_at
before update on public.availability_overrides
for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;
alter table public.subject_focus_areas enable row level security;
alter table public.languages enable row level security;
alter table public.video_media_providers enable row level security;
alter table public.tutor_subject_capabilities enable row level security;
alter table public.tutor_language_capabilities enable row level security;
alter table public.tutor_credentials enable row level security;
alter table public.schedule_policies enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_overrides enable row level security;

create policy subjects_select_active
on public.subjects
for select
to anon, authenticated
using (is_active);

create policy subject_focus_areas_select_active
on public.subject_focus_areas
for select
to anon, authenticated
using (is_active);

create policy languages_select_active
on public.languages
for select
to anon, authenticated
using (is_active);

create policy video_media_providers_select_active
on public.video_media_providers
for select
to anon, authenticated
using (is_active);

create policy tutor_subject_capabilities_select_self
on public.tutor_subject_capabilities
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = tutor_subject_capabilities.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy tutor_language_capabilities_select_self
on public.tutor_language_capabilities
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = tutor_language_capabilities.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy tutor_credentials_select_self
on public.tutor_credentials
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = tutor_credentials.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy schedule_policies_select_self
on public.schedule_policies
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = schedule_policies.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy availability_rules_select_self
on public.availability_rules
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = availability_rules.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy availability_overrides_select_self
on public.availability_overrides
for select
to authenticated
using (
  exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = availability_overrides.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);
