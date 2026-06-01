import type { Route } from "next";

import { SectionLanding, type SectionLandingCard } from "@/components/shell/section-landing";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";

const CONFIGURATION_CARDS: SectionLandingCard[] = [
  {
    key: "reference-data",
    title: "Reference data",
    description:
      "Edit display labels, descriptions, sort order, and the active toggle on existing reference rows.",
    href: "/internal/reference-data" as Route,
  },
  {
    key: "policy-notices",
    title: "Policy notices",
    description:
      "Draft, publish, or revoke Terms, Privacy, and Trust & Safety notice versions and broadcasts.",
    href: "/internal/reference-data/policy-notices" as Route,
  },
  {
    key: "commission",
    title: "Commission rate",
    description:
      "Set the single global platform commission percentage. Audited, and snapshotted per transaction.",
    status: { label: "Planned", tone: "trust" },
  },
  {
    key: "audit",
    title: "Audit log",
    description:
      "Browse the admin_action_logs trail of every privileged write.",
    status: { label: "Planned", tone: "trust" },
  },
];

export default async function InternalConfigurationPage() {
  await requireInternalAdminAccount();

  return (
    <SectionLanding
      cards={CONFIGURATION_CARDS}
      cardsLabel="Configuration tools"
      description="Reference-data labels, policy notices, the commission rate, and the audit trail."
      eyebrow="Internal · Configuration"
      title="Configuration"
    />
  );
}
