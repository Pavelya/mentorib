import type { Route } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/app/auth/sign-in/sign-in-form";
import { ensureAuthAccount, resolvePostSignInRedirect } from "@/lib/auth/account-service";
import { getSafeRedirectPath } from "@/lib/auth/allowed-redirects";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = getSafeRedirectPath(getSearchParam(resolvedSearchParams.next));

  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      try {
        const account = await ensureAuthAccount(user);

        redirect((await resolvePostSignInRedirect(account, nextPath)) as Route);
      } catch {
        // Fall through to the sign-in screen so auth failures stay recoverable.
      }
    }
  }

  return (
    <SignInForm
      canStartAuth={isSupabaseAuthConfigured()}
      hasReturnPath={Boolean(nextPath)}
      nextPath={nextPath}
    />
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
