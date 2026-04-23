import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { routeFamilies } from "@/lib/routing/route-families";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  cancelBookingCheckoutReturn,
  finalizeBookingCheckoutReturn,
} from "@/modules/lessons/booking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const context = url.searchParams.get("context")?.trim() ?? "";
  const checkoutState = url.searchParams.get("checkout")?.trim() ?? "";
  const operationKey = url.searchParams.get("operation")?.trim() ?? "";
  const sessionId = url.searchParams.get("session_id")?.trim() ?? "";

  if (!context || !operationKey) {
    return NextResponse.redirect(new URL("/match", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    return NextResponse.redirect(
      new URL(buildAuthSignInPath(`/book/${context}`), request.url),
    );
  }

  const account = await ensureAuthAccount(user);

  if (requiresRoleSelection(account)) {
    return NextResponse.redirect(new URL(routeFamilies.setup.defaultHref, request.url));
  }

  if (isRestrictedAccount(account) || !hasRole(account, "student")) {
    return NextResponse.redirect(
      new URL(buildPostSignInRedirect(account, `/book/${context}`), request.url),
    );
  }

  try {
    if (checkoutState === "cancelled") {
      await cancelBookingCheckoutReturn(account, context, operationKey);
      revalidateBookingPaths(context);

      return NextResponse.redirect(
        new URL(buildBookingResultPath(context, "cancelled", operationKey), request.url),
      );
    }

    if (!sessionId) {
      return NextResponse.redirect(
        new URL(buildBookingResultPath(context, "error", operationKey), request.url),
      );
    }

    await finalizeBookingCheckoutReturn(account, context, operationKey, sessionId);
    revalidateBookingPaths(context);

    return NextResponse.redirect(
      new URL(buildBookingResultPath(context, "success", operationKey), request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL(buildBookingResultPath(context, "error", operationKey), request.url),
    );
  }
}

function revalidateBookingPaths(context: string) {
  revalidatePath(`/book/${context}`);
  revalidatePath("/lessons");
  revalidatePath("/results");
}

function buildBookingResultPath(context: string, checkoutState: string, operationKey: string) {
  const url = new URL(`https://mentorib.invalid/book/${encodeURIComponent(context)}`);
  url.searchParams.set("checkout", checkoutState);
  url.searchParams.set("operation", operationKey);

  return `${url.pathname}${url.search}`;
}
