// Pure state-machine helpers and content types for lesson recaps.
//
// This module intentionally has no server-only or database dependencies so it
// can be reused on both server and client and unit-tested in isolation.

import type {
  LessonStatus,
  PersistedLessonReportStatus,
} from "@/modules/lessons/constants";

export type LessonReportContent = {
  coverageSummary: string | null;
  goalSummary: string | null;
  nextStepsSummary: string | null;
  studentConfidenceSignal: string | null;
};

export type LessonReportContentInput = LessonReportContent;

const REPORTABLE_LESSON_STATUSES: readonly LessonStatus[] = [
  "completed",
  "reviewed",
];

const EDITABLE_REPORT_STATUSES: readonly PersistedLessonReportStatus[] = [
  "drafted",
  "submitted",
];

const LOCKED_REPORT_STATUSES: readonly PersistedLessonReportStatus[] = [
  "shared",
  "acknowledged",
];

export function canDraftLessonReport(
  lessonStatus: LessonStatus,
  completedAt: string | null,
): boolean {
  if (!REPORTABLE_LESSON_STATUSES.includes(lessonStatus)) {
    return false;
  }

  return completedAt !== null;
}

export function canEditLessonReport(
  status: PersistedLessonReportStatus,
): boolean {
  return EDITABLE_REPORT_STATUSES.includes(status);
}

export function isLessonReportLocked(
  status: PersistedLessonReportStatus,
): boolean {
  return LOCKED_REPORT_STATUSES.includes(status);
}

export function reportHasShareableContent(
  content: LessonReportContent,
): boolean {
  return (
    isNonBlank(content.goalSummary) ||
    isNonBlank(content.coverageSummary) ||
    isNonBlank(content.studentConfidenceSignal) ||
    isNonBlank(content.nextStepsSummary)
  );
}

export function canSubmitLessonReport(
  status: PersistedLessonReportStatus,
  content: LessonReportContent,
): boolean {
  if (status !== "drafted") {
    return false;
  }

  return reportHasShareableContent(content);
}

export function canShareLessonReport(
  status: PersistedLessonReportStatus,
): boolean {
  return status === "submitted";
}

export function canAcknowledgeLessonReport(
  status: PersistedLessonReportStatus,
): boolean {
  return status === "shared";
}

export const REPORTABLE_LESSON_STATUSES_RO = REPORTABLE_LESSON_STATUSES;

function isNonBlank(value: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
