import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { ADMIN_ACTION_KEYS, type AdminActionKey } from "@/modules/admin/actions";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

export class AdminAuditError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type RecordAdminActionInput = {
  actorAppUserId: string;
  action: AdminActionKey;
  targetType: string;
  targetId: string;
  beforeState?: JsonValue;
  afterState?: JsonValue;
  reason?: string | null;
};

// Writes one row to `admin_action_logs`. Callers MUST invoke this from
// inside the same domain Server Action that mutates the target state and
// MUST roll back the underlying mutation if this throws — the audit row is
// load-bearing for compliance review.
export async function recordAdminAction(input: RecordAdminActionInput) {
  if (!(ADMIN_ACTION_KEYS as readonly string[]).includes(input.action)) {
    throw new AdminAuditError(
      "unknown_action_key",
      `Unknown admin action key: ${input.action}`,
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("admin_action_logs").insert({
    actor_app_user_id: input.actorAppUserId,
    action_key: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    after_state: (input.afterState ?? null) as never,
    before_state: (input.beforeState ?? null) as never,
    reason: input.reason ?? null,
  });

  if (error) {
    throw new AdminAuditError(
      "audit_insert_failed",
      "Could not record admin action.",
    );
  }
}

// Tagged-template helper for compact before/after snapshots. Domain
// services pass a plain object describing only the fields that changed
// state, never the full row — this keeps audit payloads small and avoids
// leaking unrelated data.
export function snapshot<T extends Record<string, unknown>>(payload: T): T {
  return payload;
}
