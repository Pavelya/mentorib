import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

import { UNSUPPORTED_VIDEO_LINK_MESSAGE } from "@/modules/tutors/video-providers/errors";
import {
  clearTutorIntroVideo,
  setTutorIntroVideo,
  setTutorIntroVideoPublication,
  TutorIntroVideoServiceError,
} from "@/modules/tutors/media-video-reference-service";
import { getTutorIntroVideoForOwner } from "@/modules/tutors/media-video-reference";

const APP_USER_ID = "11111111-1111-4111-8111-111111111111";
const TUTOR_PROFILE_ID = "22222222-2222-4222-8222-222222222222";

const YOUTUBE_ID = "dQw4w9WgXcQ";
const YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${YOUTUBE_ID}`;
const YOUTUBE_EMBED_URL = `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}`;

const VIMEO_ID = "76979871";
const VIMEO_WATCH_URL = `https://vimeo.com/${VIMEO_ID}`;

const LOOM_ID = "1234567890abcdef1234567890abcdef";
const LOOM_WATCH_URL = `https://www.loom.com/share/${LOOM_ID}`;

type IntroVideoFields = {
  intro_video_provider: string | null;
  intro_video_external_id: string | null;
  intro_video_url: string | null;
  intro_video_publication_status: "hidden" | "published";
  intro_video_last_validated_at: string | null;
};

type ProfileRow = IntroVideoFields & {
  id: string;
  app_user_id: string;
};

type Recorder = {
  profileByAppUser: Map<string, ProfileRow>;
  updates: Array<{ id: string; payload: Record<string, unknown> }>;
  selectError: { message: string } | null;
  updateError: { message: string } | null;
};

function makeProfile(overrides: Partial<IntroVideoFields> = {}): ProfileRow {
  return {
    id: TUTOR_PROFILE_ID,
    app_user_id: APP_USER_ID,
    intro_video_provider: null,
    intro_video_external_id: null,
    intro_video_url: null,
    intro_video_publication_status: "hidden",
    intro_video_last_validated_at: null,
    ...overrides,
  };
}

function makeRecorder(initial?: {
  profile?: ProfileRow | null;
}): Recorder {
  const recorder: Recorder = {
    profileByAppUser: new Map(),
    updates: [],
    selectError: null,
    updateError: null,
  };
  const initialProfile =
    initial?.profile === undefined ? makeProfile() : initial.profile;
  if (initialProfile) {
    recorder.profileByAppUser.set(initialProfile.app_user_id, initialProfile);
  }
  return recorder;
}

