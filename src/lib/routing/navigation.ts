import type { Route } from "next";

import type { RouteFamilyKey } from "@/lib/routing/route-families";

export type NavItem = {
  href: Route;
  label: string;
  group?: string;
};

export const navigationByFamily: Record<RouteFamilyKey, NavItem[]> = {
  public: [
    { href: "/", label: "Home" },
    { href: "/tutors" as Route, label: "Find Tutors" },
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
    { href: "/match", label: "Match", group: "Find" },
    { href: "/results", label: "Results", group: "Find" },
    { href: "/tutors" as Route, label: "Browse", group: "Find" },
    { href: "/saved", label: "Saved", group: "Decide" },
    { href: "/compare", label: "Compare", group: "Decide" },
    { href: "/lessons", label: "Lessons", group: "Use" },
    { href: "/messages", label: "Messages", group: "Use" },
  ],
  tutor: [
    { href: "/tutor/overview", label: "Overview", group: "Workspace" },
    { href: "/tutor/lessons", label: "Lessons", group: "Workspace" },
    { href: "/tutor/schedule", label: "Schedule", group: "Workspace" },
    { href: "/tutor/messages", label: "Messages", group: "Workspace" },
    { href: "/tutor/profile" as Route, label: "Profile", group: "Profile" },
    { href: "/tutor/profile/credentials" as Route, label: "Credentials", group: "Profile" },
    { href: "/tutor/profile/photo" as Route, label: "Photo", group: "Profile" },
    { href: "/tutor/profile/video" as Route, label: "Video", group: "Profile" },
    { href: "/tutor/earnings", label: "Earnings", group: "Money" },
  ],
  internal: [
    { href: "/internal", label: "Internal Home" },
    { href: "/internal/tutor-reviews", label: "Tutor Reviews" },
    { href: "/internal/moderation", label: "Moderation" },
    { href: "/internal/reference-data", label: "Reference Data" },
  ],
};
