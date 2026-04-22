import { TimezoneNotice } from "@/components/datetime";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { formatUtcLessonRange } from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";

export default async function TutorLessonsPage() {
  const timezone = await getCurrentUserTimezone();
  const demoLessonRange = formatUtcLessonRange(
    "2026-04-24T16:30:00Z",
    "2026-04-24T17:18:00Z",
    timezone,
  );

  return (
    <RoutePlaceholder
      routePath="/tutor/lessons"
      phase="Phase 1"
      title="Tutor lessons route shell"
      description="Reserved tutor-side lesson hub built on the shared lesson object."
      notes={[
        "Operational lesson lists and actions arrive in P1-TUTOR-002.",
        `Example lesson times render as ${demoLessonRange}.`,
      ]}
    >
      <TimezoneNotice timezone={timezone} />
    </RoutePlaceholder>
  );
}
