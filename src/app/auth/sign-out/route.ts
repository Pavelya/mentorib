import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Sign-out is best-effort — if Supabase is misconfigured we still want
    // the browser to land back on a public surface.
  }

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
