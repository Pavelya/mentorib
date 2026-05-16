create table public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  reactor_app_user_id uuid not null references public.app_users (id) on delete cascade,
  reaction_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_reactions_reaction_key_chk check (
    reaction_key in ('thumbs_up', 'heart', 'laugh', 'celebrate', 'thinking', 'clap')
  )
);

comment on table public.message_reactions is
  'Per-participant single-key reaction marker against a message owned by a tutor-student conversation.';

create unique index message_reactions_message_reactor_key
  on public.message_reactions (message_id, reactor_app_user_id);

create index message_reactions_message_idx
  on public.message_reactions (message_id);

create trigger set_message_reactions_updated_at
before update on public.message_reactions
for each row execute function public.set_updated_at();

create or replace function public.enforce_message_reaction_membership()
returns trigger
language plpgsql
as $$
declare
  reacted_conversation_id uuid;
  reacted_message_status text;
  student_app_user_id uuid;
  tutor_app_user_id uuid;
begin
  select messages.conversation_id, messages.message_status
  into reacted_conversation_id, reacted_message_status
  from public.messages
  where messages.id = new.message_id;

  if reacted_conversation_id is null then
    raise exception 'message % does not exist for reaction', new.message_id;
  end if;

  if reacted_message_status = 'removed' then
    raise exception 'reactions cannot target a removed message';
  end if;

  select student_profiles.app_user_id, tutor_profiles.app_user_id
  into student_app_user_id, tutor_app_user_id
  from public.conversations
  join public.student_profiles
    on student_profiles.id = conversations.student_profile_id
  join public.tutor_profiles
    on tutor_profiles.id = conversations.tutor_profile_id
  where conversations.id = reacted_conversation_id;

  if student_app_user_id is null or tutor_app_user_id is null then
    raise exception 'conversation % does not have a complete owner pair', reacted_conversation_id;
  end if;

  if new.reactor_app_user_id not in (student_app_user_id, tutor_app_user_id) then
    raise exception 'message_reactions.reactor_app_user_id must belong to the conversation';
  end if;

  if exists (
    select 1
    from public.user_blocks
    where block_status = 'active'
      and (
        (
          blocker_app_user_id = student_app_user_id
          and blocked_app_user_id = tutor_app_user_id
        )
        or (
          blocker_app_user_id = tutor_app_user_id
          and blocked_app_user_id = student_app_user_id
        )
      )
  ) then
    raise exception 'reactions cannot be written while an active user block exists';
  end if;

  return new;
end;
$$;

create trigger enforce_message_reaction_membership
before insert or update on public.message_reactions
for each row execute function public.enforce_message_reaction_membership();

alter table public.message_reactions enable row level security;

create policy message_reactions_select_participant
on public.message_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    join public.conversations
      on conversations.id = messages.conversation_id
    join public.student_profiles
      on student_profiles.id = conversations.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where messages.id = message_reactions.message_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.messages
    join public.conversations
      on conversations.id = messages.conversation_id
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where messages.id = message_reactions.message_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy message_reactions_insert_self
on public.message_reactions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_users
    where app_users.id = message_reactions.reactor_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.messages
    join public.conversations
      on conversations.id = messages.conversation_id
    join public.student_profiles
      on student_profiles.id = conversations.student_profile_id
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    where messages.id = message_reactions.message_id
      and message_reactions.reactor_app_user_id in (
        student_profiles.app_user_id,
        tutor_profiles.app_user_id
      )
      and messages.message_status <> 'removed'
  )
  and not exists (
    select 1
    from public.user_blocks
    join public.messages
      on messages.id = message_reactions.message_id
    join public.conversations
      on conversations.id = messages.conversation_id
    join public.student_profiles
      on student_profiles.id = conversations.student_profile_id
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    where user_blocks.block_status = 'active'
      and (
        (
          user_blocks.blocker_app_user_id = student_profiles.app_user_id
          and user_blocks.blocked_app_user_id = tutor_profiles.app_user_id
        )
        or (
          user_blocks.blocker_app_user_id = tutor_profiles.app_user_id
          and user_blocks.blocked_app_user_id = student_profiles.app_user_id
        )
      )
  )
);

create policy message_reactions_update_self
on public.message_reactions
for update
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = message_reactions.reactor_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.app_users
    where app_users.id = message_reactions.reactor_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.messages
    where messages.id = message_reactions.message_id
      and messages.message_status <> 'removed'
  )
);

create policy message_reactions_delete_self
on public.message_reactions
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = message_reactions.reactor_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

-- Realtime channel authorization: only conversation participants may
-- read/presence/broadcast on a `conversation:<id>` private topic.
create policy realtime_conversation_channel_read
on realtime.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations
    join public.student_profiles
      on student_profiles.id = conversations.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where realtime.topic() = ('conversation:' || conversations.id::text)
      and app_users.auth_user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.conversations
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where realtime.topic() = ('conversation:' || conversations.id::text)
      and app_users.auth_user_id = (select auth.uid())
  )
);

create policy realtime_conversation_channel_write
on realtime.messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.conversations
    join public.student_profiles
      on student_profiles.id = conversations.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where realtime.topic() = ('conversation:' || conversations.id::text)
      and app_users.auth_user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.conversations
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where realtime.topic() = ('conversation:' || conversations.id::text)
      and app_users.auth_user_id = (select auth.uid())
  )
);
