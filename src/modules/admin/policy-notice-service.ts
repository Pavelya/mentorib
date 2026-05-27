import "server-only";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { recordAdminAction, snapshot } from "@/modules/admin/audit-service";
import { createPolicyNoticeNotification } from "@/modules/notifications/lifecycle";
import type { PolicyNoticeType } from "@/modules/notifications/constants";

// `P2-OPS-003` Policy-notice broadcast surface.
//
// Admins draft a notice version (notice_type = 'terms' | 'privacy'),
// publish it (sets `published_at = now()` and fans out the mandatory
// `policy_notice_updated` notification through the existing lifecycle
// helper), or revoke it (sets `published_at = null`). Body is plain text
// + a `document_url` link to the canonical published doc; no rich-text
// editor, no markdown pipeline.

export class PolicyNoticeError extends Error {
  code: "forbidden" | "not_found" | "conflict" | "validation" | "audit_failed";

  constructor(
    code: "forbidden" | "not_found" | "conflict" | "validation" | "audit_failed",
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

const ALLOWED_NOTICE_TYPES = ["terms", "privacy"] as const satisfies readonly PolicyNoticeType[];
type AllowedNoticeType = (typeof ALLOWED_NOTICE_TYPES)[number];

export type DraftPolicyNoticeInput = {
  actorAppUserId: string;
  notice_type: AllowedNoticeType;
  version_label: string;
  title: string;
  summary: string;
  document_url: string;
  effective_at: string;
  requires_acknowledgement: boolean;
};

export type PolicyNoticeAdminRow = {
  id: string;
  noticeType: AllowedNoticeType;
  versionLabel: string;
  title: string;
  summary: string;
  documentUrl: string;
  publishedAt: string | null;
  effectiveAt: string;
  requiresAcknowledgement: boolean;
  createdAt: string;
};

type RawNoticeRow = {
  created_at: string;
  document_url: string;
  effective_at: string;
  id: string;
  notice_type: AllowedNoticeType;
  published_at: string | null;
  requires_acknowledgement: boolean;
  summary: string;
  title: string;
  version_label: string;
};

export async function listAdminPolicyNotices(): Promise<PolicyNoticeAdminRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("policy_notice_versions")
    .select(
      "id, notice_type, version_label, title, summary, document_url, published_at, effective_at, requires_acknowledgement, created_at",
    )
    .in("notice_type", [...ALLOWED_NOTICE_TYPES])
    .order("created_at", { ascending: false })
    .returns<RawNoticeRow[]>();

  if (error) {
    throw new PolicyNoticeError("audit_failed", "Could not load policy notices.");
  }

  return (data ?? []).map(mapNoticeRow);
}

export async function loadAdminPolicyNotice(
  id: string,
): Promise<PolicyNoticeAdminRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("policy_notice_versions")
    .select(
      "id, notice_type, version_label, title, summary, document_url, published_at, effective_at, requires_acknowledgement, created_at",
    )
    .eq("id", id)
    .maybeSingle<RawNoticeRow>();

  if (error) {
    throw new PolicyNoticeError("audit_failed", "Could not load policy notice.");
  }

  return data ? mapNoticeRow(data) : null;
}

