import { describe, expect, it, vi } from "vitest";

import { grantAdminByEmail } from "../../../scripts/grant-admin";

type FakeRow = { id: string };

type FakeSupabaseOptions = {
  appUserById?: Record<string, FakeRow>;
  appUserByEmail?: Record<string, FakeRow>;
  failOn?: "user_roles" | "admin_action_logs" | "app_users";
  lookupError?: boolean;
};

function makeFakeSupabase(options: FakeSupabaseOptions) {
  const inserts: Array<{ table: string; rows: unknown }> = [];
  const upserts: Array<{ table: string; rows: unknown }> = [];

  const client = {
    from(table: string) {
      return {
        select() {
          return {
            ilike(_column: string, value: string) {
              return {
                maybeSingle: () => {
                  if (options.lookupError) {
                    return Promise.resolve({
                      data: null,
                      error: { message: "db boom" },
                    });
                  }
                  const row =
                    options.appUserByEmail?.[value.toLowerCase()] ?? null;
                  return Promise.resolve({ data: row, error: null });
                },
              };
            },
          };
        },
        upsert(rows: unknown) {
          upserts.push({ rows, table });
          if (options.failOn === "user_roles") {
            return Promise.resolve({ error: { message: "role boom" } });
          }
          return Promise.resolve({ error: null });
        },
        insert(rows: unknown) {
          inserts.push({ rows, table });
          if (options.failOn === "admin_action_logs") {
            return Promise.resolve({ error: { message: "audit boom" } });
          }
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  return { client, inserts, upserts };
}

describe("grantAdminByEmail (scripts/grant-admin.ts)", () => {
  it("refuses to run without SUPABASE_SERVICE_ROLE_KEY", async () => {
    const factory = vi.fn();
    const result = await grantAdminByEmail("admin@example.com", {
      createClient: factory as never,
      env: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_service_role_key");
    }
    expect(factory).not.toHaveBeenCalled();
  });

  it("fails clearly when the email does not resolve to an app_users row", async () => {
    const fake = makeFakeSupabase({ appUserByEmail: {} });

    const result = await grantAdminByEmail("ghost@example.com", {
      createClient: () => fake.client as never,
      env: {
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
        SUPABASE_URL: "https://example.supabase.co",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("user_not_found");
    }
    expect(fake.inserts).toHaveLength(0);
    expect(fake.upserts).toHaveLength(0);
  });

  it("upserts user_roles AND writes admin_action_logs on success", async () => {
    const fake = makeFakeSupabase({
      appUserByEmail: { "admin@example.com": { id: "user-id" } },
    });

    const result = await grantAdminByEmail("Admin@example.com", {
      createClient: () => fake.client as never,
      env: {
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
        SUPABASE_URL: "https://example.supabase.co",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appUserId).toBe("user-id");
    }
    expect(fake.upserts).toHaveLength(1);
    expect(fake.upserts[0].table).toBe("user_roles");
    expect(fake.upserts[0].rows).toMatchObject({
      app_user_id: "user-id",
      role: "admin",
      role_status: "active",
    });

    expect(fake.inserts).toHaveLength(1);
    expect(fake.inserts[0].table).toBe("admin_action_logs");
    expect(fake.inserts[0].rows).toMatchObject({
      action_key: "admin_role.bootstrap",
      actor_app_user_id: "user-id",
      target_id: "user-id",
      target_type: "app_user",
    });
  });

  it("reports an audit_insert_failed code if the audit write fails", async () => {
    const fake = makeFakeSupabase({
      appUserByEmail: { "admin@example.com": { id: "user-id" } },
      failOn: "admin_action_logs",
    });

    const result = await grantAdminByEmail("admin@example.com", {
      createClient: () => fake.client as never,
      env: {
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
        SUPABASE_URL: "https://example.supabase.co",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("audit_insert_failed");
    }
  });
});
