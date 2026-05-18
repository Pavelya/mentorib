"use server";

import { revalidatePath } from "next/cache";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { logJobsEvent } from "@/lib/jobs/logging";
import {
  TutorApplicationReviewError,
  approveTutorApplication,
  claimTutorApplicationForReview,
  rejectTutorApplication,
  requestTutorApplicationChanges,
} from "@/modules/tutors/application-review-service";

import {
  REVIEW_INTENTS,
  type ReviewIntent,
  type TutorApplicationReviewActionState,
} from "./action-types";

const APPLY_PATH = "/tutor/apply";

export async function runTutorApplicationReviewAction(
  _previous: TutorApplicationReviewActionState,
  formData: FormData,
): Promise<TutorApplicationReviewActionState> {
  const intent = readIntent(formData);
  const applicationId = readString(formData, "application_id");
  const reviewerNote = readString(formData, "reviewer_note");
  const internalNote = readString(formData, "internal_note");

  if (!applicationId) {
    return {
      code: "invalid_request",
      intent,
      message: "Missing application reference.",
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
      intent,
      message: "We couldn't verify your access. Please reload the page.",
      successMessage: null,
    };
  }

  const commandInput = {
    applicationId,
    internalNote,
    reviewerAppUserId: admin.id,
    reviewerNote,
  };

  try {
    if (intent === "claim") {
      await claimTutorApplicationForReview(commandInput);
    } else if (intent === "request_changes") {
      await requestTutorApplicationChanges(commandInput);
    } else if (intent === "approve") {
      await approveTutorApplication(commandInput);
    } else {
      await rejectTutorApplication(commandInput);
    }
  } catch (error) {
    if (error instanceof TutorApplicationReviewError) {
      return {
        code: error.code,
        intent,
        message: error.message,
        successMessage: null,
      };
    }
    logJobsEvent("error", "tutor_application_review_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      intent,
    });
    return {
      code: "unexpected",
      intent,
      message: "We couldn't apply that decision right now. Please try again.",
      successMessage: null,
    };
  }

  revalidatePath(`/internal/tutor-reviews/${applicationId}`);
  revalidatePath("/internal/tutor-reviews");
  revalidatePath(APPLY_PATH);

  return {
    code: "ok",
    intent,
    message: null,
    successMessage: buildSuccessMessage(intent),
  };
}

function buildSuccessMessage(intent: ReviewIntent): string {
  switch (intent) {
    case "claim":
      return "Application claimed for review.";
    case "request_changes":
      return "Changes requested. The applicant has been notified.";
    case "approve":
      return "Application approved. The tutor role is now active.";
    case "reject":
      return "Application rejected. The applicant has been notified.";
  }
}

function readIntent(formData: FormData): ReviewIntent {
  const raw = formData.get("intent");
  if (typeof raw === "string" && REVIEW_INTENTS.includes(raw as ReviewIntent)) {
    return raw as ReviewIntent;
  }
  return "claim";
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
