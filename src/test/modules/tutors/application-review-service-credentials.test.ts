import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();
const mockCreateNotification = vi.fn();
const mockScheduleEmail = vi.fn();
const mockRevalidatePath = vi.fn();
const mockSyncPublicTutorRecord = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

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

vi.mock("@/modules/search/public-tutor-indexer", () => ({
  syncPublicTutorRecord: (...args: unknown[]) =>
    mockSyncPublicTutorRecord(...args),
}));

import {
  TUTOR_CREDENTIAL_REJECTION_COPY,
  TutorApplicationReviewError,
  setTutorCredentialReviewStatus,
} from "@/modules/tutors/application-review-service";

const CREDENTIAL_ID = "44444444-4444-4444-4444-444444444444";
const TUTOR_PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const APP_USER_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_USER_ID = "55555555-5555-4555-8555-555555555555";

type CredentialRow = {
  id: string;
  tutor_profile_id: string;
  review_status: "uploaded" | "pending_review" | "approved" | "rejected" | "expired";
  reviewed_at: string | null;
};

type ProfileRow = {
  id: string;
  app_user_id: string;
  application_status: "approved";
};

type Recorder = {
  credential: CredentialRow | null;
  profile: ProfileRow | null;
  credentialUpdates: Array<Record<string, unknown>>;
  auditInserts: Array<Record<string, unknown>>;
  credentialUpdateError?: unknown;
  auditInsertError?: unknown;
};

function makeCredential(
  overrides: Partial<CredentialRow> = {},
): CredentialRow {
  return {
    id: CREDENTIAL_ID,
    tutor_profile_id: TUTOR_PROFILE_ID,
    review_status: "pending_review",
    reviewed_at: null,
    ...overrides,
  };
}

