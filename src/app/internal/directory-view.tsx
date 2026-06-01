import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { PersonSummary } from "@/components/continuity";
import {
  Button,
  Card,
  Chip,
  InlineNotice,
  PageHeader,
  TextField,
} from "@/components/ui";

import type {
  DirectoryPage,
  PersonDirectoryRowDto,
} from "@/modules/admin/people-directory-repository";

import styles from "./people-directory.module.css";

type DirectoryViewProps = {
  eyebrow: string;
  title: string;
  description: string;
  /** The route the GET search form posts to (the directory's own path). */
  basePath: Route;
  searchPlaceholder: string;
  searchDefaultValue: string;
  /** Extra filter controls (e.g. status selects) rendered in the search form. */
  filterFields?: ReactNode;
  directory: DirectoryPage;
  emptyMessage: string;
  /** Builds a same-route href that preserves the active filters for a page. */
  buildPageHref: (page: number) => Route;
};

export function DirectoryView({
  basePath,
  buildPageHref,
  description,
  directory,
  emptyMessage,
  eyebrow,
  filterFields,
  searchDefaultValue,
  searchPlaceholder,
  title,
}: DirectoryViewProps) {
  return (
    <article className={styles.page}>
      <PageHeader description={description} eyebrow={eyebrow} title={title} />

      <form action={basePath} className={styles.controls} method="get">
        <div className={styles.searchRow}>
          <div className={styles.searchField}>
            <TextField
              defaultValue={searchDefaultValue}
              label="Search"
              name="q"
              placeholder={searchPlaceholder}
              type="search"
            />
          </div>
          {filterFields}
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </div>
      </form>

      {directory.rows.length === 0 ? (
        <InlineNotice tone="info" title="No people match these filters">
          <p>{emptyMessage}</p>
        </InlineNotice>
      ) : (
        <ul className={styles.directoryList}>
          {directory.rows.map((row) => (
            <li key={row.appUserId}>
              <DirectoryRowLink row={row} />
            </li>
          ))}
        </ul>
      )}

      <DirectoryPagination
        buildPageHref={buildPageHref}
        directory={directory}
      />
    </article>
  );
}

function DirectoryRowLink({ row }: { row: PersonDirectoryRowDto }) {
  return (
    <Link className={styles.rowLink} href={row.detailHref} prefetch={false}>
      <Card variant="select">
        <PersonSummary
          avatarSrc={row.avatarSrc ?? undefined}
          badges={row.badges}
          descriptor={row.descriptor}
          name={row.displayName ?? row.email}
          variant="operational"
        />
      </Card>
    </Link>
  );
}

function DirectoryPagination({
  buildPageHref,
  directory,
}: {
  buildPageHref: (page: number) => Route;
  directory: DirectoryPage;
}) {
  if (!directory.hasNextPage && !directory.hasPreviousPage) {
    return null;
  }

  const firstOnPage = directory.totalCount === 0
    ? 0
    : directory.page * directory.pageSize + 1;
  const lastOnPage = directory.page * directory.pageSize + directory.rows.length;

  return (
    <div className={styles.pagination}>
      <p className={styles.paginationMeta}>
        Showing {firstOnPage}–{lastOnPage} of {directory.totalCount}
      </p>
      <div className={styles.paginationControls}>
        {directory.hasPreviousPage ? (
          <Link
            className={styles.rowLink}
            href={buildPageHref(directory.page - 1)}
            prefetch={false}
          >
            <Chip size="compact" tone="default">
              ← Previous
            </Chip>
          </Link>
        ) : (
          <Chip aria-disabled size="compact" tone="default">
            ← Previous
          </Chip>
        )}
        {directory.hasNextPage ? (
          <Link
            className={styles.rowLink}
            href={buildPageHref(directory.page + 1)}
            prefetch={false}
          >
            <Chip size="compact" tone="default">
              Next →
            </Chip>
          </Link>
        ) : (
          <Chip aria-disabled size="compact" tone="default">
            Next →
          </Chip>
        )}
      </div>
    </div>
  );
}
