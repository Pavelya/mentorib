import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const ACCOUNT_AVATAR_BUCKET = "user-avatars";
export const ACCOUNT_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const ACCOUNT_AVATAR_MIN_DIMENSION = 200;

export const ACCOUNT_AVATAR_ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";

const ALLOWED_MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AccountAvatarMimeType = keyof typeof ALLOWED_MIME_EXTENSIONS;

export const ACCOUNT_AVATAR_ALLOWED_MIME_TYPES = Object.keys(
  ALLOWED_MIME_EXTENSIONS,
) as readonly AccountAvatarMimeType[];

export const ACCOUNT_AVATAR_FILE_TYPE_DESCRIPTION = "JPEG, PNG, or WebP";
export const ACCOUNT_AVATAR_MAX_BYTES_DESCRIPTION = "5 MB";

export class AccountAvatarCommandError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function uploadAccountAvatar(
  account: Pick<ResolvedAuthAccount, "auth_user_id" | "id" | "avatar_url">,
  file: File,
) {
  validateAvatarFile(file);

  const extension = ALLOWED_MIME_EXTENSIONS[file.type as AccountAvatarMimeType];
  const objectPath = `${account.auth_user_id}/${crypto.randomUUID()}.${extension}`;

  const serviceRoleClient = createSupabaseServiceRoleClient();
  const arrayBuffer = await file.arrayBuffer();
  const uploadResult = await serviceRoleClient.storage
    .from(ACCOUNT_AVATAR_BUCKET)
    .upload(objectPath, arrayBuffer, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadResult.error) {
    throw new AccountAvatarCommandError(
      "account_avatar_upload_failed",
      "We couldn't upload your photo yet. Please try again in a moment.",
    );
  }

  const publicUrl = buildPublicAvatarUrl(objectPath);

  const { error: updateError } = await serviceRoleClient
    .from("app_users")
    .update({ avatar_url: publicUrl })
    .eq("id", account.id)
    .eq("auth_user_id", account.auth_user_id);

  if (updateError) {
    await serviceRoleClient.storage
      .from(ACCOUNT_AVATAR_BUCKET)
      .remove([objectPath]);

    throw new AccountAvatarCommandError(
      "account_avatar_persist_failed",
      "We couldn't save your photo yet. Please try again in a moment.",
    );
  }

  await removeOwnedAvatarObject(account, account.avatar_url);

  return { avatarUrl: publicUrl };
}

export async function removeAccountAvatar(
  account: Pick<ResolvedAuthAccount, "auth_user_id" | "id" | "avatar_url">,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();

  const { error: updateError } = await serviceRoleClient
    .from("app_users")
    .update({ avatar_url: null })
    .eq("id", account.id)
    .eq("auth_user_id", account.auth_user_id);

  if (updateError) {
    throw new AccountAvatarCommandError(
      "account_avatar_persist_failed",
      "We couldn't remove your photo yet. Please try again in a moment.",
    );
  }

  await removeOwnedAvatarObject(account, account.avatar_url);

  return { avatarUrl: null };
}

function validateAvatarFile(file: File) {
  if (!file || file.size === 0) {
    throw new AccountAvatarCommandError(
      "account_avatar_missing_file",
      "Choose an image to use as your profile photo.",
    );
  }

  if (!ACCOUNT_AVATAR_ALLOWED_MIME_TYPES.includes(file.type as AccountAvatarMimeType)) {
    throw new AccountAvatarCommandError(
      "account_avatar_invalid_type",
      `Use a ${ACCOUNT_AVATAR_FILE_TYPE_DESCRIPTION} image for your profile photo.`,
    );
  }

  if (file.size > ACCOUNT_AVATAR_MAX_BYTES) {
    throw new AccountAvatarCommandError(
      "account_avatar_too_large",
      `Choose an image under ${ACCOUNT_AVATAR_MAX_BYTES_DESCRIPTION}.`,
    );
  }
}

function buildPublicAvatarUrl(objectPath: string) {
  const { url } = getSupabasePublicEnv();
  const trimmedBase = url.replace(/\/+$/, "");

  return `${trimmedBase}/storage/v1/object/public/${ACCOUNT_AVATAR_BUCKET}/${objectPath}`;
}

async function removeOwnedAvatarObject(
  account: Pick<ResolvedAuthAccount, "auth_user_id">,
  previousAvatarUrl: string | null,
) {
  const previousObjectPath = parseOwnedAvatarObjectPath(
    account.auth_user_id,
    previousAvatarUrl,
  );

  if (!previousObjectPath) {
    return;
  }

  const serviceRoleClient = createSupabaseServiceRoleClient();
  await serviceRoleClient.storage
    .from(ACCOUNT_AVATAR_BUCKET)
    .remove([previousObjectPath]);
}

function parseOwnedAvatarObjectPath(
  authUserId: string,
  avatarUrl: string | null,
): string | null {
  if (!avatarUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${ACCOUNT_AVATAR_BUCKET}/`;
  const markerIndex = avatarUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const objectPath = avatarUrl.slice(markerIndex + marker.length).split("?")[0];

  if (!objectPath || !objectPath.startsWith(`${authUserId}/`)) {
    return null;
  }

  return objectPath;
}
