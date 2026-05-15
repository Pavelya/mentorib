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
  pressed?: boolean;
  size?: ChipSize;
  tone?: ChipTone;
  children: ReactNode;
};

export function Chip({
  children,
  className,
  onClick,
  pressed,
  size = "default",
  tone = "default",
  ...props
}: ChipProps) {
  const isInteractive = typeof onClick === "function";

  return (
    <span
      {...props}
      aria-pressed={isInteractive ? Boolean(pressed) : undefined}
      className={[
        styles.chip,
        styles[tone],
        size === "compact" ? styles.compact : "",
        pressed ? styles.pressed : "",
        isInteractive ? styles.interactive : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
