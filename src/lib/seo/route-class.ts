export type SeoRouteClass = "A" | "B" | "C";

export type SeoRouteFamilyKey =
  | "public"
  | "auth"
  | "setup"
  | "account"
  | "student"
  | "tutor"
  | "internal";

export type SeoRouteFamilyPolicy = {
  description: string;
  routeClass: SeoRouteClass;
};

export const seoRouteFamilyPolicies: Record<SeoRouteFamilyKey, SeoRouteFamilyPolicy> = {
  account: {
    description: "Authenticated account routes stay operational and non-indexable.",
    routeClass: "C",
  },
  auth: {
    description: "Public auth entry points remain non-indexable.",
    routeClass: "B",
  },
  internal: {
    description: "Internal routes are privileged operational surfaces.",
    routeClass: "C",
  },
  public: {
    description: "Public discovery routes are the only routes eligible for indexation.",
    routeClass: "A",
  },
  setup: {
    description: "Authenticated setup routes remain operational and non-indexable.",
    routeClass: "C",
  },
  student: {
    description: "Student workflow routes remain operational and non-indexable.",
    routeClass: "C",
  },
  tutor: {
    description: "Tutor workflow routes remain operational and non-indexable.",
    routeClass: "C",
  },
};
