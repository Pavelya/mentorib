import type { Route } from "next";
import Link from "next/link";

import styles from "./app-frame.module.css";

type PlaceholderLink = {
  href: Route;
  label: string;
  tone?: "solid" | "ghost";
};

type RoutePlaceholderProps = {
  routePath: string;
  phase: string;
  title: string;
  description: string;
  notes?: string[];
  links?: PlaceholderLink[];
};

export function RoutePlaceholder({
  routePath,
  phase,
  title,
  description,
  notes = [],
  links = [],
}: RoutePlaceholderProps) {
  return (
    <section className={styles.placeholder}>
      <div className={styles.placeholderMeta}>
        <span className={styles.chip}>{routePath}</span>
        <span className={styles.chip}>{phase}</span>
        <span className={styles.chip}>Skeleton only</span>
      </div>

      <div>
        <h2 className={styles.placeholderTitle}>{title}</h2>
        <p className={styles.placeholderText}>{description}</p>
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
              className={
                link.tone === "ghost" ? styles.ghostLink : styles.actionLink
              }
              href={link.href}
              key={`${link.href}-${link.label}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
