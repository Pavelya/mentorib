import type { HTMLAttributes, ReactNode } from "react";

import styles from "./chip.module.css";

export type ChipTone =
  | "default"
  | "positive"
  | "warning"
  | "destructive"
  | "trust"
  | "info"
  | "support";

type ChipSize = "default" | "compact";

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  size?: ChipSize;
  tone?: ChipTone;
  children: ReactNode;
};

export function Chip({
  children,
  className,
  size = "default",
  tone = "default",
  ...props
}: ChipProps) {
  return (
    <span
      {...props}
      className={[styles.chip, styles[tone], size === "compact" ? styles.compact : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
