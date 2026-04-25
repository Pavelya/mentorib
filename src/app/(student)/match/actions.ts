"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { normalizeTimezone } from "@/lib/datetime";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requiresRoleSelection } from "@/modules/accounts/account-state";
import {
  emptyMatchFlowValues,
  isKnownMatchOption,
  type MatchFlowFieldErrors,
  type MatchFlowFormValues,
} from "@/modules/lessons/match-flow-options";
import {
  MatchFlowCommandError,
  submitLearningNeedForMatching,
} from "@/modules/lessons/match-flow-service";
import { loadDiscoveryOptions } from "@/modules/reference/discovery";

const FREE_TEXT_NOTE_MAX_LENGTH = 600;

export type MatchFlowActionState = {
  code: string | null;
  fieldErrors: MatchFlowFieldErrors;
  message: string | null;
  values: MatchFlowFormValues;
};

export async function submitMatchFlowAction(
  _previousState: MatchFlowActionState,
  formData: FormData,
): Promise<MatchFlowActionState> {
  const values = getMatchFlowValues(formData);
  const optionsByField = await loadDiscoveryOptions();
  const fieldErrors = validateMatchFlowValues(values, optionsByField);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      code: "validation_failed",
      fieldErrors,
      message: "Please complete the required steps to see your matches.",
      values,
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message: "Saving answers is not available in this environment yet.",
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
      redirectPath = buildAuthSignInPath(routeFamilies.student.defaultHref) as Route;
    } else {
      const account = await ensureAuthAccount(user, values.timezone);

      if (requiresRoleSelection(account)) {
        redirectPath = routeFamilies.setup.defaultHref;
      } else {
        await submitLearningNeedForMatching(account, values);
        revalidatePath("/match");
        revalidatePath("/results");
        redirectPath = "/results";
      }
    }
  } catch (error) {
    if (error instanceof MatchFlowCommandError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        values,
      };
    }

    return {
      code: "match_submission_failed",
      fieldErrors: {},
      message: "We couldn't save your request yet. Please try again in a moment.",
      values,
    };
  }

  if (!redirectPath) {
    return {
      code: "missing_redirect_target",
      fieldErrors: {},
      message: "We couldn't continue into results yet. Please try again.",
      values,
    };
  }

  redirect(redirectPath);
}

function getMatchFlowValues(formData: FormData): MatchFlowFormValues {
  return {
    ...emptyMatchFlowValues,
    freeTextNote: getFormValue(formData, "freeTextNote"),
    languageCode: getFormValue(formData, "languageCode"),
    needType: getFormValue(formData, "needType"),
    sessionFrequencyIntent: getFormValue(formData, "sessionFrequencyIntent"),
    subjectSlug: getFormValue(formData, "subjectSlug"),
    supportStyle: getFormValue(formData, "supportStyle"),
    timezone: normalizeTimezone(getFormValue(formData, "timezone")) ?? "",
    urgencyLevel: getFormValue(formData, "urgencyLevel"),
  };
}

function validateMatchFlowValues(
  values: MatchFlowFormValues,
  optionsByField: Awaited<ReturnType<typeof loadDiscoveryOptions>>,
) {
  const fieldErrors: MatchFlowFieldErrors = {};

  if (!isKnownMatchOption("needType", values.needType, optionsByField)) {
    fieldErrors.needType = "Choose what you need help with.";
  }

  if (!isKnownMatchOption("subjectSlug", values.subjectSlug, optionsByField)) {
    fieldErrors.subjectSlug = "Choose the subject.";
  }

  if (
    values.urgencyLevel &&
    !isKnownMatchOption("urgencyLevel", values.urgencyLevel, optionsByField)
  ) {
    fieldErrors.urgencyLevel = "Choose when you need help.";
  }

  if (
    values.sessionFrequencyIntent &&
    !isKnownMatchOption(
      "sessionFrequencyIntent",
      values.sessionFrequencyIntent,
      optionsByField,
    )
  ) {
    fieldErrors.sessionFrequencyIntent = "Choose how often you want help.";
  }

  if (
    values.supportStyle &&
    !isKnownMatchOption("supportStyle", values.supportStyle, optionsByField)
  ) {
    fieldErrors.supportStyle = "Choose the support style that would help most.";
  }

  if (!isKnownMatchOption("languageCode", values.languageCode, optionsByField)) {
    fieldErrors.languageCode = "Choose a tutoring language.";
  }

  if (!values.timezone) {
    fieldErrors.timezone = "Choose a valid timezone.";
  }

  if (values.freeTextNote.length > FREE_TEXT_NOTE_MAX_LENGTH) {
    fieldErrors.freeTextNote = `Keep the note under ${FREE_TEXT_NOTE_MAX_LENGTH} characters.`;
  }

  return fieldErrors;
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
