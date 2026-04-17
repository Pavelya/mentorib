import styles from "@/components/shell/app-frame.module.css";

export default function RootLoading() {
  return (
    <main className={styles.main}>
      <section className={styles.placeholder}>
        <div className={styles.placeholderMeta}>
          <span className={styles.chip}>App loading</span>
        </div>
        <div>
          <h1 className={styles.placeholderTitle}>Preparing the shared product shell</h1>
          <p className={styles.placeholderText}>
            Route-level loading boundaries will be refined as feature pages start streaming
            real data in later tasks.
          </p>
        </div>
      </section>
    </main>
  );
}
