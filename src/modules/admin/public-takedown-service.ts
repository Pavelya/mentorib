import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";
import {
  ModerationCaseError,
  openCase,
} from "@/modules/admin/moderation-case-service";
import { deindexPublicTutorProfile } from "@/modules/tutors/admin-listing-service";
import type { TutorPublicListingStatus } from "@/modules/tutors/constants";

type TutorProfileRow = {
  app_user_id: string;
  id: string;
  public_listing_status: TutorPublicListingStatus;
  public_slug: string | null;
};

export type OpenPublicContentTakedownCaseInput = {
  actorAppUserId: string;
  tutorProfileId: string;
  reason: string;
};

// Admin-initiated opener for a `public_content_takedown` case. The
// reporter slot is intentionally left empty — this is an admin-initiated
// administrative action, not a user report. The free-text reason is
// captured in `moderation_cases.internal_summary` (admin-only, per §15)
// and is never surfaced to the tutor or any other user.
export async function openPublicContentTakedownCase(
  input: OpenPublicContentTakedownCaseInput,
): Promise<{ caseId: string }> {
  const trimmedReason = input.reason.trim();
  if (!trimmedReason) {
    throw new ModerationCaseError(
      "reason_required",
      "Share why you're requesting a takedown.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: profile, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, id, public_listing_status, public_slug")
    .eq("id", input.tutorProfileId)
    .maybeSingle<TutorProfileRow>();

  if (error) {
    throw new ModerationCaseError(
      "tutor_profile_lookup_failed",
      "We couldn't read that tutor profile right now.",
    );
  }
  if (!profile) {
    throw new ModerationCaseError(
      "tutor_profile_not_found",
      "That tutor profile no longer exists.",
    );
  }

  const opened = await openCase({
    actorAppUserId: input.actorAppUserId,
    caseKind: "public_content_takedown",
    subjectId: profile.id,
    subjectKind: "tutor_profile",
  });

  // Capture the reason in `internal_summary` as the canonical admin-only
  // narrative for this case. The case-detail Panel renders it inside
  // the "Case summary" Panel — never inside a user-facing payload.
  const { error: summaryError } = await supabase
    .from("moderation_cases")
    .update({ internal_summary: trimmedReason })
    .eq("id", opened.caseId);
  if (summaryError) {
    throw new ModerationCaseError(
      "case_summary_failed",
      "Couldn't record the takedown reason on the new case.",
    );
  }

  return opened;
}

// Effect path: applied when an admin resolves a
// `public_content_takedown` case with `resolution_kind = 'uphold'`.
// Flips `public_listing_status` to `delisted`, fires the tutor-facing
// listing notification, removes the public profile from search, and
// revalidates the public surfaces that read off `listed`-eligible rows.
export async function applyPublicTakedownEffects(input: {
  actorAppUserId: string;
  tutorProfileId: string;
  reason: string | null;
}): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: profile, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, id, public_listing_status, public_slug")
    .eq("id", input.tutorProfileId)
    .maybeSingle<TutorProfileRow>();

  if (error) {
    throw new ModerationCaseError(
      "tutor_profile_lookup_failed",
      "We couldn't read that tutor profile right now.",
    );
  }
  if (!profile) {
    throw new ModerationCaseError(
      "tutor_profile_not_found",
      "That tutor profile no longer exists.",
    );
  }

  if (profile.public_listing_status === "delisted") {
    // Idempotent: takedown already applied; still ensure side effects ran.
    await deindexPublicTutorProfile({
      publicListingStatus: "delisted",
      publicSlug: profile.public_slug,
      reason: "admin_takedown",
      tutorAppUserId: profile.app_user_id,
      tutorProfileId: profile.id,
    });
    return;
  }

  const previousStatus = profile.public_listing_status;
  const { error: updateError } = await supabase
    .from("tutor_profiles")
    .update({ public_listing_status: "delisted" })
    .eq("id", profile.id);

  if (updateError) {
    throw new ModerationCaseError(
      "listing_update_failed",
      "Could not flip the tutor's listing status to delisted.",
    );
  }

  try {
    await recordAdminAction({
      action: "tutor_listing.public_takedown",
      actorAppUserId: input.actorAppUserId,
      afterState: { publicListingStatus: "delisted" },
      beforeState: { publicListingStatus: previousStatus },
      reason: input.reason ?? null,
      targetId: profile.id,
      targetType: "tutor_profile",
    });
  } catch (auditError) {
    await supabase
      .from("tutor_profiles")
      .update({ public_listing_status: previousStatus })
      .eq("id", profile.id);
    throw auditError;
  }

  await deindexPublicTutorProfile({
    publicListingStatus: "delisted",
    publicSlug: profile.public_slug,
    reason: "admin_takedown",
    tutorAppUserId: profile.app_user_id,
    tutorProfileId: profile.id,
  });
}
