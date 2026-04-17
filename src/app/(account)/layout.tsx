import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = {
  title: {
    default: "Account",
    template: "%s | Mentor IB",
  },
  description: "Shared account-level routes for settings, notifications, privacy, and billing.",
  robots: {
    index: false,
    follow: false,
  },
};

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
