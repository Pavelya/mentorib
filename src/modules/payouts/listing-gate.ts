import "server-only";

import type {
  PayoutReadinessStatus,
  TutorApplicationStatus,
  TutorPublicListingStatus,
} from "@/modules/tutors/constants";

type ListingGateInput = {
  applicationStatus: TutorApplicationStatus;
  currentListingStatus: TutorPublicListingStatus;
  nextPayoutStatus: PayoutReadinessStatus;
  previousPayoutStatus: PayoutReadinessStatus;
};

// The payouts module owns only the payout-driven transitions of the listing
// gate. Other gates (profile completeness, schedule, meeting link, admin pause)
// are owned by their respective modules; this helper does not move listings
// into `listed` or override admin-initiated `paused` / `delisted` states.
export function resolveListingStatusForPayoutChange(
  input: ListingGateInput,
): TutorPublicListingStatus {
  const { applicationStatus, currentListingStatus, nextPayoutStatus, previousPayoutStatus } =
    input;

  if (currentListingStatus === "paused" || currentListingStatus === "delisted") {
    return currentListingStatus;
  }

  const wasEnabled = previousPayoutStatus === "enabled";
  const isEnabled = nextPayoutStatus === "enabled";

  if (wasEnabled && !isEnabled) {
    if (currentListingStatus === "listed" || currentListingStatus === "eligible") {
      return "not_listed";
    }

    return currentListingStatus;
  }

  if (!wasEnabled && isEnabled) {
    if (
      applicationStatus === "approved" &&
      currentListingStatus === "not_listed"
    ) {
      return "eligible";
    }
  }

  return currentListingStatus;
}
