"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { logJobsEvent } from "@/lib/jobs/logging";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole, requiresRoleSelection } from "@/modules/accounts/account-state";
import type { TutorApplicationDraftInput } from "@/modules/tutors/application";
import {
  TutorApplicationCommandError,
  saveTutorApplicationDraft,
  submitTutorApplication,
  withdrawTutorApplication,
} from "@/modules/tutors/application-service";

import type {
  TutorApplicationActionIntent,
  TutorApplicationActionState,
} from "./action-types";

const APPLY_PATH = "/tutor/apply" as const;

export async function submitTutorApplicationAction(
  _previous: TutorApplicationActionState,
  formData: FormData,
): Promise<TutorApplicationActionState> {
  const intent = readIntent(formData);
  const values = readDraftValues(formData);

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      intent,
      message:
        "Saving your application is not available until Supabase auth is configured.",
      successMessage: null,
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
      redirectPath = buildAuthSignInPath(APPLY_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (requiresRoleSelection(account)) {
        redirectPath = routeFamilies.setup.defaultHref;
      } else if (
        !hasRole(account, "tutor", ["active", "pending"]) &&
        account.primary_role_context !== "tutor"
      ) {
        return {
          code: "not_a_tutor_applicant",
          fieldErrors: {},
          intent,
          message:
            "Switch to the tutor role from account setup before continuing the application.",
          successMessage: null,
          values,
        };
      } else if (intent === "withdraw") {
        await withdrawTutorApplication(account);
        revalidatePath(APPLY_PATH);
        return {
          code: "withdrawn",
          fieldErrors: {},
          intent,
          message: null,
          successMessage:
            "Your tutor application has been withdrawn. You can restart whenever you're ready.",
          values,
        };
      } else if (intent === "submit") {
        await submitTutorApplication(account, values);
        revalidatePath(APPLY_PATH);
        return {
          code: "submitted",
          fieldErrors: {},
          intent,
          message: null,
          successMessage:
            "Application submitted. We'll review and get back to you soon.",
          values,
        };
      } else {
        await saveTutorApplicationDraft(account, values);
        revalidatePath(APPLY_PATH);
        revalidatePath(routeFamilies.tutor.defaultHref);
        redirectPath = routeFamilies.tutor.defaultHref;
      }
    }
  } catch (error) {
    if (error instanceof TutorApplicationCommandError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        intent,
        message: error.message,
        successMessage: null,
        values,
      };
    }

    logJobsEvent("error", "tutor_application_action_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      intent,
    });

    return {
      code: "tutor_application_action_failed",
      fieldErrors: {},
      intent,
      message:
        "We couldn't update your application right now. Please try again in a moment.",
      successMessage: null,
      values,
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    code: "unexpected",
    fieldErrors: {},
    intent,
    message: "We couldn't update your application right now.",
    successMessage: null,
    values,
  };
}

export async function withdrawTutorApplicationFormAction(
  _formData: FormData,
): Promise<void> {
  void _formData;

  if (!isSupabaseAuthConfigured()) {
    return;
  }

  let redirectPath: Route | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email?.trim()) {
      redirectPath = buildAuthSignInPath(APPLY_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (
        !hasRole(account, "tutor", ["active", "pending"]) &&
        account.primary_role_context !== "tutor"
      ) {
        return;
      }

      await withdrawTutorApplication(account);
      revalidatePath(APPLY_PATH);
    }
  } catch (error) {
    logJobsEvent("error", "tutor_application_withdraw_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
}

function readIntent(formData: FormData): TutorApplicationActionIntent {
  const raw = formData.get("intent");
  if (raw === "submit" || raw === "withdraw") {
    return raw;
  }
  return "save";
}

function readDraftValues(formData: FormData): TutorApplicationDraftInput {
  return {
    displayName: readString(formData, "display_name"),
    focusAreaCodes: readStringList(formData, "focus_area_codes").filter(
      (code) => code.length > 0,
    ),
    headline: readString(formData, "headline"),
    hourlyRateMajor: readString(formData, "hourly_rate_major"),
    languageCodes: readStringList(formData, "language_codes").filter(
      (code) => code.length > 0,
    ),
    subjectCodes: readStringList(formData, "subject_codes").filter(
      (code) => code.length > 0,
    ),
    bio: readString(formData, "bio"),
    timezone: readString(formData, "timezone"),
  };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim());
}
