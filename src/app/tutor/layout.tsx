import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { loadViewerIdentity } from "@/lib/identity/viewer-loader";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Tutor",
  "Tutor operational routes for overview, lessons, schedule, messaging, and earnings.",
);

type TutorLayoutProps = {
  children: ReactNode;
};

export default async function TutorLayout({ children }: TutorLayoutProps) {
  const viewer = await loadViewerIdentity();

  return (
    <AppFrame
      description="Tutor-mode operational routes."
      bottomNavAriaLabel="Tutor primary navigation"
      bottomNavItems={navigationByFamily.tutor.bottomNav}
      bottomNavOverflowItems={navigationByFamily.tutor.bottomNavOverflow}
      navItems={navigationByFamily.tutor.items}
      showHero={false}
      title="Tutor"
      viewer={viewer ?? undefined}
    >
      {children}
    </AppFrame>
  );
}
