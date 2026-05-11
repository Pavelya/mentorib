import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/public/legal-document-page";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";
import { privacyPolicyContent } from "@/modules/legal/content";

const routeDefinition = staticPublicRouteDefinitions.privacyPolicy;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

export default function PrivacyPolicyPage() {
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
            { name: "Privacy policy", pathname: routeDefinition.pathname },
          ]),
        ]}
        id="privacy-policy-structured-data"
      />

      <LegalDocumentPage
        content={privacyPolicyContent}
        eyebrow="Privacy policy"
        relatedLinks={[
          { href: "/terms", label: "Terms of service" },
          { href: "/support", label: "Support" },
        ]}
        title={routeDefinition.title}
      />
    </>
  );
}
