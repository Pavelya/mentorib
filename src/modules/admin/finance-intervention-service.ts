import "server-only";

import { revalidatePath } from "next/cache";

import { recordAdminAction } from "@/modules/admin/audit-service";
import {
  FINANCE_INTERVENTION_KINDS,
  type FinanceInterventionKind,
} from "@/modules/admin/constants";
import {
  ModerationCaseError,
  openCase,
} from "@/modules/admin/moderation-case-service";

// `P2-OPS-002` finance-intervention note.
//
// Records admin intent to place a payout hold or flag a refund anomaly
// as a `moderation_cases` row with `case_kind = 'finance_intervention'`.
// No Stripe write — actually placing or releasing a hold is the
// responsibility of the payouts module (`P1-TUTOR-005`) if/when that
// surface is added.

export class FinanceInterventionError extends Error {
  code:
    | "kind_required"
    | "body_required"
    | "target_required"
    | "open_failed";

  constructor(
    code:
      | "kind_required"
      | "body_required"
      | "target_required"
      | "open_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export function isFinanceInterventionKind(
  value: string,
): value is FinanceInterventionKind {
  return (FINANCE_INTERVENTION_KINDS as readonly string[]).includes(value);
}

export type RecordFinanceInterventionNoteInput = {
  actorAppUserId: string;
  targetAppUserId: string;
  kind: FinanceInterventionKind;
  body: string;
};

const BODY_MAX_LENGTH = 2000;

export async function recordFinanceInterventionNote(
  input: RecordFinanceInterventionNoteInput,
): Promise<{ caseId: string }> {
  if (!input.targetAppUserId) {
    throw new FinanceInterventionError(
      "target_required",
      "Missing target user reference.",
    );
  }
  if (!isFinanceInterventionKind(input.kind)) {
    throw new FinanceInterventionError(
      "kind_required",
      "Pick a finance-intervention kind before saving.",
    );
  }
  const body = input.body.trim().slice(0, BODY_MAX_LENGTH);
  if (!body) {
    throw new FinanceInterventionError(
      "body_required",
      "Add a short note describing the intervention.",
    );
  }

  // `internal_summary` carries a one-line "kind: body" so the case
  // detail page can render the intent label without a join. The body
  // is also written as a `moderation_case_notes` row by the case-detail
  // surface; this opener only seeds the case itself.
  const summary = `${input.kind}: ${body}`;

  try {
    const opened = await openCase({
      actorAppUserId: input.actorAppUserId,
      caseKind: "finance_intervention",
      internalSummary: summary,
      subjectId: input.targetAppUserId,
      subjectKind: "app_user",
    });

    try {
      await recordAdminAction({
        action: "finance_intervention.note",
        actorAppUserId: input.actorAppUserId,
        afterState: { caseId: opened.caseId, kind: input.kind },
        reason: null,
        targetId: opened.caseId,
        targetType: "moderation_case",
      });
    } catch (auditError) {
      // The case was opened with its own `moderation_case.open` audit
      // row; failing the secondary action key is non-fatal — log and
      // continue so the case persists.
      throw auditError;
    }

    revalidatePath(`/internal/users/${input.targetAppUserId}`);

    return opened;
  } catch (error) {
    if (error instanceof ModerationCaseError) {
      throw new FinanceInterventionError("open_failed", error.message);
    }
    throw error;
  }
}
