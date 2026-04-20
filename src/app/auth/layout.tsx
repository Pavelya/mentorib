import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildNonIndexableSectionMetadata } from "@/lib/seo/metadata/defaults";

import styles from "./auth-shell.module.css";

export const metadata: Metadata = buildNonIndexableSectionMetadata(
  "Auth",
  "Auth entry routes for sign-in, verification, and callback handling.",
);

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
