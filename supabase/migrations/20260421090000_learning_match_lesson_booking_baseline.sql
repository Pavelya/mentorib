create table public.meeting_providers (
  provider_key text primary key,
  display_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meeting_providers_provider_key_not_blank_chk check (btrim(provider_key) <> ''),
  constraint meeting_providers_provider_key_format_chk check (
    provider_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
  ),
  constraint meeting_providers_display_name_not_blank_chk check (btrim(display_name) <> ''),
  constraint meeting_providers_sort_order_nonnegative_chk check (sort_order >= 0)
);

comment on table public.meeting_providers is
  'Controlled provider vocabulary for lesson-scoped external meeting access.';

create table public.booking_operations (
  id uuid primary key default gen_random_uuid(),
  actor_app_user_id uuid not null references public.app_users (id),
  operation_key text not null,
  operation_type text not null,
  operation_status text not null default 'started',
  request_fingerprint text not null,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_operations_operation_key_not_blank_chk check (
    btrim(operation_key) <> ''
  ),
  constraint booking_operations_request_fingerprint_not_blank_chk check (
    btrim(request_fingerprint) <> ''
  ),
  constraint booking_operations_error_code_not_blank_chk check (
    error_code is null or btrim(error_code) <> ''
  ),
  constraint booking_operations_error_message_not_blank_chk check (
    error_message is null or btrim(error_message) <> ''
  ),
  constraint booking_operations_operation_type_chk check (
    operation_type in (
      'lesson_request_create',
      'lesson_accept',
      'lesson_decline',
      'lesson_cancel',
      'lesson_complete',
      'payment_authorize',
      'payment_capture',
      'payment_release'
    )
  ),
  constraint booking_operations_operation_status_chk check (
    operation_status in ('started', 'succeeded', 'failed', 'cancelled')
  ),
  constraint booking_operations_actor_operation_key unique (
    actor_app_user_id,
    operation_key
  )
);

comment on table public.booking_operations is
  'Durable booking and payment operation idempotency records keyed by actor and logical operation key.';

create table public.learning_needs (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles (id) on delete cascade,
  need_status text not null default 'draft',
  need_type text not null,
  subject_id uuid not null references public.subjects (id),
  subject_focus_area_id uuid not null references public.subject_focus_areas (id),
  urgency_level text not null,
  support_style text,
  language_code text not null references public.languages (language_code),
  timezone text not null default 'UTC',
  session_frequency_intent text,
  free_text_note text,
  submitted_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_needs_need_status_chk check (
    need_status in ('draft', 'active', 'matched', 'booked', 'archived')
  ),
  constraint learning_needs_need_type_not_blank_chk check (btrim(need_type) <> ''),
  constraint learning_needs_urgency_level_not_blank_chk check (btrim(urgency_level) <> ''),
  constraint learning_needs_support_style_not_blank_chk check (
    support_style is null or btrim(support_style) <> ''
  ),
  constraint learning_needs_timezone_not_blank_chk check (btrim(timezone) <> ''),
  constraint learning_needs_session_frequency_intent_not_blank_chk check (
    session_frequency_intent is null or btrim(session_frequency_intent) <> ''
  ),
  constraint learning_needs_free_text_note_not_blank_chk check (
    free_text_note is null or btrim(free_text_note) <> ''
  ),
  constraint learning_needs_submitted_at_consistency_chk check (
    (
      need_status = 'draft'
      and submitted_at is null
    )
    or (
      need_status <> 'draft'
      and submitted_at is not null
    )
  ),
  constraint learning_needs_archived_at_consistency_chk check (
    (
      need_status = 'archived'
      and archived_at is not null
    )
    or (
      need_status <> 'archived'
      and archived_at is null
    )
  )
);

comment on table public.learning_needs is
  'Canonical structured student support request used as the durable input for matching and booking context.';

