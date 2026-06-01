import type { Route } from "next";

import { requireInternalAdminAccount } from "@/lib/auth/internal-access";
import { loadStudentDirectory } from "@/modules/admin/people-directory-repository";

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

export default async function InternalStudentsPage({ searchParams }: PageProps) {
  await requireInternalAdminAccount();
  const params = await searchParams;
  const search = readParam(params, "q");
  const pageParam = Number.parseInt(readParam(params, "page"), 10);
  const page = Number.isFinite(pageParam) ? pageParam : 0;

  const directory = await loadStudentDirectory({ page, search });

  const buildPageHref = (nextPage: number): Route => {
    const query = new URLSearchParams();
    if (search) {
      query.set("q", search);
    }
    if (nextPage > 0) {
      query.set("page", String(nextPage));
    }
    const qs = query.toString();
    return (qs ? `/internal/students?${qs}` : "/internal/students") as Route;
  };

  return (
    <DirectoryView
      basePath={"/internal/students" as Route}
      buildPageHref={buildPageHref}
      description="Student accounts on Mentor IB. Search by name or email, then open a person to review activity or manage their account."
      directory={directory}
      emptyMessage="No students match this search. Clear the search to see all student accounts."
      eyebrow="Internal · People"
      searchDefaultValue={search}
      searchPlaceholder="Search students by name or email"
      title="Students"
    />
  );
}
