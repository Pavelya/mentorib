import type {
  PayoutReadinessStatus,
  TutorApplicationStatus,
  TutorPublicListingStatus,
} from "@/modules/tutors/constants";

type Tone = "default" | "positive" | "warning" | "destructive" | "trust" | "info";
type StatusBadgeTone = "positive" | "warning" | "destructive" | "trust" | "info";

export type ChecklistItemStatus = "complete" | "in_progress" | "todo" | "blocked";

const CHECKLIST_STATUS_TONES: Record<ChecklistItemStatus, StatusBadgeTone> = {
  blocked: "destructive",
  complete: "positive",
  in_progress: "info",
  todo: "warning",
};

const CHECKLIST_STATUS_LABELS: Record<ChecklistItemStatus, string> = {
  blocked: "Action needed",
  complete: "Complete",
  in_progress: "In progress",
  todo: "To do",
};

export function getChecklistStatusTone(status: ChecklistItemStatus): StatusBadgeTone {
  return CHECKLIST_STATUS_TONES[status];
}

export function getChecklistStatusLabel(status: ChecklistItemStatus): string {
  return CHECKLIST_STATUS_LABELS[status];
}

export const PAYOUT_READINESS_HEADLINE: Record<PayoutReadinessStatus, string> = {
  enabled: "Payouts enabled",
  not_started: "Set up your payout account",
  pending_verification: "Stripe is reviewing your details",
  restricted: "Stripe needs more information",
};

export const PAYOUT_READINESS_DESCRIPTION: Record<PayoutReadinessStatus, string> = {
  enabled:
    "Your Stripe Connect Express account is verified. Lesson payments captured on acceptance flow into your next payout cycle.",
  not_started:
    "Verification documents and a bank account or debit card are the only steps you need to complete during Stripe's hosted setup.",
  pending_verification:
    "Stripe is checking the documents you submitted. We'll update your readiness as soon as they finish verification.",
  restricted:
    "Stripe paused payouts until you resolve the open requirements. Open the hosted onboarding to upload the missing details.",
};

export const PAYOUT_READINESS_TONE: Record<PayoutReadinessStatus, Tone> = {
  enabled: "positive",
  not_started: "warning",
  pending_verification: "info",
  restricted: "destructive",
};

export function deriveChecklistStatus(
  applicationStatus: TutorApplicationStatus,
  payoutStatus: PayoutReadinessStatus,
): ChecklistItemStatus {
  if (applicationStatus !== "approved") {
    return "blocked";
  }

  if (payoutStatus === "enabled") {
    return "complete";
  }

  if (payoutStatus === "pending_verification") {
    return "in_progress";
  }

  if (payoutStatus === "restricted") {
    return "blocked";
  }

  return "todo";
}

export const LISTING_STATUS_LABELS: Record<TutorPublicListingStatus, string> = {
  delisted: "Removed from listing",
  eligible: "Ready to list",
  listed: "Listed publicly",
  not_listed: "Not yet listed",
  paused: "Listing paused",
};
