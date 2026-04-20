import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Tutor",
  "Tutor operational routes for overview, lessons, schedule, messaging, and earnings.",
);

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
