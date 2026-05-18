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
  deleteTutorCredential,
  replaceTutorCredentialFile,
  setTutorCredentialPublicDisplayPreference,
  TutorCredentialServiceError,
  updateTutorCredentialMetadata,
  uploadTutorCredential,
  type TutorCredentialUploadInput,
} from "@/modules/tutors/media-credentials-service";

import {
  initialTutorCredentialActionState,
  type TutorCredentialActionState,
} from "./action-types";

const CREDENTIALS_PATH = "/tutor/profile/credentials" as const;

export async function uploadTutorCredentialAction(
  _previous: TutorCredentialActionState,
  formData: FormData,
): Promise<TutorCredentialActionState> {
  return runCredentialOperation(async (accountId): Promise<TutorCredentialActionState> => {
    const file = readFile(formData, "file");
    if (!file) {
      return {
        code: "validation_failed",
        fieldErrors: { file: ["Choose a credential file before uploading."] },
        message: "Please correct the highlighted fields before saving.",
        successMessage: null,
      };
    }

    const input = readMetadataInput(formData);
    await uploadTutorCredential({ id: accountId }, input, file);
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Credential uploaded.",
    };
  });
}

export async function replaceTutorCredentialFileAction(
  _previous: TutorCredentialActionState,
  formData: FormData,
): Promise<TutorCredentialActionState> {
  return runCredentialOperation(async (accountId): Promise<TutorCredentialActionState> => {
    const credentialId = readString(formData, "credential_id");
    const file = readFile(formData, "file");
    if (!file) {
      return {
        code: "validation_failed",
        fieldErrors: { file: ["Choose a credential file before uploading."] },
        message: "Please correct the highlighted fields before saving.",
        successMessage: null,
      };
    }
    await replaceTutorCredentialFile({ id: accountId }, credentialId, file);
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Credential file replaced.",
    };
  });
}

export async function updateTutorCredentialMetadataAction(
  _previous: TutorCredentialActionState,
  formData: FormData,
): Promise<TutorCredentialActionState> {
  return runCredentialOperation(async (accountId) => {
    const credentialId = readString(formData, "credential_id");
    const input = readMetadataInput(formData);
    await updateTutorCredentialMetadata({ id: accountId }, credentialId, input);
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Credential details saved.",
    };
  });
}

export async function setTutorCredentialPublicDisplayAction(
  _previous: TutorCredentialActionState,
  formData: FormData,
): Promise<TutorCredentialActionState> {
  return runCredentialOperation(async (accountId) => {
    const credentialId = readString(formData, "credential_id");
    const next = readString(formData, "public_display_preference") === "true";
    await setTutorCredentialPublicDisplayPreference(
      { id: accountId },
      credentialId,
      next,
    );
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: next
        ? "Marked to display once approved."
        : "Hidden from public proof preview.",
    };
  });
}

export async function deleteTutorCredentialAction(
  _previous: TutorCredentialActionState,
  formData: FormData,
): Promise<TutorCredentialActionState> {
  return runCredentialOperation(async (accountId) => {
    const credentialId = readString(formData, "credential_id");
    await deleteTutorCredential({ id: accountId }, credentialId);
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Credential deleted.",
    };
  });
}

async function runCredentialOperation(
  perform: (accountId: string) => Promise<TutorCredentialActionState>,
): Promise<TutorCredentialActionState> {
  if (!isSupabaseAuthConfigured()) {
    return {
      ...initialTutorCredentialActionState,
      code: "auth_unconfigured",
      message:
        "Managing credentials is not available until Supabase auth is configured.",
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
      redirectPath = buildAuthSignInPath(CREDENTIALS_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (requiresRoleSelection(account)) {
        redirectPath = routeFamilies.setup.defaultHref;
      } else if (
        !hasRole(account, "tutor", ["active", "pending"]) &&
        account.primary_role_context !== "tutor"
      ) {
        return {
          ...initialTutorCredentialActionState,
          code: "not_a_tutor",
          message:
            "Switch to the tutor role from account setup before managing credentials.",
        };
      } else {
        return await perform(account.id);
      }
    }
  } catch (error) {
    if (error instanceof TutorCredentialServiceError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        successMessage: null,
      };
    }
    logJobsEvent("error", "tutor_credential_action_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      ...initialTutorCredentialActionState,
      code: "tutor_credential_action_failed",
      message:
        "We couldn't update that credential right now. Please try again in a moment.",
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    ...initialTutorCredentialActionState,
    code: "unexpected",
    message: "We couldn't update that credential right now.",
  };
}

function readMetadataInput(formData: FormData): TutorCredentialUploadInput {
  return {
    credentialType: readString(formData, "credential_type"),
    title: readString(formData, "title"),
    issuingBody: readOptionalString(formData, "issuing_body"),
    credentialSubjectId: readOptionalString(formData, "credential_subject_id"),
    credentialSubjectFocusAreaId: readOptionalString(
      formData,
      "credential_subject_focus_area_id",
    ),
  };
}

function readFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
