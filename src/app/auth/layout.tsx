import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FocusedFlowShell } from "@/components/shell/focused-flow-shell";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Auth",
  "Auth entry routes for sign-in, verification, and callback handling.",
);

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <FocusedFlowShell>{children}</FocusedFlowShell>;
}
