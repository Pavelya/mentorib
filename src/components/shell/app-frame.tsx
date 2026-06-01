import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { PendingPolicyAcknowledgement } from "@/components/account/pending-policy-acknowledgement";
import { BottomNav, type BottomNavItem, Panel, getButtonClassName } from "@/components/ui";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import type { NavItem } from "@/lib/routing/navigation";
import type { ViewerIdentity } from "@/lib/identity/viewer";

import { AppFrameNav } from "./app-frame-nav";
import styles from "./app-frame.module.css";
import { AvatarMenu, DEFAULT_AVATAR_MENU_ITEMS } from "./avatar-menu";
import { PublicMobileMenu } from "./public-mobile-menu";

export type AppFrameFooterLink = {
  href: Route;
  label: string;
};

export type AppFrameMobileDrawer = {
  navItems: NavItem[];
  workspaceShortcut?: { href: Route; label: string };
};

type AppFrameProps = {
  eyebrow?: string;
  title: string;
  description: string;
  footerLinks?: AppFrameFooterLink[];
  footerNote?: string;
  navItems?: NavItem[];
  bottomNavItems?: BottomNavItem[];
  bottomNavOverflowItems?: NavItem[];
  bottomNavAriaLabel?: string;
  mobileDrawer?: AppFrameMobileDrawer;
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
  bottomNavItems,
  bottomNavOverflowItems,
  bottomNavAriaLabel,
  mobileDrawer,
  children,
  showHero = true,
  tone = "private",
  viewer,
}: AppFrameProps) {
  const hasBottomNav = (bottomNavItems?.length ?? 0) > 0;
  const hasMobileDrawer = Boolean(mobileDrawer);
  const frameClassName = [
    styles.frame,
    tone === "minimal" ? styles.minimal : "",
    hasBottomNav ? styles.frameWithBottomNav : "",
  ]
    .filter(Boolean)
    .join(" ");
  const heroTone = tone === "public" ? "warm" : tone === "minimal" ? "soft" : "raised";
  const desktopNavClassName = [
    styles.desktopNav,
    hasBottomNav || hasMobileDrawer ? styles.hideOnMobile : "",
  ]
    .filter(Boolean)
    .join(" ");
  const overflowNavItems: NavItem[] | undefined =
    bottomNavOverflowItems && bottomNavOverflowItems.length > 0
      ? bottomNavOverflowItems
      : undefined;

  return (
    <div className={frameClassName}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {mobileDrawer ? (
            <div className={styles.leadingSlot}>
              <PublicMobileMenu
                navItems={mobileDrawer.navItems}
                signInHref={viewer ? undefined : (buildAuthSignInPath() as Route)}
                workspaceShortcut={
                  viewer ? mobileDrawer.workspaceShortcut : undefined
                }
              />
            </div>
          ) : null}

          <div className={[styles.brandBlock, styles.brandSlot].join(" ")}>
            <Link className={styles.brand} href="/">
              Mentor IB
            </Link>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          </div>

          {navItems.length > 0 ? (
            <div className={desktopNavClassName}>
              <AppFrameNav
                ariaLabel={eyebrow ? `${eyebrow} navigation` : "Primary navigation"}
                items={navItems}
              />
            </div>
          ) : null}

          <div className={styles.trailingSlot}>
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
        </div>
      </header>

      <main className={styles.main}>
        {viewer ? <PendingPolicyAcknowledgement /> : null}

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

      {hasBottomNav ? (
        <BottomNav
          aria-label={bottomNavAriaLabel ?? "Primary navigation"}
          items={bottomNavItems!}
          overflowItems={
            overflowNavItems
              ? overflowNavItems.map((item) => ({ href: item.href, label: item.label }))
              : undefined
          }
        />
      ) : null}

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
