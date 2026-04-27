import type { HTMLAttributes, ReactNode } from "react";

import styles from "./screen-state.module.css";

type ScreenStateKind = "empty" | "loading" | "error";

type ScreenStateProps = HTMLAttributes<HTMLElement> & {
  action?: ReactNode;
  description: ReactNode;
  hints?: string[];
  kind: ScreenStateKind;
  title: ReactNode;
};

const SCREEN_STATE_ROLE: Record<ScreenStateKind, "status" | "alert"> = {
  empty: "status",
  error: "alert",
  loading: "status",
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
  return (
    <section
      {...props}
      aria-busy={kind === "loading" || undefined}
      className={cx(styles.state, styles[kind], className)}
      role={SCREEN_STATE_ROLE[kind]}
    >
      <div className={styles.header}>
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
