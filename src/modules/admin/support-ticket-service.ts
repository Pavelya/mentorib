import "server-only";

import { revalidatePath } from "next/cache";
import type { Route } from "next";

import { sendTransactionalEmail } from "@/lib/email/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";
import {
  SUPPORT_TICKET_STATUSES,
  type SupportTicketStatus,
} from "@/modules/admin/constants";

// `P2-ADMIN-SUPPORT-001` support-ticket write paths.
//
// `createSupportTicket` is the controlled ingestion point for the public
// contact-us form — it is not a privileged admin action and is not audited.
// The operator-side reply / status / assign helpers each write an
// `admin_action_logs` row in the same call as the state change.

export class SupportTicketError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const SUBJECT_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 5000;
const REPLY_MAX_LENGTH = 5000;
const EMAIL_MAX_LENGTH = 254;
// Basic shape guard; the canonical email truth is the account record when the
// sender is logged in. For logged-out senders this keeps obvious junk out.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Abuse guard: a single email may only open a handful of tickets in a short
// window. Inserts go through the service role (RLS-bypassing), so this is the
// only throttle on the public path.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_TICKETS = 3;

export function isSupportTicketStatus(
  value: string,
): value is SupportTicketStatus {
  return (SUPPORT_TICKET_STATUSES as readonly string[]).includes(value);
}

function sanitizeText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

export type CreateSupportTicketInput = {
  // Set when the sender is signed in; null for a logged-out contact submission.
  requesterAppUserId: string | null;
  requesterEmail: string;
  subject: string;
  body: string;
};

export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<{ ticketId: string }> {
  const email = sanitizeText(input.requesterEmail, EMAIL_MAX_LENGTH);
  if (!email || !EMAIL_RE.test(email)) {
    throw new SupportTicketError(
      "invalid_email",
      "Enter an email address we can reply to.",
    );
  }
  const subject = sanitizeText(input.subject, SUBJECT_MAX_LENGTH);
  if (!subject) {
    throw new SupportTicketError(
      "subject_required",
      "Add a short subject so we can route your message.",
    );
  }
  const body = sanitizeText(input.body, BODY_MAX_LENGTH);
  if (!body) {
    throw new SupportTicketError(
      "body_required",
      "Tell us what you need help with.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  const sinceIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: recentCount } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("requester_email", email)
    .gte("created_at", sinceIso);

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX_TICKETS) {
    throw new SupportTicketError(
      "rate_limited",
      "You've sent several messages recently. Give us a little time to respond before sending more.",
    );
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      body,
      channel: "contact_form",
      requester_app_user_id: input.requesterAppUserId,
      requester_email: email,
      status: "open",
      subject,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new SupportTicketError(
      "create_failed",
      "We couldn't submit your message right now. Try again in a moment.",
    );
  }

  revalidatePath("/internal/support");
  return { ticketId: data.id };
}

type SupportTicketRow = {
  id: string;
  requester_email: string;
  status: SupportTicketStatus;
  subject: string;
};

async function loadTicketRow(
  ticketId: string,
): Promise<SupportTicketRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, requester_email, status, subject")
    .eq("id", ticketId)
    .maybeSingle<SupportTicketRow>();

  if (error) {
    throw new SupportTicketError(
      "ticket_lookup_failed",
      "We couldn't read that ticket.",
    );
  }
  if (!data) {
    throw new SupportTicketError(
      "ticket_not_found",
      "We couldn't find that ticket.",
    );
  }
  return data;
}

export type ReplyToSupportTicketInput = {
  ticketId: string;
  body: string;
  actorAppUserId: string;
};

