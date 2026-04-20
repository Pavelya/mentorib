import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Student",
  "Student workflow routes for matching, booking, lessons, and messages.",
);

type StudentLayoutProps = {
  children: ReactNode;
};

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <AppFrame
      description="Student-mode shell for the problem-led match flow, booking path, and continuity surfaces."
      eyebrow="Student routes"
      navItems={navigationByFamily.student}
      title="Student workflow inside the shared product"
    >
      {children}
    </AppFrame>
  );
}