function buildClient(recorder: Recorder) {
  function tutorProfilesQuery() {
    let action: "select" | "update" = "select";
    let filterAppUserId: string | null = null;
    let filterId: string | null = null;
    let pendingUpdate: Record<string, unknown> | null = null;

    const builder: Record<string, unknown> = {};
    builder.select = () => {
      action = "select";
      return chainable;
    };
    builder.update = (payload: Record<string, unknown>) => {
      action = "update";
      pendingUpdate = payload;
      return chainable;
    };
    builder.eq = (column: string, value: string) => {
      if (column === "app_user_id") filterAppUserId = value;
      if (column === "id") filterId = value;
      return chainable;
    };
    builder.maybeSingle = async () => {
      if (recorder.selectError) {
        return { data: null, error: recorder.selectError };
      }
      if (!filterAppUserId) {
        return { data: null, error: null };
      }
      const profile = recorder.profileByAppUser.get(filterAppUserId);
      return { data: profile ?? null, error: null };
    };

    const chainable: typeof builder & PromiseLike<{
      data: unknown;
      error: unknown;
    }> = Object.assign(builder, {
      then: (onFulfilled: (v: { data: unknown; error: unknown }) => unknown) => {
        if (action === "update") {
          if (recorder.updateError) {
            return Promise.resolve({
              data: null,
              error: recorder.updateError,
            }).then(onFulfilled);
          }
          if (filterId && pendingUpdate) {
            const found = Array.from(recorder.profileByAppUser.values()).find(
              (row) => row.id === filterId,
            );
            if (found) {
              Object.assign(found, pendingUpdate);
              recorder.updates.push({ id: filterId, payload: pendingUpdate });
            }
          }
          return Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }
        return Promise.resolve({ data: null, error: null }).then(onFulfilled);
      },
    }) as typeof chainable;

    return chainable;
  }

  return {
    from(table: string) {
      if (table === "tutor_profiles") return tutorProfilesQuery();
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("setTutorIntroVideo: URL normalization", () => {
  it("normalizes a YouTube watch URL and writes the canonical values + validated_at", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorIntroVideo(
      { id: APP_USER_ID },
      { providerUrl: YOUTUBE_WATCH_URL },
    );

    expect(result.providerKey).toBe("youtube");
    expect(result.externalId).toBe(YOUTUBE_ID);
    expect(result.canonicalWatchUrl).toBe(YOUTUBE_WATCH_URL);
    expect(typeof result.lastValidatedAt).toBe("string");
    expect(result.lastValidatedAt).not.toHaveLength(0);

    const profile = recorder.profileByAppUser.get(APP_USER_ID)!;
    expect(profile.intro_video_provider).toBe("youtube");
    expect(profile.intro_video_external_id).toBe(YOUTUBE_ID);
    expect(profile.intro_video_url).toBe(YOUTUBE_WATCH_URL);
    expect(profile.intro_video_last_validated_at).toBe(result.lastValidatedAt);
    // Publication status is not changed by the setter.
    expect(profile.intro_video_publication_status).toBe("hidden");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile/video");
  });

  it("normalizes a Vimeo URL", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorIntroVideo(
      { id: APP_USER_ID },
      { providerUrl: VIMEO_WATCH_URL },
    );

    expect(result.providerKey).toBe("vimeo");
    expect(result.externalId).toBe(VIMEO_ID);
    expect(result.canonicalWatchUrl).toBe(`https://vimeo.com/${VIMEO_ID}`);
  });

  it("normalizes a Loom share URL", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorIntroVideo(
      { id: APP_USER_ID },
      { providerUrl: LOOM_WATCH_URL },
    );

    expect(result.providerKey).toBe("loom");
    expect(result.externalId).toBe(LOOM_ID);
    expect(result.canonicalWatchUrl).toBe(
      `https://www.loom.com/share/${LOOM_ID}`,
    );
  });
});

