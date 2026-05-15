import { describe, expect, it } from "vitest";

import type { PersistedLessonReportStatus } from "@/modules/lessons/constants";
import {
  canAcknowledgeLessonReport,
  canDraftLessonReport,
  canEditLessonReport,
  canShareLessonReport,
  canSubmitLessonReport,
  isLessonReportLocked,
  reportHasShareableContent,
  type LessonReportContent,
} from "@/modules/lessons/lesson-report-state";

const EMPTY: LessonReportContent = {
  coverageSummary: null,
  goalSummary: null,
  nextStepsSummary: null,
  studentConfidenceSignal: null,
};

const POPULATED: LessonReportContent = {
  coverageSummary: "We covered Paper 2 essay structure.",
  goalSummary: "Get comfortable with thesis scaffolding.",
  nextStepsSummary: "Draft a new essay using the scaffold.",
  studentConfidenceSignal: "Confident on structure, wobbly on transitions.",
};

describe("canDraftLessonReport", () => {
  it("opens drafting only when the lesson is completed and has a completed timestamp", () => {
    expect(canDraftLessonReport("completed", "2026-05-14T12:00:00Z")).toBe(true);
    expect(canDraftLessonReport("reviewed", "2026-05-14T12:00:00Z")).toBe(true);
  });

  it("blocks drafting on pre-completion lesson states", () => {
    expect(canDraftLessonReport("pending", "2026-05-14T12:00:00Z")).toBe(false);
    expect(canDraftLessonReport("accepted", "2026-05-14T12:00:00Z")).toBe(false);
    expect(canDraftLessonReport("upcoming", "2026-05-14T12:00:00Z")).toBe(false);
    expect(canDraftLessonReport("in_progress", "2026-05-14T12:00:00Z")).toBe(
      false,
    );
  });

  it("blocks drafting on terminal non-completion states", () => {
    expect(canDraftLessonReport("cancelled", "2026-05-14T12:00:00Z")).toBe(
      false,
    );
    expect(canDraftLessonReport("declined", "2026-05-14T12:00:00Z")).toBe(
      false,
    );
  });

  it("blocks drafting when the completed timestamp is missing", () => {
    expect(canDraftLessonReport("completed", null)).toBe(false);
  });
});

describe("editability and locking", () => {
  const allStatuses: PersistedLessonReportStatus[] = [
    "drafted",
    "submitted",
    "shared",
    "acknowledged",
  ];

  it("allows editing only in `drafted` and `submitted`", () => {
    expect(canEditLessonReport("drafted")).toBe(true);
    expect(canEditLessonReport("submitted")).toBe(true);
    expect(canEditLessonReport("shared")).toBe(false);
    expect(canEditLessonReport("acknowledged")).toBe(false);
  });

  it("locks content from `shared` onward", () => {
    expect(isLessonReportLocked("drafted")).toBe(false);
    expect(isLessonReportLocked("submitted")).toBe(false);
    expect(isLessonReportLocked("shared")).toBe(true);
    expect(isLessonReportLocked("acknowledged")).toBe(true);
  });

  it("never reports both editable and locked simultaneously", () => {
    for (const status of allStatuses) {
      expect(canEditLessonReport(status) && isLessonReportLocked(status)).toBe(
        false,
      );
    }
  });
});

describe("submission gate", () => {
  it("requires `drafted` plus at least one populated field", () => {
    expect(canSubmitLessonReport("drafted", POPULATED)).toBe(true);
    expect(canSubmitLessonReport("drafted", EMPTY)).toBe(false);
  });

  it("rejects submission from any non-`drafted` state", () => {
    expect(canSubmitLessonReport("submitted", POPULATED)).toBe(false);
    expect(canSubmitLessonReport("shared", POPULATED)).toBe(false);
    expect(canSubmitLessonReport("acknowledged", POPULATED)).toBe(false);
  });

  it("treats whitespace-only fields as empty", () => {
    expect(
      canSubmitLessonReport("drafted", {
        coverageSummary: "   ",
        goalSummary: null,
        nextStepsSummary: "\n",
        studentConfidenceSignal: null,
      }),
    ).toBe(false);

    expect(
      canSubmitLessonReport("drafted", {
        coverageSummary: null,
        goalSummary: "  Draft thesis  ",
        nextStepsSummary: null,
        studentConfidenceSignal: null,
      }),
    ).toBe(true);
  });

  it("recognises any single field as shareable content", () => {
    expect(reportHasShareableContent(EMPTY)).toBe(false);

    expect(
      reportHasShareableContent({ ...EMPTY, goalSummary: "Aim" }),
    ).toBe(true);
    expect(
      reportHasShareableContent({ ...EMPTY, coverageSummary: "Coverage" }),
    ).toBe(true);
    expect(
      reportHasShareableContent({
        ...EMPTY,
        studentConfidenceSignal: "Signal",
      }),
    ).toBe(true);
    expect(
      reportHasShareableContent({ ...EMPTY, nextStepsSummary: "Steps" }),
    ).toBe(true);
  });
});

describe("share gate", () => {
  it("opens sharing only from `submitted`", () => {
    expect(canShareLessonReport("submitted")).toBe(true);
    expect(canShareLessonReport("drafted")).toBe(false);
    expect(canShareLessonReport("shared")).toBe(false);
    expect(canShareLessonReport("acknowledged")).toBe(false);
  });
});

describe("acknowledge gate", () => {
  it("opens acknowledgement only from `shared`", () => {
    expect(canAcknowledgeLessonReport("shared")).toBe(true);
    expect(canAcknowledgeLessonReport("drafted")).toBe(false);
    expect(canAcknowledgeLessonReport("submitted")).toBe(false);
    expect(canAcknowledgeLessonReport("acknowledged")).toBe(false);
  });
});

describe("state machine ordering invariants", () => {
  it("guarantees a strict forward progression of unlocking and locking", () => {
    // drafted: can edit, can submit (if content), cannot share, not locked
    expect(canEditLessonReport("drafted")).toBe(true);
    expect(canShareLessonReport("drafted")).toBe(false);
    expect(canAcknowledgeLessonReport("drafted")).toBe(false);
    expect(isLessonReportLocked("drafted")).toBe(false);

    // submitted: can still edit, can now share, no ack yet, not locked
    expect(canEditLessonReport("submitted")).toBe(true);
    expect(canShareLessonReport("submitted")).toBe(true);
    expect(canAcknowledgeLessonReport("submitted")).toBe(false);
    expect(isLessonReportLocked("submitted")).toBe(false);

    // shared: cannot edit, cannot re-share, ack available, locked
    expect(canEditLessonReport("shared")).toBe(false);
    expect(canShareLessonReport("shared")).toBe(false);
    expect(canAcknowledgeLessonReport("shared")).toBe(true);
    expect(isLessonReportLocked("shared")).toBe(true);

    // acknowledged: terminal — nothing else can happen, content stays locked
    expect(canEditLessonReport("acknowledged")).toBe(false);
    expect(canShareLessonReport("acknowledged")).toBe(false);
    expect(canAcknowledgeLessonReport("acknowledged")).toBe(false);
    expect(isLessonReportLocked("acknowledged")).toBe(true);
  });
});
