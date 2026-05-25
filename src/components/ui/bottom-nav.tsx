"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Icon, type IconKey } from "./icon";
import { Menu, MenuItem } from "./menu";
import styles from "./bottom-nav.module.css";

export type BottomNavItem = {
  href: Route;
  label: string;
  iconKey: IconKey;
};

export type BottomNavOverflowItem = {
  href: Route;
  label: string;
  iconKey?: IconKey;
};

export type BottomNavProps = {
  "aria-label": string;
  items: BottomNavItem[];
  overflowItems?: BottomNavOverflowItem[];
  moreLabel?: string;
  moreIconKey?: IconKey;
};

function resolveActiveHref(hrefs: string[], pathname: string | null): string | null {
  if (!pathname) return null;
  let best: { href: string; length: number } | null = null;
  for (const href of hrefs) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      if (!best || href.length > best.length) {
        best = { href, length: href.length };
      }
    }
  }
  return best?.href ?? null;
}

export function BottomNav({
  "aria-label": ariaLabel,
  items,
  overflowItems,
  moreLabel = "More",
  moreIconKey = "moreHorizontal",
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const moreContentId = useId();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      if (currentY < 80) {
        setHidden(false);
      } else if (delta > 6) {
        setHidden(true);
      } else if (delta < -6) {
        setHidden(false);
      }

      lastY = currentY;
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const collapsed = hidden && !moreOpen;

  const allHrefs: string[] = [
    ...items.map((item) => item.href as string),
    ...(overflowItems?.map((item) => item.href as string) ?? []),
  ];
  const activeHref = resolveActiveHref(allHrefs, pathname);
  const moreActive = Boolean(
    overflowItems?.some((item) => (item.href as string) === activeHref),
  );

  const hasOverflow = (overflowItems?.length ?? 0) > 0;

  return (
    <nav
      aria-label={ariaLabel}
      className={[styles.nav, collapsed ? styles.collapsed : ""]
        .filter(Boolean)
        .join(" ")}
      data-collapsed={collapsed ? "true" : undefined}
    >
      {items.map((item) => {
        const href = item.href as string;
        const active = href === activeHref;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={[styles.slot, active ? styles.active : ""]
              .filter(Boolean)
              .join(" ")}
            href={item.href}
            key={href}
          >
            <span className={styles.iconWrap}>
              <Icon name={item.iconKey} size={20} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}

      {hasOverflow ? (
        <>
          <button
            aria-controls={moreOpen ? moreContentId : undefined}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={[styles.slot, moreActive ? styles.active : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setMoreOpen((value) => !value)}
            ref={moreTriggerRef}
            type="button"
          >
            <span className={styles.iconWrap}>
              <Icon name={moreIconKey} size={20} />
            </span>
            <span className={styles.label}>{moreLabel}</span>
          </button>
          <Menu
            anchorRef={moreTriggerRef}
            contentId={moreContentId}
            onOpenChange={setMoreOpen}
            open={moreOpen}
            placement="top-end"
          >
            {overflowItems!.map((item) => (
              <MenuItem
                icon={item.iconKey}
                key={item.href as string}
                onSelect={() => router.push(item.href)}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}
    </nav>
  );
}
