"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { logJobsEvent } from "@/lib/jobs/logging";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasRole, requiresRoleSelection } from "@/modules/accounts/account-state";
import {
  setTutorProfilePhotoPublication,
  TutorPublicMediaServiceError,
  updateTutorProfilePhotoAlt,
  uploadTutorProfilePhoto,
  applyAccountAvatarAsTutorPhoto,
  type TutorProfilePhotoPublicationAction,
} from "@/modules/tutors/media-public-assets-service";

import {
  initialTutorProfilePhotoActionState,
  type TutorProfilePhotoActionState,
} from "./action-types";

const PHOTO_PATH = "/tutor/profile/photo" as const;

export async function uploadTutorProfilePhotoAction(
  _previous: TutorProfilePhotoActionState,
  formData: FormData,
): Promise<TutorProfilePhotoActionState> {
  return runPhotoOperation(async (accountId): Promise<TutorProfilePhotoActionState> => {
    const file = readFile(formData, "file");
    if (!file) {
      return {
        code: "validation_failed",
        fieldErrors: { file: ["Choose a photo file before uploading."] },
        message: "Please correct the highlighted fields before saving.",
        successMessage: null,
      };
    }
    const altText = readOptionalString(formData, "alt_text");
    await uploadTutorProfilePhoto({ id: accountId }, file, altText);
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Photo uploaded. Publish it when you're ready.",
    };
  });
}

export async function updateTutorProfilePhotoAltAction(
  _previous: TutorProfilePhotoActionState,
  formData: FormData,
): Promise<TutorProfilePhotoActionState> {
  return runPhotoOperation(async (accountId) => {
    const altText = readOptionalString(formData, "alt_text");
    await updateTutorProfilePhotoAlt({ id: accountId }, altText);
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Photo description saved.",
    };
  });
}

export async function applyAccountAvatarAsTutorPhotoAction(
  _previous: TutorProfilePhotoActionState,
  _formData: FormData,
): Promise<TutorProfilePhotoActionState> {
  void _formData;
  return runPhotoOperation(async (accountId) => {
    await applyAccountAvatarAsTutorPhoto({ id: accountId });
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage:
        "Account avatar copied as your tutor profile photo. Publish it when you're ready.",
    };
  });
}

export async function setTutorProfilePhotoPublicationAction(
  _previous: TutorProfilePhotoActionState,
  formData: FormData,
): Promise<TutorProfilePhotoActionState> {
  return runPhotoOperation(async (accountId) => {
    const action = readPublicationAction(formData);
    if (!action) {
      return {
        ...initialTutorProfilePhotoActionState,
        code: "invalid_action",
        message: "Choose publish, hide, or remove to update your photo.",
      };
    }
    const result = await setTutorProfilePhotoPublication(
      { id: accountId },
      action,
    );
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage:
        result.action === "publish"
          ? "Photo published on your public profile."
          : result.action === "hide"
            ? "Photo hidden from your public profile."
            : "Photo removed.",
    };
  });
}

async function runPhotoOperation(
  perform: (accountId: string) => Promise<TutorProfilePhotoActionState>,
): Promise<TutorProfilePhotoActionState> {
  if (!isSupabaseAuthConfigured()) {
    return {
      ...initialTutorProfilePhotoActionState,
      code: "auth_unconfigured",
      message:
        "Managing your profile photo is not available until Supabase auth is configured.",
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
      redirectPath = buildAuthSignInPath(PHOTO_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (requiresRoleSelection(account)) {
        redirectPath = routeFamilies.setup.defaultHref;
      } else if (
        !hasRole(account, "tutor", ["active", "pending"]) &&
        account.primary_role_context !== "tutor"
      ) {
        return {
          ...initialTutorProfilePhotoActionState,
          code: "not_a_tutor",
          message:
            "Switch to the tutor role from account setup before managing your photo.",
        };
      } else {
        return await perform(account.id);
      }
    }
  } catch (error) {
    if (error instanceof TutorPublicMediaServiceError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        successMessage: null,
      };
    }
    logJobsEvent("error", "tutor_profile_photo_action_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      ...initialTutorProfilePhotoActionState,
      code: "tutor_profile_photo_action_failed",
      message:
        "We couldn't update your profile photo right now. Please try again in a moment.",
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    ...initialTutorProfilePhotoActionState,
    code: "unexpected",
    message: "We couldn't update your profile photo right now.",
  };
}

function readPublicationAction(
  formData: FormData,
): TutorProfilePhotoPublicationAction | null {
  const raw = formData.get("action");
  if (raw === "publish" || raw === "hide" || raw === "remove") {
    return raw;
  }
  return null;
}

function readFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function readOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
