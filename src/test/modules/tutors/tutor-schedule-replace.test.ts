import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

import {
  AvailabilityRuleCommandError,
  replaceAvailabilityRules,
} from "@/modules/tutors/tutor-schedule";

type DeleteFilter = { column: string; value: unknown };

function buildClient({
  profile,
  insertResult,
  deleteResult,
  recordInserts,
  recordDeletes,
}: {
  profile: { id: string } | null;
  insertResult?: { error: { message: string } | null };
  deleteResult?: { error: { message: string } | null };
  recordInserts?: (rows: unknown[]) => void;
  recordDeletes?: (filter: DeleteFilter) => void;
}) {
  return {
    from(table: string) {
      if (table === "tutor_profiles") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => ({ data: profile, error: null }),
        };
        return chain;
      }

      if (table === "availability_rules") {
        const builder = {
          delete() {
            return {
              eq(column: string, value: unknown) {
                recordDeletes?.({ column, value });
                return Promise.resolve(
                  deleteResult ?? { error: null },
                );
              },
            };
          },
          insert(rows: unknown[]) {
            recordInserts?.(rows);
            return Promise.resolve(insertResult ?? { error: null });
          },
        };
        return builder;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("replaceAvailabilityRules", () => {
  it("deletes existing rules and inserts the new set in one round trip", async () => {
    const inserts: unknown[][] = [];
    const deletes: DeleteFilter[] = [];
    mockServiceRoleClient.mockReturnValue(
      buildClient({
        profile: { id: "profile-1" },
        recordInserts: (rows) => inserts.push(rows),
        recordDeletes: (filter) => deletes.push(filter),
      }),
    );

    await replaceAvailabilityRules({ id: "user-1" }, [
      { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "11:00" },
      { dayOfWeek: 2, startLocalTime: "13:00", endLocalTime: "14:00" },
    ]);

    expect(deletes).toEqual([
      { column: "tutor_profile_id", value: "profile-1" },
    ]);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toEqual([
      {
        tutor_profile_id: "profile-1",
        day_of_week: 1,
        start_local_time: "09:00:00",
        end_local_time: "11:00:00",
        visibility_status: "active",
      },
      {
        tutor_profile_id: "profile-1",
        day_of_week: 2,
        start_local_time: "13:00:00",
        end_local_time: "14:00:00",
        visibility_status: "active",
      },
    ]);
  });

  it("clears all rules without an insert when the new set is empty", async () => {
    const inserts: unknown[][] = [];
    const deletes: DeleteFilter[] = [];
    mockServiceRoleClient.mockReturnValue(
      buildClient({
        profile: { id: "profile-7" },
        recordInserts: (rows) => inserts.push(rows),
        recordDeletes: (filter) => deletes.push(filter),
      }),
    );

    await replaceAvailabilityRules({ id: "user-7" }, []);

    expect(deletes).toEqual([
      { column: "tutor_profile_id", value: "profile-7" },
    ]);
    expect(inserts).toEqual([]);
  });

  it("throws AvailabilityRuleCommandError when the tutor profile is missing", async () => {
    mockServiceRoleClient.mockReturnValue(buildClient({ profile: null }));

    await expect(
      replaceAvailabilityRules({ id: "user-9" }, [
        { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "10:00" },
      ]),
    ).rejects.toBeInstanceOf(AvailabilityRuleCommandError);
  });

  it("throws availability_rules_replace_failed when the insert fails", async () => {
    mockServiceRoleClient.mockReturnValue(
      buildClient({
        profile: { id: "profile-1" },
        insertResult: { error: { message: "boom" } },
      }),
    );

    await expect(
      replaceAvailabilityRules({ id: "user-1" }, [
        { dayOfWeek: 1, startLocalTime: "09:00", endLocalTime: "10:00" },
      ]),
    ).rejects.toMatchObject({
      code: "availability_rules_replace_failed",
    });
  });

  it("throws availability_rules_replace_failed when the delete fails", async () => {
    mockServiceRoleClient.mockReturnValue(
      buildClient({
        profile: { id: "profile-1" },
        deleteResult: { error: { message: "boom" } },
      }),
    );

    await expect(
      replaceAvailabilityRules({ id: "user-1" }, []),
    ).rejects.toMatchObject({
      code: "availability_rules_replace_failed",
    });
  });
});
