import type { Route } from "next";
import { redirect } from "next/navigation";

import { RoleSelectionForm } from "@/app/setup/role/role-selection-form";
import { InlineNotice } from "@/components/ui";
import { ensureAuthAccount, resolvePostSignInRedirect } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requiresRoleSelection } from "@/modules/accounts/account-state";

export default async function RoleSelectionPage() {
  if (!isSupabaseAuthConfigured()) {
    return (
      <InlineNotice title="Auth configuration required" tone="warning">
        <p>
          Role setup is disabled until the Supabase auth environment variables
          have loaded. Restart the dev server after updating `.env.local`.
        </p>
      </InlineNotice>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(routeFamilies.setup.defaultHref) as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>>;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    return (
      <InlineNotice title="Account setup could not load" tone="warning">
        <p>
          We could not resolve your account setup state. Refresh the page or sign
          in again to continue.
        </p>
      </InlineNotice>
    );
  }

  if (!requiresRoleSelection(account)) {
    redirect((await resolvePostSignInRedirect(account)) as Route);
  }

  return <RoleSelectionForm />;
}
