import "server-only";

import type { Route } from "next";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { AccountStatus } from "@/modules/accounts/constants";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  LISTING_STATUS_LABELS,
  LISTING_STATUS_TONES,
  type StatusTone,
} from "@/modules/admin/labels";
import {
  tutorApplicationStatuses,
  tutorPublicListingStatuses,
  type TutorApplicationStatus,
  type TutorPublicListingStatus,
} from "@/modules/tutors/constants";
import { getTutorPublicMediaPublicUrl } from "@/modules/tutors/media-public-assets";

// `P2-ADMIN-PEOPLE-001` directory read DTOs.
//
// The student / tutor / admin directories are the reviewed relaxation of the
// controlled-lookup rule (capability-map B-3). Every row is display-ready: a
// `PersonSummary`-shaped record (avatar + name + descriptor + status badges)
// plus the detail href. No raw enum or UUID is ever surfaced as body text.

export const DIRECTORY_PAGE_SIZE = 20;
const PROMOTION_SEARCH_LIMIT = 10;

export type DirectoryBadge = { label: string; tone: StatusTone };

export type PersonDirectoryRowDto = {
  appUserId: string;
  displayName: string | null;
  email: string;
  avatarSrc: string | null;
  detailHref: Route;
  descriptor: string;
  badges: DirectoryBadge[];
};