create table public.match_runs (
  id uuid primary key default gen_random_uuid(),
  learning_need_id uuid not null references public.learning_needs (id) on delete cascade,
  ranking_version text not null,
  need_signature text not null,
  matching_projection_version text not null,
  run_status text not null default 'queued',
  candidate_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_runs_ranking_version_not_blank_chk check (btrim(ranking_version) <> ''),
  constraint match_runs_need_signature_not_blank_chk check (btrim(need_signature) <> ''),
  constraint match_runs_matching_projection_version_not_blank_chk check (
    btrim(matching_projection_version) <> ''
  ),
  constraint match_runs_run_status_chk check (
    run_status in ('queued', 'running', 'completed', 'failed', 'expired')
  ),
  constraint match_runs_candidate_count_nonnegative_chk check (candidate_count >= 0),
  constraint match_runs_completed_at_consistency_chk check (
    (
      run_status = 'completed'
      and completed_at is not null
    )
    or (
      run_status not in ('completed', 'expired')
      and completed_at is null
    )
    or (
      run_status = 'expired'
    )
  ),
  constraint match_runs_failed_at_consistency_chk check (
    (
      run_status = 'failed'
      and failed_at is not null
    )
    or (
      run_status <> 'failed'
      and failed_at is null
    )
  )
);

comment on table public.match_runs is
  'Versioned matching execution record for a submitted learning need and ranking configuration.';

create table public.match_candidates (
  id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null references public.match_runs (id) on delete cascade,
  tutor_profile_id uuid not null references public.tutor_profiles (id),
  candidate_state text not null default 'candidate',
  rank_position integer not null,
  match_score integer not null,
  confidence_label text,
  fit_summary text,
  best_for_summary text,
  availability_signal text,
  trust_signal_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_candidates_candidate_state_chk check (
    candidate_state in (
      'candidate',
      'shortlisted',
      'compared',
      'contacted',
      'booked',
      'dismissed'
    )
  ),
  constraint match_candidates_rank_position_positive_chk check (rank_position > 0),
  constraint match_candidates_match_score_range_chk check (
    match_score between 0 and 10000
  ),
  constraint match_candidates_confidence_label_not_blank_chk check (
    confidence_label is null or btrim(confidence_label) <> ''
  ),
  constraint match_candidates_fit_summary_not_blank_chk check (
    fit_summary is null or btrim(fit_summary) <> ''
  ),
  constraint match_candidates_best_for_summary_not_blank_chk check (
    best_for_summary is null or btrim(best_for_summary) <> ''
  ),
  constraint match_candidates_availability_signal_not_blank_chk check (
    availability_signal is null or btrim(availability_signal) <> ''
  ),
  constraint match_candidates_trust_signal_snapshot_object_chk check (
    jsonb_typeof(trust_signal_snapshot) = 'object'
  ),
  constraint match_candidates_tutor_per_run_key unique (
    match_run_id,
    tutor_profile_id
  ),
  constraint match_candidates_rank_per_run_key unique (
    match_run_id,
    rank_position
  )
);

comment on table public.match_candidates is
  'Persisted tutor candidate within a meaningful match result set, including rank and explanation snapshots.';

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles (id),
  tutor_profile_id uuid not null references public.tutor_profiles (id),
  learning_need_id uuid not null references public.learning_needs (id),
  match_candidate_id uuid references public.match_candidates (id) on delete set null,
  booking_operation_id uuid not null unique references public.booking_operations (id),
  lesson_status text not null default 'pending',
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  request_expires_at timestamptz not null,
  lesson_timezone text not null,
  meeting_method text not null default 'external_video_call',
  price_amount integer not null,
  currency_code text not null default 'USD',
  is_trial boolean not null default false,
  subject_snapshot jsonb not null,
  focus_snapshot jsonb not null default '{}'::jsonb,
  student_note_snapshot text,
  accepted_at timestamptz,
  declined_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_lesson_status_chk check (
    lesson_status in (
      'draft_request',
      'pending',
      'accepted',
      'declined',
      'cancelled',
      'upcoming',
      'in_progress',
      'completed',
      'reviewed'
    )
  ),
  constraint lessons_scheduled_window_order_chk check (
    scheduled_start_at < scheduled_end_at
  ),
  constraint lessons_request_expires_before_start_chk check (
    request_expires_at <= scheduled_start_at
  ),
  constraint lessons_lesson_timezone_not_blank_chk check (btrim(lesson_timezone) <> ''),
  constraint lessons_meeting_method_chk check (
    meeting_method in (
      'external_video_call',
      'custom_external_room',
      'in_person',
      'no_meeting_link'
    )
  ),
  constraint lessons_price_amount_nonnegative_chk check (price_amount >= 0),
  constraint lessons_currency_code_format_chk check (currency_code ~ '^[A-Z]{3}$'),
  constraint lessons_subject_snapshot_object_chk check (
    jsonb_typeof(subject_snapshot) = 'object'
    and subject_snapshot <> '{}'::jsonb
  ),
  constraint lessons_focus_snapshot_object_chk check (
    jsonb_typeof(focus_snapshot) = 'object'
  ),
  constraint lessons_student_note_snapshot_not_blank_chk check (
    student_note_snapshot is null or btrim(student_note_snapshot) <> ''
  ),
  constraint lessons_declined_at_consistency_chk check (
    (
      lesson_status = 'declined'
      and declined_at is not null
    )
    or (
      lesson_status <> 'declined'
      and declined_at is null
    )
  ),
  constraint lessons_cancelled_at_consistency_chk check (
    (
      lesson_status = 'cancelled'
      and cancelled_at is not null
    )
    or (
      lesson_status <> 'cancelled'
      and cancelled_at is null
    )
  ),
  constraint lessons_completed_at_consistency_chk check (
    (
      lesson_status in ('completed', 'reviewed')
      and completed_at is not null
    )
    or (
      lesson_status not in ('completed', 'reviewed')
      and completed_at is null
    )
  )
);

