import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();
const mockCreateListingNotification = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/modules/notifications/lifecycle", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/notifications/lifecycle")
  >("@/modules/notifications/lifecycle");
  return {
    ...actual,
    createTutorListingStatusChangedNotification: (...args: unknown[]) =>
      mockCreateListingNotification(...args),
  };
});

// `loadEditorOptions` calls into the reference-data catalog; stub the loaders
// with a minimal valid set so validateTutorApplicationDraft can accept the
// test draft below.
vi.mock("@/modules/reference/catalog", () => ({
  loadActiveReferenceSubjects: async () => [
    {
      id: "subj-1",
      subjectCode: "BIO_HL",
      displayName: "Biology HL",
      sortOrder: 1,
    },
  ],
  loadActiveReferenceSubjectFocusAreas: async () => [
    {
      id: "focus-1",
      focusAreaCode: "PAPER_PREP",
      displayName: "Paper preparation",
      sortOrder: 1,
    },
  ],
  loadActiveReferenceLanguages: async () => [
    {
      languageCode: "en",
      displayName: "English",
      sortOrder: 1,
    },
  ],
  loadActiveReferenceLearningNeedOptionValues: async () => [
    {
      allowedSubjectCodes: ["BIO_HL"],
      displayLabel: "Paper preparation",
      helperText: null,
      optionGroup: "need_type",
      optionKey: "paper_prep",
      sortOrder: 1,
      subjectFocusAreaCode: "PAPER_PREP",
    },
  ],
}));

import {
  TutorProfileEditorError,
  setTutorListingPublication,
  updateTutorProfile,
} from "@/modules/tutors/tutor-profile-editor-service";

type ProfileRow = {
  app_user_id: string;
  application_status: string;
  bio: string | null;
  currency_code: string;
  headline: string | null;
  hourly_rate_minor: number | null;
  id: string;
  payout_readiness_status: string;
  public_listing_status: string;
  public_slug: string | null;
  self_paused_at: string | null;
};

type Recorder = {
  profile: ProfileRow;
  profileUpdates: Array<Record<string, unknown>>;
  capabilityCount: number;
  hasScheduleRule: boolean;
  scheduleTimezone: string | null;
  meetingUrl: string | null;
  meetingActive: boolean;
  appUserFullName: string | null;
};

function buildClient(recorder: Recorder) {
  function fromTable(table: string) {
    let action: "select" | "update" | "insert" | "delete" | "upsert" | null =
      null;
    let pendingPayload: Record<string, unknown> | null = null;
    let countMode = false;

    const builder: Record<string, unknown> = {};

    builder.select = (_columns?: string, options?: { count?: string; head?: boolean }) => {
      action = "select";
      countMode = Boolean(options?.count);
      return chainable;
    };
    builder.update = (payload: Record<string, unknown>) => {
      action = "update";
      pendingPayload = payload;
      if (table === "tutor_profiles") {
        recorder.profileUpdates.push(payload);
      }
      return chainable;
    };
    builder.insert = async () => ({ error: null });
    builder.upsert = (payload: Record<string, unknown>) => {
      action = "upsert";
      pendingPayload = payload;
      return chainable;
    };
    builder.delete = () => {
      action = "delete";
      return chainable;
    };
    builder.eq = () => chainable;
    builder.in = () => chainable;
    builder.order = () => chainable;
    builder.limit = () => chainable;
    builder.maybeSingle = async () => {
      if (table === "tutor_profiles" && action === "select") {
        return { data: recorder.profile, error: null };
      }
      if (table === "schedule_policies" && action === "select") {
        return {
          data: recorder.scheduleTimezone
            ? { timezone: recorder.scheduleTimezone }
            : null,
          error: null,
        };
      }
      if (table === "tutor_meeting_preferences" && action === "select") {
        return {
          data: recorder.meetingUrl
            ? {
                default_meeting_url: recorder.meetingUrl,
                is_active: recorder.meetingActive,
              }
            : null,
          error: null,
        };
      }
      if (table === "app_users" && action === "select") {
        return {
          data: recorder.appUserFullName
            ? { full_name: recorder.appUserFullName }
            : null,
          error: null,
        };
      }
      return { data: null, error: null };
    };
    builder.returns = async () => ({ data: [], error: null });

    const chainable: typeof builder & PromiseLike<{
      count?: number | null;
      data: unknown;
      error: unknown;
    }> = Object.assign(builder, {
      then: (onFulfilled: (v: { count?: number | null; data: unknown; error: unknown }) => unknown) => {
        if (countMode) {
          // head:true select returns a count, used for tutor_subject_capabilities
          // and availability_rules.
          if (table === "tutor_subject_capabilities") {
            return Promise.resolve({
              count: recorder.capabilityCount,
              data: null,
              error: null,
            }).then(onFulfilled);
          }
          if (table === "availability_rules") {
            return Promise.resolve({
              count: recorder.hasScheduleRule ? 1 : 0,
              data: null,
              error: null,
            }).then(onFulfilled);
          }
        }
        // For mutations, settle the chain like the real client.
        if (action === "update" || action === "upsert" || action === "delete") {
          void pendingPayload;
          return Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }
        return Promise.resolve({ data: null, error: null }).then(onFulfilled);
      },
    }) as typeof chainable;
    return chainable;
  }

  return {
    from(table: string) {
      return fromTable(table);
    },
  };
}

function makeProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    app_user_id: "user-1",
    application_status: "approved",
    bio: "Experienced IB Biology tutor with examiner background.",
    currency_code: "USD",
    headline: "IB Biology HL Examiner",
    hourly_rate_minor: 6000,
    id: "tp-1",
    payout_readiness_status: "enabled",
    public_listing_status: "not_listed",
    public_slug: "maya-chen",
    self_paused_at: null,
    ...overrides,
  };
}

function makeRecorder(overrides: Partial<Recorder> = {}): Recorder {
  return {
    profile: makeProfile(),
    profileUpdates: [],
    capabilityCount: 2,
    hasScheduleRule: true,
    scheduleTimezone: "Europe/Warsaw",
    meetingUrl: "https://meet.example.com/maya",
    meetingActive: true,
    appUserFullName: "Maya Chen",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateListingNotification.mockResolvedValue({ id: "notif-1" });
});

describe("setTutorListingPublication", () => {
  it("publishes when all readiness gates pass", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorListingPublication(
      { id: "user-1" },
      "publish",
    );

    expect(result.publicListingStatus).toBe("listed");
    expect(recorder.profileUpdates).toHaveLength(1);
    expect(recorder.profileUpdates[0]).toMatchObject({
      public_listing_status: "listed",
      self_paused_at: null,
    });
    expect(mockCreateListingNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateListingNotification.mock.calls[0][0]).toMatchObject({
      publicListingStatus: "listed",
      reason: "self",
    });
  });

  it("returns conflict with the failing gate keys when a gate is missing", async () => {
    const recorder = makeRecorder({ meetingUrl: null, meetingActive: false });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorListingPublication({ id: "user-1" }, "publish"),
    ).rejects.toMatchObject({
      code: "conflict",
      missingGateKeys: expect.arrayContaining(["meetingLink"]),
    });
    expect(recorder.profileUpdates).toHaveLength(0);
    expect(mockCreateListingNotification).not.toHaveBeenCalled();
  });

  it("self-pauses a listed profile and records self_paused_at", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({ public_listing_status: "listed" }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorListingPublication(
      { id: "user-1" },
      "self_pause",
    );

    expect(result.publicListingStatus).toBe("not_listed");
    expect(recorder.profileUpdates).toHaveLength(1);
    const update = recorder.profileUpdates[0];
    expect(update.public_listing_status).toBe("not_listed");
    expect(typeof update.self_paused_at).toBe("string");
    expect(mockCreateListingNotification.mock.calls[0][0]).toMatchObject({
      publicListingStatus: "not_listed",
      reason: "self",
    });
  });

  it("rejects self_pause when the profile is not currently listed", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorListingPublication({ id: "user-1" }, "self_pause"),
    ).rejects.toMatchObject({ code: "not_listed" });
  });

  it("resumes a self-paused profile back to listed when gates pass", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({
        public_listing_status: "not_listed",
        self_paused_at: new Date().toISOString(),
      }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorListingPublication(
      { id: "user-1" },
      "resume",
    );

    expect(result.publicListingStatus).toBe("listed");
    expect(recorder.profileUpdates[0]).toMatchObject({
      public_listing_status: "listed",
      self_paused_at: null,
    });
  });

  it("blocks every action with admin_hold when public_listing_status is paused", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({ public_listing_status: "paused" }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    for (const action of ["publish", "self_pause", "resume"] as const) {
      await expect(
        setTutorListingPublication({ id: "user-1" }, action),
      ).rejects.toBeInstanceOf(TutorProfileEditorError);
    }
    expect(recorder.profileUpdates).toHaveLength(0);
  });

  it("blocks every action with admin_hold when public_listing_status is delisted", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({ public_listing_status: "delisted" }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    for (const action of ["publish", "self_pause", "resume"] as const) {
      await expect(
        setTutorListingPublication({ id: "user-1" }, action),
      ).rejects.toMatchObject({ code: "admin_hold" });
    }
  });

  it("rejects publication when the application is not approved", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({ application_status: "submitted" }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorListingPublication({ id: "user-1" }, "publish"),
    ).rejects.toMatchObject({ code: "application_not_approved" });
  });
});

