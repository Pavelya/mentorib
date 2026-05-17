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
  TUTOR_CREDENTIAL_MAX_BYTES,
  TutorCredentialServiceError,
  deleteTutorCredential,
  replaceTutorCredentialFile,
  setTutorCredentialPublicDisplayPreference,
  updateTutorCredentialMetadata,
  uploadTutorCredential,
} from "@/modules/tutors/media-credentials-service";
import {
  TUTOR_CREDENTIAL_BUCKET,
  getTutorCredentialsForOwner,
} from "@/modules/tutors/media-credentials";

const APP_USER_ID = "11111111-1111-4111-8111-111111111111";
const TUTOR_PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_TUTOR_PROFILE_ID = "33333333-3333-4333-8333-333333333333";
const CREDENTIAL_ID = "44444444-4444-4444-4444-444444444444";

type CredentialRow = {
  id: string;
  tutor_profile_id: string;
  credential_type: string;
  title: string;
  issuing_body: string | null;
  storage_object_path: string;
  review_status: string;
  reviewed_at: string | null;
  public_display_preference: boolean;
  credential_subject_id: string | null;
  credential_subject_focus_area_id: string | null;
  created_at: string;
  updated_at: string;
};

type Recorder = {
  tutorProfileByAppUser: Map<string, { id: string }>;
  credentials: Map<string, CredentialRow>;
  inserts: Array<Partial<CredentialRow>>;
  updates: Array<{ id: string; payload: Record<string, unknown> }>;
  deletes: string[];
  storageUploads: Array<{ path: string; contentType: string | undefined }>;
  storageRemovals: string[];
  signedUrls: Array<{ path: string; expiresIn: number }>;
  storageUploadError: { message: string } | null;
  insertError: { message: string } | null;
  updateError: { message: string } | null;
};

function makeRecorder(initial?: {
  hasProfile?: boolean;
  credentials?: CredentialRow[];
}): Recorder {
  const recorder: Recorder = {
    tutorProfileByAppUser: new Map(),
    credentials: new Map(),
    inserts: [],
    updates: [],
    deletes: [],
    storageUploads: [],
    storageRemovals: [],
    signedUrls: [],
    storageUploadError: null,
    insertError: null,
    updateError: null,
  };
  if (initial?.hasProfile !== false) {
    recorder.tutorProfileByAppUser.set(APP_USER_ID, { id: TUTOR_PROFILE_ID });
  }
  for (const row of initial?.credentials ?? []) {
    recorder.credentials.set(row.id, row);
  }
  return recorder;
}

