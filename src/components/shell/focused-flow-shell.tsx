import type { ReactNode } from "react";

import styles from "./focused-flow-shell.module.css";

type FocusedFlowShellProps = {
  children: ReactNode;
  width?: "narrow" | "wide";
};

export function FocusedFlowShell({
  children,
  width = "narrow",
}: FocusedFlowShellProps) {
  return (
    <div className={styles.shell}>
      <main className={[styles.main, styles[width]].join(" ")}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
