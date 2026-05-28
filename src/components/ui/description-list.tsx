import type { HTMLAttributes, ReactNode } from "react";

import styles from "./description-list.module.css";

export type DescriptionListItem = {
  label: ReactNode;
  value: ReactNode;
};

type DescriptionListProps = HTMLAttributes<HTMLDListElement> & {
  items: DescriptionListItem[];
};

export function DescriptionList({
  className,
  items,
  ...props
}: DescriptionListProps) {
  return (
    <dl {...props} className={[styles.list, className].filter(Boolean).join(" ")}>
      {items.map((item, index) => (
        <div className={styles.row} key={index}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
