import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Panel, getButtonClassName } from "@/components/ui";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import type { NavItem } from "@/lib/routing/navigation";
import type { ViewerIdentity } from "@/lib/identity/viewer";

import { AppFrameNav } from "./app-frame-nav";
import styles from "./app-frame.module.css";
import { AvatarMenu, DEFAULT_AVATAR_MENU_ITEMS } from "./avatar-menu";

export type AppFrameFooterLink = {
  href: Route;
  label: string;
};

type AppFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  footerLinks?: AppFrameFooterLink[];
  footerNote?: string;
  navItems?: NavItem[];
  children: ReactNode;
  showHero?: boolean;
  tone?: "public" | "private" | "minimal";
  viewer?: ViewerIdentity;
};

export function AppFrame({
  eyebrow,
  title,
  description,
  footerLinks = [],
  footerNote = "",
  navItems = [],
  children,
  showHero = true,
  tone = "private",
  viewer,
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
            <AppFrameNav ariaLabel={`${eyebrow} navigation`} items={navItems} />
          ) : null}

          {viewer ? (
            <AvatarMenu items={DEFAULT_AVATAR_MENU_ITEMS} viewer={viewer} />
          ) : (
            <Link
              className={getButtonClassName({ size: "compact", variant: "secondary" })}
              href={buildAuthSignInPath() as Route}
            >
              Sign in
            </Link>
          )}
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

      {footerNote || footerLinks.length > 0 ? (
        <footer className={styles.footer}>
          {footerNote ? <p className={styles.footerNote}>{footerNote}</p> : null}
          {footerLinks.length > 0 ? (
            <nav aria-label="Legal and policy" className={styles.footerLinks}>
              {footerLinks.map((link) => (
                <Link
                  className={styles.footerLink}
                  href={link.href}
                  key={`${link.href}-${link.label}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}
