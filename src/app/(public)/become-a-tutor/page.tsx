import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";

const routeDefinition = staticPublicRouteDefinitions.becomeATutor;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

export default function BecomeATutorPage() {
  return (
    <>
      <StructuredData
        data={[
          buildWebPageSchema({
            description: routeDefinition.description,
            pathname: routeDefinition.pathname,
            title: routeDefinition.title,
          }),
          buildBreadcrumbListSchema([
            { name: "Home", pathname: "/" },
            { name: "Become a tutor", pathname: routeDefinition.pathname },
          ]),
        ]}
        id="become-a-tutor-structured-data"
      />

      <RoutePlaceholder
        routePath="/become-a-tutor"
        phase="Phase 1"
        title="Become a tutor route shell"
        description="Placeholder route for the tutor-supply entry point in the shared public shell."
        notes={[
          "This is a public landing route, not the future tutor application workflow.",
          "The staged application experience belongs to Phase 2.",
        ]}
      />
    </>
  );
}
