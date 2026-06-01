"use client";

import { usePathname } from "next/navigation";

import { reviewLegalNoticeAction } from "@/app/(account)/privacy/actions";
import { getButtonClassName, InlineNotice } from "@/components/ui";

import styles from "./policy-acknowledgement-banner.module.css";

type PolicyAcknowledgementBannerProps = {
  documentUrl: string;
  noticeId: string;
  summary: string;
  typeLabel: string;
};

export function PolicyAcknowledgementBanner({
  documentUrl,
  noticeId,
  summary,
  typeLabel,
}: PolicyAcknowledgementBannerProps) {
  const pathname = usePathname();
  const isExternalDocument =
    documentUrl.startsWith("http://") || documentUrl.startsWith("https://");

  return (
    <InlineNotice
      className={styles.banner}
      title={`${typeLabel} — acknowledgement required`}
      tone="actionNeeded"
    >
      <p>{summary}</p>
      <div className={styles.actions}>
        <a
          className={getButtonClassName({ size: "compact", variant: "secondary" })}
          href={documentUrl}
          rel={isExternalDocument ? "noreferrer" : undefined}
          target={isExternalDocument ? "_blank" : undefined}
        >
          Open full document
        </a>
        <form action={reviewLegalNoticeAction}>
          <input name="noticeId" type="hidden" value={noticeId} />
          <input name="returnTo" type="hidden" value={pathname} />
          <button className={getButtonClassName({ size: "compact" })} type="submit">
            Acknowledge and continue
          </button>
        </form>
      </div>
    </InlineNotice>
  );
}
