import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function NotificationsPage() {
  return (
    <RoutePlaceholder
      routePath="/notifications"
      phase="Phase 1"
      title="Notifications route shell"
      description="Reserved shared notifications route."
      notes={[
        "Lifecycle notifications and delivery logic land in Phase 1 notification tasks.",
      ]}
    />
  );
}
