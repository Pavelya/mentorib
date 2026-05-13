export type TutorProfileMinimumInput = {
  bio: string | null;
  displayName: string | null;
  headline: string | null;
  hourlyRateMinor: number | null;
  timezone: string | null;
};

export type ProfileMinimumGateResult = {
  passes: boolean;
  missing: ProfileMinimumField[];
};

export type ProfileMinimumField =
  | "displayName"
  | "headline"
  | "bio"
  | "timezone"
  | "hourlyRate";

// Listing-readiness Gate 2 ("profile minimum complete") per
// docs/data/tutor-listing-readiness-model-v1.md §4.2. Reads structured pricing
// (`hourly_rate_minor`) instead of free-text presence on `pricing_summary` and
// requires a single consolidated `bio` (the application flow no longer
// separates "best for" and "teaching style").
export function evaluateTutorProfileMinimum(
  input: TutorProfileMinimumInput,
): ProfileMinimumGateResult {
  const missing: ProfileMinimumField[] = [];

  if (!isNonBlank(input.displayName)) {
    missing.push("displayName");
  }
  if (!isNonBlank(input.headline)) {
    missing.push("headline");
  }
  if (!isNonBlank(input.bio)) {
    missing.push("bio");
  }
  if (!isNonBlank(input.timezone)) {
    missing.push("timezone");
  }
  if (!(typeof input.hourlyRateMinor === "number" && input.hourlyRateMinor > 0)) {
    missing.push("hourlyRate");
  }

  return { passes: missing.length === 0, missing };
}

function isNonBlank(value: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
