import { RoutePlaceholder } from "@/components/shell/route-placeholder";

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
    />
  );
}
