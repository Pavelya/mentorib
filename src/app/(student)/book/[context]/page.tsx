import { TimezoneNotice } from "@/components/datetime";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { formatUtcLessonRange } from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";

type BookingPageProps = {
  params: Promise<{
    context: string;
  }>;
};

export default async function BookingPage({ params }: BookingPageProps) {
  const { context } = await params;
  const timezone = await getCurrentUserTimezone();
  const demoLessonRange = formatUtcLessonRange(
    "2026-04-24T16:30:00Z",
    "2026-04-24T17:18:00Z",
    timezone,
  );

  return (
    <RoutePlaceholder
      routePath={`/book/${context}`}
      phase="Phase 1"
      title="Booking route shell"
      description={`Reserved booking handoff for context "${context}". Payment and booking actions arrive in P1-BOOK-001.`}
      notes={[
        "This route exists now to validate the approved URL posture and section chrome.",
        `Example booking slots render as ${demoLessonRange}.`,
      ]}
    >
      <TimezoneNotice timezone={timezone} />
    </RoutePlaceholder>
  );
}
