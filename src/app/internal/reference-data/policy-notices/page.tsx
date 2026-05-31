import type { Route } from "next";

import {
  Card,
  DescriptionList,
  InlineNotice,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime/format";
import { POLICY_NOTICE_TYPE_LABELS } from "@/modules/admin/labels";
import { listAdminPolicyNotices } from "@/modules/admin/policy-notice-service";

import styles from "../reference-data.module.css";
import { PolicyNoticeDraftForm } from "./policy-notice-draft-form";
import { PolicyNoticeRowForm } from "./policy-notice-row-form";

export default async function InternalPolicyNoticesPage() {
  await requireInternalAdminAccount();

  const notices = await listAdminPolicyNotices();

  return (
    <article className={styles.page}>
      <PageHeader
        backLink={{
          href: "/internal/reference-data" as Route,
          label: "← Back to reference data",
        }}
        eyebrow="Internal · Reference data"
        title="Policy notices"
        description="Draft a Terms of service or Privacy policy version, then publish it to notify every member — a notice they cannot silence. The public privacy page picks up changes on its next read."
      />

      <PolicyNoticeDraftForm />

      <Panel
        eyebrow="Versions"
        tone="raised"
        title="Drafted and published versions"
      >
        {notices.length === 0 ? (
          <InlineNotice tone="info" title="No notices yet">
            <p>Draft a Terms or Privacy version using the form above.</p>
          </InlineNotice>
        ) : (
          <ul className={styles.rowList}>
            {notices.map((notice) => {
              const isPublished = Boolean(notice.publishedAt);
              return (
                <li key={notice.id}>
                  <Card>
                    <div className={styles.rowCard}>
                      <div className={styles.rowHeader}>
                        <h2 className={styles.rowTitle}>{notice.title}</h2>
                        <StatusBadge tone={isPublished ? "positive" : "trust"}>
                          {isPublished ? "Published" : "Draft"}
                        </StatusBadge>
                      </div>
                      <DescriptionList
                        items={[
                          {
                            label: "Type",
                            value: POLICY_NOTICE_TYPE_LABELS[notice.noticeType],
                          },
                          { label: "Version", value: notice.versionLabel },
                          {
                            label: "Effective",
                            value: formatUtcDateTime(notice.effectiveAt),
                          },
                          {
                            label: "Published",
                            value: notice.publishedAt
                              ? formatUtcDateTime(notice.publishedAt)
                              : "Not published",
                          },
                          {
                            label: "Acknowledgement",
                            value: notice.requiresAcknowledgement
                              ? "Required"
                              : "Not required",
                          },
                          {
                            label: "Document",
                            value: (
                              <a
                                href={notice.documentUrl}
                                rel="noreferrer noopener"
                                target="_blank"
                              >
                                {notice.documentUrl}
                              </a>
                            ),
                          },
                        ]}
                      />
                      <p className={styles.rowMeta}>{notice.summary}</p>
                      <PolicyNoticeRowForm
                        id={notice.id}
                        intent={isPublished ? "revoke" : "publish"}
                      />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </article>
  );
}
