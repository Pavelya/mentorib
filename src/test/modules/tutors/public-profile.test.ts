import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAuthConfigured: () => true,
}));

vi.mock("@/modules/reviews", async () => {
  const actual =
    await vi.importActual<typeof import("@/modules/reviews")>("@/modules/reviews");
  return {
    ...actual,
    getPublicTutorReviewSummary: vi.fn(async () =>
      actual.buildEmptyPublicTutorReviewSummary(),
    ),
  };
});

vi.mock("@/modules/tutors/examiner-credentials", () => ({
  loadExaminerBadgesForTutor: vi.fn(async () => []),
}));

vi.mock("@/modules/reference/catalog", () => ({
  loadReferenceSubjectsByIds: vi.fn(async () => [
    { id: "subj-bio", displayName: "Biology HL", slug: "biology-hl" },
  ]),
  loadReferenceSubjectFocusAreasByIds: vi.fn(async () => [
    {
      id: "focus-ia",
      displayName: "HL Internal Assessment",
      slug: "hl-internal-assessment",
    },
  ]),
  loadReferenceLanguagesByCodes: vi.fn(async () => [
    { displayName: "English", languageCode: "en" },
  ]),
}));

import { getPublicTutorProfileBySlug } from "@/modules/tutors/public-profile";

const SLUG = "maya-chen";
const APP_USER_ID = "11111111-1111-4111-8111-111111111111";
const TUTOR_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

type TutorProfileRow = {
  app_user_id: string;
  application_status: string;
  bio: string | null;
  headline: string | null;
  id: string;
  intro_video_external_id: string | null;
  intro_video_provider: string | null;
  intro_video_publication_status: "hidden" | "published";
  intro_video_url: string | null;
  pricing_summary: string | null;
  trial_price_minor: number | null;
  hourly_rate_minor: number | null;
  currency_code: string | null;
  profile_visibility_status: string;
  public_listing_status: string;
  public_slug: string | null;
  updated_at: string;
};

type PublishedPhotoRow = {
  storage_object_path: string;
  alt_text: string | null;
  publication_status: "uploaded" | "pending_review" | "approved" | "published" | "hidden";
};

type Scenario = {
  profile: TutorProfileRow;
  account: { full_name: string | null; avatar_url: string | null } | null;
  publishedPhoto: PublishedPhotoRow | null;
  subjects: Array<{
    tutor_profile_id: string;
    subject_id: string;
    subject_focus_area_id: string;
    experience_summary: string | null;
    display_priority: number;
  }>;
  languages: Array<{
    tutor_profile_id: string;
    language_code: string;
    display_priority: number;
  }>;
  credentials: Array<{
    tutor_profile_id: string;
    title: string;
    issuing_body: string | null;
  }>;
  schedule:
    | { tutor_profile_id: string; timezone: string; is_accepting_new_students: boolean }
    | null;
};

function makeProfileRow(overrides: Partial<TutorProfileRow> = {}): TutorProfileRow {
  return {
    app_user_id: APP_USER_ID,
    application_status: "approved",
    bio: "Helps IB students with HL Biology IAs and exam rescue.",
    headline: "Biology HL examiner",
    id: TUTOR_PROFILE_ID,
    intro_video_external_id: null,
    intro_video_provider: null,
    intro_video_publication_status: "hidden",
    intro_video_url: null,
    pricing_summary: null,
    trial_price_minor: 4000,
    hourly_rate_minor: 6000,
    currency_code: "USD",
    profile_visibility_status: "public_visible",
    public_listing_status: "listed",
    public_slug: SLUG,
    updated_at: "2026-05-15T10:00:00.000Z",
    ...overrides,
  };
}

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    profile: makeProfileRow(),
    account: { full_name: "Maya Chen", avatar_url: "https://avatars.example/maya.png" },
    publishedPhoto: null,
    subjects: [
      {
        tutor_profile_id: TUTOR_PROFILE_ID,
        subject_id: "subj-bio",
        subject_focus_area_id: "focus-ia",
        experience_summary: "Five years of IA coaching.",
        display_priority: 0,
      },
    ],
    languages: [
      {
        tutor_profile_id: TUTOR_PROFILE_ID,
        language_code: "en",
        display_priority: 0,
      },
    ],
    credentials: [
      {
        tutor_profile_id: TUTOR_PROFILE_ID,
        title: "IB Biology HL",
        issuing_body: "International Baccalaureate",
      },
    ],
    schedule: {
      tutor_profile_id: TUTOR_PROFILE_ID,
      timezone: "Europe/London",
      is_accepting_new_students: true,
    },
    ...overrides,
  };
}

