"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureAuthAccount } from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addToCompare,
  addToShortlist,
  removeFromCompare,
  removeFromShortlist,
  ShortlistMutationError,
} from "@/modules/lessons/shortlist";

const REVALIDATE_PATHS = ["/results", "/compare"];

export async function toggleShortlistAction(formData: FormData) {
  await runShortlistMutation(formData, "shortlist");
}

export async function toggleCompareAction(formData: FormData) {
  await runShortlistMutation(formData, "compare");
}

async function runShortlistMutation(
  formData: FormData,
  domain: "compare" | "shortlist",
): Promise<void> {
  const candidateId = readString(formData, "candidateId");
  const intent = readIntent(formData);
  const profileSlug = readString(formData, "profileSlug");
  const returnTo = readString(formData, "returnTo");

  if (!candidateId || !intent) {
    return;
  }

  if (!isSupabaseAuthConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(returnTo ?? "/results") as Route);
  }

  let account: Awaited<ReturnType<typeof ensureAuthAccount>>;

  try {
    account = await ensureAuthAccount(user);
  } catch {
    return;
  }

  try {
    if (domain === "shortlist") {
      if (intent === "add") {
        await addToShortlist({ account, candidateId });
      } else {
        await removeFromShortlist({ account, candidateId });
      }
    } else if (intent === "add") {
      await addToCompare({ account, candidateId });
    } else {
      await removeFromCompare({ account, candidateId });
    }
  } catch (error) {
    if (!(error instanceof ShortlistMutationError)) {
      throw error;
    }
    // Compare cap or other mutation errors are surfaced through revalidated state
    // (the cap-full notice and disabled controls on the page). We swallow here so
    // a single denied action does not produce an error toast for a state the UI
    // already communicates.
  }

  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }

  if (profileSlug) {
    revalidatePath(`/tutors/${profileSlug}`);
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readIntent(formData: FormData): "add" | "remove" | null {
  const value = formData.get("intent");

  if (value === "add" || value === "remove") {
    return value;
  }

  return null;
}
