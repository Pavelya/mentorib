import { loadPendingPolicyAcknowledgement } from "@/lib/identity/viewer-loader";
import { getLegalNoticeTypeLabel } from "@/modules/notifications/legal-notices";

import { PolicyAcknowledgementBanner } from "./policy-acknowledgement-banner";

export async function PendingPolicyAcknowledgement() {
  const notice = await loadPendingPolicyAcknowledgement();

  if (!notice) {
    return null;
  }

  return (
    <PolicyAcknowledgementBanner
      documentUrl={notice.documentUrl}
      noticeId={notice.id}
      summary={notice.summary}
      typeLabel={getLegalNoticeTypeLabel(notice.noticeType)}
    />
  );
}
