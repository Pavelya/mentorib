import "server-only";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  tutorPublicMediaPublicationStatuses,
  tutorPublicMediaRoles,
  type TutorPublicMediaPublicationStatus,
  type TutorPublicMediaRole,
} from "@/modules/tutors/constants";

export const TUTOR_PUBLIC_MEDIA_BUCKET = "tutor-public-media" as const;

export type TutorProfilePhotoState = {
  assetId: string;
  mediaRole: TutorPublicMediaRole;
  storageObjectPath: string;
  altText: string | null;
  publicationStatus: TutorPublicMediaPublicationStatus;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TutorPublicMediaEditorDto = {
  tutorProfileId: string;
  profilePhoto: TutorProfilePhotoState | null;
};

type TutorProfileLookupRow = {
  id: string;
};

type TutorPublicMediaAssetDbRow = {
  id: string;
  media_role: TutorPublicMediaRole;
  storage_object_path: string;
  alt_text: string | null;
  publication_status: TutorPublicMediaPublicationStatus;
  created_at: string;
  updated_at: string;
};

export async function getTutorPublicMediaForOwner(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<TutorPublicMediaEditorDto | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: profile, error: profileError } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("app_user_id", account.id)
    .maybeSingle<TutorProfileLookupRow>();

  if (profileError) {
    throw new Error("Could not load the tutor profile for public media.");
  }

  if (!profile) {
    return null;
  }

  const { data, error } = await supabase
    .from("tutor_public_media_assets")
    .select(
      "id, media_role, storage_object_path, alt_text, publication_status, created_at, updated_at",
    )
    .eq("tutor_profile_id", profile.id)
    .eq("media_role", "profile_photo")
    .order("created_at", { ascending: false })
    .returns<TutorPublicMediaAssetDbRow[]>();

  if (error) {
    throw new Error("Could not load tutor public media.");
  }

  const rows = data ?? [];
  const photoRow = rows[0] ?? null;

  return {
    tutorProfileId: profile.id,
    profilePhoto: photoRow ? mapPhotoRow(photoRow) : null,
  };
}

// Listing-readiness gate 2 ("real profile photo") asks only whether the tutor
// currently has a published profile photo; this thin projection returns just
// that boolean so callers do not have to load the full editor DTO and signed
// public URL just to feed `evaluateTutorProfileMinimum`.
export async function hasPublishedTutorProfilePhoto(
  tutorProfileId: string,
): Promise<boolean> {
  const supabase = createSupabaseServiceRoleClient();
  const { count, error } = await supabase
    .from("tutor_public_media_assets")
    .select("id", { count: "exact", head: true })
    .eq("tutor_profile_id", tutorProfileId)
    .eq("media_role", "profile_photo")
    .eq("publication_status", "published");

  if (error) {
    throw new Error("Could not load tutor profile photo publication state.");
  }

  return (count ?? 0) > 0;
}

export function getTutorPublicMediaPublicUrl(storageObjectPath: string): string {
  const supabase = createSupabaseServiceRoleClient();
  const { data } = supabase.storage
    .from(TUTOR_PUBLIC_MEDIA_BUCKET)
    .getPublicUrl(storageObjectPath);
  return data.publicUrl;
}

function mapPhotoRow(row: TutorPublicMediaAssetDbRow): TutorProfilePhotoState {
  return {
    assetId: row.id,
    mediaRole: assertMediaRole(row.media_role),
    storageObjectPath: row.storage_object_path,
    altText: row.alt_text,
    publicationStatus: assertPublicationStatus(row.publication_status),
    publicUrl: getTutorPublicMediaPublicUrl(row.storage_object_path),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertMediaRole(value: string): TutorPublicMediaRole {
  if ((tutorPublicMediaRoles as readonly string[]).includes(value)) {
    return value as TutorPublicMediaRole;
  }
  throw new Error(`Unexpected media_role value: ${value}`);
}

function assertPublicationStatus(
  value: string,
): TutorPublicMediaPublicationStatus {
  if (
    (tutorPublicMediaPublicationStatuses as readonly string[]).includes(value)
  ) {
    return value as TutorPublicMediaPublicationStatus;
  }
  throw new Error(`Unexpected publication_status value: ${value}`);
}
