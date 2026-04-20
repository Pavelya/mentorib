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
      user_roles: {
        Insert: never;
        Relationships: [];
        Row: UserRoleRow;
        Update: never;
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
    };
    Views: Record<string, never>;
  };
};
