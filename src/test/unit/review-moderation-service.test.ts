import { describe, expect, it } from "vitest";

import {
  ReviewModerationError,
  isReviewModerationStatus,
  setReviewModerationStatus,
} from "@/modules/admin/review-moderation-service";

// These guards run before any database access, so they exercise the
// validation contract for the hide/redact action (P2-ADMIN-TRUST-001)
// without needing a Supabase client.

describe("isReviewModerationStatus", () => {
  it("accepts the two operator-settable moderation states", () => {
    expect(isReviewModerationStatus("hidden")).toBe(true);
    expect(isReviewModerationStatus("rejected")).toBe(true);
  });

  it("rejects published and any other review status", () => {
    expect(isReviewModerationStatus("published")).toBe(false);
    expect(isReviewModerationStatus("submitted")).toBe(false);
    expect(isReviewModerationStatus("under_review")).toBe(false);
    expect(isReviewModerationStatus("nonsense")).toBe(false);
  });
});

describe("setReviewModerationStatus validation", () => {
  it("rejects a status that is not hide/reject", async () => {
    await expect(
      setReviewModerationStatus({
        actorAppUserId: "00000000-0000-4000-8000-000000000000",
        moderationNote: "A real note",
        reviewId: "11111111-1111-4111-8111-111111111111",
        // @ts-expect-error — deliberately invalid status for the guard test
        status: "published",
      }),
    ).rejects.toMatchObject({ code: "invalid_status" });
  });

  it("requires a non-empty moderation note", async () => {
    await expect(
      setReviewModerationStatus({
        actorAppUserId: "00000000-0000-4000-8000-000000000000",
        moderationNote: "   ",
        reviewId: "11111111-1111-4111-8111-111111111111",
        status: "hidden",
      }),
    ).rejects.toBeInstanceOf(ReviewModerationError);
  });
});
