import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createNotification, NOTIFICATION_OBJECT_TYPES } from "@/modules/notifications/service";
import { scheduleNotificationEmailDelivery } from "@/modules/notifications/email-delivery";
import { logEmailEvent } from "@/lib/email/logging";
import type { TutorApplicationStatus } from "@/modules/tutors/constants";
import {
  getAvailableReviewActions,
  isAllowedReviewTransition,
  resolveNextApplicationStatus,
  resolveReviewStatusForAction,
  type TutorApplicationReviewActionKey,
} from "@/modules/tutors/application-review";

export class TutorApplicationReviewError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type TutorApplicationReviewCommandInput = {
  applicationId: string;
  internalNote?: string | null;
  reviewerAppUserId: string;
  reviewerNote?: string | null;
};

type TutorProfileLookupRow = {
  app_user_id: string;
  application_status: TutorApplicationStatus;
  id: string;
};

const NOTE_MAX_LENGTH = 2000;

export async function claimTutorApplicationForReview(
  input: TutorApplicationReviewCommandInput,
) {
  return runReviewTransition("claim", input);
}

export async function requestTutorApplicationChanges(
  input: TutorApplicationReviewCommandInput,
) {
  return runReviewTransition("request_changes", input);
}

export async function approveTutorApplication(
  input: TutorApplicationReviewCommandInput,
) {
  return runReviewTransition("approve", input);
}

export async function rejectTutorApplication(
  input: TutorApplicationReviewCommandInput,
) {
  return runReviewTransition("reject", input);
}

async function runReviewTransition(
  action: TutorApplicationReviewActionKey,
  input: TutorApplicationReviewCommandInput,
) {
  const reviewerNote = sanitizeNote(input.reviewerNote);
  const internalNote = sanitizeNote(input.internalNote);

  if (
    (action === "request_changes" || action === "reject") &&
    (!reviewerNote || reviewerNote.length === 0)
  ) {
    throw new TutorApplicationReviewError(
      "reviewer_note_required",
      action === "request_changes"
        ? "Share what the applicant needs to update before resubmitting."
        : "Share the reason this application was not approved.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const profile = await loadProfileById(input.applicationId);

  if (!profile) {
    throw new TutorApplicationReviewError(
      "application_not_found",
      "We couldn't find that tutor application.",
    );
  }

  if (!isAllowedReviewTransition(action, profile.application_status)) {
    throw new TutorApplicationReviewError(
      "conflict",
      "This action isn't available for the current application state.",
    );
  }

  const nextStatus = resolveNextApplicationStatus(action, profile.application_status);
  if (!nextStatus) {
    throw new TutorApplicationReviewError(
      "conflict",
      "This action isn't available for the current application state.",
    );
  }

  const { error: profileUpdateError } = await supabase
    .from("tutor_profiles")
    .update({ application_status: nextStatus })
    .eq("id", profile.id)
    .eq("application_status", profile.application_status);

  if (profileUpdateError) {
    throw new TutorApplicationReviewError(
      "application_update_failed",
      "We couldn't update the application right now. Please try again.",
    );
  }

  const { error: reviewInsertError } = await supabase
    .from("tutor_application_reviews")
    .insert({
      internal_note: internalNote,
      review_status: resolveReviewStatusForAction(action),
      reviewer_app_user_id: input.reviewerAppUserId,
      reviewer_note: reviewerNote,
      tutor_profile_id: profile.id,
    });

  if (reviewInsertError) {
    // Roll back the status update so the audit row + profile state stay consistent.
    await supabase
      .from("tutor_profiles")
      .update({ application_status: profile.application_status })
      .eq("id", profile.id);
    throw new TutorApplicationReviewError(
      "review_insert_failed",
      "We couldn't record the review decision. Please try again.",
    );
  }

  if (action === "approve") {
    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role_status: "active", revoked_at: null })
      .eq("app_user_id", profile.app_user_id)
      .eq("role", "tutor");

    if (roleError) {
      // Roll back both: status and the audit row.
      await supabase
        .from("tutor_profiles")
        .update({ application_status: profile.application_status })
        .eq("id", profile.id);
      await supabase
        .from("tutor_application_reviews")
        .delete()
        .eq("tutor_profile_id", profile.id)
        .eq("review_status", "approved")
        .eq("reviewer_app_user_id", input.reviewerAppUserId);
      throw new TutorApplicationReviewError(
        "role_activation_failed",
        "We couldn't activate the tutor role. The application status was rolled back.",
      );
    }
  }

  await dispatchApplicantNotification({
    action,
    appUserId: profile.app_user_id,
    reviewerNote,
    tutorProfileId: profile.id,
  });

  return {
    applicationStatus: nextStatus,
    availableActions: getAvailableReviewActions(nextStatus),
  };
}

