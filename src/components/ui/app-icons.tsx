export type AppSubjectIconKey =
  | "biology"
  | "business"
  | "chemistry"
  | "economics"
  | "english"
  | "history"
  | "math_aa"
  | "math_ai"
  | "physics"
  | "psychology"
  | "tok";

export type AppLanguageFlagCode = "es" | "fr" | "gb" | "pl";

type MatchOptionVisualProps = {
  flagCode?: AppLanguageFlagCode | null;
  iconKey?: AppSubjectIconKey | null;
};

export function MatchOptionVisual({ flagCode, iconKey }: MatchOptionVisualProps) {
  if (flagCode) {
    return (
      <span aria-hidden="true">
        <FlagGlyph flagCode={flagCode} />
      </span>
    );
  }

  if (iconKey) {
    return (
      <span aria-hidden="true">
        <SubjectGlyph iconKey={iconKey} />
      </span>
    );
  }

  return null;
}

export function PauseIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.25 7.5v9M14.75 7.5v9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="m8.5 12.5 2.3 2.3 4.7-5.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function ReviewedIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="m8.5 12.5 2.3 2.3 4.7-5.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8.5v4l2.5 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

export function StudentRoleIcon() {
  return (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 12.5h10c3.3 0 6 2.7 6 6v19.5H18c-3.3 0-6-2.7-6-6V13.5c0-.6.4-1 1-1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M29 18.5c0-3.3 2.7-6 6-6h1c.6 0 1 .4 1 1V32c0 3.3-2.7 6-6 6h-2V18.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M18 21h5M18 27h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function TutorRoleIcon() {
  return (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 18.5 24 11l13 7.5L24 26 11 18.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M17 23v8c0 2.2 3.1 4 7 4s7-1.8 7-4v-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M37 19v9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

function SubjectGlyph({ iconKey }: { iconKey: AppSubjectIconKey }) {
  switch (iconKey) {
    case "english":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 6.5h7.2c2.3 0 4.3 1.9 4.3 4.2V17H10.8A3.8 3.8 0 0 1 7 13.2V6.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d="M10 10h5M10 13h4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "math_aa":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.5 17.5 17.5 6.5M6.5 13.5l4-4M10.5 17.5l7-7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
          <path
            d="M6.5 6.5v11h11"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "math_ai":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 17.5V12m5 5.5V8.5m5 9V10.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
          <path
            d="M6.5 17.5h11"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "biology":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.5 15.8c0-4.2 3-7.6 7-8.3.7 4.6-1.7 8.7-5.8 9.7-2 .5-3.2-.1-4.2-1.4Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d="M8.5 16c2-1.4 4.2-3.7 5.8-6.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "chemistry":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 6.5v4.1l-3.1 5.3A1.8 1.8 0 0 0 8.4 18.5h7.2a1.8 1.8 0 0 0 1.5-2.6L14 10.6V6.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d="M9.3 14.5h5.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "physics":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" fill="currentColor" r="1.5" />
          <path
            d="M7.7 8.4c2.4-1.8 5.6-2.4 8.2-1.4 2.7 1 4.2 3.3 4 5.8-.1 1.5-.9 3-2.2 4.2M8 16.6c-2.5-1.8-3.9-4.6-3.3-7 .6-2.5 3-4.3 6.1-4.6 1.8-.1 3.6.3 5.1 1.1M15.8 17.3c-2.9 1-6 .6-8.1-1.1-2.1-1.7-2.8-4.5-1.8-7.1"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "history":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 18V9m5 9V9m5 9V9M5.5 18.5h13M5.5 8.5h13M7.5 6.5h9l1.5 2H6l1.5-2Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "business":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.5 9V7.8c0-.7.6-1.3 1.3-1.3h6.4c.7 0 1.3.6 1.3 1.3V9M6.5 9h11a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d="M10.5 12h3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "economics":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.5 17.5h11M8 15l2.5-3 2 1.5 3.5-5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d="M15.5 8.5H18V11"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "psychology":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.5 6.5c3.3 0 6 2.7 6 6v5h-5.2a5.8 5.8 0 0 1-5.8-5.8V8.5c0-1.1.9-2 2-2h3Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d="M12 10.5c.8.2 1.5.9 1.5 1.8 0 .9-.7 1.6-1.5 1.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.75"
          />
        </svg>
      );
    case "tok":
      return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.5 16.5 6 18v-3c-1.2-1-2-2.5-2-4.2C4 7.9 6.9 6 10.5 6S17 7.9 17 10.8 14.1 15.5 10.5 15.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <path
            d="M18.5 18.5h-3l-2 1.2v-2.4a3.4 3.4 0 0 1-1.5-2.8c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.8 3.5-4 3.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      );
  }
}

function FlagGlyph({ flagCode }: { flagCode: AppLanguageFlagCode }) {
  switch (flagCode) {
    case "gb":
      return (
        <svg fill="none" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#1E4FA1" height="20" rx="3" width="28" />
          <path d="M0 2.1V0h3.1L28 17.1V20h-3.1L0 2.1Z" fill="#fff" />
          <path d="M24.9 0H28v2.1L3.1 20H0v-2.1L24.9 0Z" fill="#fff" />
          <path d="M0 0h1.8L28 18.7V20h-1.8L0 1.3V0Z" fill="#C8102E" />
          <path d="M26.2 0H28v1.3L1.8 20H0v-1.3L26.2 0Z" fill="#C8102E" />
          <path d="M11 0h6v20h-6Z" fill="#fff" />
          <path d="M0 7h28v6H0Z" fill="#fff" />
          <path d="M12.2 0h3.6v20h-3.6Z" fill="#C8102E" />
          <path d="M0 8.2h28v3.6H0Z" fill="#C8102E" />
          <rect height="19" rx="2.5" stroke="rgb(0 0 0 / 0.08)" width="27" x=".5" y=".5" />
        </svg>
      );
    case "pl":
      return (
        <svg fill="none" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#fff" height="20" rx="3" width="28" />
          <path d="M0 10h28v10H0Z" fill="#DC143C" />
          <rect height="19" rx="2.5" stroke="rgb(0 0 0 / 0.08)" width="27" x=".5" y=".5" />
        </svg>
      );
    case "es":
      return (
        <svg fill="none" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#AA151B" height="20" rx="3" width="28" />
          <path d="M0 5h28v10H0Z" fill="#F1BF00" />
          <rect height="19" rx="2.5" stroke="rgb(0 0 0 / 0.08)" width="27" x=".5" y=".5" />
        </svg>
      );
    case "fr":
      return (
        <svg fill="none" viewBox="0 0 28 20" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#fff" height="20" rx="3" width="28" />
          <path d="M0 0h9.4v20H0Z" fill="#0055A4" />
          <path d="M18.6 0H28v20h-9.4Z" fill="#EF4135" />
          <rect height="19" rx="2.5" stroke="rgb(0 0 0 / 0.08)" width="27" x=".5" y=".5" />
        </svg>
      );
  }
}
