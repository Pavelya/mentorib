import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRecordAdminAction = vi.fn();
const mockRevalidatePath = vi.fn();
const mockLoadRow = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock("@/modules/admin/audit-service", () => ({
  recordAdminAction: (...args: unknown[]) => mockRecordAdminAction(...args),
  snapshot: <T>(value: T) => value,
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => ({
    from: () => ({
      update: (payload: Record<string, unknown>) => {
        mockUpdate(payload);
        return {
          eq: (column: string, value: string) => {
            mockEq(column, value);
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  }),
}));

vi.mock("@/modules/reference/admin/repository", () => ({
  loadReferenceFamilyRow: (...args: unknown[]) => mockLoadRow(...args),
}));

import {
  ReferenceDataError,
  updateReferenceDataRow,
} from "@/modules/reference/admin/service";

describe("updateReferenceDataRow", () => {
  beforeEach(() => {
    mockRecordAdminAction.mockReset();
    mockRevalidatePath.mockReset();
    mockLoadRow.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockLoadRow.mockResolvedValue({
      displayDescription: "old description",
      displayName: "Old name",
      helperText: null,
      id: "row-1",
      identifier: "math",
      isActive: true,
      sortOrder: 5,
    });
  });

  it("rejects a payload that contains a non-allowlisted key (slug)", async () => {
    await expect(
      updateReferenceDataRow({
        actorAppUserId: "actor-1",
        changes: { display_name: "Mathematics", slug: "different-slug" },
        family: "subjects",
        id: "row-1",
      }),
    ).rejects.toBeInstanceOf(ReferenceDataError);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRecordAdminAction).not.toHaveBeenCalled();
  });

  it("rejects a payload that contains a forbidden subject_code key", async () => {
    try {
      await updateReferenceDataRow({
        actorAppUserId: "actor-1",
        changes: { subject_code: "MATH_NEW" },
        family: "subjects",
        id: "row-1",
      });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ReferenceDataError);
      expect((error as ReferenceDataError).code).toBe("forbidden");
    }
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a payload that contains an id key", async () => {
    await expect(
      updateReferenceDataRow({
        actorAppUserId: "actor-1",
        changes: { id: "another-id", display_name: "Mathematics" },
        family: "subjects",
        id: "row-1",
      }),
    ).rejects.toBeInstanceOf(ReferenceDataError);
  });

  it("writes an admin_action_logs row on a successful display_name update", async () => {
    await updateReferenceDataRow({
      actorAppUserId: "actor-1",
      changes: { display_name: "Mathematics" },
      family: "subjects",
      id: "row-1",
    });

    expect(mockUpdate).toHaveBeenCalledWith({ display_name: "Mathematics" });
    expect(mockEq).toHaveBeenCalledWith("id", "row-1");
    expect(mockRecordAdminAction).toHaveBeenCalledTimes(1);
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "reference_data.subject.update",
        actorAppUserId: "actor-1",
        afterState: expect.objectContaining({ display_name: "Mathematics" }),
        beforeState: expect.objectContaining({ display_name: "Old name" }),
        targetId: "row-1",
        targetType: "subjects",
      }),
    );
  });

  it("revalidates the family route and the consuming public routes", async () => {
    await updateReferenceDataRow({
      actorAppUserId: "actor-1",
      changes: { display_name: "Mathematics" },
      family: "subjects",
      id: "row-1",
    });

    const paths = mockRevalidatePath.mock.calls.map((call) => call[0]);
    // Subjects revalidate /match, /results, /tutors plus the family route.
    expect(paths).toContain("/match");
    expect(paths).toContain("/results");
    expect(paths).toContain("/tutors");
    expect(paths).toContain("/internal/reference-data/subjects");
  });

  it("normalizes empty display_description to null", async () => {
    await updateReferenceDataRow({
      actorAppUserId: "actor-1",
      changes: { display_description: "   " },
      family: "subjects",
      id: "row-1",
    });

    expect(mockUpdate).toHaveBeenCalledWith({ display_description: null });
  });

  it("validates the active toggle as a boolean only", async () => {
    await expect(
      updateReferenceDataRow({
        actorAppUserId: "actor-1",
        changes: { is_active: "yes" as unknown as boolean },
        family: "subjects",
        id: "row-1",
      }),
    ).rejects.toBeInstanceOf(ReferenceDataError);
  });
});
