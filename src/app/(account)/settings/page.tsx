import Link from "next/link";

import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { Avatar, Panel, StatusBadge } from "@/components/ui";
import { getSharedAccountRouteContext } from "@/modules/accounts/shared-account";

import styles from "../account-surfaces.module.css";

const accountLinks = [
  {
    description: "Review lesson, payout, and legal updates in one inbox.",
    href: "/notifications",
    title: "Notifications",
  },
  {
    description: "See privacy information and open required policy updates.",
    href: "/privacy",
    title: "Privacy & legal",
  },
  {
    description: "Check learner payment history. Tutor payouts stay in earnings.",
    href: "/billing",
    title: "Billing",
  },
] as const;

export default async function SettingsPage() {
  const context = await getSharedAccountRouteContext("/settings");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const { account, pendingLegalNotice } = context;
  const activeRoles = account.roles.filter((role) => role.role_status !== "revoked");
  const displayName = account.full_name?.trim() || "Account owner";

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageDescription}>
          Manage your account details and default preferences.
        </p>
      </header>

      {pendingLegalNotice ? (
        <PendingLegalNotice notice={pendingLegalNotice} returnTo="/settings" />
      ) : null}

      <section className={styles.settingsLayout}>
        <div className={styles.primaryStack}>
          <Panel
            description="Your basic profile details and defaults."
            title="Profile"
            tone="raised"
          >
            <div className={styles.identityRow}>
              <Avatar name={displayName} size="lg" src={account.avatar_url ?? undefined} />
              <div className={styles.identityCopy}>
                <h2 className={styles.detailValue}>{displayName}</h2>
                <p className={styles.muted}>{account.email}</p>
                <div className={styles.badgeRow}>
                  <StatusBadge tone={getAccountStatusTone(account.account_status)}>
                    {formatAccountStatus(account.account_status)}
                  </StatusBadge>
                  {account.primary_role_context ? (
                    <StatusBadge tone="info">
                      {formatRoleLabel(account.primary_role_context)}
                    </StatusBadge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.settingsList}>
              {buildSettingRows(account, displayName).map((item) => (
                <div className={styles.settingRow} key={item.label}>
                  <div className={styles.settingCopy}>
                    <p className={styles.settingLabel}>{item.label}</p>
                    <p className={styles.settingValue}>{item.value}</p>
                    <p className={styles.settingHint}>{item.hint}</p>
                  </div>
                  {item.meta ? <p className={styles.settingMeta}>{item.meta}</p> : null}
                </div>
              ))}
            </div>

            <p className={styles.sectionNote}>
              Name and language editing are coming next. Timezone is detected automatically.
            </p>
          </Panel>
        </div>

        <aside className={styles.sideStack}>
          <Panel
            description="Your access and current account state."
            title="Account status"
            tone="mist"
          >
            <div className={styles.statusList}>
              <div className={styles.statusRow}>
                <div className={styles.statusCopy}>
                  <p className={styles.statusLabel}>Status</p>
                  <p className={styles.statusValue}>
                    {formatAccountStatus(account.account_status)}
                  </p>
                  <p className={styles.statusHint}>
                    Shared account pages stay available here.
                  </p>
                </div>
              </div>

              <div className={styles.statusRow}>
                <div className={styles.statusCopy}>
                  <p className={styles.statusLabel}>Role access</p>
                  {activeRoles.length > 0 ? (
                    <div className={styles.badgeRow}>
                      {activeRoles.map((role) => (
                        <StatusBadge
                          key={`${role.role}-${role.role_status}`}
                          tone={getRoleStatusTone(role.role_status)}
                        >
                          {formatRoleLabel(role.role)} · {formatRoleStatus(role.role_status)}
                        </StatusBadge>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.statusValue}>Role selection pending</p>
                  )}
                </div>
              </div>

              <div className={styles.statusRow}>
                <div className={styles.statusCopy}>
                  <p className={styles.statusLabel}>Setup</p>
                  <p className={styles.statusValue}>
                    {formatOnboardingState(account.onboarding_state)}
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            description="Other pages people typically expect inside account settings."
            title="More"
          >
            <ul className={styles.shortcutList}>
              {accountLinks.map((route) => (
                <li className={styles.shortcutItem} key={route.href}>
                  <div className={styles.shortcutCopy}>
                    <h3 className={styles.shortcutTitle}>{route.title}</h3>
                    <p className={styles.shortcutDescription}>{route.description}</p>
                  </div>
                  <Link className={styles.shortcutLink} href={route.href}>
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function buildSettingRows(
  account: {
    email: string;
    preferred_language_code: string | null;
    timezone: string;
  },
  displayName: string,
) {
  return [
    {
      hint: "Shown on your shared account profile.",
      label: "Name",
      meta: "Editable soon",
      value: displayName,
    },
    {
      hint: "Used for sign-in and important account updates.",
      label: "Email",
      meta: null,
      value: account.email,
    },
    {
      hint: "Used when language preferences become available.",
      label: "Preferred language",
      meta: account.preferred_language_code ? null : "Not set",
      value: account.preferred_language_code?.toUpperCase() ?? "English (default)",
    },
    {
      hint: "Detected automatically from your device and sign-in flow.",
      label: "Timezone",
      meta: "Automatic",
      value: account.timezone,
    },
  ] as const;
}

function formatAccountStatus(status: "active" | "closed" | "limited" | "suspended") {
  switch (status) {
    case "active":
      return "Active";
    case "limited":
      return "Limited";
    case "suspended":
      return "Suspended";
    case "closed":
      return "Closed";
  }
}

function getAccountStatusTone(status: "active" | "closed" | "limited" | "suspended") {
  switch (status) {
    case "active":
      return "positive";
    case "limited":
      return "warning";
    case "suspended":
    case "closed":
      return "destructive";
  }
}

function formatOnboardingState(
  state: "completed" | "role_pending" | "student_setup" | "tutor_application_started",
) {
  switch (state) {
    case "role_pending":
      return "Role selection pending";
    case "student_setup":
      return "Student setup in progress";
    case "tutor_application_started":
      return "Tutor application in progress";
    case "completed":
      return "Setup complete";
  }
}

function formatRoleLabel(role: "admin" | "student" | "tutor") {
  switch (role) {
    case "student":
      return "Student";
    case "tutor":
      return "Tutor";
    case "admin":
      return "Admin";
  }
}

function formatRoleStatus(roleStatus: "active" | "pending" | "revoked" | "suspended") {
  switch (roleStatus) {
    case "active":
      return "Active";
    case "pending":
      return "Pending";
    case "suspended":
      return "Suspended";
    case "revoked":
      return "Revoked";
  }
}

function getRoleStatusTone(roleStatus: "active" | "pending" | "revoked" | "suspended") {
  switch (roleStatus) {
    case "active":
      return "positive";
    case "pending":
      return "warning";
    case "suspended":
    case "revoked":
      return "destructive";
  }
}
