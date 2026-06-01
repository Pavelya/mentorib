import "server-only";

import { revalidatePath } from "next/cache";
import type { Route } from "next";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";
import type { ReviewStatus } from "@/modules/reviews/constants";

// `P2-ADMIN-TRUST-001` review-moderation write path.
//
// An operator can hide or redact a published tutor review that contains
// inappropriate content. The decision flips `reviews.review_status` to
// `hidden` or `rejected`, requires a moderation note, writes an
// `admin_action_logs` row (`review.set_status`), and revalidates the
// tutor's public profile so the hidden review disappears. The
// `tutor_rating_snapshot` is recomputed automatically by the DB trigger
// on the `reviews` row change.

export class ReviewModerationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Only these two terminal moderation states are operator-settable. Returning a
// review to `published` is intentionally out of scope (no un-hide path this
// wave) per the task's hide/redact framing.
const MODERATABLE_STATUSES = ["hidden", "rejected"] as const;
export type ReviewModerationStatus = (typeof MODERATABLE_STATUSES)[number];

const NOTE_MAX_LENGTH = 2000;

export function isReviewModerationStatus(
  value: string,
): value is ReviewModerationStatus {
  return (MODERATABLE_STATUSES as readonly string[]).includes(value);
}

type ReviewModerationRow = {
  id: string;
  moderation_note: string | null;
  published_at: string | null;
  review_status: ReviewStatus;
  tutor_profile_id: string;
};

export type SetReviewModerationStatusInput = {
  reviewId: string;
  status: ReviewModerationStatus;
  moderationNote: string;
  actorAppUserId: string;
  reason?: string | null;
};

export async function setReviewModerationStatus(
  input: SetReviewModerationStatusInput,
): Promise<void> {
  if (!isReviewModerationStatus(input.status)) {
    throw new ReviewModerationError(
      "invalid_status",
      "Pick whether to hide or reject this review.",
    );
  }

  const moderationNote = sanitizeNote(input.moderationNote);
  if (!moderationNote) {
    throw new ReviewModerationError(
      "note_required",
      "Add a moderation note explaining this decision.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: existing, error: lookupError } = await supabase
    .from("reviews")
    .select("id, moderation_note, published_at, review_status, tutor_profile_id")
    .eq("id", input.reviewId)
    .maybeSingle<ReviewModerationRow>();

  if (lookupError) {
    throw new ReviewModerationError(
      "review_lookup_failed",
      "We couldn't read that review.",
    );
  }
  if (!existing) {
    throw new ReviewModerationError(
      "review_not_found",
      "We couldn't find that review.",
    );
  }

  // `reviews_published_at_consistency_chk` requires `published_at` to be null
  // whenever the status is not `published`, so clear it on every transition
  // into a moderated state.
  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      moderation_note: moderationNote,
      published_at: null,
      review_status: input.status,
    })
    .eq("id", existing.id);

  if (updateError) {
    throw new ReviewModerationError(
      "review_update_failed",
      "We couldn't update this review right now.",
    );
  }

  try {
    await recordAdminAction({
      action: "review.set_status",
      actorAppUserId: input.actorAppUserId,
      afterState: { reviewStatus: input.status },
      beforeState: { reviewStatus: existing.review_status },
      reason: input.reason ?? null,
      targetId: existing.id,
      targetType: "review",
    });
  } catch (auditError) {
    // Roll the review back so audit + content state stay consistent.
    await supabase
      .from("reviews")
      .update({
        moderation_note: existing.moderation_note,
        published_at: existing.published_at,
        review_status: existing.review_status,
      })
      .eq("id", existing.id);
    throw auditError;
  }

  await revalidateReviewSurfaces(existing.tutor_profile_id);
}

async function revalidateReviewSurfaces(tutorProfileId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("tutor_profiles")
    .select("app_user_id, public_slug")
    .eq("id", tutorProfileId)
    .maybeSingle<{ app_user_id: string | null; public_slug: string | null }>();

  if (data?.public_slug) {
    revalidatePath(`/tutors/${data.public_slug}`);
  }
  if (data?.app_user_id) {
    revalidatePath(`/internal/users/${data.app_user_id}` as Route);
  }
  revalidatePath("/internal/reviews");
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
