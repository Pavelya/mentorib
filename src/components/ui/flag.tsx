import { ES, FR, GB, PL } from "country-flag-icons/react/3x2";

const flagRegistry = {
  ES,
  FR,
  GB,
  PL,
} as const;

export type FlagCode = keyof typeof flagRegistry;

// Map a raw ISO 3166-1 alpha-2 country code (e.g. from a payout account) to a
// renderable `FlagCode`, or `null` when no flag asset is registered for it.
// Keeps the country→flag decision in the single DS flag module rather than in
// feature code.
export function toFlagCode(
  countryCode: string | null | undefined,
): FlagCode | null {
  if (!countryCode) {
    return null;
  }
  const normalized = countryCode.trim().toUpperCase();
  return normalized in flagRegistry ? (normalized as FlagCode) : null;
}

type FlagProps = {
  "aria-label"?: string;
  className?: string;
  code: FlagCode;
};

export function Flag({ "aria-label": ariaLabel, className, code }: FlagProps) {
  const Component = flagRegistry[code];
  const isDecorative = !ariaLabel;

  return (
    <Component
      aria-hidden={isDecorative ? true : undefined}
      aria-label={ariaLabel}
      className={className}
      role={isDecorative ? undefined : "img"}
    />
  );
}
