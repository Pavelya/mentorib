import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorSchedulePage() {
  return (
    <RoutePlaceholder
      routePath="/tutor/schedule"
      phase="Phase 1"
      title="Tutor schedule route shell"
      description="Reserved schedule route for availability and calendar behavior."
      notes={[
        "Final schedule logic belongs to P1-TUTOR-003 and later lesson tasks.",
      ]}
    />
  );
}
