create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  verification_status text not null,
  processing_status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  signature_header text,
  error_code text,
  error_message text,
  received_at timestamptz not null default now(),
  verified_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_events_provider_chk check (provider in ('stripe')),
  constraint webhook_events_verification_status_chk check (
    verification_status in ('verified', 'rejected')
  ),
  constraint webhook_events_processing_status_chk check (
    processing_status in ('received', 'processing', 'processed', 'ignored', 'failed')
  ),
  constraint webhook_events_provider_event_key unique (provider, provider_event_id)
);

comment on table public.webhook_events is
  'Durable receipt and idempotency record for inbound provider webhooks, starting with Stripe.';

create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  job_status text not null default 'queued',
  dedupe_key text,
  trigger_object_type text,
  trigger_object_id text,
  attempt_number integer not null default 0,
  max_attempts integer not null default 5,
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  last_failed_at timestamptz,
  dead_lettered_at timestamptz,
  failure_code text,
  failure_message text,
  payload jsonb not null default '{}'::jsonb,
  result_payload jsonb,
  last_error_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_runs_job_type_chk check (
    job_type in (
      'booking_authorization_expiry_scan',
      'notification_delivery',
      'payout_processing',
      'stripe_webhook_process',
      'trust_snapshot_refresh'
    )
  ),
  constraint job_runs_job_status_chk check (
    job_status in (
      'queued',
      'running',
      'retryable',
      'completed',
      'dead_lettered',
      'cancelled'
    )
  ),
  constraint job_runs_max_attempts_chk check (max_attempts >= 1),
  constraint job_runs_attempt_number_chk check (attempt_number >= 0)
);

comment on table public.job_runs is
  'Durable background job lifecycle rows with retry, dedupe, and dead-letter visibility.';

create unique index job_runs_job_type_dedupe_key_key
  on public.job_runs (job_type, dedupe_key)
  where dedupe_key is not null;

create index job_runs_due_idx
  on public.job_runs (available_at, created_at)
  where job_status in ('queued', 'retryable');

create index job_runs_trigger_object_idx
  on public.job_runs (trigger_object_type, trigger_object_id);

create index webhook_events_received_idx
  on public.webhook_events (processing_status, received_at);

create index webhook_events_verified_processing_idx
  on public.webhook_events (verification_status, processing_status, received_at);

create trigger set_webhook_events_updated_at
before update on public.webhook_events
for each row execute function public.set_updated_at();

create trigger set_job_runs_updated_at
before update on public.job_runs
for each row execute function public.set_updated_at();

alter table public.webhook_events enable row level security;
alter table public.job_runs enable row level security;

create or replace function public.claim_job_runs(p_limit integer default 10)
returns setof public.job_runs
language plpgsql
as $$
begin
  return query
  with candidate_rows as (
    select job_runs.id
    from public.job_runs
    where job_runs.job_status in ('queued', 'retryable')
      and job_runs.available_at <= now()
    order by job_runs.available_at asc, job_runs.created_at asc
    limit greatest(coalesce(p_limit, 10), 1)
    for update skip locked
  )
  update public.job_runs
  set job_status = 'running',
      attempt_number = public.job_runs.attempt_number + 1,
      claimed_at = now(),
      started_at = now(),
      finished_at = null,
      updated_at = now()
  where public.job_runs.id in (select id from candidate_rows)
  returning public.job_runs.*;
end;
$$;

comment on function public.claim_job_runs(integer) is
  'Atomically claims due queued/retryable jobs for a worker sweep using SKIP LOCKED semantics.';
