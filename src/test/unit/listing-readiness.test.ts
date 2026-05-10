import { describe, expect, it } from "vitest";

import { evaluateTutorProfileMinimum } from "@/modules/tutors/listing-readiness";

const completeInput = {
  bestForSummary: "Higher-level Biology IA students",
  displayName: "Maya Chen",
  headline: "Biology HL Examiner",
  hourlyRateMinor: 6000,
  teachingStyleSummary: "Structured, exam-aware coaching",
  timezone: "Europe/London",
};

describe("evaluateTutorProfileMinimum", () => {
  it("passes when every minimum field is present", () => {
    const result = evaluateTutorProfileMinimum(completeInput);
    expect(result.passes).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("flags missing structured hourly rate when null", () => {
    const result = evaluateTutorProfileMinimum({
      ...completeInput,
      hourlyRateMinor: null,
    });
    expect(result.passes).toBe(false);
    expect(result.missing).toContain("hourlyRate");
  });

  it("flags zero or negative hourly rate as missing", () => {
    expect(
      evaluateTutorProfileMinimum({ ...completeInput, hourlyRateMinor: 0 })
        .missing,
    ).toContain("hourlyRate");
    expect(
      evaluateTutorProfileMinimum({ ...completeInput, hourlyRateMinor: -100 })
        .missing,
    ).toContain("hourlyRate");
  });

  it("flags blank text fields", () => {
    const result = evaluateTutorProfileMinimum({
      ...completeInput,
      displayName: "  ",
      headline: null,
    });
    expect(result.passes).toBe(false);
    expect(result.missing).toEqual(
      expect.arrayContaining(["displayName", "headline"]),
    );
  });
});
