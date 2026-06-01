"use server";

import { revalidatePath } from "next/cache";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  AdminRoleError,
  grantAdminRole,
  revokeAdminRole,
} from "@/modules/admin/role-management-service";

export type AdminDirectoryActionIntent = "grant_admin_role" | "revoke_admin_role";

export type AdminDirectoryActionState = {
  code: string | null;
  intent: AdminDirectoryActionIntent | null;
  message: string | null;
  successMessage: string | null;
};

export const initialAdminDirectoryActionState: AdminDirectoryActionState = {
  code: null,
  intent: null,
  message: null,
  successMessage: null,
};

const INTENTS: readonly AdminDirectoryActionIntent[] = [
  "grant_admin_role",
  "revoke_admin_role",
];

export async function runAdminDirectoryAction(
  _previous: AdminDirectoryActionState,
  formData: FormData,
): Promise<AdminDirectoryActionState> {
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
      message: "Missing target account reference.",
      successMessage: null,
    };
  }

  const admin = await requireInternalAdminAccount();
  const reason = readString(formData, "reason");

  try {
    if (intent === "grant_admin_role") {
      await grantAdminRole({
        actorAppUserId: admin.id,
        reason,
        targetAppUserId,
      });
    } else {
      await revokeAdminRole({
        actorAppUserId: admin.id,
        reason,
        targetAppUserId,
      });
    }
  } catch (error) {
    if (error instanceof AdminRoleError) {
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

  revalidatePath("/internal/admins");
  revalidatePath(`/internal/users/${targetAppUserId}`);

  return {
    code: "ok",
    intent,
    message: null,
    successMessage:
      intent === "grant_admin_role"
        ? "Admin access granted."
        : "Admin access revoked.",
  };
}

function readIntent(formData: FormData): AdminDirectoryActionIntent | null {
  const raw = formData.get("intent");
  if (typeof raw === "string" && (INTENTS as readonly string[]).includes(raw)) {
    return raw as AdminDirectoryActionIntent;
  }
  return null;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
