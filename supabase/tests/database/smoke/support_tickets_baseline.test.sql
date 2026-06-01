begin;

select plan(15);

-- ---------------------------------------------------------------------------
-- Shape
-- ---------------------------------------------------------------------------

select has_table(
  'public',
  'support_tickets',
  'support_tickets table exists'
);

select has_column(
  'public',
  'support_tickets',
  'requester_email',
  'support_tickets carries the requester_email column'
);

select has_column(
  'public',
  'support_tickets',
  'requester_app_user_id',
  'support_tickets carries the nullable requester_app_user_id column'
);

select has_column(
  'public',
  'support_tickets',
  'assigned_to_app_user_id',
  'support_tickets carries the assigned_to_app_user_id column'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'support_tickets_status_chk'
  ),
  'support_tickets keeps controlled status values'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'support_tickets_channel_chk'
  ),
  'support_tickets keeps controlled channel values'
);

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'support_tickets'
      and indexname = 'support_tickets_status_created_at_idx'
  ),
  'support_tickets has the status/created_at queue index'
);

select ok(
  exists (
    select 1 from pg_trigger
    where tgname = 'set_support_tickets_updated_at'
  ),
  'support_tickets keeps updated_at synchronized'
);

-- ---------------------------------------------------------------------------
-- RLS posture: enabled, internal-only (no anon/authenticated policies)
-- ---------------------------------------------------------------------------

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.support_tickets'::regclass
  ),
  'support_tickets has row level security enabled'
);

select is_empty(
  $$
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'support_tickets'
  $$,
  'support_tickets has no anon/authenticated policies (internal-only)'
);

-- ---------------------------------------------------------------------------
-- Behavior: check constraints
-- ---------------------------------------------------------------------------

-- A blank requester_email is rejected
select throws_ok(
  $$insert into public.support_tickets (requester_email, subject, body)
    values ('   ', 'Subject', 'Body')$$,
  '23514',
  null,
  'whitespace-only requester_email is rejected by the CHECK constraint'
);

-- An unknown status is rejected
select throws_ok(
  $$insert into public.support_tickets (requester_email, subject, body, status)
    values ('person@example.com', 'Subject', 'Body', 'archived')$$,
  '23514',
  null,
  'unknown status is rejected by the CHECK constraint'
);

-- A valid logged-out ticket inserts cleanly (null requester_app_user_id)
select lives_ok(
  $$insert into public.support_tickets (requester_email, subject, body)
    values ('person@example.com', 'Need help', 'My lesson link is broken.')$$,
  'a valid logged-out support ticket inserts cleanly'
);

-- ---------------------------------------------------------------------------
-- RLS denial: anon cannot read or insert
-- ---------------------------------------------------------------------------

set local role anon;

select is(
  (select count(*) from public.support_tickets)::int,
  0,
  'anonymous cannot read support_tickets rows'
);

select throws_ok(
  $$insert into public.support_tickets (requester_email, subject, body)
    values ('anon@example.com', 'Subject', 'Body')$$,
  '42501',
  null,
  'anonymous cannot insert into support_tickets'
);

reset role;

select * from finish();
rollback;
