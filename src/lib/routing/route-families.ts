import type { Route } from "next";

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
};

export const routeFamilies: Record<RouteFamilyKey, RouteFamilyDefinition> = {
  public: {
    label: "Public",
    defaultHref: "/",
    description: "Marketing, discovery, and trust entry points.",
    indexed: true,
  },
  auth: {
    label: "Auth",
    defaultHref: "/auth/sign-in",
    description: "Entry, verification, and callback handling.",
    indexed: false,
  },
  setup: {
    label: "Setup",
    defaultHref: "/setup/role",
    description: "Role selection and account bootstrap routing.",
    indexed: false,
  },
  account: {
    label: "Account",
    defaultHref: "/settings",
    description: "Shared account settings, billing, and privacy surfaces.",
    indexed: false,
  },
  student: {
    label: "Student",
    defaultHref: "/match",
    description: "Student matching, booking, messages, and lesson continuity.",
    indexed: false,
  },
  tutor: {
    label: "Tutor",
    defaultHref: "/tutor/overview",
    description: "Tutor operations, schedule, messaging, and earnings.",
    indexed: false,
  },
  internal: {
    label: "Internal",
    defaultHref: "/internal",
    description: "Privileged operations, moderation, and reference-data tools.",
    indexed: false,
  },
};