export async function replyToSupportTicket(
  input: ReplyToSupportTicketInput,
): Promise<void> {
  const body = sanitizeText(input.body, REPLY_MAX_LENGTH);
  if (!body) {
    throw new SupportTicketError(
      "reply_required",
      "Write a reply before sending.",
    );
  }

  const ticket = await loadTicketRow(input.ticketId);

  const sendResult = await sendTransactionalEmail({
    contentTag: "support_ticket_reply",
    recipientEmail: ticket.requester_email,
    subject: `Re: ${ticket.subject}`,
    template: {
      bodyParagraphs: [body],
      cta: null,
      preheader: "A reply from the Mentor IB support team.",
      title: "Re: your message to Mentor IB support",
    },
  });

  if (sendResult.outcome === "failed") {
    throw new SupportTicketError(
      "email_send_failed",
      "We couldn't send the reply email. Try again in a moment.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  // Replying moves an untouched ticket into active triage; resolved/closed
  // tickets keep their terminal status (a reply does not reopen them).
  const nextStatus: SupportTicketStatus =
    ticket.status === "open" ? "in_progress" : ticket.status;
  if (nextStatus !== ticket.status) {
    await supabase
      .from("support_tickets")
      .update({ status: nextStatus })
      .eq("id", ticket.id);
  }

  await recordAdminAction({
    action: "support.reply",
    actorAppUserId: input.actorAppUserId,
    afterState: { emailSent: sendResult.outcome === "sent", status: nextStatus },
    beforeState: { status: ticket.status },
    reason: body,
    targetId: ticket.id,
    targetType: "support_ticket",
  });

  revalidateSupportSurfaces(ticket.id);
}

export type SetSupportTicketStatusInput = {
  ticketId: string;
  status: SupportTicketStatus;
  actorAppUserId: string;
  reason?: string | null;
};

export async function setSupportTicketStatus(
  input: SetSupportTicketStatusInput,
): Promise<void> {
  if (!isSupportTicketStatus(input.status)) {
    throw new SupportTicketError(
      "invalid_status",
      "Pick a valid ticket status.",
    );
  }

  const ticket = await loadTicketRow(input.ticketId);
  if (ticket.status === input.status) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ status: input.status })
    .eq("id", ticket.id);

  if (error) {
    throw new SupportTicketError(
      "status_update_failed",
      "We couldn't update this ticket right now.",
    );
  }

  try {
    await recordAdminAction({
      action: "support.set_status",
      actorAppUserId: input.actorAppUserId,
      afterState: { status: input.status },
      beforeState: { status: ticket.status },
      reason: input.reason ?? null,
      targetId: ticket.id,
      targetType: "support_ticket",
    });
  } catch (auditError) {
    await supabase
      .from("support_tickets")
      .update({ status: ticket.status })
      .eq("id", ticket.id);
    throw auditError;
  }

  revalidateSupportSurfaces(ticket.id);
}

export type AssignSupportTicketInput = {
  ticketId: string;
  actorAppUserId: string;
};

// Self-assignment only this wave (the operator claims a ticket for triage).
export async function assignSupportTicketToSelf(
  input: AssignSupportTicketInput,
): Promise<void> {
  const ticket = await loadTicketRow(input.ticketId);

  const supabase = createSupabaseServiceRoleClient();
  const { data: existing } = await supabase
    .from("support_tickets")
    .select("assigned_to_app_user_id")
    .eq("id", ticket.id)
    .maybeSingle<{ assigned_to_app_user_id: string | null }>();

  if (existing?.assigned_to_app_user_id === input.actorAppUserId) {
    return;
  }

  const { error } = await supabase
    .from("support_tickets")
    .update({ assigned_to_app_user_id: input.actorAppUserId })
    .eq("id", ticket.id);

  if (error) {
    throw new SupportTicketError(
      "assign_failed",
      "We couldn't assign this ticket right now.",
    );
  }

  try {
    await recordAdminAction({
      action: "support.assign",
      actorAppUserId: input.actorAppUserId,
      afterState: { assignedToAppUserId: input.actorAppUserId },
      beforeState: {
        assignedToAppUserId: existing?.assigned_to_app_user_id ?? null,
      },
      targetId: ticket.id,
      targetType: "support_ticket",
    });
  } catch (auditError) {
    await supabase
      .from("support_tickets")
      .update({
        assigned_to_app_user_id: existing?.assigned_to_app_user_id ?? null,
      })
      .eq("id", ticket.id);
    throw auditError;
  }

  revalidateSupportSurfaces(ticket.id);
}

function revalidateSupportSurfaces(ticketId: string): void {
  revalidatePath("/internal/support");
  revalidatePath(`/internal/support/${ticketId}` as Route);
}
