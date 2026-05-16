-- Notification preferences baseline for `P2-NOTIF-PREF-001`.
--
-- Adds:
--   * `notification_preferences` table — one row per (app_user, optional
--     notification category) capturing channel-level (in-app / email) opt-out
--     state.
--
-- Design notes (locked in `P2-NOTIF-PREF-001`):
--   * Row absence resolves to "both channels enabled" — rows are only written
--     when the user changes a switch, so no backfill is required for existing
--     users.
--   * `notification_category` is a text-with-CHECK enum (mirrors the existing
--     `notification_type` pattern in `notifications`) listing the four
--     user-toggleable groupings. Mandatory notification types are enforced in
--     application code via `MANDATORY_NOTIFICATION_TYPES`; this table never
--     stores a "mandatory" flag.
--   * RLS is owner-only: authenticated users can read/insert/update their own
--     row; anonymous users are denied across the board; admin reads/writes
--     flow through the service role and bypass RLS by design.

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  notification_category text not null,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_app_user_category_key
    unique (app_user_id, notification_category),
  constraint notification_preferences_category_chk check (
    notification_category in (
      'lesson_reminders',
      'reviews',
      'tutor_application_updates',
      'lesson_recaps'
    )
  )
);

comment on table public.notification_preferences is
  'Owner-scoped channel-level opt-out state for optional notification categories. Row absence implies both channels enabled. Mandatory categories are enforced in application code and never appear here.';

create index notification_preferences_app_user_idx
  on public.notification_preferences (app_user_id);

create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

create policy notification_preferences_select_self
on public.notification_preferences
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = notification_preferences.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy notification_preferences_insert_self
on public.notification_preferences
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users
    where app_users.id = notification_preferences.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy notification_preferences_update_self
on public.notification_preferences
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = notification_preferences.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.app_users
    where app_users.id = notification_preferences.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);
