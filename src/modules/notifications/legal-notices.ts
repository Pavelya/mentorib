import { getSafeRedirectPath } from "@/lib/auth/allowed-redirects";
import type { MentorIbDatabase } from "@/lib/supabase/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/seo/site";
import type { PolicyNoticeType } from "@/modules/notifications/constants";

type PolicyNoticeRow = MentorIbDatabase["public"]["Tables"]["policy_notice_versions"]["Row"];
type PolicyNoticeReceiptRow =
  MentorIbDatabase["public"]["Tables"]["policy_notice_receipts"]["Row"];

const legalNoticeTypes = ["terms", "privacy"] as const satisfies readonly PolicyNoticeType[];

export type LegalNoticeDto = {
  documentUrl: string;
  effectiveAt: string;
  id: string;
  noticeType: PolicyNoticeType;
  publishedAt: string;
  receipt: null | {
    acknowledgedAt: string | null;
    firstShownAt: string | null;
    viewedAt: string | null;
  };
  requiresAcknowledgement: boolean;
  summary: string;
  title: string;
  versionLabel: string;
};

export async function listLegalNoticesForAccount(appUserId: string) {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const { data: notices, error: noticesError } = await supabase
    .from("policy_notice_versions")
    .select(
      "id, notice_type, version_label, published_at, effective_at, requires_acknowledgement, title, summary, document_url",
    )
    .in("notice_type", [...legalNoticeTypes])
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false })
    .returns<PolicyNoticeRow[]>();

  if (noticesError || !notices) {
    return [] satisfies LegalNoticeDto[];
  }

  const { data: receipts, error: receiptsError } = await supabase
    .from("policy_notice_receipts")
    .select(
      "id, policy_notice_version_id, app_user_id, first_shown_at, viewed_at, acknowledged_at, created_at, updated_at",
    )
    .eq("app_user_id", appUserId)
    .returns<PolicyNoticeReceiptRow[]>();

  if (receiptsError) {
    return notices.map((notice) => mapLegalNoticeDto(notice, null));
  }

  const receiptByNoticeId = new Map(
    (receipts ?? []).map((receipt) => [receipt.policy_notice_version_id, receipt] as const),
  );

  return notices.map((notice) => {
    return mapLegalNoticeDto(notice, receiptByNoticeId.get(notice.id) ?? null);
  });
}

export async function getLatestPendingLegalNotice(appUserId: string) {
  const notices = await listLegalNoticesForAccount(appUserId);

  return notices.find((notice) => {
    return requiresLegalNoticeAction(notice);
  }) ?? null;
}

export function requiresLegalNoticeAction(notice: LegalNoticeDto) {
  if (notice.requiresAcknowledgement) {
    return !notice.receipt?.acknowledgedAt;
  }

  return !notice.receipt?.viewedAt;
}

export function getLegalNoticeTypeLabel(noticeType: PolicyNoticeType) {
  switch (noticeType) {
    case "terms":
      return "Terms update";
    case "privacy":
      return "Privacy update";
    case "cookie_notice":
      return "Cookie notice";
    case "tutor_agreement":
      return "Tutor agreement";
    case "trust_and_safety":
      return "Trust and safety update";
    case "refund_policy":
      return "Refund policy update";
  }
}

export function buildLegalNoticeReviewPath(noticeId: string, returnTo?: string | null) {
  const url = new URL("/privacy", siteConfig.origin);

  url.searchParams.set("notice", noticeId);

  const safeReturnTo = getSafeRedirectPath(returnTo);

  if (safeReturnTo) {
    url.searchParams.set("returnTo", safeReturnTo);
  }

  return `${url.pathname}${url.search}`;
}

export async function recordLegalNoticeReview(
  appUserId: string,
  noticeId: string,
) {
  const serviceRoleClient = createSupabaseServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data: notice, error: noticeError } = await serviceRoleClient
    .from("policy_notice_versions")
    .select("id, notice_type, published_at, requires_acknowledgement")
    .eq("id", noticeId)
    .maybeSingle<
      Pick<
        PolicyNoticeRow,
        "id" | "notice_type" | "published_at" | "requires_acknowledgement"
      >
    >();

  if (
    noticeError ||
    !notice ||
    !isLegalNoticeType(notice.notice_type) ||
    new Date(notice.published_at).getTime() > Date.now()
  ) {
    throw new Error("The selected legal notice is not available.");
  }

  const { data: existingReceipt, error: receiptError } = await serviceRoleClient
    .from("policy_notice_receipts")
    .select("id, first_shown_at, viewed_at, acknowledged_at")
    .eq("app_user_id", appUserId)
    .eq("policy_notice_version_id", noticeId)
    .maybeSingle<
      Pick<
        PolicyNoticeReceiptRow,
        "acknowledged_at" | "first_shown_at" | "id" | "viewed_at"
      >
    >();

  if (receiptError) {
    throw new Error("The legal notice review state could not be updated.");
  }

  const { error: upsertError } = await serviceRoleClient.from("policy_notice_receipts").upsert(
    {
      acknowledged_at: notice.requires_acknowledgement
        ? existingReceipt?.acknowledged_at ?? nowIso
        : existingReceipt?.acknowledged_at ?? null,
      app_user_id: appUserId,
      first_shown_at: existingReceipt?.first_shown_at ?? nowIso,
      policy_notice_version_id: noticeId,
      viewed_at: existingReceipt?.viewed_at ?? nowIso,
    },
    { onConflict: "policy_notice_version_id,app_user_id" },
  );

  if (upsertError) {
    throw new Error("The legal notice review state could not be saved.");
  }
}

function mapLegalNoticeDto(
  notice: PolicyNoticeRow,
  receipt: PolicyNoticeReceiptRow | null,
): LegalNoticeDto {
  return {
    documentUrl: notice.document_url,
    effectiveAt: notice.effective_at,
    id: notice.id,
    noticeType: notice.notice_type,
    publishedAt: notice.published_at,
    receipt: receipt
      ? {
          acknowledgedAt: receipt.acknowledged_at,
          firstShownAt: receipt.first_shown_at,
          viewedAt: receipt.viewed_at,
        }
      : null,
    requiresAcknowledgement: notice.requires_acknowledgement,
    summary: notice.summary,
    title: notice.title,
    versionLabel: notice.version_label,
  };
}

function isLegalNoticeType(
  noticeType: PolicyNoticeType,
): noticeType is (typeof legalNoticeTypes)[number] {
  return noticeType === "terms" || noticeType === "privacy";
}
