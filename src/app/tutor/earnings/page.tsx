import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  ContextChipRow,
  PersonSummary,
} from "@/components/continuity";
import {
  Card,
  InlineNotice,
  Panel,
  StatusBadge,
} from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { formatUtcDateTime } from "@/lib/datetime";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import { isStripeConnectConfigured } from "@/modules/payouts/connect";
import {
  payoutSupportedCountries,
  getPayoutSupportedCountryDisplayName,
} from "@/modules/payouts/constants";
import {
  buildTutorEarningsDto,
  loadTutorPayoutProfile,
  syncTutorPayoutFromStripe,
  type TutorEarningsDto,
} from "@/modules/payouts/service";

import {
  PAYOUT_READINESS_DESCRIPTION,
  PAYOUT_READINESS_HEADLINE,
  PAYOUT_READINESS_TONE,
  LISTING_STATUS_LABELS,
  deriveChecklistStatus,
  getChecklistStatusLabel,
  getChecklistStatusTone,
} from "./earnings-presentation";
import { ResumePayoutOnboardingForm } from "./resume-payout-onboarding-form";
import { StartPayoutOnboardingForm } from "./start-payout-onboarding-form";
import styles from "./earnings.module.css";

const EARNINGS_PATH = "/tutor/earnings" as const;
const ALLOWED_RETURN_STATES = new Set([
  "complete",
  "missing_account",
  "mismatched_profile",
  "refresh_failed",
  "unavailable",
]);

type EarningsPageSearchParams = Promise<{ onboarding?: string | string[] }>;

export default async function TutorEarningsPage({
  searchParams,
}: {
  searchParams?: EarningsPageSearchParams;
}) {
  const onboardingParam = await readOnboardingParam(searchParams);

  if (!isSupabaseAuthConfigured()) {
    return (
      <article className={styles.page}>
        <InlineNotice
          className={styles.notice}
          title="Tutor earnings preview"
          tone="info"
        >
          <p>
            Live earnings and Stripe Connect onboarding connect once Supabase
            auth is configured. Sign in to set up payouts and review your
            earnings.
          </p>
        </InlineNotice>
      </article>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(EARNINGS_PATH) as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Tutor earnings unavailable" tone="warning">
          <p>
            We could not load your account context. Refresh the page or sign in
            again to continue.
          </p>
        </InlineNotice>
      </article>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Account access limited" tone="warning">
          <p>This account cannot view tutor earnings right now.</p>
        </InlineNotice>
      </article>
    );
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, EARNINGS_PATH) as Route);
  }

  const profileRecord = await loadTutorPayoutProfile(account.id);

  if (!profileRecord) {
    return (
      <article className={styles.page}>
        <PersonSummary
          descriptor="Set up your tutor profile to unlock the earnings view and Stripe Connect onboarding."
          eyebrow="Tutor earnings"
          name={account.full_name?.trim() || "Mentor IB tutor"}
          variant="header"
        />
        <InlineNotice
          className={styles.notice}
          title="Tutor profile not set up"
          tone="warning"
        >
          <p>
            Complete your tutor profile and application before configuring
            payouts.
          </p>
        </InlineNotice>
      </article>
    );
  }

  if (
    onboardingParam === "complete" &&
    profileRecord.stripe_account_id &&
    isStripeConnectConfigured()
  ) {
    try {
      await syncTutorPayoutFromStripe({ profile: profileRecord });
    } catch {
      // sync best-effort; webhook will catch up if this call fails
    }
  }

  const refreshedProfile =
    (await loadTutorPayoutProfile(account.id)) ?? profileRecord;
  const earnings = await buildTutorEarningsDto(refreshedProfile);

  return (
    <EarningsView
      accountEmail={account.email}
      earnings={earnings}
      onboardingState={onboardingParam}
      stripeConfigured={isStripeConnectConfigured()}
    />
  );
}