comment on table public.lessons is
  'Canonical lesson and booking state object spanning request, confirmation, cancellation, completion, and retained schedule snapshots.';

alter table public.abuse_reports
  add constraint abuse_reports_lesson_id_fkey
    foreign key (lesson_id)
    references public.lessons (id)
    on delete set null;

create table public.lesson_status_history (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by_app_user_id uuid references public.app_users (id),
  booking_operation_id uuid unique references public.booking_operations (id),
  change_reason text,
  created_at timestamptz not null default now(),
  constraint lesson_status_history_from_status_chk check (
    from_status is null
    or from_status in (
      'draft_request',
      'pending',
      'accepted',
      'declined',
      'cancelled',
      'upcoming',
      'in_progress',
      'completed',
      'reviewed'
    )
  ),
  constraint lesson_status_history_to_status_chk check (
    to_status in (
      'draft_request',
      'pending',
      'accepted',
      'declined',
      'cancelled',
      'upcoming',
      'in_progress',
      'completed',
      'reviewed'
    )
  ),
  constraint lesson_status_history_status_changes_chk check (
    from_status is null or from_status <> to_status
  ),
  constraint lesson_status_history_change_reason_not_blank_chk check (
    change_reason is null or btrim(change_reason) <> ''
  )
);

comment on table public.lesson_status_history is
  'Append-only lesson state transition history used for booking, cancellation, dispute, and payment audit context.';

create table public.lesson_meeting_access (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  meeting_method text not null default 'external_video_call',
  provider text references public.meeting_providers (provider_key),
  meeting_url text,
  normalized_host text,
  display_label text,
  source_type text not null default 'tutor_default_room',
  access_status text not null default 'missing',
  updated_by_app_user_id uuid references public.app_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_meeting_access_meeting_method_chk check (
    meeting_method in (
      'external_video_call',
      'custom_external_room',
      'in_person',
      'no_meeting_link'
    )
  ),
  constraint lesson_meeting_access_url_not_blank_chk check (
    meeting_url is null or btrim(meeting_url) <> ''
  ),
  constraint lesson_meeting_access_url_https_chk check (
    meeting_url is null or meeting_url ~ '^https://.+'
  ),
  constraint lesson_meeting_access_normalized_host_not_blank_chk check (
    normalized_host is null or btrim(normalized_host) <> ''
  ),
  constraint lesson_meeting_access_display_label_not_blank_chk check (
    display_label is null or btrim(display_label) <> ''
  ),
  constraint lesson_meeting_access_source_type_chk check (
    source_type in (
      'tutor_default_room',
      'tutor_custom_lesson_link',
      'internal_override',
      'future_platform_generated'
    )
  ),
  constraint lesson_meeting_access_access_status_chk check (
    access_status in ('missing', 'ready', 'invalid', 'replaced')
  ),
  constraint lesson_meeting_access_ready_url_chk check (
    (
      access_status = 'ready'
      and provider is not null
      and meeting_url is not null
    )
    or access_status <> 'ready'
  ),
  constraint lesson_meeting_access_missing_url_chk check (
    (
      access_status = 'missing'
      and meeting_url is null
    )
    or access_status <> 'missing'
  )
);

