import { describe, expect, it } from "vitest";

import {
  buildResolvedCapabilityPairs,
  formatHourlyRateMajor,
  parseHourlyRateMajor,
  validateTutorApplicationDraft,
  type TutorApplicationDraftInput,
  type TutorApplicationOptionsDto,
} from "@/modules/tutors/application";

const options: TutorApplicationOptionsDto = {
  focusAreas: [
    {
      allowedSubjectCodes: ["biology", "chemistry"],
      description: "Coaching for the Internal Assessment.",
      focusAreaCode: "internal_assessment",
      focusAreaId: "fa-ia",
      label: "Internal Assessment",
      value: "internal_assessment",
    },
    {
      allowedSubjectCodes: ["english_a", "spanish_a"],
      description: "Oral practice for language A subjects.",
      focusAreaCode: "oral_practice",
      focusAreaId: "fa-oral",
      label: "Oral practice",
      value: "oral_practice",
    },
  ],
  languages: [
    { flagCode: "GB", label: "English", value: "en" },
    { flagCode: "ES", label: "Spanish", value: "es" },
  ],
  subjects: [
    {
      iconKey: "biology",
      label: "Biology",
      subjectCode: "biology",
      subjectId: "s-bio",
      value: "biology",
    },
    {
      iconKey: "chemistry",
      label: "Chemistry",
      subjectCode: "chemistry",
      subjectId: "s-chem",
      value: "chemistry",
    },
    {
      iconKey: "english",
      label: "English A",
      subjectCode: "english_a",
      subjectId: "s-eng",
      value: "english_a",
    },
    {
      iconKey: "physics",
      label: "Physics",
      subjectCode: "physics",
      subjectId: "s-phys",
      value: "physics",
    },
  ],
};

const completeDraft: TutorApplicationDraftInput = {
  fullName: "Maya Chen",
  focusAreaCodes: ["internal_assessment"],
  headline: "Biology HL Examiner & IA coach",
  hourlyRateMajor: "60",
  languageCodes: ["en"],
  subjectCodes: ["biology"],
  bio:
    "Structured, exam-aware coaching with weekly milestones for HL Biology IA students.",
  timezone: "Europe/London",
};

describe("validateTutorApplicationDraft", () => {
  it("accepts a fully filled draft", () => {
    const errors = validateTutorApplicationDraft(completeDraft, options);
    expect(errors).toEqual({});
  });

  it("requires display name and headline", () => {
    const errors = validateTutorApplicationDraft(
      { ...completeDraft, fullName: "  ", headline: "" },
      options,
    );
    expect(errors.fullName).toBeDefined();
    expect(errors.headline).toBeDefined();
  });

  it("requires a positive hourly rate", () => {
    expect(
      validateTutorApplicationDraft(
        { ...completeDraft, hourlyRateMajor: "0" },
        options,
      ).hourlyRateMajor,
    ).toBeDefined();
    expect(
      validateTutorApplicationDraft(
        { ...completeDraft, hourlyRateMajor: "abc" },
        options,
      ).hourlyRateMajor,
    ).toBeDefined();
  });

  it("rejects subjects that are not allowed for the selected focus areas", () => {
    const errors = validateTutorApplicationDraft(
      {
        ...completeDraft,
        focusAreaCodes: ["oral_practice"],
        subjectCodes: ["physics"],
      },
      options,
    );
    expect(errors.subjectCodes).toBeDefined();
  });

  it("requires at least one valid language", () => {
    const errors = validateTutorApplicationDraft(
      { ...completeDraft, languageCodes: ["xx"] },
      options,
    );
    expect(errors.languageCodes).toBeDefined();
  });

  it("rejects invalid timezones", () => {
    const errors = validateTutorApplicationDraft(
      { ...completeDraft, timezone: "Not/AZone" },
      options,
    );
    expect(errors.timezone).toBeDefined();
  });
});

describe("buildResolvedCapabilityPairs", () => {
  it("produces only valid (focusArea, subject) pairs", () => {
    const pairs = buildResolvedCapabilityPairs(
      {
        ...completeDraft,
        focusAreaCodes: ["internal_assessment", "oral_practice"],
        subjectCodes: ["biology", "chemistry", "english_a", "physics"],
      },
      options,
    );
    expect(pairs).toEqual(
      expect.arrayContaining([
        { focusAreaId: "fa-ia", subjectId: "s-bio" },
        { focusAreaId: "fa-ia", subjectId: "s-chem" },
        { focusAreaId: "fa-oral", subjectId: "s-eng" },
      ]),
    );
    expect(pairs).not.toContainEqual({ focusAreaId: "fa-oral", subjectId: "s-phys" });
    expect(pairs).not.toContainEqual({ focusAreaId: "fa-ia", subjectId: "s-eng" });
  });
});

describe("hourly rate conversions", () => {
  it("parses major-units string into minor units", () => {
    expect(parseHourlyRateMajor("60")).toBe(6000);
    expect(parseHourlyRateMajor("12.50")).toBe(1250);
    expect(parseHourlyRateMajor("0.5")).toBe(50);
  });

  it("rejects non-positive or malformed values", () => {
    expect(parseHourlyRateMajor("")).toBeNull();
    expect(parseHourlyRateMajor("-5")).toBeNull();
    expect(parseHourlyRateMajor("abc")).toBeNull();
    expect(parseHourlyRateMajor("1.234")).toBeNull();
  });

  it("formats minor units back to a major-units string", () => {
    expect(formatHourlyRateMajor(6000)).toBe("60");
    expect(formatHourlyRateMajor(1250)).toBe("12.50");
    expect(formatHourlyRateMajor(0)).toBe("");
    expect(formatHourlyRateMajor(null)).toBe("");
  });
});
