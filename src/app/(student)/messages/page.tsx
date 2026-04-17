import { RoutePlaceholder } from "@/components/shell/route-placeholder";

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
    />
  );
}
