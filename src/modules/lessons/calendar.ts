import { siteConfig } from "@/lib/seo/site";

const GOOGLE_CALENDAR_RENDER_URL = "https://calendar.google.com/calendar/render";

export type LessonCalendarSnapshot = {
  endAtUtc: string;
  focusLabel: string | null;
  joinUrl: string | null;
  lessonId: string;
  startAtUtc: string;
  subjectLabel: string;
};

export type LessonCalendarLinks = {
  googleCalendarUrl: string;
  icsHref: string;
};

export function buildLessonCalendarLinks(
  snapshot: LessonCalendarSnapshot,
): LessonCalendarLinks {
  return {
    googleCalendarUrl: buildGoogleCalendarUrl(snapshot),
    icsHref: `/api/calendar/lessons/${encodeURIComponent(snapshot.lessonId)}/ics`,
  };
}

export function buildLessonCalendarTitle(snapshot: LessonCalendarSnapshot) {
  if (snapshot.focusLabel) {
    return `Mentor IB lesson · ${snapshot.subjectLabel} · ${snapshot.focusLabel}`;
  }

  return `Mentor IB lesson · ${snapshot.subjectLabel}`;
}

export function buildLessonCalendarDescription(snapshot: LessonCalendarSnapshot) {
  const lines = [
    "Scheduled through Mentor IB.",
    `Lesson detail: ${siteConfig.origin.origin}/lessons/${snapshot.lessonId}`,
  ];

  if (snapshot.joinUrl) {
    lines.push(`Join link: ${snapshot.joinUrl}`);
  }

  return lines.join("\n");
}

export function buildLessonIcsContent(snapshot: LessonCalendarSnapshot) {
  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(new Date(snapshot.startAtUtc));
  const dtEnd = formatIcsDate(new Date(snapshot.endAtUtc));
  const summary = escapeIcsText(buildLessonCalendarTitle(snapshot));
  const description = escapeIcsText(buildLessonCalendarDescription(snapshot));
  const location = snapshot.joinUrl ? escapeIcsText(snapshot.joinUrl) : null;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mentor IB//Lesson Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:lesson-${snapshot.lessonId}@mentorib.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
  ];

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return `${lines.join("\r\n")}\r\n`;
}

function buildGoogleCalendarUrl(snapshot: LessonCalendarSnapshot) {
  const url = new URL(GOOGLE_CALENDAR_RENDER_URL);
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", buildLessonCalendarTitle(snapshot));
  url.searchParams.set(
    "dates",
    `${formatIcsDate(new Date(snapshot.startAtUtc))}/${formatIcsDate(new Date(snapshot.endAtUtc))}`,
  );
  url.searchParams.set("details", buildLessonCalendarDescription(snapshot));

  if (snapshot.joinUrl) {
    url.searchParams.set("location", snapshot.joinUrl);
  }

  return url.toString();
}

function formatIcsDate(value: Date) {
  if (Number.isNaN(value.getTime())) {
    throw new Error("Expected a valid lesson schedule timestamp.");
  }

  const iso = value.toISOString();

  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
