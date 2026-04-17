import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorLessonsPage() {
  return (
    <RoutePlaceholder
      routePath="/tutor/lessons"
      phase="Phase 1"
      title="Tutor lessons route shell"
      description="Reserved tutor-side lesson hub built on the shared lesson object."
      notes={[
        "Operational lesson lists and actions arrive in P1-TUTOR-002.",
      ]}
    />
  );
}
