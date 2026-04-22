import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

import { Panel, StatusBadge, getButtonClassName } from "@/components/ui";

import styles from "./app-frame.module.css";

type PlaceholderLink = {
  href: Route;
  label: string;
  tone?: "solid" | "ghost";
};

type RoutePlaceholderProps = {
  children?: ReactNode;
  description: string;
  links?: PlaceholderLink[];
  notes?: string[];
  phase: string;
  routePath: string;
  title: string;
  titleAs?: "h1" | "h2" | "h3" | "p";
};

export function RoutePlaceholder({
  children,
  routePath,
  phase,
  title,
  description,
  notes = [],
  links = [],
  titleAs = "h2",
}: RoutePlaceholderProps) {
  return (
    <Panel description={description} eyebrow={routePath} title={title} titleAs={titleAs}>
      <div className={styles.placeholderMeta}>
        <StatusBadge tone="info">{phase}</StatusBadge>
        <StatusBadge tone="trust">Skeleton only</StatusBadge>
      </div>

      {notes.length > 0 ? (
        <ul className={styles.placeholderList}>
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {links.length > 0 ? (
        <div className={styles.linkGrid}>
          {links.map((link) => (
            <Link
              className={getButtonClassName({
                variant: link.tone === "ghost" ? "secondary" : "primary",
              })}
              href={link.href}
              key={`${link.href}-${link.label}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}

      {children ? <div className={styles.placeholderChildren}>{children}</div> : null}
    </Panel>
  );
}
