import type {
  AccountStatus,
  OnboardingState,
  PrimaryRoleContext,
  Role,
  RoleStatus,
} from "@/modules/accounts/constants";
import type {
  JobStatus,
  JobType,
  WebhookProcessingStatus,
  WebhookProvider,
  WebhookVerificationStatus,
} from "@/modules/jobs/constants";
import type {
  BookingOperationStatus,
  BookingOperationType,
  LearningNeedOptionGroup,
  LearningNeedStatus,
  LessonIssueCaseStatus,
  LessonIssueCounterpartyResponseType,
  LessonIssueResolutionOutcome,
  LessonIssueType,
  LessonMeetingAccessStatus,
  LessonMeetingMethod,
  LessonMeetingSourceType,
  LessonStatus,
  MatchCandidateState,
  MatchRunStatus,
  PaymentProvider,
  PaymentStatus,
} from "@/modules/lessons/constants";
import type {
  AbuseReportStatus,
  AbuseReportType,
  ConversationStatus,
  MessageStatus,
  ParticipantRole,
  UserBlockStatus,
} from "@/modules/messages/constants";
import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationStatus,
  NotificationType,
  PolicyNoticeType,
} from "@/modules/notifications/constants";
import type {
  AvailabilityOverrideType,
  AvailabilityRuleVisibilityStatus,
  PayoutReadinessStatus,
  TutorApplicationStatus,
  TutorCredentialReviewStatus,
  TutorProfileVisibilityStatus,
  TutorPublicListingStatus,
} from "@/modules/tutors/constants";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AppUserRow = {
  account_status: AccountStatus;
  auth_user_id: string;
  avatar_url: string | null;
  created_at: string;
  email: string;
  full_name: string | null;
  id: string;
  onboarding_state: OnboardingState;
  preferred_language_code: string | null;
  primary_role_context: PrimaryRoleContext | null;
  timezone: string;
  updated_at: string;
};

type UserRoleRow = {
  app_user_id: string;
  created_at: string;
  granted_at: string;
  id: string;
  revoked_at: string | null;
  role: Role;
  role_status: RoleStatus;
  updated_at: string;
};

type StudentProfileRow = {
  app_user_id: string;
  created_at: string;
  current_stage_summary: string | null;
  display_name: string | null;
  id: string;
  notes_visibility_preference: string | null;
  updated_at: string;
};

type SubjectRow = {
  created_at: string;
  display_name: string;
  id: string;
  is_active: boolean;
  slug: string;
  sort_order: number;
  subject_code: string;
  updated_at: string;
};

type SubjectFocusAreaRow = {
  created_at: string;
  display_name: string;
  focus_area_code: string;
  id: string;
  is_active: boolean;
  slug: string;
  sort_order: number;
  updated_at: string;
};

type LanguageRow = {
  created_at: string;
  display_name: string;
  is_active: boolean;
  language_code: string;
  sort_order: number;
  updated_at: string;
};

type LearningNeedOptionValueRow = {
  allowed_subject_codes: string[];
  created_at: string;
  display_label: string;
  helper_text: string | null;
  id: string;
  is_active: boolean;
  option_group: LearningNeedOptionGroup;
  option_key: string;
  sort_order: number;
  subject_focus_area_code: string | null;
  updated_at: string;
};

type VideoMediaProviderRow = {
  created_at: string;
  display_name: string;
  is_active: boolean;
  provider_key: string;
  sort_order: number;
  updated_at: string;
};

type MeetingProviderRow = {
  created_at: string;
  display_name: string;
  is_active: boolean;
  provider_key: string;
  sort_order: number;
  updated_at: string;
};

type TutorProfileRow = {
  app_user_id: string;
  application_status: TutorApplicationStatus;
  best_for_summary: string | null;
  bio: string | null;
  created_at: string;
  display_name: string | null;
  headline: string | null;
  id: string;
  intro_video_external_id: string | null;
  intro_video_provider: string | null;
  intro_video_url: string | null;
  payout_readiness_status: PayoutReadinessStatus;
  pricing_summary: string | null;
  profile_visibility_status: TutorProfileVisibilityStatus;
  public_listing_status: TutorPublicListingStatus;
  public_slug: string | null;
  teaching_style_summary: string | null;
  updated_at: string;
};

