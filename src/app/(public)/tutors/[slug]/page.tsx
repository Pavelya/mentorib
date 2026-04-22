import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { buildRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { evaluateTutorProfileIndexability } from "@/lib/seo/quality/public-indexability";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildProfilePageSchema } from "@/lib/seo/schema/profile-page";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";

function formatSlugAsName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

type TutorProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: TutorProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const displayName = formatSlugAsName(slug) || "Tutor";
  const qualityGate = evaluateTutorProfileIndexability(null);

  return buildRouteMetadata({
    description: `Phase 1 scaffold for the public tutor profile route for "${displayName}" while approved tutor profile data is still disconnected from the SEO surface.`,
    isIndexable: qualityGate.isIndexable,
    pathname: `/tutors/${slug}`,
    title: `${displayName} Tutor Profile Scaffold`,
    type: "profile",
  });
}

export default async function TutorProfilePage({
  params,
}: TutorProfilePageProps) {
  const { slug } = await params;
  const displayName = formatSlugAsName(slug) || "Tutor";
  const pathname = `/tutors/${slug}`;
  const qualityGate = evaluateTutorProfileIndexability(null);
  const description = `Phase 1 scaffold for the public tutor profile route for "${displayName}" while approved tutor profile data is still disconnected from the SEO surface.`;
  const structuredData = qualityGate.isSchemaEligible
    ? [
        buildProfilePageSchema({
          description,
          imageUrl: "https://mentorib.com/opengraph-image",
          name: displayName,
          pathname,
          subjects: [],
        }),
      ]
    : [
        buildWebPageSchema({
          description,
          pathname,
          title: `${displayName} Tutor Profile Scaffold`,
        }),
      ];

  return (
    <>
      <StructuredData
        data={[
          ...structuredData,
          buildBreadcrumbListSchema([
            { name: "Home", pathname: "/" },
            { name: displayName, pathname },
          ]),
        ]}
        id="tutor-profile-structured-data"
      />

      <RoutePlaceholder
        routePath={`/tutors/${slug}`}
        phase="Phase 1"
        title="Tutor profile route shell"
        titleAs="h1"
        description={`Shared public tutor profile placeholder for "${slug}". The real decision-focused profile arrives in P1-PUBLIC-003.`}
        notes={[
          "A route-local not-found boundary exists for missing tutor slugs.",
          "This page intentionally avoids real data fetching in the scaffold task.",
        ]}
        links={[{ href: "/match", label: "Back to match flow", tone: "ghost" }]}
      />
    </>
  );
}
