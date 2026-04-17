import type { Route } from "next";

import { RoutePlaceholder } from "@/components/shell/route-placeholder";

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
    />
  );
}
