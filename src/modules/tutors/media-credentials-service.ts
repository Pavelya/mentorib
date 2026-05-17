import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  tutorCredentialTypes,
  type TutorCredentialReviewStatus,
  type TutorCredentialType,
} from "@/modules/tutors/constants";
import { TUTOR_CREDENTIAL_BUCKET } from "@/modules/tutors/media-credentials";

const PROFILE_PATH = "/tutor/profile";
const CREDENTIALS_PATH = "/tutor/profile/credentials";

// File-and-media architecture § 16.3: credentials accept PDF/JPEG/PNG only.
export const TUTOR_CREDENTIAL_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type TutorCredentialAllowedMimeType =
  (typeof TUTOR_CREDENTIAL_ALLOWED_MIME_TYPES)[number];

export const TUTOR_CREDENTIAL_MAX_BYTES = 15 * 1024 * 1024;

const MIME_EXTENSIONS: Record<TutorCredentialAllowedMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

type FieldErrors = Record<string, string[]>;

export type TutorCredentialUploadInput = {
  credentialType: string;
  title: string;
  issuingBody: string | null;
  credentialSubjectId: string | null;
  credentialSubjectFocusAreaId: string | null;
};

export type TutorCredentialMetadataInput = TutorCredentialUploadInput;

export class TutorCredentialServiceError extends Error {
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

type TutorProfileLookupRow = {
  id: string;
};

type TutorCredentialOwnedRow = {
  id: string;
  tutor_profile_id: string;
  storage_object_path: string;
  review_status: TutorCredentialReviewStatus;
};

export type TutorCredentialMutationResult = {
  credentialId: string;
  reviewStatus: TutorCredentialReviewStatus;
};

export async function uploadTutorCredential(
  account: Pick<ResolvedAuthAccount, "id">,
  input: TutorCredentialUploadInput,
  file: File,
): Promise<TutorCredentialMutationResult> {
  const mime = assertAllowedMime(file);
  assertWithinSize(file);

  const metadata = validateMetadataInput(input);

  const tutorProfileId = await loadOwnedTutorProfileId(account);

  const credentialId = randomUUID();
  const storagePath = buildCredentialObjectPath({
    tutorProfileId,
    credentialId,
    file,
    mime,
  });

  await uploadCredentialObject(storagePath, file, mime);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from("tutor_credentials").insert({
    id: credentialId,
    tutor_profile_id: tutorProfileId,
    credential_type: metadata.credentialType,
    title: metadata.title,
    issuing_body: metadata.issuingBody,
    storage_object_path: storagePath,
    review_status: "uploaded",
    reviewed_at: null,
    public_display_preference: false,
    credential_subject_id: metadata.credentialSubjectId,
    credential_subject_focus_area_id: metadata.credentialSubjectFocusAreaId,
  });

  if (error) {
    // The row failed to persist; remove the orphaned object so we don't
    // leak storage for a credential that doesn't exist in the database.
    await removeCredentialObject(storagePath);
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't save that credential right now. Please try again in a moment.",
    );
  }

  revalidateTutorCredentialPaths();

  return { credentialId, reviewStatus: "uploaded" };
}

export async function replaceTutorCredentialFile(
  account: Pick<ResolvedAuthAccount, "id">,
  credentialId: string,
  file: File,
): Promise<TutorCredentialMutationResult> {
  const mime = assertAllowedMime(file);
  assertWithinSize(file);

  const existing = await loadOwnedCredentialRow(account, credentialId);

  const newPath = buildCredentialObjectPath({
    tutorProfileId: existing.tutor_profile_id,
    credentialId: existing.id,
    file,
    mime,
  });

  await uploadCredentialObject(newPath, file, mime);

  const nextReviewStatus: TutorCredentialReviewStatus =
    existing.review_status === "approved"
      ? "pending_review"
      : existing.review_status;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_credentials")
    .update({
      storage_object_path: newPath,
      review_status: nextReviewStatus,
      reviewed_at: terminalReviewStatuses.has(nextReviewStatus)
        ? undefined
        : null,
    })
    .eq("id", existing.id);

  if (error) {
    await removeCredentialObject(newPath);
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't update that credential right now. Please try again in a moment.",
    );
  }

  // If the path changed (different mime extension), the prior object is
  // orphaned; clean it up best-effort.
  if (existing.storage_object_path !== newPath) {
    await removeCredentialObject(existing.storage_object_path);
  }

  revalidateTutorCredentialPaths();

  return { credentialId: existing.id, reviewStatus: nextReviewStatus };
}

