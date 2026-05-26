import type { Route } from "next";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import {
  Button,
  Card,
  InlineNotice,
  Panel,
  StatusBadge,
  TabBar,
} from "@/components/ui";
import { formatUtcDateTime } from "@/lib/datetime/format";
import { hasRole } from "@/modules/accounts/account-state";
import {
  getSharedAccountRouteContext,
  listAccountNotifications,
} from "@/modules/accounts/shared-account";
import type { NotificationAudienceRole } from "@/modules/notifications/constants";
import {
  getNotificationTypeLabel,
  getNotificationTypeTone,
} from "@/modules/notifications/labels";
import { getNotificationPreferenceSnapshot } from "@/modules/notifications/preferences";

import {
  markAllNotificationsReadAction,
  setNotificationStatusAction,
} from "./actions";
import { NotificationPreferencesForm } from "./notification-preferences-form";
import styles from "../account-surfaces.module.css";

type NotificationsTab = "inbox" | "preferences";

type NotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function resolveTab(value: string | string[] | undefined): NotificationsTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "preferences" ? "preferences" : "inbox";
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const context = await getSharedAccountRouteContext("/notifications");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const resolvedSearchParams = await searchParams;
  const activeTab = resolveTab(resolvedSearchParams.tab);
  const { account, pendingLegalNotice } = context;

  const isStudent = hasRole(account, "student");
  const isTutor = hasRole(account, "tutor");
  const activeRole = resolveActiveRole(account, { isStudent, isTutor });

  const inboxHref = "/notifications" as Route;
  const preferencesHref = "/notifications?tab=preferences" as Route;

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <h1 className={styles.pageTitle}>Notifications</h1>
        <p className={styles.pageDescription}>
          Product updates, reminders, and legal notices for your account.
        </p>
      </header>

      {pendingLegalNotice ? (
        <PendingLegalNotice
          notice={pendingLegalNotice}
          returnTo={activeTab === "preferences" ? "/notifications?tab=preferences" : "/notifications"}
        />
      ) : null}

      <TabBar
        activeId={activeTab}
        ariaLabel="Notifications sections"
        items={[
          { id: "inbox", label: "Inbox", href: inboxHref },
          { id: "preferences", label: "Preferences", href: preferencesHref },
        ]}
      />

      {activeTab === "inbox" ? (
        <InboxTab
          accountId={account.id}
          accountTimezone={account.timezone}
          activeRole={activeRole}
        />
      ) : (
        <PreferencesTab
          accountId={account.id}
          activeRole={activeRole}
          isStudent={isStudent}
          isTutor={isTutor}
        />
      )}
    </div>
  );
}

function resolveActiveRole(
  account: ResolvedAuthAccount,
  presence: { isStudent: boolean; isTutor: boolean },
): NotificationAudienceRole {
  if (account.primary_role_context === "tutor" && presence.isTutor) {
    return "tutor";
  }
  if (account.primary_role_context === "student" && presence.isStudent) {
    return "student";
  }
  if (presence.isStudent) {
    return "student";
  }
  return "tutor";
}

async function InboxTab({
  accountId,
  accountTimezone,
  activeRole,
}: {
  accountId: string;
  accountTimezone: string;
  activeRole: NotificationAudienceRole;
}) {
  const notifications = await listAccountNotifications(accountId);
  const unreadCount = notifications.filter((item) => item.notificationStatus === "unread").length;
  const legalUpdateCount = notifications.filter(
    (item) => item.notificationType === "policy_notice_updated",
  ).length;

  return (
    <>
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
            <Card>
              <p className={styles.metricValue}>{notifications.length}</p>
              <p className={styles.metricLabel}>Visible product updates</p>
            </Card>
            <Card>
              <p className={styles.metricValue}>{unreadCount}</p>
              <p className={styles.metricLabel}>Unread updates</p>
            </Card>
            <Card>
              <p className={styles.metricValue}>{legalUpdateCount}</p>
              <p className={styles.metricLabel}>Legal notices retained here</p>
            </Card>
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
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction} className={styles.actions}>
            <Button size="compact" type="submit" variant="secondary">
              Mark all as read
            </Button>
          </form>
        ) : null}
        {notifications.length > 0 ? (
          <div className={styles.list}>
            {notifications.map((notification) => (
              <Card key={notification.id}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemCopy}>
                    <h3 className={styles.itemTitle}>{notification.title}</h3>
                    <p className={styles.bodyText}>{notification.bodySummary}</p>
                  </div>
                  <div className={styles.itemMeta}>
                    <StatusBadge tone={getNotificationTypeTone(notification.notificationType)}>
                      {getNotificationTypeLabel(notification.notificationType, activeRole)}
                    </StatusBadge>
                    <StatusBadge tone={getNotificationStatusTone(notification.notificationStatus)}>
                      {formatNotificationStatus(notification.notificationStatus)}
                    </StatusBadge>
                  </div>
                </div>
                <p className={styles.muted}>
                  {formatUtcDateTime(notification.createdAt, {
                    timezone: accountTimezone,
                  })}
                </p>
                <div className={styles.actions}>
                  {notification.safeHref ? (
                    <a className={styles.inlineLink} href={notification.safeHref}>
                      Review related notice
                    </a>
                  ) : null}
                  {notification.notificationStatus === "unread" ? (
                    <form action={setNotificationStatusAction}>
                      <input
                        name="notificationId"
                        type="hidden"
                        value={notification.id}
                      />
                      <input name="nextStatus" type="hidden" value="read" />
                      <Button size="compact" type="submit" variant="ghost">
                        Mark as read
                      </Button>
                    </form>
                  ) : null}
                  {notification.notificationStatus !== "dismissed" ? (
                    <form action={setNotificationStatusAction}>
                      <input
                        name="notificationId"
                        type="hidden"
                        value={notification.id}
                      />
                      <input name="nextStatus" type="hidden" value="dismissed" />
                      <Button size="compact" type="submit" variant="ghost">
                        Dismiss
                      </Button>
                    </form>
                  ) : (
                    <form action={setNotificationStatusAction}>
                      <input
                        name="notificationId"
                        type="hidden"
                        value={notification.id}
                      />
                      <input name="nextStatus" type="hidden" value="unread" />
                      <Button size="compact" type="submit" variant="ghost">
                        Restore
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.bodyText}>
              No bell-style product updates yet — lifecycle and legal items will
              appear here as soon as they happen.
            </p>
            <p className={styles.muted}>
              The bell inbox stays separate from the Messages route by design.
            </p>
          </div>
        )}
      </Panel>
    </>
  );
}

async function PreferencesTab({
  accountId,
  activeRole,
  isStudent,
  isTutor,
}: {
  accountId: string;
  activeRole: NotificationAudienceRole;
  isStudent: boolean;
  isTutor: boolean;
}) {
  const snapshot = await getNotificationPreferenceSnapshot(accountId);

  return (
    <Panel
      description="Choose which optional notifications reach you, and how. Critical lifecycle notifications keep sending so booking and payment events never go silent."
      title="Notification preferences"
      tone="raised"
    >
      <NotificationPreferencesForm
        activeRole={activeRole}
        initialSnapshot={snapshot}
        isStudent={isStudent}
        isTutor={isTutor}
      />
    </Panel>
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
