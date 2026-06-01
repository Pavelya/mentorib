import { describe, expect, it } from "vitest";

import {
  SupportTicketError,
  createSupportTicket,
  isSupportTicketStatus,
} from "@/modules/admin/support-ticket-service";

// These guards run before any database access, so they exercise the public
// contact-form validation contract (P2-ADMIN-SUPPORT-001) without needing a
// Supabase client.

describe("isSupportTicketStatus", () => {
  it("accepts the four canonical statuses", () => {
    expect(isSupportTicketStatus("open")).toBe(true);
    expect(isSupportTicketStatus("in_progress")).toBe(true);
    expect(isSupportTicketStatus("resolved")).toBe(true);
    expect(isSupportTicketStatus("closed")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isSupportTicketStatus("archived")).toBe(false);
    expect(isSupportTicketStatus("")).toBe(false);
  });
});

describe("createSupportTicket validation", () => {
  const base = {
    body: "My lesson link is broken.",
    requesterAppUserId: null,
    requesterEmail: "person@example.com",
    subject: "Need help",
  };

  it("rejects a malformed email", async () => {
    await expect(
      createSupportTicket({ ...base, requesterEmail: "not-an-email" }),
    ).rejects.toMatchObject({ code: "invalid_email" });
  });

  it("requires a subject", async () => {
    await expect(
      createSupportTicket({ ...base, subject: "   " }),
    ).rejects.toMatchObject({ code: "subject_required" });
  });

  it("requires a body", async () => {
    await expect(
      createSupportTicket({ ...base, body: "" }),
    ).rejects.toBeInstanceOf(SupportTicketError);
  });
});
