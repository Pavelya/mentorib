import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function BillingPage() {
  return (
    <RoutePlaceholder
      routePath="/billing"
      phase="Phase 1"
      title="Billing route shell"
      description="Shared billing wrapper placeholder. Real payment operations arrive in booking and earnings tasks."
    />
  );
}
