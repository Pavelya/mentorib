import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";

const routeDefinition = staticPublicRouteDefinitions.trustAndSafety;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

export default function TrustAndSafetyPage() {
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
            { name: "Trust and safety", pathname: routeDefinition.pathname },
          ]),
        ]}
        id="trust-and-safety-structured-data"
      />

      <RoutePlaceholder
        routePath="/trust-and-safety"
        phase="Phase 1"
        title="Trust and safety route shell"
        description="Reserved public trust surface inside the shared public family."
        notes={[
          "Detailed trust content belongs to later public and trust tasks.",
          "The route exists early so top-level public navigation is structurally complete.",
        ]}
      />
    </>
  );
}
