import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { navigationByFamily } from "@/lib/routing/navigation";

export const metadata: Metadata = {
  title: {
    default: "Auth",
    template: "%s | Mentor IB",
  },
  description: "Auth entry routes for sign-in, verification, and callback handling.",
  robots: {
    index: false,
    follow: false,
  },
};

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AppFrame
      description="Minimal auth shell with non-indexable posture. Full sign-in behavior lands in P1-AUTH-001."
      eyebrow="Auth routes"
      navItems={navigationByFamily.auth}
      title="Shared entry into the product"
      tone="minimal"
    >
      {children}
    </AppFrame>
  );
}
