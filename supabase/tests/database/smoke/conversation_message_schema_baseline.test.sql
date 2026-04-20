begin;

select plan(28);

select has_table('public', 'conversations', 'conversations exists');
select has_table('public', 'conversation_participants', 'conversation_participants exists');
select has_table('public', 'messages', 'messages exists');
select has_table('public', 'message_reads', 'message_reads exists');
select has_table('public', 'user_blocks', 'user_blocks exists');
select has_table('public', 'abuse_reports', 'abuse_reports exists');

select has_column(
  'public',
  'conversations',
  'last_message_id',
  'conversations exposes last_message_id for list freshness shaping'
);
select has_column(
  'public',
  'abuse_reports',
  'reported_message_id',
  'abuse_reports can capture message-specific moderation context'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'conversations_student_tutor_pair_key'
  ),
  'conversations keeps one thread per student-tutor relationship'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'conversation_participants_conversation_app_user_key'
  ),
  'conversation_participants prevents duplicate participant rows'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'conversation_participants_conversation_role_key'
  ),
  'conversation_participants keeps one row per role in a conversation'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'message_reads_message_app_user_key'
  ),
  'message_reads keeps one read marker per message and participant'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'user_blocks_blocker_blocked_key'
  ),
  'user_blocks keeps one durable block edge per blocker-blocked pair'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'conversations_last_message_id_fkey'
  ),
  'conversations last_message_id references messages'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_message_sender_membership'
  ),
  'messages keeps the sender-membership enforcement trigger'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'sync_conversation_last_message'
  ),
  'messages keeps the conversation freshness sync trigger'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'conversations'
      and cls.relrowsecurity
  ),
  'conversations has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'messages'
      and cls.relrowsecurity
  ),
  'messages has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'user_blocks'
      and cls.relrowsecurity
  ),
  'user_blocks has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'conversations'
      and policyname = 'conversations_select_participant'
  ),
  'conversations has a participant read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'conversation_participants'
      and policyname = 'conversation_participants_select_participant'
  ),
  'conversation_participants has a participant read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_select_participant'
  ),
  'messages has a participant read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'message_reads'
      and policyname = 'message_reads_select_self'
  ),
  'message_reads has a self-read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_blocks'
      and policyname = 'user_blocks_select_self'
  ),
  'user_blocks has a blocker-owned read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'abuse_reports'
      and policyname = 'abuse_reports_select_self'
  ),
  'abuse_reports has a reporter-owned read policy'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'messages_status_chk'
  ),
  'messages keeps controlled message statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'user_blocks_status_chk'
  ),
  'user_blocks keeps controlled block statuses'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'abuse_reports_report_status_chk'
  ),
  'abuse_reports keeps controlled report statuses'
);

select * from finish();
rollback;
