import { Card, InlineNotice, Panel, StatusBadge } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { formatUtcDateTime } from "@/lib/datetime/format";
import { listAdminPolicyNotices } from "@/modules/admin/policy-notice-service";

import styles from "../reference-data.module.css";
import { PolicyNoticeDraftForm } from "./policy-notice-draft-form";
import { PolicyNoticeRowForm } from "./policy-notice-row-form";

export default async function InternalPolicyNoticesPage() {
  await requireInternalAdminAccount();

  const notices = await listAdminPolicyNotices();

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>
          Internal · Reference data · Policy notices
        </p>
        <h1 className={styles.title}>Policy notices</h1>
        <p className={styles.helperText}>
          Draft a Terms or Privacy version, publish it to fan out the mandatory{" "}
          <code>policy_notice_updated</code> notification, or revoke a published
          version. The <code>/privacy</code> surface picks up changes on next
          read.
        </p>
      </header>

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
                      <p className={styles.rowMeta}>
                        {notice.noticeType} · v{notice.versionLabel} · effective{" "}
                        {formatUtcDateTime(notice.effectiveAt)}
                        {notice.publishedAt
                          ? ` · published ${formatUtcDateTime(notice.publishedAt)}`
                          : " · not published"}
                      </p>
                      <p className={styles.rowMeta}>{notice.summary}</p>
                      <p className={styles.rowMeta}>
                        Doc:{" "}
                        <a
                          href={notice.documentUrl}
                          rel="noreferrer noopener"
                          target="_blank"
                        >
                          {notice.documentUrl}
                        </a>
                      </p>
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
