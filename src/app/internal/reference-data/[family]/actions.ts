"use server";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  REFERENCE_FAMILIES,
  isReferenceFamilySlug,
  type ReferenceFamilySlug,
} from "@/modules/reference/admin/families";
import {
  ReferenceDataError,
  updateReferenceDataRow,
} from "@/modules/reference/admin/service";

import type { ReferenceEditActionState } from "./action-types";

export async function runReferenceEditAction(
  _previous: ReferenceEditActionState,
  formData: FormData,
): Promise<ReferenceEditActionState> {
  const familyRaw = readString(formData, "family");
  const id = readString(formData, "id");

  if (!isReferenceFamilySlug(familyRaw)) {
    return {
      code: "invalid_family",
      family: familyRaw,
      id,
      message: "Unknown reference family.",
      successMessage: null,
    };
  }
  if (!id) {
    return {
      code: "missing_id",
      family: familyRaw,
      id: null,
      message: "Missing row identifier.",
      successMessage: null,
    };
  }

  const admin = await requireInternalAdminAccount();
  const changes = readChanges(familyRaw, formData);

  try {
    await updateReferenceDataRow({
      actorAppUserId: admin.id,
      changes,
      family: familyRaw,
      id,
    });
  } catch (error) {
    if (error instanceof ReferenceDataError) {
      return {
        code: error.code,
        family: familyRaw,
        id,
        message: error.message,
        successMessage: null,
      };
    }
    return {
      code: "unexpected",
      family: familyRaw,
      id,
      message: "We couldn't save those changes.",
      successMessage: null,
    };
  }

  return {
    code: "ok",
    family: familyRaw,
    id,
    message: null,
    successMessage: "Reference row updated.",
  };
}

function readString(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function readChanges(
  family: ReferenceFamilySlug,
  formData: FormData,
): Record<string, unknown> {
  const descriptor = REFERENCE_FAMILIES[family];
  const changes: Record<string, unknown> = {};

  for (const field of descriptor.editableFields) {
    const raw = formData.get(field);
    if (raw === null) {
      // For booleans, missing checkbox means false; everything else: skip
      if (field === "is_active") {
        changes[field] = false;
      }
      continue;
    }
    if (field === "is_active") {
      changes[field] = raw === "on" || raw === "true";
    } else if (field === "sort_order") {
      const parsed = Number.parseInt(typeof raw === "string" ? raw : "", 10);
      if (Number.isFinite(parsed)) {
        changes[field] = parsed;
      }
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (field === "display_description" || field === "helper_text") {
        changes[field] = trimmed.length === 0 ? null : trimmed;
      } else if (trimmed.length > 0) {
        changes[field] = trimmed;
      }
    }
  }

  return changes;
}
