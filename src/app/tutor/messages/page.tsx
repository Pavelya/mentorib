import Link from "next/link";

import {
  ContextChipRow,
  LessonSummary,
  PersonSummary,
  ScreenState,
} from "@/components/continuity";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { getButtonClassName } from "@/components/ui";
import { formatTimezoneContext, formatUtcLessonRange } from "@/lib/datetime";
import { getCurrentUserTimezone } from "@/lib/datetime/server";

export default async function TutorMessagesPage() {
  const timezone = await getCurrentUserTimezone();

  return (
    <RoutePlaceholder
      routePath="/tutor/messages"
      phase="Phase 1"
      title="Tutor messages route shell"
      description="Reserved tutor-side entry into the shared conversation model."
      notes={[
        "Shared message thread behavior lands in the Phase 1 messaging tasks.",
      ]}
    >
      <LessonSummary
        action={
          <Link
            className={getButtonClassName({ size: "compact", variant: "secondary" })}
            href="/tutor/lessons"
          >
            Open lessons hub
          </Link>
        }
        details={["Follow-up note visible", "Join link still pending"]}
        person={
          <PersonSummary
            badges={[{ label: "Active student", tone: "positive" }]}
            descriptor="Needs revision structure before Monday checkpoint"
            meta={["Europe/Warsaw", "Biology HL"]}
            name="Lena Nowak"
            state="new"
            variant="compact"
          />
        }
        schedule={formatUtcLessonRange(
          "2026-04-24T16:30:00Z",
          "2026-04-24T17:18:00Z",
          timezone,
        )}
        status="accepted"
        timezone={formatTimezoneContext(timezone)}
        title="Biology HL strategy lesson"
      />

      <ContextChipRow
        items={[
          { label: "Student goal still visible", tone: "trust" },
          { label: "Thread fetch failed", tone: "destructive" },
          { label: "Reschedule path preserved", tone: "info" },
        ]}
        label="Conversation continuity"
      />

      <ScreenState
        action={
          <Link className={getButtonClassName({ size: "compact" })} href="/tutor/lessons">
            Return to lesson hub
          </Link>
        }
        description="Even when the thread stalls, the tutor should keep the lesson and student frame instead of dropping into a disconnected error shell."
        hints={["Retry keeps context", "Next operational route stays available"]}
        kind="error"
        title="Messages could not refresh"
      />
    </RoutePlaceholder>
  );
}
