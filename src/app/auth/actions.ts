"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  buildAuthCallbackPath,
  buildAuthVerifyPath,
  getSafeRedirectPath,
} from "@/lib/auth/allowed-redirects";
import { getRequestOrigin } from "@/lib/http/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthActionState = {
  error: string | null;
};

export type MagicLinkActionState = AuthActionState & {
  email: string;
  emailError: string | null;
};

export async function sendMagicLinkAction(
  _previousState: MagicLinkActionState,
  formData: FormData,
): Promise<MagicLinkActionState> {
  const nextPath = getSafeRedirectPath(getFormValue(formData, "next"));
  const email = getFormValue(formData, "email").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return {
      email,
      emailError: "Enter a valid email address so we can send the sign-in link.",
      error: null,
    };
  }

  try {
    const requestOrigin = await getRequestOrigin();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: new URL(buildAuthCallbackPath(nextPath), requestOrigin).toString(),
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        email,
        emailError: null,
        error: "We couldn't send the magic link. Please try again in a moment.",
      };
    }
  } catch {
    return {
      email,
      emailError: null,
      error: "Sign-in is not available until the Supabase auth environment is configured.",
    };
  }

  redirect(buildAuthVerifyPath("sent", nextPath) as Route);
}

export async function startGoogleSignInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const nextPath = getSafeRedirectPath(getFormValue(formData, "next"));
  let redirectUrl: string | null = null;

  try {
    const requestOrigin = await getRequestOrigin();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      options: {
        queryParams: {
          prompt: "select_account",
        },
        redirectTo: new URL(buildAuthCallbackPath(nextPath), requestOrigin).toString(),
      },
      provider: "google",
    });

    if (error || !data.url) {
      return {
        error: "We couldn't start Google sign-in. Please try again.",
      };
    }

    redirectUrl = data.url;
  } catch {
    return {
      error: "We couldn't start Google sign-in. Please check the auth configuration and try again.",
    };
  }

  redirect(redirectUrl as Route);
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
