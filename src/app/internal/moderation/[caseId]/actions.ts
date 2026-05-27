"use server";

import { revalidatePath } from "next/cache";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  MODERATION_CASE_RESOLUTION_KINDS,
  type ModerationCaseResolutionKind,
} from "@/modules/admin/constants";
import {
  ModerationCaseError,
  addCaseNote,
  claimCase,
  dismissCase,
  resolveCase,
} from "@/modules/admin/moderation-case-service";
import { loadModerationCaseDetail } from "@/modules/admin/moderation-case-repository";
import { applyPublicTakedownEffects } from "@/modules/admin/public-takedown-service";
import { createModerationReportAcknowledgementNotification } from "@/modules/notifications/lifecycle";

export type CaseActionState = {
  code: string | null;
  intent: "claim" | "resolve" | "dismiss" | "add_note" | null;
  message: string | null;
  successMessage: string | null;
};

export const initialCaseActionState: CaseActionState = {
  code: null,
  intent: null,
  message: null,
  successMessage: null,
};

const CASE_INTENTS = ["claim", "resolve", "dismiss", "add_note"] as const;
type CaseIntent = (typeof CASE_INTENTS)[number];

export async function runCaseAction(
  _previous: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const caseId = readString(formData, "case_id");
  const intent = readIntent(formData);

  if (!caseId) {
    return {
      code: "missing_case",
      intent,
      message: "Missing case reference.",
      successMessage: null,
    };
  }

  let admin;
  try {
    admin = await requireInternalAdminAccount();
  } catch (error) {
    throw error;
  }

  try {
    if (intent === "claim") {
      await claimCase({ actorAppUserId: admin.id, caseId });
    } else if (intent === "add_note") {
      const body = readString(formData, "body");
      await addCaseNote({ actorAppUserId: admin.id, body, caseId });
    } else if (intent === "dismiss") {
      const reason = readString(formData, "reason");
      await dismissCase({ actorAppUserId: admin.id, caseId, reason });
    } else if (intent === "resolve") {
      const resolutionKind = readResolutionKind(formData);
      const internalSummary = readString(formData, "internal_summary") || null;
      const reason = readString(formData, "reason") || null;

      if (!resolutionKind) {
        return {
          code: "invalid_resolution_kind",
          intent,
          message: "Pick a resolution kind before saving.",
          successMessage: null,
        };
      }

      // Capture pre-resolve case context so the side-effect dispatch
      // knows the case kind without a second round-trip.
      const detail = await loadModerationCaseDetail(caseId);
      if (!detail) {
        return {
          code: "case_not_found",
          intent,
          message: "We couldn't find that moderation case.",
          successMessage: null,
        };
      }

      await resolveCase({
        actorAppUserId: admin.id,
        caseId,
        internalSummary,
        reason,
        resolutionKind,
      });

      await dispatchPostResolveSideEffects({
        actorAppUserId: admin.id,
        caseDetail: detail,
        reason,
        resolutionKind,
      });
    }
  } catch (error) {
    if (error instanceof ModerationCaseError) {
      return {
        code: error.code,
        intent,
        message: error.message,
        successMessage: null,
      };
    }
    return {
      code: "unexpected",
      intent,
      message: "We couldn't apply that action right now.",
      successMessage: null,
    };
  }

  revalidatePath(`/internal/moderation/${caseId}`);
  revalidatePath("/internal/moderation");
  revalidatePath("/internal");

  return {
    code: "ok",
    intent,
    message: null,
    successMessage: buildSuccessMessage(intent),
  };
}

async function dispatchPostResolveSideEffects(input: {
  actorAppUserId: string;
  caseDetail: NonNullable<Awaited<ReturnType<typeof loadModerationCaseDetail>>>;
  reason: string | null;
  resolutionKind: ModerationCaseResolutionKind;
}) {
  const { actorAppUserId, caseDetail, reason, resolutionKind } = input;

  if (
    caseDetail.caseKind === "public_content_takedown" &&
    resolutionKind === "uphold"
  ) {
    await applyPublicTakedownEffects({
      actorAppUserId,
      reason,
      tutorProfileId: caseDetail.subjectId,
    });
  }

  if (
    caseDetail.caseKind === "report" &&
    (resolutionKind === "uphold" || resolutionKind === "reject") &&
    caseDetail.reporterAppUserId
  ) {
    await createModerationReportAcknowledgementNotification({
      caseId: caseDetail.caseId,
      reporterAppUserId: caseDetail.reporterAppUserId,
      resolutionKind: resolutionKind === "uphold" ? "upheld" : "rejected",
    });
  }
}

function buildSuccessMessage(intent: CaseIntent): string {
  switch (intent) {
    case "claim":
      return "Case claimed.";
    case "resolve":
      return "Case resolved.";
    case "dismiss":
      return "Case dismissed.";
    case "add_note":
      return "Note added.";
  }
}

function readIntent(formData: FormData): CaseIntent {
  const raw = formData.get("intent");
  if (typeof raw === "string" && (CASE_INTENTS as readonly string[]).includes(raw)) {
    return raw as CaseIntent;
  }
  return "claim";
}

function readResolutionKind(
  formData: FormData,
): ModerationCaseResolutionKind | null {
  const raw = formData.get("resolution_kind");
  if (typeof raw !== "string") {
    return null;
  }
  if ((MODERATION_CASE_RESOLUTION_KINDS as readonly string[]).includes(raw)) {
    return raw as ModerationCaseResolutionKind;
  }
  return null;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
