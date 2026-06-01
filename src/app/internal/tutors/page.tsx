import type { Route } from "next";

import { SelectField } from "@/components/ui";
import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import {
  APPLICATION_STATUS_LABELS,
  LISTING_STATUS_LABELS,
} from "@/modules/admin/labels";
import {
  isTutorApplicationStatus,
  isTutorPublicListingStatus,
  loadTutorDirectory,
} from "@/modules/admin/people-directory-repository";
import {
  tutorApplicationStatuses,
  tutorPublicListingStatuses,
} from "@/modules/tutors/constants";

import { DirectoryView } from "../directory-view";

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

export default async function InternalTutorsPage({ searchParams }: PageProps) {
  await requireInternalAdminAccount();
  const params = await searchParams;
  const search = readParam(params, "q");
  const applicationRaw = readParam(params, "application");
  const listingRaw = readParam(params, "listing");
  const applicationStatus = isTutorApplicationStatus(applicationRaw)
    ? applicationRaw
    : undefined;
  const listingStatus = isTutorPublicListingStatus(listingRaw)
    ? listingRaw
    : undefined;
  const pageParam = Number.parseInt(readParam(params, "page"), 10);
  const page = Number.isFinite(pageParam) ? pageParam : 0;

  const directory = await loadTutorDirectory({
    applicationStatus,
    listingStatus,
    page,
    search,
  });

  const buildPageHref = (nextPage: number): Route => {
    const query = new URLSearchParams();
    if (search) {
      query.set("q", search);
    }
    if (applicationStatus) {
      query.set("application", applicationStatus);
    }
    if (listingStatus) {
      query.set("listing", listingStatus);
    }
    if (nextPage > 0) {
      query.set("page", String(nextPage));
    }
    const qs = query.toString();
    return (qs ? `/internal/tutors?${qs}` : "/internal/tutors") as Route;
  };

  return (
    <DirectoryView
      basePath={"/internal/tutors" as Route}
      buildPageHref={buildPageHref}
      description="Tutor accounts on Mentor IB. Filter by application or listing status, search by name or email, then open a tutor's full operating picture."
      directory={directory}
      emptyMessage="No tutors match these filters. Clear the search and status filters to see all tutors."
      eyebrow="Internal · People"
      filterFields={
        <>
          <SelectField
            defaultValue={applicationStatus ?? ""}
            label="Application status"
            name="application"
          >
            <option value="">All applications</option>
            {tutorApplicationStatuses.map((status) => (
              <option key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </option>
            ))}
          </SelectField>
          <SelectField
            defaultValue={listingStatus ?? ""}
            label="Listing status"
            name="listing"
          >
            <option value="">All listings</option>
            {tutorPublicListingStatuses.map((status) => (
              <option key={status} value={status}>
                {LISTING_STATUS_LABELS[status]}
              </option>
            ))}
          </SelectField>
        </>
      }
      searchDefaultValue={search}
      searchPlaceholder="Search tutors by name or email"
      title="Tutors"
    />
  );
}
