import { describe, expect, it } from "vitest";

import {
  isAllowedCaseTransition,
  isAllowedResolutionKind,
  resolveNextCaseStatus,
} from "@/modules/admin/moderation-case-state";

describe("moderation case state machine", () => {
  it("only allows `claim` from `queued`", () => {
    expect(isAllowedCaseTransition("claim", "queued")).toBe(true);
    expect(isAllowedCaseTransition("claim", "under_review")).toBe(false);
    expect(isAllowedCaseTransition("claim", "resolved")).toBe(false);
    expect(isAllowedCaseTransition("claim", "dismissed")).toBe(false);
    expect(isAllowedCaseTransition("claim", "escalated")).toBe(false);
  });

  it("only allows `resolve` from `under_review`", () => {
    expect(isAllowedCaseTransition("resolve", "under_review")).toBe(true);
    expect(isAllowedCaseTransition("resolve", "queued")).toBe(false);
    expect(isAllowedCaseTransition("resolve", "resolved")).toBe(false);
  });

  it("allows `dismiss` and `escalate` from queued or under_review", () => {
    for (const status of ["queued", "under_review"] as const) {
      expect(isAllowedCaseTransition("dismiss", status)).toBe(true);
      expect(isAllowedCaseTransition("escalate", status)).toBe(true);
    }
    for (const status of ["resolved", "dismissed", "escalated"] as const) {
      expect(isAllowedCaseTransition("dismiss", status)).toBe(false);
      expect(isAllowedCaseTransition("escalate", status)).toBe(false);
    }
  });

  it("resolves the next case status only for legal transitions", () => {
    expect(resolveNextCaseStatus("claim", "queued")).toBe("under_review");
    expect(resolveNextCaseStatus("resolve", "under_review")).toBe("resolved");
    expect(resolveNextCaseStatus("dismiss", "queued")).toBe("dismissed");
    expect(resolveNextCaseStatus("escalate", "under_review")).toBe("escalated");
    expect(resolveNextCaseStatus("claim", "resolved")).toBeNull();
    expect(resolveNextCaseStatus("resolve", "queued")).toBeNull();
  });

  it("accepts only the canonical resolution kinds", () => {
    for (const kind of [
      "uphold",
      "reject",
      "split",
      "dismiss",
      "no_action",
      "escalated_to_legal",
    ]) {
      expect(isAllowedResolutionKind(kind)).toBe(true);
    }
    expect(isAllowedResolutionKind("approve")).toBe(false);
    expect(isAllowedResolutionKind("")).toBe(false);
  });
});
