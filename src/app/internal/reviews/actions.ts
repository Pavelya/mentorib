"use server";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  ReviewModerationError,
  isReviewModerationStatus,
  setReviewModerationStatus,
} from "@/modules/admin/review-moderation-service";

import type { ReviewModerationActionState } from "./action-types";

export async function runReviewModerationAction(
  _previous: ReviewModerationActionState,
  formData: FormData,
): Promise<ReviewModerationActionState> {
  const reviewId = readString(formData, "review_id");
  const status = readString(formData, "status");
  const moderationNote = readString(formData, "moderation_note");
  const reason = readString(formData, "reason") || null;

  if (!reviewId) {
    return {
      code: "missing_review",
      message: "Missing review reference.",
      reviewId: null,
      successMessage: null,
    };
  }

  if (!isReviewModerationStatus(status)) {
    return {
      code: "invalid_status",
      message: "Pick whether to hide or reject this review.",
      reviewId,
      successMessage: null,
    };
  }

  const admin = await requireInternalAdminAccount();

  try {
    await setReviewModerationStatus({
      actorAppUserId: admin.id,
      moderationNote,
      reason,
      reviewId,
      status,
    });
  } catch (error) {
    if (error instanceof ReviewModerationError) {
      return {
        code: error.code,
        message: error.message,
        reviewId,
        successMessage: null,
      };
    }
    return {
      code: "unexpected",
      message: "We couldn't update that review right now.",
      reviewId,
      successMessage: null,
    };
  }

  return {
    code: "ok",
    message: null,
    reviewId,
    successMessage: status === "hidden" ? "Review hidden." : "Review rejected.",
  };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