function buildClient(recorder: Recorder) {
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

  function tutorCredentialsQuery() {
    let action: "select" | "insert" | "update" | "delete" = "select";
    const filters: { id?: string; tutor_profile_id?: string } = {};
    let pendingUpdate: Record<string, unknown> | null = null;
    let isList = false;
    const builder: Record<string, unknown> = {};
    builder.select = () => {
      action = "select";
      return chainable;
    };
    builder.insert = async (payload: Partial<CredentialRow>) => {
      action = "insert";
      if (recorder.insertError) {
        return { error: recorder.insertError };
      }
      recorder.inserts.push(payload);
      const id = payload.id ?? `cred-${recorder.credentials.size + 1}`;
      const row: CredentialRow = {
        id,
        tutor_profile_id: payload.tutor_profile_id ?? "",
        credential_type: payload.credential_type ?? "professional_certification",
        title: payload.title ?? "",
        issuing_body: payload.issuing_body ?? null,
        storage_object_path: payload.storage_object_path ?? "",
        review_status: payload.review_status ?? "uploaded",
        reviewed_at: payload.reviewed_at ?? null,
        public_display_preference: payload.public_display_preference ?? false,
        credential_subject_id: payload.credential_subject_id ?? null,
        credential_subject_focus_area_id:
          payload.credential_subject_focus_area_id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      recorder.credentials.set(id, row);
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
      return chainable;
    };
    builder.order = () => {
      isList = true;
      return chainable;
    };
    builder.returns = async () => {
      if (action !== "select") return { data: null, error: null };
      const rows = Array.from(recorder.credentials.values()).filter((row) => {
        if (filters.tutor_profile_id && row.tutor_profile_id !== filters.tutor_profile_id) return false;
        if (filters.id && row.id !== filters.id) return false;
        return true;
      });
      return { data: rows, error: null };
    };
    builder.maybeSingle = async () => {
      const rows = Array.from(recorder.credentials.values()).filter((row) => {
        if (filters.tutor_profile_id && row.tutor_profile_id !== filters.tutor_profile_id) return false;
        if (filters.id && row.id !== filters.id) return false;
        return true;
      });
      return { data: rows[0] ?? null, error: null };
    };
    const chainable: typeof builder & PromiseLike<{
      data: unknown;
      error: unknown;
    }> = Object.assign(builder, {
      then: (onFulfilled: (v: { data: unknown; error: unknown }) => unknown) => {
        if (action === "update") {
          if (recorder.updateError) {
            return Promise.resolve({ data: null, error: recorder.updateError }).then(onFulfilled);
          }
          if (filters.id) {
            const row = recorder.credentials.get(filters.id);
            if (row && pendingUpdate) {
              const next = { ...row, ...pendingUpdate };
              for (const key of Object.keys(pendingUpdate)) {
                if (pendingUpdate[key] === undefined) {
                  delete (next as Record<string, unknown>)[key];
                  (next as Record<string, unknown>)[key] = (row as Record<string, unknown>)[key];
                }
              }
              recorder.credentials.set(filters.id, next as CredentialRow);
              recorder.updates.push({ id: filters.id, payload: pendingUpdate });
            }
          }
          return Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }
        if (action === "delete") {
          if (filters.id && recorder.credentials.has(filters.id)) {
            recorder.deletes.push(filters.id);
            recorder.credentials.delete(filters.id);
          }
          return Promise.resolve({ data: null, error: null }).then(onFulfilled);
        }
        if (action === "select" && isList) {
          const rows = Array.from(recorder.credentials.values()).filter(
            (row) =>
              !filters.tutor_profile_id ||
              row.tutor_profile_id === filters.tutor_profile_id,
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
      if (table === "tutor_profiles") return tutorProfilesQuery();
      if (table === "tutor_credentials") return tutorCredentialsQuery();
      throw new Error(`Unexpected table: ${table}`);
    },
    storage: {
      from(bucket: string) {
        if (bucket !== TUTOR_CREDENTIAL_BUCKET) {
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
          createSignedUrl: async (path: string, expiresIn: number) => {
            recorder.signedUrls.push({ path, expiresIn });
            return {
              data: {
                signedUrl: `https://signed.example/${encodeURIComponent(path)}?ttl=${expiresIn}`,
              },
              error: null,
            };
          },
        };
      },
    },
  };
}

function makeFile(
  options: { type?: string; size?: number; name?: string } = {},
): File {
  const type = options.type ?? "application/pdf";
  const size = options.size ?? 1024;
  const name = options.name ?? "Credential.pdf";
  return new File([new Uint8Array(size)], name, { type });
}

function makeCredentialRow(
  overrides: Partial<CredentialRow> = {},
): CredentialRow {
  return {
    id: CREDENTIAL_ID,
    tutor_profile_id: TUTOR_PROFILE_ID,
    credential_type: "degree",
    title: "BSc Mathematics",
    issuing_body: "University of Cambridge",
    storage_object_path: `tutor/${TUTOR_PROFILE_ID}/credentials/${CREDENTIAL_ID}/diploma.pdf`,
    review_status: "uploaded",
    reviewed_at: null,
    public_display_preference: false,
    credential_subject_id: null,
    credential_subject_focus_area_id: null,
    created_at: new Date("2026-01-02T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-02T00:00:00Z").toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadTutorCredential", () => {
  it("rejects unsupported MIME types with a validation_failed error", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      uploadTutorCredential(
        { id: APP_USER_ID },
        {
          credentialType: "degree",
          title: "Diploma",
          issuingBody: null,
          credentialSubjectId: null,
          credentialSubjectFocusAreaId: null,
        },
        makeFile({ type: "image/gif" }),
      ),
    ).rejects.toMatchObject({ code: "validation_failed" });

    expect(recorder.inserts).toHaveLength(0);
    expect(recorder.storageUploads).toHaveLength(0);
  });

  it("rejects files larger than the 15MB cap", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      uploadTutorCredential(
        { id: APP_USER_ID },
        {
          credentialType: "degree",
          title: "Diploma",
          issuingBody: null,
          credentialSubjectId: null,
          credentialSubjectFocusAreaId: null,
        },
        makeFile({ size: TUTOR_CREDENTIAL_MAX_BYTES + 1 }),
      ),
    ).rejects.toMatchObject({ code: "validation_failed" });

    expect(recorder.storageUploads).toHaveLength(0);
  });

  it("rejects metadata with missing title", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      uploadTutorCredential(
        { id: APP_USER_ID },
        {
          credentialType: "degree",
          title: "  ",
          issuingBody: null,
          credentialSubjectId: null,
          credentialSubjectFocusAreaId: null,
        },
        makeFile(),
      ),
    ).rejects.toMatchObject({
      code: "validation_failed",
      fieldErrors: expect.objectContaining({ title: expect.any(Array) }),
    });
  });

  it("inserts a credential row with review_status='uploaded' and uses the documented object path", async () => {
    const recorder = makeRecorder();
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await uploadTutorCredential(
      { id: APP_USER_ID },
      {
        credentialType: "degree",
        title: "BSc Mathematics",
        issuingBody: "University of Cambridge",
        credentialSubjectId: null,
        credentialSubjectFocusAreaId: null,
      },
      makeFile({ name: "Diploma.pdf" }),
    );

    expect(result.reviewStatus).toBe("uploaded");
    expect(recorder.inserts).toHaveLength(1);
    const insert = recorder.inserts[0]!;
    expect(insert.review_status).toBe("uploaded");
    expect(insert.reviewed_at).toBeNull();
    expect(insert.tutor_profile_id).toBe(TUTOR_PROFILE_ID);
    expect(insert.storage_object_path).toMatch(
      new RegExp(`^tutor/${TUTOR_PROFILE_ID}/credentials/[0-9a-f-]+/Diploma\\.pdf$`),
    );
    expect(recorder.storageUploads).toHaveLength(1);
    expect(recorder.storageUploads[0]!.contentType).toBe("application/pdf");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/tutor/profile/credentials");
  });

  it("cleans up the storage object when the row insert fails", async () => {
    const recorder = makeRecorder();
    recorder.insertError = { message: "boom" };
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      uploadTutorCredential(
        { id: APP_USER_ID },
        {
          credentialType: "degree",
          title: "Diploma",
          issuingBody: null,
          credentialSubjectId: null,
          credentialSubjectFocusAreaId: null,
        },
        makeFile(),
      ),
    ).rejects.toBeInstanceOf(TutorCredentialServiceError);

    expect(recorder.storageRemovals).toHaveLength(1);
  });
});