type TutorSubjectCapabilityRow = {
  created_at: string;
  display_priority: number;
  experience_summary: string | null;
  id: string;
  subject_focus_area_id: string;
  subject_id: string;
  tutor_profile_id: string;
  updated_at: string;
};

type TutorLanguageCapabilityRow = {
  created_at: string;
  display_priority: number;
  id: string;
  language_code: string;
  tutor_profile_id: string;
  updated_at: string;
};

type TutorCredentialRow = {
  created_at: string;
  credential_type: string;
  id: string;
  issuing_body: string | null;
  public_display_preference: boolean;
  review_status: TutorCredentialReviewStatus;
  reviewed_at: string | null;
  storage_object_path: string;
  title: string;
  tutor_profile_id: string;
  updated_at: string;
};

type SchedulePolicyRow = {
  buffer_after_minutes: number;
  buffer_before_minutes: number;
  created_at: string;
  daily_capacity: number | null;
  id: string;
  is_accepting_new_students: boolean;
  minimum_notice_minutes: number;
  timezone: string;
  tutor_profile_id: string;
  updated_at: string;
  weekly_capacity: number | null;
};

type AvailabilityRuleRow = {
  created_at: string;
  day_of_week: number;
  end_local_time: string;
  id: string;
  start_local_time: string;
  tutor_profile_id: string;
  updated_at: string;
  visibility_status: AvailabilityRuleVisibilityStatus;
};

type AvailabilityOverrideRow = {
  created_at: string;
  end_local_time: string | null;
  id: string;
  override_date: string;
  override_type: AvailabilityOverrideType;
  reason: string | null;
  start_local_time: string | null;
  tutor_profile_id: string;
  updated_at: string;
};

type ConversationRow = {
  conversation_status: ConversationStatus;
  created_at: string;
  id: string;
  last_message_at: string | null;
  last_message_id: string | null;
  student_profile_id: string;
  tutor_profile_id: string;
  updated_at: string;
};

type ConversationParticipantRow = {
  app_user_id: string;
  conversation_id: string;
  created_at: string;
  id: string;
  is_archived: boolean;
  is_muted: boolean;
  joined_at: string;
  participant_role: ParticipantRole;
  updated_at: string;
};

type MessageRow = {
  body: string;
  conversation_id: string;
  created_at: string;
  edited_at: string | null;
  id: string;
  message_status: MessageStatus;
  removed_at: string | null;
  reply_to_message_id: string | null;
  sender_app_user_id: string;
  updated_at: string;
};

type MessageReadRow = {
  app_user_id: string;
  created_at: string;
  id: string;
  message_id: string;
  read_at: string;
  updated_at: string;
};

type UserBlockRow = {
  blocked_app_user_id: string;
  blocker_app_user_id: string;
  block_status: UserBlockStatus;
  created_at: string;
  id: string;
  released_at: string | null;
  updated_at: string;
};

type AbuseReportRow = {
  conversation_id: string | null;
  created_at: string;
  id: string;
  lesson_id: string | null;
  reported_app_user_id: string;
  reported_message_id: string | null;
  report_status: AbuseReportStatus;
  report_type: AbuseReportType;
  reporter_app_user_id: string;
  summary: string;
  updated_at: string;
};

type PolicyNoticeVersionRow = {
  created_at: string;
  document_url: string;
  effective_at: string;
  id: string;
  notice_type: PolicyNoticeType;
  published_at: string;
  requires_acknowledgement: boolean;
  summary: string;
  title: string;
  updated_at: string;
  version_label: string;
};

type NotificationRow = {
  app_user_id: string;
  body_summary: string;
  created_at: string;
  dismissed_at: string | null;
  id: string;
  notification_status: NotificationStatus;
  notification_type: NotificationType;
  object_id: string | null;
  object_type: string;
  read_at: string | null;
  title: string;
  updated_at: string;
};

type NotificationDeliveryRow = {
  accepted_at: string | null;
  attempt_number: number;
  attempted_at: string | null;
  channel: NotificationChannel;
  created_at: string;
  delivery_status: NotificationDeliveryStatus;
  error_code: string | null;
  error_message: string | null;
  failed_at: string | null;
  id: string;
  job_run_id: string | null;
  notification_id: string;
  provider: string | null;
  provider_message_id: string | null;
  updated_at: string;
};

