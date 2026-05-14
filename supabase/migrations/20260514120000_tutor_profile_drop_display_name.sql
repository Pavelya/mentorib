-- Drops `tutor_profiles.display_name` so that account name lives in exactly
-- one place: `app_users.full_name`. The application form and the settings
-- form now both edit `app_users.full_name`, and every tutor-facing surface
-- reads it through the `app_users` join. The legacy column was only ever
-- a one-time snapshot of `app_users.full_name` at role-selection time, so
-- nothing is being lost — every existing row already has the same value
-- (or a fresher one) on `app_users.full_name`.

alter table public.tutor_profiles
  drop constraint if exists tutor_profiles_display_name_not_blank_chk,
  drop column display_name;
