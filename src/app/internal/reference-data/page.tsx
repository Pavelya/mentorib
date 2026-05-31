import Link from "next/link";
import type { Route } from "next";

import { Card, Chip, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { REFERENCE_EDITABLE_FIELD_LABELS } from "@/modules/admin/labels";
import {
  REFERENCE_FAMILIES,
  REFERENCE_FAMILY_SLUGS,
} from "@/modules/reference/admin/families";

import styles from "./reference-data.module.css";

export default async function InternalReferenceDataIndexPage() {
  await requireInternalAdminAccount();

  return (
    <article className={styles.page}>
      <PageHeader
        eyebrow="Internal · Reference data"
        title="Reference data and policy notices"
        description="Edit display names, descriptions, sort order, and the active toggle on existing rows. Adding new rows or changing the underlying codes is a code change, not something this surface can do."
      />

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
                          {REFERENCE_EDITABLE_FIELD_LABELS[field]}
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
                  Draft, publish, or revoke Terms of service and Privacy policy
                  notices. Publishing notifies every member — this notice cannot
                  be silenced by their preferences.
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
          <li>Add new subjects, focus areas, languages, or providers.</li>
          <li>Delete any row. Switch off the active toggle instead.</li>
          <li>Change a row’s underlying code — those are set in the codebase.</li>
          <li>
            Edit provider connection details such as API keys or endpoints —
            those live in configuration, not on the row.
          </li>
        </ul>
      </Panel>
    </article>
  );
}
