import Link from "next/link";
import type { Route } from "next";

import { Card, PageHeader, StatusBadge } from "@/components/ui";

import styles from "./section-landing.module.css";

type SectionLandingCardStatus = {
  label: string;
  tone?: "positive" | "warning" | "destructive" | "trust" | "info";
};

export type SectionLandingCard = {
  key: string;
  title: string;
  description: string;
  /** Omit when the leaf surface is not built yet; the card renders as a non-interactive "planned" tile. */
  href?: Route;
  status?: SectionLandingCardStatus;
};

type SectionLandingProps = {
  eyebrow: string;
  title: string;
  description: string;
  cards: SectionLandingCard[];
  /** Accessible name for the card list (e.g. "People tools"). */
  cardsLabel: string;
};

/**
 * Capability-group landing page for the internal admin shell: a `PageHeader`
 * over a card list that reveals the group's leaf surfaces (capability-map §3).
 * A card with an `href` is a link to a built surface; a card without one is a
 * planned leaf that a later task will wire up.
 */
export function SectionLanding({
  cards,
  cardsLabel,
  description,
  eyebrow,
  title,
}: SectionLandingProps) {
  return (
    <article className={styles.page}>
      <PageHeader description={description} eyebrow={eyebrow} title={title} />
      <ul aria-label={cardsLabel} className={styles.grid}>
        {cards.map((card) => (
          <li key={card.key}>
            <SectionCard card={card} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function SectionCard({ card }: { card: SectionLandingCard }) {
  const body = (
    <Card
      className={card.href ? undefined : styles.plannedCard}
      variant={card.href ? "select" : "static"}
    >
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{card.title}</h2>
        {card.status ? (
          <StatusBadge tone={card.status.tone ?? "info"}>{card.status.label}</StatusBadge>
        ) : null}
      </div>
      <p className={styles.cardDescription}>{card.description}</p>
    </Card>
  );

  if (!card.href) {
    return body;
  }

  return (
    <Link className={styles.cardLink} href={card.href} prefetch={false}>
      {body}
    </Link>
  );
}
