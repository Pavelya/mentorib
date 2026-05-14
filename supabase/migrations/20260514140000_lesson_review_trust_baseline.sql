-- Lesson-linked tutor review baseline for `P2-TRUST-001`.
--
-- Adds:
--   * `reviews` table — one student-to-tutor review evidence row per
--     completed lesson with explicit moderation and publication state.
--   * `tutor_rating_snapshot` projection — derived public rating aggregate
--     refreshed on review state transitions. Uses Bayesian smoothing with
--     the platform-wide prior locked in `docs/architecture/rating-and-review-trust-architecture-v1.md`.
--
-- The schema enforces the locked decisions:
--   * reviews are lesson-linked (one row per lesson, FK to `lessons.id`)
--   * direction is student-to-tutor (the participant pair is enforced)
--   * only completed lessons can carry reviews
--   * publication is explicit and moderation-aware
--   * the public rating aggregate is derived, never a raw column

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  rating_value smallint not null,
  comment text,
  review_status text not null default 'published',
  submitted_at timestamptz not null default now(),
  published_at timestamptz,
  flagged_at timestamptz,
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_value_chk check (rating_value between 1 and 5),
  constraint reviews_comment_not_blank_chk check (
    comment is null or btrim(comment) <> ''
  ),
  constraint reviews_comment_length_chk check (
    comment is null or char_length(comment) <= 1000
  ),
  constraint reviews_review_status_chk check (
    review_status in (
      'submitted',
      'under_review',
      'published',
      'hidden',
      'rejected'
    )
  ),
  constraint reviews_published_at_consistency_chk check (
    (review_status = 'published' and published_at is not null)
    or (review_status <> 'published' and published_at is null)
  ),
  constraint reviews_moderation_note_not_blank_chk check (
    moderation_note is null or btrim(moderation_note) <> ''
  ),
  constraint reviews_lesson_id_key unique (lesson_id)
);

comment on table public.reviews is
  'Lesson-linked student-to-tutor review evidence with explicit moderation and publication state; one row per lesson.';

create index reviews_tutor_status_idx
  on public.reviews (tutor_profile_id, review_status);

create index reviews_tutor_published_at_idx
  on public.reviews (tutor_profile_id, published_at desc nulls last)
  where review_status = 'published';

create index reviews_student_submitted_at_idx
  on public.reviews (student_profile_id, submitted_at desc);

create or replace function public.enforce_review_lesson_participants()
returns trigger
language plpgsql
as $$
declare
  lesson_student_profile_id uuid;
  lesson_tutor_profile_id uuid;
  lesson_status_value text;
begin
  select
    lessons.student_profile_id,
    lessons.tutor_profile_id,
    lessons.lesson_status
  into
    lesson_student_profile_id,
    lesson_tutor_profile_id,
    lesson_status_value
  from public.lessons
  where lessons.id = new.lesson_id;

  if lesson_student_profile_id is null then
    raise exception 'lesson_id % does not exist', new.lesson_id;
  end if;

  if new.student_profile_id <> lesson_student_profile_id then
    raise exception
      'review student_profile_id % does not match lesson student %',
      new.student_profile_id, lesson_student_profile_id;
  end if;

  if new.tutor_profile_id <> lesson_tutor_profile_id then
    raise exception
      'review tutor_profile_id % does not match lesson tutor %',
      new.tutor_profile_id, lesson_tutor_profile_id;
  end if;

  if tg_op = 'INSERT' and lesson_status_value not in ('completed', 'reviewed') then
    raise exception
      'reviews can only be created against completed lessons (lesson % has status %)',
      new.lesson_id, lesson_status_value;
  end if;

  return new;
end;
$$;

create trigger enforce_review_lesson_participants
before insert or update on public.reviews
for each row execute function public.enforce_review_lesson_participants();

