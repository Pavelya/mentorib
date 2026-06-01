import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { resolveViewerIdentity } from "@/lib/identity/viewer";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Internal",
  "Privileged internal routes for moderation, reference data, and operational oversight.",
);

type InternalLayoutProps = {
  children: ReactNode;
};

export default async function InternalLayout({ children }: InternalLayoutProps) {
  const account = await requireInternalAdminAccount();
  const viewer = resolveViewerIdentity(account);

  return (
    <AppFrame
      description="Privileged internal shell kept inside the same application architecture."
      navItems={navigationByFamily.internal.items}
      showHero={false}
      title="Internal operations"
      viewer={viewer}
    >
      {children}
    </AppFrame>
  );
}
