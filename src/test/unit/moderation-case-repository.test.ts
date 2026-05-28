import { beforeEach, describe, expect, it, vi } from "vitest";

type SelectCall = { columns: string; table: string };

const selectCalls: SelectCall[] = [];
let queueRows: Array<Record<string, unknown>> = [];
let countResult: number | null = 0;

function buildCountChain() {
  const chain: Record<string, unknown> = {};
  chain.eq = () => chain;
  chain.in = () => chain;
  // `await` on this object resolves to { count, error }.
  chain.then = (resolve: (value: { count: number | null; error: null }) => void) =>
    resolve({ count: countResult, error: null });
  return chain;
}

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => ({
    from(table: string) {
      return {
        select(columns: string, options?: { count?: string; head?: boolean }) {
          selectCalls.push({ columns, table });
          if (options?.count === "exact" && options?.head) {
            return buildCountChain();
          }

          const chain: Record<string, unknown> = {};
          chain.in = () => chain;
          chain.order = () => chain;
          chain.limit = () => chain;
          chain.eq = () => chain;
          chain.maybeSingle = () =>
            Promise.resolve({ data: queueRows[0] ?? null, error: null });
          chain.returns = () => Promise.resolve({ data: queueRows, error: null });
          chain.then = (resolve: (value: { data: unknown; error: null }) => void) =>
            resolve({ data: queueRows, error: null });
          return chain;
        },
      };
    },
  }),
}));

import {
  loadModerationCaseDetail,
  loadModerationCaseQueue,
} from "@/modules/admin/moderation-case-repository";

describe("moderation case repository — DTO leak guard", () => {
  beforeEach(() => {
    selectCalls.length = 0;
    queueRows = [];
    countResult = 0;
  });

  it("queue rows expose only D7 admin-scope fields (no internal_summary, no triggering content)", async () => {
    queueRows = [
      {
        case_kind: "report",
        case_status: "queued",
        claimed_at: null,
        created_at: "2026-05-26T00:00:00.000Z",
        id: "case-1",
        priority: 0,
        subject_id: "subject-1",
        subject_kind: "app_user",
      },
    ];

    const queue = await loadModerationCaseQueue({ filters: ["queued"] });

    expect(queue.rows).toHaveLength(1);
    const row = queue.rows[0];
    expect(Object.keys(row).sort()).toEqual([
      "caseId",
      "caseKind",
      "caseKindLabel",
      "caseStatus",
      "caseStatusLabel",
      "caseStatusTone",
      "claimedAt",
      "createdAt",
      "priority",
      "reasonSnippet",
      "subjectId",
      "subjectKind",
      "subjectKindLabel",
    ]);
    // The list carries only a derived, length-capped reason snippet — never
    // the raw `internal_summary` column or any triggering content.
    expect(row).not.toHaveProperty("internalSummary");
    expect(row).not.toHaveProperty("triggeringEventId");
    expect(row).not.toHaveProperty("reporterAppUserId");
    // Display-ready: enum values never leak as the rendered label.
    expect(row.caseKindLabel).toBe("Report");
    expect(row.caseStatusLabel).toBe("Queued");
    expect(row.subjectKindLabel).toBe("User");
  });

  it("queue select pulls only the reason snippet source, never triggering content or the reporter", async () => {
    queueRows = [];
    await loadModerationCaseQueue({ filters: ["queued"] });
    const queueSelect = selectCalls.find(
      (call) =>
        call.table === "moderation_cases" &&
        !call.columns.includes("count") &&
        call.columns.length > 1,
    );
    expect(queueSelect).toBeDefined();
    // `internal_summary` is read solely to derive a truncated reason snippet
    // (`P2-OPSFIX-004`); triggering content and the reporter stay out of the list.
    expect(queueSelect!.columns).not.toContain("triggering_event_id");
    expect(queueSelect!.columns).not.toContain("reporter_app_user_id");
  });

  it("detail DTO carries the admin-only summary but never raw subject rows", async () => {
    queueRows = [
      {
        case_kind: "report",
        case_status: "under_review",
        claimed_at: "2026-05-26T00:00:00.000Z",
        claimed_by_app_user_id: "admin-1",
        created_at: "2026-05-26T00:00:00.000Z",
        id: "case-1",
        internal_summary: "needs follow-up",
        priority: 1,
        reporter_app_user_id: "reporter-1",
        resolution_kind: null,
        resolved_at: null,
        resolved_by_app_user_id: null,
        subject_id: "subject-1",
        subject_kind: "app_user",
        triggering_event_id: null,
        triggering_event_kind: null,
      },
    ];

    const detail = await loadModerationCaseDetail("case-1");
    expect(detail).not.toBeNull();
    expect(detail!.internalSummary).toBe("needs follow-up");
    // No raw subject row was joined or shaped into the DTO.
    expect(detail).not.toHaveProperty("subjectRow");
    expect(detail).not.toHaveProperty("subjectEmail");
    expect(detail).not.toHaveProperty("reporterEmail");
  });
});
