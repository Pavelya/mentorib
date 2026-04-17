import { RoutePlaceholder } from "@/components/shell/route-placeholder";

type TutorProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TutorProfilePage({
  params,
}: TutorProfilePageProps) {
  const { slug } = await params;

  return (
    <RoutePlaceholder
      routePath={`/tutors/${slug}`}
      phase="Phase 1"
      title="Tutor profile route shell"
      description={`Shared public tutor profile placeholder for "${slug}". The real decision-focused profile arrives in P1-PUBLIC-003.`}
      notes={[
        "A route-local not-found boundary exists for missing tutor slugs.",
        "This page intentionally avoids real data fetching in the scaffold task.",
      ]}
      links={[{ href: "/match", label: "Back to match flow", tone: "ghost" }]}
    />
  );
}
