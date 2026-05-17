import "server-only";

import { revalidatePath } from "next/cache";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { TutorIntroVideoPublicationStatus } from "@/modules/tutors/constants";
import {
  normalizeIntroVideoUrl,
  VideoProviderValidationError,
} from "@/modules/tutors/video-providers";

const PROFILE_PATH = "/tutor/profile";
const VIDEO_PATH = "/tutor/profile/video";
const OVERVIEW_PATH = "/tutor/overview";
const PUBLIC_PROFILE_PATH = "/tutors/[slug]";

type FieldErrors = Record<string, string[]>;

export type TutorIntroVideoPublicationAction = "publish" | "hide";

export class TutorIntroVideoServiceError extends Error {
  code: string;
  fieldErrors: FieldErrors;

  constructor(
    code: string,
    message: string,
    options: { fieldErrors?: FieldErrors } = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = options.fieldErrors ?? {};
  }
}

type TutorProfileIntroVideoRow = {
  id: string;
  intro_video_provider: string | null;
  intro_video_external_id: string | null;
  intro_video_url: string | null;
  intro_video_publication_status: TutorIntroVideoPublicationStatus;
  intro_video_last_validated_at: string | null;
};

export type TutorIntroVideoMutationResult = {
  tutorProfileId: string;
  providerKey: string;
  externalId: string;
  canonicalWatchUrl: string;
  publicationStatus: TutorIntroVideoPublicationStatus;
  lastValidatedAt: string;
};

export type TutorIntroVideoClearResult = {
  tutorProfileId: string;
  publicationStatus: TutorIntroVideoPublicationStatus;
};

export type TutorIntroVideoPublicationResult = {
  tutorProfileId: string;
  publicationStatus: TutorIntroVideoPublicationStatus;
  action: TutorIntroVideoPublicationAction;
};

export async function setTutorIntroVideo(
  account: Pick<ResolvedAuthAccount, "id">,
  input: { providerUrl: string },
): Promise<TutorIntroVideoMutationResult> {
  const providerUrl =
    typeof input?.providerUrl === "string" ? input.providerUrl : "";

  let normalized;
  try {
    normalized = normalizeIntroVideoUrl(providerUrl);
  } catch (error) {
    if (error instanceof VideoProviderValidationError) {
      throw new TutorIntroVideoServiceError(
        "validation_failed",
        error.message,
        { fieldErrors: { providerUrl: [error.message] } },
      );
    }
    throw error;
  }

  const profile = await loadOwnedProfileRow(account);

  const validatedAt = new Date().toISOString();

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      intro_video_provider: normalized.providerKey,
      intro_video_external_id: normalized.externalId,
      intro_video_url: normalized.canonicalWatchUrl,
      intro_video_last_validated_at: validatedAt,
    })
    .eq("id", profile.id);

  if (error) {
    throw new TutorIntroVideoServiceError(
      "persist_failed",
      "We couldn't save that video link right now. Please try again in a moment.",
    );
  }

  revalidateVideoPaths();

  return {
    tutorProfileId: profile.id,
    providerKey: normalized.providerKey,
    externalId: normalized.externalId,
    canonicalWatchUrl: normalized.canonicalWatchUrl,
    publicationStatus: profile.intro_video_publication_status,
    lastValidatedAt: validatedAt,
  };
}

export async function clearTutorIntroVideo(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<TutorIntroVideoClearResult> {
  const profile = await loadOwnedProfileRow(account);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      intro_video_provider: null,
      intro_video_external_id: null,
      intro_video_url: null,
      intro_video_last_validated_at: null,
      intro_video_publication_status: "hidden",
    })
    .eq("id", profile.id);

  if (error) {
    throw new TutorIntroVideoServiceError(
      "persist_failed",
      "We couldn't clear that video link right now. Please try again in a moment.",
    );
  }

  revalidateVideoPaths();

  return { tutorProfileId: profile.id, publicationStatus: "hidden" };
}

export async function setTutorIntroVideoPublication(
  account: Pick<ResolvedAuthAccount, "id">,
  action: TutorIntroVideoPublicationAction,
): Promise<TutorIntroVideoPublicationResult> {
  const profile = await loadOwnedProfileRow(account);

  if (action === "publish") {
    if (
      !profile.intro_video_external_id ||
      !profile.intro_video_url ||
      !profile.intro_video_external_id.trim() ||
      !profile.intro_video_url.trim()
    ) {
      throw new TutorIntroVideoServiceError(
        "conflict",
        "Add a video link before publishing your intro video.",
      );
    }
  }

  const nextStatus: TutorIntroVideoPublicationStatus =
    action === "publish" ? "published" : "hidden";

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({ intro_video_publication_status: nextStatus })
    .eq("id", profile.id);

  if (error) {
    throw new TutorIntroVideoServiceError(
      "persist_failed",
      action === "publish"
        ? "We couldn't publish that video right now. Please try again in a moment."
        : "We couldn't hide that video right now. Please try again in a moment.",
    );
  }

  revalidatePublicationPaths();

  return { tutorProfileId: profile.id, publicationStatus: nextStatus, action };
}

// --- internals -----------------------------------------------------------

async function loadOwnedProfileRow(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<TutorProfileIntroVideoRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "id, intro_video_provider, intro_video_external_id, intro_video_url, intro_video_publication_status, intro_video_last_validated_at",
    )
    .eq("app_user_id", account.id)
    .maybeSingle<TutorProfileIntroVideoRow>();

  if (error) {
    throw new TutorIntroVideoServiceError(
      "persist_failed",
      "We couldn't load your tutor profile. Please try again in a moment.",
    );
  }
  if (!data) {
    throw new TutorIntroVideoServiceError(
      "not_found",
      "Your tutor profile is not available yet.",
    );
  }
  return data;
}

function revalidateVideoPaths(): void {
  revalidatePath(PROFILE_PATH);
  revalidatePath(VIDEO_PATH);
}

function revalidatePublicationPaths(): void {
  revalidateVideoPaths();
  revalidatePath(PUBLIC_PROFILE_PATH, "page");
  revalidatePath(OVERVIEW_PATH);
}
