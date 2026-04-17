import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function SettingsPage() {
  return (
    <RoutePlaceholder
      routePath="/settings"
      phase="Phase 1"
      title="Settings route shell"
      description="Shared account settings scaffold."
      notes={[
        "Real settings editing arrives in later account tasks.",
      ]}
    />
  );
}
