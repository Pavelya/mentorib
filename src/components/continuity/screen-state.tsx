import type { HTMLAttributes, ReactNode } from "react";

import { StatusBadge } from "@/components/ui";

import styles from "./screen-state.module.css";

type StatusTone = "positive" | "warning" | "destructive" | "trust" | "info";
type ScreenStateKind = "empty" | "loading" | "error";

type ScreenStateProps = HTMLAttributes<HTMLElement> & {
  action?: ReactNode;
  description: ReactNode;
  hints?: string[];
  kind: ScreenStateKind;
  title: ReactNode;
};

const SCREEN_STATE_META: Record<ScreenStateKind, { label: string; role: "status" | "alert"; tone: StatusTone }> = {
  empty: { label: "Empty", role: "status", tone: "info" },
  error: { label: "Error", role: "alert", tone: "destructive" },
  loading: { label: "Loading", role: "status", tone: "warning" },
};

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function ScreenState({
  action,
  className,
  description,
  hints = [],
  kind,
  title,
  ...props
}: ScreenStateProps) {
  const meta = SCREEN_STATE_META[kind];

  return (
    <section
      {...props}
      aria-busy={kind === "loading" || undefined}
      className={cx(styles.state, styles[kind], className)}
      role={meta.role}
    >
      <div className={styles.header}>
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      {kind === "loading" ? (
        <div aria-hidden="true" className={styles.loadingPreview}>
          <span className={cx(styles.loadingBar, styles.loadingBarStrong)} />
          <span className={styles.loadingBar} />
          <span className={cx(styles.loadingBar, styles.loadingBarShort)} />
        </div>
      ) : null}

      {hints.length > 0 ? (
        <ul className={styles.hintList}>
          {hints.map((hint) => (
            <li className={styles.hintItem} key={hint}>
              {hint}
            </li>
          ))}
        </ul>
      ) : null}

      {action ? <div className={styles.actionRow}>{action}</div> : null}
    </section>
  );
}
