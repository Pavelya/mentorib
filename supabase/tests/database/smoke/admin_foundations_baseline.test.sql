begin;

select plan(28);

-- ---------------------------------------------------------------------------
-- admin_action_logs
-- ---------------------------------------------------------------------------

select has_table(
  'public',
  'admin_action_logs',
  'admin_action_logs table exists'
);

select has_column(
  'public',
  'admin_action_logs',
  'action_key',
  'admin_action_logs carries the action_key column'
);

select has_column(
  'public',
  'admin_action_logs',
  'before_state',
  'admin_action_logs carries the before_state snapshot column'
);

select has_column(
  'public',
  'admin_action_logs',
  'after_state',
  'admin_action_logs carries the after_state snapshot column'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'admin_action_logs'
      and indexname = 'admin_action_logs_actor_app_user_id_created_at_idx'
  ),
  'admin_action_logs has the actor index'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'admin_action_logs'
      and indexname = 'admin_action_logs_target_type_target_id_created_at_idx'
  ),
  'admin_action_logs has the target index'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'admin_action_logs'
      and indexname = 'admin_action_logs_action_key_created_at_idx'
  ),
  'admin_action_logs has the action_key index'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'admin_action_logs'
      and cls.relrowsecurity
  ),
  'admin_action_logs has row level security enabled'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'admin_action_logs'
  ),
  'admin_action_logs has no anon/authenticated policies (internal-only)'
);

-- ---------------------------------------------------------------------------
-- moderation_cases
-- ---------------------------------------------------------------------------

select has_table(
  'public',
  'moderation_cases',
  'moderation_cases table exists'
);

select has_column(
  'public',
  'moderation_cases',
  'case_kind',
  'moderation_cases carries the case_kind column'
);

select has_column(
  'public',
  'moderation_cases',
  'subject_kind',
  'moderation_cases carries the subject_kind column'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'moderation_cases_case_kind_chk'
  ),
  'moderation_cases keeps controlled case_kind values'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'moderation_cases_case_status_chk'
  ),
  'moderation_cases keeps controlled case_status values'
);

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'moderation_cases'
      and indexname = 'moderation_cases_queue_priority_idx'
  ),
  'moderation_cases has the queue/priority index'
);

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'moderation_cases'
      and indexname = 'moderation_cases_subject_idx'
  ),
  'moderation_cases has the subject index'
);

select ok(
  exists (
    select 1 from pg_trigger
    where tgname = 'set_moderation_cases_updated_at'
  ),
  'moderation_cases keeps updated_at synchronized'
);

select ok(
  exists (
    select 1 from pg_class cls
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'moderation_cases'
      and cls.relrowsecurity
  ),
  'moderation_cases has row level security enabled'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'moderation_cases'
  ),
  'moderation_cases has no anon/authenticated policies (internal-only)'
);

-- ---------------------------------------------------------------------------
-- moderation_case_notes
-- ---------------------------------------------------------------------------

select has_table(
  'public',
  'moderation_case_notes',
  'moderation_case_notes table exists'
);

select has_column(
  'public',
  'moderation_case_notes',
  'body',
  'moderation_case_notes carries the body column'
);

select ok(
  exists (
    select 1 from pg_class cls
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'moderation_case_notes'
      and cls.relrowsecurity
  ),
  'moderation_case_notes has row level security enabled'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'moderation_case_notes'
  ),
  'moderation_case_notes has no anon/authenticated policies (internal-only)'
);

-- ---------------------------------------------------------------------------
-- Behavior: check constraints + cascade
-- ---------------------------------------------------------------------------

-- Seed fixture rows via the test role (bypasses RLS like the service role).
insert into public.app_users (id, auth_user_id, email, account_status, onboarding_state, timezone)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'admin-foundations@mentorib.test',
  'active',
  'complete',
  'UTC'
)
on conflict (id) do nothing;

-- A bad case_kind is rejected
select throws_ok(
  $$insert into public.moderation_cases (case_kind, subject_kind, subject_id)
    values (
      'unknown',
      'app_user',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )$$,
  '23514',
  null,
  'unknown case_kind is rejected by the CHECK constraint'
);

-- A bad subject_kind is rejected
select throws_ok(
  $$insert into public.moderation_cases (case_kind, subject_kind, subject_id)
    values (
      'report',
      'unknown',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )$$,
  '23514',
  null,
  'unknown subject_kind is rejected by the CHECK constraint'
);

-- A valid insertion succeeds; capture the id for the cascade test
select lives_ok(
  $$insert into public.moderation_cases (
      id, case_kind, subject_kind, subject_id, reporter_app_user_id
    )
    values (
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'report',
      'app_user',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )$$,
  'a valid moderation_cases row inserts cleanly'
);

-- A blank body fails the not-blank check
select throws_ok(
  $$insert into public.moderation_case_notes (case_id, author_app_user_id, body)
    values (
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      '   '
    )$$,
  '23514',
  null,
  'whitespace-only moderation_case_notes.body is rejected'
);

-- A valid note succeeds
select lives_ok(
  $$insert into public.moderation_case_notes (case_id, author_app_user_id, body)
    values (
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'Internal investigation note.'
    )$$,
  'a valid moderation_case_notes row inserts cleanly'
);

-- ---------------------------------------------------------------------------
-- RLS denial: anon cannot read or insert
-- ---------------------------------------------------------------------------

set local role anon;

select is(
  (select count(*) from public.admin_action_logs)::int,
  0,
  'anonymous cannot read admin_action_logs rows'
);

select is(
  (select count(*) from public.moderation_cases)::int,
  0,
  'anonymous cannot read moderation_cases rows'
);

select throws_ok(
  $$insert into public.admin_action_logs (
      actor_app_user_id, action_key, target_type, target_id
    )
    values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'tutor_application.approve',
      'tutor_application',
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    )$$,
  '42501',
  null,
  'anonymous cannot insert into admin_action_logs'
);

reset role;

select * from finish();
rollback;
