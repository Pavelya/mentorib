import { DEFAULT_TIMEZONE, getTimezoneLabel, resolveTimezone } from "@/lib/datetime/timezone";

type UtcDateInput = Date | number | string;

type DateTimeFormatOptions = {
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  locale?: string;
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  timezone?: string | null;
};

const ISO_DATETIME_WITHOUT_ZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

const DEFAULT_LOCALE = "en-GB";

export function formatUtcDateTime(
  value: UtcDateInput,
  {
    dateStyle = "medium",
    locale = DEFAULT_LOCALE,
    timeStyle = "short",
    timezone = DEFAULT_TIMEZONE,
  }: DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone: resolveTimezone(timezone),
  }).format(toUtcDate(value));
}

export function formatUtcDate(value: UtcDateInput, timezone?: string | null) {
  return formatUtcDateTime(value, {
    dateStyle: "full",
    timeStyle: undefined,
    timezone,
  });
}

export function formatUtcTime(value: UtcDateInput, timezone?: string | null) {
  return formatUtcDateTime(value, {
    dateStyle: undefined,
    timeStyle: "short",
    timezone,
  });
}

export function formatUtcLessonRange(
  startAt: UtcDateInput,
  endAt: UtcDateInput,
  timezone?: string | null,
) {
  const resolvedTimezone = resolveTimezone(timezone);

  return `${formatUtcDateTime(startAt, {
    dateStyle: "full",
    timeStyle: "short",
    timezone: resolvedTimezone,
  })}-${formatUtcTime(endAt, resolvedTimezone)}`;
}

export function formatTimezoneContext(timezone: string | null | undefined) {
  return `Your local timezone · ${getTimezoneLabel(timezone)}`;
}

export function getTimezoneExplanation(timezone: string | null | undefined) {
  return `All times shown in your local timezone (${getTimezoneLabel(timezone)}).`;
}

function toUtcDate(value: UtcDateInput) {
  const date =
    typeof value === "string" ? new Date(normalizeUtcDateString(value)) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Expected a valid UTC date/time value.");
  }

  return date;
}

function normalizeUtcDateString(value: string) {
  const trimmedValue = value.trim();

  if (ISO_DATETIME_WITHOUT_ZONE_PATTERN.test(trimmedValue)) {
    return `${trimmedValue}Z`;
  }

  return trimmedValue;
}
