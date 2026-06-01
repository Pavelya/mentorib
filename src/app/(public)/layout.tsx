import type { Metadata, Route } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import {
  loadPublicWorkspaceShortcut,
  loadViewerIdentity,
} from "@/lib/identity/viewer-loader";
import { buildPublicLayoutMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildPublicLayoutMetadata();

type PublicLayoutProps = {
  children: ReactNode;
};

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const [viewer, workspaceShortcut] = await Promise.all([
    loadViewerIdentity(),
    loadPublicWorkspaceShortcut(),
  ]);

  return (
    <AppFrame
      description="Shared public chrome for discovery, trust framing, and the problem-first entry into the product."
      eyebrow="IB tutor matching"
      footerLinks={[
        { href: "/how-it-works", label: "How It Works" },
        { href: "/trust-and-safety", label: "Trust & Safety" },
        { href: "/support", label: "Support" },
        { href: "/contact" as Route, label: "Contact" },
        { href: "/privacy-policy", label: "Privacy policy" },
        { href: "/terms", label: "Terms" },
      ]}
      footerNote="Mentor IB helps students and parents move from a specific IB need to a tutor who fits."
      mobileDrawer={{
        navItems: navigationByFamily.public.items,
        workspaceShortcut: workspaceShortcut ?? undefined,
      }}
      navItems={navigationByFamily.public.items}
      showHero={false}
      title="One ecosystem. Match-first guidance."
      tone="public"
      viewer={viewer ?? undefined}
    >
      {children}
    </AppFrame>
  );
}
