create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  tutor_profile_id uuid not null references public.tutor_profiles (id) on delete cascade,
  conversation_status text not null default 'active',
  last_message_at timestamptz,
  last_message_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_status_chk check (
    conversation_status in ('active', 'blocked', 'archived')
  ),
  constraint conversations_student_tutor_pair_key unique (
    student_profile_id,
    tutor_profile_id
  )
);

comment on table public.conversations is
  'Canonical one-to-one tutor-student thread record that owns relationship-scoped messaging state and list freshness anchors.';

create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  participant_role text not null,
  is_muted boolean not null default false,
  is_archived boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_participants_role_chk check (
    participant_role in ('student', 'tutor')
  ),
  constraint conversation_participants_conversation_app_user_key unique (
    conversation_id,
    app_user_id
  ),
  constraint conversation_participants_conversation_role_key unique (
    conversation_id,
    participant_role
  )
);

comment on table public.conversation_participants is
  'Per-participant thread preferences and roster rows constrained to the explicit student/tutor owner pair of each conversation.';

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_app_user_id uuid not null references public.app_users (id) on delete cascade,
  reply_to_message_id uuid references public.messages (id) on delete set null,
  body text not null,
  message_status text not null default 'sent',
  edited_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_body_not_blank_chk check (btrim(body) <> ''),
  constraint messages_status_chk check (
    message_status in ('sent', 'edited', 'removed', 'flagged')
  ),
  constraint messages_edited_at_consistency_chk check (
    (
      message_status = 'edited'
      and edited_at is not null
    )
    or (
      message_status <> 'edited'
      and edited_at is null
    )
  ),
  constraint messages_removed_at_consistency_chk check (
    (
      message_status = 'removed'
      and removed_at is not null
    )
    or (
      message_status <> 'removed'
      and removed_at is null
    )
  )
);

comment on table public.messages is
  'Canonical text-message ledger for participant-scoped communication, reply threading, and moderation retention.';

alter table public.conversations
  add constraint conversations_last_message_id_fkey
    foreign key (last_message_id)
    references public.messages (id)
    on delete set null;

create table public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_reads_message_app_user_key unique (message_id, app_user_id)
);

comment on table public.message_reads is
  'Per-message participant read markers that let unread counts stay canonical instead of living only in UI state.';

create table public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_app_user_id uuid not null references public.app_users (id) on delete cascade,
  blocked_app_user_id uuid not null references public.app_users (id) on delete cascade,
  block_status text not null default 'active',
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_blocks_users_distinct_chk check (
    blocker_app_user_id <> blocked_app_user_id
  ),
  constraint user_blocks_status_chk check (
    block_status in ('active', 'released')
  ),
  constraint user_blocks_released_at_consistency_chk check (
    (
      block_status = 'released'
      and released_at is not null
    )
    or (
      block_status <> 'released'
      and released_at is null
    )
  ),
  constraint user_blocks_blocker_blocked_key unique (
    blocker_app_user_id,
    blocked_app_user_id
  )
);

comment on table public.user_blocks is
  'Durable messaging and trust-safety block boundary between two app users.';

create table public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_app_user_id uuid not null references public.app_users (id) on delete cascade,
  reported_app_user_id uuid not null references public.app_users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  lesson_id uuid,
  reported_message_id uuid references public.messages (id) on delete set null,
  report_type text not null,
  report_status text not null default 'submitted',
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint abuse_reports_reporter_reported_distinct_chk check (
    reporter_app_user_id <> reported_app_user_id
  ),
  constraint abuse_reports_report_type_chk check (
    report_type in ('message', 'safety', 'spam', 'harassment', 'other')
  ),
  constraint abuse_reports_report_status_chk check (
    report_status in ('submitted', 'under_review', 'resolved', 'dismissed')
  ),
  constraint abuse_reports_summary_not_blank_chk check (btrim(summary) <> '')
);

comment on table public.abuse_reports is
  'User-submitted moderation report record that can preserve conversation or message context for later trust review.';

create index conversations_last_message_at_idx
  on public.conversations (last_message_at desc nulls last);

create index conversation_participants_app_user_archived_idx
  on public.conversation_participants (app_user_id, is_archived);

create index messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at desc);

create index messages_sender_created_at_idx
  on public.messages (sender_app_user_id, created_at desc);

create index message_reads_app_user_read_at_idx
  on public.message_reads (app_user_id, read_at desc);

create index user_blocks_blocked_status_idx
  on public.user_blocks (blocked_app_user_id, block_status);

create index abuse_reports_reported_status_created_at_idx
  on public.abuse_reports (reported_app_user_id, report_status, created_at desc);

create index abuse_reports_reporter_created_at_idx
  on public.abuse_reports (reporter_app_user_id, created_at desc);

create or replace function public.enforce_conversation_participant_membership()
returns trigger
language plpgsql
as $$
declare
  expected_app_user_id uuid;
