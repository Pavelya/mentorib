import "server-only";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction, snapshot } from "@/modules/admin/audit-service";

import { REFERENCE_FAMILIES, type ReferenceFamilySlug } from "./families";
import { loadReferenceFamilyRow } from "./repository";
import { validateReferenceChanges } from "./schemas";

export class ReferenceDataError extends Error {
  code: "forbidden" | "not_found" | "no_changes" | "update_failed";

  constructor(
    code: "forbidden" | "not_found" | "no_changes" | "update_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export type UpdateReferenceDataRowInput = {
  actorAppUserId: string;
  family: ReferenceFamilySlug;
  id: string;
  changes: Record<string, unknown>;
};

export async function updateReferenceDataRow(input: UpdateReferenceDataRowInput) {
  const descriptor = REFERENCE_FAMILIES[input.family];
  const result = validateReferenceChanges(input.family, input.changes);
  if (!result.ok) {
    if (result.code === "unrecognized_keys") {
      throw new ReferenceDataError("forbidden", result.message);
    }
    throw new ReferenceDataError("forbidden", result.message);
  }

  const sanitized = result.value as Record<string, unknown>;
  if (Object.keys(sanitized).length === 0) {
    throw new ReferenceDataError("no_changes", "No editable fields provided.");
  }

  const before = await loadReferenceFamilyRow(input.family, input.id);
  if (!before) {
    throw new ReferenceDataError("not_found", "Reference row not found.");
  }

  const beforeSnapshot = pickBeforeSnapshot(before, Object.keys(sanitized));

  const supabase = createSupabaseServiceRoleClient();
  // Supabase types for `.update` resolve to a strict per-table shape that
  // doesn't accept `Record<string, unknown>`. The cast is contained here
  // because the field allowlist has already validated the payload.
  const tableQuery = supabase.from(descriptor.table) as unknown as {
    update: (payload: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string,
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
  const { error } = await tableQuery
    .update(sanitized)
    .eq(descriptor.idColumn, input.id);

  if (error) {
    throw new ReferenceDataError(
      "update_failed",
      "Could not update reference row.",
    );
  }

  await recordAdminAction({
    action: descriptor.actionKey,
    actorAppUserId: input.actorAppUserId,
    afterState: snapshot(sanitized) as Record<string, never>,
    beforeState: snapshot(beforeSnapshot) as Record<string, never>,
    targetId: input.id,
    targetType: descriptor.table,
  });

  for (const path of descriptor.revalidatePaths) {
    revalidatePath(path);
  }
  revalidatePath(`/internal/reference-data/${input.family}`);
}

function pickBeforeSnapshot(
  row: Awaited<ReturnType<typeof loadReferenceFamilyRow>>,
  keys: readonly string[],
): Record<string, unknown> {
  if (!row) {
    return {};
  }
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    switch (key) {
      case "display_name":
      case "display_label":
        result[key] = row.displayName;
        break;
      case "display_description":
        result[key] = row.displayDescription;
        break;
      case "helper_text":
        result[key] = row.helperText;
        break;
      case "sort_order":
        result[key] = row.sortOrder;
        break;
      case "is_active":
        result[key] = row.isActive;
        break;
    }
  }
  return result;
}