function buildClient(scenario: Scenario) {
  function tutorProfilesQuery() {
    let filterSlug: string | null = null;
    const builder: Record<string, unknown> = {};
    builder.select = () => chainable;
    builder.eq = (column: string, value: string) => {
      if (column === "public_slug") filterSlug = value;
      return chainable;
    };
    builder.maybeSingle = async () => {
      if (filterSlug && filterSlug === scenario.profile.public_slug) {
        return { data: scenario.profile, error: null };
      }
      return { data: null, error: null };
    };
    const chainable = builder as typeof builder;
    return chainable;
  }

  function appUsersQuery() {
    const builder: Record<string, unknown> = {};
    builder.select = () => chainable;
    builder.eq = () => chainable;
    builder.maybeSingle = async () => ({
      data: scenario.account,
      error: null,
    });
    const chainable = builder as typeof builder;
    return chainable;
  }

  function staticQuery(data: unknown, kind: "list" | "single") {
    const builder: Record<string, unknown> = {};
    builder.select = () => chainable;
    builder.eq = () => chainable;
    builder.order = () => chainable;
    builder.returns = async () => ({ data, error: null });
    builder.maybeSingle = async () => ({ data, error: null });
    void kind;
    const chainable = builder as typeof builder;
    return chainable;
  }

  return {
    from(table: string) {
      switch (table) {
        case "tutor_profiles":
          return tutorProfilesQuery();
        case "app_users":
          return appUsersQuery();
        case "tutor_subject_capabilities":
          return staticQuery(scenario.subjects, "list");
        case "tutor_language_capabilities":
          return staticQuery(scenario.languages, "list");
        case "tutor_credentials":
          return staticQuery(scenario.credentials, "list");
        case "schedule_policies":
          return staticQuery(scenario.schedule, "single");
        case "tutor_public_media_assets":
          return staticQuery(scenario.publishedPhoto, "single");
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    },
    storage: {
      from(bucket: string) {
        return {
          getPublicUrl: (path: string) => ({
            data: { publicUrl: `https://public.example/${bucket}/${path}` },
          }),
        };
      },
    },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function collectStringValues(value: unknown, sink: string[]): void {
  if (typeof value === "string") {
    sink.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringValues(item, sink);
    return;
  }
  if (isPlainObject(value)) {
    for (const item of Object.values(value)) collectStringValues(item, sink);
  }
}

function collectKeys(value: unknown, sink: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, sink);
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, val] of Object.entries(value)) {
      sink.push(key);
      collectKeys(val, sink);
    }
  }
}

beforeEach(() => {
  mockServiceRoleClient.mockReset();
});

describe("getPublicTutorProfileBySlug DTO safety", () => {
  it("never carries storage_object_path or unpublished media URLs", async () => {
    const scenario = makeScenario({
      publishedPhoto: null, // No published photo.
    });
    mockServiceRoleClient.mockImplementation(() => buildClient(scenario));

    const dto = await getPublicTutorProfileBySlug(SLUG);
    expect(dto).not.toBeNull();

    const keys: string[] = [];
    collectKeys(dto, keys);
    expect(keys).not.toContain("storage_object_path");
    expect(keys).not.toContain("storageObjectPath");

    const values: string[] = [];
    collectStringValues(dto, values);
    expect(values.every((value) => !value.includes("storage_object_path"))).toBe(true);

    expect(dto?.profilePhoto).toBeNull();
    expect(dto?.primaryImage).toBeNull();
  });

  it("exposes the published M2 photo URL only when published AND indexability passes", async () => {
    const scenario = makeScenario({
      publishedPhoto: {
        storage_object_path: "tutor/22.../photo.jpg",
        alt_text: "Maya Chen smiling at her desk",
        publication_status: "published",
      },
    });
    mockServiceRoleClient.mockImplementation(() => buildClient(scenario));

    const dto = await getPublicTutorProfileBySlug(SLUG);
    expect(dto?.profilePhoto).toEqual({
      alt: "Maya Chen smiling at her desk",
      url: expect.stringContaining("/tutor-public-media/tutor/22.../photo.jpg"),
    });
    expect(dto?.primaryImage?.url).toBe(dto?.profilePhoto?.url);
    expect(dto?.accountAvatarUrl).toBe("https://avatars.example/maya.png");
  });

  it("never carries intro_video_* fields when intro_video_publication_status is not 'published'", async () => {
    const scenario = makeScenario({
      profile: makeProfileRow({
        intro_video_provider: "youtube",
        intro_video_external_id: "dQw4w9WgXcQ",
        intro_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        intro_video_publication_status: "hidden",
      }),
      publishedPhoto: {
        storage_object_path: "tutor/22.../photo.jpg",
        alt_text: "Maya Chen profile photo",
        publication_status: "published",
      },
    });
    mockServiceRoleClient.mockImplementation(() => buildClient(scenario));

    const dto = await getPublicTutorProfileBySlug(SLUG);
    expect(dto?.introVideo).toBeNull();

    const values: string[] = [];
    collectStringValues(dto, values);
    expect(values.every((value) => !value.includes("dQw4w9WgXcQ"))).toBe(true);
    expect(values.every((value) => !value.includes("youtube"))).toBe(true);
  });

  it("indexability gate failure suppresses both the photo URL and the intro-video reference", async () => {
    // Wipe trust signals and subject capabilities to fail the indexability
    // gate. Both the published photo and the published intro video must be
    // suppressed even though each is individually 'published'.
    const scenario = makeScenario({
      subjects: [],
      credentials: [],
      profile: makeProfileRow({
        profile_visibility_status: "private_only", // suppresses derived trust proof
        intro_video_provider: "youtube",
        intro_video_external_id: "dQw4w9WgXcQ",
        intro_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        intro_video_publication_status: "published",
      }),
      publishedPhoto: {
        storage_object_path: "tutor/22.../photo.jpg",
        alt_text: "Maya Chen profile photo",
        publication_status: "published",
      },
    });
    // The base record query filters on listed/visible/approved, so to reach
    // the DTO builder with a gate-failing profile we patch the row directly
    // to bypass those filter checks in the recorder.
    mockServiceRoleClient.mockImplementation(() =>
      buildClient({
        ...scenario,
        profile: makeProfileRow({
          ...scenario.profile,
          // Keep filterable fields satisfied so the row is selected; the
          // failure mode tested here is the indexability gate itself.
          profile_visibility_status: "public_visible",
          public_listing_status: "listed",
        }),
      }),
    );

    const dto = await getPublicTutorProfileBySlug(SLUG);
    expect(dto?.profilePhoto).toBeNull();
    expect(dto?.introVideo).toBeNull();
    expect(dto?.primaryImage).toBeNull();
  });
});
