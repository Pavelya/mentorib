import { beforeEach, describe, expect, it, vi } from "vitest";

type InsertCall = { table: string; rows: unknown };

const insertCalls: InsertCall[] = [];
let insertShouldFail = false;

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => ({
    from(table: string) {
      return {
        insert(rows: unknown) {
          insertCalls.push({ rows, table });
          return Promise.resolve({
            error: insertShouldFail ? { message: "boom" } : null,
          });
        },
      };
    },
  }),
}));

import {
  AdminAuditError,
  recordAdminAction,
} from "@/modules/admin/audit-service";

describe("recordAdminAction", () => {
  beforeEach(() => {
    insertCalls.length = 0;
    insertShouldFail = false;
  });

  it("writes one admin_action_logs row with the canonical payload shape", async () => {
    await recordAdminAction({
      action: "tutor_application.approve",
      actorAppUserId: "actor-id",
      afterState: { applicationStatus: "approved" },
      beforeState: { applicationStatus: "under_review" },
      reason: "Looks good.",
      targetId: "profile-id",
      targetType: "tutor_application",
    });

    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].table).toBe("admin_action_logs");
    expect(insertCalls[0].rows).toMatchObject({
      action_key: "tutor_application.approve",
      actor_app_user_id: "actor-id",
      after_state: { applicationStatus: "approved" },
      before_state: { applicationStatus: "under_review" },
      reason: "Looks good.",
      target_id: "profile-id",
      target_type: "tutor_application",
    });
  });

  it("rejects unknown action keys", async () => {
    await expect(
      recordAdminAction({
        // @ts-expect-error: deliberately invalid
        action: "tutor_application.haxx",
        actorAppUserId: "actor-id",
        targetId: "profile-id",
        targetType: "tutor_application",
      }),
    ).rejects.toBeInstanceOf(AdminAuditError);
    expect(insertCalls).toHaveLength(0);
  });

  it("surfaces the underlying insert failure so callers roll back", async () => {
    insertShouldFail = true;
    await expect(
      recordAdminAction({
        action: "tutor_application.approve",
        actorAppUserId: "actor-id",
        targetId: "profile-id",
        targetType: "tutor_application",
      }),
    ).rejects.toBeInstanceOf(AdminAuditError);
  });
});
