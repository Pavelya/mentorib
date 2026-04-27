"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AccountAvatarCommandError,
  removeAccountAvatar,
  uploadAccountAvatar,
} from "@/modules/accounts/avatar";
import {
  AccountProfileCommandError,
  normalizeAccountProfileFormValues,
  updateAccountProfile,
  type AccountProfileFieldErrors,
  type AccountProfileFormValues,
} from "@/modules/accounts/profile-settings";

export type AccountProfileActionState = {
  code: string | null;
  fieldErrors: AccountProfileFieldErrors;
  message: string | null;
  values: AccountProfileFormValues;
};

export async function updateAccountProfileAction(
  _previousState: AccountProfileActionState,
  formData: FormData,
): Promise<AccountProfileActionState> {
  const values = getAccountProfileValues(formData);

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message: "Profile editing is not available until Supabase auth is configured.",
      values,
    };
  }

  let redirectPath: Route | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath("/settings") as Route;
    } else {
      const account = await ensureAuthAccount(user);
      await updateAccountProfile(account, values);
    }
  } catch (error) {
    if (error instanceof AccountProfileCommandError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        values,
      };
    }

    return {
      code: "account_profile_update_failed",
      fieldErrors: {},
      message: "We couldn't save your profile yet. Please try again in a moment.",
      values,
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  revalidatePath("/settings");
  revalidatePath("/match");

  return {
    code: "success",
    fieldErrors: {},
    message: "Your profile changes have been saved.",
    values,
  };
}

export type AccountAvatarActionState = {
  avatarUrl: string | null;
  code: string | null;
  message: string | null;
};

export async function updateAccountAvatarAction(
  previousState: AccountAvatarActionState,
  formData: FormData,
): Promise<AccountAvatarActionState> {
  if (!isSupabaseAuthConfigured()) {
    return {
      avatarUrl: previousState.avatarUrl,
      code: "auth_unconfigured",
      message:
        "Profile editing is not available until Supabase auth is configured.",
    };
  }

  const intent = formData.get("intent");
  let redirectPath: Route | null = null;
  let nextAvatarUrl: string | null = previousState.avatarUrl;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath("/settings") as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (intent === "remove") {
        const { avatarUrl } = await removeAccountAvatar(account);
        nextAvatarUrl = avatarUrl;
      } else {
        const fileEntry = formData.get("avatar");

        if (!(fileEntry instanceof File)) {
          throw new AccountAvatarCommandError(
            "account_avatar_missing_file",
            "Choose an image to use as your profile photo.",
          );
        }

        const { avatarUrl } = await uploadAccountAvatar(account, fileEntry);
        nextAvatarUrl = avatarUrl;
      }
    }
  } catch (error) {
    if (error instanceof AccountAvatarCommandError) {
      return {
        avatarUrl: previousState.avatarUrl,
        code: error.code,
        message: error.message,
      };
    }

    return {
      avatarUrl: previousState.avatarUrl,
      code: "account_avatar_update_failed",
      message:
        "We couldn't update your photo yet. Please try again in a moment.",
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  revalidatePath("/settings");
  revalidatePath("/match");

  return {
    avatarUrl: nextAvatarUrl,
    code: "success",
    message:
      intent === "remove"
        ? "Your profile photo has been removed."
        : "Your profile photo has been updated.",
  };
}

function getAccountProfileValues(formData: FormData): AccountProfileFormValues {
  return normalizeAccountProfileFormValues({
    fullName: getFormValue(formData, "fullName"),
    preferredLanguageCode: getFormValue(formData, "preferredLanguageCode"),
  });
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