function EarningsView({
  accountEmail,
  earnings,
  onboardingState,
  stripeConfigured,
}: {
  accountEmail: string;
  earnings: TutorEarningsDto;
  onboardingState: string | null;
  stripeConfigured: boolean;
}) {
  const checklistStatus = deriveChecklistStatus(
    earnings.applicationStatus,
    earnings.payoutReadinessStatus,
  );
  const headline = PAYOUT_READINESS_HEADLINE[earnings.payoutReadinessStatus];
  const description = PAYOUT_READINESS_DESCRIPTION[earnings.payoutReadinessStatus];
  const tone = PAYOUT_READINESS_TONE[earnings.payoutReadinessStatus];
  const requirements = collectOpenRequirements(earnings.payoutRequirementsSummary);
  const onboardingNotice = buildOnboardingNotice(onboardingState);
  const showStartForm =
    !earnings.hasStripeAccount && earnings.applicationStatus === "approved";
  const showResumeForm =
    earnings.hasStripeAccount && earnings.payoutReadinessStatus !== "enabled";
  const setupBlocked =
    earnings.applicationStatus !== "approved" || !stripeConfigured;
  const countryDisplayName = earnings.payoutAccountCountry
    ? getPayoutSupportedCountryDisplayName(earnings.payoutAccountCountry) ??
      earnings.payoutAccountCountry
    : null;

  return (
    <article className={styles.page}>
      {onboardingNotice ? (
        <InlineNotice
          className={styles.notice}
          title={onboardingNotice.title}
          tone={onboardingNotice.tone}
        >
          <p>{onboardingNotice.body}</p>
        </InlineNotice>
      ) : null}

      <PersonSummary
        descriptor="Track Stripe Connect onboarding status, payout readiness, and lesson earnings in one place."
        eyebrow="Tutor earnings"
        name={earnings.profileDisplayName}
        variant="header"
      />

      <ContextChipRow
        items={[
          {
            label: `Listing · ${LISTING_STATUS_LABELS[earnings.publicListingStatus]}`,
            tone:
              earnings.publicListingStatus === "listed"
                ? "positive"
                : earnings.publicListingStatus === "delisted" ||
                    earnings.publicListingStatus === "paused"
                  ? "destructive"
                  : "warning",
          },
          {
            label: `Payouts · ${headline}`,
            tone: tone === "destructive" ? "destructive" : tone === "positive" ? "positive" : "warning",
          },
        ]}
        label="Status"
      />

      {!stripeConfigured ? (
        <InlineNotice title="Stripe is not configured" tone="warning">
          <p>
            Set <code>STRIPE_SECRET_KEY</code> on the server to enable Stripe
            Connect onboarding for tutors.
          </p>
        </InlineNotice>
      ) : null}

      {earnings.applicationStatus !== "approved" ? (
        <InlineNotice
          title="Application approval required"
          tone="actionNeeded"
        >
          <p>
            Payouts unlock once Mentor IB approves your tutor application. We
            will email you when your application moves to approved.
          </p>
        </InlineNotice>
      ) : null}

      <Panel
        eyebrow="Payout readiness"
        title={headline}
        description={description}
      >
        <Card>
          <div className={styles.checklistHeader}>
            <p className={styles.checklistTitle}>Stripe Connect Express</p>
            <StatusBadge tone={getChecklistStatusTone(checklistStatus)}>
              {getChecklistStatusLabel(checklistStatus)}
            </StatusBadge>
          </div>
          <p className={styles.checklistDescription}>
            We pre-fill your name and email ({accountEmail}) when we create
            your Stripe Connect Express account. Stripe collects only the
            verification documents and bank account or debit card it needs
            for your country.
          </p>
          {countryDisplayName ? (
            <p className={styles.helperText}>
              Payout country on file · {countryDisplayName}
            </p>
          ) : null}
          {earnings.payoutStatusSyncedAt ? (
            <p className={styles.helperText}>
              Last status sync · {formatUtcDateTime(earnings.payoutStatusSyncedAt)}
            </p>
          ) : null}
          {requirements.length > 0 ? (
            <ul className={styles.requirementsList}>
              {requirements.map((requirement) => (
                <li key={requirement}>{describeRequirement(requirement)}</li>
              ))}
            </ul>
          ) : null}

          {showStartForm ? (
            <StartPayoutOnboardingForm
              countryOptions={payoutSupportedCountries}
              defaultCountry=""
              disabled={setupBlocked}
            />
          ) : null}

          {showResumeForm ? (
            <ResumePayoutOnboardingForm
              ctaLabel={
                earnings.payoutReadinessStatus === "restricted"
                  ? "Resolve in Stripe"
                  : "Continue Stripe setup"
              }
              disabled={setupBlocked}
            />
          ) : null}
        </Card>
      </Panel>

      <Panel
        eyebrow="Monthly earnings"
        title="Captured lesson payments"
        description="Each cycle reflects lessons that were completed and captured. Stripe Connect Express pays out on the rolling default schedule for your country once your account is enabled."
      >
        <div className={styles.summaryRow}>
          <Card>
            <p className={styles.summaryLabel}>Captured lessons</p>
            <p className={styles.summaryValue}>{earnings.totalLessonCount}</p>
          </Card>
          <Card>
            <p className={styles.summaryLabel}>Lifetime captured</p>
            <p className={styles.summaryValue}>
              {earnings.totalEarningsLabel.length > 0
                ? earnings.totalEarningsLabel
                : "—"}
            </p>
          </Card>
        </div>

        {earnings.monthlySummary.length === 0 ? (
          <p className={styles.helperText}>
            Earnings appear here once a captured lesson is completed.
          </p>
        ) : (
          <div className={styles.monthList}>
            {earnings.monthlySummary.map((bucket) => (
              <Card key={bucket.monthStartIso}>
                <p className={styles.monthLabel}>{bucket.monthLabel}</p>
                <p className={styles.monthDetail}>
                  {bucket.lessonCount} captured lesson
                  {bucket.lessonCount === 1 ? "" : "s"} · {bucket.earningsLabel}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Panel>
    </article>
  );
}

function buildOnboardingNotice(state: string | null) {
  if (!state) {
    return null;
  }

  if (state === "complete") {
    return {
      body: "We refreshed your payout status from Stripe. The latest readiness state is shown below.",
      title: "Returned from Stripe",
      tone: "info" as const,
    };
  }

  if (state === "missing_account") {
    return {
      body: "Start Stripe onboarding from this page to create your Connect Express account.",
      title: "No Stripe account on file",
      tone: "warning" as const,
    };
  }

  if (state === "mismatched_profile") {
    return {
      body: "The Stripe refresh link did not match your tutor profile. Restart onboarding to continue.",
      title: "Onboarding link mismatch",
      tone: "warning" as const,
    };
  }

  if (state === "refresh_failed") {
    return {
      body: "We could not generate a new Stripe onboarding link. Try again in a moment.",
      title: "Stripe link refresh failed",
      tone: "actionNeeded" as const,
    };
  }

  if (state === "unavailable") {
    return {
      body: "Stripe Connect onboarding is currently unavailable. Try again once the configuration is restored.",
      title: "Onboarding unavailable",
      tone: "warning" as const,
    };
  }

  return null;
}

function collectOpenRequirements(
  summary: Record<string, unknown> | null,
): string[] {
  if (!summary) {
    return [];
  }

  const open = new Set<string>();
  const currentlyDue = summary.currently_due;
  const pastDue = summary.past_due;

  if (Array.isArray(currentlyDue)) {
    for (const entry of currentlyDue) {
      if (typeof entry === "string") {
        open.add(entry);
      }
    }
  }

  if (Array.isArray(pastDue)) {
    for (const entry of pastDue) {
      if (typeof entry === "string") {
        open.add(entry);
      }
    }
  }

  return Array.from(open);
}

function describeRequirement(requirement: string) {
  if (requirement.startsWith("individual.verification")) {
    return "Verification documents (government-issued ID)";
  }

  if (requirement.startsWith("external_account")) {
    return "Bank account or debit card for payouts";
  }

  if (requirement.startsWith("tos_acceptance")) {
    return "Acceptance of Stripe terms";
  }

  if (requirement.startsWith("individual.dob")) {
    return "Date of birth";
  }

  if (requirement.startsWith("individual.address")) {
    return "Residential address";
  }

  return requirement;
}

async function readOnboardingParam(
  searchParams: EarningsPageSearchParams | undefined,
) {
  if (!searchParams) {
    return null;
  }

  const resolved = await searchParams;
  const candidate = Array.isArray(resolved.onboarding)
    ? resolved.onboarding[0]
    : resolved.onboarding;

  if (typeof candidate !== "string") {
    return null;
  }

  return ALLOWED_RETURN_STATES.has(candidate) ? candidate : null;
}
