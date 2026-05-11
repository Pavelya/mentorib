import type { Route } from "next";
import Link from "next/link";

import { formatUtcDate } from "@/lib/datetime/format";
import type { LegalDocumentContent } from "@/modules/legal/content";

import styles from "./legal-document-page.module.css";

type LegalRelatedLink = {
  href: Route;
  label: string;
};

type LegalDocumentPageProps = {
  content: LegalDocumentContent;
  eyebrow: string;
  intro?: string;
  relatedLinks?: LegalRelatedLink[];
  relatedLinksLabel?: string;
  title: string;
};

export function LegalDocumentPage({
  content,
  eyebrow,
  intro,
  relatedLinks = [],
  relatedLinksLabel = "Related pages",
  title,
}: LegalDocumentPageProps) {
  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.intro}>{intro ?? content.intro}</p>
        <p className={styles.effectiveLine}>
          Effective {formatUtcDate(content.effectiveDate)}
        </p>
      </header>

      {content.summary.length > 0 ? (
        <section className={styles.summary} aria-label="Plain-language summary">
          <p className={styles.sectionEyebrow}>At a glance</p>
          <ul className={styles.summaryList}>
            {content.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className={styles.body}>
        {content.sections.map((section) => (
          <section className={styles.section} id={section.id} key={section.id}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
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

      {relatedLinks.length > 0 ? (
        <aside aria-label={relatedLinksLabel} className={styles.relatedLinks}>
          <p>{relatedLinksLabel}:</p>
          {relatedLinks.map((link) => (
            <Link href={link.href} key={`${link.href}-${link.label}`}>
              {link.label}
            </Link>
          ))}
        </aside>
      ) : null}
    </article>
  );
}
