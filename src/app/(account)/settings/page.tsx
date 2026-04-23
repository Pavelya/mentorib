import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { Avatar, Panel, StatusBadge } from "@/components/ui";
import { getMatchOptionLabel } from "@/modules/lessons/match-flow-options";
import { getSharedAccountRouteContext } from "@/modules/accounts/shared-account";

import styles from "../account-surfaces.module.css";

export default async function SettingsPage() {
  const context = await getSharedAccountRouteContext("/settings");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const { account, pendingLegalNotice } = context;
  const displayName = account.full_name?.trim() || "Account owner";
  const roleBadges = buildRoleBadges(account);

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageDescription}>
          Manage the basics for your account and lesson preferences.
        </p>
      </header>

      {pendingLegalNotice ? (
        <PendingLegalNotice notice={pendingLegalNotice} returnTo="/settings" />
      ) : null}

      <section className={styles.settingsLayout}>
        <Panel
          description="The main details connected to your account."
          title="Profile"
          tone="raised"
        >
          <div className={styles.identityRow}>
            <Avatar
              className={styles.profileAvatar}
              name={displayName}
              size="lg"
              src={account.avatar_url ?? undefined}
            />
            <div className={styles.identityCopy}>
              <div className={styles.identityHeadingRow}>
                <h2 className={styles.detailValue}>{displayName}</h2>
                {roleBadges.length > 0 ? (
                  <div className={styles.identityBadges}>
                    {roleBadges.map((badge) => (
                      <StatusBadge key={badge.label} tone={badge.tone}>
                        {badge.label}
                      </StatusBadge>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className={styles.muted}>{account.email}</p>
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
            Editing options will be added soon. Timezone updates automatically.
          </p>
        </Panel>
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
      hint: "Your display name in Mentor IB.",
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
      hint: "For lessons and study preferences, not the app interface.",
      label: "Preferred lesson language",
      meta: null,
      value: account.preferred_language_code
        ? getMatchOptionLabel("languageCode", account.preferred_language_code)
        : "Not set yet",
    },
    {
      hint: "Detected automatically from your device and sign-in flow.",
      label: "Timezone",
      meta: "Automatic",
      value: account.timezone,
    },
  ] as const;
}

function buildRoleBadges(account: {
  primary_role_context: "admin" | "student" | "tutor" | null;
  roles: readonly {
    role: "admin" | "student" | "tutor";
    role_status: "active" | "pending" | "revoked" | "suspended";
  }[];
}) {
  const visibleRoles = account.roles.filter((role) => role.role_status !== "revoked");

  if (visibleRoles.length === 0) {
    if (account.primary_role_context === "student") {
      return [{ label: "Student", tone: "info" }] as const;
    }

    if (account.primary_role_context === "tutor") {
      return [{ label: "Tutor", tone: "info" }] as const;
    }

    return [] as const;
  }

  return visibleRoles.map((role) => {
    if (role.role === "student") {
      return {
        label: role.role_status === "pending" ? "Student setup" : "Student",
        tone: getRoleTone(role.role_status),
      } as const;
    }

    if (role.role === "tutor") {
      return {
        label: role.role_status === "pending" ? "Tutor application" : "Tutor",
        tone: getRoleTone(role.role_status),
      } as const;
    }

    return {
      label: "Admin",
      tone: getRoleTone(role.role_status),
    } as const;
  });
}

function getRoleTone(
  roleStatus: "active" | "pending" | "revoked" | "suspended",
) {
  switch (roleStatus) {
    case "active":
      return "trust";
    case "pending":
      return "warning";
    case "revoked":
    case "suspended":
      return "destructive";
  }
}
