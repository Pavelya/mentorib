"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildPostSignInRedirect,
  ensureAuthAccount,
} from "@/lib/auth/account-service";
import { buildAuthSignInPath } from "@/lib/auth/allowed-redirects";
import { routeFamilies } from "@/lib/routing/route-families";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  hasRole,
  isRestrictedAccount,
  requiresRoleSelection,
} from "@/modules/accounts/account-state";
import {
  type LessonIssueType,
  lessonIssueTypes,
} from "@/modules/lessons/constants";
import {
  acceptTutorLessonRequest,
  cancelTutorLesson,
  declineTutorLessonRequest,
  reportTutorLessonIssue,
  LessonActionError,
  type TutorRequestDecision,
} from "@/modules/lessons/lesson-actions";
import {
  LessonReportActionError,
  saveTutorLessonReportDraft,
  shareTutorLessonReport,
  submitTutorLessonReport,
} from "@/modules/lessons/lesson-reports";

export type RequestDecisionActionState = {
  code: string | null;
  decision: TutorRequestDecision | null;
  message: string | null;
  values: { lessonId: string; operationKey: string };
};

export type CancelLessonActionState = {
  code: string | null;
  message: string | null;
  outcome: "authorization_released" | "refund_issued" | "no_refund" | null;
  values: { lessonId: string; operationKey: string };
};

export type ReportIssueActionState = {
  code: string | null;
  fieldErrors: Partial<Record<"issueType" | "summary", string>>;
  message: string | null;
  values: { issueType: string; lessonId: string; summary: string };
};

export type SaveLessonRecapDraftActionState = {
  code: string | null;
  message: string | null;
  values: {
    coverageSummary: string;
    goalSummary: string;
    lessonId: string;
    nextStepsSummary: string;
    studentConfidenceSignal: string;
  };
};

export type SubmitLessonRecapActionState = {
  code: string | null;
  message: string | null;
  values: { lessonId: string };
};

export type ShareLessonRecapActionState = {
  code: string | null;
  message: string | null;
  values: { lessonId: string };
};

const LESSONS_BASE_PATH = "/tutor/lessons" as const;
const STUDENT_LESSONS_BASE_PATH = "/lessons" as const;

export async function acceptRequestAction(
  _previousState: RequestDecisionActionState,
  formData: FormData,
): Promise<RequestDecisionActionState> {
  return resolveRequestDecisionAction(formData, "accepted");
}

export async function declineRequestAction(
  _previousState: RequestDecisionActionState,
  formData: FormData,
): Promise<RequestDecisionActionState> {
  return resolveRequestDecisionAction(formData, "declined");
}

