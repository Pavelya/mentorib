import type { Route } from "next";
import Link from "next/link";

import {
  ContextChipRow,
  NeedSummaryBar,
  PersonSummary,
} from "@/components/continuity";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { getButtonClassName } from "@/components/ui";

export default function ResultsPage() {
  return (
    <RoutePlaceholder
      routePath="/results"
      phase="Phase 1"
      title="Results route shell"
      description="Placeholder route for fit-based tutor results."
      links={[
        { href: "/compare", label: "Open compare placeholder", tone: "ghost" },
        {
          href: "/book/demo-context" as Route,
          label: "Open booking handoff",
        },
      ]}
      notes={[
        "Real result cards and ranking output land in P1-MATCH-002.",
      ]}
    >
      <NeedSummaryBar
        action={
          <Link className={getButtonClassName({ size: "compact", variant: "secondary" })} href="/match">
            Refine need
          </Link>
        }
        label="Current need"
        mode="editable"
        need="Calm Biology HL Paper 2 revision"
        qualifiers={[
          { label: "Biology HL" },
          { label: "IA structure" },
          { label: "Evening support" },
          { label: "Europe/Warsaw", priority: "support" },
        ]}
        state="active"
      />

      <PersonSummary
        badges={[
          { label: "Verified tutor", tone: "trust" },
          { label: "Strong timezone overlap", tone: "positive" },
        ]}
        descriptor="Best for step-by-step Paper 2 planning and clearer IA checkpoints."
        eyebrow="Top fit preview"
        meta={["London", "English and Polish", "89 completed lessons"]}
        name="Maya Chen"
        state="verified"
      />

      <ContextChipRow
        items={[
          { label: "Fit reasoning stays primary", tone: "info" },
          { label: "Booking context survives handoff", tone: "trust" },
          { label: "Need still visible on mobile", tone: "positive" },
        ]}
        label="Result continuity"
      />
    </RoutePlaceholder>
  );
}
