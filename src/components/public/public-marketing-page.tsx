import type { Route } from "next";
import Link from "next/link";

import { StatusBadge, getButtonClassName } from "@/components/ui";

import styles from "./public-marketing-page.module.css";

type PublicMarketingAction = {
  href: Route;
  label: string;
  variant?: "primary" | "secondary";
};

type PublicMarketingSection = {
  body: string;
  eyebrow: string;
  items?: string[];
  title: string;
};

type PublicMarketingPageProps = {
  actions: PublicMarketingAction[];
  eyebrow: string;
  finalAction: PublicMarketingAction;
  finalBody: string;
  finalTitle: string;
  intro: string;
  sections: PublicMarketingSection[];
  signals: string[];
  title: string;
};

export function PublicMarketingPage({
  actions,
  eyebrow,
  finalAction,
  finalBody,
  finalTitle,
  intro,
  sections,
  signals,
  title,
}: PublicMarketingPageProps) {
  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.intro}>{intro}</p>

          <div className={styles.actions}>
            {actions.map((action) => (
              <Link
                className={getButtonClassName({
                  variant: action.variant === "secondary" ? "secondary" : "primary",
                })}
                href={action.href}
                key={`${action.href}-${action.label}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <aside aria-label={`${title} highlights`} className={styles.signalPanel}>
          <p className={styles.signalTitle}>What this page covers</p>
          <div className={styles.signalList}>
            {signals.map((signal) => (
              <StatusBadge key={signal} tone="trust">
                {signal}
              </StatusBadge>
            ))}
          </div>
        </aside>
      </header>

      <div className={styles.sectionGrid}>
        {sections.map((section) => (
          <section className={styles.section} key={section.title}>
            <p className={styles.sectionEyebrow}>{section.eyebrow}</p>
            <h2>{section.title}</h2>
            <p>{section.body}</p>

            {section.items ? (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <section className={styles.finalCta}>
        <div>
          <h2>{finalTitle}</h2>
          <p>{finalBody}</p>
        </div>
        <Link
          className={getButtonClassName({
            className: styles.finalAction,
            variant: finalAction.variant === "secondary" ? "secondary" : "primary",
          })}
          href={finalAction.href}
        >
          {finalAction.label}
        </Link>
      </section>
    </article>
  );
}
