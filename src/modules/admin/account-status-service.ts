import "server-only";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";
import {
  accountStatuses,
  type AccountStatus,
} from "@/modules/accounts/constants";

// `P2-OPS-002` Admin account-status transitions.
//
// `closed` is reserved for the deletion flow (`P2-DSR-001`) and is not
// reachable through this surface.

export class AccountStatusError extends Error {
  code:
    | "account_not_found"
    | "account_lookup_failed"
    | "conflict"
    | "reason_required"
    | "update_failed";

  constructor(
    code:
      | "account_not_found"
      | "account_lookup_failed"
      | "conflict"
      | "reason_required"
      | "update_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

// Closed is intentionally excluded — deletion is owned by `P2-DSR-001`.
export const ADMIN_REACHABLE_ACCOUNT_STATUSES = [
  "active",
  "limited",
  "suspended",
] as const satisfies readonly AccountStatus[];

export type AdminReachableAccountStatus =
  (typeof ADMIN_REACHABLE_ACCOUNT_STATUSES)[number];

// `active ↔ limited`, `active|limited → suspended`, `suspended → limited|active`.
const ALLOWED_TRANSITIONS: Record<
  AccountStatus,
  readonly AdminReachableAccountStatus[]
> = {
  active: ["limited", "suspended"],
  limited: ["active", "suspended"],
  suspended: ["active", "limited"],
  closed: [],
};

export function isAdminReachableAccountStatus(
  value: string,
): value is AdminReachableAccountStatus {
  return (ADMIN_REACHABLE_ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function allowedNextAccountStatuses(
  current: AccountStatus,
): readonly AdminReachableAccountStatus[] {
  return ALLOWED_TRANSITIONS[current];
}

export type SetAccountStatusInput = {
  actorAppUserId: string;
  targetAppUserId: string;
  nextStatus: AdminReachableAccountStatus;
  reason: string;
};

export async function setAccountStatus(input: SetAccountStatusInput): Promise<void> {
  const reason = input.reason.trim();
  if (!reason) {
    throw new AccountStatusError(
      "reason_required",
      "Share why you're changing this account's status.",
    );
  }
  if (!(accountStatuses as readonly string[]).includes(input.nextStatus)) {
    throw new AccountStatusError(
      "conflict",
      "That account status isn't valid.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: user, error: lookupError } = await supabase
    .from("app_users")
    .select("account_status, id")
    .eq("id", input.targetAppUserId)
    .maybeSingle<{ account_status: AccountStatus; id: string }>();

  if (lookupError) {
    throw new AccountStatusError(
      "account_lookup_failed",
      "We couldn't read that account right now.",
    );
  }
  if (!user) {
    throw new AccountStatusError(
      "account_not_found",
      "That account no longer exists.",
    );
  }

  const previousStatus = user.account_status;
  if (previousStatus === input.nextStatus) {
    throw new AccountStatusError(
      "conflict",
      "That account is already in that status.",
    );
  }

  const allowed = ALLOWED_TRANSITIONS[previousStatus] ?? [];
  if (!allowed.includes(input.nextStatus)) {
    throw new AccountStatusError(
      "conflict",
      "That transition isn't available for this account.",
    );
  }

  const { error: updateError } = await supabase
    .from("app_users")
    .update({ account_status: input.nextStatus })
    .eq("id", user.id)
    .eq("account_status", previousStatus);

  if (updateError) {
    throw new AccountStatusError(
      "update_failed",
      "We couldn't change the account status right now.",
    );
  }

  try {
    await recordAdminAction({
      action: "account.set_status",
      actorAppUserId: input.actorAppUserId,
      afterState: { accountStatus: input.nextStatus },
      beforeState: { accountStatus: previousStatus },
      reason,
      targetId: user.id,
      targetType: "app_user",
    });
  } catch (auditError) {
    await supabase
      .from("app_users")
      .update({ account_status: previousStatus })
      .eq("id", user.id);
    throw auditError;
  }

  // The next request honors the new state via the auth-account refresh
  // path; revalidate the user-detail surface so the latest status shows.
  revalidatePath(`/internal/users/${user.id}`);
}
