import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorProfileNotFound() {
  return (
    <RoutePlaceholder
      routePath="/tutors/[slug]"
      phase="Phase 1"
      title="Tutor not found"
      titleAs="h1"
      description="This dynamic public route has its own not-found boundary as recommended in the route-layout architecture."
      links={[
        { href: "/", label: "Return home" },
        { href: "/match", label: "Start matching", tone: "ghost" },
      ]}
      notes={[
        "Later tasks can call notFound() when a tutor slug is missing or not publicly visible.",
      ]}
    />
  );
}
