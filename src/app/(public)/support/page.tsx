import type { Metadata } from "next";

import { PublicMarketingPage } from "@/components/public/public-marketing-page";
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

      <PublicMarketingPage
        actions={[
          { href: "/match", label: "Start matching" },
          { href: "/trust-and-safety", label: "Trust and safety", variant: "secondary" },
        ]}
        eyebrow="Support"
        finalAction={{ href: "/auth/sign-in", label: "Go to sign in", variant: "secondary" }}
        finalBody="Existing users should sign in for account-specific messages, lesson details, and notifications. Public support stays focused on general guidance."
        finalTitle="Already have an account?"
        intro={routeDefinition.description}
        sections={[
          {
            body: "Students and parents can start by clarifying the academic need, then use matching to find tutor options that fit the subject, timeline, and support style.",
            eyebrow: "Students and parents",
            items: [
              "Use matching when you know the pressure point but not the tutor yet.",
              "Use tutor profiles when you want to evaluate fit before booking.",
            ],
            title: "Finding the right help",
          },
          {
            body: "The booking flow is designed to keep lesson context attached after a tutor is selected. That context helps avoid a first session that starts from zero.",
            eyebrow: "Booking",
            items: [
              "Keep the IB component and urgency clear before booking.",
              "Use messages and lesson surfaces for account-specific follow-up.",
            ],
            title: "Preparing for a lesson",
          },
          {
            body: "Prospective tutors should use the become-a-tutor route to understand standards, fit, and the application path before starting the formal tutor workflow.",
            eyebrow: "Tutors",
            items: [
              "Review the tutor standards before applying.",
              "Start the application only when the IB fit is clear.",
            ],
            title: "Applying to teach",
          },
          {
            body: "Safety or account concerns should move through explicit product and support paths. Public pages explain the standard; signed-in flows hold private details.",
            eyebrow: "Escalation",
            title: "Getting more help",
          },
        ]}
        signals={["Student guidance", "Parent clarity", "Tutor applications", "Safety questions"]}
        title={routeDefinition.title}
      />
    </>
  );
}
