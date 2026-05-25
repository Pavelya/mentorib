import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { loadAccountDockFamily } from "@/lib/identity/account-dock";
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
  const [viewer, dockFamily] = await Promise.all([
    loadViewerIdentity(),
    loadAccountDockFamily(),
  ]);
  const dockNav = dockFamily ? navigationByFamily[dockFamily] : undefined;

  return (
    <AppFrame
      bottomNavAriaLabel={
        dockFamily === "tutor"
          ? "Tutor primary navigation"
          : "Student primary navigation"
      }
      bottomNavItems={dockNav?.bottomNav}
      bottomNavOverflowItems={dockNav?.bottomNavOverflow}
      description="Manage your profile, notifications, privacy, and billing in one place."
      eyebrow="Your account"
      footerNote=""
      navItems={navigationByFamily.account.items}
      showHero={false}
      title="Account"
      tone="minimal"
      viewer={viewer ?? undefined}
    >
      {children}
    </AppFrame>
  );
}