async function resolveRequestDecisionAction(
  formData: FormData,
  decision: TutorRequestDecision,
): Promise<RequestDecisionActionState> {
  const values = {
    lessonId: getFormValue(formData, "lessonId"),
    operationKey: getFormValue(formData, "operationKey"),
  };

  if (!values.lessonId) {
    return {
      code: "missing_lesson",
      decision: null,
      message:
        "We couldn't recover this lesson context. Refresh the page and try again.",
      values,
    };
  }

  if (!values.operationKey) {
    return {
      code: "missing_operation_key",
      decision: null,
      message:
        "We couldn't secure this request. Refresh the page and try again.",
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;
  const account = await requireTutorAccount(detailHref);

  if (account.kind === "redirect") {
    return account.state ?? {
      code: "account_restricted",
      decision: null,
      message: "This account cannot act on this lesson right now.",
      values,
    };
  }

  try {
    const result =
      decision === "accepted"
        ? await acceptTutorLessonRequest({
            account: account.value,
            lessonId: values.lessonId,
            operationKey: values.operationKey,
          })
        : await declineTutorLessonRequest({
            account: account.value,
            lessonId: values.lessonId,
            operationKey: values.operationKey,
          });

    revalidatePath(detailHref);
    revalidatePath(LESSONS_BASE_PATH);

    return {
      code: result === "accepted" ? "accepted" : "declined",
      decision: result,
      message: messageForDecision(result),
      values,
    };
  } catch (error) {
    if (error instanceof LessonActionError) {
      return {
        code: error.code,
        decision: null,
        message: error.message,
        values,
      };
    }

    return {
      code: decision === "accepted" ? "accept_failed" : "decline_failed",
      decision: null,
      message:
        decision === "accepted"
          ? "We couldn't accept this request. Please try again in a moment."
          : "We couldn't decline this request. Please try again in a moment.",
      values,
    };
  }
}

export async function cancelTutorLessonAction(
  _previousState: CancelLessonActionState,
  formData: FormData,
): Promise<CancelLessonActionState> {
  const values = {
    lessonId: getFormValue(formData, "lessonId"),
    operationKey: getFormValue(formData, "operationKey"),
  };

  if (!values.lessonId) {
    return {
      code: "missing_lesson",
      message:
        "We couldn't recover this lesson context. Refresh the page and try again.",
      outcome: null,
      values,
    };
  }

  if (!values.operationKey) {
    return {
      code: "missing_operation_key",
      message:
        "We couldn't secure the cancellation request. Refresh the page and try again.",
      outcome: null,
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;
  const account = await requireTutorAccountForCancel(detailHref);

  if (account.kind === "redirect") {
    return account.state ?? {
      code: "account_restricted",
      message: "This account cannot cancel this lesson right now.",
      outcome: null,
      values,
    };
  }

  try {
    const outcome = await cancelTutorLesson(
      account.value,
      values.lessonId,
      values.operationKey,
    );

    revalidatePath(detailHref);
    revalidatePath(LESSONS_BASE_PATH);

    return {
      code: "cancelled",
      message: cancelMessageForOutcome(outcome),
      outcome,
      values,
    };
  } catch (error) {
    if (error instanceof LessonActionError) {
      return {
        code: error.code,
        message: error.message,
        outcome: null,
        values,
      };
    }

    return {
      code: "cancellation_failed",
      message: "We couldn't cancel this lesson. Please try again in a moment.",
      outcome: null,
      values,
    };
  }
}

export async function reportTutorLessonIssueAction(
  _previousState: ReportIssueActionState,
  formData: FormData,
): Promise<ReportIssueActionState> {
  const values = {
    issueType: getFormValue(formData, "issueType"),
    lessonId: getFormValue(formData, "lessonId"),
    summary: getFormValue(formData, "summary"),
  };

  if (!values.lessonId) {
    return {
      code: "missing_lesson",
      fieldErrors: {},
      message:
        "We couldn't recover this lesson context. Refresh the page and try again.",
      values,
    };
  }

  if (!isLessonIssueType(values.issueType)) {
    return {
      code: "missing_issue_type",
      fieldErrors: { issueType: "Choose one of the listed issue reasons." },
      message: "Choose one of the listed issue reasons before submitting.",
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;
  const account = await requireTutorAccountForReport(detailHref);

  if (account.kind === "redirect") {
    return account.state ?? {
      code: "account_restricted",
      fieldErrors: {},
      message: "This account cannot report a lesson issue right now.",
      values,
    };
  }

  try {
    await reportTutorLessonIssue(account.value, values.lessonId, {
      issueType: values.issueType,
      summary: values.summary,
    });

    revalidatePath(detailHref);
    revalidatePath(LESSONS_BASE_PATH);

    return {
      code: "submitted",
      fieldErrors: {},
      message:
        "Thanks for the report. Our team will follow up before the counterparty deadline.",
      values: { issueType: values.issueType, lessonId: values.lessonId, summary: "" },
    };
  } catch (error) {
    if (error instanceof LessonActionError) {
      return {
        code: error.code,
        fieldErrors: {},
        message: error.message,
        values,
      };
    }

    return {
      code: "report_failed",
      fieldErrors: {},
      message: "We couldn't record this lesson issue. Please try again in a moment.",
      values,
    };
  }
}

type AccountResult<TState> =
  | { kind: "value"; value: Awaited<ReturnType<typeof ensureAuthAccount>> }
  | { kind: "redirect"; state: TState | null };

async function requireTutorAccount(
  detailHref: string,
): Promise<AccountResult<RequestDecisionActionState>> {
  return resolveTutorAccount<RequestDecisionActionState>(detailHref, (state) => ({
    code: state,
    decision: null,
    message: tutorAccountMessage(state),
    values: { lessonId: "", operationKey: "" },
  }));
}

async function requireTutorAccountForCancel(
  detailHref: string,
): Promise<AccountResult<CancelLessonActionState>> {
  return resolveTutorAccount<CancelLessonActionState>(detailHref, (state) => ({
    code: state,
    message: tutorAccountMessage(state),
    outcome: null,
    values: { lessonId: "", operationKey: "" },
  }));
}

async function requireTutorAccountForReport(
  detailHref: string,
): Promise<AccountResult<ReportIssueActionState>> {
  return resolveTutorAccount<ReportIssueActionState>(detailHref, (state) => ({
    code: state,
    fieldErrors: {},
    message: tutorAccountMessage(state),
    values: { issueType: "", lessonId: "", summary: "" },
  }));
}

async function resolveTutorAccount<TState>(
  detailHref: string,
  buildBlockedState: (code: string) => TState,
): Promise<AccountResult<TState>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(detailHref) as Route);
  }

  const account = await ensureAuthAccount(user);

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return { kind: "redirect", state: buildBlockedState("account_restricted") };
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, detailHref) as Route);
  }

  return { kind: "value", value: account };
}

function tutorAccountMessage(code: string) {
  if (code === "account_restricted") {
    return "This account cannot act on this lesson right now.";
  }

  return "We couldn't verify your tutor account.";
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isLessonIssueType(value: string): value is LessonIssueType {
  return (lessonIssueTypes as readonly string[]).includes(value);
}

async function withTutorAccount(
  detailHref: string,
  handler: (account: Awaited<ReturnType<typeof ensureAuthAccount>>) => Promise<
    | { kind: "ok" }
    | { kind: "error"; code: string; message: string }
  >,
): Promise<
  | { kind: "ok" }
  | { kind: "error"; code: string; message: string }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(detailHref) as Route);
  }

  const account = await ensureAuthAccount(user);

  if (requiresRoleSelection(account)) {
    redirect(routeFamilies.setup.defaultHref);
  }

  if (isRestrictedAccount(account)) {
    return {
      kind: "error",
      code: "account_restricted",
      message: "This account cannot edit this recap right now.",
    };
  }

  if (!hasRole(account, "tutor")) {
    redirect(buildPostSignInRedirect(account, detailHref) as Route);
  }

  return handler(account);
}

