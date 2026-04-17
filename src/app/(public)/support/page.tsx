import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function SupportPage() {
  return (
    <RoutePlaceholder
      routePath="/support"
      phase="Phase 1"
      title="Support route shell"
      description="Placeholder support route for the public family."
      notes={[
        "Keeps the approved public IA visible in the scaffold.",
        "Actual content and help workflows are deferred.",
      ]}
    />
  );
}