begin
  if new.participant_role = 'student' then
    select student_profiles.app_user_id
    into expected_app_user_id
    from public.conversations
    join public.student_profiles
      on student_profiles.id = conversations.student_profile_id
    where conversations.id = new.conversation_id;
  else
    select tutor_profiles.app_user_id
    into expected_app_user_id
    from public.conversations
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    where conversations.id = new.conversation_id;
  end if;

  if expected_app_user_id is null then
    raise exception 'conversation % does not define a % owner', new.conversation_id, new.participant_role;
  end if;

  if new.app_user_id <> expected_app_user_id then
    raise exception 'conversation participant app_user_id must match the % owner', new.participant_role;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_message_sender_membership()
returns trigger
language plpgsql
as $$
declare
  student_app_user_id uuid;
  tutor_app_user_id uuid;
  reply_conversation_id uuid;
begin
  select student_profiles.app_user_id, tutor_profiles.app_user_id
  into student_app_user_id, tutor_app_user_id
  from public.conversations
  join public.student_profiles
    on student_profiles.id = conversations.student_profile_id
  join public.tutor_profiles
    on tutor_profiles.id = conversations.tutor_profile_id
  where conversations.id = new.conversation_id;

  if student_app_user_id is null or tutor_app_user_id is null then
    raise exception 'conversation % does not have a complete owner pair', new.conversation_id;
  end if;

  if new.sender_app_user_id not in (student_app_user_id, tutor_app_user_id) then
    raise exception 'message sender must match the student or tutor owner of the conversation';
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
    raise exception 'messages cannot be sent while an active user block exists';
  end if;

  if new.reply_to_message_id is not null then
    select messages.conversation_id
    into reply_conversation_id
    from public.messages
    where messages.id = new.reply_to_message_id;

    if reply_conversation_id is null then
      raise exception 'reply_to_message_id % does not exist', new.reply_to_message_id;
    end if;

    if reply_conversation_id <> new.conversation_id then
      raise exception 'reply_to_message_id must belong to the same conversation';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_message_read_membership()
returns trigger
language plpgsql
as $$
declare
  message_conversation_id uuid;
begin
  select messages.conversation_id
  into message_conversation_id
  from public.messages
  where messages.id = new.message_id;

  if message_conversation_id is null then
    raise exception 'message % does not exist for read tracking', new.message_id;
  end if;

  if not exists (
    select 1
    from public.conversations
    join public.student_profiles
      on student_profiles.id = conversations.student_profile_id
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    where conversations.id = message_conversation_id
      and new.app_user_id in (
        student_profiles.app_user_id,
        tutor_profiles.app_user_id
      )
  ) then
    raise exception 'message_reads.app_user_id must belong to the message conversation';
  end if;

  return new;
end;
$$;

create or replace function public.sync_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message_at = case
      when last_message_at is null or new.created_at >= last_message_at
        then new.created_at
      else last_message_at
    end,
    last_message_id = case
      when last_message_at is null or new.created_at >= last_message_at
        then new.id
      else last_message_id
    end
  where conversations.id = new.conversation_id;

  return new;
end;
$$;

create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_conversation_participants_updated_at
before update on public.conversation_participants
for each row execute function public.set_updated_at();

create trigger set_messages_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

create trigger set_message_reads_updated_at
before update on public.message_reads
for each row execute function public.set_updated_at();

create trigger set_user_blocks_updated_at
before update on public.user_blocks
for each row execute function public.set_updated_at();

create trigger set_abuse_reports_updated_at
before update on public.abuse_reports
for each row execute function public.set_updated_at();

create trigger enforce_conversation_participant_membership
before insert or update on public.conversation_participants
for each row execute function public.enforce_conversation_participant_membership();

create trigger enforce_message_sender_membership
before insert on public.messages
for each row execute function public.enforce_message_sender_membership();

create trigger enforce_message_read_membership
before insert or update on public.message_reads
for each row execute function public.enforce_message_read_membership();

create trigger sync_conversation_last_message
after insert on public.messages
for each row execute function public.sync_conversation_last_message();

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.user_blocks enable row level security;
alter table public.abuse_reports enable row level security;

create policy conversations_select_participant
on public.conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.student_profiles
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where student_profiles.id = conversations.student_profile_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = conversations.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy conversation_participants_select_participant
on public.conversation_participants
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
    where conversations.id = conversation_participants.conversation_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.conversations
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where conversations.id = conversation_participants.conversation_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy messages_select_participant
on public.messages
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
    where conversations.id = messages.conversation_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.conversations
    join public.tutor_profiles
      on tutor_profiles.id = conversations.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where conversations.id = messages.conversation_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy message_reads_select_self
on public.message_reads
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = message_reads.app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy user_blocks_select_self
on public.user_blocks
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = user_blocks.blocker_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy abuse_reports_select_self
on public.abuse_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = abuse_reports.reporter_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);
