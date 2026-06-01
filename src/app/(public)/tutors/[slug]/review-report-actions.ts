"use server";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import {
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  ModerationCaseError,
  openReviewReport,
} from "@/modules/admin/moderation-case-service";

import type { ReportReviewActionState } from "./review-report-state";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Public "Report this review" entry on the tutor profile (P2-ADMIN-TRUST-001).
// Opens a `review` moderation case for the review's tutor profile, with the
// reported review id captured on the case so an operator can act on it in the
// `/internal/reviews` queue. The subject tutor is looked up server-side from
// the review row — the client only supplies the review id and a reason — so a
// caller can't forge the case subject.
export async function reportReviewAction(
  _previousState: ReportReviewActionState,
  formData: FormData,
): Promise<ReportReviewActionState> {
  const reviewId = String(formData.get("review_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const submittedAt = Date.now();

  if (!reviewId || !UUID_RE.test(reviewId)) {
    return {
      code: "invalid_request",
      message: "We couldn't match this review.",
      submittedAt,
    };
  }
  if (reason.length < 3) {
    return {
      code: "reason_required",
      message: "Share a short note about what concerned you.",
      submittedAt,
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      message: "Reporting is unavailable in this environment.",
      submittedAt,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return {
      code: "unauthenticated",
      message: "Sign in to report a review.",
      submittedAt,
    };
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>>;
  try {
    account = await ensureAuthAccount(user);
  } catch {
    return {
      code: "account_resolution_failed",
      message: "We couldn't resolve your account. Try again.",
      submittedAt,
    };
  }

  if (requiresRoleSelection(account) || isRestrictedAccount(account)) {
    return {
      code: "forbidden",
      message: "Your account can't submit reports right now.",
      submittedAt,
    };
  }

  const service = createSupabaseServiceRoleClient();
  const { data: review } = await service
    .from("reviews")
    .select("id, review_status, tutor_profile_id")
    .eq("id", reviewId)
    .maybeSingle<{
      id: string;
      review_status: string;
      tutor_profile_id: string;
    }>();

  if (!review || review.review_status !== "published") {
    return {
      code: "not_found",
      message: "This review is no longer available to report.",
      submittedAt,
    };
  }

  try {
    await openReviewReport({
      reporterAppUserId: account.id,
      reporterReason: reason,
      reviewId: review.id,
      tutorProfileId: review.tutor_profile_id,
    });
    return { code: "ok", message: null, submittedAt };
  } catch (error) {
    if (error instanceof ModerationCaseError) {
      return { code: error.code, message: error.message, submittedAt };
    }
    return {
      code: "temporary_failure",
      message: "We couldn't submit the report. Try again in a moment.",
      submittedAt,
    };
  }
}
