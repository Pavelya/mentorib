import "server-only";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { TutorPublicMediaPublicationStatus } from "@/modules/tutors/constants";
import { TUTOR_PUBLIC_MEDIA_BUCKET } from "@/modules/tutors/media-public-assets";
import { applyTutorListingPhotoRegressionFlip } from "@/modules/tutors/tutor-profile-editor-service";

const PROFILE_PATH = "/tutor/profile";
const PHOTO_PATH = "/tutor/profile/photo";
const OVERVIEW_PATH = "/tutor/overview";
const PUBLIC_PROFILE_PATH = "/tutors/[slug]";

// File-and-media architecture § 16.3: public profile photos accept
// JPEG/PNG/WebP only.
export const TUTOR_PROFILE_PHOTO_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type TutorProfilePhotoAllowedMimeType =
  (typeof TUTOR_PROFILE_PHOTO_ALLOWED_MIME_TYPES)[number];

export const TUTOR_PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS: Record<TutorProfilePhotoAllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type FieldErrors = Record<string, string[]>;

export type TutorProfilePhotoPublicationAction = "publish" | "hide" | "remove";

export class TutorPublicMediaServiceError extends Error {
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

type TutorProfilePhotoOwnedRow = {
  id: string;
  tutor_profile_id: string;
  storage_object_path: string;
  alt_text: string | null;
  publication_status: TutorPublicMediaPublicationStatus;
};

export type TutorProfilePhotoMutationResult = {
  assetId: string;
  publicationStatus: TutorPublicMediaPublicationStatus;
};

export type TutorProfilePhotoPublicationResult =
  | { action: "publish" | "hide"; assetId: string; publicationStatus: TutorPublicMediaPublicationStatus }
  | { action: "remove"; assetId: string; publicationStatus: null };

export async function uploadTutorProfilePhoto(
  account: Pick<ResolvedAuthAccount, "id">,
  file: File,
  altText: string | null,
): Promise<TutorProfilePhotoMutationResult> {
  const mime = assertAllowedMime(file);
  assertWithinSize(file);
  const normalizedAlt = normalizeAltTextInput(altText);

  const tutorProfileId = await loadOwnedTutorProfileId(account);

  const assetId = randomUUID();
  const storagePath = buildPhotoObjectPath({
    tutorProfileId,
    assetId,
    mime,
  });

  await uploadPhotoObject(storagePath, file, mime);

  const existing = await loadExistingPhotoRow(tutorProfileId);
  const supabase = createSupabaseServiceRoleClient();

  if (existing) {
    const { error } = await supabase
      .from("tutor_public_media_assets")
      .update({
        storage_object_path: storagePath,
        alt_text: normalizedAlt,
        publication_status: "uploaded",
      })
      .eq("id", existing.id);

    if (error) {
      await removePhotoObject(storagePath);
      throw new TutorPublicMediaServiceError(
        "persist_failed",
        "We couldn't save that photo right now. Please try again in a moment.",
      );
    }

    if (existing.storage_object_path !== storagePath) {
      await removePhotoObject(existing.storage_object_path);
    }

    revalidateEditorPaths();
    return { assetId: existing.id, publicationStatus: "uploaded" };
  }

  const { error } = await supabase.from("tutor_public_media_assets").insert({
    id: assetId,
    tutor_profile_id: tutorProfileId,
    media_role: "profile_photo",
    storage_object_path: storagePath,
    alt_text: normalizedAlt,
    publication_status: "uploaded",
  });

  if (error) {
    await removePhotoObject(storagePath);
    throw new TutorPublicMediaServiceError(
      "persist_failed",
      "We couldn't save that photo right now. Please try again in a moment.",
    );
  }

  revalidateEditorPaths();
  return { assetId, publicationStatus: "uploaded" };
}

export async function updateTutorProfilePhotoAlt(
  account: Pick<ResolvedAuthAccount, "id">,
  altText: string | null,
): Promise<TutorProfilePhotoMutationResult> {
  const normalizedAlt = normalizeAltTextInput(altText);

  const existing = await loadOwnedPhotoRowOrThrow(account);

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_public_media_assets")
    .update({ alt_text: normalizedAlt })
    .eq("id", existing.id);

  if (error) {
    throw new TutorPublicMediaServiceError(
      "persist_failed",
      "We couldn't save that description right now. Please try again in a moment.",
    );
  }

  revalidateEditorPaths();
  return {
    assetId: existing.id,
    publicationStatus: existing.publication_status,
  };
}

export async function setTutorProfilePhotoPublication(
  account: Pick<ResolvedAuthAccount, "id">,
  action: TutorProfilePhotoPublicationAction,
): Promise<TutorProfilePhotoPublicationResult> {
  const existing = await loadOwnedPhotoRowOrThrow(account);

  if (action === "publish") {
    if (!existing.alt_text || !existing.alt_text.trim()) {
      // Accessibility § 13.1: informative images get meaningful alt text;
      // publication of a profile photo without alt text is rejected so
      // assistive tech users still get a meaningful description.
      throw new TutorPublicMediaServiceError(
        "validation_failed",
        "Add a short description of your photo before publishing.",
        {
          fieldErrors: {
            altText: ["Add a short description of your photo before publishing."],
          },
        },
      );
    }

    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase
      .from("tutor_public_media_assets")
      .update({ publication_status: "published" })
      .eq("id", existing.id);

    if (error) {
      if (isUniqueViolation(error)) {
        throw new TutorPublicMediaServiceError(
          "conflict",
          "You already have a published profile photo. Hide it before publishing a new one.",
        );
      }
      throw new TutorPublicMediaServiceError(
        "persist_failed",
        "We couldn't publish that photo right now. Please try again in a moment.",
      );
    }

    revalidatePublicationPaths();
    return {
      action: "publish",
      assetId: existing.id,
      publicationStatus: "published",
    };
  }

  if (action === "hide") {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase
      .from("tutor_public_media_assets")
      .update({ publication_status: "hidden" })
      .eq("id", existing.id);

    if (error) {
      throw new TutorPublicMediaServiceError(
        "persist_failed",
        "We couldn't hide that photo right now. Please try again in a moment.",
      );
    }

    // Listing-readiness gate 2 fails the moment the published photo
    // disappears; auto-flip any `listed` tutor down to `not_listed` so they
    // are not publicly discoverable without a real photo (per
    // tutor-listing-readiness-model §4.2 / P2-MEDIA-001-07).
    await applyTutorListingPhotoRegressionFlip(account);

    revalidatePublicationPaths();
    return {
      action: "hide",
      assetId: existing.id,
      publicationStatus: "hidden",
    };
  }

  // action === "remove"
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("tutor_public_media_assets")
    .delete()
    .eq("id", existing.id);

  if (error) {
    throw new TutorPublicMediaServiceError(
      "persist_failed",
      "We couldn't remove that photo right now. Please try again in a moment.",
    );
  }

  // Background-jobs worker pattern for media cleanup (file-and-media § 19.2)
  // is not yet implemented in this repo; delete the storage object
  // synchronously so we don't leak orphaned public objects.
  await removePhotoObject(existing.storage_object_path);

  await applyTutorListingPhotoRegressionFlip(account);

  revalidatePublicationPaths();
  return { action: "remove", assetId: existing.id, publicationStatus: null };
}

// --- internals -----------------------------------------------------------

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
    throw new TutorPublicMediaServiceError(
      "persist_failed",
      "We couldn't load your tutor profile. Please try again in a moment.",
    );
  }
  if (!data) {
    throw new TutorPublicMediaServiceError(
      "not_found",
      "Your tutor profile is not available yet.",
    );
  }
  return data.id;
}

