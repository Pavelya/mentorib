import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTutorApplication = vi.fn();
const mockServiceRoleClient = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/modules/tutors/application", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/tutors/application")
  >("@/modules/tutors/application");
  return {
    ...actual,
    getTutorApplication: (...args: unknown[]) =>
      mockGetTutorApplication(...args),
  };
});

import { getTutorProfileEditor } from "@/modules/tutors/tutor-profile-editor";

function buildSelfPausedClient(value: string | null) {
  return {
    from() {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({
          data: { self_paused_at: value },
          error: null,
        }),
      };
      return chain;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getTutorProfileEditor DTO", () => {
  it("never carries internal moderation state (reviewerNote, internal_note, or unrelated tutors' rows)", async () => {
    mockServiceRoleClient.mockReturnValue(buildSelfPausedClient(null));
    mockGetTutorApplication.mockResolvedValue({
      applicationStatus: "approved",
      options: { focusAreas: [], languages: [], subjects: [] },
      profile: {
        capabilities: [],
        draft: {
          bio: "Bio",
          fullName: "Maya",
          focusAreaCodes: [],
          headline: "Headline",
          hourlyRateMajor: "60",
          languageCodes: [],
          subjectCodes: [],
          timezone: "Europe/Warsaw",
        },
        hasMeetingLink: true,
        hasScheduleRules: true,
        payoutReadinessStatus: "enabled",
        publicListingStatus: "listed",
        publicSlug: "maya",
      },
      readinessGates: [
        {
          description: "",
          key: "applicationApproved",
          label: "Application approved",
          state: "complete",
        },
      ],
      // application.ts attaches a reviewNote field for changes_requested/rejected;
      // the editor DTO MUST NOT propagate it.
      reviewNote: "Please add a clearer headline.",
      state: "ready",
      submittedAt: null,
    });

    const dto = await getTutorProfileEditor({
      full_name: "Maya",
      id: "user-1",
      timezone: "Europe/Warsaw",
    });

    const dtoRecord = dto as unknown as Record<string, unknown>;
    expect(dtoRecord.reviewNote).toBeUndefined();
    expect(dtoRecord.applicantVisibleReviewerNote).toBeUndefined();
    expect(dtoRecord.internal_note).toBeUndefined();
    expect(dtoRecord.tutor_application_reviews).toBeUndefined();
    expect(dtoRecord.review_status).toBeUndefined();
    expect(dto.applicationStatus).toBe("approved");
  });

  it("surfaces admin-hold canonical copy when public_listing_status is paused", async () => {
    mockServiceRoleClient.mockReturnValue(buildSelfPausedClient(null));
    mockGetTutorApplication.mockResolvedValue({
      applicationStatus: "approved",
      options: { focusAreas: [], languages: [], subjects: [] },
      profile: {
        capabilities: [],
        draft: {
          bio: "",
          fullName: "",
          focusAreaCodes: [],
          headline: "",
          hourlyRateMajor: "",
          languageCodes: [],
          subjectCodes: [],
          timezone: "",
        },
        hasMeetingLink: true,
        hasScheduleRules: true,
        payoutReadinessStatus: "enabled",
        publicListingStatus: "paused",
        publicSlug: "maya",
      },
      readinessGates: [],
      reviewNote: null,
      state: "ready",
      submittedAt: null,
    });

    const dto = await getTutorProfileEditor({
      full_name: "Maya",
      id: "user-1",
      timezone: "Europe/Warsaw",
    });

    expect(dto.adminHold).not.toBeNull();
    expect(dto.adminHold?.status).toBe("paused");
    expect(dto.adminHold?.message).toContain("temporarily paused");
    expect(dto.canPublish).toBe(false);
  });

  it("populates selfPausedAt and canPublish=false until a gate is fixed", async () => {
    mockServiceRoleClient.mockReturnValue(
      buildSelfPausedClient("2026-05-10T12:00:00Z"),
    );
    mockGetTutorApplication.mockResolvedValue({
      applicationStatus: "approved",
      options: { focusAreas: [], languages: [], subjects: [] },
      profile: {
        capabilities: [],
        draft: {
          bio: "",
          fullName: "",
          focusAreaCodes: [],
          headline: "",
          hourlyRateMajor: "",
          languageCodes: [],
          subjectCodes: [],
          timezone: "",
        },
        hasMeetingLink: false,
        hasScheduleRules: false,
        payoutReadinessStatus: "not_started",
        publicListingStatus: "not_listed",
        publicSlug: "maya",
      },
      readinessGates: [
        {
          description: "",
          key: "meetingLink",
          label: "Meeting link",
          state: "in_progress",
        },
        {
          description: "",
          key: "applicationApproved",
          label: "Application approved",
          state: "complete",
        },
      ],
      reviewNote: null,
      state: "ready",
      submittedAt: null,
    });

    const dto = await getTutorProfileEditor({
      full_name: "Maya",
      id: "user-1",
      timezone: "Europe/Warsaw",
    });

    expect(dto.selfPausedAt).toBe("2026-05-10T12:00:00Z");
    expect(dto.canPublish).toBe(false);
    expect(dto.missingGateKeys).toContain("meetingLink");
  });
});
