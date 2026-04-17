import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function MatchPage() {
  return (
    <RoutePlaceholder
      routePath="/match"
      phase="Phase 1"
      title="Match flow route shell"
      description="Placeholder route for the guided student intake flow."
      links={[{ href: "/results", label: "Open results placeholder" }]}
      notes={[
        "Final guided intake steps land in P1-MATCH-001.",
        "The route already lives inside the shared student shell instead of a standalone app.",
      ]}
    />
  );
}
