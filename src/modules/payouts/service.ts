import "server-only";

import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { resolveListingStatusForPayoutChange } from "@/modules/payouts/listing-gate";
import {
  formatCurrencyFromMinorUnits,
  normalizeCurrencyCode,
} from "@/modules/pricing/money";
import type {
  PayoutReadinessStatus,
  TutorApplicationStatus,
  TutorProfileVisibilityStatus,
  TutorPublicListingStatus,
} from "@/modules/tutors/constants";

import {
  mapAccountToReadinessSnapshot,
  retrieveTutorConnectAccount,
  snapshotToRequirementsSummary,
  type PayoutReadinessSnapshot,
} from "@/modules/payouts/connect";

const MONTHLY_PAYOUT_LESSON_STATUSES = ["completed", "reviewed"] as const;
const PAID_PAYMENT_STATUS = "paid" as const;

export type TutorPayoutProfileRecord = {
  app_user_id: string;
  application_status: TutorApplicationStatus;
  id: string;
  payout_account_country: string | null;
  payout_onboarding_completed_at: string | null;
  payout_onboarding_started_at: string | null;
  payout_readiness_status: PayoutReadinessStatus;
  payout_requirements_summary: Record<string, unknown> | null;
  payout_status_synced_at: string | null;
  profile_visibility_status: TutorProfileVisibilityStatus;
  public_listing_status: TutorPublicListingStatus;
  stripe_account_id: string | null;
};

export type MonthlyEarningsBucketDto = {
  earningsLabel: string;
  lessonCount: number;
  monthLabel: string;
  monthStartIso: string;
};

export type TutorEarningsDto = {
  applicationStatus: TutorApplicationStatus;
  hasStripeAccount: boolean;
  monthlySummary: MonthlyEarningsBucketDto[];
  onboardingCompletedAt: string | null;
  onboardingStartedAt: string | null;
  payoutAccountCountry: string | null;
  payoutReadinessStatus: PayoutReadinessStatus;
  payoutRequirementsSummary: Record<string, unknown> | null;
  payoutStatusSyncedAt: string | null;
  profileDisplayName: string;
  publicListingStatus: TutorPublicListingStatus;
  totalEarningsLabel: string;
  totalLessonCount: number;
};

export async function loadTutorPayoutProfile(
  appUserId: string,
): Promise<TutorPayoutProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "app_user_id, application_status, id, payout_account_country, payout_onboarding_completed_at, payout_onboarding_started_at, payout_readiness_status, payout_requirements_summary, payout_status_synced_at, profile_visibility_status, public_listing_status, stripe_account_id",
    )
    .eq("app_user_id", appUserId)
    .maybeSingle<TutorPayoutProfileRecord>();

  if (error) {
    throw new Error(
      `Could not load the tutor payout profile: ${error.message ?? "unknown error"} (code: ${error.code ?? "n/a"})`,
    );
  }

  return data ?? null;
}

export async function loadTutorPayoutProfileByStripeAccountId(
  stripeAccountId: string,
): Promise<TutorPayoutProfileRecord | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "app_user_id, application_status, id, payout_account_country, payout_onboarding_completed_at, payout_onboarding_started_at, payout_readiness_status, payout_requirements_summary, payout_status_synced_at, profile_visibility_status, public_listing_status, stripe_account_id",
    )
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle<TutorPayoutProfileRecord>();

  if (error) {
    throw new Error("Could not load the tutor payout profile by Stripe account.");
  }

  return data ?? null;
}

type LessonEarningsRecord = {
  completed_at: string | null;
  currency_code: string;
  id: string;
  price_amount: number;
};

type PaymentLessonRecord = {
  amount: number;
  captured_at: string | null;
  currency_code: string;
  lesson_id: string;
};

