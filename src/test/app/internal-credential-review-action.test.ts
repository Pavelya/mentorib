import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireAdmin = vi.fn();
const mockSetTutorCredentialReviewStatus = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    const error = new Error("NEXT_NOT_FOUND") as Error & { digest: string };
    error.digest = "NEXT_NOT_FOUND";
    throw error;
  },
}));

vi.mock("@/lib/auth/internal-access", () => ({
  requireInternalAdminAccount: () => mockRequireAdmin(),
}));

vi.mock("@/lib/jobs/logging", () => ({
  logJobsEvent: vi.fn(),
}));

vi.mock("@/modules/tutors/application-review-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/tutors/application-review-service")
  >("@/modules/tutors/application-review-service");
  return {
    ...actual,
    setTutorCredentialReviewStatus: (...args: unknown[]) =>
      mockSetTutorCredentialReviewStatus(...args),
  };
});

import {
  initialCredentialReviewActionState,
  runTutorCredentialReviewAction,
} from "@/app/internal/tutor-reviews/[applicationId]/credential-review-actions";

const CREDENTIAL_ID = "44444444-4444-4444-4444-444444444444";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runTutorCredentialReviewAction admin gate", () => {
  it("propagates the notFound() digest from requireInternalAdminAccount", async () => {
    mockRequireAdmin.mockImplementation(() => {
      const error = new Error("NEXT_NOT_FOUND") as Error & { digest: string };
      error.digest = "NEXT_NOT_FOUND";
      throw error;
    });

    const formData = new FormData();
    formData.set("credential_id", CREDENTIAL_ID);
    formData.set("intent", "approve");

    await expect(
      runTutorCredentialReviewAction(
        initialCredentialReviewActionState,
        formData,
      ),
    ).rejects.toMatchObject({ digest: "NEXT_NOT_FOUND" });

    expect(mockSetTutorCredentialReviewStatus).not.toHaveBeenCalled();
  });

  it("invokes the service when the caller is an admin", async () => {
    mockRequireAdmin.mockResolvedValue({ id: "admin-1" });
    mockSetTutorCredentialReviewStatus.mockResolvedValue({
      reviewStatus: "approved",
    });

    const formData = new FormData();
    formData.set("credential_id", CREDENTIAL_ID);
    formData.set("intent", "approve");
    formData.set("internal_note", "checked");

    const state = await runTutorCredentialReviewAction(
      initialCredentialReviewActionState,
      formData,
    );

    expect(state.code).toBe("ok");
    expect(state.credentialId).toBe(CREDENTIAL_ID);
    expect(mockSetTutorCredentialReviewStatus).toHaveBeenCalledWith({
      action: "approve",
      credentialId: CREDENTIAL_ID,
      internalNote: "checked",
      reviewerAppUserId: "admin-1",
    });
  });
});
