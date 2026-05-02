import { type NextRequest, NextResponse } from "next/server";

import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { logJobsEvent } from "@/lib/jobs/logging";
import { siteConfig } from "@/lib/seo/site";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAuthAccount } from "@/lib/auth/account-service";
import {
  createTutorOnboardingLink,
  isStripeConnectConfigured,
} from "@/modules/payouts/connect";
import { loadTutorPayoutProfile } from "@/modules/payouts/service";

const EARNINGS_PATH = "/tutor/earnings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const earningsUrl = new URL(EARNINGS_PATH, siteConfig.origin);

  if (!isSupabaseAuthConfigured() || !isStripeConnectConfigured()) {
    earningsUrl.searchParams.set("onboarding", "unavailable");

    return NextResponse.redirect(earningsUrl);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return NextResponse.redirect(
      new URL(buildAuthSignInPath(EARNINGS_PATH), siteConfig.origin),
    );
  }

  try {
    const account = await ensureAuthAccount(user);
    const profile = await loadTutorPayoutProfile(account.id);

    if (!profile?.stripe_account_id) {
      earningsUrl.searchParams.set("onboarding", "missing_account");

      return NextResponse.redirect(earningsUrl);
    }

    const requestedProfileId = request.nextUrl.searchParams.get("profile");

    if (requestedProfileId && requestedProfileId !== profile.id) {
      earningsUrl.searchParams.set("onboarding", "mismatched_profile");

      return NextResponse.redirect(earningsUrl);
    }

    const refreshUrl = new URL(
      "/api/stripe/connect/refresh",
      siteConfig.origin,
    );
    refreshUrl.searchParams.set("profile", profile.id);
    const returnUrl = new URL(EARNINGS_PATH, siteConfig.origin);
    returnUrl.searchParams.set("onboarding", "complete");

    const link = await createTutorOnboardingLink({
      accountId: profile.stripe_account_id,
      refreshUrl: refreshUrl.toString(),
      returnUrl: returnUrl.toString(),
    });

    return NextResponse.redirect(link.url);
  } catch (error) {
    logJobsEvent("error", "tutor_payout_onboarding_refresh_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });

    earningsUrl.searchParams.set("onboarding", "refresh_failed");

    return NextResponse.redirect(earningsUrl);
  }
}
