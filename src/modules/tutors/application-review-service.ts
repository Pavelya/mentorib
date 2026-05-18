import "server-only";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createNotification, NOTIFICATION_OBJECT_TYPES } from "@/modules/notifications/service";
import { scheduleNotificationEmailDelivery } from "@/modules/notifications/email-delivery";
import { logEmailEvent } from "@/lib/email/logging";
import { syncPublicTutorRecord } from "@/modules/search/public-tutor-indexer";
import type {
  TutorApplicationStatus,
  TutorCredentialReviewStatus,
} from "@/modules/tutors/constants";
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

  // Reflect the new application status in the public search index. Approve
  // makes the profile eligible (subject to listing status); the other
  // transitions either leave or never enter the eligibility triple.
  if (action !== "claim") {
    await syncPublicTutorRecord(profile.id);
  }

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

// ---------------------------------------------------------------------------
// Credential review (P2-MEDIA-001-09)
// ---------------------------------------------------------------------------

export const TUTOR_CREDENTIAL_REVIEW_ACTIONS = [
  "approve",
  "reject",
  "request_update",
  "mark_expired",
] as const;

export type TutorCredentialReviewActionKey =
  (typeof TUTOR_CREDENTIAL_REVIEW_ACTIONS)[number];

// J-TUT-016 canonical rejection copy.
export const TUTOR_CREDENTIAL_REJECTION_COPY =
  "This credential needs an update before it can count as approved proof.";

type TutorCredentialReviewCommandInput = {
  credentialId: string;
  action: TutorCredentialReviewActionKey;
  internalNote?: string | null;
  reviewerAppUserId: string;
};

type TutorCredentialLookupRow = {
  id: string;
  tutor_profile_id: string;
  review_status: TutorCredentialReviewStatus;
  reviewed_at: string | null;
};

type TutorCredentialOwnerLookupRow = {
  id: string;
  app_user_id: string;
  application_status: TutorApplicationStatus;
};

const CREDENTIAL_TERMINAL_STATUSES = new Set<TutorCredentialReviewStatus>([
  "approved",
  "rejected",
  "expired",
]);

const PUBLIC_PROFILE_PATH = "/tutors/[slug]";
const TUTOR_CREDENTIALS_PATH = "/tutor/profile/credentials";
const TUTOR_PROFILE_PATH = "/tutor/profile";

export async function setTutorCredentialReviewStatus(
  input: TutorCredentialReviewCommandInput,
): Promise<{ reviewStatus: TutorCredentialReviewStatus }> {
  const internalNote = sanitizeNote(input.internalNote);
  const supabase = createSupabaseServiceRoleClient();

  const credential = await loadCredentialById(input.credentialId);
  if (!credential) {
    throw new TutorApplicationReviewError(
      "credential_not_found",
      "We couldn't find that credential.",
    );
  }

  const owner = await loadOwnerByProfileId(credential.tutor_profile_id);
  if (!owner) {
    throw new TutorApplicationReviewError(
      "credential_not_found",
      "We couldn't find that credential.",
    );
  }

  const nextReviewStatus = resolveCredentialReviewStatusForAction(input.action);
  const isTerminal = CREDENTIAL_TERMINAL_STATUSES.has(nextReviewStatus);

  const nowIso = new Date().toISOString();
  const { error: credentialUpdateError } = await supabase
    .from("tutor_credentials")
    .update({
      review_status: nextReviewStatus,
      // _reviewed_at_consistency_chk: reviewed_at is non-null iff the row is
      // in a terminal state (approved/rejected/expired); pending_review
      // resets to null.
      reviewed_at: isTerminal ? nowIso : null,
    })
    .eq("id", credential.id)
    .eq("review_status", credential.review_status);

  if (credentialUpdateError) {
    throw new TutorApplicationReviewError(
      "credential_update_failed",
      "We couldn't update the credential right now. Please try again.",
    );
  }

  const auditReviewerNote = resolveCredentialAuditReviewerNote(input.action);
  const auditReviewStatus = resolveCredentialAuditReviewStatus(input.action);

  const { error: auditInsertError } = await supabase
    .from("tutor_application_reviews")
    .insert({
      internal_note: buildCredentialAuditInternalNote({
        credentialId: credential.id,
        action: input.action,
        note: internalNote,
      }),
      review_status: auditReviewStatus,
      reviewer_app_user_id: input.reviewerAppUserId,
      reviewer_note: auditReviewerNote,
      tutor_profile_id: credential.tutor_profile_id,
    });

  if (auditInsertError) {
    // Roll back the credential transition so the audit row + credential
    // state stay consistent.
    await supabase
      .from("tutor_credentials")
      .update({
        review_status: credential.review_status,
        reviewed_at: credential.reviewed_at,
      })
      .eq("id", credential.id);
    throw new TutorApplicationReviewError(
      "credential_audit_insert_failed",
      "We couldn't record the credential decision. Please try again.",
    );
  }

  await dispatchCredentialReviewedNotification({
    action: input.action,
    appUserId: owner.app_user_id,
    credentialId: credential.id,
    tutorProfileId: credential.tutor_profile_id,
  });

  if (input.action === "approve") {
    // buildTrustProofs reads approved credentials; revalidate the public
    // tutor route + the tutor-facing surfaces so the new proof shows up.
    revalidatePath(PUBLIC_PROFILE_PATH, "page");
    // The indexer re-projects the search row from current credential state.
    await syncPublicTutorRecord(credential.tutor_profile_id);
  }

  revalidatePath(TUTOR_CREDENTIALS_PATH);
  revalidatePath(TUTOR_PROFILE_PATH);

  return { reviewStatus: nextReviewStatus };
}

