import Link from "next/link";
import type { Route } from "next";

import { Card, Chip, Panel, StatusBadge } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  REFERENCE_FAMILIES,
  REFERENCE_FAMILY_SLUGS,
} from "@/modules/reference/admin/families";

import styles from "./reference-data.module.css";

export default async function InternalReferenceDataIndexPage() {
  await requireInternalAdminAccount();

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>Internal · Reference data</p>
        <h1 className={styles.title}>Reference data and policy notices</h1>
        <p className={styles.helperText}>
          Edit display labels, descriptions, sort order, and the active toggle
          on existing reference rows. Creating new rows or editing slugs /
          keys / codes requires a migration paired with a code change.
        </p>
      </header>

      <ul className={styles.queueGrid}>
        {REFERENCE_FAMILY_SLUGS.map((slug) => {
          const descriptor = REFERENCE_FAMILIES[slug];
          return (
            <li key={slug}>
              <Link
                className={styles.queueLink}
                href={`/internal/reference-data/${slug}` as Route}
                prefetch={false}
              >
                <Card>
                  <div className={styles.queueRow}>
                    <div className={styles.queueRowHeader}>
                      <h2 className={styles.queueRowTitle}>
                        {descriptor.label}
                      </h2>
                      <StatusBadge tone="info">Editable labels</StatusBadge>
                    </div>
                    <p className={styles.queueRowMeta}>
                      {descriptor.description}
                    </p>
                    <div className={styles.queueChips}>
                      {descriptor.editableFields.map((field) => (
                        <Chip key={field} size="compact" tone="default">
                          {field.replace(/_/g, " ")}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            className={styles.queueLink}
            href={"/internal/reference-data/policy-notices" as Route}
            prefetch={false}
          >
            <Card>
              <div className={styles.queueRow}>
                <div className={styles.queueRowHeader}>
                  <h2 className={styles.queueRowTitle}>Policy notices</h2>
                  <StatusBadge tone="trust">Broadcast</StatusBadge>
                </div>
                <p className={styles.queueRowMeta}>
                  Draft, publish, or revoke Terms and Privacy notices. Publishing
                  fires the mandatory <code>policy_notice_updated</code>{" "}
                  notification.
                </p>
              </div>
            </Card>
          </Link>
        </li>
      </ul>

      <Panel
        eyebrow="Boundaries"
        tone="mist"
        title="What this surface intentionally cannot do"
      >
        <ul className={styles.helperList}>
          <li>Create new subjects, focus areas, languages, or providers.</li>
          <li>Delete any reference row. Use the active toggle instead.</li>
          <li>Edit slugs, keys, codes, or identifiers — these are code-owned.</li>
          <li>
            Edit provider connection details (API keys, endpoints) — those live
            in env, not in the row.
          </li>
        </ul>
      </Panel>
    </article>
  );
}
