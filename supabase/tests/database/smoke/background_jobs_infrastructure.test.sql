begin;

select plan(19);

select has_table('public', 'job_runs', 'job_runs exists');
select has_table('public', 'webhook_events', 'webhook_events exists');

select col_is_pk('public', 'job_runs', 'id', 'job_runs keeps a UUID primary key');
select col_is_pk('public', 'webhook_events', 'id', 'webhook_events keeps a UUID primary key');

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'webhook_events_provider_event_key'
  ),
  'webhook_events dedupes provider event ids'
);

select ok(
  exists (
    select 1
    from pg_class
    where relname = 'job_runs_job_type_dedupe_key_key'
  ),
  'job_runs keeps a unique dedupe index'
);

select ok(
  exists (
    select 1
    from pg_proc
    where proname = 'claim_job_runs'
      and pronamespace = 'public'::regnamespace
  ),
  'claim_job_runs exists'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'job_runs'
      and cls.relrowsecurity
  ),
  'job_runs has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'webhook_events'
      and cls.relrowsecurity
  ),
  'webhook_events has row level security enabled'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_runs'
      and column_name = 'dedupe_key'
  ),
  'job_runs exposes a durable dedupe key'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_runs'
      and column_name = 'dead_lettered_at'
  ),
  'job_runs exposes dead-letter state'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'job_runs'
      and column_name = 'payload'
  ),
  'job_runs stores JSON payload context'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'webhook_events'
      and column_name = 'payload'
  ),
  'webhook_events stores raw webhook payload context'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'webhook_events'
      and column_name = 'verification_status'
  ),
  'webhook_events tracks verification state'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'webhook_events'
      and column_name = 'processing_status'
  ),
  'webhook_events tracks processing state'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_job_runs_updated_at'
  ),
  'job_runs keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'set_webhook_events_updated_at'
  ),
  'webhook_events keeps updated_at synchronized'
);

select ok(
  exists (
    select 1
    from pg_class
    where relname = 'job_runs_due_idx'
  ),
  'job_runs keeps an index for due work scans'
);

select ok(
  exists (
    select 1
    from pg_class
    where relname = 'webhook_events_verified_processing_idx'
  ),
  'webhook_events keeps an index for verified pending sweeps'
);

select * from finish();
rollback;
