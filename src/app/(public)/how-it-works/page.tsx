import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function HowItWorksPage() {
  return (
    <RoutePlaceholder
      routePath="/how-it-works"
      phase="Phase 1"
      title="How it works route shell"
      description="Supporting public route scaffold for process explanation and reassurance."
      notes={[
        "Final content ships in the public-route workstream.",
        "This exists now so the public family can be navigated end to end.",
      ]}
    />
  );
}
