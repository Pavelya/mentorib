import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { InlineNotice, Panel, StatusBadge } from "@/components/ui";
import { formatUtcDateTime } from "@/lib/datetime/format";
import {
  getSharedAccountRouteContext,
  listAccountNotifications,
} from "@/modules/accounts/shared-account";

import styles from "../account-surfaces.module.css";

export default async function NotificationsPage() {
  const context = await getSharedAccountRouteContext("/notifications");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const { account, pendingLegalNotice } = context;
  const notifications = await listAccountNotifications(account.id);
  const unreadCount = notifications.filter((item) => item.notificationStatus === "unread").length;
  const legalUpdateCount = notifications.filter(
    (item) => item.notificationType === "policy_notice_updated",
  ).length;

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <h1 className={styles.pageTitle}>Notifications</h1>
        <p className={styles.pageDescription}>
          Product updates, reminders, and legal notices for your account.
        </p>
      </header>

      {pendingLegalNotice ? (
        <PendingLegalNotice notice={pendingLegalNotice} returnTo="/notifications" />
      ) : null}

      <InlineNotice title="Product inbox only" tone="info">
        <p>
          Tutor-student chat stays in the dedicated Messages route so conversation
          traffic does not mix with the bell-style product notification inbox.
        </p>
      </InlineNotice>

      <section className={styles.summaryGrid}>
        <Panel
          description="This inbox is reserved for lifecycle, payout, and legal updates."
          title="Notification summary"
          tone="raised"
        >
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{notifications.length}</p>
              <p className={styles.metricLabel}>Visible product updates</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{unreadCount}</p>
              <p className={styles.metricLabel}>Unread updates</p>
            </div>
            <div className={styles.metricCard}>
              <p className={styles.metricValue}>{legalUpdateCount}</p>
              <p className={styles.metricLabel}>Legal notices retained here</p>
            </div>
          </div>
        </Panel>

        <Panel
          description="The bell surface and chat surface stay intentionally separate in MVP."
          title="Channel rule"
          tone="mist"
        >
          <div className={styles.badgeRow}>
            <StatusBadge tone="info">Bell inbox</StatusBadge>
            <StatusBadge tone="trust">Lifecycle updates</StatusBadge>
            <StatusBadge tone="warning">No chat replay</StatusBadge>
          </div>
          <p className={styles.bodyText}>
            Lesson state, payout, and legal updates stay here. Tutor-student messages
            keep their own unread behavior inside the conversation route.
          </p>
        </Panel>
      </section>

      <Panel
        description="Notifications stay summarized and safe to render without exposing raw lesson or message payloads."
        title="Latest product updates"
      >
        {notifications.length > 0 ? (
          <ul className={styles.list}>
            {notifications.map((notification) => (
              <li className={styles.listItem} key={notification.id}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemCopy}>
                    <h3 className={styles.itemTitle}>{notification.title}</h3>
                    <p className={styles.bodyText}>{notification.bodySummary}</p>
                  </div>
                  <div className={styles.itemMeta}>
                    <StatusBadge tone={getNotificationTypeTone(notification.notificationType)}>
                      {getNotificationTypeLabel(notification.notificationType)}
                    </StatusBadge>
                    <StatusBadge tone={getNotificationStatusTone(notification.notificationStatus)}>
                      {formatNotificationStatus(notification.notificationStatus)}
                    </StatusBadge>
                  </div>
                </div>
                <p className={styles.muted}>
                  {formatUtcDateTime(notification.createdAt, {
                    timezone: account.timezone,
                  })}
                </p>
                {notification.safeHref ? (
                  <div className={styles.actions}>
                    <a className={styles.inlineLink} href={notification.safeHref}>
                      Review related notice
                    </a>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.bodyText}>
              No bell-style product notifications have been generated for this account
              yet.
            </p>
            <p className={styles.muted}>
              Lifecycle and legal items will accumulate here as those flows ship.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function formatNotificationStatus(status: "dismissed" | "read" | "unread") {
  switch (status) {
    case "unread":
      return "Unread";
    case "read":
      return "Read";
    case "dismissed":
      return "Dismissed";
  }
}

function getNotificationStatusTone(status: "dismissed" | "read" | "unread") {
  switch (status) {
    case "unread":
      return "warning";
    case "read":
      return "positive";
    case "dismissed":
      return "info";
  }
}

function getNotificationTypeLabel(
  type:
    | "new_message"
    | "lesson_accepted"
    | "lesson_declined"
    | "lesson_issue_acknowledgement"
    | "lesson_issue_resolution"
    | "lesson_request_expired"
    | "lesson_request_submitted"
    | "lesson_updated"
    | "payout_processed"
    | "policy_notice_updated"
    | "review_submitted"
    | "tutor_application_reviewed"
    | "tutor_application_submitted"
    | "upcoming_lesson_reminder",
) {
  switch (type) {
    case "new_message":
      return "Chat message";
    case "lesson_request_submitted":
      return "Lesson request";
    case "lesson_accepted":
      return "Lesson accepted";
    case "lesson_declined":
      return "Lesson declined";
    case "lesson_request_expired":
      return "Lesson expired";
    case "lesson_updated":
      return "Lesson update";
    case "upcoming_lesson_reminder":
      return "Lesson reminder";
    case "lesson_issue_acknowledgement":
      return "Issue received";
    case "lesson_issue_resolution":
      return "Issue resolved";
    case "review_submitted":
      return "Review activity";
    case "tutor_application_submitted":
      return "Application sent";
    case "tutor_application_reviewed":
      return "Application reviewed";
    case "payout_processed":
      return "Payout update";
    case "policy_notice_updated":
      return "Legal update";
  }
}

function getNotificationTypeTone(
  type:
    | "new_message"
    | "lesson_accepted"
    | "lesson_declined"
    | "lesson_issue_acknowledgement"
    | "lesson_issue_resolution"
    | "lesson_request_expired"
    | "lesson_request_submitted"
    | "lesson_updated"
    | "payout_processed"
    | "policy_notice_updated"
    | "review_submitted"
    | "tutor_application_reviewed"
    | "tutor_application_submitted"
    | "upcoming_lesson_reminder",
) {
  switch (type) {
    case "new_message":
      return "info";
    case "lesson_accepted":
    case "lesson_issue_resolution":
    case "payout_processed":
      return "positive";
    case "lesson_declined":
    case "lesson_request_expired":
    case "policy_notice_updated":
    case "tutor_application_reviewed":
      return "warning";
    case "review_submitted":
    case "tutor_application_submitted":
      return "trust";
    case "lesson_request_submitted":
    case "lesson_updated":
    case "upcoming_lesson_reminder":
    case "lesson_issue_acknowledgement":
      return "info";
  }
}