export async function updateTutorCredentialMetadata(
  account: Pick<ResolvedAuthAccount, "id">,
  credentialId: string,
  input: TutorCredentialMetadataInput,
): Promise<TutorCredentialMutationResult> {
  const metadata = validateMetadataInput(input);

  const existing = await loadOwnedCredentialRow(account, credentialId);

  const nextReviewStatus: TutorCredentialReviewStatus =
    existing.review_status === "approved"
      ? "pending_review"
      : existing.review_status;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_credentials")
    .update({
      credential_type: metadata.credentialType,
      title: metadata.title,
      issuing_body: metadata.issuingBody,
      credential_subject_id: metadata.credentialSubjectId,
      credential_subject_focus_area_id: metadata.credentialSubjectFocusAreaId,
      review_status: nextReviewStatus,
      reviewed_at: terminalReviewStatuses.has(nextReviewStatus)
        ? undefined
        : null,
    })
    .eq("id", existing.id);

  if (error) {
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't save those changes right now. Please try again in a moment.",
    );
  }

  revalidateTutorCredentialPaths();

  return { credentialId: existing.id, reviewStatus: nextReviewStatus };
}

export async function setTutorCredentialPublicDisplayPreference(
  account: Pick<ResolvedAuthAccount, "id">,
  credentialId: string,
  publicDisplayPreference: boolean,
): Promise<TutorCredentialMutationResult> {
  const existing = await loadOwnedCredentialRow(account, credentialId);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_credentials")
    .update({ public_display_preference: publicDisplayPreference })
    .eq("id", existing.id);

  if (error) {
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't update the display preference right now. Please try again in a moment.",
    );
  }

  revalidateTutorCredentialPaths();

  return { credentialId: existing.id, reviewStatus: existing.review_status };
}

export async function deleteTutorCredential(
  account: Pick<ResolvedAuthAccount, "id">,
  credentialId: string,
): Promise<{ credentialId: string }> {
  const existing = await loadOwnedCredentialRow(account, credentialId);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_credentials")
    .delete()
    .eq("id", existing.id);

  if (error) {
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't delete that credential right now. Please try again in a moment.",
    );
  }

  // Background-jobs worker pattern for media cleanup (file-and-media § 19.2)
  // is not yet implemented in this repo (P15-DATA-002 deferred); delete the
  // storage object synchronously so we don't leak private evidence.
  await removeCredentialObject(existing.storage_object_path);

  revalidateTutorCredentialPaths();

  return { credentialId: existing.id };
}

// --- internals -----------------------------------------------------------

const terminalReviewStatuses = new Set<TutorCredentialReviewStatus>([
  "approved",
  "rejected",
  "expired",
]);

async function loadOwnedTutorProfileId(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<string> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("app_user_id", account.id)
    .maybeSingle<TutorProfileLookupRow>();

  if (error) {
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't load your tutor profile. Please try again in a moment.",
    );
  }
  if (!data) {
    // Owners with no tutor profile are not authorized to upload credentials;
    // we surface this as `not_found` to avoid revealing internal state.
    throw new TutorCredentialServiceError(
      "not_found",
      "Your tutor profile is not available yet.",
    );
  }
  return data.id;
}

async function loadOwnedCredentialRow(
  account: Pick<ResolvedAuthAccount, "id">,
  credentialId: string,
): Promise<TutorCredentialOwnedRow> {
  if (!isUuid(credentialId)) {
    throw new TutorCredentialServiceError(
      "not_found",
      "That credential could not be found.",
    );
  }

  const tutorProfileId = await loadOwnedTutorProfileId(account);
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_credentials")
    .select("id, tutor_profile_id, storage_object_path, review_status")
    .eq("id", credentialId)
    .eq("tutor_profile_id", tutorProfileId)
    .maybeSingle<TutorCredentialOwnedRow>();

  if (error) {
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't load that credential. Please try again in a moment.",
    );
  }
  if (!data) {
    // Other tutors' rows must surface as not_found rather than forbidden
    // (api-and-server-action-contracts § 13).
    throw new TutorCredentialServiceError(
      "not_found",
      "That credential could not be found.",
    );
  }
  return data;
}

