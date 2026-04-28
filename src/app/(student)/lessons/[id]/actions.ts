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
  cancelStudentLesson,
  reportStudentLessonIssue,
  LessonActionError,
} from "@/modules/lessons/lesson-actions";

export type CancelLessonActionState = {
  code: string | null;
  message: string | null;
  outcome: "authorization_released" | "refund_issued" | "no_refund" | null;
  values: { lessonId: string; operationKey: string };
};

export type RescheduleLessonActionState = {
  code: string | null;
  message: string | null;
  values: { lessonId: string; operationKey: string; rebookHref: string };
};

export type ReportIssueActionState = {
  code: string | null;
  fieldErrors: Partial<Record<"issueType" | "summary", string>>;
  message: string | null;
  values: { issueType: string; lessonId: string; summary: string };
};

const LESSONS_BASE_PATH = "/lessons" as const;

export async function cancelLessonAction(
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
      message: "We couldn't recover this lesson context. Refresh the page and try again.",
      outcome: null,
      values,
    };
  }

  if (!values.operationKey) {
    return {
      code: "missing_operation_key",
      message: "We couldn't secure the cancellation request. Refresh the page and try again.",
      outcome: null,
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(detailHref) as Route);
  }

  try {
    const account = await ensureAuthAccount(user);

    if (requiresRoleSelection(account)) {
      redirect(routeFamilies.setup.defaultHref);
    }

    if (isRestrictedAccount(account)) {
      return {
        code: "account_restricted",
        message: "This account cannot cancel this lesson right now.",
        outcome: null,
        values,
      };
    }

    if (!hasRole(account, "student")) {
      redirect(buildPostSignInRedirect(account, detailHref) as Route);
    }

    const outcome = await cancelStudentLesson(
      account,
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

export async function rescheduleLessonAction(
  _previousState: RescheduleLessonActionState,
  formData: FormData,
): Promise<RescheduleLessonActionState> {
  const values = {
    lessonId: getFormValue(formData, "lessonId"),
    operationKey: getFormValue(formData, "operationKey"),
    rebookHref: getFormValue(formData, "rebookHref"),
  };

  if (!values.lessonId) {
    return {
      code: "missing_lesson",
      message: "We couldn't recover this lesson context. Refresh the page and try again.",
      values,
    };
  }

  if (!values.operationKey) {
    return {
      code: "missing_operation_key",
      message: "We couldn't secure the reschedule request. Refresh the page and try again.",
      values,
    };
  }

  const detailHref = `${LESSONS_BASE_PATH}/${values.lessonId}`;
  const rebookHref = isAllowedRebookHref(values.rebookHref) ? values.rebookHref : "/match";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(detailHref) as Route);
  }

  let cancelledOk = false;

  try {
    const account = await ensureAuthAccount(user);

    if (requiresRoleSelection(account)) {
      redirect(routeFamilies.setup.defaultHref);
    }

    if (isRestrictedAccount(account)) {
      return {
        code: "account_restricted",
        message: "This account cannot reschedule this lesson right now.",
        values,
      };
    }

    if (!hasRole(account, "student")) {
      redirect(buildPostSignInRedirect(account, detailHref) as Route);
    }

    await cancelStudentLesson(account, values.lessonId, values.operationKey);
    cancelledOk = true;

    revalidatePath(detailHref);
    revalidatePath(LESSONS_BASE_PATH);
  } catch (error) {
    if (error instanceof LessonActionError) {
      return {
        code: error.code,
        message: error.message,
        values,
      };
    }

    return {
      code: "reschedule_failed",
      message: "We couldn't reschedule this lesson. Please try again in a moment.",
      values,
    };
  }

  if (cancelledOk) {
    redirect(rebookHref as Route);
  }

  return {
    code: "reschedule_failed",
    message: "We couldn't reschedule this lesson. Please try again in a moment.",
    values,
  };
}

export async function reportLessonIssueAction(
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
      message: "We couldn't recover this lesson context. Refresh the page and try again.",
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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email?.trim()) {
    redirect(buildAuthSignInPath(detailHref) as Route);
  }

  try {
    const account = await ensureAuthAccount(user);

    if (requiresRoleSelection(account)) {
      redirect(routeFamilies.setup.defaultHref);
    }

    if (isRestrictedAccount(account)) {
      return {
        code: "account_restricted",
        fieldErrors: {},
        message: "This account cannot report a lesson issue right now.",
        values,
      };
    }

    if (!hasRole(account, "student")) {
      redirect(buildPostSignInRedirect(account, detailHref) as Route);
    }

    await reportStudentLessonIssue(account, values.lessonId, {
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

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isAllowedRebookHref(value: string) {
  if (!value.startsWith("/book/") && value !== "/match") {
    return false;
  }

  if (value.includes("//") || value.includes("?") || value.includes("#")) {
    return false;
  }

  return true;
}

function isLessonIssueType(value: string): value is LessonIssueType {
  return (lessonIssueTypes as readonly string[]).includes(value);
}

function cancelMessageForOutcome(
  outcome: "authorization_released" | "refund_issued" | "no_refund",
) {
  switch (outcome) {
    case "authorization_released":
      return "Lesson cancelled. The payment authorization has been released.";
    case "refund_issued":
      return "Lesson cancelled. A full refund is on its way under the platform cancellation policy.";
    case "no_refund":
      return "Lesson cancelled. The payment goes to your tutor under the platform cancellation policy.";
  }
}
