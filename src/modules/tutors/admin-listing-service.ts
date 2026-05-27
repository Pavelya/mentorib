import "server-only";

import { revalidatePath } from "next/cache";

import { logEvent } from "@/lib/observability/logger";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";
import { createTutorListingStatusChangedNotification } from "@/modules/notifications/lifecycle";
import { syncPublicTutorRecord } from "@/modules/search/public-tutor-indexer";
import type { TutorPublicListingStatus } from "@/modules/tutors/constants";

// Admin-side tutor-listing actions for `P2-OPS-002`. These are NOT a
// replacement for the tutor-owned `setTutorListingPublication` action in
// `tutor-profile-editor-service.ts` — the tutor-owned state machine
// deliberately rejects admin states (`paused`/`delisted`). The admin
// path lives here so the two policies stay separated.

export class AdminListingError extends Error {
  code:
    | "tutor_profile_not_found"
    | "tutor_profile_lookup_failed"
    | "conflict"
    | "reason_required"
    | "listing_update_failed";

  constructor(
    code:
      | "tutor_profile_not_found"
      | "tutor_profile_lookup_failed"
      | "conflict"
      | "reason_required"
      | "listing_update_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

type TutorProfileRow = {
  app_user_id: string;
  id: string;
  public_listing_status: TutorPublicListingStatus;
  public_slug: string | null;
};

type AdminListingActionInput = {
  actorAppUserId: string;
  tutorProfileId: string;
  reason: string;
};

// Shared "deindex public tutor profile" sequence: remove from search,
// revalidate the public tutor surfaces, and emit a tutor-facing
// notification. Consumed both by this module's admin pause/delist flows
// and by `public-takedown-service.applyPublicTakedownEffects` so the
// two paths do not duplicate.
export async function deindexPublicTutorProfile(input: {
  tutorAppUserId: string;
  tutorProfileId: string;
  publicSlug: string | null;
  publicListingStatus: "paused" | "delisted";
  reason: "admin_hold" | "admin_takedown";
}): Promise<void> {
  try {
    await createTutorListingStatusChangedNotification({
      appUserId: input.tutorAppUserId,
      publicListingStatus: input.publicListingStatus,
      reason: input.reason,
      tutorProfileId: input.tutorProfileId,
    });
  } catch (notifyError) {
    logEvent("jobs", "warn", "admin_listing_notification_failed", {
      error_message:
        notifyError instanceof Error
          ? notifyError.message
          : "Unknown notification error",
      tutor_profile_id: input.tutorProfileId,
    });
  }

  try {
    await syncPublicTutorRecord(input.tutorProfileId);
  } catch (indexError) {
    logEvent("jobs", "warn", "admin_listing_search_index_sync_failed", {
      error_message:
        indexError instanceof Error
          ? indexError.message
          : "Unknown index error",
      tutor_profile_id: input.tutorProfileId,
    });
  }

  if (input.publicSlug) {
    revalidatePath(`/tutors/${input.publicSlug}`);
  }
  revalidatePath("/sitemap.xml");
  revalidatePath("/tutors");
}

// `listed` → `paused`. Admin pause is reversible by an admin lift-hold;
// the tutor cannot resume publication while a hold is active (the
// tutor-owned editor rejects `paused`/`delisted` in `tutor-profile-editor-service.ts`).
export async function adminPauseTutorListing(
  input: AdminListingActionInput,
): Promise<void> {
  const reason = ensureReason(input.reason);
  const profile = await loadTutorProfileForAdmin(input.tutorProfileId);

  if (profile.public_listing_status !== "listed") {
    throw new AdminListingError(
      "conflict",
      "Only a listed tutor can be paused. Choose a different action.",
    );
  }

  await applyAdminListingTransition({
    actorAppUserId: input.actorAppUserId,
    actionKey: "tutor_listing.admin_pause",
    nextStatus: "paused",
    notifyReason: "admin_hold",
    notifyStatus: "paused",
    profile,
    reason,
  });
}

// Any non-terminal state → `delisted`. Used when the tutor must come off
// the public surface entirely (vs. a softer pause). Coordinates with
// sitemap and search exactly like the `P2-OPS-001` public-takedown path.
export async function adminDelistTutorListing(
  input: AdminListingActionInput,
): Promise<void> {
  const reason = ensureReason(input.reason);
  const profile = await loadTutorProfileForAdmin(input.tutorProfileId);

  if (profile.public_listing_status === "delisted") {
    throw new AdminListingError(
      "conflict",
      "This tutor is already delisted.",
    );
  }

  await applyAdminListingTransition({
    actorAppUserId: input.actorAppUserId,
    actionKey: "tutor_listing.admin_delist",
    nextStatus: "delisted",
    notifyReason: "admin_hold",
    notifyStatus: "delisted",
    profile,
    reason,
  });
}

// `paused` or `delisted` → `not_listed`. The tutor must re-publish
// themselves from `/tutor/profile`; admin never auto-promotes to
// `listed`.
export async function adminLiftTutorListingHold(
  input: AdminListingActionInput,
): Promise<void> {
  const reason = ensureReason(input.reason);
  const profile = await loadTutorProfileForAdmin(input.tutorProfileId);

  if (
    profile.public_listing_status !== "paused" &&
    profile.public_listing_status !== "delisted"
  ) {
    throw new AdminListingError(
      "conflict",
      "Only a paused or delisted listing can be lifted.",
    );
  }

  await applyAdminListingTransition({
    actorAppUserId: input.actorAppUserId,
    actionKey: "tutor_listing.admin_lift_hold",
    nextStatus: "not_listed",
    notifyReason: "admin_hold",
    notifyStatus: "not_listed",
    profile,
    reason,
  });
}

async function applyAdminListingTransition(input: {
  actorAppUserId: string;
  actionKey:
    | "tutor_listing.admin_pause"
    | "tutor_listing.admin_delist"
    | "tutor_listing.admin_lift_hold";
  nextStatus: TutorPublicListingStatus;
  notifyReason: "admin_hold";
  notifyStatus: "paused" | "delisted" | "not_listed";
  profile: TutorProfileRow;
  reason: string;
}): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const previousStatus = input.profile.public_listing_status;

  const { error: updateError } = await supabase
    .from("tutor_profiles")
    .update({ public_listing_status: input.nextStatus })
    .eq("id", input.profile.id)
    .eq("public_listing_status", previousStatus);

  if (updateError) {
    throw new AdminListingError(
      "listing_update_failed",
      "Could not update the tutor's listing status.",
    );
  }

  try {
    await recordAdminAction({
      action: input.actionKey,
      actorAppUserId: input.actorAppUserId,
      afterState: { publicListingStatus: input.nextStatus },
      beforeState: { publicListingStatus: previousStatus },
      reason: input.reason,
      targetId: input.profile.id,
      targetType: "tutor_profile",
    });
  } catch (auditError) {
    await supabase
      .from("tutor_profiles")
      .update({ public_listing_status: previousStatus })
      .eq("id", input.profile.id);
    throw auditError;
  }

  if (input.nextStatus === "paused" || input.nextStatus === "delisted") {
    await deindexPublicTutorProfile({
      publicListingStatus: input.nextStatus,
      publicSlug: input.profile.public_slug,
      reason: "admin_hold",
      tutorAppUserId: input.profile.app_user_id,
      tutorProfileId: input.profile.id,
    });
    return;
  }

  // Lift-hold path: still notify + revalidate so the cached public
  // surfaces drop the prior hold-state row. The tutor must re-publish
  // from their own surface to be listed again.
  try {
    await createTutorListingStatusChangedNotification({
      appUserId: input.profile.app_user_id,
      publicListingStatus: "not_listed",
      reason: "admin_hold",
      tutorProfileId: input.profile.id,
    });
  } catch (notifyError) {
    logEvent("jobs", "warn", "admin_listing_notification_failed", {
      error_message:
        notifyError instanceof Error
          ? notifyError.message
          : "Unknown notification error",
      tutor_profile_id: input.profile.id,
    });
  }

  try {
    await syncPublicTutorRecord(input.profile.id);
  } catch (indexError) {
    logEvent("jobs", "warn", "admin_listing_search_index_sync_failed", {
      error_message:
        indexError instanceof Error
          ? indexError.message
          : "Unknown index error",
      tutor_profile_id: input.profile.id,
    });
  }

  if (input.profile.public_slug) {
    revalidatePath(`/tutors/${input.profile.public_slug}`);
  }
  revalidatePath("/sitemap.xml");
  revalidatePath("/tutors");
}

async function loadTutorProfileForAdmin(
  tutorProfileId: string,
): Promise<TutorProfileRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, id, public_listing_status, public_slug")
    .eq("id", tutorProfileId)
    .maybeSingle<TutorProfileRow>();

  if (error) {
    throw new AdminListingError(
      "tutor_profile_lookup_failed",
      "We couldn't read that tutor profile right now.",
    );
  }
  if (!data) {
    throw new AdminListingError(
      "tutor_profile_not_found",
      "That tutor profile no longer exists.",
    );
  }
  return data;
}

function ensureReason(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new AdminListingError(
      "reason_required",
      "Share why you're taking this action.",
    );
  }
  return trimmed;
}