function validateMetadataInput(
  input: TutorCredentialUploadInput,
): {
  credentialType: TutorCredentialType;
  title: string;
  issuingBody: string | null;
  credentialSubjectId: string | null;
  credentialSubjectFocusAreaId: string | null;
} {
  const fieldErrors: FieldErrors = {};

  const rawType = typeof input?.credentialType === "string"
    ? input.credentialType.trim()
    : "";
  let credentialType: TutorCredentialType | null = null;
  if (!rawType) {
    fieldErrors.credentialType = ["Choose a credential type."];
  } else if (!(tutorCredentialTypes as readonly string[]).includes(rawType)) {
    fieldErrors.credentialType = ["Choose a valid credential type."];
  } else {
    credentialType = rawType as TutorCredentialType;
  }

  const title = typeof input?.title === "string" ? input.title.trim() : "";
  if (!title) {
    fieldErrors.title = ["Add a title for this credential."];
  }

  const issuingBody = typeof input?.issuingBody === "string"
    ? input.issuingBody.trim() || null
    : null;

  const credentialSubjectId = typeof input?.credentialSubjectId === "string"
    ? input.credentialSubjectId.trim() || null
    : null;
  if (credentialSubjectId && !isUuid(credentialSubjectId)) {
    fieldErrors.credentialSubjectId = ["Choose a valid subject."];
  }

  const credentialSubjectFocusAreaId =
    typeof input?.credentialSubjectFocusAreaId === "string"
      ? input.credentialSubjectFocusAreaId.trim() || null
      : null;
  if (
    credentialSubjectFocusAreaId &&
    !isUuid(credentialSubjectFocusAreaId)
  ) {
    fieldErrors.credentialSubjectFocusAreaId = ["Choose a valid focus area."];
  }

  if (Object.keys(fieldErrors).length > 0 || !credentialType) {
    throw new TutorCredentialServiceError(
      "validation_failed",
      "Please correct the highlighted fields before saving.",
      { fieldErrors },
    );
  }

  return {
    credentialType,
    title,
    issuingBody,
    credentialSubjectId,
    credentialSubjectFocusAreaId,
  };
}

function assertAllowedMime(file: File): TutorCredentialAllowedMimeType {
  const mime = (file?.type ?? "").toLowerCase();
  if (
    !(TUTOR_CREDENTIAL_ALLOWED_MIME_TYPES as readonly string[]).includes(mime)
  ) {
    throw new TutorCredentialServiceError(
      "validation_failed",
      "Upload a PDF, JPEG, or PNG file.",
      { fieldErrors: { file: ["Upload a PDF, JPEG, or PNG file."] } },
    );
  }
  return mime as TutorCredentialAllowedMimeType;
}

function assertWithinSize(file: File): void {
  if (typeof file?.size !== "number" || file.size <= 0) {
    throw new TutorCredentialServiceError(
      "validation_failed",
      "Choose a credential file before uploading.",
      { fieldErrors: { file: ["Choose a credential file before uploading."] } },
    );
  }
  if (file.size > TUTOR_CREDENTIAL_MAX_BYTES) {
    throw new TutorCredentialServiceError(
      "validation_failed",
      "Credential files must be 15 MB or smaller.",
      {
        fieldErrors: {
          file: ["Credential files must be 15 MB or smaller."],
        },
      },
    );
  }
}

function buildCredentialObjectPath(params: {
  tutorProfileId: string;
  credentialId: string;
  file: File;
  mime: TutorCredentialAllowedMimeType;
}): string {
  const { tutorProfileId, credentialId, file, mime } = params;
  const filename = sanitizeFilename(file.name, MIME_EXTENSIONS[mime]);
  return `tutor/${tutorProfileId}/credentials/${credentialId}/${filename}`;
}

function sanitizeFilename(rawName: string, fallbackExt: string): string {
  const trimmed = (rawName ?? "").trim();
  // Strip path separators and keep only an ASCII-safe basename so the storage
  // object path stays predictable across providers.
  const basename = trimmed
    .replace(/[/\\]+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!basename) {
    return `credential.${fallbackExt}`;
  }
  if (basename.includes(".")) {
    return basename;
  }
  return `${basename}.${fallbackExt}`;
}

async function uploadCredentialObject(
  storagePath: string,
  file: File,
  mime: TutorCredentialAllowedMimeType,
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.storage
    .from(TUTOR_CREDENTIAL_BUCKET)
    .upload(storagePath, file, {
      contentType: mime,
      upsert: true,
    });

  if (error) {
    throw new TutorCredentialServiceError(
      "persist_failed",
      "We couldn't store that credential file right now. Please try again in a moment.",
    );
  }
}

async function removeCredentialObject(storagePath: string): Promise<void> {
  if (!storagePath.trim()) {
    return;
  }
  const supabase = createSupabaseServiceRoleClient();
  await supabase.storage.from(TUTOR_CREDENTIAL_BUCKET).remove([storagePath]);
}

function revalidateTutorCredentialPaths(): void {
  revalidatePath(PROFILE_PATH);
  revalidatePath(CREDENTIALS_PATH);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
