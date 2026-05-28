import type { HTMLAttributes, ReactNode } from "react";

import styles from "./activity-list.module.css";

export type ActivityListItem = {
  id: string;
  header: ReactNode;
  body?: ReactNode;
  timestamp?: ReactNode;
};

type ActivityListProps = HTMLAttributes<HTMLUListElement> & {
  items: ActivityListItem[];
};

export function ActivityList({
  className,
  items,
  ...props
}: ActivityListProps) {
  return (
    <ul {...props} className={[styles.list, className].filter(Boolean).join(" ")}>
      {items.map((item) => (
        <li className={styles.entry} key={item.id}>
          <div className={styles.entryHeader}>
            <div className={styles.entryHeaderMain}>{item.header}</div>
            {item.timestamp ? (
              <span className={styles.timestamp}>{item.timestamp}</span>
            ) : null}
          </div>
          {item.body ? <div className={styles.body}>{item.body}</div> : null}
        </li>
      ))}
    </ul>
  );
}