async function loadExistingPhotoRow(
  tutorProfileId: string,
): Promise<TutorProfilePhotoOwnedRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_public_media_assets")
    .select(
      "id, tutor_profile_id, storage_object_path, alt_text, publication_status",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .eq("media_role", "profile_photo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<TutorProfilePhotoOwnedRow>();

  if (error) {
    throw new TutorPublicMediaServiceError(
      "persist_failed",
      "We couldn't load that photo. Please try again in a moment.",
    );
  }
  return data;
}

async function loadOwnedPhotoRowOrThrow(
  account: Pick<ResolvedAuthAccount, "id">,
): Promise<TutorProfilePhotoOwnedRow> {
  const tutorProfileId = await loadOwnedTutorProfileId(account);
  const existing = await loadExistingPhotoRow(tutorProfileId);
  if (!existing) {
    throw new TutorPublicMediaServiceError(
      "not_found",
      "There's no profile photo to update.",
    );
  }
  return existing;
}

function normalizeAltTextInput(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function assertAllowedMime(file: File): TutorProfilePhotoAllowedMimeType {
  const mime = (file?.type ?? "").toLowerCase();
  if (
    !(TUTOR_PROFILE_PHOTO_ALLOWED_MIME_TYPES as readonly string[]).includes(mime)
  ) {
    throw new TutorPublicMediaServiceError(
      "validation_failed",
      "Upload a JPEG, PNG, or WebP image.",
      { fieldErrors: { file: ["Upload a JPEG, PNG, or WebP image."] } },
    );
  }
  return mime as TutorProfilePhotoAllowedMimeType;
}

function assertWithinSize(file: File): void {
  if (typeof file?.size !== "number" || file.size <= 0) {
    throw new TutorPublicMediaServiceError(
      "validation_failed",
      "Choose a photo file before uploading.",
      { fieldErrors: { file: ["Choose a photo file before uploading."] } },
    );
  }
  if (file.size > TUTOR_PROFILE_PHOTO_MAX_BYTES) {
    throw new TutorPublicMediaServiceError(
      "validation_failed",
      "Profile photos must be 5 MB or smaller.",
      {
        fieldErrors: {
          file: ["Profile photos must be 5 MB or smaller."],
        },
      },
    );
  }
}

function buildPhotoObjectPath(params: {
  tutorProfileId: string;
  assetId: string;
  mime: TutorProfilePhotoAllowedMimeType;
}): string {
  const { tutorProfileId, assetId, mime } = params;
  const ext = MIME_EXTENSIONS[mime];
  return `tutor/${tutorProfileId}/photo/${assetId}.${ext}`;
}

async function uploadPhotoObject(
  storagePath: string,
  file: File,
  mime: TutorProfilePhotoAllowedMimeType,
): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.storage
    .from(TUTOR_PUBLIC_MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: mime,
      upsert: true,
    });

  if (error) {
    throw new TutorPublicMediaServiceError(
      "persist_failed",
      "We couldn't store that photo right now. Please try again in a moment.",
    );
  }
}

async function removePhotoObject(storagePath: string): Promise<void> {
  if (!storagePath.trim()) {
    return;
  }
  const supabase = createSupabaseServiceRoleClient();
  await supabase.storage.from(TUTOR_PUBLIC_MEDIA_BUCKET).remove([storagePath]);
}

function isUniqueViolation(error: { code?: string; message?: string }): boolean {
  if (error?.code === "23505") {
    return true;
  }
  const message = (error?.message ?? "").toLowerCase();
  return (
    message.includes("duplicate key") ||
    message.includes("unique constraint") ||
    message.includes(
      "tutor_public_media_assets_one_published_photo_per_tutor_idx",
    )
  );
}

function revalidateEditorPaths(): void {
  revalidatePath(PROFILE_PATH);
  revalidatePath(PHOTO_PATH);
}

function revalidatePublicationPaths(): void {
  revalidateEditorPaths();
  revalidatePath(PUBLIC_PROFILE_PATH, "page");
  revalidatePath(OVERVIEW_PATH);
}
