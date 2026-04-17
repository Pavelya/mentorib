import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function StudentLessonsPage() {
  return (
    <RoutePlaceholder
      routePath="/lessons"
      phase="Phase 1"
      title="Student lessons route shell"
      description="Reserved student lessons hub inside the shared continuity model."
      notes={[
        "Lesson summaries and detail surfaces land in P1-LESS-001 and P1-LESS-002.",
      ]}
    />
  );
}
