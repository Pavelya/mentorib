import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnsureAuthAccount = vi.fn();
const mockServerClient = vi.fn();
const mockAuthGetUser = vi.fn();
const mockUpsert = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAuthConfigured: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockServerClient(),
}));

vi.mock("@/lib/auth/account-service", () => ({
  ensureAuthAccount: (...args: unknown[]) => mockEnsureAuthAccount(...args),
}));

import { updateNotificationPreference } from "@/app/(account)/notifications/notification-preference-actions";

const APP_USER_ID = "11111111-1111-4111-8111-111111111111";

function setSupabaseBehavior(options: { upsertError?: { message: string } | null } = {}) {
  mockUpsert.mockResolvedValue({ error: options.upsertError ?? null });
  mockServerClient.mockReturnValue({
    auth: { getUser: () => mockAuthGetUser() },
    from(table: string) {
      if (table === "notification_preferences") {
        return {
          upsert: (payload: Record<string, unknown>, options?: unknown) =>
            mockUpsert(payload, options),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  });
}

beforeEach(() => {
  mockEnsureAuthAccount.mockReset();
  mockServerClient.mockReset();
  mockAuthGetUser.mockReset();
  mockUpsert.mockReset();
  mockRevalidatePath.mockReset();

  mockAuthGetUser.mockResolvedValue({
    data: { user: { email: "owner@example.com", id: "auth-id" } },
    error: null,
  });
  mockEnsureAuthAccount.mockResolvedValue({ id: APP_USER_ID });
});

describe("updateNotificationPreference", () => {
  it("rejects unknown notification categories", async () => {
    setSupabaseBehavior();

    const result = await updateNotificationPreference({
      category: "not_a_category" as never,
      channel: "in_app",
      enabled: false,
    });

    expect(result.code).toBe("invalid_input");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("rejects toggling email on an in-app-only category", async () => {
    setSupabaseBehavior();

    const result = await updateNotificationPreference({
      category: "lesson_recaps",
      channel: "email",
      enabled: true,
    });

    expect(result.code).toBe("channel_not_toggleable");
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("upserts the in_app_enabled value for a valid request", async () => {
    setSupabaseBehavior();

    const result = await updateNotificationPreference({
      category: "reviews",
      channel: "in_app",
      enabled: false,
    });

    expect(result.code).toBe("success");
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const [payload, options] = mockUpsert.mock.calls[0]!;
    expect(payload).toEqual({
      app_user_id: APP_USER_ID,
      in_app_enabled: false,
      notification_category: "reviews",
    });
    expect(options).toEqual({ onConflict: "app_user_id,notification_category" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/notifications");
  });

  it("upserts the email_enabled value when channel is email", async () => {
    setSupabaseBehavior();

    const result = await updateNotificationPreference({
      category: "lesson_reminders",
      channel: "email",
      enabled: false,
    });

    expect(result.code).toBe("success");
    const [payload] = mockUpsert.mock.calls[0]!;
    expect(payload).toEqual({
      app_user_id: APP_USER_ID,
      email_enabled: false,
      notification_category: "lesson_reminders",
    });
  });

  it("surfaces a persist failure when the upsert returns an error", async () => {
    setSupabaseBehavior({ upsertError: { message: "rls denied" } });

    const result = await updateNotificationPreference({
      category: "reviews",
      channel: "email",
      enabled: false,
    });

    expect(result.code).toBe("persist_failed");
  });

  it("returns auth_required when the session is unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });
    setSupabaseBehavior();

    const result = await updateNotificationPreference({
      category: "reviews",
      channel: "in_app",
      enabled: false,
    });

    expect(result.code).toBe("auth_required");
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
