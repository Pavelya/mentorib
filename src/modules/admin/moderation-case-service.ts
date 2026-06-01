import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction } from "@/modules/admin/audit-service";
import type {
  ModerationCaseKind,
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
  ModerationCaseSubjectKind,
} from "@/modules/admin/constants";
import {
  isAllowedCaseTransition,
  isAllowedResolutionKind,
  resolveNextCaseStatus,
} from "@/modules/admin/moderation-case-state";

export class ModerationCaseError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const NOTE_MAX_LENGTH = 2000;

type CaseLookupRow = {
  case_kind: ModerationCaseKind;
  case_status: ModerationCaseStatus;
  claimed_by_app_user_id: string | null;
  id: string;
  resolution_kind: ModerationCaseResolutionKind | null;
};

export type OpenCaseInput = {
  caseKind: ModerationCaseKind;
  subjectKind: ModerationCaseSubjectKind;
  subjectId: string;
  actorAppUserId: string;
  reporterAppUserId?: string | null;
  triggeringEventKind?: string | null;
  triggeringEventId?: string | null;
  priority?: number;
  internalSummary?: string | null;
};

// Opens a new case. The "opening" actor is the admin/system process that
// transcribes the report into a case row; the real reporter (if known)
// lives in `reporterAppUserId`. Product surfaces opening cases automatically
// (e.g. from a Report action) are wired in `P2-OPS-001`.
export async function openCase(input: OpenCaseInput): Promise<{ caseId: string }> {
  const supabase = createSupabaseServiceRoleClient();
  const sanitizedSummary = sanitizeNote(input.internalSummary ?? null);
  const { data, error } = await supabase
    .from("moderation_cases")
    .insert({
      case_kind: input.caseKind,
      internal_summary: sanitizedSummary,
      priority: input.priority ?? 0,
      reporter_app_user_id: input.reporterAppUserId ?? null,
      subject_id: input.subjectId,
      subject_kind: input.subjectKind,
      triggering_event_id: input.triggeringEventId ?? null,
      triggering_event_kind: input.triggeringEventKind ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new ModerationCaseError(
      "case_open_failed",
      "Could not open the moderation case.",
    );
  }

  try {
    await recordAdminAction({
      action: resolveOpenActionKey(),
      actorAppUserId: input.actorAppUserId,
      afterState: {
        caseKind: input.caseKind,
        caseStatus: "queued",
        subjectKind: input.subjectKind,
      },
      targetId: data.id,
      targetType: "moderation_case",
    });
  } catch (auditError) {
    // Roll back the case so audit + state stay consistent.
    await supabase.from("moderation_cases").delete().eq("id", data.id);
    throw auditError;
  }

  return { caseId: data.id };
}

export type ClaimCaseInput = {
  caseId: string;
  actorAppUserId: string;
};

export async function claimCase(input: ClaimCaseInput): Promise<void> {
  await runCaseTransition({
    action: "claim",
    actorAppUserId: input.actorAppUserId,
    caseId: input.caseId,
  });
}

export type ResolveCaseInput = {
  caseId: string;
  actorAppUserId: string;
  resolutionKind: ModerationCaseResolutionKind;
  internalSummary?: string | null;
  reason?: string | null;
};

export async function resolveCase(input: ResolveCaseInput): Promise<void> {
  if (!isAllowedResolutionKind(input.resolutionKind)) {
    throw new ModerationCaseError(
      "invalid_resolution_kind",
      "That resolution kind is not allowed.",
    );
  }
  await runCaseTransition({
    action: "resolve",
    actorAppUserId: input.actorAppUserId,
    caseId: input.caseId,
    internalSummary: sanitizeNote(input.internalSummary),
    reason: input.reason ?? null,
    resolutionKind: input.resolutionKind,
  });
}

export type DismissCaseInput = {
  caseId: string;
  actorAppUserId: string;
  reason: string;
};

export async function dismissCase(input: DismissCaseInput): Promise<void> {
  const reason = sanitizeNote(input.reason);
  if (!reason) {
    throw new ModerationCaseError(
      "reason_required",
      "Share why this case is being dismissed.",
    );
  }
  await runCaseTransition({
    action: "dismiss",
    actorAppUserId: input.actorAppUserId,
    caseId: input.caseId,
    reason,
    resolutionKind: "dismiss",
  });
}

export type AddCaseNoteInput = {
  caseId: string;
  actorAppUserId: string;
  body: string;
};

export async function addCaseNote(input: AddCaseNoteInput): Promise<void> {
  const body = sanitizeNote(input.body);
  if (!body) {
    throw new ModerationCaseError(
      "body_required",
      "Add a note before saving.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: noteRow, error } = await supabase
    .from("moderation_case_notes")
    .insert({
      author_app_user_id: input.actorAppUserId,
      body,
      case_id: input.caseId,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !noteRow) {
    throw new ModerationCaseError(
      "note_insert_failed",
      "Could not save that note.",
    );
  }

  try {
    await recordAdminAction({
      action: "moderation_case.note_added",
      actorAppUserId: input.actorAppUserId,
      afterState: { caseId: input.caseId, noteId: noteRow.id },
      targetId: input.caseId,
      targetType: "moderation_case_note",
    });
  } catch {
    // Note bodies are user-visible-only to admins; if audit recording
    // fails, roll the note back so audit coverage is preserved.
    await supabase.from("moderation_case_notes").delete().eq("id", noteRow.id);
    throw new ModerationCaseError(
      "note_audit_failed",
      "Could not record the note in the audit log.",
    );
  }
}

type CaseTransitionInput = {
  action: "claim" | "resolve" | "dismiss" | "escalate";
  actorAppUserId: string;
  caseId: string;
  internalSummary?: string | null;
  reason?: string | null;
  resolutionKind?: ModerationCaseResolutionKind;
};

async function runCaseTransition(input: CaseTransitionInput): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const existing = await loadCase(input.caseId);
  if (!existing) {
    throw new ModerationCaseError(
      "case_not_found",
      "We couldn't find that moderation case.",
    );
  }

  if (!isAllowedCaseTransition(input.action, existing.case_status)) {
    throw new ModerationCaseError(
      "conflict",
      "This action isn't available for the current case state.",
    );
  }

  const nextStatus = resolveNextCaseStatus(input.action, existing.case_status);
  if (!nextStatus) {
    throw new ModerationCaseError(
      "conflict",
      "This action isn't available for the current case state.",
    );
  }

  const nowIso = new Date().toISOString();
  const updates: {
    case_status: typeof nextStatus;
    claimed_at?: string | null;
    claimed_by_app_user_id?: string | null;
    internal_summary?: string | null;
    resolution_kind?: ModerationCaseResolutionKind | null;
    resolved_at?: string | null;
    resolved_by_app_user_id?: string | null;
  } = { case_status: nextStatus };

  if (input.action === "claim") {
    updates.claimed_at = nowIso;
    updates.claimed_by_app_user_id = input.actorAppUserId;
  }
  if (input.action === "resolve" || input.action === "dismiss") {
    updates.resolved_at = nowIso;
    updates.resolved_by_app_user_id = input.actorAppUserId;
    updates.resolution_kind = input.resolutionKind ?? null;
    if (input.internalSummary !== undefined) {
      updates.internal_summary = input.internalSummary;
    }
  }

  const { error: updateError } = await supabase
    .from("moderation_cases")
    .update(updates)
    .eq("id", existing.id)
    .eq("case_status", existing.case_status);

  if (updateError) {
    throw new ModerationCaseError(
      "case_update_failed",
      "We couldn't update the moderation case right now.",
    );
  }

  try {
    await recordAdminAction({
      action: resolveTransitionActionKey(input.action),
      actorAppUserId: input.actorAppUserId,
      afterState: {
        caseStatus: nextStatus,
        resolutionKind: input.resolutionKind ?? null,
      },
      beforeState: { caseStatus: existing.case_status },
      reason: input.reason ?? null,
      targetId: existing.id,
      targetType: "moderation_case",
    });
  } catch (auditError) {
    // Roll back the state change so audit + state stay consistent.
    const rollback: {
      case_status: ModerationCaseStatus;
      claimed_at?: string | null;
      claimed_by_app_user_id?: string | null;
      resolution_kind?: ModerationCaseResolutionKind | null;
      resolved_at?: string | null;
      resolved_by_app_user_id?: string | null;
    } = {
      case_status: existing.case_status,
    };
    if (input.action === "claim") {
      rollback.claimed_at = null;
      rollback.claimed_by_app_user_id = null;
    }
    if (input.action === "resolve" || input.action === "dismiss") {
      rollback.resolved_at = null;
      rollback.resolved_by_app_user_id = null;
      rollback.resolution_kind = existing.resolution_kind;
    }
    await supabase.from("moderation_cases").update(rollback).eq("id", existing.id);
    throw auditError;
  }
}

async function loadCase(caseId: string): Promise<CaseLookupRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("moderation_cases")
    .select(
      "case_kind, case_status, claimed_by_app_user_id, id, resolution_kind",
    )
    .eq("id", caseId)
    .maybeSingle<CaseLookupRow>();
  if (error) {
    throw new ModerationCaseError(
      "case_lookup_failed",
      "We couldn't read that moderation case.",
    );
  }
  return data ?? null;
}

function sanitizeNote(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, NOTE_MAX_LENGTH);
}

export type OpenReportFromProductInput = {
  reporterAppUserId: string;
  reporterReason: string;
  subjectKind: ModerationCaseSubjectKind;
  subjectId: string;
  triggeringEventKind?: string | null;
  triggeringEventId?: string | null;
};

// Opens a `report` case from a product surface (e.g. the "Report this
// message" action in the messages experience). The reporter's free-text
// reason is captured durably in two ways per `P2-OPS-001`:
//   1. as `moderation_cases.internal_summary` (admin-only, surfaced on
//      the case-detail "Case summary" Panel)
//   2. as a `moderation_case_notes` row authored by the reporter,
//      written via service-role so the reporter never reads other
//      operators' notes back from the same table
export async function openReportFromProduct(
  input: OpenReportFromProductInput,
): Promise<{ caseId: string }> {
  const reason = sanitizeNote(input.reporterReason);
  if (!reason) {
    throw new ModerationCaseError(
      "reason_required",
      "Add a short note about what you're reporting.",
    );
  }

  const opened = await openCase({
    actorAppUserId: input.reporterAppUserId,
    caseKind: "report",
    internalSummary: reason,
    reporterAppUserId: input.reporterAppUserId,
    subjectId: input.subjectId,
    subjectKind: input.subjectKind,
    triggeringEventId: input.triggeringEventId ?? null,
    triggeringEventKind: input.triggeringEventKind ?? null,
  });

  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("moderation_case_notes").insert({
    author_app_user_id: input.reporterAppUserId,
    body: reason,
    case_id: opened.caseId,
  });

  return opened;
}

export type OpenReviewReportInput = {
  reporterAppUserId: string;
  reporterReason: string;
  tutorProfileId: string;
  reviewId: string;
};

// Opens a `review` case from the public tutor profile when a viewer reports
// an inappropriate published review (`P2-ADMIN-TRUST-001`). The subject is the
// tutor profile the review lives on; the reported review id is captured in
// `triggering_event_id` so the operator can find the exact review in the
// `/internal/reviews` moderation queue. The reporter's note is stored the same
// way `openReportFromProduct` stores it: as `internal_summary` plus a
// reporter-authored case note.
export async function openReviewReport(
  input: OpenReviewReportInput,
): Promise<{ caseId: string }> {
  const reason = sanitizeNote(input.reporterReason);
  if (!reason) {
    throw new ModerationCaseError(
      "reason_required",
      "Add a short note about what you're reporting.",
    );
  }

  const opened = await openCase({
    actorAppUserId: input.reporterAppUserId,
    caseKind: "review",
    internalSummary: reason,
    reporterAppUserId: input.reporterAppUserId,
    subjectId: input.tutorProfileId,
    subjectKind: "tutor_profile",
    triggeringEventId: input.reviewId,
    triggeringEventKind: "tutor_review",
  });

  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("moderation_case_notes").insert({
    author_app_user_id: input.reporterAppUserId,
    body: reason,
    case_id: opened.caseId,
  });

  return opened;
}

function resolveOpenActionKey() {
  return "moderation_case.open" as const;
}

function resolveTransitionActionKey(action: CaseTransitionInput["action"]) {
  switch (action) {
    case "claim":
      return "moderation_case.claim" as const;
    case "resolve":
      return "moderation_case.resolve" as const;
    case "dismiss":
      return "moderation_case.dismiss" as const;
    case "escalate":
      return "moderation_case.escalate" as const;
  }
}
