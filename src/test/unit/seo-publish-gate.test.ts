import { describe, expect, it } from "vitest";

import {
  evaluateSeoLandingGate,
  getSeoLandingMinimumTutors,
  SEO_COMBO_PAGE_MIN_TUTORS,
  SEO_SERVICE_PAGE_MIN_TUTORS,
  SEO_SUBJECT_PAGE_MIN_TUTORS,
} from "@/modules/marketing/seo-landing/publish-gate";

describe("evaluateSeoLandingGate", () => {
  it("rejects when authored copy is missing", () => {
    const result = evaluateSeoLandingGate({
      acceptingTutorCount: 50,
      hasAuthoredCopy: false,
      scope: "subject",
    });
    expect(result.isPublishable).toBe(false);
    expect(result.blockers).toContain("authored content missing");
  });

  it("rejects when subject coverage is below the single-axis threshold", () => {
    const result = evaluateSeoLandingGate({
      acceptingTutorCount: SEO_SUBJECT_PAGE_MIN_TUTORS - 1,
      hasAuthoredCopy: true,
      scope: "subject",
    });
    expect(result.isPublishable).toBe(false);
    expect(result.blockers.join(" ")).toContain("tutor coverage below threshold");
  });

  it("rejects when service coverage is below the single-axis threshold", () => {
    const result = evaluateSeoLandingGate({
      acceptingTutorCount: SEO_SERVICE_PAGE_MIN_TUTORS - 1,
      hasAuthoredCopy: true,
      scope: "service",
    });
    expect(result.isPublishable).toBe(false);
  });

  it("requires a strictly higher threshold for combo pages than for single-axis pages", () => {
    expect(SEO_COMBO_PAGE_MIN_TUTORS).toBeGreaterThan(SEO_SUBJECT_PAGE_MIN_TUTORS);
    expect(SEO_COMBO_PAGE_MIN_TUTORS).toBeGreaterThan(SEO_SERVICE_PAGE_MIN_TUTORS);
  });

  it("publishes when copy and coverage both pass", () => {
    const result = evaluateSeoLandingGate({
      acceptingTutorCount: SEO_COMBO_PAGE_MIN_TUTORS,
      hasAuthoredCopy: true,
      scope: "combo",
    });
    expect(result.isPublishable).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("exposes thresholds via getSeoLandingMinimumTutors", () => {
    expect(getSeoLandingMinimumTutors("subject")).toBe(SEO_SUBJECT_PAGE_MIN_TUTORS);
    expect(getSeoLandingMinimumTutors("service")).toBe(SEO_SERVICE_PAGE_MIN_TUTORS);
    expect(getSeoLandingMinimumTutors("combo")).toBe(SEO_COMBO_PAGE_MIN_TUTORS);
  });
});
