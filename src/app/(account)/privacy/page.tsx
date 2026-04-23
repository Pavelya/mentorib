import { notFound } from "next/navigation";

import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { getButtonClassName, InlineNotice, Panel, StatusBadge } from "@/components/ui";
import { getSafeRedirectPath } from "@/lib/auth/allowed-redirects";
import { formatUtcDate, formatUtcDateTime } from "@/lib/datetime/format";
import { getSharedAccountRouteContext } from "@/modules/accounts/shared-account";
import {
  buildLegalNoticeReviewPath,
  getLegalNoticeTypeLabel,
  listLegalNoticesForAccount,
  requiresLegalNoticeAction,
} from "@/modules/notifications/legal-notices";

import { reviewLegalNoticeAction } from "./actions";
import styles from "../account-surfaces.module.css";

type PrivacyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const context = await getSharedAccountRouteContext("/privacy");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const resolvedSearchParams = await searchParams;
  const noticeId = getSearchParam(resolvedSearchParams.notice);
  const returnTo = getSafeRedirectPath(getSearchParam(resolvedSearchParams.returnTo));
  const reviewError = getSearchParam(resolvedSearchParams.reviewError) === "1";
  const notices = await listLegalNoticesForAccount(context.account.id);
  const selectedNotice = noticeId ? notices.find((notice) => notice.id === noticeId) : null;

  if (noticeId && !selectedNotice) {
    notFound();
  }

  const highlightedNotice = selectedNotice ?? context.pendingLegalNotice ?? notices[0] ?? null;
  const pendingCount = notices.filter((notice) => requiresLegalNoticeAction(notice)).length;
  const acknowledgementCount = notices.filter((notice) => {
    return notice.requiresAcknowledgement;
  }).length;

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <h1 className={styles.pageTitle}>Privacy &amp; legal</h1>
        <p className={styles.pageDescription}>
          Review required policy updates and see the basics of your account privacy surface.
        </p>
      </header>

      {context.pendingLegalNotice && !selectedNotice ? (
        <PendingLegalNotice notice={context.pendingLegalNotice} returnTo="/privacy" />
      ) : null}

      {reviewError ? (
        <InlineNotice title="Review action not saved" tone="warning">
          <p>
            We could not update the legal notice review state just now. Try again in
            a moment.
          </p>
        </InlineNotice>
      ) : null}

      {highlightedNotice ? (
        <Panel
          description="Legal updates stay visible after sign-in and remain accessible later in this shared privacy route."
          title={
            requiresLegalNoticeAction(highlightedNotice)
              ? "Review required before you continue"
              : highlightedNotice.title
          }
          tone={requiresLegalNoticeAction(highlightedNotice) ? "warm" : "raised"}
        >
          <div className={styles.badgeRow}>
            <StatusBadge tone="warning">
              {getLegalNoticeTypeLabel(highlightedNotice.noticeType)}
            </StatusBadge>
            <StatusBadge tone="info">{highlightedNotice.versionLabel}</StatusBadge>
            {highlightedNotice.requiresAcknowledgement ? (
              <StatusBadge tone="trust">Acknowledgement tracked</StatusBadge>
            ) : null}
          </div>
          <p className={styles.bodyText}>{highlightedNotice.summary}</p>
          <p className={styles.muted}>
            Published{" "}
            {formatUtcDateTime(highlightedNotice.publishedAt, {
              timezone: context.account.timezone,
            })}
            . Effective{" "}
            {formatUtcDate(highlightedNotice.effectiveAt, context.account.timezone)}.
          </p>
          <div className={styles.noticeActions}>
            <a
              className={getButtonClassName({ size: "compact", variant: "secondary" })}
              href={highlightedNotice.documentUrl}
              rel={isExternalDocument(highlightedNotice.documentUrl) ? "noreferrer" : undefined}
              target={isExternalDocument(highlightedNotice.documentUrl) ? "_blank" : undefined}
            >
              Open full document
            </a>
            {requiresLegalNoticeAction(highlightedNotice) ? (
              <form action={reviewLegalNoticeAction}>
                <input name="noticeId" type="hidden" value={highlightedNotice.id} />
                <input
                  name="returnTo"
                  type="hidden"
                  value={returnTo ?? "/settings"}
                />
                <button className={getButtonClassName({ size: "compact" })} type="submit">
                  {highlightedNotice.requiresAcknowledgement
                    ? "Acknowledge and continue"
                    : "Continue after review"}
                </button>
              </form>
            ) : returnTo ? (
              <a className={getButtonClassName({ size: "compact" })} href={returnTo}>
                Continue
              </a>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <section className={styles.summaryGrid}>
        <Panel
          description="This route explains the shared account data posture before delete/export flows arrive."
          title="Privacy surface scope"
          tone="mist"
        >
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <p className={styles.detailLabel}>Account email</p>
              <p className={styles.detailValue}>{context.account.email}</p>
            </div>
            <div className={styles.detailCard}>
              <p className={styles.detailLabel}>Local timezone</p>
              <p className={styles.detailValue}>{context.account.timezone}</p>
            </div>
            <div className={styles.detailCard}>
              <p className={styles.detailLabel}>Legal updates</p>
              <p className={styles.detailValue}>
                Terms and privacy broadcasts stay visible here and in Notifications.
              </p>
            </div>
            <div className={styles.detailCard}>
              <p className={styles.detailLabel}>Deferred controls</p>
              <p className={styles.detailValue}>
                Delete-account, export, and advanced preferences ship in later phases.
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          description="Pending legal work is tracked separately from the bell inbox so policy changes do not get buried."
          title="Current notice state"
        >
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{notices.length}</p>
              <p className={styles.metricLabel}>Published legal notices</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{pendingCount}</p>
              <p className={styles.metricLabel}>Updates still needing review</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{acknowledgementCount}</p>
              <p className={styles.metricLabel}>Notices with acknowledgement tracking</p>
            </div>
          </div>
        </Panel>
      </section>

      <Panel
        description="Unauthorized or missing notice selections collapse to the shared 404 posture instead of leaking private object state."
        title="Published legal notice history"
      >
        {notices.length > 0 ? (
          <ul className={styles.list}>
            {notices.map((notice) => (
              <li
                className={[
                  styles.listItem,
                  highlightedNotice?.id === notice.id ? styles.selectedItem : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={notice.id}
              >
                <div className={styles.itemHeader}>
                  <div className={styles.itemCopy}>
                    <h3 className={styles.itemTitle}>{notice.title}</h3>
                    <p className={styles.bodyText}>{notice.summary}</p>
                  </div>
                  <div className={styles.itemMeta}>
                    <StatusBadge tone="warning">{getLegalNoticeTypeLabel(notice.noticeType)}</StatusBadge>
                    <StatusBadge tone="info">{notice.versionLabel}</StatusBadge>
                    <StatusBadge
                      tone={requiresLegalNoticeAction(notice) ? "warning" : "positive"}
                    >
                      {requiresLegalNoticeAction(notice) ? "Needs review" : "Reviewed"}
                    </StatusBadge>
                  </div>
                </div>
                <p className={styles.muted}>
                  Published{" "}
                  {formatUtcDateTime(notice.publishedAt, {
                    timezone: context.account.timezone,
                  })}
                </p>
                <div className={styles.actions}>
                  <a
                    className={styles.inlineLink}
                    href={buildLegalNoticeReviewPath(notice.id, returnTo ?? "/privacy")}
                  >
                    Focus notice
                  </a>
                  <a
                    className={styles.inlineLink}
                    href={notice.documentUrl}
                    rel={isExternalDocument(notice.documentUrl) ? "noreferrer" : undefined}
                    target={isExternalDocument(notice.documentUrl) ? "_blank" : undefined}
                  >
                    Open document
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.bodyText}>
              No published legal notice versions are visible to this account yet.
            </p>
            <p className={styles.muted}>
              Terms and privacy updates will accumulate here as the policy publication
              flow comes online.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isExternalDocument(documentUrl: string) {
  return documentUrl.startsWith("http://") || documentUrl.startsWith("https://");
}
