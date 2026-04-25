import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  isKnownMatchOption,
  type MatchFlowOptionsByField,
} from "@/modules/lessons/match-flow-options";
import { loadDiscoveryOptions } from "@/modules/reference/discovery";

const FULL_NAME_MAX_LENGTH = 120;

export type AccountProfileField = "fullName" | "preferredLanguageCode";

export type AccountProfileFieldErrors = Partial<Record<AccountProfileField, string>>;

export type AccountProfileFormValues = {
  fullName: string;
  preferredLanguageCode: string;
};

export const emptyAccountProfileFormValues: AccountProfileFormValues = {
  fullName: "",
  preferredLanguageCode: "",
};

type UpdatedAccountProfile = {
  full_name: string | null;
  id: string;
  preferred_language_code: string | null;
};

export class AccountProfileCommandError extends Error {
  code: string;
  fieldErrors: AccountProfileFieldErrors;

  constructor(
    code: string,
    message: string,
    fieldErrors: AccountProfileFieldErrors = {},
  ) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function updateAccountProfile(
  account: Pick<ResolvedAuthAccount, "auth_user_id" | "id">,
  values: AccountProfileFormValues,
) {
  const normalizedValues = normalizeAccountProfileFormValues(values);
  const optionsByField = await loadDiscoveryOptions();
  const fieldErrors = validateAccountProfileValues(normalizedValues, optionsByField);

  if (Object.keys(fieldErrors).length > 0) {
    throw new AccountProfileCommandError(
      "invalid_account_profile",
      "Please review the highlighted fields before saving your profile.",
      fieldErrors,
    );
  }

  return updateAppUserProfile(account, normalizedValues);
}

export function normalizeAccountProfileFormValues(
  values: AccountProfileFormValues,
): AccountProfileFormValues {
  return {
    fullName: normalizeFullName(values.fullName),
    preferredLanguageCode: values.preferredLanguageCode.trim(),
  };
}

function validateAccountProfileValues(
  values: AccountProfileFormValues,
  optionsByField: MatchFlowOptionsByField,
) {
  const fieldErrors: AccountProfileFieldErrors = {};

  if (!values.fullName) {
    fieldErrors.fullName = "Enter the name you want to use on Mentor IB.";
  }

  if (!values.preferredLanguageCode) {
    fieldErrors.preferredLanguageCode = "Choose your preferred lesson language.";
  } else if (
    !isKnownMatchOption("languageCode", values.preferredLanguageCode, optionsByField)
  ) {
    fieldErrors.preferredLanguageCode = "Choose a language from the available options.";
  }

  return fieldErrors;
}

async function updateAppUserProfile(
  account: Pick<ResolvedAuthAccount, "auth_user_id" | "id">,
  values: AccountProfileFormValues,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("app_users")
    .update({
      full_name: values.fullName,
      preferred_language_code: values.preferredLanguageCode,
    })
    .eq("id", account.id)
    .eq("auth_user_id", account.auth_user_id)
    .select("id, full_name, preferred_language_code")
    .single<UpdatedAccountProfile>();

  if (error || !data) {
    throw new AccountProfileCommandError(
      "account_profile_update_failed",
      "We couldn't save your profile yet. Please try again in a moment.",
    );
  }

  return data;
}

function normalizeFullName(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, FULL_NAME_MAX_LENGTH);
}
