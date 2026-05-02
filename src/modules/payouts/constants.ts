// Curated set of countries where Stripe Connect Express is available for
// individual platforms. The payouts module owns this vocabulary because country
// support is determined by the payment provider.
export const payoutSupportedCountries = [
  { code: "AU", displayName: "Australia" },
  { code: "AT", displayName: "Austria" },
  { code: "BE", displayName: "Belgium" },
  { code: "CA", displayName: "Canada" },
  { code: "DK", displayName: "Denmark" },
  { code: "FI", displayName: "Finland" },
  { code: "FR", displayName: "France" },
  { code: "DE", displayName: "Germany" },
  { code: "GR", displayName: "Greece" },
  { code: "HK", displayName: "Hong Kong" },
  { code: "IE", displayName: "Ireland" },
  { code: "IT", displayName: "Italy" },
  { code: "JP", displayName: "Japan" },
  { code: "LU", displayName: "Luxembourg" },
  { code: "MX", displayName: "Mexico" },
  { code: "NL", displayName: "Netherlands" },
  { code: "NZ", displayName: "New Zealand" },
  { code: "NO", displayName: "Norway" },
  { code: "PL", displayName: "Poland" },
  { code: "PT", displayName: "Portugal" },
  { code: "SG", displayName: "Singapore" },
  { code: "ES", displayName: "Spain" },
  { code: "SE", displayName: "Sweden" },
  { code: "CH", displayName: "Switzerland" },
  { code: "AE", displayName: "United Arab Emirates" },
  { code: "GB", displayName: "United Kingdom" },
  { code: "US", displayName: "United States" },
] as const;

export type PayoutSupportedCountry = (typeof payoutSupportedCountries)[number];
export type PayoutSupportedCountryCode = PayoutSupportedCountry["code"];

const supportedCountryCodes = new Set<string>(
  payoutSupportedCountries.map((country) => country.code),
);

export function isPayoutSupportedCountryCode(
  value: string,
): value is PayoutSupportedCountryCode {
  return supportedCountryCodes.has(value);
}

export function getPayoutSupportedCountryDisplayName(
  code: string,
): string | null {
  const match = payoutSupportedCountries.find((country) => country.code === code);

  return match?.displayName ?? null;
}
