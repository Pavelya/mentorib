import type { HTMLAttributes, ReactNode } from "react";

import styles from "./status-badge.module.css";

type StatusBadgeTone = "positive" | "warning" | "destructive" | "trust" | "info";

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: StatusBadgeTone;
};

export function StatusBadge({
  children,
  className,
  tone = "info",
  ...props
}: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={[styles.badge, styles[tone], className].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
}
