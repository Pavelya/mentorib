import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { Panel } from "@/components/ui";
import { buildAccountRoleBadges } from "@/modules/accounts/role-badges";
import { getSharedAccountRouteContext } from "@/modules/accounts/shared-account";
import { loadDiscoveryOptions } from "@/modules/reference/discovery";

import styles from "../account-surfaces.module.css";
import { SettingsProfileForm } from "./settings-form";

export default async function SettingsPage() {
  const context = await getSharedAccountRouteContext("/settings");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const { account, pendingLegalNotice } = context;
  const roleBadges = buildAccountRoleBadges(account);
  const optionsByField = await loadDiscoveryOptions();
  const languageOptions = optionsByField.languageCode;
  const initialPreferredLanguageCode = resolveInitialPreferredLanguageCode(
    account.preferred_language_code,
    languageOptions,
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageIntro}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageDescription}>Manage your Mentor IB account.</p>
      </header>

      {pendingLegalNotice ? (
        <PendingLegalNotice notice={pendingLegalNotice} returnTo="/settings" />
      ) : null}

      <section className={styles.settingsLayout}>
        <Panel title="Profile" tone="raised">
          <SettingsProfileForm
            avatarUrl={account.avatar_url ?? undefined}
            email={account.email}
            initialFullName={account.full_name?.trim() ?? ""}
            initialPreferredLanguageCode={initialPreferredLanguageCode}
            languageOptions={languageOptions}
            roleBadges={roleBadges}
            timezone={account.timezone}
          />
        </Panel>
      </section>
    </div>
  );
}

function resolveInitialPreferredLanguageCode(
  preferredLanguageCode: string | null,
  languageOptions: readonly { value: string }[],
) {
  if (
    preferredLanguageCode &&
    languageOptions.some((option) => option.value === preferredLanguageCode)
  ) {
    return preferredLanguageCode;
  }

  return (
    languageOptions.find((option) => option.value === "en")?.value ??
    languageOptions[0]?.value ??
    ""
  );
}
