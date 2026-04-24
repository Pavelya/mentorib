import { AccountRouteState } from "@/components/account/account-route-state";
import { PendingLegalNotice } from "@/components/account/pending-legal-notice";
import { Panel } from "@/components/ui";
import { getSharedAccountRouteContext } from "@/modules/accounts/shared-account";
import { loadMatchFlowOptions } from "@/modules/lessons/match-flow-reference";

import styles from "../account-surfaces.module.css";
import { SettingsProfileForm } from "./settings-form";

export default async function SettingsPage() {
  const context = await getSharedAccountRouteContext("/settings");

  if (context.status !== "ready") {
    return <AccountRouteState status={context.status} />;
  }

  const { account, pendingLegalNotice } = context;
  const roleBadges = buildRoleBadges(account);
  const optionsByField = await loadMatchFlowOptions();
  const languageOptions = optionsByField.languageCode;
  const initialPreferredLanguageCode = resolveInitialPreferredLanguageCode(
    account.preferred_language_code,
    languageOptions,
  );

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
          description="Update the main details connected to your account."
          title="Profile"
          tone="raised"
        >
          <SettingsProfileForm
            avatarUrl={account.avatar_url ?? undefined}
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
