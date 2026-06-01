import type { Route } from "next";

import type { BottomNavItem } from "@/components/ui/bottom-nav";
import type { RouteFamilyKey } from "@/lib/routing/route-families";

export type NavItem = {
  href: Route;
  label: string;
  group?: string;
};

export type FamilyNavigation = {
  items: NavItem[];
  bottomNav?: BottomNavItem[];
  bottomNavOverflow?: NavItem[];
};

export const navigationByFamily: Record<RouteFamilyKey, FamilyNavigation> = {
  public: {
    items: [
      { href: "/", label: "Home" },
      { href: "/tutors" as Route, label: "Find Tutors" },
      { href: "/match", label: "Get Matched" },
      { href: "/become-a-tutor", label: "Become a Tutor" },
    ],
  },
  auth: {
    items: [
      { href: "/auth/sign-in", label: "Sign In" },
      { href: "/auth/verify", label: "Verify" },
    ],
  },
  setup: {
    items: [{ href: "/setup/role", label: "Role Setup" }],
  },
  account: {
    items: [
      { href: "/settings", label: "Settings" },
      { href: "/notifications", label: "Notifications" },
      { href: "/privacy", label: "Privacy" },
      { href: "/billing", label: "Billing" },
    ],
  },
  student: {
    items: [
      { href: "/match", label: "Get Matched", group: "Find" },
      { href: "/results", label: "My matches", group: "Find" },
      { href: "/tutors" as Route, label: "Find Tutors", group: "Find" },
      { href: "/saved", label: "Saved", group: "Decide" },
      { href: "/compare", label: "Compare", group: "Decide" },
      { href: "/lessons", label: "Lessons", group: "Use" },
      { href: "/messages", label: "Messages", group: "Use" },
    ],
    bottomNav: [
      { href: "/match", label: "Match", iconKey: "studentRole" },
      { href: "/results", label: "Matches", iconKey: "users" },
      { href: "/lessons", label: "Lessons", iconKey: "calendar" },
      { href: "/messages", label: "Messages", iconKey: "messageSquare" },
    ],
    bottomNavOverflow: [
      { href: "/tutors" as Route, label: "Find Tutors" },
      { href: "/saved", label: "Saved" },
      { href: "/compare", label: "Compare" },
    ],
  },
  tutor: {
    items: [
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
    bottomNav: [
      { href: "/tutor/overview", label: "Overview", iconKey: "tutorRole" },
      { href: "/tutor/lessons", label: "Lessons", iconKey: "calendar" },
      { href: "/tutor/schedule", label: "Schedule", iconKey: "clock" },
      { href: "/tutor/messages", label: "Messages", iconKey: "messageSquare" },
    ],
    bottomNavOverflow: [
      { href: "/tutor/profile" as Route, label: "Profile" },
      { href: "/tutor/profile/credentials" as Route, label: "Credentials" },
      { href: "/tutor/profile/photo" as Route, label: "Photo" },
      { href: "/tutor/profile/video" as Route, label: "Video" },
      { href: "/tutor/earnings", label: "Earnings" },
    ],
  },
  internal: {
    // Two-level header (capability-map §3): the header carries the 7 capability
    // groups, each pointing at its section landing route. Multi-leaf groups land
    // on a card-list section page; single-leaf groups (Applications, Support)
    // point straight at their leaf. Leaves are reached from the section page.
    items: [
      { href: "/internal", label: "Overview" },
      { href: "/internal/people" as Route, label: "People" },
      { href: "/internal/tutor-reviews", label: "Applications" },
      { href: "/internal/trust" as Route, label: "Trust & Safety" },
      { href: "/internal/support" as Route, label: "Support" },
      { href: "/internal/finance" as Route, label: "Finance" },
      { href: "/internal/configuration" as Route, label: "Configuration" },
    ],
  },
};
