import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { Avatar, Panel } from "@/components/ui";
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
            <Avatar name={displayName} size="lg" src={account.avatar_url ?? undefined} />
            <div className={styles.identityCopy}>
              <h2 className={styles.detailValue}>{displayName}</h2>
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
