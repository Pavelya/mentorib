// Bootstrap helper for the very first admin in an environment.
//
// Usage: pnpm tsx scripts/grant-admin.ts <email>
//
// Refuses to run without SUPABASE_SERVICE_ROLE_KEY. Fails fast if the
// target email does not resolve to an existing `app_users` row (the user
// must complete normal signup first — this script never creates auth
// users). On success, upserts a `user_roles` row with role='admin',
// role_status='active' and writes a self-actor `admin_action_logs` row
// with action_key='admin_role.bootstrap'.
//
// Steady-state grant/revoke happens through the UI in `P2-OPS-002`; this
// script is bootstrap-only.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { MentorIbDatabase } from "@/lib/supabase/database.types";

type GrantAdminResult =
  | { ok: true; appUserId: string }
  | { ok: false; code: GrantAdminErrorCode; message: string };

export type GrantAdminErrorCode =
  | "missing_service_role_key"
  | "missing_email_arg"
  | "user_not_found"
  | "user_lookup_failed"
  | "role_upsert_failed"
  | "audit_insert_failed";

export type GrantAdminEnv = {
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
};

export type GrantAdminDeps = {
  env: GrantAdminEnv;
  createClient?: (
    url: string,
    key: string,
  ) => SupabaseClient<MentorIbDatabase>;
};

export async function grantAdminByEmail(
  email: string | undefined,
  deps: GrantAdminDeps,
): Promise<GrantAdminResult> {
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!trimmedEmail) {
    return {
      code: "missing_email_arg",
      message: "Usage: pnpm tsx scripts/grant-admin.ts <email>",
      ok: false,
    };
  }

  const { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL } =
    deps.env;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return {
      code: "missing_service_role_key",
      message:
        "SUPABASE_SERVICE_ROLE_KEY is not set. Refusing to run without the service-role key.",
      ok: false,
    };
  }

  const url = SUPABASE_URL ?? NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return {
      code: "missing_service_role_key",
      message:
        "Supabase URL is not set. Configure SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.",
      ok: false,
    };
  }

  const factory =
    deps.createClient ??
    ((u: string, k: string) =>
      createClient<MentorIbDatabase>(u, k, {
        auth: { autoRefreshToken: false, persistSession: false },
      }));
  const supabase = factory(url, SUPABASE_SERVICE_ROLE_KEY);

  const { data: appUser, error: lookupError } = await supabase
    .from("app_users")
    .select("id")
    .ilike("email", trimmedEmail)
    .maybeSingle<{ id: string }>();

  if (lookupError) {
    return {
      code: "user_lookup_failed",
      message: `Could not look up app_users by email: ${lookupError.message}`,
      ok: false,
    };
  }

  if (!appUser) {
    return {
      code: "user_not_found",
      message: `No app_users row found for ${trimmedEmail}. The user must complete normal signup first.`,
      ok: false,
    };
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      {
        app_user_id: appUser.id,
        granted_at: new Date().toISOString(),
        revoked_at: null,
        role: "admin",
        role_status: "active",
      },
      { onConflict: "app_user_id,role" },
    );

  if (roleError) {
    return {
      code: "role_upsert_failed",
      message: `Could not upsert admin user_roles row: ${roleError.message}`,
      ok: false,
    };
  }

  const { error: auditError } = await supabase
    .from("admin_action_logs")
    .insert({
      action_key: "admin_role.bootstrap",
      actor_app_user_id: appUser.id,
      reason: "Initial admin bootstrap via grant-admin script",
      target_id: appUser.id,
      target_type: "app_user",
    });

  if (auditError) {
    return {
      code: "audit_insert_failed",
      message: `Could not write admin_action_logs row: ${auditError.message}`,
      ok: false,
    };
  }

  return { appUserId: appUser.id, ok: true };
}

async function main() {
  const result = await grantAdminByEmail(process.argv[2], {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
    },
  });

  if (result.ok) {
    process.stdout.write(
      JSON.stringify({
        app_user_id: result.appUserId,
        ok: true,
      }) + "\n",
    );
    process.exit(0);
  }

  process.stderr.write(
    JSON.stringify({
      code: result.code,
      message: result.message,
      ok: false,
    }) + "\n",
  );
  process.exit(1);
}

const isDirectInvocation =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  /grant-admin\.ts$/.test(process.argv[1]);

if (isDirectInvocation) {
  void main();
}
