import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();
const mockCreateNotification = vi.fn();
const mockScheduleEmail = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/modules/notifications/service", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/notifications/service")
  >("@/modules/notifications/service");
  return {
    ...actual,
    createNotification: (...args: unknown[]) => mockCreateNotification(...args),
  };
});

vi.mock("@/modules/notifications/email-delivery", () => ({
  scheduleNotificationEmailDelivery: (...args: unknown[]) =>
    mockScheduleEmail(...args),
}));

import {
  TutorApplicationReviewError,
  approveTutorApplication,
  requestTutorApplicationChanges,
} from "@/modules/tutors/application-review-service";

type ProfileRow = {
  app_user_id: string;
  application_status:
    | "submitted"
    | "under_review"
    | "changes_requested"
    | "approved"
    | "rejected"
    | "in_progress"
    | "withdrawn"
    | "not_started";
  id: string;
};

type FakeBuilder = {
  insert: (payload: Record<string, unknown>) => Promise<{ error: unknown }>;
  update: (payload: Record<string, unknown>) => FakeBuilder;
  delete: () => FakeBuilder;
  select: (columns?: string) => FakeBuilder;
  eq: (column: string, value: unknown) => FakeBuilder;
  in: (column: string, values: readonly unknown[]) => FakeBuilder;
  order: (column: string, options?: unknown) => FakeBuilder;
  limit: (count: number) => FakeBuilder;
  maybeSingle: <T>() => Promise<{ data: T | null; error: unknown }>;
  returns: <T>() => Promise<{ data: T | null; error: unknown }>;
};

type Recorder = {
  profile: ProfileRow;
  profileUpdates: Array<Record<string, unknown>>;
  reviewInserts: Array<Record<string, unknown>>;
  reviewDeletes: number;
  roleUpdates: Array<Record<string, unknown>>;
  profileUpdateError?: unknown;
  reviewInsertError?: unknown;
  roleUpdateError?: unknown;
};

