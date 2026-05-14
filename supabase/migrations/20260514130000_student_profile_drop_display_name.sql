-- Drops `student_profiles.display_name` so account name lives in exactly
-- one place for students too: `app_users.full_name`. The legacy column
-- was only ever a one-time snapshot of `app_users.full_name` at role
-- selection time and there is no UI that edits it. Once a student
-- updated their name on `/settings` it would silently drift from the
-- value tutors saw on the student profile, lesson list, and roster.
--
-- Every read path now joins `app_users.full_name` via `app_user_id`.

alter table public.student_profiles
  drop column display_name;
