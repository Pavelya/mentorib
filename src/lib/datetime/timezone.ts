export const DEFAULT_TIMEZONE = "UTC";
export const TIMEZONE_COOKIE_NAME = "mentorib_timezone";

const MAX_TIMEZONE_LENGTH = 100;

export function normalizeTimezone(candidate: string | null | undefined) {
  const timezone = candidate?.trim();

  if (!timezone || timezone.length > MAX_TIMEZONE_LENGTH) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("en", { timeZone: timezone }).resolvedOptions()
      .timeZone;
  } catch {
    return null;
  }
}

export function resolveTimezone(candidate: string | null | undefined) {
  return normalizeTimezone(candidate) ?? DEFAULT_TIMEZONE;
}

export function isValidTimezone(candidate: string | null | undefined) {
  return normalizeTimezone(candidate) !== null;
}

export function detectClientTimezone() {
  try {
    return resolveTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function getTimezoneLabel(timezone: string | null | undefined) {
  return resolveTimezone(timezone).replaceAll("_", " ");
}
