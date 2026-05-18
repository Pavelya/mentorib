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
  clearTutorIntroVideo,
  setTutorIntroVideo,
  setTutorIntroVideoPublication,
  TutorIntroVideoServiceError,
  type TutorIntroVideoPublicationAction,
} from "@/modules/tutors/media-video-reference-service";

import {
  initialTutorIntroVideoActionState,
  type TutorIntroVideoActionState,
} from "./action-types";

const VIDEO_PATH = "/tutor/profile/video" as const;

export async function setTutorIntroVideoAction(
  _previous: TutorIntroVideoActionState,
  formData: FormData,
): Promise<TutorIntroVideoActionState> {
  return runIntroVideoOperation(async (accountId) => {
    const providerUrl = readString(formData, "provider_url");
    await setTutorIntroVideo({ id: accountId }, { providerUrl });
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Video link saved. Publish it when you're ready.",
    };
  });
}

export async function clearTutorIntroVideoAction(
  previous: TutorIntroVideoActionState,
  formData: FormData,
): Promise<TutorIntroVideoActionState> {
  void previous;
  void formData;
  return runIntroVideoOperation(async (accountId) => {
    await clearTutorIntroVideo({ id: accountId });
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage: "Video link removed.",
    };
  });
}

export async function setTutorIntroVideoPublicationAction(
  _previous: TutorIntroVideoActionState,
  formData: FormData,
): Promise<TutorIntroVideoActionState> {
  return runIntroVideoOperation(async (accountId) => {
    const action = readPublicationAction(formData);
    if (!action) {
      return {
        ...initialTutorIntroVideoActionState,
        code: "invalid_action",
        message: "Choose publish or hide to update your intro video.",
      };
    }
    const result = await setTutorIntroVideoPublication(
      { id: accountId },
      action,
    );
    return {
      code: "ok",
      fieldErrors: {},
      message: null,
      successMessage:
        result.publicationStatus === "published"
          ? "Intro video published on your public profile."
          : "Intro video hidden from your public profile.",
    };
  });
}

async function runIntroVideoOperation(
  perform: (accountId: string) => Promise<TutorIntroVideoActionState>,
): Promise<TutorIntroVideoActionState> {
  if (!isSupabaseAuthConfigured()) {
    return {
      ...initialTutorIntroVideoActionState,
      code: "auth_unconfigured",
      message:
        "Managing your intro video is not available until Supabase auth is configured.",
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
      redirectPath = buildAuthSignInPath(VIDEO_PATH) as Route;
    } else {
      const account = await ensureAuthAccount(user);

      if (requiresRoleSelection(account)) {
        redirectPath = routeFamilies.setup.defaultHref;
      } else if (
        !hasRole(account, "tutor", ["active", "pending"]) &&
        account.primary_role_context !== "tutor"
      ) {
        return {
          ...initialTutorIntroVideoActionState,
          code: "not_a_tutor",
          message:
            "Switch to the tutor role from account setup before managing your intro video.",
        };
      } else {
        return await perform(account.id);
      }
    }
  } catch (error) {
    if (error instanceof TutorIntroVideoServiceError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        successMessage: null,
      };
    }
    logJobsEvent("error", "tutor_intro_video_action_failed", {
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      ...initialTutorIntroVideoActionState,
      code: "tutor_intro_video_action_failed",
      message:
        "We couldn't update your intro video right now. Please try again in a moment.",
    };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return {
    ...initialTutorIntroVideoActionState,
    code: "unexpected",
    message: "We couldn't update your intro video right now.",
  };
}

function readPublicationAction(
  formData: FormData,
): TutorIntroVideoPublicationAction | null {
  const raw = formData.get("action");
  if (raw === "publish" || raw === "hide") {
    return raw;
  }
  return null;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
