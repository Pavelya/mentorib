import { normalizeCurrencyCode } from "@/modules/pricing/money";

export type TutorProfilePriceRow = {
  id: string;
  trial_price_minor: number | null;
  hourly_rate_minor: number | null;
  currency_code: string | null;
  application_status: string;
  public_listing_status: string;
};

export type TutorPriceRange = {
  trialMinMinor: number | null;
  trialMaxMinor: number | null;
  hourlyMinMinor: number | null;
  hourlyMaxMinor: number | null;
  currencyCode: string;
  tutorCount: number;
};

export function aggregateTutorPriceRange(
  rows: readonly TutorProfilePriceRow[],
): TutorPriceRange {
  if (rows.length === 0) {
    return emptyTutorPriceRange();
  }

  const trialMinors = rows
    .map((row) => row.trial_price_minor)
    .filter(
      (value): value is number => typeof value === "number" && value >= 0,
    );
  const hourlyMinors = rows
    .map((row) => row.hourly_rate_minor)
    .filter(
      (value): value is number => typeof value === "number" && value > 0,
    );

  return {
    trialMinMinor: trialMinors.length > 0 ? Math.min(...trialMinors) : null,
    trialMaxMinor: trialMinors.length > 0 ? Math.max(...trialMinors) : null,
    hourlyMinMinor: hourlyMinors.length > 0 ? Math.min(...hourlyMinors) : null,
    hourlyMaxMinor: hourlyMinors.length > 0 ? Math.max(...hourlyMinors) : null,
    currencyCode: pickPredominantCurrencyCode(rows),
    tutorCount: rows.length,
  };
}

export function emptyTutorPriceRange(): TutorPriceRange {
  return {
    trialMinMinor: null,
    trialMaxMinor: null,
    hourlyMinMinor: null,
    hourlyMaxMinor: null,
    currencyCode: normalizeCurrencyCode(null),
    tutorCount: 0,
  };
}

function pickPredominantCurrencyCode(
  rows: readonly TutorProfilePriceRow[],
): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const code = normalizeCurrencyCode(row.currency_code);
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  let pickedCode = normalizeCurrencyCode(null);
  let pickedCount = 0;
  for (const [code, count] of counts) {
    if (count > pickedCount) {
      pickedCode = code;
      pickedCount = count;
    }
  }

  return pickedCode;
}
