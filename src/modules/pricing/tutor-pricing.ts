import {
  DEFAULT_PLATFORM_CURRENCY_CODE,
  formatCurrencyFromMinorUnits,
  normalizeCurrencyCode,
} from "@/modules/pricing/money";

export type TutorPricingInput = {
  trialPriceMinor?: number | null;
  hourlyRateMinor?: number | null;
  currencyCode?: string | null;
};

type FormatOptions = {
  locale?: string;
};

function formatWholeUnitsCurrency(
  amountMinor: number,
  currencyCode: string,
  options: FormatOptions = {},
) {
  const { locale = "en-US" } = options;
  const isWhole = amountMinor % 100 === 0;

  return formatCurrencyFromMinorUnits(amountMinor, currencyCode, {
    locale,
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  });
}

export function formatTrialPrice(
  pricing: TutorPricingInput,
  options: FormatOptions = {},
): string | null {
  if (typeof pricing.trialPriceMinor !== "number") {
    return null;
  }

  return formatWholeUnitsCurrency(
    pricing.trialPriceMinor,
    normalizeCurrencyCode(pricing.currencyCode),
    options,
  );
}

export function formatHourlyRate(
  pricing: TutorPricingInput,
  options: FormatOptions = {},
): string | null {
  if (typeof pricing.hourlyRateMinor !== "number") {
    return null;
  }

  return formatWholeUnitsCurrency(
    pricing.hourlyRateMinor,
    normalizeCurrencyCode(pricing.currencyCode),
    options,
  );
}

export type PriceRangeInput = {
  minMinor: number | null;
  maxMinor: number | null;
  currencyCode: string | null;
};

export function formatPriceRange(
  range: PriceRangeInput,
  options: FormatOptions = {},
): string | null {
  if (typeof range.minMinor !== "number" || typeof range.maxMinor !== "number") {
    return null;
  }

  if (range.minMinor < 0 || range.maxMinor < 0 || range.maxMinor < range.minMinor) {
    return null;
  }

  const currencyCode = normalizeCurrencyCode(range.currencyCode);
  const minLabel = formatWholeUnitsCurrency(range.minMinor, currencyCode, options);

  if (range.minMinor === range.maxMinor) {
    return minLabel;
  }

  const maxLabel = formatWholeUnitsCurrency(range.maxMinor, currencyCode, options);

  return `${minLabel}–${maxLabel}`;
}

export function buildTutorPriceRangeLabel(
  pricing: TutorPricingInput,
  options: FormatOptions = {},
): string | null {
  const currencyCode = normalizeCurrencyCode(pricing.currencyCode);
  const trialLabel = formatTrialPrice(pricing, options);
  const hourlyLabel = formatHourlyRate(pricing, options);

  if (trialLabel && hourlyLabel) {
    if (pricing.trialPriceMinor === pricing.hourlyRateMinor) {
      return trialLabel;
    }
    const minMinor = Math.min(
      pricing.trialPriceMinor as number,
      pricing.hourlyRateMinor as number,
    );
    const maxMinor = Math.max(
      pricing.trialPriceMinor as number,
      pricing.hourlyRateMinor as number,
    );

    return formatPriceRange(
      { minMinor, maxMinor, currencyCode },
      options,
    );
  }

  return trialLabel ?? hourlyLabel;
}

export const TUTOR_PRICING_CURRENCY_DEFAULT = DEFAULT_PLATFORM_CURRENCY_CODE;
