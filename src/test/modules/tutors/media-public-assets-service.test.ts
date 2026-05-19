import { beforeEach, describe, expect, it, vi } from "vitest";

const mockServiceRoleClient = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => mockServiceRoleClient(),
}));

import {
  TUTOR_PROFILE_PHOTO_MAX_BYTES,
  TutorPublicMediaServiceError,
  setTutorProfilePhotoPublication,
  updateTutorProfilePhotoAlt,
  uploadTutorProfilePhoto,
} from "@/modules/tutors/media-public-assets-service";
import {
  TUTOR_PUBLIC_MEDIA_BUCKET,
  getTutorPublicMediaForOwner,
} from "@/modules/tutors/media-public-assets";

const APP_USER_ID = "11111111-1111-4111-8111-111111111111";
const TUTOR_PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_TUTOR_PROFILE_ID = "33333333-3333-4333-8333-333333333333";
const ASSET_ID = "44444444-4444-4444-4444-444444444444";
const OTHER_ASSET_ID = "55555555-5555-4555-8555-555555555555";

type PhotoRow = {
  id: string;
  tutor_profile_id: string;
  media_role: "profile_photo";
  storage_object_path: string;
  alt_text: string | null;
  publication_status:
    | "uploaded"
    | "pending_review"
    | "approved"
    | "published"
    | "hidden";
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Recorder = {
  tutorProfileByAppUser: Map<string, { id: string }>;
  photos: Map<string, PhotoRow>;
  inserts: Array<Partial<PhotoRow>>;
  updates: Array<{ id: string; payload: Record<string, unknown> }>;
  deletes: string[];
  storageUploads: Array<{ path: string; contentType: string | undefined }>;
  storageRemovals: string[];
  publicUrls: string[];
  storageUploadError: { message: string } | null;
  insertError: { message: string; code?: string } | null;
  updateError: { message: string; code?: string } | null;
};

function makeRecorder(initial?: {
  hasProfile?: boolean;
  photos?: PhotoRow[];
}): Recorder {
  const recorder: Recorder = {
    tutorProfileByAppUser: new Map(),
    photos: new Map(),
    inserts: [],
    updates: [],
    deletes: [],
    storageUploads: [],
    storageRemovals: [],
    publicUrls: [],
    storageUploadError: null,
    insertError: null,
    updateError: null,
  };
  if (initial?.hasProfile !== false) {
    recorder.tutorProfileByAppUser.set(APP_USER_ID, { id: TUTOR_PROFILE_ID });
  }
  for (const row of initial?.photos ?? []) {
    recorder.photos.set(row.id, row);
  }
  return recorder;
}

function buildClient(recorder: Recorder) {
  function appUsersQuery() {
    const builder: Record<string, unknown> = {};
    builder.select = () => chainable;
    builder.eq = () => chainable;
    builder.maybeSingle = async () => ({
      data: { full_name: null },
      error: null,
    });
    const chainable = builder as typeof builder;
    return chainable;
  }

  function tutorProfilesQuery() {
    let filterAppUserId: string | null = null;
    const builder: Record<string, unknown> = {};
    builder.select = () => chainable;
    builder.eq = (column: string, value: string) => {
      if (column === "app_user_id") {
        filterAppUserId = value;
      }
      return chainable;
    };
    builder.maybeSingle = async () => {
      if (!filterAppUserId) {
        return { data: null, error: null };
      }
      const profile = recorder.tutorProfileByAppUser.get(filterAppUserId);
      return { data: profile ?? null, error: null };
    };
    const chainable = builder as typeof builder;
    return chainable;
  }

  function tutorPublicMediaAssetsQuery() {
    let action: "select" | "insert" | "update" | "delete" = "select";
    const filters: {
      id?: string;
      tutor_profile_id?: string;
      media_role?: string;
    } = {};
    let pendingUpdate: Record<string, unknown> | null = null;
    let isList = false;
    let isLimited = false;
    const builder: Record<string, unknown> = {};
    builder.select = () => {
      action = "select";
      return chainable;
    };
    builder.insert = async (payload: Partial<PhotoRow>) => {
      action = "insert";
      if (recorder.insertError) {
        return { error: recorder.insertError };
      }
      // Enforce the partial unique index in the in-memory recorder.
      if (
        payload.publication_status === "published" &&
        payload.media_role === "profile_photo"
      ) {
        const conflict = Array.from(recorder.photos.values()).find(
          (row) =>
            row.tutor_profile_id === payload.tutor_profile_id &&
            row.media_role === "profile_photo" &&
            row.publication_status === "published",
        );
        if (conflict) {
          return {
            error: {
              code: "23505",
              message:
                'duplicate key value violates unique constraint "tutor_public_media_assets_one_published_photo_per_tutor_idx"',
            },
          };
        }
      }
      recorder.inserts.push(payload);
      const id = payload.id ?? `photo-${recorder.photos.size + 1}`;
      const row: PhotoRow = {
        id,
        tutor_profile_id: payload.tutor_profile_id ?? "",
        media_role: "profile_photo",
        storage_object_path: payload.storage_object_path ?? "",
        alt_text: payload.alt_text ?? null,
        publication_status: payload.publication_status ?? "uploaded",
        sort_order: payload.sort_order ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      recorder.photos.set(id, row);
      return { error: null };
    };
    builder.update = (payload: Record<string, unknown>) => {
      action = "update";
      pendingUpdate = payload;
      return chainable;
    };
    builder.delete = () => {
      action = "delete";
      return chainable;
    };
    builder.eq = (column: string, value: string) => {
      if (column === "id") filters.id = value;
      if (column === "tutor_profile_id") filters.tutor_profile_id = value;
      if (column === "media_role") filters.media_role = value;
      return chainable;
    };
    builder.order = () => {
      isList = true;
      return chainable;
    };
    builder.limit = () => {
      isLimited = true;
      return chainable;
    };
    function filterRows(): PhotoRow[] {
      return Array.from(recorder.photos.values()).filter((row) => {
        if (filters.tutor_profile_id && row.tutor_profile_id !== filters.tutor_profile_id)
          return false;
        if (filters.id && row.id !== filters.id) return false;
        if (filters.media_role && row.media_role !== filters.media_role)
          return false;
        return true;
      });
    }
    builder.returns = async () => {
      if (action !== "select") return { data: null, error: null };
      const rows = filterRows().sort(
        (a, b) => (a.created_at < b.created_at ? 1 : -1),
      );
      return { data: rows, error: null };
    };
    builder.maybeSingle = async () => {
      const rows = filterRows().sort(
        (a, b) => (a.created_at < b.created_at ? 1 : -1),
      );
      void isLimited;
      return { data: rows[0] ?? null, error: null };
    };
    const chainable: typeof builder & PromiseLike<{
      data: unknown;
      error: unknown;
    }> = Object.assign(builder, {
      then: (onFulfilled: (v: { data: unknown; error: unknown }) => unknown) => {
        if (action === "update") {
          if (recorder.updateError) {
            return Promise.resolve({ data: null, error: recorder.updateError }).then(
              onFulfilled,
            );
          }
          if (filters.id && pendingUpdate) {
            const row = recorder.photos.get(filters.id);
            if (row) {
              // Enforce the partial unique index on publish.
              if (
                pendingUpdate.publication_status === "published" &&
                row.media_role === "profile_photo"
              ) {
                const conflict = Array.from(recorder.photos.values()).find(
                  (other) =>
                    other.id !== row.id &&
                    other.tutor_profile_id === row.tutor_profile_id &&
                    other.media_role === "profile_photo" &&
                    other.publication_status === "published",
                );
                if (conflict) {
                  return Promise.resolve({
                    data: null,
                    error: {
                      code: "23505",
                      message:
                        'duplicate key value violates unique constraint "tutor_public_media_assets_one_published_photo_per_tutor_idx"',
                    },
                  }).then(onFulfilled);
                }
              }
              const next: PhotoRow = { ...row, ...(pendingUpdate as Partial<PhotoRow>) };
              recorder.photos.set(filters.id, next);
              recorder.updates.push({ id: filters.id, payload: pendingUpdate });
            }
          }
          return Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }
        if (action === "delete") {
          if (filters.id && recorder.photos.has(filters.id)) {
            recorder.deletes.push(filters.id);
            recorder.photos.delete(filters.id);
          }
          return Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }
        if (action === "select" && isList) {
          const rows = filterRows().sort(
            (a, b) => (a.created_at < b.created_at ? 1 : -1),
          );
          return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
        }
        return Promise.resolve({ data: null, error: null }).then(onFulfilled);
      },
    }) as typeof chainable;
    return chainable;
  }

  return {
    from(table: string) {
      if (table === "app_users") return appUsersQuery();
      if (table === "tutor_profiles") return tutorProfilesQuery();
      if (table === "tutor_public_media_assets")
        return tutorPublicMediaAssetsQuery();
      throw new Error(`Unexpected table: ${table}`);
    },
    storage: {
      from(bucket: string) {
        if (bucket !== TUTOR_PUBLIC_MEDIA_BUCKET) {
          throw new Error(`Unexpected bucket: ${bucket}`);
        }
        return {
          upload: async (
            path: string,
            _file: File | Blob,
            options: { contentType?: string; upsert?: boolean } = {},
          ) => {
            if (recorder.storageUploadError) {
              return { data: null, error: recorder.storageUploadError };
            }
            recorder.storageUploads.push({
              path,
              contentType: options.contentType,
            });
            return { data: { path }, error: null };
          },
          remove: async (paths: string[]) => {
            recorder.storageRemovals.push(...paths);
            return { data: null, error: null };
          },
          getPublicUrl: (path: string) => {
            const url = `https://public.example/${TUTOR_PUBLIC_MEDIA_BUCKET}/${path}`;
            recorder.publicUrls.push(url);
            return { data: { publicUrl: url } };
          },
        };
      },
    },
  };
}

function makeFile(
  options: { type?: string; size?: number; name?: string } = {},
): File {
  const type = options.type ?? "image/jpeg";
  const size = options.size ?? 1024;
  const name = options.name ?? "headshot.jpg";
  return new File([new Uint8Array(size)], name, { type });
}

function makePhotoRow(overrides: Partial<PhotoRow> = {}): PhotoRow {
  return {
    id: ASSET_ID,
    tutor_profile_id: TUTOR_PROFILE_ID,
    media_role: "profile_photo",
    storage_object_path: `tutor/${TUTOR_PROFILE_ID}/photo/${ASSET_ID}.jpg`,
    alt_text: "Friendly headshot of the tutor",
    publication_status: "uploaded",
    sort_order: 0,
    created_at: new Date("2026-01-02T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-02T00:00:00Z").toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadTutorProfilePhoto", () => {
  it("rejects unsupported MIME types with a validation_failed error", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      uploadTutorProfilePhoto(
        { id: APP_USER_ID },
        makeFile({ type: "image/gif" }),
        "alt",
      ),
    ).rejects.toMatchObject({ code: "validation_failed" });

    expect(recorder.inserts).toHaveLength(0);
    expect(recorder.storageUploads).toHaveLength(0);
  });

  it("rejects files larger than the 5MB cap", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      uploadTutorProfilePhoto(
        { id: APP_USER_ID },
        makeFile({ size: TUTOR_PROFILE_PHOTO_MAX_BYTES + 1 }),
        "alt",
      ),
    ).rejects.toMatchObject({ code: "validation_failed" });

    expect(recorder.storageUploads).toHaveLength(0);
  });

  it("inserts a new row with publication_status='uploaded' and uses the documented object path", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await uploadTutorProfilePhoto(
      { id: APP_USER_ID },
      makeFile({ name: "Headshot.jpg" }),
      "Tutor smiling at the camera",
    );

    expect(result.publicationStatus).toBe("uploaded");
    expect(recorder.inserts).toHaveLength(1);
    const insert = recorder.inserts[0]!;
    expect(insert.publication_status).toBe("uploaded");
    expect(insert.tutor_profile_id).toBe(TUTOR_PROFILE_ID);
    expect(insert.media_role).toBe("profile_photo");
    expect(insert.alt_text).toBe("Tutor smiling at the camera");
    expect(insert.storage_object_path).toMatch(
      new RegExp(`^tutor/${TUTOR_PROFILE_ID}/photo/[0-9a-f-]+\\.jpg$`),
    );
    expect(recorder.storageUploads).toHaveLength(1);
    expect(recorder.storageUploads[0]!.contentType).toBe("image/jpeg");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile/photo");
  });

  it("replaces an existing photo row and removes the prior storage object", async () => {
    const recorder = makeRecorder({
      photos: [
        makePhotoRow({
          storage_object_path: `tutor/${TUTOR_PROFILE_ID}/photo/${ASSET_ID}.png`,
          alt_text: "Old description",
          publication_status: "hidden",
        }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await uploadTutorProfilePhoto(
      { id: APP_USER_ID },
      makeFile({ type: "image/webp", name: "new.webp" }),
      "New description",
    );

    expect(result.assetId).toBe(ASSET_ID);
    expect(result.publicationStatus).toBe("uploaded");
    expect(recorder.inserts).toHaveLength(0);
    expect(recorder.updates).toHaveLength(1);
    const update = recorder.updates[0]!;
    expect(update.payload).toMatchObject({
      publication_status: "uploaded",
      alt_text: "New description",
    });
    expect(update.payload.storage_object_path).toMatch(
      new RegExp(`^tutor/${TUTOR_PROFILE_ID}/photo/[0-9a-f-]+\\.webp$`),
    );
    expect(recorder.storageRemovals).toContain(
      `tutor/${TUTOR_PROFILE_ID}/photo/${ASSET_ID}.png`,
    );
  });

  it("cleans up the storage object when the row insert fails", async () => {
    const recorder = makeRecorder();
    recorder.insertError = { message: "boom" };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      uploadTutorProfilePhoto({ id: APP_USER_ID }, makeFile(), null),
    ).rejects.toBeInstanceOf(TutorPublicMediaServiceError);

    expect(recorder.storageRemovals).toHaveLength(1);
  });
});

describe("updateTutorProfilePhotoAlt", () => {
  it("patches only alt_text on the existing photo row", async () => {
    const recorder = makeRecorder({
      photos: [makePhotoRow({ alt_text: null })],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await updateTutorProfilePhotoAlt(
      { id: APP_USER_ID },
      "Updated description",
    );

    expect(result.assetId).toBe(ASSET_ID);
    expect(recorder.updates).toHaveLength(1);
    expect(recorder.updates[0]!.payload).toEqual({
      alt_text: "Updated description",
    });
    expect(recorder.photos.get(ASSET_ID)?.alt_text).toBe(
      "Updated description",
    );
  });

  it("returns not_found when there is no photo yet", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      updateTutorProfilePhotoAlt({ id: APP_USER_ID }, "alt"),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("setTutorProfilePhotoPublication: publish", () => {
  it("flips publication_status to 'published' when alt_text is present", async () => {
    const recorder = makeRecorder({
      photos: [makePhotoRow({ publication_status: "uploaded" })],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorProfilePhotoPublication(
      { id: APP_USER_ID },
      "publish",
    );

    expect(result).toMatchObject({
      action: "publish",
      assetId: ASSET_ID,
      publicationStatus: "published",
    });
    expect(recorder.photos.get(ASSET_ID)?.publication_status).toBe("published");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile/photo");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutors/[slug]", "page");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/overview");
  });

  it("backfills alt_text from the user's full name on publish when missing", async () => {
    const recorder = makeRecorder({
      photos: [makePhotoRow({ publication_status: "uploaded", alt_text: null })],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorProfilePhotoPublication(
      { id: APP_USER_ID },
      "publish",
    );

    expect(result).toMatchObject({
      action: "publish",
      publicationStatus: "published",
    });
    const row = recorder.photos.get(ASSET_ID);
    expect(row?.publication_status).toBe("published");
    expect(row?.alt_text).toBeTruthy();
  });

  it("backfills alt_text on publish when stored value is whitespace-only", async () => {
    const recorder = makeRecorder({
      photos: [makePhotoRow({ publication_status: "uploaded", alt_text: "   " })],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorProfilePhotoPublication(
      { id: APP_USER_ID },
      "publish",
    );

    expect(result.publicationStatus).toBe("published");
    expect(recorder.photos.get(ASSET_ID)?.alt_text?.trim().length).toBeGreaterThan(
      0,
    );
  });

  it("surfaces conflict when another asset is already published", async () => {
    // Two rows for the same tutor: one already published, one uploaded.
    const recorder = makeRecorder({
      photos: [
        makePhotoRow({
          id: OTHER_ASSET_ID,
          storage_object_path: `tutor/${TUTOR_PROFILE_ID}/photo/${OTHER_ASSET_ID}.jpg`,
          publication_status: "published",
          alt_text: "Existing published photo",
          created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
        }),
        makePhotoRow({
          id: ASSET_ID,
          publication_status: "uploaded",
          alt_text: "Newer uploaded photo",
          created_at: new Date("2026-01-02T00:00:00Z").toISOString(),
        }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorProfilePhotoPublication({ id: APP_USER_ID }, "publish"),
    ).rejects.toMatchObject({ code: "conflict" });

    // The previously-published row remains published; the newer row stays uploaded.
    expect(recorder.photos.get(OTHER_ASSET_ID)?.publication_status).toBe(
      "published",
    );
    expect(recorder.photos.get(ASSET_ID)?.publication_status).toBe("uploaded");
  });
});

describe("setTutorProfilePhotoPublication: hide", () => {
  it("flips publication_status to 'hidden'", async () => {
    const recorder = makeRecorder({
      photos: [
        makePhotoRow({ publication_status: "published" }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorProfilePhotoPublication(
      { id: APP_USER_ID },
      "hide",
    );

    expect(result).toMatchObject({
      action: "hide",
      assetId: ASSET_ID,
      publicationStatus: "hidden",
    });
    expect(recorder.photos.get(ASSET_ID)?.publication_status).toBe("hidden");
  });
});

describe("setTutorProfilePhotoPublication: remove", () => {
  it("deletes both the row and the storage object", async () => {
    const recorder = makeRecorder({
      photos: [makePhotoRow()],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorProfilePhotoPublication(
      { id: APP_USER_ID },
      "remove",
    );

    expect(result).toMatchObject({ action: "remove", assetId: ASSET_ID });
    expect(recorder.deletes).toContain(ASSET_ID);
    expect(recorder.storageRemovals).toContain(
      `tutor/${TUTOR_PROFILE_ID}/photo/${ASSET_ID}.jpg`,
    );
    expect(recorder.photos.has(ASSET_ID)).toBe(false);
  });

  it("returns not_found when there's no photo to remove", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      setTutorProfilePhotoPublication({ id: APP_USER_ID }, "remove"),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("getTutorPublicMediaForOwner", () => {
  it("returns the owning tutor's photo with a public URL and never leaks other tutors' rows", async () => {
    const ownRow = makePhotoRow({ alt_text: "Owned" });
    const otherRow = makePhotoRow({
      id: OTHER_ASSET_ID,
      tutor_profile_id: OTHER_TUTOR_PROFILE_ID,
      alt_text: "Other tutor",
      storage_object_path: `tutor/${OTHER_TUTOR_PROFILE_ID}/photo/${OTHER_ASSET_ID}.jpg`,
    });
    const recorder = makeRecorder({ photos: [ownRow, otherRow] });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorPublicMediaForOwner({ id: APP_USER_ID });

    expect(dto).not.toBeNull();
    expect(dto!.tutorProfileId).toBe(TUTOR_PROFILE_ID);
    expect(dto!.profilePhoto).not.toBeNull();
    expect(dto!.profilePhoto!.assetId).toBe(ASSET_ID);
    expect(dto!.profilePhoto!.altText).toBe("Owned");
    expect(dto!.profilePhoto!.publicUrl).toContain(
      `${TUTOR_PUBLIC_MEDIA_BUCKET}/tutor/${TUTOR_PROFILE_ID}/photo/${ASSET_ID}.jpg`,
    );
  });

  it("returns null when the caller has no tutor profile", async () => {
    const recorder = makeRecorder({ hasProfile: false });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorPublicMediaForOwner({ id: APP_USER_ID });
    expect(dto).toBeNull();
  });

  it("returns profilePhoto=null when the tutor has no public media rows", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorPublicMediaForOwner({ id: APP_USER_ID });
    expect(dto).not.toBeNull();
    expect(dto!.tutorProfileId).toBe(TUTOR_PROFILE_ID);
    expect(dto!.profilePhoto).toBeNull();
  });
});
