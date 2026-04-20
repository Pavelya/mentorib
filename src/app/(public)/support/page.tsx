import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { buildHelpPageSchema } from "@/lib/seo/schema/help-page";
import { StructuredData } from "@/lib/seo/schema/json-ld";

const routeDefinition = staticPublicRouteDefinitions.support;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

export default function SupportPage() {
  return (
    <>
      <StructuredData
        data={[
          buildHelpPageSchema({
            description: routeDefinition.description,
            pathname: routeDefinition.pathname,
            title: routeDefinition.title,
          }),
          buildBreadcrumbListSchema([
            { name: "Home", pathname: "/" },
            { name: "Support", pathname: routeDefinition.pathname },
          ]),
        ]}
        id="support-structured-data"
      />

      <RoutePlaceholder
        routePath="/support"
        phase="Phase 1"
        title="Support route shell"
        description="Placeholder support route for the public family."
        notes={[
          "Keeps the approved public IA visible in the scaffold.",
          "Actual content and help workflows are deferred.",
        ]}
      />
    </>
  );
}
