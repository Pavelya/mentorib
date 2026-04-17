import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function RoleSelectionPage() {
  return (
    <RoutePlaceholder
      routePath="/setup/role"
      phase="Phase 1"
      title="Role setup route shell"
      description="Placeholder setup screen for selecting student or tutor context after authentication."
      notes={[
        "Actual role-selection rules and redirects land in P1-AUTH-002.",
      ]}
    />
  );
}
