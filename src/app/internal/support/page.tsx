import { RoutePlaceholder } from "@/components/shell/route-placeholder";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";

export default async function InternalSupportPage() {
  await requireInternalAdminAccount();

  return (
    <RoutePlaceholder
      routePath="/internal/support"
      phase="Phase 2"
      title="Support tickets"
      titleAs="h1"
      description="The contact-us pipeline and the internal support ticket queue land in P2-ADMIN-SUPPORT-001. The Support group route is reserved here so the two-level header navigation is complete."
      notes={[
        "A public contact-us submission will always create exactly one ticket in this queue.",
        "The queue and detail are admin-only; replies go out by email since some senders are logged-out.",
      ]}
    />
  );
}