type PolicyNoticeReceiptRow = {
  acknowledged_at: string | null;
  app_user_id: string;
  created_at: string;
  first_shown_at: string | null;
  id: string;
  policy_notice_version_id: string;
  updated_at: string;
  viewed_at: string | null;
};

type BookingOperationRow = {
  actor_app_user_id: string;
  created_at: string;
  error_code: string | null;
  error_message: string | null;
  id: string;
  operation_key: string;
  operation_status: BookingOperationStatus;
  operation_type: BookingOperationType;
  request_fingerprint: string;
  updated_at: string;
};

type LearningNeedRow = {
  archived_at: string | null;
  created_at: string;
  free_text_note: string | null;
  id: string;
  language_code: string;
  need_status: LearningNeedStatus;
  need_type: string;
  session_frequency_intent: string | null;
  student_profile_id: string;
  subject_focus_area_id: string;
  subject_id: string;
  submitted_at: string | null;
  support_style: string | null;
  timezone: string;
  updated_at: string;
  urgency_level: string;
};

type MatchRunRow = {
  candidate_count: number;
  completed_at: string | null;
  created_at: string;
  failed_at: string | null;
  id: string;
  learning_need_id: string;
  matching_projection_version: string;
  need_signature: string;
  ranking_version: string;
  run_status: MatchRunStatus;
  started_at: string | null;
  updated_at: string;
};

type MatchCandidateRow = {
  availability_signal: string | null;
  best_for_summary: string | null;
  candidate_state: MatchCandidateState;
  confidence_label: string | null;
  created_at: string;
  fit_summary: string | null;
  id: string;
  match_run_id: string;
  match_score: number;
  rank_position: number;
  trust_signal_snapshot: Json;
  tutor_profile_id: string;
  updated_at: string;
};

type LessonRow = {
  accepted_at: string | null;
  booking_operation_id: string;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  currency_code: string;
  declined_at: string | null;
  focus_snapshot: Json;
  id: string;
  is_trial: boolean;
  learning_need_id: string;
  lesson_status: LessonStatus;
  lesson_timezone: string;
  match_candidate_id: string | null;
  meeting_method: LessonMeetingMethod;
  price_amount: number;
  request_expires_at: string;
  scheduled_end_at: string;
  scheduled_start_at: string;
  student_note_snapshot: string | null;
  student_profile_id: string;
  subject_snapshot: Json;
  tutor_profile_id: string;
  updated_at: string;
};

type LessonStatusHistoryRow = {
  booking_operation_id: string | null;
  change_reason: string | null;
  changed_by_app_user_id: string | null;
  created_at: string;
  from_status: LessonStatus | null;
  id: string;
  lesson_id: string;
  to_status: LessonStatus;
};

type LessonMeetingAccessRow = {
  access_status: LessonMeetingAccessStatus;
  created_at: string;
  display_label: string | null;
  id: string;
  lesson_id: string;
  meeting_method: LessonMeetingMethod;
  meeting_url: string | null;
  normalized_host: string | null;
  provider: string | null;
  source_type: LessonMeetingSourceType;
  updated_at: string;
  updated_by_app_user_id: string | null;
};

type LessonIssueCaseRow = {
  case_status: LessonIssueCaseStatus;
  counterparty_deadline_at: string;
  counterparty_response_type: LessonIssueCounterpartyResponseType | null;
  counterparty_summary: string | null;
  created_at: string;
  id: string;
  issue_type: LessonIssueType;
  lesson_id: string;
  reported_at: string;
  reported_by_app_user_id: string;
  reporter_summary: string | null;
  resolution_note: string | null;
  resolution_outcome: LessonIssueResolutionOutcome | null;
  resolved_at: string | null;
  resolved_by_app_user_id: string | null;
  updated_at: string;
};

type PaymentRow = {
  amount: number;
  authorization_expires_at: string | null;
  authorization_operation_id: string;
  authorized_at: string | null;
  capture_cancelled_at: string | null;
  capture_operation_id: string | null;
  captured_at: string | null;
  created_at: string;
  currency_code: string;
  id: string;
  lesson_id: string;
  payer_app_user_id: string;
  payment_status: PaymentStatus;
  provider: PaymentProvider;
  provider_idempotency_key: string | null;
  refunded_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  updated_at: string;
};