create table public.tutor_rating_snapshot (
  tutor_profile_id uuid primary key references public.tutor_profiles (id) on delete cascade,
  published_review_count integer not null default 0,
  rating_sum integer not null default 0,
  average_rating_value numeric(4, 3),
  smoothed_rating_value numeric(4, 3),
  prior_review_count integer not null default 5,
  prior_rating_value numeric(4, 3) not null default 4.500,
  aggregation_version text not null default 'v1',
  last_recomputed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_rating_snapshot_published_review_count_chk
    check (published_review_count >= 0),
  constraint tutor_rating_snapshot_rating_sum_chk check (rating_sum >= 0),
  constraint tutor_rating_snapshot_prior_review_count_chk
    check (prior_review_count > 0),
  constraint tutor_rating_snapshot_prior_rating_value_chk
    check (prior_rating_value between 1 and 5),
  constraint tutor_rating_snapshot_aggregation_version_not_blank_chk
    check (btrim(aggregation_version) <> '')
);

comment on table public.tutor_rating_snapshot is
  'Derived public rating aggregate per tutor; refreshed when published review state changes. Public surfaces read this, never raw `reviews`.';

create or replace function public.refresh_tutor_rating_snapshot(p_tutor_profile_id uuid)
returns void
language plpgsql
as $$
declare
  v_published_count integer;
  v_rating_sum integer;
  v_average numeric(4, 3);
  v_smoothed numeric(4, 3);
  v_prior_count integer := 5;
  v_prior_value numeric(4, 3) := 4.500;
begin
  select
    coalesce(count(*), 0),
    coalesce(sum(rating_value), 0)
  into v_published_count, v_rating_sum
  from public.reviews
  where reviews.tutor_profile_id = p_tutor_profile_id
    and reviews.review_status = 'published';

  if v_published_count > 0 then
    v_average := round((v_rating_sum::numeric / v_published_count)::numeric, 3);
  else
    v_average := null;
  end if;

  v_smoothed := round(
    (
      (v_rating_sum::numeric + (v_prior_count * v_prior_value))
      / (v_published_count + v_prior_count)
    )::numeric,
    3
  );

  insert into public.tutor_rating_snapshot as snapshot (
    tutor_profile_id,
    published_review_count,
    rating_sum,
    average_rating_value,
    smoothed_rating_value,
    prior_review_count,
    prior_rating_value,
    last_recomputed_at,
    updated_at
  )
  values (
    p_tutor_profile_id,
    v_published_count,
    v_rating_sum,
    v_average,
    v_smoothed,
    v_prior_count,
    v_prior_value,
    now(),
    now()
  )
  on conflict (tutor_profile_id) do update
    set
      published_review_count = excluded.published_review_count,
      rating_sum = excluded.rating_sum,
      average_rating_value = excluded.average_rating_value,
      smoothed_rating_value = excluded.smoothed_rating_value,
      prior_review_count = excluded.prior_review_count,
      prior_rating_value = excluded.prior_rating_value,
      last_recomputed_at = now(),
      updated_at = now();
end;
$$;

create or replace function public.refresh_tutor_rating_snapshot_on_review_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_tutor_rating_snapshot(new.tutor_profile_id);
  elsif tg_op = 'UPDATE' then
    if new.tutor_profile_id is distinct from old.tutor_profile_id then
      perform public.refresh_tutor_rating_snapshot(old.tutor_profile_id);
    end if;
    perform public.refresh_tutor_rating_snapshot(new.tutor_profile_id);
  elsif tg_op = 'DELETE' then
    perform public.refresh_tutor_rating_snapshot(old.tutor_profile_id);
    return old;
  end if;

  return new;
end;
$$;

create trigger refresh_tutor_rating_snapshot_on_review_change
after insert or update or delete on public.reviews
for each row execute function public.refresh_tutor_rating_snapshot_on_review_change();

alter table public.reviews enable row level security;
alter table public.tutor_rating_snapshot enable row level security;

create policy reviews_select_participant
on public.reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.student_profiles
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where student_profiles.id = reviews.student_profile_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = reviews.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
  or reviews.review_status = 'published'
);

create policy reviews_select_published_anon
on public.reviews
for select
to anon
using (review_status = 'published');

create policy tutor_rating_snapshot_select_all
on public.tutor_rating_snapshot
for select
to anon, authenticated
using (true);
