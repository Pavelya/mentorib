import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRecordAdminAction = vi.fn();
const mockRevalidatePath = vi.fn();
const mockCreatePolicyNoticeNotification = vi.fn();

type FakeRow = {
  id: string;
  notice_type: "terms" | "privacy";
  version_label: string;
  title: string;
  summary: string;
  document_url: string;
  published_at: string | null;
  effective_at: string;
  requires_acknowledgement: boolean;
  created_at: string;
};

let policyNoticeStore: FakeRow[] = [];
let appUsersStore: Array<{ id: string }> = [];

vi.mock("@/modules/admin/audit-service", () => ({
  recordAdminAction: (...args: unknown[]) => mockRecordAdminAction(...args),
  snapshot: <T>(value: T) => value,
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/modules/notifications/lifecycle", () => ({
  createPolicyNoticeNotification: (...args: unknown[]) =>
    mockCreatePolicyNoticeNotification(...args),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => ({
    from(table: string) {
      if (table === "policy_notice_versions") {
        return policyNoticeQueryBuilder();
      }
      if (table === "app_users") {
        return {
          select: () => ({
            returns: <T,>() =>
              Promise.resolve({ data: appUsersStore as unknown as T, error: null }),
          }),
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  }),
}));

function policyNoticeQueryBuilder() {
  return {
    insert(payload: Record<string, unknown>) {
      const row: FakeRow = {
        created_at: new Date().toISOString(),
        document_url: payload.document_url as string,
        effective_at: payload.effective_at as string,
        id: `notice-${policyNoticeStore.length + 1}`,
        notice_type: payload.notice_type as "terms" | "privacy",
        published_at: (payload.published_at as string | null) ?? null,
        requires_acknowledgement: Boolean(payload.requires_acknowledgement),
        summary: payload.summary as string,
        title: payload.title as string,
        version_label: payload.version_label as string,
      };
      policyNoticeStore.push(row);
      return {
        select: () => ({
          single: <T,>() =>
            Promise.resolve({ data: { id: row.id } as unknown as T, error: null }),
        }),
      };
    },
    update(payload: Record<string, unknown>) {
      return {
        eq: (column: string, value: string) => {
          const match = policyNoticeStore.find(
            (row) => row[column as keyof FakeRow] === value,
          );
          if (match && "published_at" in payload) {
            match.published_at = payload.published_at as string | null;
          }
          return Promise.resolve({ error: null });
        },
      };
    },
    select() {
      return {
        eq: (column: string, value: string) => ({
          maybeSingle: <T,>() =>
            Promise.resolve({
              data:
                (policyNoticeStore.find(
                  (row) => row[column as keyof FakeRow] === value,
                ) as unknown as T | undefined) ?? null,
              error: null,
            }),
        }),
        in: () => ({
          order: () => ({
            returns: <T,>() =>
              Promise.resolve({ data: policyNoticeStore as unknown as T, error: null }),
          }),
        }),
      };
    },
  };
}

import {
  PolicyNoticeError,
  draftPolicyNotice,
  publishPolicyNotice,
  revokePolicyNotice,
} from "@/modules/admin/policy-notice-service";

describe("policy-notice-service", () => {
  beforeEach(() => {
    mockRecordAdminAction.mockReset();
    mockRevalidatePath.mockReset();
    mockCreatePolicyNoticeNotification.mockReset();
    policyNoticeStore = [];
    appUsersStore = [];
  });

  it("validates draft input: rejects non-terms/privacy notice_type", async () => {
    await expect(
      draftPolicyNotice({
        actorAppUserId: "actor-1",
        document_url: "https://example.com/doc",
        effective_at: "2026-06-01T00:00:00Z",
        // @ts-expect-error: deliberately wrong type
        notice_type: "cookie_notice",
        requires_acknowledgement: false,
        summary: "Summary",
        title: "Title",
        version_label: "2026-q3",
      }),
    ).rejects.toBeInstanceOf(PolicyNoticeError);
  });

  it("creates a draft row with published_at = null and writes an audit row", async () => {
    const id = await draftPolicyNotice({
      actorAppUserId: "actor-1",
      document_url: "https://example.com/doc",
      effective_at: "2026-06-01T00:00:00Z",
      notice_type: "privacy",
      requires_acknowledgement: false,
      summary: "Summary",
      title: "Title",
      version_label: "2026-q3",
    });
    expect(id).toBeDefined();
    expect(policyNoticeStore[0].published_at).toBeNull();
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "policy_notice.draft",
        actorAppUserId: "actor-1",
        targetType: "policy_notice_versions",
      }),
    );
  });

  it("publishes a draft: sets published_at, writes audit, fans out notifications", async () => {
    const id = await draftPolicyNotice({
      actorAppUserId: "actor-1",
      document_url: "https://example.com/doc",
      effective_at: "2026-06-01T00:00:00Z",
      notice_type: "terms",
      requires_acknowledgement: true,
      summary: "Summary",
      title: "Title",
      version_label: "2026-q3",
    });
    mockRecordAdminAction.mockReset();
    appUsersStore = [{ id: "user-1" }, { id: "user-2" }];

    await publishPolicyNotice({ actorAppUserId: "actor-2", id });

    expect(policyNoticeStore[0].published_at).not.toBeNull();
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "policy_notice.publish",
        actorAppUserId: "actor-2",
      }),
    );
    expect(mockCreatePolicyNoticeNotification).toHaveBeenCalledTimes(2);
  });

  it("revoke sets published_at back to null and writes an audit row", async () => {
    const id = await draftPolicyNotice({
      actorAppUserId: "actor-1",
      document_url: "https://example.com/doc",
      effective_at: "2026-06-01T00:00:00Z",
      notice_type: "privacy",
      requires_acknowledgement: false,
      summary: "Summary",
      title: "Title",
      version_label: "2026-q3",
    });
    await publishPolicyNotice({ actorAppUserId: "actor-1", id });
    mockRecordAdminAction.mockReset();

    await revokePolicyNotice({ actorAppUserId: "actor-2", id });

    expect(policyNoticeStore[0].published_at).toBeNull();
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "policy_notice.revoke" }),
    );
  });

  it("rejects publishing an already-published notice", async () => {
    const id = await draftPolicyNotice({
      actorAppUserId: "actor-1",
      document_url: "https://example.com/doc",
      effective_at: "2026-06-01T00:00:00Z",
      notice_type: "privacy",
      requires_acknowledgement: false,
      summary: "Summary",
      title: "Title",
      version_label: "2026-q3",
    });
    await publishPolicyNotice({ actorAppUserId: "actor-1", id });
    await expect(
      publishPolicyNotice({ actorAppUserId: "actor-1", id }),
    ).rejects.toBeInstanceOf(PolicyNoticeError);
  });
});
