import type { Metadata } from "next";

import { PublicMarketingPage } from "@/components/public/public-marketing-page";
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
      <PublicMarketingPage
        actions={[
          { href: "/match", label: "Start with your need" },
          { href: "/trust-and-safety", label: "Review trust standards", variant: "secondary" },
        ]}
        eyebrow="How it works"
        finalAction={{ href: "/match", label: "Begin matching" }}
        finalBody="The quickest path is to name the IB pressure point first. Mentor IB can then shape the next step around the kind of help the student actually needs."
        finalTitle="Ready to turn the problem into a tutor shortlist?"
        intro={routeDefinition.description}
        sections={[
          {
            body: "Mentor IB starts with the academic situation: IA feedback, TOK structure, oral preparation, exam rescue, or steady weekly support. That keeps the path from becoming a generic tutor search.",
            eyebrow: "Step 1",
            items: [
              "Choose the subject, component, urgency, and support style.",
              "Keep parent and student context visible before a tutor is selected.",
            ],
            title: "Define the real IB need",
          },
          {
            body: "The product is matching-first, so tutor fit is shaped around the student's goal, learning mode, and practical constraints rather than only a broad subject label.",
            eyebrow: "Step 2",
            items: [
              "Compare tutors by fit signals and relevant experience.",
              "Use profile context to understand why a tutor may be a strong option.",
            ],
            title: "Review fit, not just availability",
          },
          {
            body: "Once a student has a strong option, the booking path keeps the learning context attached so the first lesson can start with the right expectations.",
            eyebrow: "Step 3",
            items: [
              "Move from match results into booking with the need still visible.",
              "Keep lesson details and next actions in one product flow.",
            ],
            title: "Book with context intact",
          },
          {
            body: "After the first session, the same account can support messages, lessons, notifications, and ongoing decisions without splitting student and tutor work into separate products.",
            eyebrow: "Continuity",
            title: "Stay inside one ecosystem",
          },
        ]}
        signals={[
          "Need-first intake",
          "Tutor fit context",
          "Booking continuity",
          "Student and parent clarity",
        ]}
        title={routeDefinition.title}
      />
    </>
  );
}
