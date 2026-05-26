import type {
  ModerationCaseResolutionKind,
  ModerationCaseStatus,
} from "@/modules/admin/constants";

export type ModerationCaseTransitionKey =
  | "claim"
  | "resolve"
  | "dismiss"
  | "escalate";

type Transition = {
  from: readonly ModerationCaseStatus[];
  to: ModerationCaseStatus;
};

const TRANSITIONS: Record<ModerationCaseTransitionKey, Transition> = {
  claim: {
    from: ["queued"],
    to: "under_review",
  },
  resolve: {
    from: ["under_review"],
    to: "resolved",
  },
  dismiss: {
    from: ["queued", "under_review"],
    to: "dismissed",
  },
  escalate: {
    from: ["queued", "under_review"],
    to: "escalated",
  },
};

export function isAllowedCaseTransition(
  action: ModerationCaseTransitionKey,
  currentStatus: ModerationCaseStatus,
): boolean {
  return TRANSITIONS[action].from.includes(currentStatus);
}

export function resolveNextCaseStatus(
  action: ModerationCaseTransitionKey,
  currentStatus: ModerationCaseStatus,
): ModerationCaseStatus | null {
  return isAllowedCaseTransition(action, currentStatus)
    ? TRANSITIONS[action].to
    : null;
}

const RESOLVE_REQUIRES_RESOLUTION_KIND: readonly ModerationCaseResolutionKind[] = [
  "uphold",
  "reject",
  "split",
  "dismiss",
  "no_action",
  "escalated_to_legal",
];

export function isAllowedResolutionKind(
  value: string,
): value is ModerationCaseResolutionKind {
  return (RESOLVE_REQUIRES_RESOLUTION_KIND as readonly string[]).includes(value);
}
