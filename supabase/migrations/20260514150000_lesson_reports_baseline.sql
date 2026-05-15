-- Lesson recap / continuity record baseline for `P2-REPORT-001`.
--
-- Adds:
--   * `lesson_reports` table — one private tutor-authored continuity record
--     per completed lesson with explicit draft / submit / share / acknowledge
--     lifecycle.
--
-- Design notes (locked in `P2-REPORT-001`):
--   * one row per lesson (unique on lesson_id)
--   * tutor is the only writer; student gets a read only after the recap is
--     shared; admin reads through the service role
--   * the `due` status is a derived view-model state surfaced to the tutor
--     when a completed lesson has no row yet — it is NOT persisted as a row
--     state (rows are created in `drafted`)
--   * student_visible_at is the canonical share marker; when it is null the
--     student MUST NOT see the recap, even via RLS

create table public.lesson_reports (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  report_status text not null default 'drafted',
  goal_summary text,
  coverage_summary text,
  student_confidence_signal text,
  next_steps_summary text,
  submitted_at timestamptz,
  student_visible_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_reports_lesson_id_key unique (lesson_id),
  constraint lesson_reports_report_status_chk check (
    report_status in (
      'drafted',
      'submitted',
      'shared',
      'acknowledged'
    )
  ),
  constraint lesson_reports_goal_summary_length_chk check (
    goal_summary is null or char_length(goal_summary) <= 2000
  ),
  constraint lesson_reports_coverage_summary_length_chk check (
    coverage_summary is null or char_length(coverage_summary) <= 2000
  ),
  constraint lesson_reports_student_confidence_signal_length_chk check (
    student_confidence_signal is null
      or char_length(student_confidence_signal) <= 500
  ),
  constraint lesson_reports_next_steps_summary_length_chk check (
    next_steps_summary is null or char_length(next_steps_summary) <= 2000
  ),
  constraint lesson_reports_goal_summary_not_blank_chk check (
    goal_summary is null or btrim(goal_summary) <> ''
  ),
  constraint lesson_reports_coverage_summary_not_blank_chk check (
    coverage_summary is null or btrim(coverage_summary) <> ''
  ),
  constraint lesson_reports_student_confidence_not_blank_chk check (
    student_confidence_signal is null or btrim(student_confidence_signal) <> ''
  ),
  constraint lesson_reports_next_steps_not_blank_chk check (
    next_steps_summary is null or btrim(next_steps_summary) <> ''
  ),
  constraint lesson_reports_submitted_at_consistency_chk check (
    (report_status = 'drafted' and submitted_at is null)
    or (report_status <> 'drafted' and submitted_at is not null)
  ),
  constraint lesson_reports_student_visible_at_consistency_chk check (
    (report_status in ('drafted', 'submitted') and student_visible_at is null)
    or (
      report_status in ('shared', 'acknowledged')
      and student_visible_at is not null
    )
  ),
  constraint lesson_reports_acknowledged_at_consistency_chk check (
    (report_status = 'acknowledged' and acknowledged_at is not null)
    or (report_status <> 'acknowledged' and acknowledged_at is null)
  )
);

comment on table public.lesson_reports is
  'Private tutor-authored continuity record per completed lesson. Treated as a P3 educational record; never publicly exposed, never copied into analytics or logs.';

create index lesson_reports_lesson_id_idx
  on public.lesson_reports (lesson_id);

create index lesson_reports_student_visible_at_idx
  on public.lesson_reports (student_visible_at desc nulls last)
  where student_visible_at is not null;

-- Triggers enforce that the report stays tied to a completed lesson and that
-- writes only happen through the tutor service role.
create or replace function public.enforce_lesson_report_lesson_state()
returns trigger
language plpgsql
as $$
declare
  lesson_status_value text;
begin
  select lessons.lesson_status
    into lesson_status_value
  from public.lessons
  where lessons.id = new.lesson_id;

  if lesson_status_value is null then
    raise exception 'lesson_id % does not exist', new.lesson_id;
  end if;

  if lesson_status_value not in ('completed', 'reviewed') then
    raise exception
      'lesson reports can only be authored on completed lessons (lesson % has status %)',
      new.lesson_id, lesson_status_value;
  end if;

  return new;
end;
$$;

create trigger enforce_lesson_report_lesson_state
before insert or update on public.lesson_reports
for each row execute function public.enforce_lesson_report_lesson_state();

create trigger set_lesson_reports_updated_at
before update on public.lesson_reports
for each row execute function public.set_updated_at();

alter table public.lesson_reports enable row level security;

-- The tutor of the underlying lesson is the only authenticated reader unless
-- the report has been intentionally shared with the student. Admin reads go
-- through the service role and bypass RLS by design.
create policy lesson_reports_select_tutor
on public.lesson_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons
    join public.tutor_profiles
      on tutor_profiles.id = lessons.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where lessons.id = lesson_reports.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy lesson_reports_select_student_shared
on public.lesson_reports
for select
to authenticated
using (
  lesson_reports.student_visible_at is not null
  and exists (
    select 1
    from public.lessons
    join public.student_profiles
      on student_profiles.id = lessons.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where lessons.id = lesson_reports.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
);

-- Extend the notification-type check to allow `lesson_report_shared` so the
-- tutor can broadcast an in-app notification to the student when sharing the
-- recap. This is in-app only — email delivery for the new type is
-- intentionally out of scope for `P2-REPORT-001`.
alter table public.notifications
  drop constraint notifications_type_chk;

alter table public.notifications
  add constraint notifications_type_chk check (
    notification_type in (
      'new_message',
      'lesson_request_submitted',
      'lesson_accepted',
      'lesson_declined',
      'lesson_request_expired',
      'lesson_updated',
      'upcoming_lesson_reminder',
      'lesson_issue_acknowledgement',
      'lesson_issue_resolution',
      'lesson_report_shared',
      'review_submitted',
      'tutor_application_submitted',
      'tutor_application_reviewed',
      'payout_processed',
      'policy_notice_updated'
    )
  );
