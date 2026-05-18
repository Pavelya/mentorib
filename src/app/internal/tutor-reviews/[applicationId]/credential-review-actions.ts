"use server";

import { revalidatePath } from "next/cache";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { logJobsEvent } from "@/lib/jobs/logging";
import {
  TUTOR_CREDENTIAL_REVIEW_ACTIONS,
  TutorApplicationReviewError,
  setTutorCredentialReviewStatus,
  type TutorCredentialReviewActionKey,
} from "@/modules/tutors/application-review-service";

export type TutorCredentialReviewActionState = {
  code: string;
  credentialId: string | null;
  intent: TutorCredentialReviewActionKey;
  message: string | null;
  successMessage: string | null;
};

export const initialCredentialReviewActionState: TutorCredentialReviewActionState =
  {
    code: "idle",
    credentialId: null,
    intent: "approve",
    message: null,
    successMessage: null,
  };

export async function runTutorCredentialReviewAction(
  _previous: TutorCredentialReviewActionState,
  formData: FormData,
): Promise<TutorCredentialReviewActionState> {
  const intent = readIntent(formData);
  const credentialId = readString(formData, "credential_id");
  const internalNote = readString(formData, "internal_note");

  if (!credentialId) {
    return {
      code: "invalid_request",
      credentialId: null,
      intent,
      message: "Missing credential reference.",
      successMessage: null,
    };
  }

  let admin;
  try {
    admin = await requireInternalAdminAccount();
  } catch (error) {
    if (isNotFoundError(error)) {
      throw error;
    }
    return {
      code: "auth_failed",
      credentialId,
      intent,
      message: "We couldn't verify your access. Please reload the page.",
      successMessage: null,
    };
  }

  try {
    await setTutorCredentialReviewStatus({
      action: intent,
      credentialId,
      internalNote,
      reviewerAppUserId: admin.id,
    });
  } catch (error) {
    if (error instanceof TutorApplicationReviewError) {
      return {
        code: error.code,
        credentialId,
        intent,
        message: error.message,
        successMessage: null,
      };
    }
    logJobsEvent("error", "tutor_credential_review_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      intent,
    });
    return {
      code: "unexpected",
      credentialId,
      intent,
      message: "We couldn't apply that decision right now. Please try again.",
      successMessage: null,
    };
  }

  revalidatePath("/internal/tutor-reviews");
  revalidatePath("/tutor/profile/credentials");

  return {
    code: "ok",
    credentialId,
    intent,
    message: null,
    successMessage: buildSuccessMessage(intent),
  };
}

function buildSuccessMessage(intent: TutorCredentialReviewActionKey): string {
  switch (intent) {
    case "approve":
      return "Credential approved.";
    case "reject":
      return "Credential rejected. The tutor has been notified.";
    case "request_update":
      return "Credential returned for an update.";
    case "mark_expired":
      return "Credential marked expired. The tutor has been notified.";
  }
}

function readIntent(formData: FormData): TutorCredentialReviewActionKey {
  const raw = formData.get("intent");
  if (
    typeof raw === "string" &&
    (TUTOR_CREDENTIAL_REVIEW_ACTIONS as readonly string[]).includes(raw)
  ) {
    return raw as TutorCredentialReviewActionKey;
  }
  return "approve";
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_NOT_FOUND");
}
