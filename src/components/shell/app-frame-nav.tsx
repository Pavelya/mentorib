"use client";

import { usePathname } from "next/navigation";

import { TabBar } from "@/components/ui";
import type { NavItem } from "@/lib/routing/navigation";

import styles from "./app-frame.module.css";

type AppFrameNavProps = {
  ariaLabel: string;
  items: NavItem[];
};

function resolveActiveHref(items: NavItem[], pathname: string | null): string | null {
  if (!pathname) {
    return null;
  }

  let best: { href: string; length: number } | null = null;

  for (const item of items) {
    const href = item.href as string;
    if (pathname === href) {
      if (!best || href.length > best.length) {
        best = { href, length: href.length };
      }
      continue;
    }
    if (pathname.startsWith(`${href}/`)) {
      if (!best || href.length > best.length) {
        best = { href, length: href.length };
      }
    }
  }

  return best?.href ?? null;
}

export function AppFrameNav({ ariaLabel, items }: AppFrameNavProps) {
  const pathname = usePathname();
  const activeHref = resolveActiveHref(items, pathname);
  const hasGroups = items.some((item) => item.group);

  if (!hasGroups) {
    return (
      <TabBar
        activeId={activeHref ?? undefined}
        ariaLabel={ariaLabel}
        className={styles.nav}
        items={items.map((item) => ({
          href: item.href,
          id: item.href as string,
          label: item.label,
        }))}
      />
    );
  }

  const groups: Array<{ label: string; items: NavItem[] }> = [];
  for (const item of items) {
    const label = item.group ?? "";
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <div className={styles.navGroups}>
      {groups.map((group) => (
        <div className={styles.navGroup} key={group.label}>
          <TabBar
            activeId={activeHref ?? undefined}
            ariaLabel={`${ariaLabel} — ${group.label}`}
            items={group.items.map((item) => ({
              href: item.href,
              id: item.href as string,
              label: item.label,
            }))}
          />
        </div>
      ))}
    </div>
  );
}
