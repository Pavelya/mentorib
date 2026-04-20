import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Account",
  "Shared account-level routes for settings, notifications, privacy, and billing.",
);

type AccountLayoutProps = {
  children: ReactNode;
};

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <AppFrame
      description="Shared account shell for settings and account-adjacent operational routes."
      eyebrow="Account routes"
      navItems={navigationByFamily.account}
      title="Account-level shared surfaces"
    >
      {children}
    </AppFrame>
  );
}