describe("replaceTutorCredentialFile", () => {
  it("resets review_status to pending_review and clears reviewed_at when the row is approved", async () => {
    const reviewedAt = new Date("2026-02-01T00:00:00Z").toISOString();
    const recorder = makeRecorder({
      credentials: [
        makeCredentialRow({
          review_status: "approved",
          reviewed_at: reviewedAt,
        }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await replaceTutorCredentialFile(
      { id: APP_USER_ID },
      CREDENTIAL_ID,
      makeFile({ name: "Renewed.pdf" }),
    );

    expect(result.reviewStatus).toBe("pending_review");
    const update = recorder.updates.at(-1);
    expect(update?.payload).toMatchObject({
      review_status: "pending_review",
      reviewed_at: null,
    });
    // Constraint invariant: reviewed_at is null when the row is non-terminal.
    expect(recorder.credentials.get(CREDENTIAL_ID)?.reviewed_at).toBeNull();
    expect(recorder.credentials.get(CREDENTIAL_ID)?.review_status).toBe(
      "pending_review",
    );
  });

  it("keeps a non-approved row's status and stays consistent with reviewed_at=null", async () => {
    const recorder = makeRecorder({
      credentials: [
        makeCredentialRow({ review_status: "pending_review", reviewed_at: null }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await replaceTutorCredentialFile(
      { id: APP_USER_ID },
      CREDENTIAL_ID,
      makeFile(),
    );

    expect(result.reviewStatus).toBe("pending_review");
    expect(recorder.credentials.get(CREDENTIAL_ID)?.reviewed_at).toBeNull();
  });

  it("rejects replace when the credential belongs to a different tutor", async () => {
    const recorder = makeRecorder({
      credentials: [
        makeCredentialRow({ tutor_profile_id: OTHER_TUTOR_PROFILE_ID }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      replaceTutorCredentialFile({ id: APP_USER_ID }, CREDENTIAL_ID, makeFile()),
    ).rejects.toMatchObject({ code: "not_found" });

    expect(recorder.updates).toHaveLength(0);
  });
});

describe("updateTutorCredentialMetadata", () => {
  it("auto-resets an approved row when metadata changes", async () => {
    const recorder = makeRecorder({
      credentials: [
        makeCredentialRow({
          review_status: "approved",
          reviewed_at: new Date("2026-02-01T00:00:00Z").toISOString(),
        }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await updateTutorCredentialMetadata(
      { id: APP_USER_ID },
      CREDENTIAL_ID,
      {
        credentialType: "teaching_qualification",
        title: "Updated Title",
        issuingBody: null,
        credentialSubjectId: null,
        credentialSubjectFocusAreaId: null,
      },
    );

    expect(result.reviewStatus).toBe("pending_review");
    expect(recorder.credentials.get(CREDENTIAL_ID)?.review_status).toBe(
      "pending_review",
    );
    expect(recorder.credentials.get(CREDENTIAL_ID)?.reviewed_at).toBeNull();
    expect(recorder.credentials.get(CREDENTIAL_ID)?.title).toBe("Updated Title");
  });
});

describe("setTutorCredentialPublicDisplayPreference", () => {
  it("does not reset review_status when toggling the display preference", async () => {
    const reviewedAt = new Date("2026-02-01T00:00:00Z").toISOString();
    const recorder = makeRecorder({
      credentials: [
        makeCredentialRow({
          review_status: "approved",
          reviewed_at: reviewedAt,
        }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const result = await setTutorCredentialPublicDisplayPreference(
      { id: APP_USER_ID },
      CREDENTIAL_ID,
      true,
    );

    expect(result.reviewStatus).toBe("approved");
    const row = recorder.credentials.get(CREDENTIAL_ID);
    expect(row?.public_display_preference).toBe(true);
    expect(row?.review_status).toBe("approved");
    // _reviewed_at_consistency_chk: approved rows must keep reviewed_at non-null.
    expect(row?.reviewed_at).toBe(reviewedAt);
  });
});

describe("deleteTutorCredential", () => {
  it("removes the row and the storage object", async () => {
    const recorder = makeRecorder({
      credentials: [makeCredentialRow()],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await deleteTutorCredential({ id: APP_USER_ID }, CREDENTIAL_ID);

    expect(recorder.deletes).toContain(CREDENTIAL_ID);
    expect(recorder.storageRemovals).toContain(
      `tutor/${TUTOR_PROFILE_ID}/credentials/${CREDENTIAL_ID}/diploma.pdf`,
    );
    expect(recorder.credentials.has(CREDENTIAL_ID)).toBe(false);
  });

  it("refuses to delete a row owned by a different tutor", async () => {
    const recorder = makeRecorder({
      credentials: [
        makeCredentialRow({ tutor_profile_id: OTHER_TUTOR_PROFILE_ID }),
      ],
    });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    await expect(
      deleteTutorCredential({ id: APP_USER_ID }, CREDENTIAL_ID),
    ).rejects.toMatchObject({ code: "not_found" });

    expect(recorder.deletes).toHaveLength(0);
    expect(recorder.storageRemovals).toHaveLength(0);
  });
});

describe("getTutorCredentialsForOwner", () => {
  it("returns only the owning tutor's rows with signed download URLs", async () => {
    const ownRow = makeCredentialRow({ title: "Owned" });
    const otherRow = makeCredentialRow({
      id: "55555555-5555-4555-8555-555555555555",
      tutor_profile_id: OTHER_TUTOR_PROFILE_ID,
      title: "Other tutor",
      storage_object_path: `tutor/${OTHER_TUTOR_PROFILE_ID}/credentials/foo/x.pdf`,
    });
    const recorder = makeRecorder({ credentials: [ownRow, otherRow] });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorCredentialsForOwner({ id: APP_USER_ID });

    expect(dto).not.toBeNull();
    expect(dto!.tutorProfileId).toBe(TUTOR_PROFILE_ID);
    expect(dto!.credentials).toHaveLength(1);
    expect(dto!.credentials[0]!.title).toBe("Owned");
    expect(dto!.credentials[0]!.downloadUrl).toContain("https://signed.example/");

    // DTO must never carry internal_note or reviewer fields (those live on
    // tutor_application_reviews, not on tutor_credentials at all). Ensure the
    // editor row only exposes the documented owner-safe surface.
    const exposedKeys = Object.keys(dto!.credentials[0]!);
    expect(exposedKeys).not.toContain("internal_note");
    expect(exposedKeys).not.toContain("reviewer_app_user_id");
  });

  it("returns null when the caller has no tutor profile", async () => {
    const recorder = makeRecorder({ hasProfile: false });
    mockServiceRoleClient.mockReturnValue(buildClient(recorder));

    const dto = await getTutorCredentialsForOwner({ id: APP_USER_ID });
    expect(dto).toBeNull();
  });
});
