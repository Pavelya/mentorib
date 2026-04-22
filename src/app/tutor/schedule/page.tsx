import { TimezoneNotice } from "@/components/datetime";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { formatUtcLessonRange } from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";

export default async function TutorSchedulePage() {
  const timezone = await getCurrentUserTimezone();
  const demoScheduleRange = formatUtcLessonRange(
    "2026-04-24T16:30:00Z",
    "2026-04-24T17:18:00Z",
    timezone,
  );

  return (
    <RoutePlaceholder
      routePath="/tutor/schedule"
      phase="Phase 1"
      title="Tutor schedule route shell"
      description="Reserved schedule route for availability and calendar behavior."
      notes={[
        "Final schedule logic belongs to P1-TUTOR-003 and later lesson tasks.",
        `Example schedule slots render as ${demoScheduleRange}.`,
      ]}
    >
      <TimezoneNotice timezone={timezone} />
    </RoutePlaceholder>
  );
}
