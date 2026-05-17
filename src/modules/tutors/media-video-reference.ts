import "server-only";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  tutorIntroVideoPublicationStatuses,
  type TutorIntroVideoPublicationStatus,
} from "@/modules/tutors/constants";
import { getVideoProviderAdapter } from "@/modules/tutors/video-providers";

export type TutorIntroVideoState = {
  providerKey: string;
  externalId: string;
  canonicalWatchUrl: string;
  canonicalEmbedUrl: string;
  publicationStatus: TutorIntroVideoPublicationStatus;
  lastValidatedAt: string | null;
};

export type TutorIntroVideoEditorDto = {
  tutorProfileId: string;
  introVideo: TutorIntroVideoState | null;
  publicationStatus: TutorIntroVideoPublicationStatus;
  lastValidatedAt: string | null;
};

type TutorProfileIntroVideoRow = {
  id: string;
  intro_video_provider: string | null;
  intro_video_external_id: string | null;
  intro_video_url: string | null;
  intro_video_publication_status: TutorIntroVideoPublicationStatus;
  intro_video_last_validated_at: string | null;
};

export async function getTutorIntroVideoForOwner(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<TutorIntroVideoEditorDto | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "id, intro_video_provider, intro_video_external_id, intro_video_url, intro_video_publication_status, intro_video_last_validated_at",
    )
    .eq("app_user_id", account.id)
    .maybeSingle<TutorProfileIntroVideoRow>();

  if (error) {
    throw new Error("Could not load the tutor profile for intro video.");
  }

  if (!data) {
    return null;
  }

  const publicationStatus = assertPublicationStatus(
    data.intro_video_publication_status,
  );

  return {
    tutorProfileId: data.id,
    introVideo: mapIntroVideoState(data, publicationStatus),
    publicationStatus,
    lastValidatedAt: data.intro_video_last_validated_at,
  };
}

function mapIntroVideoState(
  row: TutorProfileIntroVideoRow,
  publicationStatus: TutorIntroVideoPublicationStatus,
): TutorIntroVideoState | null {
  const providerKey = row.intro_video_provider?.trim() ?? "";
  const externalId = row.intro_video_external_id?.trim() ?? "";
  if (!providerKey || !externalId) {
    return null;
  }

  const adapter = getVideoProviderAdapter(providerKey);
  // The stored canonical watch URL is preferred; if it's missing or
  // the adapter is no longer registered, fall back to re-deriving from
  // the externalId via the adapter's parser. If neither path yields a
  // canonical URL, omit the reference rather than returning a partial
  // one, since the public surface depends on having both.
  const storedWatch = row.intro_video_url?.trim() ?? "";

  let canonicalWatchUrl = storedWatch;
  let canonicalEmbedUrl = "";

  if (adapter) {
    const derivedFromStored = storedWatch
      ? adapter.parseUrl(storedWatch)
      : null;
    if (derivedFromStored) {
      canonicalWatchUrl = derivedFromStored.canonicalWatchUrl;
      canonicalEmbedUrl = derivedFromStored.canonicalEmbedUrl;
    }
  }

  if (!canonicalWatchUrl || !canonicalEmbedUrl) {
    return null;
  }

  void publicationStatus;

  return {
    providerKey,
    externalId,
    canonicalWatchUrl,
    canonicalEmbedUrl,
    publicationStatus,
    lastValidatedAt: row.intro_video_last_validated_at,
  };
}

function assertPublicationStatus(
  value: string,
): TutorIntroVideoPublicationStatus {
  if ((tutorIntroVideoPublicationStatuses as readonly string[]).includes(value)) {
    return value as TutorIntroVideoPublicationStatus;
  }
  throw new Error(`Unexpected intro_video_publication_status value: ${value}`);
}
