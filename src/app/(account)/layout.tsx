import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { loadViewerIdentity } from "@/lib/identity/viewer-loader";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Account",
  "Shared account-level routes for settings, notifications, privacy, and billing.",
);

type AccountLayoutProps = {
  children: ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const viewer = await loadViewerIdentity();

  return (
    <AppFrame
      description="Manage your profile, notifications, privacy, and billing in one place."
      eyebrow="Your account"
      footerNote=""
      navItems={navigationByFamily.account}
      showHero={false}
      title="Account"
      tone="minimal"
      viewer={viewer ?? undefined}
    >
      {children}
    </AppFrame>
  );
}
