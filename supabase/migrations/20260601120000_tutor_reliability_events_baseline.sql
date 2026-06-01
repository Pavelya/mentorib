-- Reliability-event storage for resolved lesson-issue disputes (P2-OPSFIX-006).
--
-- The lesson-issue + dispute model (docs/data/lesson-issue-and-dispute-model-v1
-- §12) promises that a confirmed tutor-fault resolution records a reliability
-- event, and the cancellation copy already tells tutors this happens
-- (`lesson-actions.ts`). Until now that promise had no storage. This migration
-- ships the write target so dispute resolution (`P2-OPSFIX-006`) can persist
-- real records. Aggregation, scoring, and the tutor-facing reliability panel
-- are deferred to a later task — only the write path is implemented here.
--
-- Internal-only RLS posture (mirrors `admin_foundations_baseline`): RLS is
-- enabled but no policies are defined for `anon` or `authenticated`, so direct
-- API access is denied. The service role bypasses RLS and is the sole
-- write/read path.

create table public.tutor_reliability_events (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  event_kind text not null,
  weight smallint not null default 1,
  source_kind text not null,
  source_id uuid,
  created_at timestamptz not null default now(),
  constraint tutor_reliability_events_event_kind_chk check (
    event_kind in ('no_show_confirmed', 'wrong_link_fault', 'partial_delivery')
  ),
  constraint tutor_reliability_events_source_kind_chk check (
    source_kind in ('lesson_issue_resolution', 'admin_manual')
  )
);

comment on table public.tutor_reliability_events is
  'Per-incident reliability penalty records for tutors, written on confirmed tutor-fault lesson-issue resolutions (P2-OPSFIX-006). Aggregation/scoring + tutor-facing display are a later task; this table is the write path only.';

create index tutor_reliability_events_tutor_profile_id_created_at_idx
  on public.tutor_reliability_events (tutor_profile_id, created_at);

alter table public.tutor_reliability_events enable row level security;

-- Intentionally no policies for `anon` or `authenticated`. The service role
-- bypasses RLS and owns every read/write path. Direct API access is denied.
