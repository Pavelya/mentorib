"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath, getSafeRedirectPath } from "@/lib/auth/allowed-redirects";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildLegalNoticeReviewPath, recordLegalNoticeReview } from "@/modules/notifications/legal-notices";

export async function reviewLegalNoticeAction(formData: FormData) {
  const noticeId = getFormValue(formData.get("noticeId"));
  const returnTo = getSafeRedirectPath(getFormValue(formData.get("returnTo")));

  if (!noticeId) {
    redirect("/privacy");
  }

  if (!isSupabaseAuthConfigured()) {
    redirect(buildErrorRedirect(noticeId, returnTo) as Route);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(buildLegalNoticeReviewPath(noticeId, returnTo)) as Route);
  }

  try {
    const account = await ensureAuthAccount(user);

    await recordLegalNoticeReview(account.id, noticeId);
  } catch {
    redirect(buildErrorRedirect(noticeId, returnTo) as Route);
  }

  redirect((returnTo ?? "/privacy") as Route);
}

function buildErrorRedirect(noticeId: string, returnTo?: string | null) {
  const reviewPath = buildLegalNoticeReviewPath(noticeId, returnTo);
  const separator = reviewPath.includes("?") ? "&" : "?";

  return `${reviewPath}${separator}reviewError=1`;
}

function getFormValue(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value : null;
}
