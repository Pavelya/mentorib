import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorStudentsPage() {
  return (
    <RoutePlaceholder
      routePath="/tutor/students"
      phase="Phase 1.5"
      title="Tutor students route shell"
      description="Reserved tutor relationship surface included for route-family completeness."
      notes={[
        "Real roster and relationship detail work belongs to the Phase 1.5 pack.",
      ]}
    />
  );
}