async function loadCompletedLessonEarnings(
  tutorProfileId: string,
): Promise<MonthlyEarningsBucketDto[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: paymentRows, error: paymentError } = await supabase
    .from("payments")
    .select("amount, captured_at, currency_code, lesson_id")
    .eq("payment_status", PAID_PAYMENT_STATUS)
    .returns<PaymentLessonRecord[]>();

  if (paymentError) {
    throw new Error("Could not load payouts payment history.");
  }

  const payments = paymentRows ?? [];

  if (payments.length === 0) {
    return [];
  }

  const lessonIds = Array.from(new Set(payments.map((row) => row.lesson_id)));

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select("completed_at, currency_code, id, price_amount")
    .in("id", lessonIds)
    .eq("tutor_profile_id", tutorProfileId)
    .in("lesson_status", [...MONTHLY_PAYOUT_LESSON_STATUSES])
    .returns<LessonEarningsRecord[]>();

  if (lessonError) {
    throw new Error("Could not load completed lessons for earnings summary.");
  }

  const ownedLessonById = new Map(
    (lessonRows ?? []).map((lesson) => [lesson.id, lesson]),
  );

  const buckets = new Map<
    string,
    { amountByCurrency: Map<string, number>; lessonCount: number; monthStart: Date }
  >();

  for (const payment of payments) {
    const lesson = ownedLessonById.get(payment.lesson_id);

    if (!lesson || !lesson.completed_at) {
      continue;
    }

    const monthKey = toMonthKey(lesson.completed_at);
    const monthStart = monthStartFromKey(monthKey);
    const bucket =
      buckets.get(monthKey) ?? {
        amountByCurrency: new Map<string, number>(),
        lessonCount: 0,
        monthStart,
      };
    const currency = normalizeCurrencyCode(payment.currency_code);
    bucket.amountByCurrency.set(
      currency,
      (bucket.amountByCurrency.get(currency) ?? 0) + payment.amount,
    );
    bucket.lessonCount += 1;
    buckets.set(monthKey, bucket);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime())
    .map((bucket) => ({
      earningsLabel: formatBucketLabel(bucket.amountByCurrency),
      lessonCount: bucket.lessonCount,
      monthLabel: formatMonthLabel(bucket.monthStart),
      monthStartIso: bucket.monthStart.toISOString(),
    }));
}