function buildClient(recorder: Recorder) {
  function fromTable(table: string): FakeBuilder {
    let pendingPayload: Record<string, unknown> | null = null;
    let action: "select" | "update" | "insert" | "delete" | null = null;

    const builder: FakeBuilder = {
      insert: async (payload) => {
        if (table === "tutor_application_reviews") {
          recorder.reviewInserts.push(payload);
          return { error: recorder.reviewInsertError ?? null };
        }
        return { error: null };
      },
      update: (payload) => {
        action = "update";
        pendingPayload = payload;
        return builder;
      },
      delete: () => {
        action = "delete";
        return builder;
      },
      select: () => {
        action = "select";
        return builder;
      },
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: async <T>() => {
        if (table === "tutor_profiles" && action === "select") {
          return { data: recorder.profile as unknown as T, error: null };
        }
        return { data: null as T | null, error: null };
      },
      returns: async <T>() => {
        // For mutating chains, settling returns reflects the operation.
        if (table === "tutor_profiles" && action === "update") {
          recorder.profileUpdates.push(pendingPayload ?? {});
          return {
            data: null as T | null,
            error: recorder.profileUpdateError ?? null,
          };
        }
        if (table === "user_roles" && action === "update") {
          recorder.roleUpdates.push(pendingPayload ?? {});
          return {
            data: null as T | null,
            error: recorder.roleUpdateError ?? null,
          };
        }
        if (table === "tutor_application_reviews" && action === "delete") {
          recorder.reviewDeletes += 1;
          return { data: null as T | null, error: null };
        }
        return { data: null as T | null, error: null };
      },
    };

    return builder;
  }

  // The real Supabase JS update/delete chain awaits on the chain itself, not
  // on `.returns()`. To make `await supabase.from(...).update(...).eq(...)`
  // resolve like the real client, we wrap the builder with a thenable proxy.
  return {
    from(table: string) {
      const builder = fromTable(table);
      const chainable: FakeBuilder & PromiseLike<{ error: unknown }> = {
        ...builder,
        update: (payload: Record<string, unknown>) => {
          builder.update(payload);
          return chainable;
        },
        delete: () => {
          builder.delete();
          return chainable;
        },
        select: (columns?: string) => {
          builder.select(columns);
          return chainable;
        },
        eq: (...args: [string, unknown]) => {
          builder.eq(...args);
          return chainable;
        },
        in: (...args: [string, readonly unknown[]]) => {
          builder.in(...args);
          return chainable;
        },
        order: (...args: [string, unknown?]) => {
          builder.order(...args);
          return chainable;
        },
        limit: (count: number) => {
          builder.limit(count);
          return chainable;
        },
        then: (onFulfilled, onRejected) => {
          return builder.returns().then(onFulfilled, onRejected);
        },
      } as FakeBuilder & PromiseLike<{ error: unknown }>;
      return chainable;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateNotification.mockResolvedValue({
    id: "notif-1",
    notification_type: "tutor_application_reviewed",
  });
  mockScheduleEmail.mockResolvedValue(undefined);
});

describe("approveTutorApplication", () => {
  it("flips application_status and user_roles.role_status atomically", async () => {
    const recorder: Recorder = {
      profile: {
        app_user_id: "user-1",
        application_status: "under_review",
        id: "tp-1",
      },
      profileUpdates: [],
      reviewInserts: [],
      reviewDeletes: 0,
      roleUpdates: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await approveTutorApplication({
      applicationId: "tp-1",
      reviewerAppUserId: "admin-1",
    });

    expect(result.applicationStatus).toBe("approved");
    expect(recorder.profileUpdates[0]).toMatchObject({
      application_status: "approved",
    });
    expect(recorder.reviewInserts[0]).toMatchObject({
      review_status: "approved",
      reviewer_app_user_id: "admin-1",
      tutor_profile_id: "tp-1",
    });
    expect(recorder.roleUpdates[0]).toMatchObject({
      role_status: "active",
      revoked_at: null,
    });
  });

  it("rolls back the application status flip when the role update fails", async () => {
    const recorder: Recorder = {
      profile: {
        app_user_id: "user-1",
        application_status: "under_review",
        id: "tp-2",
      },
      profileUpdates: [],
      reviewInserts: [],
      reviewDeletes: 0,
      roleUpdates: [],
      roleUpdateError: { message: "role activation failed" },
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      approveTutorApplication({
        applicationId: "tp-2",
        reviewerAppUserId: "admin-1",
      }),
    ).rejects.toBeInstanceOf(TutorApplicationReviewError);

    // First update flipped to approved; the rollback flipped it back to under_review.
    expect(recorder.profileUpdates).toHaveLength(2);
    expect(recorder.profileUpdates[0]).toMatchObject({
      application_status: "approved",
    });
    expect(recorder.profileUpdates[1]).toMatchObject({
      application_status: "under_review",
    });
    expect(recorder.reviewDeletes).toBe(1);
  });

  it("refuses to approve from a state that isn't `under_review`", async () => {
    const recorder: Recorder = {
      profile: {
        app_user_id: "user-1",
        application_status: "submitted",
        id: "tp-3",
      },
      profileUpdates: [],
      reviewInserts: [],
      reviewDeletes: 0,
      roleUpdates: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      approveTutorApplication({
        applicationId: "tp-3",
        reviewerAppUserId: "admin-1",
      }),
    ).rejects.toMatchObject({ code: "conflict" });

    expect(recorder.profileUpdates).toHaveLength(0);
    expect(recorder.reviewInserts).toHaveLength(0);
    expect(recorder.roleUpdates).toHaveLength(0);
  });
});

describe("requestTutorApplicationChanges", () => {
  it("requires a reviewer_note", async () => {
    const recorder: Recorder = {
      profile: {
        app_user_id: "user-1",
        application_status: "under_review",
        id: "tp-4",
      },
      profileUpdates: [],
      reviewInserts: [],
      reviewDeletes: 0,
      roleUpdates: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      requestTutorApplicationChanges({
        applicationId: "tp-4",
        reviewerAppUserId: "admin-1",
        reviewerNote: "   ",
      }),
    ).rejects.toMatchObject({ code: "reviewer_note_required" });
  });

  it("enqueues an applicant notification whose body never carries the internal_note", async () => {
    const recorder: Recorder = {
      profile: {
        app_user_id: "user-1",
        application_status: "under_review",
        id: "tp-5",
      },
      profileUpdates: [],
      reviewInserts: [],
      reviewDeletes: 0,
      roleUpdates: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await requestTutorApplicationChanges({
      applicationId: "tp-5",
      internalNote: "Possible duplicate account — verify identity.",
      reviewerAppUserId: "admin-1",
      reviewerNote: "Please add a clearer headline.",
    });

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    const payload = mockCreateNotification.mock.calls[0]?.[0];
    expect(payload).toBeDefined();
    expect(payload.notificationType).toBe("tutor_application_reviewed");
    expect(payload.appUserId).toBe("user-1");
    expect(payload.objectId).toBe("tp-5");
    // The internal note must never appear in either the title or the body.
    expect(payload.title.toLowerCase()).not.toContain("possible duplicate");
    expect(payload.bodySummary.toLowerCase()).not.toContain("possible duplicate");
    // The reviewer note (applicant-visible) is allowed in the body.
    expect(payload.bodySummary).toContain("clearer headline");

    expect(recorder.reviewInserts[0]).toMatchObject({
      internal_note: "Possible duplicate account — verify identity.",
      review_status: "changes_requested",
      reviewer_note: "Please add a clearer headline.",
    });
  });
});
