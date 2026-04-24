"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
