import type { Metadata } from "next";

import { PageHeader } from "@/components/ui";
import { ensureAuthAccount } from "@/lib/auth/account-service";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ContactForm } from "./contact-form";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Send a message to the Mentor IB support team. We'll reply by email.",
};

// Resolves the signed-in account email so the form can prefill it and skip the
// email field. Logged-out visitors fall through to a null email and supply one.
async function resolveSignedInEmail(): Promise<string | null> {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email?.trim()) {
    return null;
  }
  try {
    const account = await ensureAuthAccount(user);
    return account.email;
  } catch {
    return null;
  }
}

export default async function ContactPage() {
  const signedInEmail = await resolveSignedInEmail();

  return (
    <article className={styles.page}>
      <PageHeader
        eyebrow="Support"
        title="Contact us"
        description="Send the Mentor IB team a message and we'll reply by email. For account-specific lesson or payment help, sign in first so we can find your record faster."
      />
      <ContactForm signedInEmail={signedInEmail} />
    </article>
  );
}
