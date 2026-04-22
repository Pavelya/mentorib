import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

import { buildPostSignInRedirect, ensureAuthAccount } from "@/lib/auth/account-service";
import {
  buildAuthVerifyPath,
  getAuthVerifyStatusForCallbackError,
  getSafeRedirectPath,
} from "@/lib/auth/allowed-redirects";
import { normalizeTimezone } from "@/lib/datetime";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const timezone = normalizeTimezone(requestUrl.searchParams.get("timezone"));
  const upstreamError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error") ??
    requestUrl.searchParams.get("error_code");

  if (upstreamError) {
    return NextResponse.redirect(
      new URL(
        buildAuthVerifyPath(
          getAuthVerifyStatusForCallbackError(upstreamError, "callback_error"),
          nextPath,
        ),
        request.url,
      ),
    );
  }

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(buildAuthVerifyPath("error", nextPath), request.url),
    );
  }

  try {
    const cookieStore = await cookies();
    const { publishableKey, url } = getSupabasePublicEnv();
    let pendingCookies: Array<{
      name: string;
      options: CookieOptions;
      value: string;
    }> = [];
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          pendingCookies = cookiesToSet;

          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        new URL(
          buildAuthVerifyPath(
            getAuthVerifyStatusForCallbackError(exchangeError.message),
            nextPath,
          ),
          request.url,
        ),
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !hasResolvedEmail(user)) {
      return NextResponse.redirect(
        new URL(buildAuthVerifyPath("error", nextPath), request.url),
      );
    }

    const account = await ensureAuthAccount(user, timezone);
    const redirectResponse = NextResponse.redirect(
      new URL(buildPostSignInRedirect(account, nextPath), request.url),
    );

    pendingCookies.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });

    return redirectResponse;
  } catch {
    return NextResponse.redirect(
      new URL(buildAuthVerifyPath("error", nextPath), request.url),
    );
  }
}

function hasResolvedEmail(user: User | null): user is User & { email: string } {
  return Boolean(user?.email?.trim());
}
