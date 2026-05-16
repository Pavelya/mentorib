import type { IconKey } from "@/components/ui";
import type { TutorApplicationStatus } from "@/modules/tutors/constants";
import type { TutorApplicationReviewStatus } from "@/modules/tutors/review-constants";

export const TUTOR_APPLICATION_REVIEW_FILTER_STATUSES = [
  "queued",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
] as const satisfies readonly TutorApplicationReviewStatus[];

export type TutorApplicationReviewFilterStatus =
  (typeof TUTOR_APPLICATION_REVIEW_FILTER_STATUSES)[number];

export const DEFAULT_TUTOR_APPLICATION_REVIEW_FILTERS: readonly TutorApplicationReviewFilterStatus[] =
  ["queued", "under_review"];

export type TutorApplicationReviewActionKey =
  | "claim"
  | "request_changes"
  | "approve"
  | "reject";

export type TutorApplicationReviewSubjectSummary = {
  focusAreaLabel: string | null;
  iconKey: IconKey | null;
  subjectLabel: string | null;
};

export type TutorApplicationReviewQueueRowDto = {
  applicantDisplayName: string;
  applicationId: string;
  applicationStatus: TutorApplicationStatus;
  lastReviewerSummary: string | null;
  lastTransitionAt: string | null;
  submittedAt: string | null;
};

export type TutorApplicationReviewQueueCounter = {
  count: number;
  status: TutorApplicationReviewFilterStatus;
};

export type TutorApplicationReviewQueueDto = {
  appliedFilters: readonly TutorApplicationReviewFilterStatus[];
  counters: readonly TutorApplicationReviewQueueCounter[];
  rows: readonly TutorApplicationReviewQueueRowDto[];
};

export type TutorApplicationReviewHistoryEntryDto = {
  createdAt: string;
  id: string;
  internalNote: string | null;
  reviewStatus: TutorApplicationReviewStatus;
  reviewerLabel: string;
  reviewerNote: string | null;
};

export type TutorApplicationReviewDetailDto = {
  applicantDisplayName: string;
  applicationId: string;
  applicationStatus: TutorApplicationStatus;
  availableActions: readonly TutorApplicationReviewActionKey[];
  bio: string | null;
  fullName: string | null;
  headline: string | null;
  history: readonly TutorApplicationReviewHistoryEntryDto[];
  hourlyRateMinor: number | null;
  currencyCode: string;
  languageLabels: readonly string[];
  subjectSummaries: readonly TutorApplicationReviewSubjectSummary[];
  submittedAt: string | null;
  timezone: string | null;
};

export type TutorApplicationReviewTransition = {
  from: TutorApplicationStatus;
  to: TutorApplicationStatus;
};

const TRANSITIONS: Record<
  TutorApplicationReviewActionKey,
  TutorApplicationReviewTransition[]
> = {
  claim: [
    { from: "submitted", to: "under_review" },
  ],
  request_changes: [
    { from: "under_review", to: "changes_requested" },
  ],
  approve: [
    { from: "under_review", to: "approved" },
  ],
  reject: [
    { from: "under_review", to: "rejected" },
  ],
};

export function isAllowedReviewTransition(
  action: TutorApplicationReviewActionKey,
  currentStatus: TutorApplicationStatus,
): boolean {
  return TRANSITIONS[action].some((transition) => transition.from === currentStatus);
}

export function resolveNextApplicationStatus(
  action: TutorApplicationReviewActionKey,
  currentStatus: TutorApplicationStatus,
): TutorApplicationStatus | null {
  const match = TRANSITIONS[action].find(
    (transition) => transition.from === currentStatus,
  );
  return match?.to ?? null;
}

export function resolveReviewStatusForAction(
  action: TutorApplicationReviewActionKey,
): TutorApplicationReviewStatus {
  switch (action) {
    case "claim":
      return "under_review";
    case "request_changes":
      return "changes_requested";
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
  }
}

export function getAvailableReviewActions(
  applicationStatus: TutorApplicationStatus,
): readonly TutorApplicationReviewActionKey[] {
  const actions: TutorApplicationReviewActionKey[] = [];
  if (isAllowedReviewTransition("claim", applicationStatus)) {
    actions.push("claim");
  }
  if (isAllowedReviewTransition("approve", applicationStatus)) {
    actions.push("approve");
  }
  if (isAllowedReviewTransition("request_changes", applicationStatus)) {
    actions.push("request_changes");
  }
  if (isAllowedReviewTransition("reject", applicationStatus)) {
    actions.push("reject");
  }
  return actions;
}

export function isFilterStatus(
  value: string,
): value is TutorApplicationReviewFilterStatus {
  return (TUTOR_APPLICATION_REVIEW_FILTER_STATUSES as readonly string[]).includes(
    value,
  );
}
