create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  preferred_language_code text,
  onboarding_state text not null default 'role_pending',
  account_status text not null default 'active',
  primary_role_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_email_not_blank_chk check (btrim(email) <> ''),
  constraint app_users_timezone_not_blank_chk check (btrim(timezone) <> ''),
  constraint app_users_onboarding_state_chk check (
    onboarding_state in ('role_pending', 'student_setup', 'tutor_application_started', 'completed')
  ),
  constraint app_users_account_status_chk check (
    account_status in ('active', 'limited', 'suspended', 'closed')
  ),
  constraint app_users_primary_role_context_chk check (
    primary_role_context is null or primary_role_context in ('student', 'tutor', 'admin')
  )
);

comment on table public.app_users is
  'Canonical application identity rooted in auth.users for all authenticated Mentor IB accounts.';

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  role text not null,
  role_status text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_roles_role_chk check (role in ('student', 'tutor', 'admin')),
  constraint user_roles_role_status_chk check (
    role_status in ('active', 'pending', 'revoked', 'suspended')
  ),
  constraint user_roles_revoked_at_consistency_chk check (
    (role_status = 'revoked' and revoked_at is not null)
    or (role_status <> 'revoked' and revoked_at is null)
  ),
  constraint user_roles_app_user_id_role_key unique (app_user_id, role)
);

comment on table public.user_roles is
  'App-level product capability state. Role routing must read this table instead of UI-only flags.';

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null unique references public.app_users (id) on delete cascade,
  display_name text,
  current_stage_summary text,
  notes_visibility_preference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.student_profiles is
  'Learner-specific profile data linked one-to-one with the owning app user.';

create table public.tutor_profiles (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null unique references public.app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tutor_profiles is
  'Minimal tutor profile anchor introduced in P1-DATA-001; public/private tutor profile fields land in P1-DATA-002.';

create index app_users_onboarding_state_idx
  on public.app_users (onboarding_state);

create index app_users_primary_role_context_idx
  on public.app_users (primary_role_context);

create index user_roles_app_user_id_role_status_idx
  on public.user_roles (app_user_id, role_status);

create trigger set_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

create trigger set_user_roles_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();

create trigger set_student_profiles_updated_at
before update on public.student_profiles
for each row execute function public.set_updated_at();

create trigger set_tutor_profiles_updated_at
before update on public.tutor_profiles
for each row execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.user_roles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.tutor_profiles enable row level security;

create policy app_users_select_self
on public.app_users
for select
to authenticated
using (auth.uid() = auth_user_id);

create policy user_roles_select_self
on public.user_roles
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = user_roles.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy student_profiles_select_self
on public.student_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = student_profiles.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy tutor_profiles_select_self
on public.tutor_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = tutor_profiles.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);
