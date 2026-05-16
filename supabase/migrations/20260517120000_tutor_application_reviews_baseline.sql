-- Tutor application reviews baseline for `P2-APPLY-002`.
--
-- Adds:
--   * `tutor_application_reviews` table — one row per tutor-application
--     review transition. The table doubles as the audit trail for the
--     application review workflow (claim → request changes → approve /
--     reject). A separate `admin_action_logs` table is out of scope and is
--     owned by `P2-OPS-001`.
--
-- Design notes (locked in `P2-APPLY-002`):
--   * `review_status` mirrors glossary §13.4 and is intentionally distinct
--     from the applicant-facing `tutor_profiles.application_status`. Both
--     statuses are updated atomically in application code (a single Server
--     Action wraps the transition + status flip + role activation).
--   * `reviewer_note` is exposed to the applicant when status is
--     `changes_requested` or `rejected`. `internal_note` is never exposed
--     to the applicant — it is for reviewer-to-reviewer context only.
--   * Internal-only access posture: RLS is enabled but no policies are
--     defined for the `anon` or `authenticated` roles, so direct API
--     access is denied. The service role bypasses RLS and is the sole
--     write path (consistent with how `applySetupRoleSelection` and the
--     existing application services touch `tutor_profiles`).

create table public.tutor_application_reviews (
  id uuid primary key default gen_random_uuid(),
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  reviewer_app_user_id uuid not null references public.app_users (id) on delete restrict,
  review_status text not null,
  reviewer_note text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_application_reviews_review_status_chk check (
    review_status in (
      'queued',
      'under_review',
      'changes_requested',
      'approved',
      'rejected'
    )
  ),
  constraint tutor_application_reviews_reviewer_note_required_chk check (
    review_status not in ('changes_requested', 'rejected')
    or (reviewer_note is not null and length(btrim(reviewer_note)) > 0)
  )
);

comment on table public.tutor_application_reviews is
  'Internal-only audit trail for tutor application review decisions. Each row captures one state transition. `reviewer_note` may be surfaced to the applicant for changes_requested / rejected; `internal_note` is reviewer-only.';

create index tutor_application_reviews_tutor_profile_id_idx
  on public.tutor_application_reviews (tutor_profile_id, created_at desc);

create index tutor_application_reviews_review_status_created_at_idx
  on public.tutor_application_reviews (review_status, created_at);

create index tutor_application_reviews_reviewer_app_user_id_idx
  on public.tutor_application_reviews (reviewer_app_user_id);

create trigger set_tutor_application_reviews_updated_at
before update on public.tutor_application_reviews
for each row execute function public.set_updated_at();

alter table public.tutor_application_reviews enable row level security;

-- Intentionally no policies for `anon` or `authenticated`. The service role
-- bypasses RLS and owns every read/write path. Direct API access is denied.
