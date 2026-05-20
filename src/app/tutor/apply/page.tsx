import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { TimezoneNotice } from "@/components/datetime";
import {
  Card,
  Chip,
  InlineNotice,
  Panel,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";
import type { ChipTone } from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { formatUtcDateTime, getTimezoneLabel } from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  getTutorApplication,
  type TutorApplicationDto,
  type TutorApplicationReadinessGate,
} from "@/modules/tutors/application";

import { withdrawTutorApplicationFormAction } from "./actions";
import { TutorApplicationForm } from "./apply-form";
import styles from "./apply.module.css";

const APPLY_PATH = "/tutor/apply" as const;

export default async function TutorApplyPage() {
  const timezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    return (
      <article className={styles.page}>
        <TimezoneNotice timezone={timezone} />
        <InlineNotice title="Application preview" tone="info">
          <p>
            Live application data connects once Supabase auth is configured.
            Sign in to start or continue your tutor application.
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
    redirect(buildAuthSignInPath(APPLY_PATH) as Route);
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
        <InlineNotice title="Application unavailable" tone="warning">
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
          <p>This account cannot continue the tutor application right now.</p>
        </InlineNotice>
      </article>
    );
  }

  const canAccessApplication =
    hasRole(account, "tutor", ["active", "pending"]) ||
    account.primary_role_context === "tutor";

  if (!canAccessApplication) {
    redirect(buildPostSignInRedirect(account, APPLY_PATH) as Route);
  }

  const application = await getTutorApplication(account);

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Tutor application</p>
        <h1 className={styles.title}>
          {getHeadingForStatus(application.applicationStatus)}
        </h1>
        <p className={styles.description}>
          {getDescriptionForStatus(application.applicationStatus)}
        </p>
      </header>

      {renderApplicationBody({ application })}
    </article>
  );
}

function renderApplicationBody({
  application,
}: {
  application: TutorApplicationDto;
}) {
  if (application.state === "no_profile") {
    return (
      <Panel
        eyebrow="Get started"
        title="Confirm you'd like to tutor on Mentor IB"
        tone="soft"
      >
        <p>
          Finish role setup so we can create your tutor profile and open the
          application steps.
        </p>
        <p className={styles.actionRow}>
          <Link
            className={getButtonClassName({ variant: "primary" })}
            href={routeFamilies.setup.defaultHref as Route}
          >
            Continue setup
          </Link>
        </p>
      </Panel>
    );
  }

  const status = application.applicationStatus;

  if (status === "submitted" || status === "under_review") {
    return <PendingReviewView application={application} />;
  }

  if (status === "approved") {
    return <ApprovedReadinessView application={application} />;
  }

  if (status === "rejected") {
    return (
      <Panel
        eyebrow="Outcome"
        title="Your application was not accepted"
        tone="soft"
      >
        <p>
          We reviewed your application and couldn&apos;t approve it at this time.
          Check your notifications for any feedback Mentor IB shared, and reach
          out to support if you&apos;d like to discuss the decision.
        </p>
      </Panel>
    );
  }

  if (status === "withdrawn") {
    return (
      <>
        <InlineNotice title="Application withdrawn" tone="info">
          <p>
            You withdrew the application. Start again whenever you&apos;re ready —
            your saved draft is still here.
          </p>
        </InlineNotice>
        <TutorApplicationForm application={application} />
      </>
    );
  }

  return (
    <>
      {status === "changes_requested" ? (
        <InlineNotice title="Updates requested" tone="actionNeeded">
          <p>
            Mentor IB asked for a few updates before approval. Review the steps
            below, make the requested changes, and resubmit.
          </p>
          <p>
            <WithdrawLink label="Withdraw this application" />
          </p>
        </InlineNotice>
      ) : null}
      <TutorApplicationForm application={application} />
    </>
  );
}

