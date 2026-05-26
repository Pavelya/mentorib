import type { Route } from "next";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import {
  Button,
  Card,
  Chip,
  Panel,
  StatusBadge,
  TabBar,
} from "@/components/ui";
import { formatUtcDateTime } from "@/lib/datetime/format";
import { hasRole } from "@/modules/accounts/account-state";
import type { AccountNotificationDto } from "@/modules/accounts/shared-account";
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

  const notifications =
    activeTab === "inbox" ? await listAccountNotifications(account.id) : null;
  const unreadCount =
    notifications?.filter((item) => item.notificationStatus === "unread")
      .length ?? 0;

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>Notifications</h1>
          {activeTab === "inbox" && unreadCount > 0 ? (
            <Chip size="compact" tone="warning">
              {unreadCount} unread
            </Chip>
          ) : null}
        </div>
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
          accountTimezone={account.timezone}
          activeRole={activeRole}
          notifications={notifications ?? []}
          unreadCount={unreadCount}
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

function InboxTab({
  accountTimezone,
  activeRole,
  notifications,
  unreadCount,
}: {
  accountTimezone: string;
  activeRole: NotificationAudienceRole;
  notifications: AccountNotificationDto[];
  unreadCount: number;
}) {
  if (notifications.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.itemTitle}>No notifications yet</h2>
        <p className={styles.bodyText}>
          Lesson, payment, and legal updates will appear here as soon as they
          happen.
        </p>
      </div>
    );
  }

  return (
    <>
      {unreadCount > 0 ? (
        <form action={markAllNotificationsReadAction} className={styles.actions}>
          <Button size="compact" type="submit" variant="secondary">
            Mark all as read
          </Button>
        </form>
      ) : null}
      <div className={styles.list}>
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            selected={notification.notificationStatus === "unread"}
          >
            <div className={styles.itemHeader}>
              <div className={styles.itemCopy}>
                <h3 className={styles.itemTitle}>{notification.title}</h3>
                <p className={styles.bodyText}>{notification.bodySummary}</p>
              </div>
              <div className={styles.itemMeta}>
                <StatusBadge
                  tone={getNotificationTypeTone(notification.notificationType)}
                >
                  {getNotificationTypeLabel(
                    notification.notificationType,
                    activeRole,
                  )}
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