function resolveCredentialReviewStatusForAction(
  action: TutorCredentialReviewActionKey,
): TutorCredentialReviewStatus {
  switch (action) {
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "request_update":
      return "pending_review";
    case "mark_expired":
      return "expired";
  }
}

function resolveCredentialAuditReviewStatus(
  action: TutorCredentialReviewActionKey,
): "approved" | "rejected" | "changes_requested" | "under_review" {
  switch (action) {
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "request_update":
      return "changes_requested";
    case "mark_expired":
      // `tutor_application_reviews_review_status_chk` does not include
      // `expired`; the credential's own row carries the canonical state and
      // the audit row labels the admin's act as `under_review` (the closest
      // non-terminal label that does not require a reviewer note).
      return "under_review";
  }
}

function resolveCredentialAuditReviewerNote(
  action: TutorCredentialReviewActionKey,
): string | null {
  // `tutor_application_reviews_reviewer_note_required_chk` requires
  // reviewer_note to be non-empty when review_status is `changes_requested`
  // or `rejected`. Use the canonical user-facing copy so the audit row stays
  // valid and the message is recoverable for the audit history surface.
  if (action === "reject") {
    return TUTOR_CREDENTIAL_REJECTION_COPY;
  }
  if (action === "request_update") {
    return "Credential review requested an update.";
  }
  return null;
}

function buildCredentialAuditInternalNote(input: {
  credentialId: string;
  action: TutorCredentialReviewActionKey;
  note: string | null;
}): string {
  const prefix = `[Credential ${input.credentialId} · ${input.action}]`;
  return input.note ? `${prefix} ${input.note}` : prefix;
}

async function loadCredentialById(
  credentialId: string,
): Promise<TutorCredentialLookupRow | null> {
  if (!isUuid(credentialId)) {
    return null;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_credentials")
    .select("id, tutor_profile_id, review_status, reviewed_at")
    .eq("id", credentialId)
    .maybeSingle<TutorCredentialLookupRow>();

  if (error) {
    throw new TutorApplicationReviewError(
      "credential_lookup_failed",
      "We couldn't read that credential.",
    );
  }

  return data ?? null;
}

async function loadOwnerByProfileId(
  tutorProfileId: string,
): Promise<TutorCredentialOwnerLookupRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("id, app_user_id, application_status")
    .eq("id", tutorProfileId)
    .maybeSingle<TutorCredentialOwnerLookupRow>();

  if (error) {
    throw new TutorApplicationReviewError(
      "credential_lookup_failed",
      "We couldn't read the credential owner.",
    );
  }

  return data ?? null;
}

type CredentialNotificationInput = {
  action: TutorCredentialReviewActionKey;
  appUserId: string;
  credentialId: string;
  tutorProfileId: string;
};

async function dispatchCredentialReviewedNotification(
  input: CredentialNotificationInput,
) {
  if (input.action === "request_update") {
    // Non-terminal transition (review_status = pending_review). The audit
    // history is the canonical record; we do not re-notify per credential
    // re-queue to avoid noise.
    return;
  }

  const { title, body } = buildCredentialNotificationCopy(input.action);
  if (!title || !body) {
    return;
  }

  const notification = await createNotification({
    appUserId: input.appUserId,
    bodySummary: body,
    notificationType: "tutor_credential_reviewed",
    objectId: input.credentialId,
    objectType: NOTIFICATION_OBJECT_TYPES.tutorProfile,
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

function buildCredentialNotificationCopy(
  action: TutorCredentialReviewActionKey,
): { title: string; body: string } {
  switch (action) {
    case "approve":
      return {
        body: "Mentor IB approved your credential. It now counts as approved proof on your public profile.",
        title: "Credential approved",
      };
    case "reject":
      return {
        body: TUTOR_CREDENTIAL_REJECTION_COPY,
        title: "Credential needs an update",
      };
    case "mark_expired":
      return {
        body: "Mentor IB marked your credential as expired. Replace it with a current version to restore approved proof.",
        title: "Credential expired",
      };
    case "request_update":
      return { body: "", title: "" };
  }
}

// Exported for unit tests — keeps the boundary explicit, matching the
// pattern used for application-review notification copy.
export function _buildCredentialNotificationCopyForTesting(
  action: TutorCredentialReviewActionKey,
) {
  return buildCredentialNotificationCopy(action);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
