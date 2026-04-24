import type { Route } from "next";
import { redirect } from "next/navigation";

import { InlineNotice } from "@/components/ui";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { buildPostSignInRedirect, ensureAuthAccount } from "@/lib/auth/account-service";
import { getCurrentUserTimezone } from "@/lib/datetime/server";
import { routeFamilies } from "@/lib/routing/route-families";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import { loadMatchFlowOptions } from "@/modules/lessons/match-flow-reference";

import { MatchFlowForm } from "./match-flow-form";

export default async function MatchPage() {
  const fallbackTimezone = await getCurrentUserTimezone();
  const optionsByField = await loadMatchFlowOptions();
  const fallbackLanguageCode = resolveInitialLanguageCode(
    null,
    optionsByField,
  );

  if (!isSupabaseAuthConfigured()) {
    return (
      <MatchFlowForm
        canSubmit={false}
        initialLanguageCode={fallbackLanguageCode}
        initialTimezone={fallbackTimezone}
        optionsByField={optionsByField}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(routeFamilies.student.defaultHref) as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>> | null = null;

  try {
    account = await ensureAuthAccount(user, fallbackTimezone);
  } catch {
    account = null;
  }

  if (!account) {
    return (
      <>
        <InlineNotice title="Match flow unavailable" tone="warning">
          <p>
            We could not load your student context yet. Refresh the page or sign
            in again to continue.
          </p>
        </InlineNotice>
        <MatchFlowForm
          canSubmit={false}
          initialLanguageCode={fallbackLanguageCode}
          initialTimezone={fallbackTimezone}
          optionsByField={optionsByField}
        />
      </>
    );
  }

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return (
      <InlineNotice title="Account access limited" tone="warning">
        <p>
          This account cannot start a new match flow right now. Review your
          account status and try again later.
        </p>
      </InlineNotice>
    );
  }

  if (!hasRole(account, "student")) {
    redirect(buildPostSignInRedirect(account) as Route);
  }

  return (
    <MatchFlowForm
      canSubmit
      initialLanguageCode={resolveInitialLanguageCode(
        account.preferred_language_code,
        optionsByField,
      )}
      initialTimezone={account.timezone}
      optionsByField={optionsByField}
    />
  );
}

function resolveInitialLanguageCode(
  preferredLanguageCode: string | null,
  optionsByField: Awaited<ReturnType<typeof loadMatchFlowOptions>>,
) {
  if (
    preferredLanguageCode &&
    optionsByField.languageCode.some((option) => option.value === preferredLanguageCode)
  ) {
    return preferredLanguageCode;
  }

  return (
    optionsByField.languageCode.find((option) => option.value === "en")?.value ??
    optionsByField.languageCode[0]?.value ??
    ""
  );
}
