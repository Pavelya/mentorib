import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { Card, Chip, Section, StatusBadge, getButtonClassName } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import type { AccountStatus, RoleStatus } from "@/modules/accounts/constants";
import type {
  ModerationCaseKind,
  ModerationCaseStatus,
} from "@/modules/admin/constants";
import {
  getInternalUserDetail,
  type InternalUserDetailDto,
} from "@/modules/admin/user-detail-repository";
import type { TutorPublicListingStatus } from "@/modules/tutors/constants";

import { UserDetailActionForms } from "./user-detail-action-forms";
import styles from "./user-detail.module.css";

const ACCOUNT_STATUS_TONES: Record<
  AccountStatus,
  "positive" | "warning" | "destructive" | "info"
> = {
  active: "positive",
  closed: "destructive",
  limited: "warning",
  suspended: "destructive",
};

const ROLE_STATUS_LABELS: Record<RoleStatus, string> = {
  active: "Active",
  pending: "Pending",
  revoked: "Revoked",
  suspended: "Suspended",
};

const LISTING_STATUS_LABELS: Record<TutorPublicListingStatus, string> = {
  delisted: "Delisted (admin hold)",
  eligible: "Eligible",
  listed: "Listed",
  not_listed: "Not listed",
  paused: "Paused (admin hold)",
};

const LISTING_STATUS_TONES: Record<
  TutorPublicListingStatus,
  "positive" | "warning" | "destructive" | "info" | "trust"
> = {
  delisted: "destructive",
  eligible: "info",
  listed: "positive",
  not_listed: "trust",
  paused: "warning",
};

const CASE_KIND_LABELS: Record<ModerationCaseKind, string> = {
  block: "Block",
  finance_intervention: "Finance",
  lesson_issue: "Lesson issue",
  public_content_takedown: "Public takedown",
  report: "Report",
};

const CASE_STATUS_LABELS: Record<ModerationCaseStatus, string> = {
  dismissed: "Dismissed",
  escalated: "Escalated",
  queued: "Queued",
  resolved: "Resolved",
  under_review: "Under review",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InternalUserDetailPage({ params }: PageProps) {
  const admin = await requireInternalAdminAccount();
  const { id } = await params;
  const detail = await getInternalUserDetail(id);
  if (!detail) {
    notFound();
  }

  const hasActiveAdminRole = detail.roles.some(
    (role) => role.role === "admin" && role.roleStatus === "active",
  );
  const actorIsSelf = admin.id === detail.account.appUserId;

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Internal · Users</p>
        <h1 className={styles.title}>
          {detail.account.displayName ?? detail.account.email}
        </h1>
        <p className={styles.helperText}>
          <Link
            className={getButtonClassName({
              size: "compact",
              variant: "ghost",
            })}
            href={"/internal" as Route}
            prefetch={false}
          >
            ← Back to internal home
          </Link>
        </p>
        <p>
          <StatusBadge tone={ACCOUNT_STATUS_TONES[detail.account.accountStatus]}>
            {detail.account.accountStatus}
          </StatusBadge>
          <span className={styles.recentMeta}>
            {" · Joined "}
            {formatUtcDateTime(detail.account.createdAt)}
          </span>
        </p>
      </header>

      <div className={styles.detailGrid}>
        <div className={styles.detailColumn}>
          <AccountSection detail={detail} />
          <RolesSection detail={detail} />
          {detail.tutorProfile ? <TutorSection detail={detail} /> : null}
          {detail.finance ? <FinanceSection detail={detail} /> : null}
          <RecentCasesSection detail={detail} />
          <RecentAdminActionsSection detail={detail} />
        </div>

        <UserDetailActionForms
          actorIsSelf={actorIsSelf}
          currentAccountStatus={detail.account.accountStatus}
          currentListingStatus={detail.tutorProfile?.publicListingStatus ?? null}
          hasActiveAdminRole={hasActiveAdminRole}
          targetAppUserId={detail.account.appUserId}
          tutorProfileId={detail.tutorProfile?.tutorProfileId ?? null}
        />
      </div>
    </article>
  );
}

function AccountSection({ detail }: { detail: InternalUserDetailDto }) {
  return (
    <Section eyebrow="Account" title="Account summary" titleAs="h2">
      <Card>
        <ul className={styles.detailList}>
          <DetailRow label="Display name" value={detail.account.displayName ?? "—"} />
          <DetailRow label="Email" value={detail.account.email} />
          <DetailRow label="App user id" value={detail.account.appUserId} />
          <DetailRow label="Timezone" value={detail.account.timezone} />
          <DetailRow
            label="Account status"
            value={detail.account.accountStatus}
          />
        </ul>
      </Card>
    </Section>
  );
}

