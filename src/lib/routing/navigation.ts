import type { Route } from "next";

import type { RouteFamilyKey } from "@/lib/routing/route-families";

export type NavItem = {
  href: Route;
  label: string;
};

export const navigationByFamily: Record<RouteFamilyKey, NavItem[]> = {
  public: [
    { href: "/", label: "Home" },
    { href: "/match", label: "Get Matched" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/trust-and-safety", label: "Trust & Safety" },
    { href: "/become-a-tutor", label: "Become a Tutor" },
    { href: "/support", label: "Support" },
  ],
  auth: [
    { href: "/auth/sign-in", label: "Sign In" },
    { href: "/auth/verify", label: "Verify" },
  ],
  setup: [{ href: "/setup/role", label: "Role Setup" }],
  account: [
    { href: "/settings", label: "Settings" },
    { href: "/notifications", label: "Notifications" },
    { href: "/privacy", label: "Privacy" },
    { href: "/billing", label: "Billing" },
  ],
  student: [
    { href: "/match", label: "Match" },
    { href: "/results", label: "Results" },
    { href: "/compare", label: "Compare" },
    { href: "/messages", label: "Messages" },
    { href: "/lessons", label: "Lessons" },
  ],
  tutor: [
    { href: "/tutor/overview", label: "Overview" },
    { href: "/tutor/lessons", label: "Lessons" },
    { href: "/tutor/schedule", label: "Schedule" },
    { href: "/tutor/messages", label: "Messages" },
    { href: "/tutor/earnings", label: "Earnings" },
  ],
  internal: [
    { href: "/internal", label: "Internal Home" },
    { href: "/internal/tutor-reviews", label: "Tutor Reviews" },
    { href: "/internal/moderation", label: "Moderation" },
    { href: "/internal/reference-data", label: "Reference Data" },
  ],
};
