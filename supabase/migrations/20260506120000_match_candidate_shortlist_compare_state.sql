alter table public.match_candidates
  add column shortlisted_at timestamptz,
  add column compared_at timestamptz;

create index match_candidates_run_shortlisted_idx
  on public.match_candidates (match_run_id, shortlisted_at)
  where shortlisted_at is not null;

create index match_candidates_run_compared_idx
  on public.match_candidates (match_run_id, compared_at)
  where compared_at is not null;

comment on column public.match_candidates.shortlisted_at is
  'Timestamp the owning student last shortlisted this candidate; null when not shortlisted.';

comment on column public.match_candidates.compared_at is
  'Timestamp the owning student last added this candidate to compare; null when not in compare.';

create function public.enforce_match_candidate_compare_cap()
returns trigger
language plpgsql
as $$
declare
  compare_cap constant integer := 3;
  current_count integer;
begin
  if new.compared_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.compared_at is not null then
    return new;
  end if;

  select count(*)
  into current_count
  from public.match_candidates
  where match_run_id = new.match_run_id
    and compared_at is not null
    and id <> new.id;

  if current_count >= compare_cap then
    raise exception 'match_candidate compare cap of % reached for match_run %',
      compare_cap, new.match_run_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger enforce_match_candidate_compare_cap
before insert or update of compared_at on public.match_candidates
for each row execute function public.enforce_match_candidate_compare_cap();
