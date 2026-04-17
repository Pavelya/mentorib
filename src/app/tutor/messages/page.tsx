import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorMessagesPage() {
  return (
    <RoutePlaceholder
      routePath="/tutor/messages"
      phase="Phase 1"
      title="Tutor messages route shell"
      description="Reserved tutor-side entry into the shared conversation model."
      notes={[
        "Shared message thread behavior lands in the Phase 1 messaging tasks.",
      ]}
    />
  );
}
