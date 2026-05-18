import { describe, expect, it } from "vitest";

import { evaluateTutorProfileMinimum } from "@/modules/tutors/listing-readiness";

const completeInput = {
  bio: "Higher-level Biology IA students; structured, exam-aware coaching.",
  displayName: "Maya Chen",
  hasPublishedProfilePhoto: true,
  headline: "Biology HL Examiner",
  hourlyRateMinor: 6000,
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

  it("requires the consolidated bio", () => {
    const result = evaluateTutorProfileMinimum({
      ...completeInput,
      bio: "   ",
    });
    expect(result.passes).toBe(false);
    expect(result.missing).toContain("bio");
  });

  it("flags missing published profile photo (gate 2 'real profile photo')", () => {
    const result = evaluateTutorProfileMinimum({
      ...completeInput,
      hasPublishedProfilePhoto: false,
    });
    expect(result.passes).toBe(false);
    expect(result.missing).toEqual(["profilePhoto"]);
  });

  it("flags profile photo alongside other gaps without dropping them", () => {
    const result = evaluateTutorProfileMinimum({
      ...completeInput,
      hasPublishedProfilePhoto: false,
      headline: "",
    });
    expect(result.passes).toBe(false);
    expect(result.missing).toEqual(
      expect.arrayContaining(["headline", "profilePhoto"]),
    );
  });
});
