import Link from "next/link";

import {
  ContextChipRow,
  LessonSummary,
  PersonSummary,
  ScreenState,
} from "@/components/continuity";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { getButtonClassName } from "@/components/ui";

export default function StudentMessagesPage() {
  return (
    <RoutePlaceholder
      routePath="/messages"
      phase="Phase 1"
      title="Student messages route shell"
      description="Reserved shared conversation surface from the student perspective."
      notes={[
        "Conversation DTOs and messaging behavior arrive in Phase 1 message tasks.",
      ]}
    >
      <LessonSummary
        action={
          <Link className={getButtonClassName({ size: "compact", variant: "secondary" })} href="/lessons">
            Open lessons hub
          </Link>
        }
        details={["Trial request", "48-minute slot", "Policy review remains visible"]}
        person={
          <PersonSummary
            badges={[{ label: "Verified tutor", tone: "trust" }]}
            descriptor="Structured revision and IA checkpoint support"
            meta={["London timezone", "English and Polish"]}
            name="Maya Chen"
            state="verified"
            variant="compact"
          />
        }
        schedule="Friday, 18 April · 18:30"
        status="upcoming"
        timezone="Your local time · Europe/Warsaw"
        title="Paper 2 revision sprint"
      />

      <ContextChipRow
        items={[
          { label: "Lesson context pinned", tone: "trust" },
          { label: "Messages not started yet", tone: "warning" },
          { label: "Booking handoff preserved", tone: "info" },
        ]}
        label="Conversation continuity"
      />

      <ScreenState
        action={
          <Link className={getButtonClassName({ size: "compact" })} href="/lessons">
            Review lesson request
          </Link>
        }
        description="The shared conversation shell should explain what comes next while keeping the tutor and lesson frame visible."
        hints={["Lesson summary stays above the fold", "Next step is explicit"]}
        kind="empty"
        title="No messages yet"
      />
    </RoutePlaceholder>
  );
}
