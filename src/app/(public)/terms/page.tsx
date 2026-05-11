import type { Metadata } from "next";

import { LegalDocumentPage } from "@/components/public/legal-document-page";
import { buildStaticPublicRouteMetadata } from "@/lib/seo/metadata/build-metadata";
import { staticPublicRouteDefinitions } from "@/lib/seo/public-routes";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema/breadcrumb";
import { StructuredData } from "@/lib/seo/schema/json-ld";
import { buildWebPageSchema } from "@/lib/seo/schema/webpage";
import { termsContent } from "@/modules/legal/content";

const routeDefinition = staticPublicRouteDefinitions.terms;

export const metadata: Metadata = buildStaticPublicRouteMetadata(routeDefinition);

export default function TermsPage() {
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
            { name: "Terms", pathname: routeDefinition.pathname },
          ]),
        ]}
        id="terms-structured-data"
      />

      <LegalDocumentPage
        content={termsContent}
        eyebrow="Terms of service"
        relatedLinks={[
          { href: "/privacy-policy", label: "Privacy policy" },
          { href: "/support", label: "Support" },
        ]}
        title={routeDefinition.title}
      />
    </>
  );
}
