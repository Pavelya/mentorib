begin;

select plan(13);

select has_table('public', 'lesson_reports', 'lesson_reports table exists');

select has_column(
  'public',
  'lesson_reports',
  'student_visible_at',
  'lesson_reports expose a student_visible_at marker'
);

select has_column(
  'public',
  'lesson_reports',
  'acknowledged_at',
  'lesson_reports expose an acknowledged_at marker'
);

select col_is_unique(
  'public',
  'lesson_reports',
  'lesson_id',
  'lesson_reports stays one-to-one with lessons'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'lesson_reports_report_status_chk'
  ),
  'lesson_reports keeps controlled statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'lesson_reports_student_visible_at_consistency_chk'
  ),
  'lesson_reports enforce student_visible_at consistency with report_status'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'lesson_reports_acknowledged_at_consistency_chk'
  ),
  'lesson_reports enforce acknowledged_at consistency with report_status'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_lesson_report_lesson_state'
  ),
  'lesson_reports enforce that lessons are completed before authoring'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_lesson_reports_updated_at'
  ),
  'lesson_reports use the shared updated_at trigger'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'lesson_reports'
      and cls.relrowsecurity
  ),
  'lesson_reports has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_reports'
      and policyname = 'lesson_reports_select_tutor'
  ),
  'lesson_reports exposes a tutor-only read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_reports'
      and policyname = 'lesson_reports_select_student_shared'
  ),
  'lesson_reports exposes a student read policy gated on student_visible_at'
);

-- The notifications check constraint must accept the new lesson_report_shared
-- value so the in-app notification can be persisted at share time.
select ok(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conname = 'notifications_type_chk'
  ) like '%lesson_report_shared%',
  'notifications constraint accepts lesson_report_shared'
);

select * from finish();

rollback;
