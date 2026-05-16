begin;

select plan(16);

select has_table(
  'public',
  'tutor_application_reviews',
  'tutor_application_reviews table exists'
);

select has_column(
  'public',
  'tutor_application_reviews',
  'reviewer_note',
  'tutor_application_reviews carries an applicant-visible reviewer note column'
);

select has_column(
  'public',
  'tutor_application_reviews',
  'internal_note',
  'tutor_application_reviews carries a reviewer-only internal note column'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_application_reviews_review_status_chk'
  ),
  'tutor_application_reviews keeps controlled review_status values'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_application_reviews_reviewer_note_required_chk'
  ),
  'tutor_application_reviews requires a reviewer_note when changes_requested or rejected'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_tutor_application_reviews_updated_at'
  ),
  'tutor_application_reviews keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'tutor_application_reviews'
      and cls.relrowsecurity
  ),
  'tutor_application_reviews has row level security enabled'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_application_reviews'
  ),
  'tutor_application_reviews has no anon/authenticated policies (internal-only)'
);

-- Seed fixture rows via the test role (which bypasses RLS like the service role).
insert into public.app_users (id, auth_user_id, email, account_status, onboarding_state, timezone)
values
  (
    '99999999-9999-4999-8999-999999999999',
    '99999999-9999-4999-8999-999999999999',
    'admin@mentorib.test',
    'active',
    'complete',
    'UTC'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'applicant@mentorib.test',
    'active',
    'complete',
    'UTC'
  )
on conflict (id) do nothing;

insert into public.tutor_profiles (id, app_user_id, application_status)
values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'submitted'
)
on conflict (id) do nothing;

-- approved transitions do not require a reviewer_note
select lives_ok(
  $$insert into public.tutor_application_reviews
      (tutor_profile_id, reviewer_app_user_id, review_status)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '99999999-9999-4999-8999-999999999999',
      'approved'
    )$$,
  'approved review can be inserted without a reviewer_note'
);

-- changes_requested without reviewer_note must be rejected
select throws_ok(
  $$insert into public.tutor_application_reviews
      (tutor_profile_id, reviewer_app_user_id, review_status)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '99999999-9999-4999-8999-999999999999',
      'changes_requested'
    )$$,
  '23514',
  null,
  'changes_requested without a reviewer_note violates the required-note check'
);

-- rejected without reviewer_note must be rejected
select throws_ok(
  $$insert into public.tutor_application_reviews
      (tutor_profile_id, reviewer_app_user_id, review_status)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '99999999-9999-4999-8999-999999999999',
      'rejected'
    )$$,
  '23514',
  null,
  'rejected without a reviewer_note violates the required-note check'
);

-- whitespace-only reviewer_note also fails
select throws_ok(
  $$insert into public.tutor_application_reviews
      (tutor_profile_id, reviewer_app_user_id, review_status, reviewer_note)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '99999999-9999-4999-8999-999999999999',
      'changes_requested',
      '   '
    )$$,
  '23514',
  null,
  'whitespace-only reviewer_note is treated as missing'
);

-- changes_requested with a reviewer_note succeeds
select lives_ok(
  $$insert into public.tutor_application_reviews
      (tutor_profile_id, reviewer_app_user_id, review_status, reviewer_note)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '99999999-9999-4999-8999-999999999999',
      'changes_requested',
      'Please add a clearer headline.'
    )$$,
  'changes_requested with a reviewer_note is accepted'
);

-- Anonymous role cannot read internal-only rows
set local role anon;

select is(
  (select count(*) from public.tutor_application_reviews)::int,
  0,
  'anonymous cannot read tutor_application_reviews rows'
);

select throws_ok(
  $$insert into public.tutor_application_reviews
      (tutor_profile_id, reviewer_app_user_id, review_status, reviewer_note)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '99999999-9999-4999-8999-999999999999',
      'approved',
      null
    )$$,
  '42501',
  null,
  'anonymous cannot insert into tutor_application_reviews'
);

-- Authenticated (signed-in non-admin) role is denied too.
set local role authenticated;
set local "request.jwt.claim.sub" to 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select is(
  (select count(*) from public.tutor_application_reviews)::int,
  0,
  'signed-in non-admin cannot read tutor_application_reviews rows'
);

reset role;
reset "request.jwt.claim.sub";

select * from finish();
rollback;
