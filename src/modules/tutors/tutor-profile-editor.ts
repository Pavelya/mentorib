import type { ResolvedAuthAccount } from "@/lib/auth/account-service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  getTutorApplication,
  type TutorApplicationCapabilityDto,
  type TutorApplicationDraftInput,
  type TutorApplicationOptionsDto,
  type TutorApplicationReadinessGate,
} from "@/modules/tutors/application";
import {
  type PayoutReadinessStatus,
  type TutorApplicationStatus,
  type TutorPublicListingStatus,
} from "@/modules/tutors/constants";

export type TutorProfileEditorAdminHold = {
  message: string;
  status: "paused" | "delisted";
};

export type TutorProfileEditorDto = {
  applicationStatus: TutorApplicationStatus;
  // Admin-only hold state surfaced read-only from the readiness model § 5.2.
  // Populated only when `publicListingStatus` is `paused` or `delisted`.
  adminHold: TutorProfileEditorAdminHold | null;
  capabilities: TutorApplicationCapabilityDto[];
  // True when every required readiness gate currently passes, so the publish
  // action can run; `missingGateKeys` lists the gate keys blocking publish.
  canPublish: boolean;
  draft: TutorApplicationDraftInput;
  hasMeetingLink: boolean;
  hasScheduleRules: boolean;
  missingGateKeys: TutorApplicationReadinessGate["key"][];
  options: TutorApplicationOptionsDto;
  payoutReadinessStatus: PayoutReadinessStatus;
  publicListingStatus: TutorPublicListingStatus;
  publicSlug: string | null;
  readinessGates: TutorApplicationReadinessGate[];
  // Tutor-initiated unlisting marker. When set with `publicListingStatus`
  // === "not_listed", the editor renders "Paused by you" so the tutor can
  // resume; gate-regression auto-flips clear this column.
  selfPausedAt: string | null;
  state: "ready" | "no_profile";
};

export async function getTutorProfileEditor(
  account: Pick<ResolvedAuthAccount, "full_name" | "id" | "timezone">,
): Promise<TutorProfileEditorDto> {
  const application = await getTutorApplication(account);

  if (application.state === "no_profile") {
    return {
      applicationStatus: application.applicationStatus,
      adminHold: null,
      capabilities: [],
      canPublish: false,
      draft: application.profile.draft,
      hasMeetingLink: false,
      hasScheduleRules: false,
      missingGateKeys: application.readinessGates
        .filter((gate) => gate.state !== "complete")
        .map((gate) => gate.key),
      options: application.options,
      payoutReadinessStatus: application.profile.payoutReadinessStatus,
      publicListingStatus: application.profile.publicListingStatus,
      publicSlug: null,
      readinessGates: application.readinessGates,
      selfPausedAt: null,
      state: "no_profile",
    };
  }

  const selfPausedAt = await loadSelfPausedAt(account.id);

  const adminHold = buildAdminHold(application.profile.publicListingStatus);

  const missingGateKeys = application.readinessGates
    .filter((gate) => gate.state !== "complete")
    .map((gate) => gate.key);

  return {
    applicationStatus: application.applicationStatus,
    adminHold,
    capabilities: application.profile.capabilities,
    canPublish: missingGateKeys.length === 0 && adminHold === null,
    draft: application.profile.draft,
    hasMeetingLink: application.profile.hasMeetingLink,
    hasScheduleRules: application.profile.hasScheduleRules,
    missingGateKeys,
    options: application.options,
    payoutReadinessStatus: application.profile.payoutReadinessStatus,
    publicListingStatus: application.profile.publicListingStatus,
    publicSlug: application.profile.publicSlug,
    readinessGates: application.readinessGates,
    selfPausedAt,
    state: "ready",
  };
}

function buildAdminHold(
  status: TutorPublicListingStatus,
): TutorProfileEditorAdminHold | null {
  if (status === "paused") {
    return {
      message:
        "Mentor IB has temporarily paused your public profile. Check your notifications for details.",
      status: "paused",
    };
  }
  if (status === "delisted") {
    return {
      message:
        "Mentor IB has removed your profile from public discovery. Check your notifications for details.",
      status: "delisted",
    };
  }
  return null;
}

async function loadSelfPausedAt(appUserId: string): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("self_paused_at")
    .eq("app_user_id", appUserId)
    .maybeSingle<{ self_paused_at: string | null }>();

  if (error) {
    throw new Error("Could not load tutor profile self-paused state.");
  }

  return data?.self_paused_at ?? null;
}
