import "server-only";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";

// `P2-ADMIN-PEOPLE-001` admin-actor display-name edit.
//
// Wraps the same `app_users.full_name` update the account owner performs in
// `src/modules/accounts/profile-settings.ts`, but with the acting admin as
// the actor and a mandatory audit row. The owner self-service path validates
// the preferred-language field too; this admin path only touches the name.

const FULL_NAME_MAX_LENGTH = 120;

export class AdminDisplayNameError extends Error {
  code:
    | "target_not_found"
    | "target_lookup_failed"
    | "name_required"
    | "reason_required"
    | "update_failed";

  constructor(
    code:
      | "target_not_found"
      | "target_lookup_failed"
      | "name_required"
      | "reason_required"
      | "update_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export type AdminUpdateDisplayNameInput = {
  actorAppUserId: string;
  targetAppUserId: string;
  name: string;
  reason: string;
};

export async function adminUpdateDisplayName(
  input: AdminUpdateDisplayNameInput,
): Promise<void> {
  const name = normalizeFullName(input.name);
  const reason = input.reason.trim();

  if (!name) {
    throw new AdminDisplayNameError(
      "name_required",
      "Enter the display name to use for this account.",
    );
  }
  if (!reason) {
    throw new AdminDisplayNameError(
      "reason_required",
      "Share why you're changing this account's name.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: user, error: lookupError } = await supabase
    .from("app_users")
    .select("full_name, id")
    .eq("id", input.targetAppUserId)
    .maybeSingle<{ full_name: string | null; id: string }>();

  if (lookupError) {
    throw new AdminDisplayNameError(
      "target_lookup_failed",
      "We couldn't read that account right now.",
    );
  }
  if (!user) {
    throw new AdminDisplayNameError(
      "target_not_found",
      "That account no longer exists.",
    );
  }

  const previousName = user.full_name?.trim() || null;

  const { error: updateError } = await supabase
    .from("app_users")
    .update({ full_name: name })
    .eq("id", user.id);

  if (updateError) {
    throw new AdminDisplayNameError(
      "update_failed",
      "We couldn't update the display name right now.",
    );
  }

  try {
    await recordAdminAction({
      action: "account.update_display_name",
      actorAppUserId: input.actorAppUserId,
      afterState: { displayName: name },
      beforeState: { displayName: previousName },
      reason,
      targetId: user.id,
      targetType: "app_user",
    });
  } catch (auditError) {
    await supabase
      .from("app_users")
      .update({ full_name: previousName })
      .eq("id", user.id);
    throw auditError;
  }

  revalidatePath(`/internal/users/${user.id}`);
}

function normalizeFullName(value: string | null | undefined): string {
  const normalized = value?.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return "";
  }
  return normalized.slice(0, FULL_NAME_MAX_LENGTH);
}
