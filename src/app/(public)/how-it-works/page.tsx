import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";

const routeDefinition = staticPublicRouteDefinitions.howItWorks;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

export default function HowItWorksPage() {
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
            { name: "How it works", pathname: routeDefinition.pathname },
          ]),
        ]}
        id="how-it-works-structured-data"
      />

      <RoutePlaceholder
        routePath="/how-it-works"
        phase="Phase 1"
        title="How it works route shell"
        description="Supporting public route scaffold for process explanation and reassurance."
        notes={[
          "Final content ships in the public-route workstream.",
          "This exists now so the public family can be navigated end to end.",
        ]}
      />
    </>
  );
}