type JobRunRow = {
  attempt_number: number;
  available_at: string;
  claimed_at: string | null;
  created_at: string;
  dead_lettered_at: string | null;
  dedupe_key: string | null;
  failure_code: string | null;
  failure_message: string | null;
  finished_at: string | null;
  id: string;
  job_status: JobStatus;
  job_type: JobType;
  last_error_payload: Json | null;
  last_failed_at: string | null;
  max_attempts: number;
  payload: Json;
  result_payload: Json | null;
  started_at: string | null;
  trigger_object_id: string | null;
  trigger_object_type: string | null;
  updated_at: string;
};

type WebhookEventRow = {
  created_at: string;
  error_code: string | null;
  error_message: string | null;
  event_type: string;
  id: string;
  payload: Json;
  processed_at: string | null;
  processing_status: WebhookProcessingStatus;
  provider: WebhookProvider;
  provider_event_id: string;
  received_at: string;
  signature_header: string | null;
  updated_at: string;
  verification_status: WebhookVerificationStatus;
  verified_at: string | null;
};

export type MentorIbDatabase = {
  public: {
    CompositeTypes: Record<string, never>;
    Enums: Record<string, never>;
    Functions: {
      claim_job_runs: {
        Args: {
          p_limit?: number | null;
        };
        Returns: JobRunRow[];
      };
    };
    Tables: {
      app_users: {
        Insert: Pick<AppUserRow, "auth_user_id" | "avatar_url" | "email" | "full_name"> & {
          account_status?: AccountStatus;
          onboarding_state?: OnboardingState;
          preferred_language_code?: string | null;
          primary_role_context?: PrimaryRoleContext | null;
          timezone?: string;
        };
        Relationships: [];
        Row: AppUserRow;
        Update: Partial<Omit<AppUserRow, "auth_user_id" | "created_at" | "id" | "updated_at">>;
      };
      abuse_reports: {
        Insert: Pick<
          AbuseReportRow,
          "reported_app_user_id" | "report_type" | "reporter_app_user_id" | "summary"
        > & {
          conversation_id?: string | null;
          lesson_id?: string | null;
          reported_message_id?: string | null;
          report_status?: AbuseReportStatus;
        };
        Relationships: [];
        Row: AbuseReportRow;
        Update: Partial<
          Omit<
            AbuseReportRow,
            "created_at" | "id" | "reported_app_user_id" | "reporter_app_user_id" | "updated_at"
          >
        >;
      };
      booking_operations: {
        Insert: Pick<
          BookingOperationRow,
          "actor_app_user_id" | "operation_key" | "operation_type" | "request_fingerprint"
        > & {
          error_code?: string | null;
          error_message?: string | null;
          operation_status?: BookingOperationStatus;
        };
        Relationships: [];
        Row: BookingOperationRow;
        Update: Partial<
          Omit<
            BookingOperationRow,
            | "actor_app_user_id"
            | "created_at"
            | "id"
            | "operation_key"
            | "operation_type"
            | "request_fingerprint"
            | "updated_at"
          >
        >;
      };
      availability_overrides: {
        Insert: Pick<AvailabilityOverrideRow, "override_date" | "override_type" | "tutor_profile_id"> & {
          end_local_time?: string | null;
          reason?: string | null;
          start_local_time?: string | null;
        };
        Relationships: [];
        Row: AvailabilityOverrideRow;
        Update: Partial<
          Omit<AvailabilityOverrideRow, "created_at" | "id" | "override_date" | "tutor_profile_id" | "updated_at">
        >;
      };
      availability_rules: {
        Insert: Pick<
          AvailabilityRuleRow,
          "day_of_week" | "end_local_time" | "start_local_time" | "tutor_profile_id"
        > & {
          visibility_status?: AvailabilityRuleVisibilityStatus;
        };
        Relationships: [];
        Row: AvailabilityRuleRow;
        Update: Partial<
          Omit<
            AvailabilityRuleRow,
            "created_at" | "day_of_week" | "end_local_time" | "id" | "start_local_time" | "tutor_profile_id" | "updated_at"
          >
        >;
      };
      conversation_participants: {
        Insert: Pick<
          ConversationParticipantRow,
          "app_user_id" | "conversation_id" | "participant_role"
        > & {
          is_archived?: boolean;
          is_muted?: boolean;
          joined_at?: string;
        };
        Relationships: [];
        Row: ConversationParticipantRow;
        Update: Partial<
          Omit<
            ConversationParticipantRow,
            "app_user_id" | "conversation_id" | "created_at" | "id" | "participant_role" | "updated_at"
          >
        >;
      };
      conversations: {
        Insert: Pick<ConversationRow, "student_profile_id" | "tutor_profile_id"> & {
          conversation_status?: ConversationStatus;
          last_message_at?: string | null;
          last_message_id?: string | null;
        };
        Relationships: [];
        Row: ConversationRow;
        Update: Partial<
          Omit<
            ConversationRow,
            "created_at" | "id" | "student_profile_id" | "tutor_profile_id" | "updated_at"
          >
        >;
      };
      learning_needs: {
        Insert: Pick<
          LearningNeedRow,
          | "language_code"
          | "need_type"
          | "student_profile_id"
          | "subject_focus_area_id"
          | "subject_id"
          | "urgency_level"
        > & {
          archived_at?: string | null;
          free_text_note?: string | null;
          need_status?: LearningNeedStatus;
          session_frequency_intent?: string | null;
          submitted_at?: string | null;
          support_style?: string | null;
          timezone?: string;
        };
        Relationships: [];
        Row: LearningNeedRow;
        Update: Partial<
          Omit<LearningNeedRow, "created_at" | "id" | "student_profile_id" | "updated_at">
        >;
      };
      lesson_issue_cases: {
        Insert: Pick<
          LessonIssueCaseRow,
          "issue_type" | "lesson_id" | "reported_by_app_user_id"
        > & {
          case_status?: LessonIssueCaseStatus;
          counterparty_deadline_at?: string;
          counterparty_response_type?: LessonIssueCounterpartyResponseType | null;
          counterparty_summary?: string | null;
          reported_at?: string;
          reporter_summary?: string | null;
          resolution_note?: string | null;
          resolution_outcome?: LessonIssueResolutionOutcome | null;
          resolved_at?: string | null;
          resolved_by_app_user_id?: string | null;
        };
        Relationships: [];
        Row: LessonIssueCaseRow;
        Update: Partial<
          Omit<
            LessonIssueCaseRow,
            | "created_at"
            | "id"
            | "issue_type"
            | "lesson_id"
            | "reported_at"
            | "reported_by_app_user_id"
            | "updated_at"
          >
        >;
      };
      lesson_meeting_access: {
        Insert: Pick<LessonMeetingAccessRow, "lesson_id"> & {
          access_status?: LessonMeetingAccessStatus;
          display_label?: string | null;
          meeting_method?: LessonMeetingMethod;
          meeting_url?: string | null;
          normalized_host?: string | null;
          provider?: string | null;
          source_type?: LessonMeetingSourceType;
          updated_by_app_user_id?: string | null;
        };
        Relationships: [];
        Row: LessonMeetingAccessRow;
        Update: Partial<Omit<LessonMeetingAccessRow, "created_at" | "id" | "lesson_id" | "updated_at">>;
      };
      lesson_status_history: {
        Insert: Pick<LessonStatusHistoryRow, "lesson_id" | "to_status"> & {
          booking_operation_id?: string | null;
          change_reason?: string | null;
          changed_by_app_user_id?: string | null;
          from_status?: LessonStatus | null;
        };
        Relationships: [];
        Row: LessonStatusHistoryRow;
        Update: Partial<Omit<LessonStatusHistoryRow, "created_at" | "id" | "lesson_id">>;
      };
      lessons: {
        Insert: Pick<
          LessonRow,
          | "booking_operation_id"
          | "learning_need_id"
          | "lesson_timezone"
          | "price_amount"
          | "request_expires_at"
          | "scheduled_end_at"
          | "scheduled_start_at"
          | "student_profile_id"
          | "subject_snapshot"
          | "tutor_profile_id"
        > & {
          accepted_at?: string | null;
          cancelled_at?: string | null;
          completed_at?: string | null;
          currency_code?: string;
          declined_at?: string | null;
          focus_snapshot?: Json;
          is_trial?: boolean;
          lesson_status?: LessonStatus;
          match_candidate_id?: string | null;
          meeting_method?: LessonMeetingMethod;
          student_note_snapshot?: string | null;
        };
        Relationships: [];
        Row: LessonRow;
        Update: Partial<
          Omit<
            LessonRow,
            | "booking_operation_id"
            | "created_at"
            | "id"
            | "learning_need_id"
            | "student_profile_id"
            | "tutor_profile_id"
            | "updated_at"
          >
        >;
      };
      user_roles: {
        Insert: Pick<UserRoleRow, "app_user_id" | "role" | "role_status"> & {
          granted_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
        Row: UserRoleRow;
        Update: Partial<
          Omit<UserRoleRow, "app_user_id" | "created_at" | "id" | "role" | "updated_at">
        >;
      };
      languages: {
        Insert: Pick<LanguageRow, "display_name" | "language_code"> & {
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
        Row: LanguageRow;
        Update: Partial<Omit<LanguageRow, "created_at" | "language_code" | "updated_at">>;
      };
      learning_need_option_values: {
        Insert: Pick<
          LearningNeedOptionValueRow,
          "display_label" | "option_group" | "option_key"
        > & {
          allowed_subject_codes?: string[];
          helper_text?: string | null;
          is_active?: boolean;
          sort_order?: number;
          subject_focus_area_code?: string | null;
        };
        Relationships: [];
        Row: LearningNeedOptionValueRow;
        Update: Partial<
          Omit<
            LearningNeedOptionValueRow,
            "created_at" | "id" | "option_group" | "option_key" | "updated_at"
          >
        >;
      };
      match_candidates: {
        Insert: Pick<
          MatchCandidateRow,
          "match_run_id" | "match_score" | "rank_position" | "tutor_profile_id"
        > & {
          availability_signal?: string | null;
          best_for_summary?: string | null;
          candidate_state?: MatchCandidateState;
          confidence_label?: string | null;
          fit_summary?: string | null;
          trust_signal_snapshot?: Json;
        };
        Relationships: [];
        Row: MatchCandidateRow;
        Update: Partial<
          Omit<
            MatchCandidateRow,
            "created_at" | "id" | "match_run_id" | "tutor_profile_id" | "updated_at"
          >
        >;
      };
      match_runs: {
        Insert: Pick<
          MatchRunRow,
          | "learning_need_id"
          | "matching_projection_version"
          | "need_signature"
          | "ranking_version"
        > & {
          candidate_count?: number;
          completed_at?: string | null;
          failed_at?: string | null;
          run_status?: MatchRunStatus;
          started_at?: string | null;
        };
        Relationships: [];
        Row: MatchRunRow;
        Update: Partial<
          Omit<MatchRunRow, "created_at" | "id" | "learning_need_id" | "updated_at">
        >;
      };
      meeting_providers: {
        Insert: Pick<MeetingProviderRow, "display_name" | "provider_key"> & {
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
        Row: MeetingProviderRow;
        Update: Partial<
          Omit<MeetingProviderRow, "created_at" | "provider_key" | "updated_at">
        >;
      };
      job_runs: {
        Insert: Pick<JobRunRow, "job_type"> & {
          available_at?: string;
          claimed_at?: string | null;
          dead_lettered_at?: string | null;
          dedupe_key?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          finished_at?: string | null;
          job_status?: JobStatus;
          last_error_payload?: Json | null;
          last_failed_at?: string | null;
          max_attempts?: number;
          payload?: Json;
          result_payload?: Json | null;
          started_at?: string | null;
          trigger_object_id?: string | null;
          trigger_object_type?: string | null;
        };
        Relationships: [];
        Row: JobRunRow;
        Update: Partial<
          Omit<JobRunRow, "attempt_number" | "created_at" | "id" | "job_type" | "updated_at">
        >;
      };
      message_reads: {
        Insert: Pick<MessageReadRow, "app_user_id" | "message_id"> & {
          read_at?: string;
        };
        Relationships: [];
        Row: MessageReadRow;
        Update: Partial<
          Omit<MessageReadRow, "app_user_id" | "created_at" | "id" | "message_id" | "updated_at">
        >;
      };
      messages: {
        Insert: Pick<MessageRow, "body" | "conversation_id" | "sender_app_user_id"> & {
          edited_at?: string | null;
          message_status?: MessageStatus;
          removed_at?: string | null;
          reply_to_message_id?: string | null;
        };
        Relationships: [];
        Row: MessageRow;
        Update: Partial<
          Omit<
            MessageRow,
            "conversation_id" | "created_at" | "id" | "sender_app_user_id" | "updated_at"
          >
        >;
      };
      notification_deliveries: {
        Insert: Pick<NotificationDeliveryRow, "channel" | "notification_id"> & {
          accepted_at?: string | null;
          attempt_number?: number;
          attempted_at?: string | null;
          delivery_status?: NotificationDeliveryStatus;
          error_code?: string | null;
          error_message?: string | null;
          failed_at?: string | null;
          job_run_id?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
        };
        Relationships: [];
        Row: NotificationDeliveryRow;
        Update: Partial<
          Omit<
            NotificationDeliveryRow,
            "created_at" | "id" | "notification_id" | "updated_at"
          >
        >;
      };
      notifications: {
        Insert: Pick<
          NotificationRow,
          "app_user_id" | "body_summary" | "notification_type" | "object_type" | "title"
        > & {
          dismissed_at?: string | null;
          notification_status?: NotificationStatus;
          object_id?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
        Row: NotificationRow;
        Update: Partial<
          Omit<NotificationRow, "app_user_id" | "created_at" | "id" | "updated_at">
        >;
      };
      payments: {
        Insert: Pick<
          PaymentRow,
          "amount" | "authorization_operation_id" | "lesson_id" | "payer_app_user_id"
        > & {
          authorization_expires_at?: string | null;
          authorized_at?: string | null;
          capture_cancelled_at?: string | null;
          capture_operation_id?: string | null;
          captured_at?: string | null;
          currency_code?: string;
          payment_status?: PaymentStatus;
          provider?: PaymentProvider;
          provider_idempotency_key?: string | null;
          refunded_at?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
        };
        Relationships: [];
        Row: PaymentRow;
        Update: Partial<
          Omit<
            PaymentRow,
            | "authorization_operation_id"
            | "created_at"
            | "id"
            | "lesson_id"
            | "payer_app_user_id"
            | "updated_at"
          >
        >;
      };
      policy_notice_receipts: {
        Insert: Pick<
          PolicyNoticeReceiptRow,
          "app_user_id" | "policy_notice_version_id"
        > & {
          acknowledged_at?: string | null;
          first_shown_at?: string | null;
          viewed_at?: string | null;
        };
        Relationships: [];
        Row: PolicyNoticeReceiptRow;
        Update: Partial<
          Omit<
            PolicyNoticeReceiptRow,
            "app_user_id" | "created_at" | "id" | "policy_notice_version_id" | "updated_at"
          >
        >;
      };
      policy_notice_versions: {
        Insert: Pick<
          PolicyNoticeVersionRow,
          "document_url" | "notice_type" | "summary" | "title" | "version_label"
        > & {
          effective_at?: string;
          published_at?: string;
          requires_acknowledgement?: boolean;
        };
        Relationships: [];
        Row: PolicyNoticeVersionRow;
        Update: Partial<Omit<PolicyNoticeVersionRow, "created_at" | "id" | "updated_at">>;
      };
      schedule_policies: {
        Insert: Pick<SchedulePolicyRow, "tutor_profile_id"> & {
          buffer_after_minutes?: number;
          buffer_before_minutes?: number;
          daily_capacity?: number | null;
          is_accepting_new_students?: boolean;
          minimum_notice_minutes?: number;
          timezone?: string;
          weekly_capacity?: number | null;
        };
        Relationships: [];
        Row: SchedulePolicyRow;
        Update: Partial<
          Omit<SchedulePolicyRow, "created_at" | "id" | "tutor_profile_id" | "updated_at">
        >;
      };
      student_profiles: {
        Insert: Pick<StudentProfileRow, "app_user_id"> & {
          current_stage_summary?: string | null;
          display_name?: string | null;
          notes_visibility_preference?: string | null;
        };
        Relationships: [];
        Row: StudentProfileRow;
        Update: Partial<
          Omit<StudentProfileRow, "app_user_id" | "created_at" | "id" | "updated_at">
        >;
      };
      subject_focus_areas: {
        Insert: Pick<SubjectFocusAreaRow, "display_name" | "focus_area_code" | "slug"> & {
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
        Row: SubjectFocusAreaRow;
        Update: Partial<
          Omit<SubjectFocusAreaRow, "created_at" | "focus_area_code" | "id" | "updated_at">
        >;
      };
      subjects: {
        Insert: Pick<SubjectRow, "display_name" | "slug" | "subject_code"> & {
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
        Row: SubjectRow;
        Update: Partial<Omit<SubjectRow, "created_at" | "id" | "subject_code" | "updated_at">>;
      };
      webhook_events: {
        Insert: Pick<
          WebhookEventRow,
          "event_type" | "payload" | "provider" | "provider_event_id" | "verification_status"
        > & {
          error_code?: string | null;
          error_message?: string | null;
          processed_at?: string | null;
          processing_status?: WebhookProcessingStatus;
          received_at?: string;
          signature_header?: string | null;
          verified_at?: string | null;
        };
        Relationships: [];
        Row: WebhookEventRow;
        Update: Partial<
          Omit<WebhookEventRow, "created_at" | "event_type" | "id" | "provider" | "provider_event_id" | "received_at" | "updated_at" | "verification_status">
        >;
      };
      tutor_credentials: {
        Insert: Pick<
          TutorCredentialRow,
          "credential_type" | "storage_object_path" | "title" | "tutor_profile_id"
        > & {
          issuing_body?: string | null;
          public_display_preference?: boolean;
          review_status?: TutorCredentialReviewStatus;
          reviewed_at?: string | null;
        };
        Relationships: [];
        Row: TutorCredentialRow;
        Update: Partial<
          Omit<
            TutorCredentialRow,
            "created_at" | "credential_type" | "id" | "storage_object_path" | "title" | "tutor_profile_id" | "updated_at"
          >
        >;
      };
      tutor_language_capabilities: {
        Insert: Pick<TutorLanguageCapabilityRow, "language_code" | "tutor_profile_id"> & {
          display_priority?: number;
        };
        Relationships: [];
        Row: TutorLanguageCapabilityRow;
        Update: Partial<
          Omit<
            TutorLanguageCapabilityRow,
            "created_at" | "id" | "language_code" | "tutor_profile_id" | "updated_at"
          >
        >;
      };
      tutor_profiles: {
        Insert: Pick<TutorProfileRow, "app_user_id"> & {
          application_status?: TutorApplicationStatus;
          best_for_summary?: string | null;
          bio?: string | null;
          display_name?: string | null;
          headline?: string | null;
          intro_video_external_id?: string | null;
          intro_video_provider?: string | null;
          intro_video_url?: string | null;
          payout_readiness_status?: PayoutReadinessStatus;
          pricing_summary?: string | null;
          profile_visibility_status?: TutorProfileVisibilityStatus;
          public_listing_status?: TutorPublicListingStatus;
          public_slug?: string | null;
          teaching_style_summary?: string | null;
        };
        Relationships: [];
        Row: TutorProfileRow;
        Update: Partial<Omit<TutorProfileRow, "app_user_id" | "created_at" | "id" | "updated_at">>;
      };
      tutor_subject_capabilities: {
        Insert: Pick<
          TutorSubjectCapabilityRow,
          "subject_focus_area_id" | "subject_id" | "tutor_profile_id"
        > & {
          display_priority?: number;
          experience_summary?: string | null;
        };
        Relationships: [];
        Row: TutorSubjectCapabilityRow;
        Update: Partial<
          Omit<
            TutorSubjectCapabilityRow,
            "created_at" | "id" | "subject_focus_area_id" | "subject_id" | "tutor_profile_id" | "updated_at"
          >
        >;
      };
      user_blocks: {
        Insert: Pick<UserBlockRow, "blocked_app_user_id" | "blocker_app_user_id"> & {
          block_status?: UserBlockStatus;
          released_at?: string | null;
        };
        Relationships: [];
        Row: UserBlockRow;
        Update: Partial<
          Omit<
            UserBlockRow,
            "blocked_app_user_id" | "blocker_app_user_id" | "created_at" | "id" | "updated_at"
          >
        >;
      };
      video_media_providers: {
        Insert: Pick<VideoMediaProviderRow, "display_name" | "provider_key"> & {
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
        Row: VideoMediaProviderRow;
        Update: Partial<
          Omit<VideoMediaProviderRow, "created_at" | "provider_key" | "updated_at">
        >;
      };
    };
    Views: Record<string, never>;
  };
};
