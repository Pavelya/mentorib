import type { Route } from "next";

import { SectionLanding, type SectionLandingCard } from "@/components/shell/section-landing";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";

const TRUST_CARDS: SectionLandingCard[] = [
  {
    key: "moderation",
    title: "Moderation",
    description:
      "Claim reports, action public-content takedowns, and review block-related cases.",
    href: "/internal/moderation" as Route,
  },
  {
    key: "reviews",
    title: "Review moderation",
    description:
      "Hide or redact a published tutor review that contains inappropriate content, with a required reason.",
    href: "/internal/reviews" as Route,
  },
  {
    key: "disputes",
    title: "Disputes",
    description:
      "Resolve contested lesson issues. The outcome drives the refund, payout, and reliability consequences.",
    href: "/internal/disputes" as Route,
  },
];

export default async function InternalTrustPage() {
  await requireInternalAdminAccount();

  return (
    <SectionLanding
      cards={TRUST_CARDS}
      cardsLabel="Trust & Safety tools"
      description="Reports, blocks, takedowns, review moderation, and lesson-issue disputes."
      eyebrow="Internal · Trust & Safety"
      title="Trust & Safety"
    />
  );
}
