export const DEFAULT_PLATFORM_CURRENCY_CODE = "USD";

type CurrencyFormatOptions = {
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function formatCurrencyFromMinorUnits(
  amount: number,
  currencyCode: string,
  {
    locale = "en-US",
    maximumFractionDigits,
    minimumFractionDigits,
  }: CurrencyFormatOptions = {},
) {
  return new Intl.NumberFormat(locale, {
    currency: normalizeCurrencyCode(currencyCode),
    maximumFractionDigits,
    minimumFractionDigits,
    style: "currency",
  }).format(amount / 100);
}

export function normalizeCurrencyCode(currencyCode: string | null | undefined) {
  const normalizedCurrencyCode = currencyCode?.trim().toUpperCase();

  if (!normalizedCurrencyCode || normalizedCurrencyCode.length !== 3) {
    return DEFAULT_PLATFORM_CURRENCY_CODE;
  }

  return normalizedCurrencyCode;
}