function WithdrawLink({ label }: { label: string }) {
  return (
    <form action={withdrawTutorApplicationFormAction} className={styles.withdrawForm}>
      <button
        className={[
          getButtonClassName({ size: "compact", variant: "ghost" }),
          styles.withdrawButton,
        ]
          .filter(Boolean)
          .join(" ")}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}

function PendingReviewView({
  application,
}: {
  application: TutorApplicationDto;
}) {
  const submittedAt = application.submittedAt
    ? formatUtcDateTime(application.submittedAt)
    : null;
  const draft = application.profile.draft;
  const subjectLabels = application.profile.capabilities
    .map((capability) =>
      capability.subject && capability.focusArea
        ? `${capability.subject.label} · ${capability.focusArea.label}`
        : capability.subject?.label ?? capability.focusArea?.label ?? null,
    )
    .filter((value): value is string => Boolean(value));
  const stillImprove = buildImprovementItems(application);

  return (
    <>
      <Panel eyebrow="Status" title="Application in review" tone="warm">
        <p className={styles.statusLine}>
          <StatusBadge tone="warning">Pending review</StatusBadge>
          {submittedAt ? (
            <span className={styles.statusMeta}>Submitted · {submittedAt}</span>
          ) : null}
        </p>
        <p>
          Expected review time is a few business days. We&apos;ll let you know as
          soon as the decision is in.
        </p>
        <p className={styles.actionRow}>
          {application.profile.publicSlug ? (
            <Link
              className={getButtonClassName({
                size: "compact",
                variant: "secondary",
              })}
              href={`/tutors/${application.profile.publicSlug}` as Route}
              prefetch={false}
              rel="noreferrer"
              target="_blank"
            >
              Preview public profile
            </Link>
          ) : null}
          <WithdrawLink label="Withdraw application" />
        </p>
      </Panel>

      <div className={styles.splitGrid}>
        <Section
          density="compact"
          eyebrow="What we received"
          title="Captured in your application"
          titleAs="h2"
        >
          <ul className={styles.receivedList}>
            {draft.fullName ? (
              <li>
                <strong>Full name:</strong> {draft.fullName}
              </li>
            ) : null}
            {draft.headline ? (
              <li>
                <strong>Headline:</strong> {draft.headline}
              </li>
            ) : null}
            {subjectLabels.length > 0 ? (
              <li>
                <strong>Subjects:</strong> {subjectLabels.join(", ")}
              </li>
            ) : null}
            {draft.languageCodes.length > 0 ? (
              <li>
                <strong>Languages:</strong>{" "}
                {draft.languageCodes
                  .map(
                    (code) =>
                      application.options.languages.find(
                        (option) => option.value === code,
                      )?.label ?? code,
                  )
                  .join(", ")}
              </li>
            ) : null}
            {draft.timezone ? (
              <li>
                <strong>Timezone:</strong> {getTimezoneLabel(draft.timezone)}
              </li>
            ) : null}
          </ul>
        </Section>

        <Section
          density="compact"
          eyebrow="What you can still improve"
          title="Strengthen your profile while you wait"
          titleAs="h2"
        >
          {stillImprove.length === 0 ? (
            <p>Your profile looks well-rounded. Sit tight while we review.</p>
          ) : (
            <ul className={styles.improveList}>
              {stillImprove.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <ReadinessGatesPanel gates={application.readinessGates} />
    </>
  );
}

function ApprovedReadinessView({
  application,
}: {
  application: TutorApplicationDto;
}) {
  return (
    <>
      <Panel eyebrow="Approved" title="Welcome to Mentor IB" tone="forest">
        <p>
          Mentor IB has approved your application. Finish the readiness steps
          below to go live in public discovery.
        </p>
        <p className={styles.actionRow}>
          {application.profile.publicSlug ? (
            <Link
              className={getButtonClassName({
                size: "compact",
                variant: "secondary",
              })}
              href={`/tutors/${application.profile.publicSlug}` as Route}
              prefetch={false}
              rel="noreferrer"
              target="_blank"
            >
              Preview public profile
            </Link>
          ) : null}
          <Link
            className={getButtonClassName({ size: "compact", variant: "secondary" })}
            href={"/tutor/schedule" as Route}
          >
            Open schedule
          </Link>
          <Link
            className={getButtonClassName({ size: "compact", variant: "secondary" })}
            href={"/tutor/earnings" as Route}
          >
            Open payouts
          </Link>
        </p>
      </Panel>

      <ReadinessGatesPanel gates={application.readinessGates} />
    </>
  );
}

function ReadinessGatesPanel({
  gates,
}: {
  gates: TutorApplicationReadinessGate[];
}) {
  return (
    <Section
      density="default"
      description="All six gates must pass before your profile becomes publicly discoverable."
      eyebrow="Listing readiness"
      title="Your path to a public listing"
      titleAs="h2"
    >
      <ul className={styles.readinessList}>
        {gates.map((gate) => (
          <li key={gate.key}>
            <Card>
              <div className={styles.readinessRow}>
                <div className={styles.readinessText}>
                  <p className={styles.readinessLabel}>{gate.label}</p>
                  <p className={styles.readinessDescription}>
                    {gate.description}
                  </p>
                </div>
                <Chip size="compact" tone={getGateChipTone(gate.state)}>
                  {getGateChipLabel(gate.state)}
                </Chip>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function buildImprovementItems(application: TutorApplicationDto): string[] {
  const items: string[] = [];
  if (application.profile.capabilities.length < 2) {
    items.push("Add another subject focus area you can teach.");
  }
  if (application.profile.draft.languageCodes.length < 2) {
    items.push("Add another language you can teach in.");
  }
  if (!application.profile.hasScheduleRules) {
    items.push("Set weekly availability so students can request lessons.");
  }
  if (!application.profile.hasMeetingLink) {
    items.push("Add a default meeting link.");
  }
  return items;
}

function getGateChipLabel(state: TutorApplicationReadinessGate["state"]): string {
  switch (state) {
    case "complete":
      return "Complete";
    case "under_review":
      return "Under review";
    case "blocked":
      return "Needs attention";
    case "in_progress":
    default:
      return "In progress";
  }
}

function getGateChipTone(state: TutorApplicationReadinessGate["state"]): ChipTone {
  switch (state) {
    case "complete":
      return "positive";
    case "under_review":
      return "info";
    case "blocked":
      return "warning";
    case "in_progress":
    default:
      return "default";
  }
}

function getHeadingForStatus(status: TutorApplicationDto["applicationStatus"]): string {
  switch (status) {
    case "submitted":
    case "under_review":
      return "Thanks — we're reviewing your application";
    case "approved":
      return "You're approved to tutor on Mentor IB";
    case "changes_requested":
      return "Updates requested";
    case "rejected":
      return "Application outcome";
    case "withdrawn":
      return "Restart your tutor application";
    case "in_progress":
      return "Continue your tutor application";
    case "not_started":
    default:
      return "Start your tutor application";
  }
}

function getDescriptionForStatus(
  status: TutorApplicationDto["applicationStatus"],
): string {
  switch (status) {
    case "submitted":
    case "under_review":
      return "We'll respond by email and in-app notification.";
    case "approved":
      return "Finish the readiness steps below to go live in public discovery.";
    case "changes_requested":
      return "Mentor IB asked for a few updates before approving your application.";
    case "rejected":
      return "Review your notifications and reach out to support if you'd like to discuss the decision.";
    case "withdrawn":
      return "Pick up where you left off whenever you're ready.";
    case "in_progress":
    case "not_started":
    default:
      return "One section at a time. Save and exit anytime; we'll pick up where you left off.";
  }
}
