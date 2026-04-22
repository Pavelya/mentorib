import type { Metadata } from "next";

import { PublicMarketingPage } from "@/components/public/public-marketing-page";
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

      <PublicMarketingPage
        actions={[
          { href: "/match", label: "Start safely" },
          { href: "/support", label: "Read support guidance", variant: "secondary" },
        ]}
        eyebrow="Trust and safety"
        finalAction={{ href: "/support", label: "Open support" }}
        finalBody="If something feels unclear or unsafe, the public support route explains where to go next before the product adds deeper case workflows."
        finalTitle="Need help understanding the next step?"
        intro={routeDefinition.description}
        sections={[
          {
            body: "Public tutor visibility is treated as a quality-gated surface. Tutor profile data, trust signals, and public claims must be safe to show before they become part of the searchable product.",
            eyebrow: "Tutor quality",
            items: [
              "Public profile content must be backed by approved visible information.",
              "Search eligibility is separated from simply having a route online.",
            ],
            title: "Tutor information is reviewed before it becomes discoverable",
          },
          {
            body: "Mentor IB is designed around explicit student needs, so fit context matters alongside tutor experience. The product should help families understand why a tutor is a good option for the specific IB problem.",
            eyebrow: "Student fit",
            items: [
              "Need, subject, urgency, and support style stay attached to the flow.",
              "Tutor choice should be explained through fit signals, not vague rankings.",
            ],
            title: "Matching is meant to reduce guesswork",
          },
          {
            body: "The architecture reserves space for reporting, blocking, moderation, and internal review so trust events can be handled as product records rather than loose messages.",
            eyebrow: "Safety paths",
            items: [
              "Support and reporting paths are part of the product model.",
              "Internal review surfaces are separated from public pages and user workflows.",
            ],
            title: "Concerns need explicit handling paths",
          },
          {
            body: "Public pages should make truthful, supportable claims. Private account details, moderation notes, and operational signals stay out of metadata and structured data.",
            eyebrow: "Privacy",
            title: "Public trust copy stays grounded",
          },
        ]}
        signals={[
          "Quality-gated profiles",
          "Fit-first matching",
          "Reporting paths",
          "Public claim discipline",
        ]}
        title={routeDefinition.title}
      />
    </>
  );
}
