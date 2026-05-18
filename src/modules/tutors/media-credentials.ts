import "server-only";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  tutorCredentialReviewStatuses,
  tutorCredentialTypes,
  type TutorCredentialReviewStatus,
  type TutorCredentialType,
} from "@/modules/tutors/constants";

export const TUTOR_CREDENTIAL_BUCKET = "tutor-credentials" as const;

// Short TTL keeps the signed URL ephemeral. The URL is returned in the
// owner-only DTO consumed by the editor screen (subtask -06) and is not
// embedded in static HTML.
export const TUTOR_CREDENTIAL_SIGNED_URL_TTL_SECONDS = 60;

export type TutorCredentialEditorRow = {
  id: string;
  credentialType: TutorCredentialType;
  title: string;
  issuingBody: string | null;
  reviewStatus: TutorCredentialReviewStatus;
  reviewedAt: string | null;
  publicDisplayPreference: boolean;
  credentialSubjectId: string | null;
  credentialSubjectFocusAreaId: string | null;
  storageObjectPath: string;
  downloadUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TutorCredentialEditorDto = {
  tutorProfileId: string;
  credentials: TutorCredentialEditorRow[];
};

type TutorProfileLookupRow = {
  id: string;
};

type TutorCredentialDbRow = {
  id: string;
  credential_type: TutorCredentialType;
  title: string;
  issuing_body: string | null;
  storage_object_path: string;
  review_status: TutorCredentialReviewStatus;
  reviewed_at: string | null;
  public_display_preference: boolean;
  credential_subject_id: string | null;
  credential_subject_focus_area_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TutorCredentialAdminRow = TutorCredentialEditorRow;

export type TutorCredentialAdminDto = {
  tutorProfileId: string;
  credentials: TutorCredentialAdminRow[];
};

// Admin-only credential read for the internal review panel. The signed URL
// is generated server-side per request and is never embedded into a public
// page — it flows to the admin-only `/internal/tutor-reviews/[applicationId]`
// surface only. The DTO purposefully omits anything sensitive beyond what
// the owner DTO already exposes; per § 18.1 of the file-and-media doc,
// credential review and public media review are deliberately separate
// review-state families even when they share tooling.
export async function getTutorCredentialsForAdmin(
  tutorProfileId: string,
): Promise<TutorCredentialAdminDto> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("tutor_credentials")
    .select(
      "id, credential_type, title, issuing_body, storage_object_path, review_status, reviewed_at, public_display_preference, credential_subject_id, credential_subject_focus_area_id, created_at, updated_at",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .order("created_at", { ascending: false })
    .returns<TutorCredentialDbRow[]>();

  if (error) {
    throw new Error("Could not load tutor credentials for admin review.");
  }

  const rows = data ?? [];
  const credentials = await Promise.all(
    rows.map(async (row) => {
      const downloadUrl = await issueCredentialSignedUrl(row.storage_object_path);
      return mapEditorRow(row, downloadUrl);
    }),
  );

  return {
    tutorProfileId,
    credentials,
  };
}

export async function getTutorCredentialsForOwner(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<TutorCredentialEditorDto | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: profile, error: profileError } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("app_user_id", account.id)
    .maybeSingle<TutorProfileLookupRow>();

  if (profileError) {
    throw new Error("Could not load the tutor profile for credentials.");
  }

  if (!profile) {
    return null;
  }

  const { data, error } = await supabase
    .from("tutor_credentials")
    .select(
      "id, credential_type, title, issuing_body, storage_object_path, review_status, reviewed_at, public_display_preference, credential_subject_id, credential_subject_focus_area_id, created_at, updated_at",
    )
    .eq("tutor_profile_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<TutorCredentialDbRow[]>();

  if (error) {
    throw new Error("Could not load tutor credentials.");
  }

  const rows = data ?? [];
  const credentials = await Promise.all(
    rows.map(async (row) => {
      const downloadUrl = await issueCredentialSignedUrl(row.storage_object_path);
      return mapEditorRow(row, downloadUrl);
    }),
  );

  return {
    tutorProfileId: profile.id,
    credentials,
  };
}

export async function issueCredentialSignedUrl(
  storageObjectPath: string,
): Promise<string | null> {
  if (!storageObjectPath.trim()) {
    return null;
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(TUTOR_CREDENTIAL_BUCKET)
    .createSignedUrl(storageObjectPath, TUTOR_CREDENTIAL_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}

function mapEditorRow(
  row: TutorCredentialDbRow,
  downloadUrl: string | null,
): TutorCredentialEditorRow {
  return {
    id: row.id,
    credentialType: assertCredentialType(row.credential_type),
    title: row.title,
    issuingBody: row.issuing_body,
    reviewStatus: assertReviewStatus(row.review_status),
    reviewedAt: row.reviewed_at,
    publicDisplayPreference: row.public_display_preference,
    credentialSubjectId: row.credential_subject_id,
    credentialSubjectFocusAreaId: row.credential_subject_focus_area_id,
    storageObjectPath: row.storage_object_path,
    downloadUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertCredentialType(value: string): TutorCredentialType {
  if ((tutorCredentialTypes as readonly string[]).includes(value)) {
    return value as TutorCredentialType;
  }
  throw new Error(`Unexpected credential_type value: ${value}`);
}

function assertReviewStatus(value: string): TutorCredentialReviewStatus {
  if ((tutorCredentialReviewStatuses as readonly string[]).includes(value)) {
    return value as TutorCredentialReviewStatus;
  }
  throw new Error(`Unexpected review_status value: ${value}`);
}
