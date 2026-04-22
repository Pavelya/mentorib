begin;

select plan(30);

select has_table('public', 'notifications', 'notifications exists');
select has_table('public', 'notification_deliveries', 'notification_deliveries exists');
select has_table('public', 'policy_notice_versions', 'policy_notice_versions exists');
select has_table('public', 'policy_notice_receipts', 'policy_notice_receipts exists');

select has_column(
  'public',
  'notifications',
  'read_at',
  'notifications records the owner-visible read timestamp'
);
select has_column(
  'public',
  'notification_deliveries',
  'job_run_id',
  'notification_deliveries links delivery work to async job visibility'
);
select has_column(
  'public',
  'policy_notice_versions',
  'requires_acknowledgement',
  'policy_notice_versions can require explicit acknowledgement'
);
select has_column(
  'public',
  'policy_notice_receipts',
  'acknowledged_at',
  'policy_notice_receipts can prove acknowledgement time'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'notifications_status_chk'
  ),
  'notifications keeps controlled lifecycle statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'notifications_type_chk'
  ),
  'notifications keeps controlled notification types'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'notification_deliveries_status_chk'
  ),
  'notification_deliveries keeps controlled delivery statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'notification_deliveries_attempt_key'
  ),
  'notification_deliveries tracks unique channel attempts per notification'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'policy_notice_versions_notice_type_version_key'
  ),
  'policy_notice_versions keeps one row per notice type and version label'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'policy_notice_receipts_notice_user_key'
  ),
  'policy_notice_receipts keeps one receipt per user and notice version'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'policy_notice_receipts_acknowledged_order_chk'
  ),
  'policy_notice_receipts requires acknowledgement after viewing'
);

select ok(
  exists (
    select 1
    from pg_class
    where relname = 'notifications_owner_status_created_at_idx'
  ),
  'notifications keeps an owner/status inbox index'
);

select ok(
  exists (
    select 1
    from pg_class
    where relname = 'notification_deliveries_pending_idx'
  ),
  'notification_deliveries keeps a pending-delivery index'
);

select ok(
  exists (
    select 1
    from pg_class
    where relname = 'policy_notice_receipts_app_user_notice_idx'
  ),
  'policy_notice_receipts keeps a user notice lookup index'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_notifications_updated_at'
  ),
  'notifications keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_notification_deliveries_updated_at'
  ),
  'notification_deliveries keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_policy_notice_versions_updated_at'
  ),
  'policy_notice_versions keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_policy_notice_receipts_updated_at'
  ),
  'policy_notice_receipts keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'notifications'
      and cls.relrowsecurity
  ),
  'notifications has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'notification_deliveries'
      and cls.relrowsecurity
  ),
  'notification_deliveries has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'policy_notice_versions'
      and cls.relrowsecurity
  ),
  'policy_notice_versions has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'policy_notice_receipts'
      and cls.relrowsecurity
  ),
  'policy_notice_receipts has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_self'
  ),
  'notifications has an owner read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'policy_notice_versions'
      and policyname = 'policy_notice_versions_select_published_authenticated'
  ),
  'policy_notice_versions exposes published notices to authenticated users'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'policy_notice_receipts'
      and policyname = 'policy_notice_receipts_select_self'
  ),
  'policy_notice_receipts has an owner read policy'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_deliveries'
  ),
  'notification_deliveries remains internal-only under RLS'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'job_runs_job_type_chk'
      and pg_get_constraintdef(oid) like '%notification_delivery%'
  ),
  'job_runs exposes notification_delivery job visibility'
);

select * from finish();
rollback;