export async function saveLessonRecapDraftAction(
  _previousState: SaveLessonRecapDraftActionState,
  formData: FormData,
): Promise<SaveLessonRecapDraftActionState> {
  const values = {
    coverageSummary: getFormValue(formData, "coverageSummary"),
    goalSummary: getFormValue(formData, "goalSummary"),
    lessonId: getFormValue(formData, "lessonId"),
    nextStepsSummary: getFormValue(formData, "nextStepsSummary"),
    studentConfidenceSignal: getFormValue(formData, "studentConfidenceSignal"),
  };

  if (!values.lessonId) {
    return {
      code: "missing_lesson",
      message:
        "We couldn't recover this lesson context. Refresh the page and try again.",
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;

  const result = await withTutorAccount(detailHref, async (account) => {
    try {
      await saveTutorLessonReportDraft(account, values.lessonId, {
        coverageSummary: values.coverageSummary,
        goalSummary: values.goalSummary,
        nextStepsSummary: values.nextStepsSummary,
        studentConfidenceSignal: values.studentConfidenceSignal,
      });

      revalidatePath(detailHref);

      return { kind: "ok" };
    } catch (error) {
      if (error instanceof LessonReportActionError) {
        return { kind: "error", code: error.code, message: error.message };
      }

      return {
        kind: "error",
        code: "report_save_failed",
        message:
          "We couldn't save your recap draft. Please try again in a moment.",
      };
    }
  });

  if (result.kind === "error") {
    return { code: result.code, message: result.message, values };
  }

  return {
    code: "saved",
    message: "Draft saved. You can keep editing or submit it when ready.",
    values,
  };
}

export async function submitLessonRecapAction(
  _previousState: SubmitLessonRecapActionState,
  formData: FormData,
): Promise<SubmitLessonRecapActionState> {
  const values = { lessonId: getFormValue(formData, "lessonId") };

  if (!values.lessonId) {
    return {
      code: "missing_lesson",
      message:
        "We couldn't recover this lesson context. Refresh the page and try again.",
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;

  const result = await withTutorAccount(detailHref, async (account) => {
    try {
      await submitTutorLessonReport(account, values.lessonId);

      revalidatePath(detailHref);

      return { kind: "ok" };
    } catch (error) {
      if (error instanceof LessonReportActionError) {
        return { kind: "error", code: error.code, message: error.message };
      }

      return {
        kind: "error",
        code: "report_submit_failed",
        message: "We couldn't submit this recap. Please try again in a moment.",
      };
    }
  });

  if (result.kind === "error") {
    return { code: result.code, message: result.message, values };
  }

  return {
    code: "submitted",
    message:
      "Recap submitted. Share it with the student when you're ready — it stays private until you do.",
    values,
  };
}

export async function shareLessonRecapAction(
  _previousState: ShareLessonRecapActionState,
  formData: FormData,
): Promise<ShareLessonRecapActionState> {
  const values = { lessonId: getFormValue(formData, "lessonId") };

  if (!values.lessonId) {
    return {
      code: "missing_lesson",
      message:
        "We couldn't recover this lesson context. Refresh the page and try again.",
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;
  const studentDetailHref = `${STUDENT_LESSONS_BASE_PATH}/${values.lessonId}`;

  const result = await withTutorAccount(detailHref, async (account) => {
    try {
      await shareTutorLessonReport(account, values.lessonId);

      revalidatePath(detailHref);
      revalidatePath(studentDetailHref);

      return { kind: "ok" };
    } catch (error) {
      if (error instanceof LessonReportActionError) {
        return { kind: "error", code: error.code, message: error.message };
      }

      return {
        kind: "error",
        code: "report_share_failed",
        message: "We couldn't share this recap. Please try again in a moment.",
      };
    }
  });

  if (result.kind === "error") {
    return { code: result.code, message: result.message, values };
  }

  return {
    code: "shared",
    message:
      "Recap shared with the student. They'll see it on the lesson detail and be notified in the app.",
    values,
  };
}

function messageForDecision(decision: TutorRequestDecision) {
  if (decision === "accepted") {
    return "Lesson confirmed. The student's payment has been captured and they have been notified.";
  }

  return "Request declined. The student's payment authorization has been released and they have been notified.";
}

function cancelMessageForOutcome(
  outcome: "authorization_released" | "refund_issued" | "no_refund",
) {
  switch (outcome) {
    case "authorization_released":
      return "Lesson cancelled. The student's payment authorization has been released.";
    case "refund_issued":
      return "Lesson cancelled. The student is being refunded under the platform cancellation policy.";
    case "no_refund":
      return "Lesson cancelled. The captured payment is retained under the platform cancellation policy.";
  }
}
