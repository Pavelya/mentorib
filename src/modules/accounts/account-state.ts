import {
  defaultOnboardingState,
  type AccountStatus,
  type OnboardingState,
  type PrimaryRoleContext,
  type Role,
  type RoleStatus,
} from "@/modules/accounts/constants";

export type AccountRoleSnapshot = {
  role: Role;
  role_status: RoleStatus;
};

export type AccountStateSnapshot = {
  onboarding_state: OnboardingState;
  account_status: AccountStatus;
  primary_role_context: PrimaryRoleContext | null;
  roles: readonly AccountRoleSnapshot[];
};

const defaultActiveStatuses = ["active"] as const satisfies readonly RoleStatus[];

export function hasRole(
  snapshot: AccountStateSnapshot,
  role: Role,
  allowedStatuses: readonly RoleStatus[] = defaultActiveStatuses,
): boolean {
  return snapshot.roles.some((entry) => {
    return entry.role === role && allowedStatuses.includes(entry.role_status);
  });
}

export function requiresRoleSelection(snapshot: AccountStateSnapshot): boolean {
  const hasProductRole = snapshot.roles.some((entry) => {
    return (
      (entry.role === "student" || entry.role === "tutor") &&
      entry.role_status !== "revoked"
    );
  });

  return (
    snapshot.onboarding_state === defaultOnboardingState || !hasProductRole
  );
}

export function isRestrictedAccount(snapshot: AccountStateSnapshot): boolean {
  return (
    snapshot.account_status === "limited" ||
    snapshot.account_status === "suspended" ||
    snapshot.account_status === "closed"
  );
}
