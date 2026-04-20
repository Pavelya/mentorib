import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import styles from "./tab-bar.module.css";

type LinkHref = ComponentProps<typeof Link>["href"];

type LinkTabItem = {
  disabled?: boolean;
  href: LinkHref;
  id: string;
  label: ReactNode;
};

type ButtonTabItem = {
  disabled?: boolean;
  id: string;
  label: ReactNode;
  panelId: string;
};

type TabBarProps = {
  activeId?: string;
  ariaLabel: string;
  className?: string;
  items: Array<ButtonTabItem | LinkTabItem>;
  onChange?: (id: string) => void;
};

function isLinkItem(item: ButtonTabItem | LinkTabItem): item is LinkTabItem {
  return "href" in item;
}

export function TabBar({ activeId, ariaLabel, className, items, onChange }: TabBarProps) {
  const hasLinks = items.some(isLinkItem);

  if (hasLinks) {
    return (
      <nav aria-label={ariaLabel} className={[styles.tabBar, className].filter(Boolean).join(" ")}>
        {items.map((item) => {
          const active = item.id === activeId;

          if (!isLinkItem(item)) {
            return null;
          }

          if (item.disabled) {
            return (
              <span
                aria-disabled="true"
                className={[styles.item, styles.disabled].join(" ")}
                key={item.id}
              >
                {item.label}
              </span>
            );
          }

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={[styles.item, active ? styles.active : ""].filter(Boolean).join(" ")}
              href={item.href}
              key={item.id}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      className={[styles.tabList, className].filter(Boolean).join(" ")}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === activeId;

        if (isLinkItem(item)) {
          return null;
        }

        return (
          <button
            aria-controls={item.panelId}
            aria-selected={active}
            className={[
              styles.item,
              active ? styles.active : "",
              item.disabled ? styles.disabled : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={item.disabled}
            id={`${item.panelId}-tab`}
            key={item.id}
            onClick={() => onChange?.(item.id)}
            role="tab"
            tabIndex={active ? 0 : -1}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
