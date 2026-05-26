-- Internal admin foundations baseline for `P2-OPS-000`.
--
-- Adds the three shared admin tables that every later `/internal/**` task
-- depends on:
--
--   * `admin_action_logs` — canonical audit trail for privileged writes.
--     Every admin Server Action writes one row here in the same transaction
--     as the underlying state change, via the `recordAdminAction` helper in
--     `src/modules/admin/audit-service.ts`. Audit-coverage is enforced at the
--     application layer (`P2-QUALITY-001`'s audit-coverage audit).
--   * `moderation_cases` — shared case table that both the trust/report
--     surface (`P2-OPS-001`) and the lesson-issue dispute surface
--     (`P2-DISPUTE-001`) build on. Per architecture §12.6 ("operational
--     lesson cases may share internal queue infrastructure with abuse or
--     trust cases") the queue is shared but case typing remains distinct.
--   * `moderation_case_notes` — internal-only notes attached to a case
--     (§15.1). Never surfaced in any public DTO or notification payload.
--
-- Internal-only RLS posture (mirrors `tutor_application_reviews_baseline`):
-- RLS is enabled but no policies are defined for `anon` or `authenticated`,
-- so direct API access is denied. The service role bypasses RLS and is the
-- sole write/read path.

create table public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  actor_app_user_id uuid not null references public.app_users (id) on delete restrict,
  action_key text not null,
  target_type text not null,
  target_id text not null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now(),
  constraint admin_action_logs_action_key_not_blank_chk check (
    btrim(action_key) <> ''
  ),
  constraint admin_action_logs_target_type_not_blank_chk check (
    btrim(target_type) <> ''
  ),
  constraint admin_action_logs_target_id_not_blank_chk check (
    btrim(target_id) <> ''
  )
);

comment on table public.admin_action_logs is
  'Canonical audit trail for privileged admin writes. One row per privileged action, written in the same transaction as the state change via recordAdminAction (P2-OPS-000).';

create index admin_action_logs_actor_app_user_id_created_at_idx
  on public.admin_action_logs (actor_app_user_id, created_at);

create index admin_action_logs_target_type_target_id_created_at_idx
  on public.admin_action_logs (target_type, target_id, created_at);

create index admin_action_logs_action_key_created_at_idx
  on public.admin_action_logs (action_key, created_at);

alter table public.admin_action_logs enable row level security;

-- Intentionally no policies for `anon` or `authenticated`. The service role
-- bypasses RLS and owns every read/write path. Direct API access is denied.


create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  case_kind text not null,
  case_status text not null default 'queued',
  reporter_app_user_id uuid references public.app_users (id) on delete set null,
  subject_kind text not null,
  subject_id uuid not null,
  triggering_event_kind text,
  triggering_event_id uuid,
  priority smallint not null default 0,
  claimed_by_app_user_id uuid references public.app_users (id) on delete set null,
  claimed_at timestamptz,
  resolved_by_app_user_id uuid references public.app_users (id) on delete set null,
  resolved_at timestamptz,
  resolution_kind text,
  internal_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moderation_cases_case_kind_chk check (
    case_kind in ('report', 'block', 'lesson_issue', 'public_content_takedown')
  ),
  constraint moderation_cases_case_status_chk check (
    case_status in ('queued', 'under_review', 'resolved', 'dismissed', 'escalated')
  ),
  constraint moderation_cases_subject_kind_chk check (
    subject_kind in (
      'app_user',
      'tutor_profile',
      'message',
      'conversation',
      'lesson_booking'
    )
  ),
  constraint moderation_cases_resolution_kind_chk check (
    resolution_kind is null
    or resolution_kind in (
      'uphold',
      'reject',
      'split',
      'dismiss',
      'no_action',
      'escalated_to_legal'
    )
  ),
  constraint moderation_cases_claimed_consistency_chk check (
    (claimed_by_app_user_id is null and claimed_at is null)
    or (claimed_by_app_user_id is not null and claimed_at is not null)
  ),
  constraint moderation_cases_resolved_consistency_chk check (
    (resolved_by_app_user_id is null and resolved_at is null)
    or (resolved_by_app_user_id is not null and resolved_at is not null)
  ),
  constraint moderation_cases_resolved_status_chk check (
    case_status not in ('resolved', 'dismissed')
    or (resolved_by_app_user_id is not null and resolved_at is not null)
  )
);

comment on table public.moderation_cases is
  'Shared internal moderation case table backing trust/report (P2-OPS-001) and lesson-issue dispute (P2-DISPUTE-001) queues. Case typing stays distinct per architecture §12.6.';

create index moderation_cases_queue_priority_idx
  on public.moderation_cases (case_status, priority desc, created_at);

create index moderation_cases_subject_idx
  on public.moderation_cases (subject_kind, subject_id);

create trigger set_moderation_cases_updated_at
before update on public.moderation_cases
for each row execute function public.set_updated_at();

alter table public.moderation_cases enable row level security;


create table public.moderation_case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases (id) on delete cascade,
  author_app_user_id uuid not null references public.app_users (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  constraint moderation_case_notes_body_not_blank_chk check (
    btrim(body) <> ''
  )
);

comment on table public.moderation_case_notes is
  'Internal-only notes on a moderation case (architecture §15.1). Never surfaced in any public DTO or notification payload.';

create index moderation_case_notes_case_id_created_at_idx
  on public.moderation_case_notes (case_id, created_at);

alter table public.moderation_case_notes enable row level security;

-- Intentionally no policies for `anon` or `authenticated` on any of the
-- three tables. Service-role-only access posture.
