import { Icon } from "@/components/ui";
import { getTimezoneLabel } from "@/lib/datetime";

import styles from "./timezone-notice.module.css";

type TimezoneNoticeProps = {
  body?: string;
  className?: string;
  timezone: string;
};

const DEFAULT_BODY =
  "All times shown in your local timezone. Lessons request times will be converted automatically.";

export function TimezoneNotice({ body, className, timezone }: TimezoneNoticeProps) {
  const label = getTimezoneLabel(timezone);
  const classes = [styles.card, className].filter(Boolean).join(" ");

  return (
    <aside className={classes}>
      <div aria-hidden="true" className={styles.icon}>
        <Icon name="clock" />
      </div>
      <div className={styles.copy}>
        <p className={styles.title}>Your timezone: {label}</p>
        <p className={styles.body}>{body ?? DEFAULT_BODY}</p>
      </div>
    </aside>
  );
}
