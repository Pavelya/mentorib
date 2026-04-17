import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = {
  title: {
    default: "Tutor",
    template: "%s | Mentor IB",
  },
  description: "Tutor operational routes for overview, lessons, schedule, messaging, and earnings.",
  robots: {
    index: false,
    follow: false,
  },
};

type TutorLayoutProps = {
  children: ReactNode;
};

export default function TutorLayout({ children }: TutorLayoutProps) {
  return (
    <AppFrame
      description="Tutor-mode shell for operations, schedule visibility, and continuity with students."
      eyebrow="Tutor routes"
      navItems={navigationByFamily.tutor}
      title="Tutor operations in the same ecosystem"
    >
      {children}
    </AppFrame>
  );
}
