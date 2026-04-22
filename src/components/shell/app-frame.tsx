import Link from "next/link";
import type { ReactNode } from "react";

import { Panel, TabBar } from "@/components/ui";
import type { NavItem } from "@/lib/routing/navigation";

import styles from "./app-frame.module.css";

type AppFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  footerNote?: string;
  navItems?: NavItem[];
  children: ReactNode;
  showHero?: boolean;
  tone?: "public" | "private" | "minimal";
};

export function AppFrame({
  eyebrow,
  title,
  description,
  footerNote = "Route-family scaffold for Phase 1 foundations. Feature logic lands in later tickets.",
  navItems = [],
  children,
  showHero = true,
  tone = "private",
}: AppFrameProps) {
  const frameClassName =
    tone === "minimal" ? `${styles.frame} ${styles.minimal}` : styles.frame;
  const heroTone = tone === "public" ? "warm" : tone === "minimal" ? "soft" : "raised";

  return (
    <div className={frameClassName}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandBlock}>
            <Link className={styles.brand} href="/">
              Mentor IB
            </Link>
            <p className={styles.eyebrow}>{eyebrow}</p>
          </div>

          {navItems.length > 0 ? (
            <TabBar
              ariaLabel={`${eyebrow} navigation`}
              className={styles.nav}
              items={navItems.map((item) => ({
                href: item.href,
                id: item.href,
                label: item.label,
              }))}
            />
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        {showHero ? (
          <Panel
            className={styles.heroPanel}
            description={description}
            descriptionClassName={styles.heroDescription}
            eyebrow={eyebrow}
            eyebrowClassName={styles.eyebrow}
            title={title}
            titleAs="h1"
            titleClassName={styles.heroTitle}
            tone={heroTone}
          />
        ) : null}

        <div
          className={[styles.content, showHero ? "" : styles.contentWithoutHero]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </main>

      <footer className={styles.footer}>
        {footerNote}
      </footer>
    </div>
  );
}
