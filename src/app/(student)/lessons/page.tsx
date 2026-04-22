import { TimezoneNotice } from "@/components/datetime";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { formatUtcLessonRange } from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";

export default async function StudentLessonsPage() {
  const timezone = await getCurrentUserTimezone();
  const demoLessonRange = formatUtcLessonRange(
    "2026-04-24T16:30:00Z",
    "2026-04-24T17:18:00Z",
    timezone,
  );

  return (
    <RoutePlaceholder
      routePath="/lessons"
      phase="Phase 1"
      title="Student lessons route shell"
      description="Reserved student lessons hub inside the shared continuity model."
      notes={[
        "Lesson summaries and detail surfaces land in P1-LESS-001 and P1-LESS-002.",
        `Example lesson times render as ${demoLessonRange}.`,
      ]}
    >
      <TimezoneNotice timezone={timezone} />
    </RoutePlaceholder>
  );
}
