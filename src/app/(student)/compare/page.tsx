import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function ComparePage() {
  return (
    <RoutePlaceholder
      routePath="/compare"
      phase="Phase 1.5"
      title="Compare route shell"
      description="Reserved compare route included only as structural topology for the student family."
      notes={[
        "This file is intentionally skeletal. Compare behavior belongs to the Phase 1.5 task pack.",
      ]}
    />
  );
}
