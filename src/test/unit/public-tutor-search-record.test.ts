import type { Route } from "next";
import { describe, expect, it } from "vitest";

import { buildPublicTutorSearchRecord } from "@/modules/search/public-tutor-record";
import { buildEmptyPublicTutorReviewSummary } from "@/modules/reviews";
import type { PublicTutorProfileDto } from "@/modules/tutors/public-profile";

function buildProfile(
  overrides: Partial<PublicTutorProfileDto> = {},
): PublicTutorProfileDto {
  return {
    availability: {
      acceptingNewStudents: true,
      summary: "Open for booking handoff.",
      timezone: "Europe/London",
    },
    bio: "Helps IB students with HL Biology IAs and exam rescue.",
    bookingHref: "/book/maya-chen" as Route,
    displayName: "Maya Chen",
    examinerBadges: [],
    headline: "Biology HL Examiner",
    id: "tutor-1",
    introVideo: null,
    languages: [
      { code: "en", displayName: "English" },
      { code: "pl", displayName: "Polish" },
    ],
    pricingSummary: null,
    trialPriceMinor: 4000,
    hourlyRateMinor: 6000,
    currencyCode: "USD",
    trialPriceLabel: "$40",
    hourlyRateLabel: "$60",
    priceRangeLabel: "$40–$60",
    primaryImage: null,
    profilePhoto: null,
    accountAvatarUrl: null,
    reviewSummary: buildEmptyPublicTutorReviewSummary(),
    seo: {
      description: "Maya Chen supports Biology HL students.",
      imageUrl: null,
      title: "Maya Chen — Mentor IB Tutor",
    },
    slug: "maya-chen",
    subjects: [
      {
        experienceSummary: "Five years of IA coaching.",
        focusArea: "HL Internal Assessment",
        focusAreaSlug: "hl-internal-assessment",
        subject: "Biology HL",
        subjectSlug: "biology-hl",
      },
    ],
    trustProofs: [],
    updatedAt: "2026-05-15T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildPublicTutorSearchRecord", () => {
  it("projects only public-safe fields and normalizes vocabularies", () => {
    const record = buildPublicTutorSearchRecord({ profile: buildProfile() });

    expect(record.objectID).toBe("tutor-1");
    expect(record.slug).toBe("maya-chen");
    expect(record.displayName).toBe("Maya Chen");
    expect(record.subjects).toEqual(["Biology HL"]);
    expect(record.subjectSlugs).toEqual(["biology-hl"]);
    expect(record.focusAreas).toEqual(["HL Internal Assessment"]);
    expect(record.focusAreaSlugs).toEqual(["hl-internal-assessment"]);
    expect(record.languages.sort()).toEqual(["English", "Polish"]);
    expect(record.languageCodes.sort()).toEqual(["en", "pl"]);
    // English maps to GB and Polish maps to PL in the language flag registry.
    expect(record.languageFlagCodes.sort()).toEqual(["GB", "PL"]);
    expect(record.hourlyRateMinor).toBe(6000);
    expect(record.priceRangeLabel).toBe("$40–$60");
    expect(record.hasExaminerBadge).toBe(false);
    expect(record.hasIntroVideo).toBe(false);
    expect(record.acceptingNewStudents).toBe(true);
    expect(record.rankingHourlyRateMinor).toBe(6000);
    expect(record.updatedAt).toBe("2026-05-15T10:00:00.000Z");
  });

  it("never surfaces moderation, contact, or application-answer fields", () => {
    const record = buildPublicTutorSearchRecord({ profile: buildProfile() });
    // Property-bag assertion: only the keys we declare are allowed in the record.
    // If a future change adds new fields they must be reviewed for public safety.
    expect(new Set(Object.keys(record))).toEqual(
      new Set([
        "objectID",
        "slug",
        "displayName",
        "headline",
        "bioPreview",
        "subjects",
        "subjectSlugs",
        "focusAreas",
        "focusAreaSlugs",
        "languages",
        "languageCodes",
        "languageFlagCodes",
        "trialPriceMinor",
        "hourlyRateMinor",
        "currencyCode",
        "trialPriceLabel",
        "hourlyRateLabel",
        "priceRangeLabel",
        "averageRating",
        "reviewCount",
        "hasFeaturedRating",
        "hasExaminerBadge",
        "hasIntroVideo",
        "acceptingNewStudents",
        "rankingHourlyRateMinor",
        "updatedAt",
      ]),
    );
  });

  it("ranks tutors with no hourly rate last", () => {
    const record = buildPublicTutorSearchRecord({
      profile: buildProfile({ hourlyRateMinor: null }),
    });
    expect(record.rankingHourlyRateMinor).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("truncates long bios into a preview", () => {
    const longBio = "x".repeat(500);
    const record = buildPublicTutorSearchRecord({
      profile: buildProfile({ bio: longBio }),
    });
    expect(record.bioPreview).not.toBeNull();
    expect((record.bioPreview ?? "").length).toBeLessThanOrEqual(281);
    expect(record.bioPreview).toMatch(/…$/);
  });

  it("marks tutors with at least one examiner badge", () => {
    const record = buildPublicTutorSearchRecord({
      profile: buildProfile({
        examinerBadges: [
          {
            subject: { displayName: "Biology HL", id: "subj-1", slug: "biology-hl" },
          },
        ],
      }),
    });
    expect(record.hasExaminerBadge).toBe(true);
  });
});