async function loadProfileById(
  applicationId: string,
): Promise<TutorProfileLookupRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, application_status, id")
    .eq("id", applicationId)
    .maybeSingle<TutorProfileLookupRow>();

  if (error) {
    throw new TutorApplicationReviewError(
      "application_lookup_failed",
      "We couldn't read the application.",
    );
  }

  return data ?? null;
}

function sanitizeNote(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, NOTE_MAX_LENGTH);
}

type ApplicantNotificationInput = {
  action: TutorApplicationReviewActionKey;
  appUserId: string;
  reviewerNote: string | null;
  tutorProfileId: string;
};

async function dispatchApplicantNotification(input: ApplicantNotificationInput) {
  if (input.action === "claim") {
    // Claiming an application for review is internal-only and never surfaced
    // to the applicant.
    return;
  }

  const { title, body } = buildApplicantNotificationCopy(input);

  const notification = await createNotification({
    appUserId: input.appUserId,
    bodySummary: body,
    notificationType: "tutor_application_reviewed",
    objectId: input.tutorProfileId,
    objectType: NOTIFICATION_OBJECT_TYPES.tutorApplication,
    title,
  });

  if (!notification) {
    return;
  }

  try {
    await scheduleNotificationEmailDelivery({ notification });
  } catch (error) {
    logEmailEvent("error", "notification_email_schedule_failed", {
      error_message:
        error instanceof Error ? error.message : "Unknown scheduling error",
      notification_id: notification.id,
      notification_type: notification.notification_type,
    });
  }
}

function buildApplicantNotificationCopy(
  input: ApplicantNotificationInput,
): { title: string; body: string } {
  switch (input.action) {
    case "approve":
      return {
        body:
          "Mentor IB approved your tutor application. Finish your readiness steps to go live in public discovery.",
        title: "Application approved",
      };
    case "request_changes": {
      const reviewerNote = input.reviewerNote ?? "";
      const trimmedNote = reviewerNote.trim();
      const noteFragment = trimmedNote ? ` Reviewer note: ${trimmedNote}` : "";
      return {
        body: `Mentor IB requested a few updates before your application can be approved.${noteFragment}`.slice(
          0,
          240,
        ),
        title: "Updates requested",
      };
    }
    case "reject": {
      const reviewerNote = input.reviewerNote ?? "";
      const trimmedNote = reviewerNote.trim();
      const noteFragment = trimmedNote ? ` Reviewer note: ${trimmedNote}` : "";
      return {
        body: `Mentor IB reviewed your application and couldn't approve it at this time.${noteFragment}`.slice(
          0,
          240,
        ),
        title: "Application outcome",
      };
    }
    case "claim":
      return { body: "", title: "" };
  }
}

export type ApplicantNotificationPayload = ReturnType<
  typeof buildApplicantNotificationCopy
>;

// Exported for unit tests — kept here to keep the boundary explicit.
export function _buildApplicantNotificationCopyForTesting(
  input: ApplicantNotificationInput,
) {
  return buildApplicantNotificationCopy(input);
}
