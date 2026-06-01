"use server";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  SupportTicketError,
  assignSupportTicketToSelf,
  isSupportTicketStatus,
  replyToSupportTicket,
  setSupportTicketStatus,
} from "@/modules/admin/support-ticket-service";

import type { SupportActionState } from "./action-state";

export async function runReplyAction(
  _previous: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const ticketId = readString(formData, "ticket_id");
  const body = readString(formData, "body");

  if (!ticketId) {
    return fail("missing_ticket", "Missing ticket reference.");
  }

  const admin = await requireInternalAdminAccount();
  try {
    await replyToSupportTicket({ actorAppUserId: admin.id, body, ticketId });
  } catch (error) {
    return toErrorState(error, "We couldn't send that reply right now.");
  }
  return {
    code: "ok",
    message: null,
    successMessage: "Reply sent to the requester.",
  };
}

export async function runSetStatusAction(
  _previous: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const ticketId = readString(formData, "ticket_id");
  const status = readString(formData, "status");
  const reason = readString(formData, "reason") || null;

  if (!ticketId) {
    return fail("missing_ticket", "Missing ticket reference.");
  }
  if (!isSupportTicketStatus(status)) {
    return fail("invalid_status", "Pick a valid ticket status.");
  }

  const admin = await requireInternalAdminAccount();
  try {
    await setSupportTicketStatus({
      actorAppUserId: admin.id,
      reason,
      status,
      ticketId,
    });
  } catch (error) {
    return toErrorState(error, "We couldn't update this ticket right now.");
  }
  return { code: "ok", message: null, successMessage: "Status updated." };
}

export async function runAssignToMeAction(
  _previous: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const ticketId = readString(formData, "ticket_id");
  if (!ticketId) {
    return fail("missing_ticket", "Missing ticket reference.");
  }

  const admin = await requireInternalAdminAccount();
  try {
    await assignSupportTicketToSelf({ actorAppUserId: admin.id, ticketId });
  } catch (error) {
    return toErrorState(error, "We couldn't assign this ticket right now.");
  }
  return { code: "ok", message: null, successMessage: "Assigned to you." };
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fail(code: string, message: string): SupportActionState {
  return { code, message, successMessage: null };
}

function toErrorState(error: unknown, fallback: string): SupportActionState {
  if (error instanceof SupportTicketError) {
    return { code: error.code, message: error.message, successMessage: null };
  }
  return { code: "unexpected", message: fallback, successMessage: null };
}
