import "server-only";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";
import type { RoleStatus } from "@/modules/accounts/constants";

// `P2-OPS-002` Steady-state admin grant/revoke surface.
//
// The bootstrap script (`scripts/grant-admin.ts`) writes the first admin
// row with `actor = target` (the self-actor pattern). This module is the
// ROUTINE path: the acting admin is the actor, never the target. Both
// actions go through the same `requireInternalAdminAccount` gate in the
// calling Server Action.

export class AdminRoleError extends Error {
  code:
    | "target_not_found"
    | "target_lookup_failed"
    | "conflict"
    | "reason_required"
    | "update_failed"
    | "insert_failed";

  constructor(
    code:
      | "target_not_found"
      | "target_lookup_failed"
      | "conflict"
      | "reason_required"
      | "update_failed"
      | "insert_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

type AdminRoleRow = {
  id: string;
  role_status: RoleStatus;
};

export type GrantAdminRoleInput = {
  actorAppUserId: string;
  targetAppUserId: string;
  reason: string;
};

export async function grantAdminRole(input: GrantAdminRoleInput): Promise<void> {
  const reason = input.reason.trim();
  if (!reason) {
    throw new AdminRoleError(
      "reason_required",
      "Share why you're granting admin access.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: target, error: lookupError } = await supabase
    .from("app_users")
    .select("id")
    .eq("id", input.targetAppUserId)
    .maybeSingle<{ id: string }>();

  if (lookupError) {
    throw new AdminRoleError(
      "target_lookup_failed",
      "We couldn't read that account right now.",
    );
  }
  if (!target) {
    throw new AdminRoleError(
      "target_not_found",
      "That account no longer exists.",
    );
  }

  const existing = await loadAdminRoleRow(input.targetAppUserId);
  const previousStatus: RoleStatus | "none" = existing
    ? existing.role_status
    : "none";

  if (existing && existing.role_status === "active") {
    throw new AdminRoleError(
      "conflict",
      "This account is already an active admin.",
    );
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("user_roles")
      .update({
        revoked_at: null,
        role_status: "active",
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new AdminRoleError(
        "update_failed",
        "We couldn't grant admin access right now.",
      );
    }
  } else {
    const { error: insertError } = await supabase.from("user_roles").insert({
      app_user_id: input.targetAppUserId,
      role: "admin",
      role_status: "active",
    });

    if (insertError) {
      throw new AdminRoleError(
        "insert_failed",
        "We couldn't grant admin access right now.",
      );
    }
  }

  try {
    await recordAdminAction({
      action: "admin_role.grant",
      actorAppUserId: input.actorAppUserId,
      afterState: { roleStatus: "active" },
      beforeState: { roleStatus: previousStatus },
      reason,
      targetId: input.targetAppUserId,
      targetType: "app_user",
    });
  } catch (auditError) {
    await rollbackGrant({
      existing,
      targetAppUserId: input.targetAppUserId,
    });
    throw auditError;
  }

  revalidatePath(`/internal/users/${input.targetAppUserId}`);
}

export type RevokeAdminRoleInput = {
  actorAppUserId: string;
  targetAppUserId: string;
  reason: string;
};

export async function revokeAdminRole(input: RevokeAdminRoleInput): Promise<void> {
  const reason = input.reason.trim();
  if (!reason) {
    throw new AdminRoleError(
      "reason_required",
      "Share why you're revoking admin access.",
    );
  }

  if (input.actorAppUserId === input.targetAppUserId) {
    // Self-revoke lockout guardrail — recovery from full lockout uses
    // the `grant-admin` script per `P2-OPS-002` acceptance criteria.
    throw new AdminRoleError(
      "conflict",
      "You cannot revoke your own admin role from this surface.",
    );
  }

  const existing = await loadAdminRoleRow(input.targetAppUserId);
  if (!existing) {
    throw new AdminRoleError(
      "conflict",
      "That account does not have an admin role to revoke.",
    );
  }

  if (existing.role_status === "revoked") {
    throw new AdminRoleError(
      "conflict",
      "Admin access is already revoked for this account.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const previousStatus = existing.role_status;
  const { error: updateError } = await supabase
    .from("user_roles")
    .update({
      revoked_at: new Date().toISOString(),
      role_status: "revoked",
    })
    .eq("id", existing.id);

  if (updateError) {
    throw new AdminRoleError(
      "update_failed",
      "We couldn't revoke admin access right now.",
    );
  }

  try {
    await recordAdminAction({
      action: "admin_role.revoke",
      actorAppUserId: input.actorAppUserId,
      afterState: { roleStatus: "revoked" },
      beforeState: { roleStatus: previousStatus },
      reason,
      targetId: input.targetAppUserId,
      targetType: "app_user",
    });
  } catch (auditError) {
    await supabase
      .from("user_roles")
      .update({
        revoked_at: null,
        role_status: previousStatus,
      })
      .eq("id", existing.id);
    throw auditError;
  }

  revalidatePath(`/internal/users/${input.targetAppUserId}`);
}

async function loadAdminRoleRow(
  appUserId: string,
): Promise<AdminRoleRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("id, role_status")
    .eq("app_user_id", appUserId)
    .eq("role", "admin")
    .maybeSingle<AdminRoleRow>();

  if (error) {
    throw new AdminRoleError(
      "target_lookup_failed",
      "We couldn't read role state right now.",
    );
  }
  return data ?? null;
}

async function rollbackGrant(input: {
  existing: AdminRoleRow | null;
  targetAppUserId: string;
}): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  if (input.existing) {
    await supabase
      .from("user_roles")
      .update({ role_status: input.existing.role_status })
      .eq("id", input.existing.id);
  } else {
    await supabase
      .from("user_roles")
      .delete()
      .eq("app_user_id", input.targetAppUserId)
      .eq("role", "admin");
  }
}
