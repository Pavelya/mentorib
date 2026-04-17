import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = {
  title: {
    default: "Mentor IB",
    template: "%s | Mentor IB",
  },
  description:
    "Public marketing and discovery routes for the matching-first Mentor IB product.",
};

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AppFrame
      description="Shared public chrome for discovery, trust framing, and the problem-first entry into the product."
      eyebrow="Public routes"
      navItems={navigationByFamily.public}
      title="One ecosystem. Match-first guidance."
      tone="public"
    >
      {children}
    </AppFrame>
  );
}
