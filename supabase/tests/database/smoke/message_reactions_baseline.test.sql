begin;

select plan(14);

select has_table(
  'public',
  'message_reactions',
  'message_reactions exists'
);

select has_column(
  'public',
  'message_reactions',
  'reaction_key',
  'message_reactions exposes reaction_key'
);

select has_column(
  'public',
  'message_reactions',
  'reactor_app_user_id',
  'message_reactions exposes reactor_app_user_id'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'message_reactions_reaction_key_chk'
  ),
  'message_reactions limits reaction_key to the canonical six keys'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'message_reactions'
      and indexname = 'message_reactions_message_reactor_key'
  ),
  'message_reactions keeps one reaction per (message, reactor)'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'message_reactions'
      and indexname = 'message_reactions_message_idx'
  ),
  'message_reactions indexes per-message lookups'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'enforce_message_reaction_membership'
  ),
  'message_reactions enforces participant membership via trigger'
);

select ok(
  exists (
    select 1
    from pg_class cls
    join pg_namespace nsp
      on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = 'message_reactions'
      and cls.relrowsecurity
  ),
  'message_reactions has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'message_reactions'
      and policyname = 'message_reactions_select_participant'
  ),
  'message_reactions has a participant read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'message_reactions'
      and policyname = 'message_reactions_insert_self'
  ),
  'message_reactions has a self-insert policy that mirrors participant + block rules'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'message_reactions'
      and policyname = 'message_reactions_update_self'
  ),
  'message_reactions has a self-update policy for reaction switches'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'message_reactions'
      and policyname = 'message_reactions_delete_self'
  ),
  'message_reactions has a self-delete policy for reaction removal'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'realtime'
      and tablename = 'messages'
      and policyname = 'realtime_conversation_channel_read'
  ),
  'realtime.messages has a participant-only read policy for conversation:<id> topics'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'realtime'
      and tablename = 'messages'
      and policyname = 'realtime_conversation_channel_write'
  ),
  'realtime.messages has a participant-only write policy for conversation:<id> topics'
);

select * from finish();
rollback;
