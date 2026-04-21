begin;

select plan(46);

select has_table('public', 'meeting_providers', 'meeting_providers exists');
select has_table('public', 'booking_operations', 'booking_operations exists');
select has_table('public', 'learning_needs', 'learning_needs exists');
select has_table('public', 'match_runs', 'match_runs exists');
select has_table('public', 'match_candidates', 'match_candidates exists');
select has_table('public', 'lessons', 'lessons exists');
select has_table('public', 'lesson_status_history', 'lesson_status_history exists');
select has_table('public', 'lesson_meeting_access', 'lesson_meeting_access exists');
select has_table('public', 'lesson_issue_cases', 'lesson_issue_cases exists');
select has_table('public', 'payments', 'payments exists');

select has_column(
  'public',
  'lessons',
  'booking_operation_id',
  'lessons link booking creation to an idempotent operation'
);
select has_column(
  'public',
  'lessons',
  'subject_snapshot',
  'lessons preserve a subject snapshot'
);
select has_column(
  'public',
  'lesson_meeting_access',
  'meeting_url',
  'lesson_meeting_access owns private meeting URLs'
);
select has_column(
  'public',
  'lesson_issue_cases',
  'resolution_outcome',
  'lesson_issue_cases owns operational issue outcomes'
);
select has_column(
  'public',
  'payments',
  'authorization_operation_id',
  'payments link authorization to an idempotent operation'
);
select has_column(
  'public',
  'payments',
  'capture_operation_id',
  'payments link capture to an idempotent operation'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'booking_operations_actor_operation_key'
  ),
  'booking_operations deduplicates operation keys per actor'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'match_candidates_tutor_per_run_key'
  ),
  'match_candidates prevents duplicate tutor candidates per run'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'match_candidates_rank_per_run_key'
  ),
  'match_candidates keeps one candidate per rank in a run'
);

select col_is_unique(
  'public',
  'lessons',
  'booking_operation_id',
  'lessons keeps one lesson per booking operation'
);
select col_is_unique(
  'public',
  'payments',
  'lesson_id',
  'payments stays one-to-one with lessons for phase 1'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'lessons_tutor_active_slot_key'
  ),
  'lessons prevents duplicate active tutor slots'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'lesson_issue_cases_open_lesson_key'
  ),
  'lesson_issue_cases keeps one open case per lesson'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'payments_provider_idempotency_key_key'
  ),
  'payments has a provider idempotency uniqueness boundary'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'learning_needs'
      and cls.relrowsecurity
  ),
  'learning_needs has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'booking_operations'
      and cls.relrowsecurity
  ),
  'booking_operations has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'lessons'
      and cls.relrowsecurity
  ),
  'lessons has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'payments'
      and cls.relrowsecurity
  ),
  'payments has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'meeting_providers'
      and policyname = 'meeting_providers_select_active'
  ),
  'meeting_providers has an active-row read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'learning_needs'
      and policyname = 'learning_needs_select_self'
  ),
  'learning_needs has an owner read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lessons'
      and policyname = 'lessons_select_participant'
  ),
  'lessons has a participant read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payments'
      and policyname = 'payments_select_participant'
  ),
  'payments has a participant read policy'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_lessons_updated_at'
  ),
  'lessons keeps the shared updated_at trigger'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_lesson_context_consistency'
  ),
  'lessons enforce learning need and match candidate consistency'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_lesson_issue_reporter_membership'
  ),
  'lesson_issue_cases enforce participant reporter rules'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_payment_payer_matches_lesson_student'
  ),
  'payments enforce the lesson student as payer'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'learning_needs_need_status_chk'
  ),
  'learning_needs keeps controlled statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'match_runs_run_status_chk'
  ),
  'match_runs keeps controlled statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'match_candidates_candidate_state_chk'
  ),
  'match_candidates keeps controlled states'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'lessons_lesson_status_chk'
  ),
  'lessons keeps controlled statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'lesson_issue_cases_case_status_chk'
  ),
  'lesson_issue_cases keeps controlled statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'lesson_issue_cases_resolution_outcome_chk'
  ),
  'lesson_issue_cases keeps controlled resolution outcomes'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'payments_payment_status_chk'
  ),
  'payments keeps controlled statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'booking_operations_operation_type_chk'
  ),
  'booking_operations keeps controlled operation types'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'abuse_reports_lesson_id_fkey'
  ),
  'abuse_reports lesson_id now references lessons'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'lesson_meeting_access_access_status_chk'
  ),
  'lesson_meeting_access keeps controlled access statuses'
);

select * from finish();
rollback;
