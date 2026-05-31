import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { PersonSummary } from "@/components/continuity";
import {
  ActivityList,
  Card,
  DescriptionList,
  type DescriptionListItem,
  Flag,
  InlineNotice,
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime";
import {
  getInternalUserDetail,
  type InternalUserDetailDto,
  type InternalUserFinanceSummaryDto,
  type InternalUserTutorSummaryDto,
} from "@/modules/admin/user-detail-repository";

import { UserDetailActionForms } from "./user-detail-action-forms";
import styles from "./user-detail.module.css";

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

  const { account } = detail;
  const hasActiveAdminRole = detail.roles.some(
    (role) => role.role === "admin" && role.roleStatus === "active",
  );
  const actorIsSelf = admin.id === account.appUserId;

  return (
    <article className={styles.page}>
      <PageHeader
        backLink={{
          href: "/internal" as Route,
          label: "← Back to internal home",
        }}
        eyebrow="Internal · Users"
        status={
          <>
            <StatusBadge tone={account.accountStatusTone}>
              {account.accountStatusLabel}
            </StatusBadge>
            <span className={styles.statusMeta}>
              Joined {formatUtcDateTime(account.createdAt)}
            </span>
          </>
        }
        title={account.displayName ?? account.email}
      />

      <div className={styles.detailGrid}>
        <div className={styles.detailColumn}>
          <AccountSection detail={detail} />
          <RolesSection detail={detail} />
          {detail.tutorProfile ? (
            <TutorSection
              name={account.displayName ?? account.email}
              tutor={detail.tutorProfile}
            />
          ) : null}
          {detail.finance ? <FinanceSection finance={detail.finance} /> : null}
          <RecentCasesSection detail={detail} />
          <RecentAdminActionsSection detail={detail} />
        </div>

        <UserDetailActionForms
          actorIsSelf={actorIsSelf}
          currentAccountStatus={account.accountStatus}
          currentListingStatus={detail.tutorProfile?.publicListingStatus ?? null}
          hasActiveAdminRole={hasActiveAdminRole}
          targetAppUserId={account.appUserId}
          tutorProfileId={detail.tutorProfile?.tutorProfileId ?? null}
        />
      </div>
    </article>
  );
}

function AccountSection({ detail }: { detail: InternalUserDetailDto }) {
  const { account } = detail;
  return (
    <Section eyebrow="Account" title="Account" titleAs="h2">
      <Card>
        <PersonSummary
          avatarSrc={account.avatarSrc ?? undefined}
          badges={[
            {
              label: account.accountStatusLabel,
              tone: account.accountStatusTone,
            },
          ]}
          descriptor={account.email}
          name={account.displayName ?? account.email}
          variant="header"
        />
        <DescriptionList
          items={[
            { label: "Email", value: account.email },
            {
              label: "Account status",
              value: (
                <StatusBadge tone={account.accountStatusTone}>
                  {account.accountStatusLabel}
                </StatusBadge>
              ),
            },
            { label: "Timezone", value: account.timezone },
            { label: "Joined", value: formatUtcDateTime(account.createdAt) },
          ]}
        />
      </Card>
    </Section>
  );
}

function RolesSection({ detail }: { detail: InternalUserDetailDto }) {
  return (
    <Section eyebrow="Roles" title="Roles" titleAs="h2">
      <Card>
        {detail.roles.length === 0 ? (
          <InlineNotice tone="info" title="No roles recorded">
            <p>Roles are assigned after onboarding completes.</p>
          </InlineNotice>
        ) : (
          <DescriptionList
            items={detail.roles.map((role) => ({
              label: role.roleLabel,
              value: (
                <span className={styles.inlineMeta}>
                  <StatusBadge tone={role.roleStatusTone}>
                    {role.roleStatusLabel}
                  </StatusBadge>
                  <span className={styles.statusMeta}>
                    Granted {formatUtcDateTime(role.grantedAt)}
                    {role.revokedAt
                      ? ` · Revoked ${formatUtcDateTime(role.revokedAt)}`
                      : ""}
                  </span>
                </span>
              ),
            }))}
          />
        )}
      </Card>
    </Section>
  );
}