describe("setTutorIntroVideo: rejections (J-TUT-016 canonical copy)", () => {
  it("rejects an unsupported provider URL with the canonical validation copy", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorIntroVideo(
        { id: APP_USER_ID },
        { providerUrl: "https://twitch.tv/example/clip/abc" },
      ),
    ).rejects.toMatchObject({
      code: "validation_failed",
      message: UNSUPPORTED_VIDEO_LINK_MESSAGE,
      fieldErrors: {
        providerUrl: [UNSUPPORTED_VIDEO_LINK_MESSAGE],
      },
    });

    expect(recorder.updates).toHaveLength(0);
  });

  it("rejects pasted iframe HTML with the canonical validation copy", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorIntroVideo(
        { id: APP_USER_ID },
        {
          providerUrl: `<iframe src="${YOUTUBE_EMBED_URL}" frameborder="0"></iframe>`,
        },
      ),
    ).rejects.toMatchObject({
      code: "validation_failed",
      message: UNSUPPORTED_VIDEO_LINK_MESSAGE,
    });

    expect(recorder.updates).toHaveLength(0);
  });

  it("surfaces not_found when the caller has no tutor profile", async () => {
    const recorder = makeRecorder({ profile: null });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorIntroVideo(
        { id: APP_USER_ID },
        { providerUrl: YOUTUBE_WATCH_URL },
      ),
    ).rejects.toBeInstanceOf(TutorIntroVideoServiceError);
    await expect(
      setTutorIntroVideo(
        { id: APP_USER_ID },
        { providerUrl: YOUTUBE_WATCH_URL },
      ),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("clearTutorIntroVideo", () => {
  it("nulls the four intro_video columns and resets publication_status to 'hidden'", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({
        intro_video_provider: "youtube",
        intro_video_external_id: YOUTUBE_ID,
        intro_video_url: YOUTUBE_WATCH_URL,
        intro_video_publication_status: "published",
        intro_video_last_validated_at: "2026-05-01T00:00:00.000Z",
      }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await clearTutorIntroVideo({ id: APP_USER_ID });

    expect(result).toMatchObject({
      tutorProfileId: TUTOR_PROFILE_ID,
      publicationStatus: "hidden",
    });

    const profile = recorder.profileByAppUser.get(APP_USER_ID)!;
    expect(profile.intro_video_provider).toBeNull();
    expect(profile.intro_video_external_id).toBeNull();
    expect(profile.intro_video_url).toBeNull();
    expect(profile.intro_video_last_validated_at).toBeNull();
    expect(profile.intro_video_publication_status).toBe("hidden");
  });
});

describe("setTutorIntroVideoPublication: publish gating", () => {
  it("rejects publish with conflict when there is no existing reference", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorIntroVideoPublication({ id: APP_USER_ID }, "publish"),
    ).rejects.toMatchObject({ code: "conflict" });

    const profile = recorder.profileByAppUser.get(APP_USER_ID)!;
    expect(profile.intro_video_publication_status).toBe("hidden");
  });

  it("flips publication_status to 'published' when a reference exists", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({
        intro_video_provider: "youtube",
        intro_video_external_id: YOUTUBE_ID,
        intro_video_url: YOUTUBE_WATCH_URL,
        intro_video_publication_status: "hidden",
        intro_video_last_validated_at: "2026-05-01T00:00:00.000Z",
      }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorIntroVideoPublication(
      { id: APP_USER_ID },
      "publish",
    );

    expect(result).toMatchObject({
      action: "publish",
      publicationStatus: "published",
    });

    expect(recorder.profileByAppUser.get(APP_USER_ID)?.intro_video_publication_status)
      .toBe("published");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile/video");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutors/[slug]", "page");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/overview");
  });

  it("flips publication_status to 'hidden' on hide", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({
        intro_video_provider: "youtube",
        intro_video_external_id: YOUTUBE_ID,
        intro_video_url: YOUTUBE_WATCH_URL,
        intro_video_publication_status: "published",
      }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorIntroVideoPublication(
      { id: APP_USER_ID },
      "hide",
    );

    expect(result).toMatchObject({
      action: "hide",
      publicationStatus: "hidden",
    });
    expect(recorder.profileByAppUser.get(APP_USER_ID)?.intro_video_publication_status)
      .toBe("hidden");
  });
});

describe("getTutorIntroVideoForOwner", () => {
  it("returns the owning tutor's intro video state with canonical watch + embed URLs", async () => {
    const recorder = makeRecorder({
      profile: makeProfile({
        intro_video_provider: "youtube",
        intro_video_external_id: YOUTUBE_ID,
        intro_video_url: YOUTUBE_WATCH_URL,
        intro_video_publication_status: "published",
        intro_video_last_validated_at: "2026-05-10T00:00:00.000Z",
      }),
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorIntroVideoForOwner({ id: APP_USER_ID });

    expect(dto).not.toBeNull();
    expect(dto!.tutorProfileId).toBe(TUTOR_PROFILE_ID);
    expect(dto!.publicationStatus).toBe("published");
    expect(dto!.lastValidatedAt).toBe("2026-05-10T00:00:00.000Z");
    expect(dto!.introVideo).toMatchObject({
      providerKey: "youtube",
      externalId: YOUTUBE_ID,
      canonicalWatchUrl: YOUTUBE_WATCH_URL,
      canonicalEmbedUrl: YOUTUBE_EMBED_URL,
      publicationStatus: "published",
      lastValidatedAt: "2026-05-10T00:00:00.000Z",
    });
  });

  it("returns introVideo=null when the tutor has no intro video set", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorIntroVideoForOwner({ id: APP_USER_ID });

    expect(dto).not.toBeNull();
    expect(dto!.introVideo).toBeNull();
    expect(dto!.publicationStatus).toBe("hidden");
  });

  it("returns null when the caller has no tutor profile", async () => {
    const recorder = makeRecorder({ profile: null });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorIntroVideoForOwner({ id: APP_USER_ID });
    expect(dto).toBeNull();
  });
});
