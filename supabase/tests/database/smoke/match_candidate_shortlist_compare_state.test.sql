begin;

select plan(4);

select has_column(
  'public',
  'match_candidates',
  'shortlisted_at',
  'match_candidates expose a shortlisted_at timestamp'
);

select has_column(
  'public',
  'match_candidates',
  'compared_at',
  'match_candidates expose a compared_at timestamp'
);

select ok(
  exists (
    select 1
    from pg_proc proc
    join pg_namespace nsp
      on nsp.oid = proc.pronamespace
    where nsp.nspname = 'public'
      and proc.proname = 'enforce_match_candidate_compare_cap'
  ),
  'compare cap enforcement function exists'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_match_candidate_compare_cap'
  ),
  'compare cap trigger is installed on match_candidates'
);

select * from finish();

rollback;