comment on table public.lesson_meeting_access is
  'Lesson-scoped meeting access snapshot for participant-private external meeting links and replacements.';

create table public.lesson_issue_cases (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  reported_by_app_user_id uuid not null references public.app_users (id),
  issue_type text not null,
  reporter_summary text,
  counterparty_response_type text,
  counterparty_summary text,
  case_status text not null default 'reported',
  resolution_outcome text,
  resolved_by_app_user_id uuid references public.app_users (id),
  resolution_note text,
  reported_at timestamptz not null default now(),
  counterparty_deadline_at timestamptz not null default (now() + interval '12 hours'),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_issue_cases_issue_type_chk check (
    issue_type in (
      'tutor_absent',
      'student_absent',
      'wrong_meeting_link',
      'technical_failure',
      'partial_delivery'
    )
  ),
  constraint lesson_issue_cases_reporter_summary_not_blank_chk check (
    reporter_summary is null or btrim(reporter_summary) <> ''
  ),
  constraint lesson_issue_cases_counterparty_response_type_chk check (
    counterparty_response_type is null
    or counterparty_response_type in (
      'tutor_absent',
      'student_absent',
      'wrong_meeting_link',
      'technical_failure',
      'partial_delivery',
      'confirmed',
      'contested'
    )
  ),
  constraint lesson_issue_cases_counterparty_summary_not_blank_chk check (
    counterparty_summary is null or btrim(counterparty_summary) <> ''
  ),
  constraint lesson_issue_cases_case_status_chk check (
    case_status in (
      'reported',
      'counterparty_matched',
      'under_review',
      'resolved',
      'dismissed'
    )
  ),
  constraint lesson_issue_cases_resolution_outcome_chk check (
    resolution_outcome is null
    or resolution_outcome in (
      'student_no_show_confirmed',
      'tutor_no_show_confirmed',
      'wrong_link_tutor_fault',
      'technical_issue_no_fault',
      'partial_delivery_adjusted',
      'lesson_completed',
      'duplicate_or_invalid'
    )
  ),
  constraint lesson_issue_cases_resolution_note_not_blank_chk check (
    resolution_note is null or btrim(resolution_note) <> ''
  ),
  constraint lesson_issue_cases_counterparty_deadline_after_report_chk check (
    counterparty_deadline_at > reported_at
  ),
  constraint lesson_issue_cases_resolved_at_consistency_chk check (
    (
      case_status in ('resolved', 'dismissed')
      and resolved_at is not null
    )
    or (
      case_status not in ('resolved', 'dismissed')
      and resolved_at is null
    )
  ),
  constraint lesson_issue_cases_resolution_outcome_consistency_chk check (
    (
      case_status = 'resolved'
      and resolution_outcome is not null
    )
    or (
      case_status <> 'resolved'
      and resolution_outcome is null
    )
  )
);

