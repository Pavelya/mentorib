import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorEarningsPage() {
  return (
    <RoutePlaceholder
      routePath="/tutor/earnings"
      phase="Phase 1"
      title="Tutor earnings route shell"
      description="Reserved earnings route for payout-readiness and finance visibility."
      notes={[
        "Payment and Stripe Connect behavior lands in the booking and earnings tasks.",
      ]}
    />
  );
}
