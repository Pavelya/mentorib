import "server-only";

import type { Route } from "next";

import { type FlagCode, toFlagCode } from "@/components/ui/flag";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  AccountStatus,
  Role,
  RoleStatus,
} from "@/modules/accounts/constants";
import type {
  ModerationCaseKind,
  ModerationCaseStatus,
  ModerationCaseSubjectKind,
} from "@/modules/admin/constants";
import {
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_TONES,
  adminActionLabel,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  CASE_KIND_LABELS,
  CASE_STATUS_LABELS,
  CASE_STATUS_TONES,
  INVOLVEMENT_LABELS,
  LISTING_STATUS_LABELS,
  LISTING_STATUS_TONES,
  PAYOUT_READINESS_LABELS,
  PAYOUT_READINESS_TONES,
  ROLE_LABELS,
  ROLE_STATUS_LABELS,
  ROLE_STATUS_TONES,
  type StatusTone,
  SUBJECT_KIND_LABELS,
} from "@/modules/admin/labels";
import { loadAppUserIdentities } from "@/modules/admin/moderation-case-repository";
import type {
  PayoutReadinessStatus,
  TutorApplicationStatus,
  TutorPublicListingStatus,
} from "@/modules/tutors/constants";
import { getPublishedTutorProfilePhotoUrl } from "@/modules/tutors/media-public-assets";

// `P2-OPS-002` D7 internal user-detail DTO.
//
// Scope-bounded admin read for the `/internal/users/[id]` surface.
// Per architecture §8.3/§17 and §15, this never returns:
//   * raw `internal_summary` of unrelated cases
//   * raw bank account numbers, full Stripe IDs, or any provider secret
//   * raw credential file content
//   * other users' notes

export type InternalUserAccountSummaryDto = {
  appUserId: string;
  email: string;
  displayName: string | null;
  avatarSrc: string | null;
  accountStatus: AccountStatus;
  accountStatusLabel: string;
  accountStatusTone: StatusTone;
  createdAt: string;
  timezone: string;
};

export type InternalUserRoleDto = {
  role: Role;
  roleLabel: string;
  roleStatus: RoleStatus;
  roleStatusLabel: string;
  roleStatusTone: StatusTone;
  grantedAt: string;
  revokedAt: string | null;
};

export type InternalUserTutorSummaryDto = {
  tutorProfileId: string;
  avatarSrc: string | null;
  applicationStatus: TutorApplicationStatus;
  applicationStatusLabel: string;
  applicationStatusTone: StatusTone;
  publicListingStatus: TutorPublicListingStatus;
  publicListingStatusLabel: string;
  publicListingStatusTone: StatusTone;
  selfPausedAt: string | null;
  publicSlug: string | null;
  publicProfileHref: Route | null;
  headline: string | null;
};

export type InternalUserFinanceSummaryDto = {
  payoutReadinessStatus: PayoutReadinessStatus;
  payoutReadinessStatusLabel: string;
  payoutReadinessStatusTone: StatusTone;
  payoutAccountCountry: string | null;
  countryFlagCode: FlagCode | null;
  payoutOnboardingCompletedAt: string | null;
  payoutOnboardingStartedAt: string | null;
  payoutStatusSyncedAt: string | null;
  hasStripeAccount: boolean;
};

export type InternalUserCaseDto = {
  caseId: string;
  caseKind: ModerationCaseKind;
  caseKindLabel: string;
  caseStatus: ModerationCaseStatus;
  caseStatusLabel: string;
  caseStatusTone: StatusTone;
  subjectKind: ModerationCaseSubjectKind;
  subjectKindLabel: string;
  involvement: "subject" | "reporter";
  involvementLabel: string;
  createdAt: string;
};

export type InternalUserAdminActionDto = {
  id: string;
  actionKey: string;
  actionKeyLabel: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  actorAppUserId: string;
  actorDisplayName: string | null;
  actorAvatarSrc: string | null;
};

export type InternalUserDetailDto = {
  account: InternalUserAccountSummaryDto;
  roles: InternalUserRoleDto[];
  tutorProfile: InternalUserTutorSummaryDto | null;
  finance: InternalUserFinanceSummaryDto | null;
  recentCases: InternalUserCaseDto[];
  recentAdminActions: InternalUserAdminActionDto[];
};

const RECENT_CASE_LIMIT = 10;
const RECENT_ACTION_LIMIT = 10;

