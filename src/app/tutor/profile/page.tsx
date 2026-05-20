import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { TimezoneNotice } from "@/components/datetime";
import {
  Card,
  Chip,
  Icon,
  InlineNotice,
  Panel,
  Section,
  StatusBadge,
  getButtonClassName,
} from "@/components/ui";
import type { ChipTone, IconKey } from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { getCurrentUserTimezone } from "@/lib/datetime/server";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import type { TutorApplicationReadinessGate } from "@/modules/tutors/application";
import type { ProfileMinimumField } from "@/modules/tutors/listing-readiness";
import type {
  TutorCredentialReviewStatus,
  TutorIntroVideoPublicationStatus,
  TutorPublicMediaPublicationStatus,
} from "@/modules/tutors/constants";
import { getTutorCredentialsForOwner } from "@/modules/tutors/media-credentials";
import { getTutorPublicMediaForOwner } from "@/modules/tutors/media-public-assets";
import { getTutorIntroVideoForOwner } from "@/modules/tutors/media-video-reference";
import { getTutorProfileEditor } from "@/modules/tutors/tutor-profile-editor";

import { TutorProfileEditorForm } from "./profile-form";
import { TutorListingPublicationForm } from "./publication-form";
import styles from "./profile.module.css";

const PROFILE_PATH = "/tutor/profile" as const;
const APPLY_PATH = "/tutor/apply" as const;

export default async function TutorProfilePage() {
  const timezone = await getCurrentUserTimezone();

  if (!isSupabaseAuthConfigured()) {
    return (
      <article className={styles.page}>
        <TimezoneNotice timezone={timezone} />
        <InlineNotice title="Profile preview" tone="info">
          <p>
            Live profile editing connects once Supabase auth is configured.
            Sign in to manage your tutor profile.
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
    redirect(buildAuthSignInPath(PROFILE_PATH) as Route);
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
        <InlineNotice title="Profile unavailable" tone="warning">
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
          <p>This account cannot manage the tutor profile right now.</p>
        </InlineNotice>
      </article>
    );
  }

  const canAccessProfile =
    hasRole(account, "tutor", ["active", "pending"]) ||
    account.primary_role_context === "tutor";

  if (!canAccessProfile) {
    redirect(buildPostSignInRedirect(account, PROFILE_PATH) as Route);
  }

  const editor = await getTutorProfileEditor(account);

  if (
    editor.state === "no_profile" ||
    editor.applicationStatus !== "approved"
  ) {
    redirect(APPLY_PATH);
  }

  const [credentialsDto, mediaDto, videoDto] = await Promise.all([
    getTutorCredentialsForOwner(account),
    getTutorPublicMediaForOwner(account),
    getTutorIntroVideoForOwner(account),
  ]);

  const trustMediaSummary = buildTrustMediaSummary({
    credentials: credentialsDto?.credentials ?? [],
    profilePhotoStatus: mediaDto?.profilePhoto?.publicationStatus ?? null,
    introVideoStatus: videoDto?.publicationStatus ?? "hidden",
  });

  const publicationStatusLabel = getPublicationLabel(
    editor.publicListingStatus,
    editor.selfPausedAt,
  );

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Tutor profile</p>
        <h1 className={styles.title}>Your public profile</h1>
        <p className={styles.description}>
          What students see when they find you.
        </p>
      </header>

      <Panel
        eyebrow="Listing"
        title="Public listing"
        tone={editor.adminHold ? "soft" : "forest"}
      >
        <div className={styles.statusLine}>
          <StatusBadge tone={publicationStatusLabel.tone}>
            {publicationStatusLabel.label}
          </StatusBadge>
          {editor.publicSlug ? (
            <span className={styles.statusMeta}>
              Public URL · /tutors/{editor.publicSlug}
            </span>
          ) : null}
          {editor.publicSlug ? (
            <Link
              className={getButtonClassName({
                size: "compact",
                variant: "secondary",
              })}
              href={`/tutors/${editor.publicSlug}` as Route}
              prefetch={false}
              rel="noreferrer"
              target="_blank"
            >
              Preview public profile
            </Link>
          ) : null}
        </div>
        {editor.adminHold ? (
          <InlineNotice
            title={
              editor.adminHold.status === "paused"
                ? "Profile paused by Mentor IB"
                : "Profile removed from discovery"
            }
            tone="warning"
          >
            <p>{editor.adminHold.message}</p>
          </InlineNotice>
        ) : (
          <TutorListingPublicationForm
            canPublish={editor.canPublish}
            publicListingStatus={editor.publicListingStatus}
            selfPausedAt={editor.selfPausedAt}
          />
        )}
      </Panel>

      <ReadinessChecklistPanel gates={editor.readinessGates} />

      <TrustMediaPanel summary={trustMediaSummary} />

      <Panel eyebrow="Edit" title="Edit your profile" tone="default">
        <TutorProfileEditorForm
          draft={editor.draft}
          options={editor.options}
        />
      </Panel>
    </article>
  );
}

