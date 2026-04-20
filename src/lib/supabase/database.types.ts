import type {
  AccountStatus,
  OnboardingState,
  PrimaryRoleContext,
  Role,
  RoleStatus,
} from "@/modules/accounts/constants";

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

export type MentorIbDatabase = {
  public: {
    CompositeTypes: Record<string, never>;
    Enums: Record<string, never>;
    Functions: Record<string, never>;
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
    };
    Views: Record<string, never>;
  };
};
