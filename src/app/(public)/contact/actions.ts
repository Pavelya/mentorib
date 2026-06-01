"use server";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRestrictedAccount } from "@/modules/accounts/account-state";
import {
  SupportTicketError,
  createSupportTicket,
} from "@/modules/admin/support-ticket-service";

import type { ContactFormState } from "./action-state";

// Public contact-us submission (P2-ADMIN-SUPPORT-001). Always creates exactly
// one support ticket. A signed-in sender is linked to their account and uses
// their account email (authoritative); a logged-out sender supplies an email.
// The ticket insert runs through the service role inside the service, so this
// is a controlled server path rather than a public table insert.
export async function submitContactForm(
  _previous: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const submittedAt = Date.now();
  const subject = readString(formData, "subject");
  const body = readString(formData, "body");
  const providedEmail = readString(formData, "email");

  let requesterAppUserId: string | null = null;
  let requesterEmail = providedEmail;

  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email?.trim()) {
      try {
        const account = await ensureAuthAccount(user);
        if (isRestrictedAccount(account)) {
          return {
            code: "forbidden",
            message: "Your account can't send a message right now.",
            submittedAt,
          };
        }
        requesterAppUserId = account.id;
        requesterEmail = account.email;
      } catch {
        // Fall through as a logged-out submission using the provided email.
      }
    }
  }

  try {
    await createSupportTicket({
      body,
      requesterAppUserId,
      requesterEmail,
      subject,
    });
  } catch (error) {
    if (error instanceof SupportTicketError) {
      return { code: error.code, message: error.message, submittedAt };
    }
    return {
      code: "unexpected",
      message: "We couldn't submit your message. Try again in a moment.",
      submittedAt,
    };
  }

  return { code: "ok", message: null, submittedAt };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
