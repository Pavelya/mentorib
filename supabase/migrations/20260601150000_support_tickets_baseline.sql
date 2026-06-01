-- Support tickets baseline for `P2-ADMIN-SUPPORT-001`.
--
-- A public contact-us submission always creates exactly one row here. The
-- queue and detail live behind `/internal/support` and are admin-only. A
-- logged-out sender supplies their email; a logged-in sender is linked via
-- `requester_app_user_id` (kept on `on delete set null` so erasing an account
-- never deletes the operational ticket trail).
--
-- Internal-only RLS posture (mirrors `admin_foundations_baseline`): RLS is
-- enabled but no policies are defined for `anon` or `authenticated`, so direct
-- API access is denied. The service role bypasses RLS and is the sole path —
-- both the controlled public contact-form Server Action and every admin
-- read/write go through it. Inserts are never a public table insert.
--
-- Privileged operator writes (reply, status transition, assignment) each emit
-- an `admin_action_logs` row via `recordAdminAction`; ticket creation from the
-- public form is not a privileged action and is not audited.

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_app_user_id uuid references public.app_users (id) on delete set null,
  requester_email text not null,
  subject text not null,
  body text not null,
  channel text not null default 'contact_form',
  status text not null default 'open',
  assigned_to_app_user_id uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_requester_email_not_blank_chk check (
    btrim(requester_email) <> ''
  ),
  constraint support_tickets_subject_not_blank_chk check (
    btrim(subject) <> ''
  ),
  constraint support_tickets_body_not_blank_chk check (
    btrim(body) <> ''
  ),
  constraint support_tickets_channel_chk check (
    channel in ('contact_form')
  ),
  constraint support_tickets_status_chk check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  )
);

comment on table public.support_tickets is
  'Internal support tickets. One row per public contact-us submission (channel = contact_form). Admin-only via the service role; inserts only through the controlled contact-form Server Action (P2-ADMIN-SUPPORT-001).';

-- Queue ordering: operators triage oldest-first within a status filter.
create index support_tickets_status_created_at_idx
  on public.support_tickets (status, created_at);

-- Per-email lookups back the contact-form abuse guard (recent-ticket count).
create index support_tickets_requester_email_created_at_idx
  on public.support_tickets (requester_email, created_at);

create trigger set_support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

-- Intentionally no policies for `anon` or `authenticated`. The service role
-- bypasses RLS and owns every read/write path. Direct API access is denied.
