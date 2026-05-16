// Declarative Algolia settings for the public tutor search index. The
// settings script (`scripts/algolia-apply-settings.ts`) reads from this
// declaration so dashboard drift is impossible — index settings live in the
// repo, not in the Algolia UI.

export type PublicTutorIndexSettings = {
  searchableAttributes: string[];
  attributesForFaceting: string[];
  ranking: string[];
  customRanking: string[];
  attributesToHighlight: string[];
  minWordSizefor1Typo: number;
  minWordSizefor2Typos: number;
  typoTolerance: boolean;
  ignorePlurals: boolean;
  removeStopWords: boolean;
  hitsPerPage: number;
};

export const PUBLIC_TUTOR_INDEX_SETTINGS: PublicTutorIndexSettings = {
  searchableAttributes: [
    "displayName",
    "headline",
    "subjects,focusAreas",
    "languages",
    "bioPreview",
  ],
  attributesForFaceting: [
    "filterOnly(subjectSlugs)",
    "filterOnly(focusAreaSlugs)",
    "filterOnly(languageCodes)",
    "filterOnly(acceptingNewStudents)",
    "filterOnly(hasExaminerBadge)",
    "filterOnly(hasIntroVideo)",
  ],
  ranking: [
    "typo",
    "geo",
    "words",
    "filters",
    "proximity",
    "attribute",
    "exact",
    "custom",
  ],
  customRanking: [
    "desc(hasFeaturedRating)",
    "desc(reviewCount)",
    "desc(averageRating)",
    "asc(rankingHourlyRateMinor)",
  ],
  attributesToHighlight: ["displayName", "headline", "subjects"],
  // Tutor names + IB subjects routinely include initialisms (IB, HL, SL, AA,
  // AI, TOK) and Latinate proper nouns — typo tolerance kicks in after 4
  // characters to avoid clobbering "AA" vs "AI" matches.
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,
  typoTolerance: true,
  ignorePlurals: true,
  // Defensive read-only posture for the public surface — no analytics or
  // personalization personas wired up yet.
  removeStopWords: false,
  hitsPerPage: 12,
};
