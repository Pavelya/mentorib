begin;

select plan(7);

select has_table(
  'public',
  'tutor_reliability_events',
  'tutor_reliability_events table exists'
);

select has_column(
  'public',
  'tutor_reliability_events',
  'tutor_profile_id',
  'tutor_reliability_events links to a tutor profile'
);

select has_column(
  'public',
  'tutor_reliability_events',
  'event_kind',
  'tutor_reliability_events carries the event_kind column'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_reliability_events_event_kind_chk'
  ),
  'tutor_reliability_events constrains event_kind to the canonical set'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'tutor_reliability_events_source_kind_chk'
  ),
  'tutor_reliability_events constrains source_kind to the canonical set'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.tutor_reliability_events'::regclass
  ),
  'tutor_reliability_events has row level security enabled'
);

select is_empty(
  $$
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_reliability_events'
  $$,
  'tutor_reliability_events has no anon/authenticated policies (internal-only)'
);

select * from finish();

rollback;
