import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Setup",
  "Bootstrap routes for role resolution and post-auth account setup.",
);

type SetupLayoutProps = {
  children: ReactNode;
};

export default function SetupLayout({ children }: SetupLayoutProps) {
  return (
    <AppFrame
      description="Short bootstrap shell for role selection and authenticated account routing."
      eyebrow="Setup routes"
      navItems={navigationByFamily.setup}
      title="Resolve the role context"
      tone="minimal"
    >
      {children}
    </AppFrame>
  );
}
