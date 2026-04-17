import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function BecomeATutorPage() {
  return (
    <RoutePlaceholder
      routePath="/become-a-tutor"
      phase="Phase 1"
      title="Become a tutor route shell"
      description="Placeholder route for the tutor-supply entry point in the shared public shell."
      notes={[
        "This is a public landing route, not the future tutor application workflow.",
        "The staged application experience belongs to Phase 2.",
      ]}
    />
  );
}
