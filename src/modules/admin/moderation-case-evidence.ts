import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  ModerationCaseEvidenceDto,
  ModerationCaseReporterSummaryDto,
  ModerationCaseSubjectSummaryDto,
} from "@/modules/admin/moderation-case";
import type {
  ModerationCaseDetailDto,
} from "@/modules/admin/moderation-case";
import { loadAppUserDisplayName } from "@/modules/admin/moderation-case-repository";

type MessageRow = {
  body: string;
  conversation_id: string;
  created_at: string;
  id: string;
  sender_app_user_id: string;
};

type ConversationRow = {
  id: string;
  student_profile_id: string;
  tutor_profile_id: string;
};

type ProfileLookupRow = {
  app_user_id: string;
  id: string;
};

type TutorProfileSubjectRow = {
  app_user_id: string;
  id: string;
  public_slug: string | null;
};

// Lazy evidence loader. Returns only what the case-detail page is
// allowed to show: message body+URL for `message` subjects, tutor
// public-profile URL for `tutor_profile` subjects, and conversation
// participant ids for `conversation` subjects. Never broadens to other
// cases' notes, raw rows, or unrelated data.
export async function loadCaseEvidence(
  caseDetail: Pick<ModerationCaseDetailDto, "subjectKind" | "subjectId">,
): Promise<ModerationCaseEvidenceDto> {
  const supabase = createSupabaseServiceRoleClient();

  if (caseDetail.subjectKind === "message") {
    const { data, error } = await supabase
      .from("messages")
      .select("body, conversation_id, created_at, id, sender_app_user_id")
      .eq("id", caseDetail.subjectId)
      .maybeSingle<MessageRow>();
    if (error || !data) {
      return { kind: "none" };
    }
    return {
      kind: "message",
      message: {
        body: data.body,
        conversationId: data.conversation_id,
        createdAt: data.created_at,
        messageId: data.id,
        senderAppUserId: data.sender_app_user_id,
      },
    };
  }

  if (caseDetail.subjectKind === "conversation") {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, student_profile_id, tutor_profile_id")
      .eq("id", caseDetail.subjectId)
      .maybeSingle<ConversationRow>();
    if (error || !data) {
      return { kind: "none" };
    }
    const [studentResult, tutorResult] = await Promise.all([
      supabase
        .from("student_profiles")
        .select("app_user_id, id")
        .eq("id", data.student_profile_id)
        .maybeSingle<ProfileLookupRow>(),
      supabase
        .from("tutor_profiles")
        .select("app_user_id, id")
        .eq("id", data.tutor_profile_id)
        .maybeSingle<ProfileLookupRow>(),
    ]);
    return {
      kind: "conversation",
      conversation: {
        conversationId: data.id,
        studentAppUserId: studentResult.data?.app_user_id ?? "",
        tutorAppUserId: tutorResult.data?.app_user_id ?? "",
      },
    };
  }

  if (caseDetail.subjectKind === "tutor_profile") {
    const { data, error } = await supabase
      .from("tutor_profiles")
      .select("app_user_id, id, public_slug")
      .eq("id", caseDetail.subjectId)
      .maybeSingle<TutorProfileSubjectRow>();
    if (error || !data) {
      return { kind: "none" };
    }
    return {
      kind: "tutor_profile",
      tutorProfile: {
        publicProfileUrl: data.public_slug ? `/tutors/${data.public_slug}` : null,
        publicSlug: data.public_slug,
        tutorProfileId: data.id,
      },
    };
  }

  return { kind: "none" };
}

// Cross-domain subject summary. Returns D7-shaped display labels only —
// never raw subject rows. The detail page composes this Panel via these
// summaries so the admin module doesn't widen the DTO surface of the
// owning domain.
export async function loadCaseSubjectSummary(
  caseDetail: Pick<ModerationCaseDetailDto, "subjectKind" | "subjectId">,
): Promise<ModerationCaseSubjectSummaryDto> {
  const supabase = createSupabaseServiceRoleClient();

  if (caseDetail.subjectKind === "app_user") {
    const displayName = await loadAppUserDisplayName(caseDetail.subjectId);
    return {
      appUserId: caseDetail.subjectId,
      kind: "app_user",
      primaryLabel: displayName ?? "Unknown user",
      secondaryLabel: null,
      tutorProfileId: null,
      tutorPublicSlug: null,
    };
  }

  if (caseDetail.subjectKind === "tutor_profile") {
    const { data } = await supabase
      .from("tutor_profiles")
      .select("app_user_id, id, public_slug, headline")
      .eq("id", caseDetail.subjectId)
      .maybeSingle<{
        app_user_id: string;
        id: string;
        public_slug: string | null;
        headline: string | null;
      }>();
    const displayName = data?.app_user_id
      ? await loadAppUserDisplayName(data.app_user_id)
      : null;
    return {
      appUserId: data?.app_user_id ?? null,
      kind: "tutor_profile",
      primaryLabel: displayName ?? "Tutor profile",
      secondaryLabel: data?.headline?.trim() || null,
      tutorProfileId: data?.id ?? null,
      tutorPublicSlug: data?.public_slug ?? null,
    };
  }

  if (caseDetail.subjectKind === "conversation") {
    return {
      appUserId: null,
      kind: "conversation",
      primaryLabel: "Conversation",
      secondaryLabel: caseDetail.subjectId,
      tutorProfileId: null,
      tutorPublicSlug: null,
    };
  }

  if (caseDetail.subjectKind === "message") {
    return {
      appUserId: null,
      kind: "message",
      primaryLabel: "Message",
      secondaryLabel: caseDetail.subjectId,
      tutorProfileId: null,
      tutorPublicSlug: null,
    };
  }

  return {
    appUserId: null,
    kind: caseDetail.subjectKind,
    primaryLabel: "Subject",
    secondaryLabel: caseDetail.subjectId,
    tutorProfileId: null,
    tutorPublicSlug: null,
  };
}

// Reporter summary — display name + the report's free-text reason
// (captured at open time in `internal_summary`). Never carries email or
// any other reporter contact info, per §8.3.
export async function loadCaseReporterSummary(
  caseDetail: Pick<
    ModerationCaseDetailDto,
    "reporterAppUserId" | "internalSummary"
  >,
): Promise<ModerationCaseReporterSummaryDto | null> {
  if (!caseDetail.reporterAppUserId) {
    return null;
  }
  const displayName = await loadAppUserDisplayName(caseDetail.reporterAppUserId);
  return {
    appUserId: caseDetail.reporterAppUserId,
    displayName,
    reasonText: caseDetail.internalSummary,
  };
}