function ReadinessChecklistPanel({
  gates,
}: {
  gates: TutorApplicationReadinessGate[];
}) {
  return (
    <Section
      density="default"
      description="All readiness gates must pass before your profile becomes publicly discoverable."
      eyebrow="Readiness"
      title="Listing readiness"
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
                  {gate.missingProfileMinimumFields &&
                  gate.missingProfileMinimumFields.length > 0 ? (
                    <ul className={styles.readinessSubItems}>
                      {gate.missingProfileMinimumFields.map((field) => {
                        const subHref = getProfileMinimumFieldHref(field);
                        const label = getProfileMinimumFieldLabel(field);
                        return (
                          <li key={field}>
                            {subHref ? (
                              <Link
                                className={styles.readinessLink}
                                href={subHref as Route}
                              >
                                {label}
                              </Link>
                            ) : (
                              label
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {getGateActionHref(gate.key) ? (
                    <Link
                      className={styles.readinessLink}
                      href={getGateActionHref(gate.key) as Route}
                    >
                      {getGateActionLabel(gate.key)}
                    </Link>
                  ) : null}
                </div>
                <Chip size="compact" tone={getGateChipTone(gate.state)}>
                  <Icon name={getGateChipIcon(gate.state)} size={14} />
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

function getGateChipIcon(state: TutorApplicationReadinessGate["state"]): IconKey {
  switch (state) {
    case "complete":
      return "check";
    case "under_review":
      return "clock";
    case "blocked":
      return "alertTriangle";
    case "in_progress":
    default:
      return "circleDashed";
  }
}

function getGateActionHref(
  key: TutorApplicationReadinessGate["key"],
): string | null {
  switch (key) {
    case "scheduleSet":
    case "meetingLink":
      return "/tutor/schedule";
    case "payoutReady":
      return "/tutor/earnings";
    case "profileMinimum":
      return null;
    case "applicationApproved":
    case "noActiveHold":
    default:
      return null;
  }
}

function getGateActionLabel(
  key: TutorApplicationReadinessGate["key"],
): string {
  switch (key) {
    case "scheduleSet":
      return "Open schedule";
    case "meetingLink":
      return "Set meeting link";
    case "payoutReady":
      return "Open payouts";
    default:
      return "";
  }
}

function getProfileMinimumFieldHref(field: ProfileMinimumField): string | null {
  switch (field) {
    case "profilePhoto":
      return "/tutor/profile/photo";
    default:
      return null;
  }
}

function getProfileMinimumFieldLabel(field: ProfileMinimumField): string {
  switch (field) {
    case "displayName":
      return "Add your display name.";
    case "headline":
      return "Add a one-line headline.";
    case "bio":
      return "Write a short bio.";
    case "timezone":
      return "Set your timezone.";
    case "hourlyRate":
      return "Set your hourly rate.";
    case "profilePhoto":
      return "Publish a real profile photo.";
    default:
      return field;
  }
}

type TrustMediaSummary = {
  credentials: {
    total: number;
    approved: number;
    inReview: number;
    needsUpdate: number;
  };
  profilePhotoStatus: TutorPublicMediaPublicationStatus | null;
  introVideoStatus: TutorIntroVideoPublicationStatus;
};

function buildTrustMediaSummary(input: {
  credentials: Array<{ reviewStatus: TutorCredentialReviewStatus }>;
  profilePhotoStatus: TutorPublicMediaPublicationStatus | null;
  introVideoStatus: TutorIntroVideoPublicationStatus;
}): TrustMediaSummary {
  let approved = 0;
  let inReview = 0;
  let needsUpdate = 0;
  for (const credential of input.credentials) {
    if (credential.reviewStatus === "approved") {
      approved += 1;
    } else if (
      credential.reviewStatus === "uploaded" ||
      credential.reviewStatus === "pending_review"
    ) {
      inReview += 1;
    } else if (
      credential.reviewStatus === "rejected" ||
      credential.reviewStatus === "expired"
    ) {
      needsUpdate += 1;
    }
  }
  return {
    credentials: {
      total: input.credentials.length,
      approved,
      inReview,
      needsUpdate,
    },
    profilePhotoStatus: input.profilePhotoStatus,
    introVideoStatus: input.introVideoStatus,
  };
}

function TrustMediaPanel({ summary }: { summary: TrustMediaSummary }) {
  const photoStatusLabel = summary.profilePhotoStatus
    ? getProfilePhotoStatusLabel(summary.profilePhotoStatus)
    : { label: "Not uploaded", tone: "info" as const };
  const videoStatusLabel = getIntroVideoStatusLabel(summary.introVideoStatus);

  return (
    <Section
      density="default"
      description="Manage what makes your profile credible: credentials, photo, and intro video."
      title="Trust & media"
      titleAs="h2"
    >
      <ul className={styles.readinessList}>
        <li>
          <Card>
            <div className={styles.readinessRow}>
              <div className={styles.trustMediaLead}>
                <Icon
                  className={styles.trustMediaIcon}
                  name="fileText"
                  size={24}
                />
                <div className={styles.readinessText}>
                  <p className={styles.readinessLabel}>Credentials</p>
                  <p className={styles.readinessDescription}>
                    {summary.credentials.total === 0
                      ? "No credentials uploaded yet."
                      : `${summary.credentials.approved} approved · ${summary.credentials.inReview} in review · ${summary.credentials.needsUpdate} needs update`}
                  </p>
                  <Link
                    className={styles.readinessLink}
                    href={"/tutor/profile/credentials" as Route}
                  >
                    Manage credentials
                  </Link>
                </div>
              </div>
              <StatusBadge
                tone={
                  summary.credentials.needsUpdate > 0
                    ? "warning"
                    : summary.credentials.approved > 0
                      ? "positive"
                      : "info"
                }
              >
                {summary.credentials.total === 0
                  ? "Empty"
                  : `${summary.credentials.total} on file`}
              </StatusBadge>
            </div>
          </Card>
        </li>
        <li>
          <Card>
            <div className={styles.readinessRow}>
              <div className={styles.trustMediaLead}>
                <Icon
                  className={styles.trustMediaIcon}
                  name="camera"
                  size={24}
                />
                <div className={styles.readinessText}>
                  <p className={styles.readinessLabel}>Profile photo</p>
                  <p className={styles.readinessDescription}>
                    {summary.profilePhotoStatus === "published"
                      ? "Your photo is live on your public profile."
                      : summary.profilePhotoStatus
                        ? "Photo uploaded but not published yet."
                        : "Upload a real photo to replace the initials placeholder."}
                  </p>
                  <Link
                    className={styles.readinessLink}
                    href={"/tutor/profile/photo" as Route}
                  >
                    Manage photo
                  </Link>
                </div>
              </div>
              <StatusBadge tone={photoStatusLabel.tone}>
                {photoStatusLabel.label}
              </StatusBadge>
            </div>
          </Card>
        </li>
        <li>
          <Card>
            <div className={styles.readinessRow}>
              <div className={styles.trustMediaLead}>
                <Icon
                  className={styles.trustMediaIcon}
                  name="video"
                  size={24}
                />
                <div className={styles.readinessText}>
                  <p className={styles.readinessLabel}>Intro video</p>
                  <p className={styles.readinessDescription}>
                    {summary.introVideoStatus === "published"
                      ? "Your intro video is live on your public profile."
                      : "Add a short YouTube, Vimeo, or Loom link so students can hear you."}
                  </p>
                  <Link
                    className={styles.readinessLink}
                    href={"/tutor/profile/video" as Route}
                  >
                    Manage intro video
                  </Link>
                </div>
              </div>
              <StatusBadge tone={videoStatusLabel.tone}>
                {videoStatusLabel.label}
              </StatusBadge>
            </div>
          </Card>
        </li>
      </ul>
    </Section>
  );
}

function getProfilePhotoStatusLabel(
  status: TutorPublicMediaPublicationStatus,
): { label: string; tone: "positive" | "info" | "warning" } {
  switch (status) {
    case "published":
      return { label: "Published", tone: "positive" };
    case "hidden":
      return { label: "Hidden", tone: "warning" };
    case "approved":
      return { label: "Approved", tone: "info" };
    case "pending_review":
      return { label: "In review", tone: "info" };
    case "uploaded":
    default:
      return { label: "Uploaded", tone: "info" };
  }
}

function getIntroVideoStatusLabel(
  status: TutorIntroVideoPublicationStatus,
): { label: string; tone: "positive" | "info" } {
  if (status === "published") {
    return { label: "Published", tone: "positive" };
  }
  return { label: "Not published", tone: "info" };
}

function getPublicationLabel(
  status: import("@/modules/tutors/constants").TutorPublicListingStatus,
  selfPausedAt: string | null,
): { label: string; tone: "positive" | "warning" | "info" } {
  if (status === "listed") {
    return { label: "Listed", tone: "positive" };
  }
  if (status === "paused") {
    return { label: "Paused by Mentor IB", tone: "warning" };
  }
  if (status === "delisted") {
    return { label: "Removed by Mentor IB", tone: "warning" };
  }
  if (status === "eligible") {
    return { label: "Eligible", tone: "info" };
  }
  if (selfPausedAt) {
    return { label: "Paused by you", tone: "info" };
  }
  return { label: "Not listed", tone: "info" };
}