function TutorSection({
  name,
  tutor,
}: {
  name: string;
  tutor: InternalUserTutorSummaryDto;
}) {
  const isApproved = tutor.applicationStatus === "approved";

  const items: DescriptionListItem[] = [
    {
      label: "Application status",
      value: (
        <StatusBadge tone={tutor.applicationStatusTone}>
          {tutor.applicationStatusLabel}
        </StatusBadge>
      ),
    },
    {
      label: "Listing status",
      value: (
        <StatusBadge tone={tutor.publicListingStatusTone}>
          {tutor.publicListingStatusLabel}
        </StatusBadge>
      ),
    },
  ];
  if (tutor.selfPausedAt) {
    items.push({
      label: "Self-paused",
      value: formatUtcDateTime(tutor.selfPausedAt),
    });
  }
  if (tutor.publicProfileHref) {
    items.push({
      label: "Public profile",
      value: (
        <Link href={tutor.publicProfileHref} prefetch={false}>
          View public profile
        </Link>
      ),
    });
  }

  return (
    <Section eyebrow="Tutor profile" title="Tutor profile" titleAs="h2">
      <Card>
        {isApproved ? (
          <PersonSummary
            avatarSrc={tutor.avatarSrc ?? undefined}
            descriptor={tutor.headline ?? "Approved tutor"}
            name={name}
            variant="header"
          />
        ) : null}
        <DescriptionList items={items} />
      </Card>
    </Section>
  );
}

function FinanceSection({
  finance,
}: {
  finance: InternalUserFinanceSummaryDto;
}) {
  const items: DescriptionListItem[] = [
    {
      label: "Payout readiness",
      value: (
        <StatusBadge tone={finance.payoutReadinessStatusTone}>
          {finance.payoutReadinessStatusLabel}
        </StatusBadge>
      ),
    },
    {
      label: "Stripe Connect account",
      value: finance.hasStripeAccount ? "Linked" : "Not linked",
    },
  ];
  if (finance.payoutAccountCountry) {
    items.push({
      label: "Country",
      value: finance.countryFlagCode ? (
        <>
          <Flag
            aria-label={finance.payoutAccountCountry}
            code={finance.countryFlagCode}
          />
          {finance.payoutAccountCountry}
        </>
      ) : (
        finance.payoutAccountCountry
      ),
    });
  }
  if (finance.payoutOnboardingStartedAt) {
    items.push({
      label: "Onboarding started",
      value: formatUtcDateTime(finance.payoutOnboardingStartedAt),
    });
  }
  if (finance.payoutOnboardingCompletedAt) {
    items.push({
      label: "Onboarding completed",
      value: formatUtcDateTime(finance.payoutOnboardingCompletedAt),
    });
  }
  if (finance.payoutStatusSyncedAt) {
    items.push({
      label: "Last sync",
      value: formatUtcDateTime(finance.payoutStatusSyncedAt),
    });
  }

  return (
    <Section eyebrow="Finance" title="Payout status" titleAs="h2">
      <Card>
        <DescriptionList items={items} />
      </Card>
    </Section>
  );
}

function RecentCasesSection({ detail }: { detail: InternalUserDetailDto }) {
  return (
    <Section eyebrow="Cases" title="Recent moderation cases" titleAs="h2">
      {detail.recentCases.length === 0 ? (
        <InlineNotice tone="info" title="No moderation cases">
          <p>No moderation cases involve this user.</p>
        </InlineNotice>
      ) : (
        <Card>
          <ActivityList
            items={detail.recentCases.map((row) => ({
              body: (
                <span className={styles.inlineMeta}>
                  <StatusBadge tone={row.caseStatusTone}>
                    {row.caseStatusLabel}
                  </StatusBadge>
                  <span className={styles.statusMeta}>
                    {row.involvementLabel} · {row.subjectKindLabel}
                  </span>
                </span>
              ),
              header: (
                <Link
                  href={`/internal/moderation/${row.caseId}` as Route}
                  prefetch={false}
                >
                  {row.caseKindLabel}
                </Link>
              ),
              id: row.caseId,
              timestamp: formatUtcDateTime(row.createdAt),
            }))}
          />
        </Card>
      )}
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
      {detail.recentAdminActions.length === 0 ? (
        <InlineNotice tone="info" title="No admin actions">
          <p>No prior admin actions recorded against this user.</p>
        </InlineNotice>
      ) : (
        <Card>
          <ActivityList
            items={detail.recentAdminActions.map((row) => ({
              body: (
                <div className={styles.actionBody}>
                  <span className={styles.statusMeta}>{row.actionKeyLabel}</span>
                  {row.reason ? <p>{row.reason}</p> : null}
                </div>
              ),
              header: (
                <PersonSummary
                  avatarSrc={row.actorAvatarSrc ?? undefined}
                  descriptor="Operator"
                  name={row.actorDisplayName ?? "Unknown operator"}
                  variant="compact"
                />
              ),
              id: row.id,
              timestamp: formatUtcDateTime(row.createdAt),
            }))}
          />
        </Card>
      )}
    </Section>
  );
}
