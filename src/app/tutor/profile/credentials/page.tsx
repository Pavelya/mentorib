import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  InlineNotice,
  Section,
} from "@/components/ui";
import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
} from "@/modules/reference/catalog";
import { getTutorCredentialsForOwner } from "@/modules/tutors/media-credentials";
import { getTutorProfileEditor } from "@/modules/tutors/tutor-profile-editor";

import styles from "./credentials.module.css";
import { CredentialsManager } from "./credentials-manager";

const CREDENTIALS_PATH = "/tutor/profile/credentials" as const;
const APPLY_PATH = "/tutor/apply" as const;

export default async function TutorProfileCredentialsPage() {
  if (!isSupabaseAuthConfigured()) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Credentials preview" tone="info">
          <p>
            Live credential management connects once Supabase auth is configured.
          </p>
        </InlineNotice>
      </article>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(CREDENTIALS_PATH) as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;
  try {
    account = await ensureAuthAccount(user);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Credentials unavailable" tone="warning">
          <p>
            We could not load your account context. Refresh the page or sign in
            again to continue.
          </p>
        </InlineNotice>
      </article>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Account access limited" tone="warning">
          <p>This account cannot manage tutor credentials right now.</p>
        </InlineNotice>
      </article>
    );
  }

  const canAccessProfile =
    hasRole(account, "tutor", ["active", "pending"]) ||
    account.primary_role_context === "tutor";

  if (!canAccessProfile) {
    redirect(buildPostSignInRedirect(account, CREDENTIALS_PATH) as Route);
  }

  const editor = await getTutorProfileEditor(account);

  if (
    editor.state === "no_profile" ||
    editor.applicationStatus !== "approved"
  ) {
    redirect(APPLY_PATH);
  }

  const [credentials, subjects, focusAreas] = await Promise.all([
    getTutorCredentialsForOwner(account),
    loadActiveReferenceSubjects(),
    loadActiveReferenceSubjectFocusAreas(),
  ]);

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Trust &amp; media</p>
        <h1 className={styles.title}>Credentials</h1>
        <p className={styles.description}>
          Upload teaching qualifications, examiner certificates, and degree
          evidence. Approved credentials become public trust proof on your
          profile — the raw files stay private.
        </p>
        <Link className={styles.backLink} href={"/tutor/profile" as Route}>
          ← Back to your profile
        </Link>
      </header>

      <Section
        density="default"
        eyebrow="Why this matters"
        title="What students see"
        titleAs="h2"
      >
        <p className={styles.description}>
          Mentor IB never publishes credential files. Once a reviewer approves a
          credential, the public profile shows a derived line such as &ldquo;IB
          examiner — Mathematics&rdquo; — no document, no images.
        </p>
      </Section>

      <CredentialsManager
        credentials={credentials?.credentials ?? []}
        focusAreas={focusAreas.map((focusArea) => ({
          id: focusArea.id,
          label: focusArea.displayName,
        }))}
        subjects={subjects.map((subject) => ({
          id: subject.id,
          label: subject.displayName,
        }))}
      />
    </article>
  );
}
