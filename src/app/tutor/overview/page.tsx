import Link from "next/link";

import {
  ContextChipRow,
  NeedSummaryBar,
  PersonSummary,
} from "@/components/continuity";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { getButtonClassName } from "@/components/ui";

export default function TutorOverviewPage() {
  return (
    <RoutePlaceholder
      routePath="/tutor/overview"
      phase="Phase 1"
      title="Tutor overview route shell"
      description="Reserved tutor overview route for operational attention and next actions."
      notes={[
        "Actual dashboard modules arrive in P1-TUTOR-001.",
      ]}
    >
      <NeedSummaryBar
        action={
          <Link
            className={getButtonClassName({ size: "compact", variant: "secondary" })}
            href="/tutor/messages"
          >
            Open shared thread
          </Link>
        }
        label="Request context"
        mode="readOnly"
        need="Paper 2 revision and IA checkpoint"
        qualifiers={[
          { label: "Biology HL" },
          { label: "Student prefers evenings" },
          { label: "Warsaw timezone", priority: "support" },
        ]}
        state="locked"
        variant="stacked"
      />

      <PersonSummary
        badges={[
          { label: "Active student", tone: "positive" },
          { label: "First lesson", tone: "info" },
        ]}
        descriptor="Needs a calmer sequence before the next school checkpoint."
        eyebrow="Student context"
        meta={["Europe/Warsaw", "Biology HL", "Next milestone on Monday"]}
        name="Lena Nowak"
        state="new"
        variant="operational"
      />

      <ContextChipRow
        items={[
          { label: "One shared lesson grammar", tone: "trust" },
          { label: "Timezone translation visible", tone: "info" },
          { label: "Request urgency stays compact", tone: "warning" },
        ]}
        label="Operational continuity"
      />
    </RoutePlaceholder>
  );
}