export async function getInternalUserDetail(
  appUserId: string,
): Promise<InternalUserDetailDto | null> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: userRow, error: userError } = await supabase
    .from("app_users")
    .select(
      "account_status, avatar_url, created_at, email, full_name, id, timezone",
    )
    .eq("id", appUserId)
    .maybeSingle<{
      account_status: AccountStatus;
      avatar_url: string | null;
      created_at: string;
      email: string;
      full_name: string | null;
      id: string;
      timezone: string;
    }>();

  if (userError) {
    throw new Error("Could not load the internal user detail.");
  }
  if (!userRow) {
    return null;
  }

  const [roles, tutorProfile, recentCases, recentAdminActions] = await Promise.all(
    [
      loadRoles(appUserId),
      loadTutorProfile(appUserId),
      loadRecentCases(appUserId),
      loadRecentAdminActions(appUserId),
    ],
  );

  let finance: InternalUserFinanceSummaryDto | null = null;
  if (tutorProfile) {
    finance = await loadFinanceSummary(appUserId);
  }

  return {
    account: {
      accountStatus: userRow.account_status,
      accountStatusLabel: ACCOUNT_STATUS_LABELS[userRow.account_status],
      accountStatusTone: ACCOUNT_STATUS_TONES[userRow.account_status],
      appUserId: userRow.id,
      avatarSrc: userRow.avatar_url?.trim() || null,
      createdAt: userRow.created_at,
      displayName: userRow.full_name?.trim() || null,
      email: userRow.email,
      timezone: userRow.timezone,
    },
    finance,
    recentAdminActions,
    recentCases,
    roles: roles ?? [],
    tutorProfile,
  };
}

async function loadRoles(appUserId: string): Promise<InternalUserRoleDto[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("granted_at, revoked_at, role, role_status")
    .eq("app_user_id", appUserId)
    .order("granted_at", { ascending: true })
    .returns<
      Array<{
        granted_at: string;
        revoked_at: string | null;
        role: Role;
        role_status: RoleStatus;
      }>
    >();

  if (error) {
    return [];
  }
  return (data ?? []).map((row) => ({
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
    role: row.role,
    roleLabel: ROLE_LABELS[row.role],
    roleStatus: row.role_status,
    roleStatusLabel: ROLE_STATUS_LABELS[row.role_status],
    roleStatusTone: ROLE_STATUS_TONES[row.role_status],
  }));
}

async function loadTutorProfile(
  appUserId: string,
): Promise<InternalUserTutorSummaryDto | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "application_status, headline, id, public_listing_status, public_slug, self_paused_at",
    )
    .eq("app_user_id", appUserId)
    .maybeSingle<{
      application_status: TutorApplicationStatus;
      headline: string | null;
      id: string;
      public_listing_status: TutorPublicListingStatus;
      public_slug: string | null;
      self_paused_at: string | null;
    }>();

  if (error || !data) {
    return null;
  }

  const avatarSrc = await getPublishedTutorProfilePhotoUrl(data.id);

  return {
    applicationStatus: data.application_status,
    applicationStatusLabel: APPLICATION_STATUS_LABELS[data.application_status],
    applicationStatusTone: APPLICATION_STATUS_TONES[data.application_status],
    avatarSrc,
    headline: data.headline,
    publicListingStatus: data.public_listing_status,
    publicListingStatusLabel: LISTING_STATUS_LABELS[data.public_listing_status],
    publicListingStatusTone: LISTING_STATUS_TONES[data.public_listing_status],
    publicProfileHref: data.public_slug
      ? (`/tutors/${data.public_slug}` as Route)
      : null,
    publicSlug: data.public_slug,
    selfPausedAt: data.self_paused_at,
    tutorProfileId: data.id,
  };
}

// Lightweight tutor-profile id lookup for the cases/audit paths that only
// need the id to widen their target filters — avoids the published-photo
// resolution that the full `loadTutorProfile` performs.
async function loadTutorProfileId(appUserId: string): Promise<string | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("app_user_id", appUserId)
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return null;
  }
  return data.id;
}

async function loadFinanceSummary(
  appUserId: string,
): Promise<InternalUserFinanceSummaryDto | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select(
      "payout_account_country, payout_onboarding_completed_at, payout_onboarding_started_at, payout_readiness_status, payout_status_synced_at, stripe_account_id",
    )
    .eq("app_user_id", appUserId)
    .maybeSingle<{
      payout_account_country: string | null;
      payout_onboarding_completed_at: string | null;
      payout_onboarding_started_at: string | null;
      payout_readiness_status: PayoutReadinessStatus;
      payout_status_synced_at: string | null;
      stripe_account_id: string | null;
    }>();

  if (error || !data) {
    return null;
  }

  // Never expose the raw `stripe_account_id` — flatten to a boolean so
  // the admin can see "has account" without an opaque provider id leak.
  return {
    countryFlagCode: toFlagCode(data.payout_account_country),
    hasStripeAccount: Boolean(data.stripe_account_id),
    payoutAccountCountry: data.payout_account_country,
    payoutOnboardingCompletedAt: data.payout_onboarding_completed_at,
    payoutOnboardingStartedAt: data.payout_onboarding_started_at,
    payoutReadinessStatus: data.payout_readiness_status,
    payoutReadinessStatusLabel:
      PAYOUT_READINESS_LABELS[data.payout_readiness_status],
    payoutReadinessStatusTone:
      PAYOUT_READINESS_TONES[data.payout_readiness_status],
    payoutStatusSyncedAt: data.payout_status_synced_at,
  };
}

