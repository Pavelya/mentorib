import styles from "./loading.module.css";

const skeletonRows = [0, 1, 2];

export default function ResultsLoading() {
  return (
    <article aria-busy="true" className={styles.page}>
      <p className={styles.srOnly}>Loading tutor results</p>

      <section className={styles.summaryShell}>
        <span className={[styles.skeleton, styles.statePill].join(" ")} />
        <span className={[styles.skeleton, styles.summaryTitle].join(" ")} />
        <div className={styles.chipRow}>
          <span className={[styles.skeleton, styles.chip].join(" ")} />
          <span className={[styles.skeleton, styles.chip].join(" ")} />
          <span className={[styles.skeleton, styles.chipWide].join(" ")} />
        </div>
      </section>

      <section className={styles.headerGrid}>
        <section className={styles.panelShell}>
          <span className={[styles.skeleton, styles.kicker].join(" ")} />
          <span className={[styles.skeleton, styles.panelTitle].join(" ")} />
          <span className={[styles.skeleton, styles.panelLine].join(" ")} />
          <span className={[styles.skeleton, styles.panelLineShort].join(" ")} />
        </section>

        <section className={styles.panelShell}>
          <span className={[styles.skeleton, styles.kicker].join(" ")} />
          <span className={[styles.skeleton, styles.panelTitleShort].join(" ")} />
          <span className={[styles.skeleton, styles.panelLine].join(" ")} />
          <span className={[styles.skeleton, styles.panelLineShort].join(" ")} />
        </section>
      </section>

      <section className={styles.list} aria-hidden="true">
        {skeletonRows.map((row) => (
          <article className={styles.resultCard} key={row}>
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

            <div className={styles.resultChipRow}>
              <span className={[styles.skeleton, styles.resultChip].join(" ")} />
              <span className={[styles.skeleton, styles.resultChip].join(" ")} />
              <span className={[styles.skeleton, styles.resultChipWide].join(" ")} />
            </div>
          </article>
        ))}
      </section>
    </article>
  );
}
