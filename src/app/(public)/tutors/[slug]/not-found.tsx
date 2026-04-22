import { RoutePlaceholder } from "@/components/shell/route-placeholder";

export default function TutorProfileNotFound() {
  return (
    <RoutePlaceholder
      routePath="/tutors/[slug]"
      phase="Phase 1"
      title="Tutor profile not available"
      titleAs="h1"
      description="This tutor profile is not currently available on the public Mentor IB surface."
      links={[
        { href: "/", label: "Return home" },
        { href: "/match", label: "Start matching", tone: "ghost" },
      ]}
      notes={[
        "Profiles only render when the public listing state allows anonymous access.",
      ]}
    />
  );
}