function RolesSection({ detail }: { detail: InternalUserDetailDto }) {
  return (
    <Section eyebrow="Roles" title="Roles" titleAs="h2">
      <Card>
        {detail.roles.length === 0 ? (
          <p className={styles.helperText}>
            No roles recorded. Sign-up flow assigns roles after onboarding.
          </p>
        ) : (
          <ul className={styles.recentList}>
            {detail.roles.map((role) => (
              <li className={styles.recentRow} key={`${role.role}-${role.grantedAt}`}>
                <p>
                  <Chip size="compact" tone="default">
                    {role.role} · {ROLE_STATUS_LABELS[role.roleStatus]}
                  </Chip>
                </p>
                <p className={styles.recentMeta}>
                  Granted {formatUtcDateTime(role.grantedAt)}
                  {role.revokedAt
                    ? ` · Revoked ${formatUtcDateTime(role.revokedAt)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Section>
  );
}

function TutorSection({ detail }: { detail: InternalUserDetailDto }) {
  if (!detail.tutorProfile) {
    return null;
  }
  const tutor = detail.tutorProfile;
  return (
    <Section eyebrow="Tutor profile" title="Tutor profile" titleAs="h2">
      <Card>
        <ul className={styles.detailList}>
          <DetailRow label="Application status" value={tutor.applicationStatus} />
          <li className={styles.detailRow}>
            <p className={styles.detailLabel}>Listing status</p>
            <p>
              <StatusBadge tone={LISTING_STATUS_TONES[tutor.publicListingStatus]}>
                {LISTING_STATUS_LABELS[tutor.publicListingStatus]}
              </StatusBadge>
            </p>
          </li>
          {tutor.selfPausedAt ? (
            <DetailRow
              label="Self paused at"
              value={formatUtcDateTime(tutor.selfPausedAt)}
            />
          ) : null}
          {tutor.publicSlug ? (
            <DetailRow
              label="Public profile"
              value={`/tutors/${tutor.publicSlug}`}
            />
          ) : null}
          {tutor.headline ? (
            <DetailRow label="Headline" value={tutor.headline} />
          ) : null}
          <DetailRow label="Tutor profile id" value={tutor.tutorProfileId} />
        </ul>
      </Card>
    </Section>
  );
}

function FinanceSection({ detail }: { detail: InternalUserDetailDto }) {
  if (!detail.finance) {
    return null;
  }
  const finance = detail.finance;
  return (
    <Section eyebrow="Finance" title="Payout status" titleAs="h2">
      <Card>
        <ul className={styles.detailList}>
          <DetailRow
            label="Payout readiness"
            value={finance.payoutReadinessStatus}
          />
          <DetailRow
            label="Stripe Connect account"
            value={finance.hasStripeAccount ? "Linked" : "Not linked"}
          />
          {finance.payoutAccountCountry ? (
            <DetailRow
              label="Country"
              value={finance.payoutAccountCountry}
            />
          ) : null}
          {finance.payoutOnboardingStartedAt ? (
            <DetailRow
              label="Onboarding started"
              value={formatUtcDateTime(finance.payoutOnboardingStartedAt)}
            />
          ) : null}
          {finance.payoutOnboardingCompletedAt ? (
            <DetailRow
              label="Onboarding completed"
              value={formatUtcDateTime(finance.payoutOnboardingCompletedAt)}
            />
          ) : null}
          {finance.payoutStatusSyncedAt ? (
            <DetailRow
              label="Last sync"
              value={formatUtcDateTime(finance.payoutStatusSyncedAt)}
            />
          ) : null}
        </ul>
      </Card>
    </Section>
  );
}

function RecentCasesSection({ detail }: { detail: InternalUserDetailDto }) {
  return (
    <Section eyebrow="Cases" title="Recent moderation cases" titleAs="h2">
      <Card>
        {detail.recentCases.length === 0 ? (
          <p className={styles.helperText}>
            No moderation cases involving this user.
          </p>
        ) : (
          <ul className={styles.recentList}>
            {detail.recentCases.map((row) => (
              <li className={styles.recentRow} key={row.caseId}>
                <p>
                  <Link
                    href={`/internal/moderation/${row.caseId}` as Route}
                    prefetch={false}
                  >
                    {CASE_KIND_LABELS[row.caseKind]} ·{" "}
                    {CASE_STATUS_LABELS[row.caseStatus]}
                  </Link>
                </p>
                <p className={styles.recentMeta}>
                  Involvement: {row.involvement} ·{" "}
                  {formatUtcDateTime(row.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Section>
  );
}

function RecentAdminActionsSection({
  detail,
}: {
  detail: InternalUserDetailDto;
}) {
  return (
    <Section eyebrow="Audit" title="Recent admin actions" titleAs="h2">
      <Card>
        {detail.recentAdminActions.length === 0 ? (
          <p className={styles.helperText}>
            No prior admin actions recorded against this user.
          </p>
        ) : (
          <ul className={styles.recentList}>
            {detail.recentAdminActions.map((row) => (
              <li className={styles.recentRow} key={row.id}>
                <p>
                  <Chip size="compact" tone="default">
                    {row.actionKey}
                  </Chip>
                </p>
                <p className={styles.recentMeta}>
                  {row.actorDisplayName ?? row.actorAppUserId} ·{" "}
                  {formatUtcDateTime(row.createdAt)}
                </p>
                {row.reason ? (
                  <p className={styles.detailValue}>{row.reason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <li className={styles.detailRow}>
      <p className={styles.detailLabel}>{label}</p>
      <p className={styles.detailValue}>{value}</p>
    </li>
  );
}

