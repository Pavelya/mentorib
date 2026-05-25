"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Icon, Menu, MenuItem, MenuSeparator } from "@/components/ui";
import type { NavItem } from "@/lib/routing/navigation";

import navStyles from "./app-frame-nav.module.css";
import tabBarStyles from "../ui/tab-bar.module.css";

type AppFrameNavProps = {
  ariaLabel: string;
  items: NavItem[];
};

type AnnotatedItem = NavItem & { isGroupStart: boolean };

function resolveActiveHref(items: NavItem[], pathname: string | null): string | null {
  if (!pathname) {
    return null;
  }

  let best: { href: string; length: number } | null = null;

  for (const item of items) {
    const href = item.href as string;
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      if (!best || href.length > best.length) {
        best = { href, length: href.length };
      }
    }
  }

  return best?.href ?? null;
}

function annotateGroups(items: NavItem[]): AnnotatedItem[] {
  return items.map((item, index) => {
    const previous = index > 0 ? items[index - 1] : undefined;
    const isGroupStart = Boolean(
      item.group && previous?.group && previous.group !== item.group,
    );
    return { ...item, isGroupStart };
  });
}

function itemClassName(item: AnnotatedItem, active: boolean): string {
  return [
    tabBarStyles.item,
    active ? tabBarStyles.active : "",
    item.isGroupStart ? navStyles.groupStart : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function AppFrameNav({ ariaLabel, items }: AppFrameNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const annotated = useMemo(() => annotateGroups(items), [items]);
  const activeHref = resolveActiveHref(items, pathname);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const moreContentId = useId();

  const [pinnedCount, setPinnedCount] = useState<number>(annotated.length);
  const [moreOpen, setMoreOpen] = useState(false);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) {
      return;
    }

    const containerWidth = container.clientWidth;
    if (containerWidth <= 0) {
      return;
    }

    const measureChildren = Array.from(measure.children) as HTMLElement[];
    const itemEls = measureChildren.slice(0, annotated.length);
    const moreEl = measureChildren[annotated.length];
    if (itemEls.length === 0 || !moreEl) {
      return;
    }

    const gap = parseFloat(getComputedStyle(measure).columnGap || "0") || 0;
    const itemWidths = itemEls.map((el) => el.getBoundingClientRect().width);
    const moreWidth = moreEl.getBoundingClientRect().width;

    const totalAllItems =
      itemWidths.reduce((sum, w) => sum + w, 0) +
      gap * Math.max(itemWidths.length - 1, 0);

    if (totalAllItems <= containerWidth) {
      setPinnedCount(annotated.length);
      return;
    }

    const available = containerWidth - moreWidth - gap;
    let cumulative = 0;
    let count = 0;
    for (let i = 0; i < itemWidths.length; i += 1) {
      const w = itemWidths[i];
      const next = cumulative + (count === 0 ? 0 : gap) + w;
      if (next > available) {
        break;
      }
      cumulative = next;
      count += 1;
    }
    setPinnedCount(count);
  }, [annotated.length]);

  useEffect(() => {
    recompute();
  }, [annotated, recompute]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => recompute());
    observer.observe(container);
    return () => observer.disconnect();
  }, [recompute]);

  const visibleItems = annotated.slice(0, pinnedCount);
  const overflowItems = annotated.slice(pinnedCount);
  const moreActive =
    overflowItems.length > 0 &&
    overflowItems.some((item) => (item.href as string) === activeHref);

  return (
    <div className={navStyles.row} ref={containerRef}>
      <nav aria-label={ariaLabel} className={navStyles.nav}>
        {visibleItems.map((item) => {
          const href = item.href as string;
          const active = href === activeHref;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={itemClassName(item, active)}
              href={item.href}
              key={href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div aria-hidden="true" className={navStyles.measure} ref={measureRef}>
        {annotated.map((item) => (
          <span className={itemClassName(item, false)} key={`measure-${item.href as string}`}>
            {item.label}
          </span>
        ))}
        <span className={[tabBarStyles.item, navStyles.more].filter(Boolean).join(" ")}>
          More
          <Icon name="moreHorizontal" size={16} />
        </span>
      </div>

      {overflowItems.length > 0 ? (
        <>
          <button
            aria-controls={moreOpen ? moreContentId : undefined}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className={[
              tabBarStyles.item,
              navStyles.more,
              moreActive ? tabBarStyles.active : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setMoreOpen((value) => !value)}
            ref={moreTriggerRef}
            type="button"
          >
            More
            <Icon name="moreHorizontal" size={16} />
          </button>
          <Menu
            anchorRef={moreTriggerRef}
            contentId={moreContentId}
            onOpenChange={setMoreOpen}
            open={moreOpen}
            placement="bottom-end"
          >
            {overflowItems.map((item, index) => (
              <Fragment key={item.href as string}>
                {index > 0 && item.isGroupStart ? <MenuSeparator /> : null}
                <MenuItem onSelect={() => router.push(item.href)}>
                  {item.label}
                </MenuItem>
              </Fragment>
            ))}
          </Menu>
        </>
      ) : null}
    </div>
  );
}
