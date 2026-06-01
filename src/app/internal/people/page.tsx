import { SectionLanding, type SectionLandingCard } from "@/components/shell/section-landing";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";

const PEOPLE_CARDS: SectionLandingCard[] = [
  {
    key: "students",
    title: "Students",
    description:
      "Find and manage student accounts: search by name or email, review activity, and open a person detail.",
    status: { label: "Planned", tone: "trust" },
  },
  {
    key: "tutors",
    title: "Tutors",
    description:
      "Browse tutors, filter by listing and application status, and open a tutor's full operating picture.",
    status: { label: "Planned", tone: "trust" },
  },
  {
    key: "admins",
    title: "Admins",
    description:
      "Review who holds the admin role, promote a user, or revoke access.",
    status: { label: "Planned", tone: "trust" },
  },
];

export default async function InternalPeoplePage() {
  await requireInternalAdminAccount();

  return (
    <SectionLanding
      cards={PEOPLE_CARDS}
      cardsLabel="People tools"
      description="Directories and detail views for students, tutors, and admins. Each row opens a shared person detail."
      eyebrow="Internal · People"
      title="People"
    />
  );
}