comment on table public.lesson_issue_cases is
  'Canonical lesson incident case record for no-show, wrong-link, technical failure, and partial-delivery handling, separate from abuse reports.';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons (id),
  payer_app_user_id uuid not null references public.app_users (id),
  authorization_operation_id uuid not null unique references public.booking_operations (id),
  capture_operation_id uuid unique references public.booking_operations (id),
  provider text not null default 'stripe',
  provider_idempotency_key text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  payment_status text not null default 'pending',
  amount integer not null,
  currency_code text not null default 'USD',
  authorized_at timestamptz,
  authorization_expires_at timestamptz,
  captured_at timestamptz,
  capture_cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_chk check (provider in ('stripe')),
  constraint payments_provider_idempotency_key_not_blank_chk check (
    provider_idempotency_key is null or btrim(provider_idempotency_key) <> ''
  ),
  constraint payments_stripe_checkout_session_id_not_blank_chk check (
    stripe_checkout_session_id is null or btrim(stripe_checkout_session_id) <> ''
  ),
  constraint payments_stripe_payment_intent_id_not_blank_chk check (
    stripe_payment_intent_id is null or btrim(stripe_payment_intent_id) <> ''
  ),
  constraint payments_payment_status_chk check (
    payment_status in ('pending', 'authorized', 'paid', 'refunded', 'failed', 'cancelled')
  ),
  constraint payments_amount_positive_chk check (amount > 0),
  constraint payments_currency_code_format_chk check (currency_code ~ '^[A-Z]{3}$'),
  constraint payments_authorized_at_consistency_chk check (
    (
      payment_status in ('authorized', 'paid', 'refunded')
      and authorized_at is not null
    )
    or payment_status not in ('authorized', 'paid', 'refunded')
  ),
  constraint payments_captured_at_consistency_chk check (
    (
      payment_status in ('paid', 'refunded')
      and captured_at is not null
    )
    or payment_status not in ('paid', 'refunded')
  ),
  constraint payments_refunded_at_consistency_chk check (
    (
      payment_status = 'refunded'
      and refunded_at is not null
    )
    or (
      payment_status <> 'refunded'
      and refunded_at is null
    )
  ),
  constraint payments_capture_cancelled_at_consistency_chk check (
    (
      payment_status = 'cancelled'
      and capture_cancelled_at is not null
    )
    or (
      payment_status <> 'cancelled'
      and capture_cancelled_at is null
    )
  )
);

comment on table public.payments is
  'Application-facing payment authorization and capture source of truth linked one-to-one with a lesson booking.';

create index learning_needs_student_status_updated_idx
  on public.learning_needs (student_profile_id, need_status, updated_at desc);

create index learning_needs_subject_focus_idx
  on public.learning_needs (subject_id, subject_focus_area_id);

create index match_runs_learning_need_created_at_idx
  on public.match_runs (learning_need_id, created_at desc);

create index match_runs_status_created_at_idx
  on public.match_runs (run_status, created_at);

create index match_candidates_tutor_profile_id_idx
  on public.match_candidates (tutor_profile_id);

create index match_candidates_state_rank_idx
  on public.match_candidates (match_run_id, candidate_state, rank_position);

create unique index lessons_tutor_active_slot_key
  on public.lessons (tutor_profile_id, scheduled_start_at, scheduled_end_at)
  where lesson_status in ('pending', 'accepted', 'upcoming', 'in_progress');

create unique index lessons_student_active_slot_key
  on public.lessons (student_profile_id, scheduled_start_at, scheduled_end_at)
  where lesson_status in ('pending', 'accepted', 'upcoming', 'in_progress');

create index lessons_student_status_start_idx
  on public.lessons (student_profile_id, lesson_status, scheduled_start_at);

create index lessons_tutor_status_start_idx
  on public.lessons (tutor_profile_id, lesson_status, scheduled_start_at);

create index lessons_learning_need_idx
  on public.lessons (learning_need_id);

create index lesson_status_history_lesson_created_at_idx
  on public.lesson_status_history (lesson_id, created_at desc);

create unique index lesson_meeting_access_current_lesson_key
  on public.lesson_meeting_access (lesson_id)
  where access_status in ('missing', 'ready', 'invalid');

create index lesson_meeting_access_provider_status_idx
  on public.lesson_meeting_access (provider, access_status);

create unique index lesson_issue_cases_open_lesson_key
  on public.lesson_issue_cases (lesson_id)
  where case_status in ('reported', 'counterparty_matched', 'under_review');

create index lesson_issue_cases_status_reported_at_idx
  on public.lesson_issue_cases (case_status, reported_at);

create unique index payments_provider_idempotency_key_key
  on public.payments (provider, provider_idempotency_key)
  where provider_idempotency_key is not null;

create unique index payments_stripe_checkout_session_id_key
  on public.payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index payments_stripe_payment_intent_id_key
  on public.payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index payments_status_updated_at_idx
  on public.payments (payment_status, updated_at desc);

create or replace function public.enforce_lesson_context_consistency()
returns trigger
language plpgsql
as $$
declare
  need_student_profile_id uuid;
  candidate_tutor_profile_id uuid;
  candidate_learning_need_id uuid;
  candidate_student_profile_id uuid;
