import type { HTMLAttributes, ReactNode } from "react";

import styles from "./inline-notice.module.css";

type InlineNoticeTone = "info" | "warning" | "success" | "actionNeeded";

const TONE_LABELS: Record<InlineNoticeTone, string> = {
  actionNeeded: "Action needed",
  info: "Info",
  success: "Success",
  warning: "Warning",
};

type InlineNoticeProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  icon?: ReactNode;
  showToneLabel?: boolean;
  title?: ReactNode;
  tone?: InlineNoticeTone;
};

export function InlineNotice({
  children,
  className,
  icon,
  showToneLabel = true,
  title,
  tone = "info",
  ...props
}: InlineNoticeProps) {
  const role = tone === "warning" || tone === "actionNeeded" ? "alert" : "status";

  return (
    <div
      {...props}
      className={[styles.notice, styles[tone], className].filter(Boolean).join(" ")}
      role={role}
    >
      <div className={styles.header}>
        {icon ? (
          <div aria-hidden="true" className={styles.icon}>
            {icon}
          </div>
        ) : null}
        <div className={styles.copy}>
          {showToneLabel ? <p className={styles.eyebrow}>{TONE_LABELS[tone]}</p> : null}
          {title ? <p className={styles.title}>{title}</p> : null}
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
