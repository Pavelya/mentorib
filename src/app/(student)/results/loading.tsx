import { Panel } from "@/components/ui";

import styles from "./loading.module.css";

const skeletonRows = [0, 1, 2];

export default function ResultsLoading() {
  return (
    <article aria-busy="true" className={styles.page}>
      <p className={styles.srOnly}>Loading tutor results</p>

      <Panel as="section">
        <span className={[styles.skeleton, styles.statePill].join(" ")} />
        <span className={[styles.skeleton, styles.summaryTitle].join(" ")} />
        <div className={styles.skeletonChipRow}>
          <span className={[styles.skeleton, styles.skeletonChip].join(" ")} />
          <span className={[styles.skeleton, styles.skeletonChip].join(" ")} />
          <span className={[styles.skeleton, styles.skeletonChipWide].join(" ")} />
        </div>
      </Panel>

      <section className={styles.headerGrid}>
        <Panel as="section">
          <span className={[styles.skeleton, styles.kicker].join(" ")} />
          <span className={[styles.skeleton, styles.panelTitle].join(" ")} />
          <span className={[styles.skeleton, styles.panelLine].join(" ")} />
          <span className={[styles.skeleton, styles.panelLineShort].join(" ")} />
        </Panel>

        <Panel as="section">
          <span className={[styles.skeleton, styles.kicker].join(" ")} />
          <span className={[styles.skeleton, styles.panelTitleShort].join(" ")} />
          <span className={[styles.skeleton, styles.panelLine].join(" ")} />
          <span className={[styles.skeleton, styles.panelLineShort].join(" ")} />
        </Panel>
      </section>

      <section className={styles.list} aria-hidden="true">
        {skeletonRows.map((row) => (
          <Panel as="article" key={row}>
            <div className={styles.resultHeader}>
              <span className={[styles.skeleton, styles.avatar].join(" ")} />
              <div className={styles.resultTitleBlock}>
                <span className={[styles.skeleton, styles.resultTitle].join(" ")} />
                <span className={[styles.skeleton, styles.resultSubtitle].join(" ")} />
              </div>
              <span className={[styles.skeleton, styles.resultMeta].join(" ")} />
            </div>

            <div className={styles.resultBody}>
              <span className={[styles.skeleton, styles.resultLine].join(" ")} />
              <span className={[styles.skeleton, styles.resultLineShort].join(" ")} />
            </div>

            <div className={styles.skeletonChipRow}>
              <span className={[styles.skeleton, styles.skeletonChip].join(" ")} />
              <span className={[styles.skeleton, styles.skeletonChip].join(" ")} />
              <span className={[styles.skeleton, styles.skeletonChipWide].join(" ")} />
            </div>
          </Panel>
        ))}
      </section>
    </article>
  );
}