function buildClient(recorder: Recorder) {
  function fromTable(table: string) {
    let action: "select" | "insert" | "update" | null = null;
    let pendingPayload: Record<string, unknown> | null = null;

    const builder: Record<string, unknown> = {};
    builder.select = () => {
      action = "select";
      return chainable;
    };
    builder.insert = async (payload: Record<string, unknown>) => {
      if (table === "tutor_application_reviews") {
        if (recorder.auditInsertError) {
          return { error: recorder.auditInsertError };
        }
        recorder.auditInserts.push(payload);
        return { error: null };
      }
      return { error: null };
    };
    builder.update = (payload: Record<string, unknown>) => {
      action = "update";
      pendingPayload = payload;
      return chainable;
    };
    builder.eq = () => chainable;
    builder.order = () => chainable;
    builder.limit = () => chainable;
    builder.returns = async () => ({ data: null, error: null });
    builder.maybeSingle = async () => {
      if (table === "tutor_credentials" && action === "select") {
        return { data: recorder.credential, error: null };
      }
      if (table === "tutor_profiles" && action === "select") {
        return { data: recorder.profile, error: null };
      }
      return { data: null, error: null };
    };

    const chainable = builder as Record<string, unknown> & {
      then: (
        onFulfilled?: ((value: { error: unknown }) => unknown) | null,
        onRejected?: ((reason: unknown) => unknown) | null,
      ) => Promise<unknown>;
    };
    chainable.then = (onFulfilled, onRejected) => {
      const resolveValue = (): { error: unknown } => {
        if (action === "update" && table === "tutor_credentials") {
          if (recorder.credentialUpdateError) {
            return { error: recorder.credentialUpdateError };
          }
          if (pendingPayload && recorder.credential) {
            recorder.credentialUpdates.push(pendingPayload);
            recorder.credential = {
              ...recorder.credential,
              review_status: (pendingPayload.review_status ??
                recorder.credential.review_status) as CredentialRow["review_status"],
              reviewed_at:
                pendingPayload.reviewed_at !== undefined
                  ? (pendingPayload.reviewed_at as string | null)
                  : recorder.credential.reviewed_at,
            };
          }
        }
        return { error: null };
      };
      return Promise.resolve(resolveValue()).then(
        onFulfilled ?? undefined,
        onRejected ?? undefined,
      );
    };

    return chainable;
  }

  return {
    from(table: string) {
      return fromTable(table);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateNotification.mockResolvedValue({
    id: "notif-1",
    notification_type: "tutor_credential_reviewed",
  });
  mockScheduleEmail.mockResolvedValue(undefined);
  mockSyncPublicTutorRecord.mockResolvedValue(undefined);
});

describe("setTutorCredentialReviewStatus — approve", () => {
  it("flips review_status to approved with reviewed_at=now and inserts an audit row", async () => {
    const recorder: Recorder = {
      credential: makeCredential({ review_status: "pending_review" }),
      profile: {
        app_user_id: APP_USER_ID,
        application_status: "approved",
        id: TUTOR_PROFILE_ID,
      },
      credentialUpdates: [],
      auditInserts: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorCredentialReviewStatus({
      action: "approve",
      credentialId: CREDENTIAL_ID,
      internalNote: "Verified IB examiner roster 2026.",
      reviewerAppUserId: ADMIN_USER_ID,
    });

    expect(result.reviewStatus).toBe("approved");
    expect(recorder.credentialUpdates).toHaveLength(1);
    const update = recorder.credentialUpdates[0]!;
    expect(update.review_status).toBe("approved");
    // _reviewed_at_consistency_chk: terminal states require a non-null timestamp.
    expect(update.reviewed_at).toEqual(expect.any(String));

    expect(recorder.auditInserts).toHaveLength(1);
    const auditRow = recorder.auditInserts[0]!;
    expect(auditRow.review_status).toBe("approved");
    expect(auditRow.tutor_profile_id).toBe(TUTOR_PROFILE_ID);
    expect(auditRow.reviewer_app_user_id).toBe(ADMIN_USER_ID);
    expect(auditRow.internal_note).toContain(CREDENTIAL_ID);
    expect(auditRow.internal_note).toContain("approve");
    expect(auditRow.internal_note).toContain("Verified IB examiner roster 2026.");

    // tutor_credential_reviewed notification is fanned out and the public
    // tutor route is revalidated so buildTrustProofs picks up the change.
    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    const notificationPayload = mockCreateNotification.mock.calls[0]?.[0];
    expect(notificationPayload.notificationType).toBe("tutor_credential_reviewed");
    expect(notificationPayload.appUserId).toBe(APP_USER_ID);
    expect(notificationPayload.objectId).toBe(CREDENTIAL_ID);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutors/[slug]", "page");
    expect(mockSyncPublicTutorRecord).toHaveBeenCalledWith(TUTOR_PROFILE_ID);
  });
});

describe("setTutorCredentialReviewStatus — reject", () => {
  it("uses the J-TUT-016 canonical copy and writes reviewed_at=now", async () => {
    const recorder: Recorder = {
      credential: makeCredential({ review_status: "pending_review" }),
      profile: {
        app_user_id: APP_USER_ID,
        application_status: "approved",
        id: TUTOR_PROFILE_ID,
      },
      credentialUpdates: [],
      auditInserts: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await setTutorCredentialReviewStatus({
      action: "reject",
      credentialId: CREDENTIAL_ID,
      internalNote: "Issuer not on accepted list.",
      reviewerAppUserId: ADMIN_USER_ID,
    });

    const update = recorder.credentialUpdates[0]!;
    expect(update.review_status).toBe("rejected");
    expect(update.reviewed_at).toEqual(expect.any(String));

    const auditRow = recorder.auditInserts[0]!;
    expect(auditRow.review_status).toBe("rejected");
    // Audit row carries the canonical user-visible copy as reviewer_note to
    // satisfy tutor_application_reviews_reviewer_note_required_chk.
    expect(auditRow.reviewer_note).toBe(TUTOR_CREDENTIAL_REJECTION_COPY);
    expect(auditRow.internal_note).toContain("Issuer not on accepted list.");

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    const notificationPayload = mockCreateNotification.mock.calls[0]?.[0];
    expect(notificationPayload.notificationType).toBe("tutor_credential_reviewed");
    expect(notificationPayload.bodySummary).toBe(TUTOR_CREDENTIAL_REJECTION_COPY);

    // Rejection does not retroactively update the public profile beyond what
    // buildTrustProofs already excluded — no revalidate on /tutors/[slug].
    expect(mockRevalidatePath).not.toHaveBeenCalledWith("/tutors/[slug]", "page");
  });
});

describe("setTutorCredentialReviewStatus — mark_expired", () => {
  it("sets review_status='expired' with reviewed_at=now and notifies the tutor", async () => {
    const recorder: Recorder = {
      credential: makeCredential({ review_status: "approved" }),
      profile: {
        app_user_id: APP_USER_ID,
        application_status: "approved",
        id: TUTOR_PROFILE_ID,
      },
      credentialUpdates: [],
      auditInserts: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await setTutorCredentialReviewStatus({
      action: "mark_expired",
      credentialId: CREDENTIAL_ID,
      internalNote: "Expired per published cycle.",
      reviewerAppUserId: ADMIN_USER_ID,
    });

    const update = recorder.credentialUpdates[0]!;
    expect(update.review_status).toBe("expired");
    expect(update.reviewed_at).toEqual(expect.any(String));

    const auditRow = recorder.auditInserts[0]!;
    // `expired` is not in tutor_application_reviews_review_status_chk; the
    // audit row labels the act as `under_review` to stay constraint-valid.
    expect(auditRow.review_status).toBe("under_review");
    expect(auditRow.internal_note).toContain("mark_expired");

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateNotification.mock.calls[0]?.[0].notificationType).toBe(
      "tutor_credential_reviewed",
    );
  });
});

describe("setTutorCredentialReviewStatus — request_update", () => {
  it("sets review_status='pending_review' with reviewed_at=null (non-terminal)", async () => {
    const recorder: Recorder = {
      credential: makeCredential({ review_status: "approved" }),
      profile: {
        app_user_id: APP_USER_ID,
        application_status: "approved",
        id: TUTOR_PROFILE_ID,
      },
      credentialUpdates: [],
      auditInserts: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await setTutorCredentialReviewStatus({
      action: "request_update",
      credentialId: CREDENTIAL_ID,
      reviewerAppUserId: ADMIN_USER_ID,
    });

    const update = recorder.credentialUpdates[0]!;
    expect(update.review_status).toBe("pending_review");
    // _reviewed_at_consistency_chk: non-terminal states require reviewed_at=null.
    expect(update.reviewed_at).toBeNull();

    const auditRow = recorder.auditInserts[0]!;
    expect(auditRow.review_status).toBe("changes_requested");
    expect(auditRow.reviewer_note).toEqual(expect.any(String));

    // request_update is non-terminal; we deliberately do not fan out the
    // `tutor_credential_reviewed` notification on this transition.
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });
});

describe("setTutorCredentialReviewStatus — rollback behavior", () => {
  it("rolls back the credential transition when the audit insert fails", async () => {
    const recorder: Recorder = {
      credential: makeCredential({
        review_status: "pending_review",
        reviewed_at: null,
      }),
      profile: {
        app_user_id: APP_USER_ID,
        application_status: "approved",
        id: TUTOR_PROFILE_ID,
      },
      credentialUpdates: [],
      auditInserts: [],
      auditInsertError: { message: "audit boom" },
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorCredentialReviewStatus({
        action: "approve",
        credentialId: CREDENTIAL_ID,
        reviewerAppUserId: ADMIN_USER_ID,
      }),
    ).rejects.toBeInstanceOf(TutorApplicationReviewError);

    // First update flipped to approved; the rollback flipped it back to
    // pending_review with reviewed_at=null.
    expect(recorder.credentialUpdates).toHaveLength(2);
    expect(recorder.credentialUpdates[0]).toMatchObject({
      review_status: "approved",
    });
    expect(recorder.credentialUpdates[1]).toMatchObject({
      review_status: "pending_review",
      reviewed_at: null,
    });
  });

  it("refuses to update a credential id that doesn't exist", async () => {
    const recorder: Recorder = {
      credential: null,
      profile: null,
      credentialUpdates: [],
      auditInserts: [],
    };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorCredentialReviewStatus({
        action: "approve",
        credentialId: CREDENTIAL_ID,
        reviewerAppUserId: ADMIN_USER_ID,
      }),
    ).rejects.toMatchObject({ code: "credential_not_found" });

    expect(recorder.credentialUpdates).toHaveLength(0);
    expect(recorder.auditInserts).toHaveLength(0);
  });
});
