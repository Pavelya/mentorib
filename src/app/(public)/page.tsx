import type { Metadata } from "next";

import { FoundationPreview } from "@/components/shell/foundation-preview";
import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildOrganizationSchema } from "@/lib/seo/schema/organization";
import { buildWebSiteSchema } from "@/lib/seo/schema/website";

const routeDefinition = staticPublicRouteDefinitions.home;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

export default function HomePage() {
  return (
    <>
      <StructuredData
        data={[
          buildOrganizationSchema(routeDefinition.description),
          buildWebSiteSchema(routeDefinition.description),
        ]}
        id="home-route-structured-data"
      />

      <RoutePlaceholder
        routePath="/"
        phase="Phase 1"
        title="Home route shell"
        titleAs="h1"
        description="This placeholder marks the public home route inside the shared app shell. The real home experience lands in P1-PUBLIC-002."
        links={[
          { href: "/match", label: "Open match flow" },
          { href: "/how-it-works", label: "See supporting routes", tone: "ghost" },
        ]}
        notes={[
          "The student and tutor experiences remain inside one Next.js application.",
          "The home page will later become the primary problem-led entry point.",
        ]}
      >
        <FoundationPreview />
      </RoutePlaceholder>
    </>
  );
}
