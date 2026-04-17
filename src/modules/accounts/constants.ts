export const onboardingStates = [
  "role_pending",
  "student_setup",
  "tutor_application_started",
  "completed",
] as const;

export type OnboardingState = (typeof onboardingStates)[number];

export const accountStatuses = [
  "active",
  "limited",
  "suspended",
  "closed",
] as const;

export type AccountStatus = (typeof accountStatuses)[number];

export const roles = ["student", "tutor", "admin"] as const;

export type Role = (typeof roles)[number];

export const roleStatuses = [
  "active",
  "pending",
  "revoked",
  "suspended",
] as const;

export type RoleStatus = (typeof roleStatuses)[number];

export const primaryRoleContexts = roles;

export type PrimaryRoleContext = (typeof primaryRoleContexts)[number];

export const defaultOnboardingState: OnboardingState = "role_pending";
export const defaultAccountStatus: AccountStatus = "active";