export async function draftPolicyNotice(input: DraftPolicyNoticeInput) {
  const validated = validateDraftInput(input);

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("policy_notice_versions")
    .insert({
      document_url: validated.document_url,
      effective_at: validated.effective_at,
      notice_type: validated.notice_type,
      published_at: null,
      requires_acknowledgement: validated.requires_acknowledgement,
      summary: validated.summary,
      title: validated.title,
      version_label: validated.version_label,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new PolicyNoticeError(
      "conflict",
      "Could not create draft notice. Version label might already exist.",
    );
  }

  await recordAdminAction({
    action: "policy_notice.draft",
    actorAppUserId: input.actorAppUserId,
    afterState: snapshot({
      notice_type: validated.notice_type,
      requires_acknowledgement: validated.requires_acknowledgement,
      version_label: validated.version_label,
    }),
    targetId: data.id,
    targetType: "policy_notice_versions",
  });

  revalidatePath("/internal/reference-data/policy-notices");

  return data.id;
}

export type PublishPolicyNoticeInput = {
  actorAppUserId: string;
  id: string;
};

export async function publishPolicyNotice(input: PublishPolicyNoticeInput) {
  const notice = await loadAdminPolicyNotice(input.id);
  if (!notice) {
    throw new PolicyNoticeError("not_found", "Policy notice not found.");
  }
  if (notice.publishedAt) {
    throw new PolicyNoticeError(
      "conflict",
      "This notice is already published. Revoke it before re-publishing.",
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const publishedAt = new Date().toISOString();
  const { error } = await supabase
    .from("policy_notice_versions")
    .update({ published_at: publishedAt })
    .eq("id", input.id);

  if (error) {
    throw new PolicyNoticeError(
      "conflict",
      "Could not publish notice. Try again in a moment.",
    );
  }

  await recordAdminAction({
    action: "policy_notice.publish",
    actorAppUserId: input.actorAppUserId,
    afterState: snapshot({ published_at: publishedAt }),
    beforeState: snapshot({ published_at: null }),
    targetId: input.id,
    targetType: "policy_notice_versions",
  });

  // Fan out the mandatory `policy_notice_updated` notification to every
  // active account. The notifications module owns lookup; we only invoke
  // the lifecycle helper per recipient.
  await fanOutPolicyNoticeNotifications(notice);

  revalidatePath("/internal/reference-data/policy-notices");
  revalidatePath("/privacy");
}

export type RevokePolicyNoticeInput = {
  actorAppUserId: string;
  id: string;
};

export async function revokePolicyNotice(input: RevokePolicyNoticeInput) {
  const notice = await loadAdminPolicyNotice(input.id);
  if (!notice) {
    throw new PolicyNoticeError("not_found", "Policy notice not found.");
  }
  if (!notice.publishedAt) {
    throw new PolicyNoticeError("conflict", "This notice is not published.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("policy_notice_versions")
    .update({ published_at: null })
    .eq("id", input.id);

  if (error) {
    throw new PolicyNoticeError(
      "conflict",
      "Could not revoke notice. Try again in a moment.",
    );
  }

  await recordAdminAction({
    action: "policy_notice.revoke",
    actorAppUserId: input.actorAppUserId,
    afterState: snapshot({ published_at: null }),
    beforeState: snapshot({ published_at: notice.publishedAt }),
    targetId: input.id,
    targetType: "policy_notice_versions",
  });

  revalidatePath("/internal/reference-data/policy-notices");
  revalidatePath("/privacy");
}

async function fanOutPolicyNoticeNotifications(notice: PolicyNoticeAdminRow) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id")
    .returns<{ id: string }[]>();

  if (error || !data) {
    return;
  }

  await Promise.all(
    data.map((row) =>
      createPolicyNoticeNotification({
        appUserId: row.id,
        policyNoticeVersionId: notice.id,
        summary: notice.summary,
        title: notice.title,
      }),
    ),
  );
}

function validateDraftInput(input: DraftPolicyNoticeInput) {
  const errors: string[] = [];
  const notice_type = input.notice_type;
  if (!ALLOWED_NOTICE_TYPES.includes(notice_type)) {
    errors.push("notice_type must be terms or privacy");
  }
  const version_label = input.version_label?.trim() ?? "";
  if (!version_label || version_label.length > 60) {
    errors.push("version_label must be 1–60 characters");
  }
  const title = input.title?.trim() ?? "";
  if (!title || title.length > 120) {
    errors.push("title must be 1–120 characters");
  }
  const summary = input.summary?.trim() ?? "";
  if (!summary || summary.length > 2000) {
    errors.push("summary must be 1–2000 characters");
  }
  const document_url = input.document_url?.trim() ?? "";
  if (!/^https?:\/\//u.test(document_url)) {
    errors.push("document_url must start with http(s)://");
  }
  if (document_url.length > 1000) {
    errors.push("document_url must be at most 1000 characters");
  }
  const requires_acknowledgement = Boolean(input.requires_acknowledgement);

  let effective_at = input.effective_at?.trim() ?? "";
  if (!effective_at) {
    errors.push("effective_at is required");
  } else {
    const parsed = new Date(effective_at);
    if (Number.isNaN(parsed.getTime())) {
      errors.push("effective_at must be a valid date");
    } else {
      effective_at = parsed.toISOString();
    }
  }

  if (errors.length > 0) {
    throw new PolicyNoticeError("validation", errors.join("; "));
  }

  return {
    document_url,
    effective_at,
    notice_type,
    requires_acknowledgement,
    summary,
    title,
    version_label,
  };
}

function mapNoticeRow(row: RawNoticeRow): PolicyNoticeAdminRow {
  return {
    createdAt: row.created_at,
    documentUrl: row.document_url,
    effectiveAt: row.effective_at,
    id: row.id,
    noticeType: row.notice_type,
    publishedAt: row.published_at,
    requiresAcknowledgement: row.requires_acknowledgement,
    summary: row.summary,
    title: row.title,
    versionLabel: row.version_label,
  };
}
