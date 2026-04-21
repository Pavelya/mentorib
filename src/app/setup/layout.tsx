import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FocusedFlowShell } from "@/components/shell/focused-flow-shell";
import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Setup",
  "Bootstrap routes for role resolution and post-auth account setup.",
);

type SetupLayoutProps = {
  children: ReactNode;
};

export default function SetupLayout({ children }: SetupLayoutProps) {
  return <FocusedFlowShell width="wide">{children}</FocusedFlowShell>;
}
