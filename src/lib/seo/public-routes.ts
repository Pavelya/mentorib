import type { SeoRouteClass } from "@/lib/seo/route-class";

const SCAFFOLD_BLOCKER =
  "Visible content is still scaffold-only, so the route stays non-indexable until the public content task ships.";

export type StaticPublicRouteKey =
  | "home"
  | "howItWorks"
  | "trustAndSafety"
  | "support"
  | "becomeATutor";

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
      "Phase 1 scaffold for the public become-a-tutor route while the launch-ready recruitment explainer is still in progress.",
    key: "becomeATutor",
    openGraphType: "article",
    pathname: "/become-a-tutor",
    routeClass: "A",
    searchReady: false,
    searchReadyBlocker: SCAFFOLD_BLOCKER,
    title: "Become a Tutor Route Scaffold",
  },
  home: {
    description:
      "Phase 1 scaffold for the Mentor IB public home route while the launch-ready matching narrative is still in progress.",
    key: "home",
    openGraphType: "website",
    pathname: "/",
    routeClass: "A",
    searchReady: false,
    searchReadyBlocker: SCAFFOLD_BLOCKER,
    title: "Home Route Scaffold",
  },
  howItWorks: {
    breadcrumbLabel: "How it works",
    description:
      "Phase 1 scaffold for the Mentor IB how-it-works page while the full process explainer is still in progress.",
    key: "howItWorks",
    openGraphType: "article",
    pathname: "/how-it-works",
    routeClass: "A",
    searchReady: false,
    searchReadyBlocker: SCAFFOLD_BLOCKER,
    title: "How It Works Route Scaffold",
  },
  support: {
    breadcrumbLabel: "Support",
    description:
      "Phase 1 scaffold for the public support route while the launch-ready standalone help content is still in progress.",
    key: "support",
    openGraphType: "article",
    pathname: "/support",
    routeClass: "A",
    searchReady: false,
    searchReadyBlocker: SCAFFOLD_BLOCKER,
    title: "Support Route Scaffold",
  },
  trustAndSafety: {
    breadcrumbLabel: "Trust and safety",
    description:
      "Phase 1 scaffold for the Mentor IB trust-and-safety route while the launch-ready trust content is still in progress.",
    key: "trustAndSafety",
    openGraphType: "article",
    pathname: "/trust-and-safety",
    routeClass: "A",
    searchReady: false,
    searchReadyBlocker: SCAFFOLD_BLOCKER,
    title: "Trust and Safety Route Scaffold",
  },
};

export const staticPublicRoutes = Object.values(staticPublicRouteDefinitions);
