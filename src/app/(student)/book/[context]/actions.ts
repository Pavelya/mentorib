"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { getRequestOrigin } from "@/lib/http/request-origin";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  BookingCommandError,
  startBookingRequestCheckout,
} from "@/modules/lessons/booking";

export type BookingRequestActionState = {
  code: string | null;
  fieldErrors: Partial<Record<"note" | "slotStartAt", string>>;
  message: string | null;
  values: {
    context: string;
    note: string;
    operationKey: string;
    slotStartAt: string;
  };
};

export async function submitBookingRequestAction(
  _previousState: BookingRequestActionState,
  formData: FormData,
): Promise<BookingRequestActionState> {
  const values = {
    context: getFormValue(formData, "context"),
    note: getFormValue(formData, "note"),
    operationKey: getFormValue(formData, "operationKey"),
    slotStartAt: getFormValue(formData, "slotStartAt"),
  };

  if (!values.context) {
    return {
      code: "missing_context",
      fieldErrors: {},
      message: "We couldn't recover the booking handoff. Return to the tutor and try again.",
      values,
    };
  }

  if (!values.slotStartAt) {
    return {
      code: "missing_slot",
      fieldErrors: {
        slotStartAt: "Choose a currently available lesson time.",
      },
      message: "Choose a lesson time before you continue.",
      values,
    };
  }

  if (!isSupabaseAuthConfigured()) {
    return {
      code: "auth_unconfigured",
      fieldErrors: {},
      message:
        "Booking needs the Supabase auth environment variables before it can continue into Stripe Checkout.",
      values,
    };
  }

  const origin = await getRequestOrigin();
  const nextPath = `/book/${values.context}`;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(nextPath) as Route);
  }

  try {
    const account = await ensureAuthAccount(user);

    if (requiresRoleSelection(account)) {
      redirect(routeFamilies.setup.defaultHref);
    }

    if (isRestrictedAccount(account)) {
      return {
        code: "account_restricted",
        fieldErrors: {},
        message: "This account cannot request a lesson right now.",
        values,
      };
    }

    if (!hasRole(account, "student")) {
      redirect(buildPostSignInRedirect(account, nextPath) as Route);
    }

    const bookingResult = await startBookingRequestCheckout(account, {
      context: values.context,
      note: values.note,
      operationKey: values.operationKey,
      origin,
      slotStartAt: values.slotStartAt,
    });

    if (bookingResult.kind === "success_redirect") {
      redirect(bookingResult.redirectPath as Route);
    }

    redirect(bookingResult.checkoutUrl as never);
  } catch (error) {
    if (error instanceof BookingCommandError) {
      return {
        code: error.code,
        fieldErrors: error.fieldErrors,
        message: error.message,
        values,
      };
    }

    return {
      code: "booking_checkout_failed",
      fieldErrors: {},
      message:
        "We couldn't open the payment authorization step yet. Please try again in a moment.",
      values,
    };
  }
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
