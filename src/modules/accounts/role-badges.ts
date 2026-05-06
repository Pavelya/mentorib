import type { AccountStateSnapshot } from "@/modules/accounts/account-state";
import type { RoleStatus } from "@/modules/accounts/constants";

export type AccountRoleBadgeTone =
  | "destructive"
  | "info"
  | "trust"
  | "warning";

export type AccountRoleBadge = {
  label: string;
  tone: AccountRoleBadgeTone;
};

type AccountRoleBadgeSource = Pick<
  AccountStateSnapshot,
  "primary_role_context" | "roles"
>;

export function buildAccountRoleBadges(
  account: AccountRoleBadgeSource,
): readonly AccountRoleBadge[] {
  const visibleRoles = account.roles.filter(
    (role) => role.role_status !== "revoked",
  );

  if (visibleRoles.length === 0) {
    if (account.primary_role_context === "student") {
      return [{ label: "Student", tone: "info" }];
    }

    if (account.primary_role_context === "tutor") {
      return [{ label: "Tutor", tone: "info" }];
    }

    return [];
  }

  return visibleRoles.map((role) => {
    if (role.role === "student") {
      return {
        label: role.role_status === "pending" ? "Student setup" : "Student",
        tone: getAccountRoleBadgeTone(role.role_status),
      };
    }

    if (role.role === "tutor") {
      return {
        label: role.role_status === "pending" ? "Tutor application" : "Tutor",
        tone: getAccountRoleBadgeTone(role.role_status),
      };
    }

    return {
      label: "Admin",
      tone: getAccountRoleBadgeTone(role.role_status),
    };
  });
}

function getAccountRoleBadgeTone(roleStatus: RoleStatus): AccountRoleBadgeTone {
  switch (roleStatus) {
    case "active":
      return "trust";
    case "pending":
      return "warning";
    case "revoked":
    case "suspended":
      return "destructive";
  }
}
