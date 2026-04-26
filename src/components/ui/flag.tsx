import { ES, FR, GB, PL } from "country-flag-icons/react/3x2";

const flagRegistry = {
  ES,
  FR,
  GB,
  PL,
} as const;

export type FlagCode = keyof typeof flagRegistry;

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
