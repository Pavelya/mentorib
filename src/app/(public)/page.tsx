import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function HomePage() {
  return (
    <RoutePlaceholder
      routePath="/"
      phase="Phase 1"
      title="Home route shell"
      description="This placeholder marks the public home route inside the shared app shell. The real home experience lands in P1-PUBLIC-002."
      links={[
        { href: "/match", label: "Open match flow" },
        { href: "/how-it-works", label: "See supporting routes", tone: "ghost" },
      ]}
      notes={[
        "The student and tutor experiences remain inside one Next.js application.",
        "The home page will later become the primary problem-led entry point.",
      ]}
    />
  );
}
