"use server";

import { createHash } from "node:crypto";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAuthAccount, type ResolvedAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { logJobsEvent } from "@/lib/jobs/logging";
import { siteConfig } from "@/lib/seo/site";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isPayoutSupportedCountryCode,
  type PayoutSupportedCountryCode,
} from "@/modules/payouts/constants";
import {
  createTutorConnectAccount,
  createTutorOnboardingLink,
  isStripeConnectConfigured,
} from "@/modules/payouts/connect";
import {
  loadTutorPayoutProfile,
  recordConnectAccountStarted,
  type TutorPayoutProfileRecord,
} from "@/modules/payouts/service";

const EARNINGS_PATH = "/tutor/earnings";

export type StartPayoutOnboardingFieldErrors = {
  country?: string;
};

export type StartPayoutOnboardingState = {
  code: string | null;
  fieldErrors: StartPayoutOnboardingFieldErrors;
  message: string | null;
  values: { country: string };
};

export const initialStartPayoutOnboardingState: StartPayoutOnboardingState = {
  code: null,
  fieldErrors: {},
  message: null,
  values: { country: "" },
};

export async function startPayoutOnboardingAction(
  _previous: StartPayoutOnboardingState,
  formData: FormData,
): Promise<StartPayoutOnboardingState> {
  const rawCountry = readFormString(formData, "country").toUpperCase();
  const values = { country: rawCountry };

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message:
        "Payout setup is not available until Supabase auth is configured.",
      values,
    };
  }

  if (!isStripeConnectConfigured()) {
    return {
      code: "stripe_unconfigured",
      fieldErrors: {},
      message:
        "Payout setup is not available until Stripe is configured on the server.",
      values,
    };
  }

  if (!rawCountry || !isPayoutSupportedCountryCode(rawCountry)) {
    return {
      code: "invalid_country",
      fieldErrors: { country: "Choose the country where you'll receive payouts." },
      message: "Please choose a supported payout country before continuing.",
      values,
    };
  }

  let redirectPath: Route | null = null;
  let redirectUrl: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath(EARNINGS_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);
      const profile = await loadTutorPayoutProfile(account.id);

      if (!profile) {
        return {
          code: "no_tutor_profile",
          fieldErrors: {},
          message:
            "Set up your tutor profile before starting payout onboarding.",
          values,
        };
      }

      if (profile.application_status !== "approved") {
        return {
          code: "application_not_approved",
          fieldErrors: {},
          message:
            "Your tutor application must be approved before payouts can be set up.",
          values,
        };
      }

      const onboardingUrl = await ensureConnectAccountAndOnboardingUrl({
        account,
        country: rawCountry,
        profile,
      });

      redirectUrl = onboardingUrl;
    }
  } catch (error) {
    logJobsEvent("error", "tutor_payout_onboarding_start_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "stripe_account_create_failed",
      fieldErrors: {},
      message:
        "We couldn't start Stripe onboarding right now. Please try again in a moment.",
      values,
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  if (redirectUrl) {
    redirect(redirectUrl as Route);
  }

  revalidatePath(EARNINGS_PATH);

  return {
    code: "success",
    fieldErrors: {},
    message: null,
    values,
  };
}

export type ResumePayoutOnboardingState = {
  code: string | null;
  message: string | null;
};

export const initialResumePayoutOnboardingState: ResumePayoutOnboardingState = {
  code: null,
  message: null,
};

export async function resumePayoutOnboardingAction(
  previousState: ResumePayoutOnboardingState,
  formData: FormData,
): Promise<ResumePayoutOnboardingState> {
  void previousState;
  void formData;

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      message:
        "Payout setup is not available until Supabase auth is configured.",
    };
  }

  if (!isStripeConnectConfigured()) {
    return {
      code: "stripe_unconfigured",
      message:
        "Payout setup is not available until Stripe is configured on the server.",
    };
  }

  let redirectPath: Route | null = null;
  let redirectUrl: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath(EARNINGS_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);
      const profile = await loadTutorPayoutProfile(account.id);

      if (!profile?.stripe_account_id) {
        return {
          code: "no_account_yet",
          message: "Start Stripe onboarding before resuming.",
        };
      }

      const link = await createTutorOnboardingLink({
        accountId: profile.stripe_account_id,
        refreshUrl: buildOnboardingRefreshUrl(profile.id),
        returnUrl: buildOnboardingReturnUrl(),
      });

      redirectUrl = link.url;
    }
  } catch (error) {
    logJobsEvent("error", "tutor_payout_onboarding_resume_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "stripe_account_link_failed",
      message:
        "We couldn't open Stripe onboarding right now. Please try again in a moment.",
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  if (redirectUrl) {
    redirect(redirectUrl as Route);
  }

  return { code: "success", message: null };
}

async function ensureConnectAccountAndOnboardingUrl(input: {
  account: ResolvedAuthAccount;
  country: PayoutSupportedCountryCode;
  profile: TutorPayoutProfileRecord;
}): Promise<string> {
  let stripeAccountId = input.profile.stripe_account_id;

  if (!stripeAccountId) {
    const fullName = (input.account.full_name ?? "").trim();
    const [firstName, ...rest] = fullName.length > 0 ? fullName.split(/\s+/) : [];
    const lastName = rest.length > 0 ? rest.join(" ") : null;
    const idempotencyKey = createHash("sha256")
      .update(`tutor-connect:${input.profile.id}:${input.country}`)
      .digest("hex");

    const created = await createTutorConnectAccount(
      {
        country: input.country,
        email: input.account.email,
        firstName: firstName ?? null,
        lastName,
      },
      { idempotencyKey },
    );

    const persisted = await recordConnectAccountStarted({
      accountId: created.id,
      country: input.country,
      profileId: input.profile.id,
    });

    stripeAccountId = persisted.stripe_account_id;
  }

  if (!stripeAccountId) {
    throw new Error("Stripe Connect account id is missing after creation.");
  }

  const link = await createTutorOnboardingLink({
    accountId: stripeAccountId,
    refreshUrl: buildOnboardingRefreshUrl(input.profile.id),
    returnUrl: buildOnboardingReturnUrl(),
  });

  return link.url;
}

function buildOnboardingReturnUrl() {
  const url = new URL(EARNINGS_PATH, siteConfig.origin);
  url.searchParams.set("onboarding", "complete");

  return url.toString();
}

function buildOnboardingRefreshUrl(profileId: string) {
  const url = new URL("/api/stripe/connect/refresh", siteConfig.origin);
  url.searchParams.set("profile", profileId);

  return url.toString();
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
