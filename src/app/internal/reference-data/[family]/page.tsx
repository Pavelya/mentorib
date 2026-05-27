import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";

import { Card, Chip, InlineNotice, Panel, StatusBadge } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  REFERENCE_FAMILIES,
  isReferenceFamilySlug,
} from "@/modules/reference/admin/families";
import {
  loadReferenceFamilyRows,
  type ReferenceActiveFilter,
} from "@/modules/reference/admin/repository";

import styles from "../reference-data.module.css";
import { ReferenceRowEditForm } from "./reference-row-edit-form";

type PageProps = {
  params: Promise<{ family: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTER_OPTIONS: readonly ReferenceActiveFilter[] = [
  "all",
  "active",
  "inactive",
];

const FILTER_LABELS: Record<ReferenceActiveFilter, string> = {
  all: "All",
  active: "Active",
  inactive: "Inactive",
};

export default async function InternalReferenceFamilyPage({
  params,
  searchParams,
}: PageProps) {
  await requireInternalAdminAccount();

  const { family: familyParam } = await params;
  if (!isReferenceFamilySlug(familyParam)) {
    notFound();
  }
  const descriptor = REFERENCE_FAMILIES[familyParam];

  const sp = await searchParams;
  const filter = parseFilter(sp.filter);
  const rows = await loadReferenceFamilyRows(familyParam, filter);

  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>
          Internal · Reference data · {descriptor.label}
        </p>
        <h1 className={styles.title}>{descriptor.label}</h1>
        <p className={styles.helperText}>{descriptor.description}</p>
      </header>

      <div className={styles.filterRow}>
        {FILTER_OPTIONS.map((option) => {
          const href = buildFilterHref(familyParam, option);
          return (
            <Link
              aria-pressed={filter === option}
              className={styles.queueLink}
              href={href}
              key={option}
              prefetch={false}
            >
              <Chip pressed={filter === option} size="compact" tone="default">
                {FILTER_LABELS[option]}
              </Chip>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <InlineNotice tone="info" title="No rows match this filter">
          <p>
            Adjust the filter above or check the migrations under{" "}
            <code>supabase/migrations/</code> to confirm the table is seeded.
          </p>
        </InlineNotice>
      ) : (
        <ul className={styles.rowList}>
          {rows.map((row) => (
            <li key={row.id}>
              <Card>
                <div className={styles.rowCard}>
                  <div className={styles.rowHeader}>
                    <h2 className={styles.rowTitle}>{row.displayName}</h2>
                    <StatusBadge tone={row.isActive ? "positive" : "trust"}>
                      {row.isActive ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>
                  <p className={styles.rowMeta}>
                    <code>{descriptor.identifierColumn}</code>: {row.identifier}
                  </p>
                  <ReferenceRowEditForm
                    editableFields={descriptor.editableFields}
                    family={familyParam}
                    row={row}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Panel
        eyebrow="Allowed edits"
        tone="mist"
        title="Editable fields for this family"
      >
        <p className={styles.helperText}>
          {descriptor.editableFields.map((f) => f.replace(/_/g, " ")).join(", ")}.
          The Server Action rejects any other key with a <code>forbidden</code>{" "}
          error before it reaches the database.
        </p>
      </Panel>
    </article>
  );
}

function parseFilter(
  value: string | string[] | undefined,
): ReferenceActiveFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "active" || raw === "inactive" || raw === "all") {
    return raw;
  }
  return "all";
}

function buildFilterHref(
  family: string,
  filter: ReferenceActiveFilter,
): Route {
  if (filter === "all") {
    return `/internal/reference-data/${family}` as Route;
  }
  return `/internal/reference-data/${family}?filter=${filter}` as Route;
}
