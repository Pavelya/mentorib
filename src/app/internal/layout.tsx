import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Internal",
  "Privileged internal routes for moderation, reference data, and operational oversight.",
);

type InternalLayoutProps = {
  children: ReactNode;
};

export default function InternalLayout({ children }: InternalLayoutProps) {
  return (
    <AppFrame
      description="Privileged internal shell kept inside the same application architecture."
      eyebrow="Internal routes"
      navItems={navigationByFamily.internal}
      title="Internal operations share the same app shell"
    >
      {children}
    </AppFrame>
  );
}