begin
  select learning_needs.student_profile_id
  into need_student_profile_id
  from public.learning_needs
  where learning_needs.id = new.learning_need_id;

  if need_student_profile_id is null then
    raise exception 'learning_need_id % does not exist', new.learning_need_id;
  end if;

  if need_student_profile_id <> new.student_profile_id then
    raise exception 'lesson learning_need_id must belong to the lesson student_profile_id';
  end if;

  if new.match_candidate_id is not null then
    select match_candidates.tutor_profile_id,
           match_runs.learning_need_id,
           learning_needs.student_profile_id
    into candidate_tutor_profile_id,
         candidate_learning_need_id,
         candidate_student_profile_id
    from public.match_candidates
    join public.match_runs
      on match_runs.id = match_candidates.match_run_id
    join public.learning_needs
      on learning_needs.id = match_runs.learning_need_id
    where match_candidates.id = new.match_candidate_id;

    if candidate_tutor_profile_id is null then
      raise exception 'match_candidate_id % does not exist', new.match_candidate_id;
    end if;

    if candidate_tutor_profile_id <> new.tutor_profile_id then
      raise exception 'lesson match_candidate_id must point to the lesson tutor_profile_id';
    end if;

    if candidate_learning_need_id <> new.learning_need_id then
      raise exception 'lesson match_candidate_id must belong to the lesson learning_need_id';
    end if;

    if candidate_student_profile_id <> new.student_profile_id then
      raise exception 'lesson match_candidate_id must belong to the lesson student_profile_id';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_lesson_status_history_actor()
returns trigger
language plpgsql
as $$
begin
  if new.changed_by_app_user_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.lessons
    join public.student_profiles
      on student_profiles.id = lessons.student_profile_id
    join public.tutor_profiles
      on tutor_profiles.id = lessons.tutor_profile_id
    where lessons.id = new.lesson_id
      and new.changed_by_app_user_id in (
        student_profiles.app_user_id,
        tutor_profiles.app_user_id
      )
  ) then
    raise exception 'lesson status history actor must belong to the lesson participants';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_lesson_issue_reporter_membership()
returns trigger
language plpgsql
as $$
declare
  student_app_user_id uuid;
  tutor_app_user_id uuid;
begin
  select student_profiles.app_user_id, tutor_profiles.app_user_id
  into student_app_user_id, tutor_app_user_id
  from public.lessons
  join public.student_profiles
    on student_profiles.id = lessons.student_profile_id
  join public.tutor_profiles
    on tutor_profiles.id = lessons.tutor_profile_id
  where lessons.id = new.lesson_id;

  if student_app_user_id is null or tutor_app_user_id is null then
    raise exception 'lesson % does not have a complete participant pair', new.lesson_id;
  end if;

  if new.reported_by_app_user_id not in (student_app_user_id, tutor_app_user_id) then
    raise exception 'lesson issue reporter must belong to the lesson participants';
  end if;

  if new.issue_type = 'tutor_absent'
    and new.reported_by_app_user_id <> student_app_user_id then
    raise exception 'only the student participant can report tutor_absent';
  end if;

  if new.issue_type = 'student_absent'
    and new.reported_by_app_user_id <> tutor_app_user_id then
    raise exception 'only the tutor participant can report student_absent';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_payment_payer_matches_lesson_student()
returns trigger
language plpgsql
as $$
declare
  expected_payer_app_user_id uuid;
begin
  select student_profiles.app_user_id
  into expected_payer_app_user_id
  from public.lessons
  join public.student_profiles
    on student_profiles.id = lessons.student_profile_id
  where lessons.id = new.lesson_id;

  if expected_payer_app_user_id is null then
    raise exception 'payment lesson % does not have a student payer', new.lesson_id;
  end if;

  if new.payer_app_user_id <> expected_payer_app_user_id then
    raise exception 'payment payer_app_user_id must match the lesson student owner';
  end if;

  return new;
end;
$$;

create trigger set_meeting_providers_updated_at
before update on public.meeting_providers
for each row execute function public.set_updated_at();

