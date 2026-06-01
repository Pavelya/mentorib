"use server";

import { revalidatePath } from "next/cache";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  AccountStatusError,
  isAdminReachableAccountStatus,
  setAccountStatus,
  type AdminReachableAccountStatus,
} from "@/modules/admin/account-status-service";
import {
  AdminDisplayNameError,
  adminUpdateDisplayName,
} from "@/modules/admin/display-name-service";
import {
  FinanceInterventionError,
  isFinanceInterventionKind,
  recordFinanceInterventionNote,
} from "@/modules/admin/finance-intervention-service";
import {
  AdminRoleError,
  grantAdminRole,
  revokeAdminRole,
} from "@/modules/admin/role-management-service";
import {
  AdminListingError,
  adminDelistTutorListing,
  adminLiftTutorListingHold,
  adminPauseTutorListing,
} from "@/modules/tutors/admin-listing-service";

export type UserDetailActionIntent =
  | "pause_listing"
  | "delist_listing"
  | "lift_listing_hold"
  | "set_account_status"
  | "update_display_name"
  | "grant_admin_role"
  | "revoke_admin_role"
  | "record_finance_intervention";

export type UserDetailActionState = {
  code: string | null;
  intent: UserDetailActionIntent | null;
  message: string | null;
  successMessage: string | null;
};

export const initialUserDetailActionState: UserDetailActionState = {
  code: null,
  intent: null,
  message: null,
  successMessage: null,
};

const INTENTS: readonly UserDetailActionIntent[] = [
  "pause_listing",
  "delist_listing",
  "lift_listing_hold",
  "set_account_status",
  "update_display_name",
  "grant_admin_role",
  "revoke_admin_role",
  "record_finance_intervention",
];

export async function runUserDetailAction(
  _previous: UserDetailActionState,
  formData: FormData,
): Promise<UserDetailActionState> {
  const intent = readIntent(formData);
  if (!intent) {
    return {
      code: "invalid_intent",
      intent: null,
      message: "Pick an action before saving.",
      successMessage: null,
    };
  }

  const targetAppUserId = readString(formData, "target_app_user_id");
  if (!targetAppUserId) {
    return {
      code: "missing_target",
      intent,
      message: "Missing target user reference.",
      successMessage: null,
    };
  }

  const admin = await requireInternalAdminAccount();

  try {
    if (
      intent === "pause_listing" ||
      intent === "delist_listing" ||
      intent === "lift_listing_hold"
    ) {
      const tutorProfileId = readString(formData, "tutor_profile_id");
      if (!tutorProfileId) {
        return {
          code: "missing_tutor_profile",
          intent,
          message: "Missing tutor profile reference.",
          successMessage: null,
        };
      }
      const reason = readString(formData, "reason");
      if (intent === "pause_listing") {
        await adminPauseTutorListing({
          actorAppUserId: admin.id,
          reason,
          tutorProfileId,
        });
      } else if (intent === "delist_listing") {
        await adminDelistTutorListing({
          actorAppUserId: admin.id,
          reason,
          tutorProfileId,
        });
      } else {
        await adminLiftTutorListingHold({
          actorAppUserId: admin.id,
          reason,
          tutorProfileId,
        });
      }
    } else if (intent === "set_account_status") {
      const nextStatusRaw = readString(formData, "next_status");
      if (!isAdminReachableAccountStatus(nextStatusRaw)) {
        return {
          code: "invalid_status",
          intent,
          message: "Pick a valid account status.",
          successMessage: null,
        };
      }
      const reason = readString(formData, "reason");
      await setAccountStatus({
        actorAppUserId: admin.id,
        nextStatus: nextStatusRaw as AdminReachableAccountStatus,
        reason,
        targetAppUserId,
      });
    } else if (intent === "update_display_name") {
      const name = readString(formData, "display_name");
      const reason = readString(formData, "reason");
      await adminUpdateDisplayName({
        actorAppUserId: admin.id,
        name,
        reason,
        targetAppUserId,
      });
    } else if (intent === "grant_admin_role") {
      const reason = readString(formData, "reason");
      await grantAdminRole({
        actorAppUserId: admin.id,
        reason,
        targetAppUserId,
      });
    } else if (intent === "revoke_admin_role") {
      const reason = readString(formData, "reason");
      await revokeAdminRole({
        actorAppUserId: admin.id,
        reason,
        targetAppUserId,
      });
    } else if (intent === "record_finance_intervention") {
      const kindRaw = readString(formData, "kind");
      if (!isFinanceInterventionKind(kindRaw)) {
        return {
          code: "invalid_kind",
          intent,
          message: "Pick a finance-intervention kind.",
          successMessage: null,
        };
      }
      const body = readString(formData, "body");
      await recordFinanceInterventionNote({
        actorAppUserId: admin.id,
        body,
        kind: kindRaw,
        targetAppUserId,
      });
    }
  } catch (error) {
    if (
      error instanceof AdminListingError ||
      error instanceof AccountStatusError ||
      error instanceof AdminDisplayNameError ||
      error instanceof AdminRoleError ||
      error instanceof FinanceInterventionError
    ) {
      return {
        code: error.code,
        intent,
        message: error.message,
        successMessage: null,
      };
    }
    return {
      code: "unexpected",
      intent,
      message: "We couldn't apply that action right now.",
      successMessage: null,
    };
  }

  revalidatePath(`/internal/users/${targetAppUserId}`);
  revalidatePath("/internal");

  return {
    code: "ok",
    intent,
    message: null,
    successMessage: buildSuccessMessage(intent),
  };
}

function buildSuccessMessage(intent: UserDetailActionIntent): string {
  switch (intent) {
    case "pause_listing":
      return "Listing paused.";
    case "delist_listing":
      return "Listing delisted.";
    case "lift_listing_hold":
      return "Listing hold lifted.";
    case "set_account_status":
      return "Account status updated.";
    case "update_display_name":
      return "Display name updated.";
    case "grant_admin_role":
      return "Admin access granted.";
    case "revoke_admin_role":
      return "Admin access revoked.";
    case "record_finance_intervention":
      return "Finance-intervention note recorded.";
  }
}

function readIntent(formData: FormData): UserDetailActionIntent | null {
  const raw = formData.get("intent");
  if (typeof raw === "string" && (INTENTS as readonly string[]).includes(raw)) {
    return raw as UserDetailActionIntent;
  }
  return null;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
