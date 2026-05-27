import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();
const mockRecordAdminAction = vi.fn();
const mockCreateListingNotification = vi.fn();
const mockSyncRecord = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/modules/admin/audit-service", () => ({
  recordAdminAction: (...args: unknown[]) => mockRecordAdminAction(...args),
}));

vi.mock("@/modules/notifications/lifecycle", () => ({
  createTutorListingStatusChangedNotification: (...args: unknown[]) =>
    mockCreateListingNotification(...args),
}));

vi.mock("@/modules/search/public-tutor-indexer", () => ({
  syncPublicTutorRecord: (...args: unknown[]) => mockSyncRecord(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/observability/logger", () => ({
  logEvent: vi.fn(),
  logJobsEvent: vi.fn(),
}));

// Import after mocks so the mocked dependencies are picked up.
import { applyPublicTakedownEffects } from "@/modules/admin/public-takedown-service";

type ProfileRow = {
  app_user_id: string;
  id: string;
  public_listing_status: string;
  public_slug: string | null;
};

function buildSupabase(options: {
  profile?: ProfileRow | null;
  updateError?: { message: string } | null;
}) {
  const updates: Array<Record<string, unknown>> = [];
  return {
    updates,
    client: {
      from(table: string) {
        if (table !== "tutor_profiles") {
          throw new Error(`Unexpected table ${table}`);
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: options.profile ?? null,
                error: null,
              }),
            }),
          }),
          update: (payload: Record<string, unknown>) => {
            updates.push(payload);
            return {
              eq: async () => ({ error: options.updateError ?? null }),
            };
          },
        };
      },
    },
  };
}

describe("applyPublicTakedownEffects", () => {
  beforeEach(() => {
    mockRecordAdminAction.mockReset();
    mockCreateListingNotification.mockReset();
    mockSyncRecord.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("flips listing status, writes audit, fires notification, and revalidates", async () => {
    const supa = buildSupabase({
      profile: {
        app_user_id: "user-1",
        id: "profile-1",
        public_listing_status: "listed",
        public_slug: "tutor-1",
      },
    });
    mockServiceRoleClient.mockReturnValue(supa.client);

    await applyPublicTakedownEffects({
      actorAppUserId: "admin-1",
      reason: "policy_violation",
      tutorProfileId: "profile-1",
    });

    expect(supa.updates).toEqual([{ public_listing_status: "delisted" }]);
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "tutor_listing.public_takedown",
        actorAppUserId: "admin-1",
        targetType: "tutor_profile",
        targetId: "profile-1",
      }),
    );
    expect(mockCreateListingNotification).toHaveBeenCalledWith({
      appUserId: "user-1",
      publicListingStatus: "delisted",
      reason: "admin_takedown",
      tutorProfileId: "profile-1",
    });
    expect(mockSyncRecord).toHaveBeenCalledWith("profile-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutors/tutor-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutors");
  });

  it("rolls back the listing flip when audit recording fails", async () => {
    const supa = buildSupabase({
      profile: {
        app_user_id: "user-1",
        id: "profile-1",
        public_listing_status: "listed",
        public_slug: null,
      },
    });
    mockServiceRoleClient.mockReturnValue(supa.client);
    mockRecordAdminAction.mockRejectedValueOnce(new Error("audit_insert_failed"));

    await expect(
      applyPublicTakedownEffects({
        actorAppUserId: "admin-1",
        reason: null,
        tutorProfileId: "profile-1",
      }),
    ).rejects.toThrow();

    expect(supa.updates).toEqual([
      { public_listing_status: "delisted" },
      { public_listing_status: "listed" },
    ]);
    expect(mockCreateListingNotification).not.toHaveBeenCalled();
    expect(mockSyncRecord).not.toHaveBeenCalled();
  });

  it("is idempotent when the profile is already delisted", async () => {
    const supa = buildSupabase({
      profile: {
        app_user_id: "user-2",
        id: "profile-2",
        public_listing_status: "delisted",
        public_slug: "tutor-2",
      },
    });
    mockServiceRoleClient.mockReturnValue(supa.client);

    await applyPublicTakedownEffects({
      actorAppUserId: "admin-1",
      reason: null,
      tutorProfileId: "profile-2",
    });

    expect(supa.updates).toEqual([]);
    expect(mockRecordAdminAction).not.toHaveBeenCalled();
    expect(mockCreateListingNotification).toHaveBeenCalledWith({
      appUserId: "user-2",
      publicListingStatus: "delisted",
      reason: "admin_takedown",
      tutorProfileId: "profile-2",
    });
    expect(mockSyncRecord).toHaveBeenCalledWith("profile-2");
  });
});
