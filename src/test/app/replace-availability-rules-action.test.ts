import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRevalidatePath = vi.fn();
const mockEnsureAuthAccount = vi.fn();
const mockReplaceAvailabilityRules = vi.fn();
const mockGetUser = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    const error = new Error(`NEXT_REDIRECT:${path}`) as Error & {
      digest: string;
    };
    error.digest = `NEXT_REDIRECT;replace;${path}`;
    throw error;
  },
}));

vi.mock("@/lib/auth/account-service", () => ({
  ensureAuthAccount: (...args: unknown[]) => mockEnsureAuthAccount(...args),
}));

vi.mock("@/lib/auth/allowed-redirects", () => ({
  buildAuthSignInPath: (path: string) => `/auth/sign-in?next=${path}`,
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAuthConfigured: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: () => mockGetUser() },
  }),
}));

vi.mock("@/modules/tutors/tutor-schedule", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/tutors/tutor-schedule")
  >("@/modules/tutors/tutor-schedule");
  return {
    ...actual,
    replaceAvailabilityRules: (...args: unknown[]) =>
      mockReplaceAvailabilityRules(...args),
  };
});

import { replaceAvailabilityRulesAction } from "@/app/tutor/schedule/actions";
import { initialReplaceAvailabilityRulesState } from "@/app/tutor/schedule/action-types";
import { AvailabilityRuleCommandError } from "@/modules/tutors/tutor-schedule";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { email: "tutor@example.com" } },
    error: null,
  });
  mockEnsureAuthAccount.mockResolvedValue({ id: "user-1" });
  mockReplaceAvailabilityRules.mockResolvedValue(undefined);
});

function formWithSlots(slots: unknown) {
  const data = new FormData();
  data.set("slots", typeof slots === "string" ? slots : JSON.stringify(slots));
  return data;
}

describe("replaceAvailabilityRulesAction", () => {
  it("coalesces the parsed slot set and delegates to replaceAvailabilityRules", async () => {
    const state = await replaceAvailabilityRulesAction(
      initialReplaceAvailabilityRulesState,
      formWithSlots(["1:9", "1:10", "1:11", "3:14"]),
    );

    expect(state).toEqual({
      code: "success",
      message: "Availability saved.",
    });
    expect(mockReplaceAvailabilityRules).toHaveBeenCalledWith({ id: "user-1" }, [
      { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "12:00" },
      { dayOfWeek: 3, startLocalTime: "14:00", endLocalTime: "15:00" },
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/schedule");
  });

  it("rejects malformed JSON and does not write", async () => {
    const state = await replaceAvailabilityRulesAction(
      initialReplaceAvailabilityRulesState,
      formWithSlots("not-json"),
    );

    expect(state.code).toBe("invalid_slots");
    expect(mockReplaceAvailabilityRules).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("rejects slots that are not strings of the expected shape", async () => {
    const state = await replaceAvailabilityRulesAction(
      initialReplaceAvailabilityRulesState,
      formWithSlots(["7:9"]),
    );

    expect(state.code).toBe("invalid_slots");
    expect(mockReplaceAvailabilityRules).not.toHaveBeenCalled();
  });

  it("redirects to sign-in when the request has no authenticated user (same gate as addAvailabilityRuleAction)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      replaceAvailabilityRulesAction(
        initialReplaceAvailabilityRulesState,
        formWithSlots([]),
      ),
    ).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/auth/sign-in?next=/tutor/schedule",
    });

    expect(mockReplaceAvailabilityRules).not.toHaveBeenCalled();
  });

  it("propagates AvailabilityRuleCommandError codes (e.g. tutor_profile_missing)", async () => {
    mockReplaceAvailabilityRules.mockRejectedValue(
      new AvailabilityRuleCommandError(
        "tutor_profile_missing",
        "Create your tutor profile before saving availability.",
      ),
    );

    const state = await replaceAvailabilityRulesAction(
      initialReplaceAvailabilityRulesState,
      formWithSlots(["1:9"]),
    );

    expect(state.code).toBe("tutor_profile_missing");
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
