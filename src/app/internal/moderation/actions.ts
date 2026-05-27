"use server";

import { revalidatePath } from "next/cache";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { ModerationCaseError } from "@/modules/admin/moderation-case-service";
import { openPublicContentTakedownCase } from "@/modules/admin/public-takedown-service";

export type OpenTakedownActionState = {
  code: string | null;
  message: string | null;
  successCaseId: string | null;
};

export const initialOpenTakedownActionState: OpenTakedownActionState = {
  code: null,
  message: null,
  successCaseId: null,
};

export async function openPublicTakedownCaseAction(
  _previous: OpenTakedownActionState,
  formData: FormData,
): Promise<OpenTakedownActionState> {
  const tutorProfileId = readString(formData, "tutor_profile_id");
  const reason = readString(formData, "reason");

  if (!tutorProfileId.trim()) {
    return {
      code: "missing_tutor",
      message: "Paste the tutor profile id to open a takedown case.",
      successCaseId: null,
    };
  }

  let admin;
  try {
    admin = await requireInternalAdminAccount();
  } catch (error) {
    throw error;
  }

  try {
    const opened = await openPublicContentTakedownCase({
      actorAppUserId: admin.id,
      reason,
      tutorProfileId: tutorProfileId.trim(),
    });
    revalidatePath("/internal/moderation");
    return {
      code: "ok",
      message: null,
      successCaseId: opened.caseId,
    };
  } catch (error) {
    if (error instanceof ModerationCaseError) {
      return {
        code: error.code,
        message: error.message,
        successCaseId: null,
      };
    }
    return {
      code: "unexpected",
      message: "We couldn't open the takedown case right now.",
      successCaseId: null,
    };
  }
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