describe("updateTutorProfile auto-flip", () => {
  const validDraft = {
    bio: "Updated bio about my IB teaching approach.",
    fullName: "Maya Chen",
    focusAreaCodes: ["PAPER_PREP"],
    headline: "Updated headline",
    hourlyRateMajor: "65",
    languageCodes: ["en"],
    subjectCodes: ["BIO_HL"],
    timezone: "Europe/Warsaw",
  };

  it("auto-flips listed → not_listed when a content gate regresses and enqueues notification with missing gate keys", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({ public_listing_status: "listed" }),
      meetingUrl: null,
      meetingActive: false,
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await updateTutorProfile({ id: "user-1" }, validDraft);

    expect(result.autoPaused).toBe(true);
    expect(result.publicListingStatus).toBe("not_listed");
    const flipUpdate = recorder.profileUpdates.find(
      (update) => update.public_listing_status === "not_listed",
    );
    expect(flipUpdate).toBeDefined();
    expect(mockCreateListingNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateListingNotification.mock.calls[0][0]).toMatchObject({
      publicListingStatus: "not_listed",
      reason: "gate_regression",
    });
    expect(
      mockCreateListingNotification.mock.calls[0][0].missingGateKeys,
    ).toEqual(expect.arrayContaining(["meetingLink"]));
  });

  it("keeps listed status when all gates still pass after an edit", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({ public_listing_status: "listed" }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await updateTutorProfile({ id: "user-1" }, validDraft);

    expect(result.autoPaused).toBe(false);
    expect(result.publicListingStatus).toBe("listed");
    const flipUpdate = recorder.profileUpdates.find(
      (update) => update.public_listing_status === "not_listed",
    );
    expect(flipUpdate).toBeUndefined();
    expect(mockCreateListingNotification).not.toHaveBeenCalled();
  });

  it("never touches application_status during a profile edit", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({ public_listing_status: "listed" }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await updateTutorProfile({ id: "user-1" }, validDraft);

    for (const update of recorder.profileUpdates) {
      expect(update.application_status).toBeUndefined();
    }
  });
});
