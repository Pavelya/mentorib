"use client";

import styles from "@/components/shell/app-frame.module.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className={styles.main}>
          <section className={styles.errorCard}>
            <p className={styles.eyebrow}>Global boundary</p>
            <h1>The app shell hit a catastrophic error.</h1>
            <p>
              This file exists so the initial App Router scaffold has a whole-app fallback
              before feature-specific recovery states are introduced.
            </p>
            <p>{error.message || "Unknown error"}</p>
            <button onClick={reset} type="button">
              Reload shell
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
