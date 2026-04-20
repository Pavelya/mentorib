import type { Route } from "next";

import { seoRouteFamilyPolicies } from "@/lib/seo/route-class";

export type RouteFamilyKey =
  | "public"
  | "auth"
  | "setup"
  | "account"
  | "student"
  | "tutor"
  | "internal";

export type RouteFamilyDefinition = {
  label: string;
  defaultHref: Route;
  description: string;
  indexed: boolean;
  routeClass: (typeof seoRouteFamilyPolicies)[RouteFamilyKey]["routeClass"];
};

export const routeFamilies: Record<RouteFamilyKey, RouteFamilyDefinition> = {
  public: {
    label: "Public",
    defaultHref: "/",
    description: "Marketing, discovery, and trust entry points.",
    indexed: seoRouteFamilyPolicies.public.routeClass === "A",
    routeClass: seoRouteFamilyPolicies.public.routeClass,
  },
  auth: {
    label: "Auth",
    defaultHref: "/auth/sign-in",
    description: "Entry, verification, and callback handling.",
    indexed: seoRouteFamilyPolicies.auth.routeClass === "A",
    routeClass: seoRouteFamilyPolicies.auth.routeClass,
  },
  setup: {
    label: "Setup",
    defaultHref: "/setup/role",
    description: "Role selection and account bootstrap routing.",
    indexed: seoRouteFamilyPolicies.setup.routeClass === "A",
    routeClass: seoRouteFamilyPolicies.setup.routeClass,
  },
  account: {
    label: "Account",
    defaultHref: "/settings",
    description: "Shared account settings, billing, and privacy surfaces.",
    indexed: seoRouteFamilyPolicies.account.routeClass === "A",
    routeClass: seoRouteFamilyPolicies.account.routeClass,
  },
  student: {
    label: "Student",
    defaultHref: "/match",
    description: "Student matching, booking, messages, and lesson continuity.",
    indexed: seoRouteFamilyPolicies.student.routeClass === "A",
    routeClass: seoRouteFamilyPolicies.student.routeClass,
  },
  tutor: {
    label: "Tutor",
    defaultHref: "/tutor/overview",
    description: "Tutor operations, schedule, messaging, and earnings.",
    indexed: seoRouteFamilyPolicies.tutor.routeClass === "A",
    routeClass: seoRouteFamilyPolicies.tutor.routeClass,
  },
  internal: {
    label: "Internal",
    defaultHref: "/internal",
    description: "Privileged operations, moderation, and reference-data tools.",
    indexed: seoRouteFamilyPolicies.internal.routeClass === "A",
    routeClass: seoRouteFamilyPolicies.internal.routeClass,
  },
};
