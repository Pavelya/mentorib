import { getButtonClassName, InlineNotice } from "@/components/ui";
import {
  buildLegalNoticeReviewPath,
  getLegalNoticeTypeLabel,
  type LegalNoticeDto,
} from "@/modules/notifications/legal-notices";

type PendingLegalNoticeProps = {
  notice: LegalNoticeDto;
  returnTo?: string | null;
};

export function PendingLegalNotice({ notice, returnTo }: PendingLegalNoticeProps) {
  return (
    <InlineNotice title={getLegalNoticeTypeLabel(notice.noticeType)} tone="actionNeeded">
      <p>{notice.summary}</p>
      <div>
        <a
          className={getButtonClassName({ size: "compact" })}
          href={buildLegalNoticeReviewPath(notice.id, returnTo)}
        >
          Review latest update
        </a>
      </div>
    </InlineNotice>
  );
}
