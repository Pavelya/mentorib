import { SectionLanding, type SectionLandingCard } from "@/components/shell/section-landing";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";

const FINANCE_CARDS: SectionLandingCard[] = [
  {
    key: "platform-finance",
    title: "Platform finance",
    description:
      "Platform revenue, Stripe fees paid, gross GMV, and net to tutors over selectable periods.",
    status: { label: "Planned", tone: "trust" },
  },
  {
    key: "payout-oversight",
    title: "Payout oversight",
    description:
      "Who is owed, payout status per tutor, and finance-intervention holds.",
    status: { label: "Planned", tone: "trust" },
  },
];

export default async function InternalFinancePage() {
  await requireInternalAdminAccount();

  return (
    <SectionLanding
      cards={FINANCE_CARDS}
      cardsLabel="Finance tools"
      description="Revenue, fees, and payout oversight from captured per-transaction data."
      eyebrow="Internal · Finance"
      title="Finance"
    />
  );
}