create trigger set_booking_operations_updated_at
before update on public.booking_operations
for each row execute function public.set_updated_at();

create trigger set_learning_needs_updated_at
before update on public.learning_needs
for each row execute function public.set_updated_at();

create trigger set_match_runs_updated_at
before update on public.match_runs
for each row execute function public.set_updated_at();

create trigger set_match_candidates_updated_at
before update on public.match_candidates
for each row execute function public.set_updated_at();

create trigger set_lessons_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create trigger set_lesson_meeting_access_updated_at
before update on public.lesson_meeting_access
for each row execute function public.set_updated_at();

create trigger set_lesson_issue_cases_updated_at
before update on public.lesson_issue_cases
for each row execute function public.set_updated_at();

create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create trigger enforce_lesson_context_consistency
before insert or update on public.lessons
for each row execute function public.enforce_lesson_context_consistency();

create trigger enforce_lesson_status_history_actor
before insert or update on public.lesson_status_history
for each row execute function public.enforce_lesson_status_history_actor();

create trigger enforce_lesson_issue_reporter_membership
before insert or update on public.lesson_issue_cases
for each row execute function public.enforce_lesson_issue_reporter_membership();

create trigger enforce_payment_payer_matches_lesson_student
before insert or update on public.payments
for each row execute function public.enforce_payment_payer_matches_lesson_student();

alter table public.meeting_providers enable row level security;
alter table public.booking_operations enable row level security;
alter table public.learning_needs enable row level security;
alter table public.match_runs enable row level security;
alter table public.match_candidates enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_status_history enable row level security;
alter table public.lesson_meeting_access enable row level security;
alter table public.lesson_issue_cases enable row level security;
alter table public.payments enable row level security;

create policy meeting_providers_select_active
on public.meeting_providers
for select
to anon, authenticated
using (is_active);

create policy booking_operations_select_self
on public.booking_operations
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = booking_operations.actor_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy learning_needs_select_self
on public.learning_needs
for select
to authenticated
using (
  exists (
    select 1
    from public.student_profiles
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where student_profiles.id = learning_needs.student_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy match_runs_select_need_owner
on public.match_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.learning_needs
    join public.student_profiles
      on student_profiles.id = learning_needs.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where learning_needs.id = match_runs.learning_need_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy match_candidates_select_need_owner
on public.match_candidates
for select
to authenticated
using (
  exists (
    select 1
    from public.match_runs
    join public.learning_needs
      on learning_needs.id = match_runs.learning_need_id
    join public.student_profiles
      on student_profiles.id = learning_needs.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where match_runs.id = match_candidates.match_run_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy lessons_select_participant
on public.lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.student_profiles
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where student_profiles.id = lessons.student_profile_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.tutor_profiles
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where tutor_profiles.id = lessons.tutor_profile_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy lesson_status_history_select_participant
on public.lesson_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons
    join public.student_profiles
      on student_profiles.id = lessons.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where lessons.id = lesson_status_history.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lessons
    join public.tutor_profiles
      on tutor_profiles.id = lessons.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where lessons.id = lesson_status_history.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy lesson_meeting_access_select_participant
on public.lesson_meeting_access
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons
    join public.student_profiles
      on student_profiles.id = lessons.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where lessons.id = lesson_meeting_access.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lessons
    join public.tutor_profiles
      on tutor_profiles.id = lessons.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where lessons.id = lesson_meeting_access.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy lesson_issue_cases_select_participant
on public.lesson_issue_cases
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons
    join public.student_profiles
      on student_profiles.id = lessons.student_profile_id
    join public.app_users
      on app_users.id = student_profiles.app_user_id
    where lessons.id = lesson_issue_cases.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lessons
    join public.tutor_profiles
      on tutor_profiles.id = lessons.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where lessons.id = lesson_issue_cases.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
);

create policy payments_select_participant
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.app_users
    where app_users.id = payments.payer_app_user_id
      and app_users.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lessons
    join public.tutor_profiles
      on tutor_profiles.id = lessons.tutor_profile_id
    join public.app_users
      on app_users.id = tutor_profiles.app_user_id
    where lessons.id = payments.lesson_id
      and app_users.auth_user_id = auth.uid()
  )
);
