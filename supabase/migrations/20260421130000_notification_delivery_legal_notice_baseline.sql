create table public.policy_notice_versions (
  id uuid primary key default gen_random_uuid(),
  notice_type text not null,
  version_label text not null,
  published_at timestamptz not null default now(),
  effective_at timestamptz not null default now(),
  requires_acknowledgement boolean not null default false,
  title text not null,
  summary text not null,
  document_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_notice_versions_notice_type_chk check (
    notice_type in (
      'terms',
      'privacy',
      'cookie_notice',
      'tutor_agreement',
      'trust_and_safety',
      'refund_policy'
    )
  ),
  constraint policy_notice_versions_version_label_not_blank_chk check (
    btrim(version_label) <> ''
  ),
  constraint policy_notice_versions_title_not_blank_chk check (
    btrim(title) <> ''
  ),
  constraint policy_notice_versions_summary_not_blank_chk check (
    btrim(summary) <> ''
  ),
  constraint policy_notice_versions_document_url_not_blank_chk check (
    btrim(document_url) <> ''
  ),
  constraint policy_notice_versions_notice_type_version_key unique (
    notice_type,
    version_label
  )
);

comment on table public.policy_notice_versions is
  'Canonical versioned legal notice records for terms, privacy, and other mandatory product-visible policy broadcasts.';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  notification_type text not null,
  notification_status text not null default 'unread',
  object_type text not null,
  object_id uuid,
  title text not null,
  body_summary text not null,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_type_chk check (
    notification_type in (
      'new_message',
      'lesson_request_submitted',
      'lesson_accepted',
      'lesson_declined',
      'lesson_request_expired',
      'lesson_updated',
      'upcoming_lesson_reminder',
      'lesson_issue_acknowledgement',
      'lesson_issue_resolution',
      'review_submitted',
      'tutor_application_submitted',
      'tutor_application_reviewed',
      'payout_processed',
      'policy_notice_updated'
    )
  ),
  constraint notifications_status_chk check (
    notification_status in ('unread', 'read', 'dismissed')
  ),
  constraint notifications_object_type_not_blank_chk check (
    btrim(object_type) <> ''
  ),
  constraint notifications_title_not_blank_chk check (btrim(title) <> ''),
  constraint notifications_body_summary_not_blank_chk check (
    btrim(body_summary) <> ''
  ),
  constraint notifications_read_at_consistency_chk check (
    (
      notification_status = 'read'
      and read_at is not null
      and dismissed_at is null
    )
    or (
      notification_status = 'dismissed'
      and dismissed_at is not null
    )
    or (
      notification_status = 'unread'
      and read_at is null
      and dismissed_at is null
    )
  )
);

comment on table public.notifications is
  'Canonical in-app product notification object owned by a recipient; email and future channel sends are delivery outcomes, not the product truth.';

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  job_run_id uuid references public.job_runs (id) on delete set null,
  channel text not null,
  delivery_status text not null default 'queued',
  attempt_number integer not null default 1,
  provider text,
  provider_message_id text,
  attempted_at timestamptz,
  accepted_at timestamptz,
  failed_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_channel_chk check (
    channel in ('in_app', 'email')
  ),
  constraint notification_deliveries_status_chk check (
    delivery_status in ('queued', 'attempted', 'accepted', 'failed')
  ),
  constraint notification_deliveries_attempt_number_chk check (attempt_number >= 1),
  constraint notification_deliveries_status_timestamp_chk check (
    (
      delivery_status = 'queued'
      and attempted_at is null
      and accepted_at is null
      and failed_at is null
    )
    or (
      delivery_status = 'attempted'
      and attempted_at is not null
      and accepted_at is null
      and failed_at is null
    )
    or (
      delivery_status = 'accepted'
      and attempted_at is not null
      and accepted_at is not null
      and failed_at is null
    )
    or (
      delivery_status = 'failed'
      and attempted_at is not null
      and accepted_at is null
      and failed_at is not null
    )
  ),
  constraint notification_deliveries_attempt_key unique (
    notification_id,
    channel,
    attempt_number
  )
);

comment on table public.notification_deliveries is
  'Channel-specific outbound delivery tracking for important notifications, especially transactional email, kept separate from canonical notification state.';

create table public.policy_notice_receipts (
  id uuid primary key default gen_random_uuid(),
  policy_notice_version_id uuid not null
    references public.policy_notice_versions (id) on delete restrict,
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  first_shown_at timestamptz,
  viewed_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_notice_receipts_notice_user_key unique (
    policy_notice_version_id,
    app_user_id
  ),
  constraint policy_notice_receipts_viewed_order_chk check (
    viewed_at is null
    or (
      first_shown_at is not null
      and viewed_at >= first_shown_at
    )
  ),
  constraint policy_notice_receipts_acknowledged_order_chk check (
    acknowledged_at is null
    or (
      viewed_at is not null
      and acknowledged_at >= viewed_at
    )
  )
);

comment on table public.policy_notice_receipts is
  'Per-user legal notice visibility and acknowledgement proof for mandatory product-visible policy updates.';

create index policy_notice_versions_notice_type_published_at_idx
  on public.policy_notice_versions (notice_type, published_at desc);

create index notifications_owner_status_created_at_idx
  on public.notifications (app_user_id, notification_status, created_at desc);

create index notifications_object_idx
  on public.notifications (object_type, object_id)
  where object_id is not null;

create index notification_deliveries_pending_idx
  on public.notification_deliveries (delivery_status, created_at)
  where delivery_status in ('queued', 'failed');

create index notification_deliveries_job_run_idx
  on public.notification_deliveries (job_run_id)
  where job_run_id is not null;

create unique index notification_deliveries_provider_message_key
  on public.notification_deliveries (provider, provider_message_id)
  where provider_message_id is not null;

create index policy_notice_receipts_app_user_notice_idx
  on public.policy_notice_receipts (app_user_id, policy_notice_version_id);

create trigger set_policy_notice_versions_updated_at
before update on public.policy_notice_versions
for each row execute function public.set_updated_at();

create trigger set_notifications_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

create trigger set_notification_deliveries_updated_at
before update on public.notification_deliveries
for each row execute function public.set_updated_at();

create trigger set_policy_notice_receipts_updated_at
before update on public.policy_notice_receipts
for each row execute function public.set_updated_at();

alter table public.policy_notice_versions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.policy_notice_receipts enable row level security;

create policy policy_notice_versions_select_published_authenticated
on public.policy_notice_versions
for select
to authenticated
using (published_at <= now());

create policy notifications_select_self
on public.notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = notifications.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy policy_notice_receipts_select_self
on public.policy_notice_receipts
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = policy_notice_receipts.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);
