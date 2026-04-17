import Link from "next/link";
import type { ReactNode } from "react";

import type { NavItem } from "@/lib/routing/navigation";

import styles from "./app-frame.module.css";

type AppFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  navItems?: NavItem[];
  children: ReactNode;
  tone?: "public" | "private" | "minimal";
};

export function AppFrame({
  eyebrow,
  title,
  description,
  navItems = [],
  children,
  tone = "private",
}: AppFrameProps) {
  const frameClassName =
    tone === "minimal" ? `${styles.frame} ${styles.minimal}` : styles.frame;

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
            <nav aria-label={`${eyebrow} navigation`} className={styles.nav}>
              {navItems.map((item) => (
                <Link className={styles.navLink} href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </section>

        <div className={styles.content}>{children}</div>
      </main>

      <footer className={styles.footer}>
        Route-family scaffold for Phase 1 foundations. Feature logic lands in later
        tickets.
      </footer>
    </div>
  );
}
