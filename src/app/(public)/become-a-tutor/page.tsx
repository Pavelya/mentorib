import type { Metadata } from "next";

import { PublicMarketingPage } from "@/components/public/public-marketing-page";
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

      <PublicMarketingPage
        actions={[
          { href: "/tutor/apply", label: "Apply to teach" },
          { href: "/how-it-works", label: "See the student flow", variant: "secondary" },
        ]}
        eyebrow="Become a tutor"
        finalAction={{ href: "/tutor/apply", label: "Start application" }}
        finalBody="The application route is where tutor onboarding can collect the details needed for review. This page helps you decide whether that path is worth starting."
        finalTitle="Ready to begin the tutor path?"
        intro={routeDefinition.description}
        sections={[
          {
            body: "Mentor IB is for tutors who can explain IB work in student language and support specific pressure points like IA feedback, oral preparation, exam technique, or weekly subject confidence.",
            eyebrow: "Fit",
            items: [
              "You should be comfortable with IB-specific expectations and terminology.",
              "You should be able to explain what kind of learner you help best.",
            ],
            title: "Who should apply",
          },
          {
            body: "The platform is matching-first, so tutor profiles need more than a broad subject list. Strong tutors should be able to show teaching judgment, reliability, and a clear support style.",
            eyebrow: "Standards",
            items: [
              "Public claims should be specific and supportable.",
              "Tutor information should help families make a confident decision.",
            ],
            title: "What Mentor IB looks for",
          },
          {
            body: "The application path is reserved for tutor onboarding. It can collect profile details, experience, subjects, and other review information before a tutor becomes publicly visible.",
            eyebrow: "Process",
            items: [
              "Start with the application entry point.",
              "Expect the product to separate application review from public profile visibility.",
            ],
            title: "How the application starts",
          },
          {
            body: "Approved tutors should eventually operate in the same ecosystem students use: messages, lessons, schedule, earnings, and public trust surfaces are part of one product model.",
            eyebrow: "After approval",
            title: "Teaching stays connected to the student experience",
          },
        ]}
        signals={["IB-specific teaching", "Profile quality", "Application review", "One tutor mode"]}
        title={routeDefinition.title}
      />
    </>
  );
}
