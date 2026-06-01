import Link from "next/link";
import type { Route } from "next";

import { PersonSummary } from "@/components/continuity";
import {
  Button,
  Card,
  InlineNotice,
  PageHeader,
  Section,
  TextField,
} from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  loadAdminDirectory,
  searchPromotionCandidates,
  type AdminDirectoryRowDto,
  type PromotionCandidateDto,
} from "@/modules/admin/people-directory-repository";

import { GrantAdminForm, RevokeAdminForm } from "./admin-role-forms";
import styles from "./admins.module.css";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return "";
}

export default async function InternalAdminsPage({ searchParams }: PageProps) {
  const admin = await requireInternalAdminAccount();
  const params = await searchParams;
  const promoteSearch = readParam(params, "q");

  const [admins, candidates] = await Promise.all([
    loadAdminDirectory(),
    promoteSearch
      ? searchPromotionCandidates(promoteSearch)
      : Promise.resolve<PromotionCandidateDto[]>([]),
  ]);

  return (
    <article className={styles.page}>
      <PageHeader
        description="Everyone who holds an active admin role. Promote a user to admin or revoke access — every change is audited."
        eyebrow="Internal · People"
        title="Admins"
      />

      <Section eyebrow="Promote" title="Promote a user to admin" titleAs="h2">
        <Card>
          <p className={styles.helperText}>
            Search by name or email, then grant admin access. Granting is
            high-impact and runs a confirmation step.
          </p>
          <form action="/internal/admins" className={styles.searchRow} method="get">
            <div className={styles.searchField}>
              <TextField
                defaultValue={promoteSearch}
                label="Find an account"
                name="q"
                placeholder="Search by name or email"
                type="search"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {promoteSearch ? (
            candidates.length === 0 ? (
              <InlineNotice tone="info" title="No accounts found">
                <p>No accounts match that search. Try a different name or email.</p>
              </InlineNotice>
            ) : (
              <ul className={styles.list}>
                {candidates.map((candidate) => (
                  <li className={styles.row} key={candidate.appUserId}>
                    <CandidateHeader candidate={candidate} />
                    <GrantAdminForm
                      disabled={candidate.alreadyAdmin}
                      targetAppUserId={candidate.appUserId}
                    />
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </Card>
      </Section>

      <Section eyebrow="Current admins" title="Current admins" titleAs="h2">
        {admins.length === 0 ? (
          <InlineNotice tone="info" title="No active admins">
            <p>No accounts currently hold an active admin role.</p>
          </InlineNotice>
        ) : (
          <ul className={styles.list}>
            {admins.map((row) => (
              <li key={row.appUserId}>
                <Card>
                  <div className={styles.row}>
                    <AdminHeader row={row} />
                    <RevokeAdminForm
                      actorIsSelf={admin.id === row.appUserId}
                      targetAppUserId={row.appUserId}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </article>
  );
}

function CandidateHeader({ candidate }: { candidate: PromotionCandidateDto }) {
  return (
    <div className={styles.rowHeader}>
      <PersonSummary
        avatarSrc={candidate.avatarSrc ?? undefined}
        badges={candidate.badges}
        descriptor={candidate.descriptor}
        name={candidate.displayName ?? candidate.email}
        variant="operational"
      />
      <Link
        className={styles.detailLink}
        href={candidate.detailHref}
        prefetch={false}
      >
        Open person detail →
      </Link>
    </div>
  );
}

function AdminHeader({ row }: { row: AdminDirectoryRowDto }) {
  return (
    <div className={styles.rowHeader}>
      <PersonSummary
        avatarSrc={row.avatarSrc ?? undefined}
        badges={row.badges}
        descriptor={row.descriptor}
        name={row.displayName ?? row.email}
        variant="operational"
      />
      <Link
        className={styles.detailLink}
        href={row.detailHref as Route}
        prefetch={false}
      >
        Open person detail →
      </Link>
    </div>
  );
}
