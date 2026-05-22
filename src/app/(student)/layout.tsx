import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { loadViewerIdentity } from "@/lib/identity/viewer-loader";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Student",
  "Student workflow routes for matching, booking, lessons, and messages.",
);

type StudentLayoutProps = {
  children: ReactNode;
};

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const viewer = await loadViewerIdentity();

  return (
    <AppFrame
      description="Student-mode shell for the problem-led match flow, booking path, and continuity surfaces."
      eyebrow="Student routes"
      footerNote=""
      navItems={navigationByFamily.student}
      showHero={false}
      title="Student workflow inside the shared product"
      viewer={viewer ?? undefined}
    >
      {children}
    </AppFrame>
  );
}
