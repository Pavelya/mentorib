import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  Chip,
  InlineNotice,
  Panel,
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
import { getTutorIntroVideoForOwner } from "@/modules/tutors/media-video-reference";
import { getTutorProfileEditor } from "@/modules/tutors/tutor-profile-editor";
import { videoProviderRegistry } from "@/modules/tutors/video-providers";

import { IntroVideoManager } from "./video-manager";
import styles from "./video.module.css";

const VIDEO_PATH = "/tutor/profile/video" as const;
const APPLY_PATH = "/tutor/apply" as const;

export default async function TutorProfileVideoPage() {
  if (!isSupabaseAuthConfigured()) {
    return (
      <article className={styles.page}>
        <InlineNotice title="Intro video preview" tone="info">
          <p>
            Live intro-video management connects once Supabase auth is configured.
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
    redirect(buildAuthSignInPath(VIDEO_PATH) as Route);
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
        <InlineNotice title="Intro video unavailable" tone="warning">
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
          <p>This account cannot manage the tutor intro video right now.</p>
        </InlineNotice>
      </article>
    );
  }

  const canAccessProfile =
    hasRole(account, "tutor", ["active", "pending"]) ||
    account.primary_role_context === "tutor";

  if (!canAccessProfile) {
    redirect(buildPostSignInRedirect(account, VIDEO_PATH) as Route);
  }

  const editor = await getTutorProfileEditor(account);

  if (
    editor.state === "no_profile" ||
    editor.applicationStatus !== "approved"
  ) {
    redirect(APPLY_PATH);
  }

  const video = await getTutorIntroVideoForOwner(account);

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Trust &amp; media</p>
        <h1 className={styles.title}>Intro video</h1>
        <p className={styles.description}>
          Paste a link to a short intro video. We embed it on your public
          profile so students can hear how you explain things.
        </p>
        <Link className={styles.backLink} href={"/tutor/profile" as Route}>
          ← Back to your profile
        </Link>
      </header>

      <Section
        density="default"
        eyebrow="Supported providers"
        title="Where to host your video"
        titleAs="h2"
      >
        <p className={styles.helperText}>
          Use a public, unlisted, or private link from one of the supported
          providers. We validate the link, store only its identifier, and embed
          the canonical player on your profile.
        </p>
        <div className={styles.providerRow}>
          {videoProviderRegistry.map((adapter) => (
            <Chip key={adapter.provider_key} size="compact" tone="info">
              {adapter.displayName}
            </Chip>
          ))}
        </div>
      </Section>

      <Panel eyebrow="Manage" tone="default">
        <IntroVideoManager
          embed={
            video?.introVideo
              ? {
                  canonicalEmbedUrl: video.introVideo.canonicalEmbedUrl,
                  canonicalWatchUrl: video.introVideo.canonicalWatchUrl,
                  providerKey: video.introVideo.providerKey,
                }
              : null
          }
          publicationStatus={video?.publicationStatus ?? "hidden"}
        />
      </Panel>
    </article>
  );
}