async function loadRecentCases(
  appUserId: string,
): Promise<InternalUserCaseDto[]> {
  const supabase = createSupabaseServiceRoleClient();

  // Subject involvement: cases where this user is the `app_user` subject.
  // Tutor-profile cases (`subject_kind = 'tutor_profile'`) are resolved
  // separately because the subject_id is the tutor_profile.id, not the
  // app_user.id. The tutor-profile lookup happens below.
  const tutorProfileId = await loadTutorProfileId(appUserId);

  const subjectFilters: Array<{ subject_kind: string; subject_id: string }> = [
    { subject_id: appUserId, subject_kind: "app_user" },
  ];
  if (tutorProfileId) {
    subjectFilters.push({
      subject_id: tutorProfileId,
      subject_kind: "tutor_profile",
    });
  }

  // Pull subject + reporter cases in parallel, then merge oldest-first.
  const orExpr = subjectFilters
    .map(
      (entry) =>
        `and(subject_kind.eq.${entry.subject_kind},subject_id.eq.${entry.subject_id})`,
    )
    .join(",");

  const [subjectRes, reporterRes] = await Promise.all([
    supabase
      .from("moderation_cases")
      .select("case_kind, case_status, created_at, id, subject_kind, subject_id")
      .or(orExpr)
      .order("created_at", { ascending: false })
      .limit(RECENT_CASE_LIMIT)
      .returns<
        Array<{
          case_kind: ModerationCaseKind;
          case_status: ModerationCaseStatus;
          created_at: string;
          id: string;
          subject_id: string;
          subject_kind: ModerationCaseSubjectKind;
        }>
      >(),
    supabase
      .from("moderation_cases")
      .select("case_kind, case_status, created_at, id, subject_kind, subject_id")
      .eq("reporter_app_user_id", appUserId)
      .order("created_at", { ascending: false })
      .limit(RECENT_CASE_LIMIT)
      .returns<
        Array<{
          case_kind: ModerationCaseKind;
          case_status: ModerationCaseStatus;
          created_at: string;
          id: string;
          subject_id: string;
          subject_kind: ModerationCaseSubjectKind;
        }>
      >(),
  ]);

  const subjectRows = (subjectRes.data ?? []).map((row) =>
    mapInternalUserCase(row, "subject"),
  );
  const reporterRows = (reporterRes.data ?? [])
    .filter((row) => !subjectRows.some((existing) => existing.caseId === row.id))
    .map((row) => mapInternalUserCase(row, "reporter"));

  return [...subjectRows, ...reporterRows]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, RECENT_CASE_LIMIT);
}

function mapInternalUserCase(
  row: {
    case_kind: ModerationCaseKind;
    case_status: ModerationCaseStatus;
    created_at: string;
    id: string;
    subject_kind: ModerationCaseSubjectKind;
  },
  involvement: "subject" | "reporter",
): InternalUserCaseDto {
  return {
    caseId: row.id,
    caseKind: row.case_kind,
    caseKindLabel: CASE_KIND_LABELS[row.case_kind],
    caseStatus: row.case_status,
    caseStatusLabel: CASE_STATUS_LABELS[row.case_status],
    caseStatusTone: CASE_STATUS_TONES[row.case_status],
    createdAt: row.created_at,
    involvement,
    involvementLabel: INVOLVEMENT_LABELS[involvement],
    subjectKind: row.subject_kind,
    subjectKindLabel: SUBJECT_KIND_LABELS[row.subject_kind],
  };
}

async function loadRecentAdminActions(
  appUserId: string,
): Promise<InternalUserAdminActionDto[]> {
  const supabase = createSupabaseServiceRoleClient();

  const tutorProfileId = await loadTutorProfileId(appUserId);
  const targetIds = [appUserId];
  if (tutorProfileId) {
    targetIds.push(tutorProfileId);
  }

  const { data, error } = await supabase
    .from("admin_action_logs")
    .select(
      "action_key, actor_app_user_id, created_at, id, reason, target_id, target_type",
    )
    .in("target_type", ["app_user", "tutor_profile"])
    .in("target_id", targetIds)
    .order("created_at", { ascending: false })
    .limit(RECENT_ACTION_LIMIT)
    .returns<
      Array<{
        action_key: string;
        actor_app_user_id: string;
        created_at: string;
        id: string;
        reason: string | null;
        target_id: string;
        target_type: string;
      }>
    >();

  if (error || !data) {
    return [];
  }

  const actorIds = data.map((row) => row.actor_app_user_id);
  const actorIdentities = await loadAppUserIdentities(actorIds);

  return data.map((row) => {
    const actor = actorIdentities.get(row.actor_app_user_id);
    return {
      actionKey: row.action_key,
      actionKeyLabel: adminActionLabel(row.action_key),
      actorAppUserId: row.actor_app_user_id,
      actorAvatarSrc: actor?.avatarUrl ?? null,
      actorDisplayName: actor?.displayName ?? null,
      createdAt: row.created_at,
      id: row.id,
      reason: row.reason,
      targetId: row.target_id,
      targetType: row.target_type,
    };
  });
}
