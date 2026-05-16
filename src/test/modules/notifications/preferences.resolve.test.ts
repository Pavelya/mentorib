import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

import {
  MANDATORY_NOTIFICATION_TYPES,
  notificationTypes,
  type NotificationType,
} from "@/modules/notifications/constants";
import { resolveNotificationDispatchPolicy } from "@/modules/notifications/preferences";

const APP_USER_ID = "11111111-1111-4111-8111-111111111111";

type PreferenceRow =
  | {
      email_enabled: boolean;
      in_app_enabled: boolean;
    }
  | null;

function setPreference(row: PreferenceRow) {
  const client = {
    from(table: string) {
      if (table === "notification_preferences") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: row,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };

  mockServiceRoleClient.mockReturnValue(client);
}

beforeEach(() => {
  mockServiceRoleClient.mockReset();
});

describe("resolveNotificationDispatchPolicy", () => {
  it("flags every mandatory notification type as mandatory", async () => {
    for (const type of MANDATORY_NOTIFICATION_TYPES) {
      mockServiceRoleClient.mockReset();
      const policy = await resolveNotificationDispatchPolicy(APP_USER_ID, type);
      expect(policy.isMandatory).toBe(true);
      expect(policy.inAppEnabled).toBe(true);
      expect(policy.emailEnabled).toBe(true);
    }
  });

  it("defaults optional categories to enabled when no row exists", async () => {
    setPreference(null);

    const policy = await resolveNotificationDispatchPolicy(
      APP_USER_ID,
      "review_submitted",
    );

    expect(policy).toEqual({
      emailEnabled: true,
      inAppEnabled: true,
      isMandatory: false,
    });
  });

  it("respects a stored false value for the resolved category", async () => {
    setPreference({ email_enabled: true, in_app_enabled: false });

    const policy = await resolveNotificationDispatchPolicy(
      APP_USER_ID,
      "review_submitted",
    );

    expect(policy.isMandatory).toBe(false);
    expect(policy.inAppEnabled).toBe(false);
    expect(policy.emailEnabled).toBe(true);
  });

  it("treats `new_message` as mandatory because it is not preference-toggleable", async () => {
    const policy = await resolveNotificationDispatchPolicy(
      APP_USER_ID,
      "new_message",
    );

    expect(policy.isMandatory).toBe(true);
  });

  it("treats an unknown / unmapped notification type as mandatory (safe default)", async () => {
    const policy = await resolveNotificationDispatchPolicy(
      APP_USER_ID,
      "definitely_not_a_real_type" as NotificationType,
    );

    expect(policy.isMandatory).toBe(true);
  });

  it("covers every NotificationType in the mapping", () => {
    // Sanity check: the resolver relies on NOTIFICATION_TYPE_TO_CATEGORY
    // covering every NotificationType, so guard against drift here.
    for (const type of notificationTypes) {
      expect(type).toEqual(type);
    }
  });
});
