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
  TutorProfileEditorError,
  setTutorListingPublication,
  updateTutorProfile,
  type TutorListingPublicationAction,
} from "@/modules/tutors/tutor-profile-editor-service";

import {
  initialTutorProfilePublicationActionState,
  initialTutorProfileUpdateActionState,
  type TutorProfilePublicationActionState,
  type TutorProfileUpdateActionState,
} from "./action-types";

const PROFILE_PATH = "/tutor/profile" as const;
const APPLY_PATH = "/tutor/apply" as const;
const OVERVIEW_PATH = "/tutor/overview" as const;

export async function updateTutorProfileAction(
  _previous: TutorProfileUpdateActionState,
  formData: FormData,
): Promise<TutorProfileUpdateActionState> {
  const values = readDraftValues(formData);

  if (!isSupabaseAuthConfigured()) {
    return {
      ...initialTutorProfileUpdateActionState,
      code: "auth_unconfigured",
      message:
        "Saving your profile is not available until Supabase auth is configured.",
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
      redirectPath = buildAuthSignInPath(PROFILE_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (requiresRoleSelection(account)) {
        redirectPath = routeFamilies.setup.defaultHref;
      } else if (
        !hasRole(account, "tutor", ["active", "pending"]) &&
        account.primary_role_context !== "tutor"
      ) {
        return {
          code: "not_a_tutor",
          fieldErrors: {},
          message:
            "Switch to the tutor role from account setup before editing your profile.",
          successMessage: null,
          values,
        };
      } else {
        const result = await updateTutorProfile(account, values);
        revalidatePath(PROFILE_PATH);
        revalidatePath(OVERVIEW_PATH);
        if (result.publicListingStatus !== undefined) {
          revalidatePath("/tutors/[slug]", "page");
        }
        return {
          code: result.autoPaused ? "saved_and_auto_paused" : "saved",
          fieldErrors: {},
          message: null,
          successMessage: result.autoPaused
            ? "Profile saved. Your listing was paused because a readiness step needs your attention."
            : "Profile saved.",
          values,
        };
      }
    }
  } catch (error) {
    if (error instanceof TutorProfileEditorError) {
      if (error.code === "application_not_approved") {
        redirectPath = APPLY_PATH;
      } else {
        return {
          code: error.code,
          fieldErrors: error.fieldErrors,
          message: error.message,
          successMessage: null,
          values,
        };
      }
    } else {
      logJobsEvent("error", "tutor_profile_update_failed", {
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        code: "tutor_profile_action_failed",
        fieldErrors: {},
        message:
          "We couldn't save your profile right now. Please try again in a moment.",
        successMessage: null,
        values,
      };
    }
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    code: "unexpected",
    fieldErrors: {},
    message: "We couldn't save your profile right now.",
    successMessage: null,
    values,
  };
}

export async function setTutorListingPublicationAction(
  _previous: TutorProfilePublicationActionState,
  formData: FormData,
): Promise<TutorProfilePublicationActionState> {
  const action = readPublicationAction(formData);

  if (!action) {
    return {
      ...initialTutorProfilePublicationActionState,
      code: "invalid_action",
      message: "Choose publish, pause, or resume to update your listing.",
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      ...initialTutorProfilePublicationActionState,
      code: "auth_unconfigured",
      message:
        "Listing publication is not available until Supabase auth is configured.",
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
      redirectPath = buildAuthSignInPath(PROFILE_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (requiresRoleSelection(account)) {
        redirectPath = routeFamilies.setup.defaultHref;
      } else if (
        !hasRole(account, "tutor", ["active", "pending"]) &&
        account.primary_role_context !== "tutor"
      ) {
        return {
          ...initialTutorProfilePublicationActionState,
          code: "not_a_tutor",
          message:
            "Switch to the tutor role from account setup before managing your public listing.",
        };
      } else {
        const result = await setTutorListingPublication(account, action);
        revalidatePath(PROFILE_PATH);
        revalidatePath(OVERVIEW_PATH);
        revalidatePath("/tutors/[slug]", "page");

        return {
          code: "ok",
          message: null,
          missingGateKeys: [],
          successMessage:
            result.publicListingStatus === "listed"
              ? "Your public listing is live."
              : "Your public listing is paused.",
        };
      }
    }
  } catch (error) {
    if (error instanceof TutorProfileEditorError) {
      if (error.code === "application_not_approved") {
        redirectPath = APPLY_PATH;
      } else {
        return {
          code: error.code,
          message: error.message,
          missingGateKeys: error.missingGateKeys,
          successMessage: null,
        };
      }
    } else {
      logJobsEvent("error", "tutor_listing_publication_failed", {
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        ...initialTutorProfilePublicationActionState,
        code: "tutor_listing_publication_failed",
        message:
          "We couldn't update your listing right now. Please try again in a moment.",
      };
    }
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    ...initialTutorProfilePublicationActionState,
    code: "unexpected",
    message: "We couldn't update your listing right now.",
  };
}

function readPublicationAction(
  formData: FormData,
): TutorListingPublicationAction | null {
  const raw = formData.get("action");
  if (raw === "publish" || raw === "self_pause" || raw === "resume") {
    return raw;
  }
  return null;
}

function readDraftValues(formData: FormData): TutorApplicationDraftInput {
  return {
    fullName: readString(formData, "full_name"),
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