export type DirectoryPage = {
  rows: PersonDirectoryRowDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type StudentDirectoryQuery = {
  search?: string;
  page?: number;
};

export type TutorDirectoryQuery = {
  search?: string;
  applicationStatus?: TutorApplicationStatus;
  listingStatus?: TutorPublicListingStatus;
  page?: number;
};

type AppUserDirectoryRow = {
  account_status: AccountStatus;
  avatar_url: string | null;
  created_at: string;
  email: string;
  full_name: string | null;
  id: string;
};

// PostgREST `or()` uses commas/parentheses as syntax; strip the few
// characters that would break the filter so a name/email search stays safe.
function sanitizeSearch(value: string | undefined): string {
  return (value ?? "").replace(/[%,()*]/g, " ").trim();
}

function clampPage(page: number | undefined): number {
  if (!page || !Number.isFinite(page) || page < 0) {
    return 0;
  }
  return Math.floor(page);
}

function accountBadge(status: AccountStatus): DirectoryBadge {
  return { label: ACCOUNT_STATUS_LABELS[status], tone: ACCOUNT_STATUS_TONES[status] };
}

function detailHref(appUserId: string): Route {
  return `/internal/users/${appUserId}` as Route;
}

export function isTutorApplicationStatus(
  value: string,
): value is TutorApplicationStatus {
  return (tutorApplicationStatuses as readonly string[]).includes(value);
}

export function isTutorPublicListingStatus(
  value: string,
): value is TutorPublicListingStatus {
  return (tutorPublicListingStatuses as readonly string[]).includes(value);
}

export async function loadStudentDirectory(
  query: StudentDirectoryQuery,
): Promise<DirectoryPage> {
  const supabase = createSupabaseServiceRoleClient();
  const page = clampPage(query.page);
  const search = sanitizeSearch(query.search);
  const from = page * DIRECTORY_PAGE_SIZE;
  const to = from + DIRECTORY_PAGE_SIZE - 1;

  let builder = supabase
    .from("app_users")
    .select(
      "account_status, avatar_url, created_at, email, full_name, id, user_roles!inner(role)",
      { count: "exact" },
    )
    .eq("user_roles.role", "student");

  if (search) {
    builder = builder.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, count, error } = await builder
    .order("created_at", { ascending: false })
    .range(from, to)
    .returns<AppUserDirectoryRow[]>();

  if (error) {
    throw new Error("Could not load the student directory.");
  }

  const rows: PersonDirectoryRowDto[] = (data ?? []).map((row) => ({
    appUserId: row.id,
    avatarSrc: row.avatar_url?.trim() || null,
    badges: [accountBadge(row.account_status)],
    descriptor: row.email,
    detailHref: detailHref(row.id),
    displayName: row.full_name?.trim() || null,
    email: row.email,
  }));

  return buildPage(rows, page, count ?? 0);
}

export async function loadTutorDirectory(
  query: TutorDirectoryQuery,
): Promise<DirectoryPage> {
  const supabase = createSupabaseServiceRoleClient();
  const page = clampPage(query.page);
  const search = sanitizeSearch(query.search);
  const from = page * DIRECTORY_PAGE_SIZE;
  const to = from + DIRECTORY_PAGE_SIZE - 1;

  let builder = supabase
    .from("tutor_profiles")
    .select(
      "application_status, id, public_listing_status, app_users!inner(account_status, avatar_url, created_at, email, full_name, id)",
      { count: "exact" },
    );

  if (query.applicationStatus) {
    builder = builder.eq("application_status", query.applicationStatus);
  }
  if (query.listingStatus) {
    builder = builder.eq("public_listing_status", query.listingStatus);
  }
  if (search) {
    builder = builder.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`,
      { referencedTable: "app_users" },
    );
  }

  const { data, count, error } = await builder
    .order("created_at", { ascending: false, referencedTable: "app_users" })
    .range(from, to)
    .returns<
      Array<{
        application_status: TutorApplicationStatus;
        id: string;
        public_listing_status: TutorPublicListingStatus;
        app_users: AppUserDirectoryRow;
      }>
    >();

  if (error) {
    throw new Error("Could not load the tutor directory.");
  }

  const profileRows = data ?? [];
  const photoByProfileId = await loadPublishedProfilePhotos(
    profileRows.map((row) => row.id),
  );

  const rows: PersonDirectoryRowDto[] = profileRows.map((row) => {
    const account = row.app_users;
    return {
      appUserId: account.id,
      avatarSrc: photoByProfileId.get(row.id) ?? account.avatar_url?.trim() ?? null,
      badges: [
        {
          label: APPLICATION_STATUS_LABELS[row.application_status],
          tone: APPLICATION_STATUS_TONES[row.application_status],
        },
        {
          label: LISTING_STATUS_LABELS[row.public_listing_status],
          tone: LISTING_STATUS_TONES[row.public_listing_status],
        },
      ],
      descriptor: account.email,
      detailHref: detailHref(account.id),
      displayName: account.full_name?.trim() || null,
      email: account.email,
    };
  });

  return buildPage(rows, page, count ?? 0);
}

export type AdminDirectoryRowDto = PersonDirectoryRowDto & {
  grantedAt: string;
};

export async function loadAdminDirectory(): Promise<AdminDirectoryRowDto[]> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("user_roles")
    .select(
      "granted_at, app_users!inner(account_status, avatar_url, created_at, email, full_name, id)",
    )
    .eq("role", "admin")
    .eq("role_status", "active")
    .order("granted_at", { ascending: true })
    .returns<
      Array<{ granted_at: string; app_users: AppUserDirectoryRow }>
    >();

  if (error) {
    throw new Error("Could not load the admin directory.");
  }

  return (data ?? []).map((row) => {
    const account = row.app_users;
    return {
      appUserId: account.id,
      avatarSrc: account.avatar_url?.trim() || null,
      badges: [accountBadge(account.account_status)],
      descriptor: account.email,
      detailHref: detailHref(account.id),
      displayName: account.full_name?.trim() || null,
      email: account.email,
      grantedAt: row.granted_at,
    };
  });
}

// Promotion search: find accounts to grant admin. Excludes nothing by role —
// any account can be promoted — but flags whether each already holds an
// active admin role so the UI can disable a redundant grant.
export type PromotionCandidateDto = PersonDirectoryRowDto & {
  alreadyAdmin: boolean;
};

export async function searchPromotionCandidates(
  search: string,
): Promise<PromotionCandidateDto[]> {
  const sanitized = sanitizeSearch(search);
  if (!sanitized) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("account_status, avatar_url, created_at, email, full_name, id")
    .or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
    .order("full_name", { ascending: true })
    .limit(PROMOTION_SEARCH_LIMIT)
    .returns<AppUserDirectoryRow[]>();

  if (error) {
    throw new Error("Could not search accounts to promote.");
  }

  const rows = data ?? [];
  const activeAdminIds = await loadActiveAdminIds(rows.map((row) => row.id));

  return rows.map((row) => ({
    alreadyAdmin: activeAdminIds.has(row.id),
    appUserId: row.id,
    avatarSrc: row.avatar_url?.trim() || null,
    badges: [accountBadge(row.account_status)],
    descriptor: row.email,
    detailHref: detailHref(row.id),
    displayName: row.full_name?.trim() || null,
    email: row.email,
  }));
}

async function loadActiveAdminIds(appUserIds: string[]): Promise<Set<string>> {
  const ids = Array.from(new Set(appUserIds)).filter(Boolean);
  if (ids.length === 0) {
    return new Set();
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("app_user_id")
    .eq("role", "admin")
    .eq("role_status", "active")
    .in("app_user_id", ids)
    .returns<Array<{ app_user_id: string }>>();

  if (error) {
    return new Set();
  }
  return new Set((data ?? []).map((row) => row.app_user_id));
}

async function loadPublishedProfilePhotos(
  tutorProfileIds: string[],
): Promise<Map<string, string>> {
  const ids = Array.from(new Set(tutorProfileIds)).filter(Boolean);
  const lookup = new Map<string, string>();
  if (ids.length === 0) {
    return lookup;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_public_media_assets")
    .select("storage_object_path, tutor_profile_id")
    .eq("media_role", "profile_photo")
    .eq("publication_status", "published")
    .in("tutor_profile_id", ids)
    .returns<
      Array<{ storage_object_path: string; tutor_profile_id: string }>
    >();

  if (error || !data) {
    return lookup;
  }

  for (const row of data) {
    if (row.storage_object_path) {
      lookup.set(
        row.tutor_profile_id,
        getTutorPublicMediaPublicUrl(row.storage_object_path),
      );
    }
  }
  return lookup;
}

function buildPage(
  rows: PersonDirectoryRowDto[],
  page: number,
  totalCount: number,
): DirectoryPage {
  return {
    hasNextPage: (page + 1) * DIRECTORY_PAGE_SIZE < totalCount,
    hasPreviousPage: page > 0,
    page,
    pageSize: DIRECTORY_PAGE_SIZE,
    rows,
    totalCount,
  };
}
