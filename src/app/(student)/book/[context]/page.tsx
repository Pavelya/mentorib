import { RoutePlaceholder } from "@/components/shell/route-placeholder";

type BookingPageProps = {
  params: Promise<{
    context: string;
  }>;
};

export default async function BookingPage({ params }: BookingPageProps) {
  const { context } = await params;

  return (
    <RoutePlaceholder
      routePath={`/book/${context}`}
      phase="Phase 1"
      title="Booking route shell"
      description={`Reserved booking handoff for context "${context}". Payment and booking actions arrive in P1-BOOK-001.`}
      notes={[
        "This route exists now to validate the approved URL posture and section chrome.",
      ]}
    />
  );
}
