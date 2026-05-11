import type { SeoRouteClass } from "@/lib/seo/route-class";

export type StaticPublicRouteKey =
  | "home"
  | "howItWorks"
  | "trustAndSafety"
  | "support"
  | "becomeATutor"
  | "privacyPolicy"
  | "terms";

export type StaticPublicRouteDefinition = {
  breadcrumbLabel?: string;
  description: string;
  key: StaticPublicRouteKey;
  openGraphType: "article" | "website";
  pathname: string;
  routeClass: SeoRouteClass;
  searchReady: boolean;
  searchReadyBlocker?: string;
  title: string;
};

export const staticPublicRouteDefinitions: Record<
  StaticPublicRouteKey,
  StaticPublicRouteDefinition
> = {
  becomeATutor: {
    breadcrumbLabel: "Become a tutor",
    description:
      "Learn who should apply to teach on Mentor IB, what standards matter, and how the tutor application path begins.",
    key: "becomeATutor",
    openGraphType: "article",
    pathname: "/become-a-tutor",
    routeClass: "A",
    searchReady: true,
    title: "Become an IB Tutor on Mentor IB",
  },
  home: {
    description:
      "Mentor IB matches students and parents with IB tutors for specific academic pressure points like IA feedback, TOK structure, oral practice, exam rescue, and weekly support.",
    key: "home",
    openGraphType: "website",
    pathname: "/",
    routeClass: "A",
    searchReady: true,
    title: "Mentor IB Tutor Matching for Specific IB Pressure Points",
  },
  howItWorks: {
    breadcrumbLabel: "How it works",
    description:
      "See how Mentor IB turns an IB learning need into clearer tutor fit, booking context, and ongoing lesson continuity.",
    key: "howItWorks",
    openGraphType: "article",
    pathname: "/how-it-works",
    routeClass: "A",
    searchReady: true,
    title: "How Mentor IB Matching Works for Students and Parents",
  },
  privacyPolicy: {
    breadcrumbLabel: "Privacy policy",
    description:
      "Read how Mentor IB collects, uses, shares, and retains personal data across matching, bookings, lessons, payments, and support.",
    key: "privacyPolicy",
    openGraphType: "article",
    pathname: "/privacy-policy",
    routeClass: "A",
    searchReady: true,
    title: "Mentor IB Privacy Policy",
  },
  terms: {
    breadcrumbLabel: "Terms",
    description:
      "Read the terms of service that govern student, parent, and tutor use of Mentor IB matching, booking, payment, and lesson features.",
    key: "terms",
    openGraphType: "article",
    pathname: "/terms",
    routeClass: "A",
    searchReady: true,
    title: "Mentor IB Terms of Service",
  },
  support: {
    breadcrumbLabel: "Support",
    description:
      "Find public guidance for students, parents, and tutors on matching, booking, tutor applications, and trust questions.",
    key: "support",
    openGraphType: "article",
    pathname: "/support",
    routeClass: "A",
    searchReady: true,
    title: "Mentor IB Support and Common Questions",
  },
  trustAndSafety: {
    breadcrumbLabel: "Trust and safety",
    description:
      "Understand how Mentor IB treats tutor profile quality, student fit, reporting paths, and public trust claims.",
    key: "trustAndSafety",
    openGraphType: "article",
    pathname: "/trust-and-safety",
    routeClass: "A",
    searchReady: true,
    title: "How Mentor IB Reviews Tutors, Safety, and Student Fit",
  },
};

export const staticPublicRoutes = Object.values(staticPublicRouteDefinitions);