function toMonthKey(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function monthStartFromKey(monthKey: string) {
  if (!monthKey) {
    return new Date(0);
  }

  const [year, month] = monthKey.split("-").map((value) => Number.parseInt(value, 10));

  return new Date(Date.UTC(year, month - 1, 1));
}

function formatMonthLabel(monthStart: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(monthStart);
}

function formatBucketLabel(amountByCurrency: Map<string, number>) {
  const parts = Array.from(amountByCurrency.entries()).map(([currency, total]) =>
    formatCurrencyFromMinorUnits(total, currency),
  );

  return parts.length === 0 ? "" : parts.join(" + ");
}

export async function buildTutorEarningsDto(
  profile: TutorPayoutProfileRecord,
): Promise<TutorEarningsDto> {
  const supabase = createSupabaseServiceRoleClient();
  const [monthlySummary, accountResult] = await Promise.all([
    loadCompletedLessonEarnings(profile.id),
    supabase
      .from("app_users")
      .select("full_name")
      .eq("id", profile.app_user_id)
      .maybeSingle<{ full_name: string | null }>(),
  ]);
  const totalLessonCount = monthlySummary.reduce(
    (sum, bucket) => sum + bucket.lessonCount,
    0,
  );
  const totalEarningsLabel = monthlySummary
    .map((bucket) => bucket.earningsLabel)
    .filter((label) => label.length > 0)
    .join(" + ");

  return {
    applicationStatus: profile.application_status,
    hasStripeAccount: Boolean(profile.stripe_account_id),
    monthlySummary,
    onboardingCompletedAt: profile.payout_onboarding_completed_at,
    onboardingStartedAt: profile.payout_onboarding_started_at,
    payoutAccountCountry: profile.payout_account_country,
    payoutReadinessStatus: profile.payout_readiness_status,
    payoutRequirementsSummary: profile.payout_requirements_summary,
    payoutStatusSyncedAt: profile.payout_status_synced_at,
    profileDisplayName: accountResult.data?.full_name?.trim() || "Mentor IB tutor",
    publicListingStatus: profile.public_listing_status,
    totalEarningsLabel,
    totalLessonCount,
  };
}

export async function applyConnectAccountSnapshot(input: {
  accountId: string;
  profile: TutorPayoutProfileRecord;
  snapshot: PayoutReadinessSnapshot;
  syncedAt?: Date;
}): Promise<{
  listingStatusChanged: boolean;
  payoutStatusChanged: boolean;
  profile: TutorPayoutProfileRecord;
}> {
  const supabase = createSupabaseServiceRoleClient();
  const syncedAtIso = (input.syncedAt ?? new Date()).toISOString();
  const previousPayoutStatus = input.profile.payout_readiness_status;
  const nextListingStatus = resolveListingStatusForPayoutChange({
    applicationStatus: input.profile.application_status,
    currentListingStatus: input.profile.public_listing_status,
    nextPayoutStatus: input.snapshot.status,
    previousPayoutStatus,
  });
  const onboardingCompletedAt =
    input.snapshot.detailsSubmitted &&
    input.snapshot.status !== "not_started" &&
    !input.profile.payout_onboarding_completed_at
      ? syncedAtIso
      : input.profile.payout_onboarding_completed_at;

  type TutorProfileUpdate =
    MentorIbDatabase["public"]["Tables"]["tutor_profiles"]["Update"];
  const updatePayload: TutorProfileUpdate = {
    payout_readiness_status: input.snapshot.status,
    payout_requirements_summary: snapshotToRequirementsSummary(input.snapshot),
    payout_status_synced_at: syncedAtIso,
    public_listing_status: nextListingStatus,
  };

  if (onboardingCompletedAt && onboardingCompletedAt !== input.profile.payout_onboarding_completed_at) {
    updatePayload.payout_onboarding_completed_at = onboardingCompletedAt;
  }

  const { data, error } = await supabase
    .from("tutor_profiles")
    .update(updatePayload)
    .eq("id", input.profile.id)
    .eq("stripe_account_id", input.accountId)
    .select(
      "app_user_id, application_status, id, payout_account_country, payout_onboarding_completed_at, payout_onboarding_started_at, payout_readiness_status, payout_requirements_summary, payout_status_synced_at, profile_visibility_status, public_listing_status, stripe_account_id",
    )
    .maybeSingle<TutorPayoutProfileRecord>();

  if (error || !data) {
    throw new Error("Could not apply the Stripe Connect account snapshot.");
  }

  return {
    listingStatusChanged: nextListingStatus !== input.profile.public_listing_status,
    payoutStatusChanged: input.snapshot.status !== previousPayoutStatus,
    profile: data,
  };
}

export async function syncTutorPayoutFromStripe(input: {
  profile: TutorPayoutProfileRecord;
  syncedAt?: Date;
}) {
  if (!input.profile.stripe_account_id) {
    return null;
  }

  const account = await retrieveTutorConnectAccount(input.profile.stripe_account_id);
  const snapshot = mapAccountToReadinessSnapshot(account);

  return applyConnectAccountSnapshot({
    accountId: input.profile.stripe_account_id,
    profile: input.profile,
    snapshot,
    syncedAt: input.syncedAt,
  });
}

export async function recordConnectAccountStarted(input: {
  accountId: string;
  country: string;
  profileId: string;
  startedAt?: Date;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const startedAtIso = (input.startedAt ?? new Date()).toISOString();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .update({
      payout_account_country: input.country,
      payout_onboarding_started_at: startedAtIso,
      stripe_account_id: input.accountId,
    })
    .eq("id", input.profileId)
    .select(
      "app_user_id, application_status, id, payout_account_country, payout_onboarding_completed_at, payout_onboarding_started_at, payout_readiness_status, payout_requirements_summary, payout_status_synced_at, profile_visibility_status, public_listing_status, stripe_account_id",
    )
    .maybeSingle<TutorPayoutProfileRecord>();

  if (error || !data) {
    throw new Error("Could not record Stripe Connect account creation.");
  }

  return data;
}
