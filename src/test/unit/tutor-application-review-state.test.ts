import { describe, expect, it } from "vitest";

import {
  getAvailableReviewActions,
  isAllowedReviewTransition,
  resolveNextApplicationStatus,
  resolveReviewStatusForAction,
} from "@/modules/tutors/application-review";

describe("tutor application review state machine", () => {
  it("only allows `claim` from `submitted`", () => {
    expect(isAllowedReviewTransition("claim", "submitted")).toBe(true);
    expect(isAllowedReviewTransition("claim", "under_review")).toBe(false);
    expect(isAllowedReviewTransition("claim", "changes_requested")).toBe(false);
    expect(isAllowedReviewTransition("claim", "approved")).toBe(false);
    expect(isAllowedReviewTransition("claim", "rejected")).toBe(false);
  });

  it("only allows `approve` / `request_changes` / `reject` from `under_review`", () => {
    for (const action of ["approve", "request_changes", "reject"] as const) {
      expect(isAllowedReviewTransition(action, "under_review")).toBe(true);
      expect(isAllowedReviewTransition(action, "submitted")).toBe(false);
      expect(isAllowedReviewTransition(action, "changes_requested")).toBe(false);
      expect(isAllowedReviewTransition(action, "approved")).toBe(false);
      expect(isAllowedReviewTransition(action, "rejected")).toBe(false);
      expect(isAllowedReviewTransition(action, "in_progress")).toBe(false);
      expect(isAllowedReviewTransition(action, "withdrawn")).toBe(false);
    }
  });

  it("resolves the next application status only for legal transitions", () => {
    expect(resolveNextApplicationStatus("claim", "submitted")).toBe("under_review");
    expect(resolveNextApplicationStatus("approve", "under_review")).toBe("approved");
    expect(resolveNextApplicationStatus("request_changes", "under_review")).toBe(
      "changes_requested",
    );
    expect(resolveNextApplicationStatus("reject", "under_review")).toBe("rejected");

    expect(resolveNextApplicationStatus("approve", "submitted")).toBeNull();
    expect(resolveNextApplicationStatus("claim", "approved")).toBeNull();
  });

  it("maps each action to its canonical review_status enum value", () => {
    expect(resolveReviewStatusForAction("claim")).toBe("under_review");
    expect(resolveReviewStatusForAction("approve")).toBe("approved");
    expect(resolveReviewStatusForAction("request_changes")).toBe("changes_requested");
    expect(resolveReviewStatusForAction("reject")).toBe("rejected");
  });

  it("surfaces only the actions that are legal from the current status", () => {
    expect(getAvailableReviewActions("submitted")).toEqual(["claim"]);
    expect(getAvailableReviewActions("under_review")).toEqual([
      "approve",
      "request_changes",
      "reject",
    ]);
    expect(getAvailableReviewActions("approved")).toEqual([]);
    expect(getAvailableReviewActions("rejected")).toEqual([]);
    expect(getAvailableReviewActions("changes_requested")).toEqual([]);
  });
});
