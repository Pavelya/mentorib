import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  InlineNotice,
  Panel,
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
import { getTutorPublicMediaForOwner } from "@/modules/tutors/media-public-assets";
import { getTutorProfileEditor } from "@/modules/tutors/tutor-profile-editor";

import { ProfilePhotoManager } from "./photo-manager";
import styles from "./photo.module.css";

const PHOTO_PATH = "/tutor/profile/photo" as const;
const APPLY_PATH = "/tutor/apply" as const;

export default async function TutorProfilePhotoPage() {
  if (!isSupabaseAuthConfigured()) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Profile photo preview" tone="info">
          <p>
            Live photo management connects once Supabase auth is configured.
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
    redirect(buildAuthSignInPath(PHOTO_PATH) as Route);
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
        <InlineNotice title="Photo management unavailable" tone="warning">
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
          <p>This account cannot manage the tutor profile photo right now.</p>
        </InlineNotice>
      </article>
    );
  }

  const canAccessProfile =
    hasRole(account, "tutor", ["active", "pending"]) ||
    account.primary_role_context === "tutor";

  if (!canAccessProfile) {
    redirect(buildPostSignInRedirect(account, PHOTO_PATH) as Route);
  }

  const editor = await getTutorProfileEditor(account);

  if (
    editor.state === "no_profile" ||
    editor.applicationStatus !== "approved"
  ) {
    redirect(APPLY_PATH);
  }

  const media = await getTutorPublicMediaForOwner(account);
  const photo = media?.profilePhoto ?? null;
  const displayName = editor.draft.fullName.trim() || "Tutor";

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Trust &amp; media</p>
        <h1 className={styles.title}>Profile photo</h1>
        <p className={styles.description}>
          A clear photo helps students recognise you. Mentor IB shows your
          published photo on your public profile and search results.
        </p>
      </header>

      <Panel eyebrow="Manage" tone="default">
        <ProfilePhotoManager
          accountAvatarUrl={account.avatar_url ?? null}
          displayName={displayName}
          photo={
            photo
              ? {
                  altText: photo.altText,
                  publicationStatus: photo.publicationStatus,
                  publicUrl: photo.publicUrl,
                }
              : null
          }
        />
      </Panel>
    </article>
  );
}
