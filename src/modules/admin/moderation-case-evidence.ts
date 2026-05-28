import "server-only";

import type { Route } from "next";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { SUBJECT_KIND_LABELS } from "@/modules/admin/labels";
import type {
  ModerationCaseEvidenceDto,
  ModerationCaseReporterSummaryDto,
  ModerationCaseSubjectSummaryDto,
} from "@/modules/admin/moderation-case";
import type {
  ModerationCaseDetailDto,
} from "@/modules/admin/moderation-case";
import {
  loadAppUserIdentities,
  loadAppUserIdentity,
} from "@/modules/admin/moderation-case-repository";
import { getPublishedTutorProfilePhotoUrl } from "@/modules/tutors/media-public-assets";

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
    const sender = await loadAppUserIdentity(data.sender_app_user_id);
    return {
      kind: "message",
      message: {
        body: data.body,
        conversationId: data.conversation_id,
        createdAt: data.created_at,
        messageId: data.id,
        senderAppUserId: data.sender_app_user_id,
        senderAvatarSrc: sender.avatarUrl,
        senderDisplayName: sender.displayName,
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
    const studentAppUserId = studentResult.data?.app_user_id ?? "";
    const tutorAppUserId = tutorResult.data?.app_user_id ?? "";
    const identities = await loadAppUserIdentities([
      studentAppUserId,
      tutorAppUserId,
    ]);
    const student = identities.get(studentAppUserId);
    const tutor = identities.get(tutorAppUserId);
    return {
      kind: "conversation",
      conversation: {
        conversationId: data.id,
        studentAppUserId,
        studentAvatarSrc: student?.avatarUrl ?? null,
        studentDisplayName: student?.displayName ?? null,
        tutorAppUserId,
        tutorAvatarSrc: tutor?.avatarUrl ?? null,
        tutorDisplayName: tutor?.displayName ?? null,
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
    const [identity, avatarSrc] = await Promise.all([
      data.app_user_id
        ? loadAppUserIdentity(data.app_user_id)
        : Promise.resolve({ avatarUrl: null, displayName: null }),
      getPublishedTutorProfilePhotoUrl(data.id),
    ]);
    return {
      kind: "tutor_profile",
      tutorProfile: {
        avatarSrc,
        displayName: identity.displayName,
        publicProfileHref: data.public_slug
          ? (`/tutors/${data.public_slug}` as Route)
          : null,
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
    const identity = await loadAppUserIdentity(caseDetail.subjectId);
    return {
      appUserId: caseDetail.subjectId,
      avatarSrc: identity.avatarUrl,
      kind: "app_user",
      kindLabel: SUBJECT_KIND_LABELS.app_user,
      primaryLabel: identity.displayName ?? "Unknown user",
      publicProfileHref: null,
      secondaryLabel: null,
      technicalRef: null,
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
    const [identity, avatarSrc] = await Promise.all([
      data?.app_user_id
        ? loadAppUserIdentity(data.app_user_id)
        : Promise.resolve({ avatarUrl: null, displayName: null }),
      data?.id ? getPublishedTutorProfilePhotoUrl(data.id) : Promise.resolve(null),
    ]);
    return {
      appUserId: data?.app_user_id ?? null,
      avatarSrc,
      kind: "tutor_profile",
      kindLabel: SUBJECT_KIND_LABELS.tutor_profile,
      primaryLabel: identity.displayName ?? "Tutor profile",
      publicProfileHref: data?.public_slug
        ? (`/tutors/${data.public_slug}` as Route)
        : null,
      secondaryLabel: data?.headline?.trim() || null,
      technicalRef: null,
      tutorProfileId: data?.id ?? null,
      tutorPublicSlug: data?.public_slug ?? null,
    };
  }

  if (caseDetail.subjectKind === "conversation") {
    return {
      appUserId: null,
      avatarSrc: null,
      kind: "conversation",
      kindLabel: SUBJECT_KIND_LABELS.conversation,
      primaryLabel: "Conversation",
      publicProfileHref: null,
      secondaryLabel: null,
      technicalRef: caseDetail.subjectId,
      tutorProfileId: null,
      tutorPublicSlug: null,
    };
  }

  if (caseDetail.subjectKind === "message") {
    return {
      appUserId: null,
      avatarSrc: null,
      kind: "message",
      kindLabel: SUBJECT_KIND_LABELS.message,
      primaryLabel: "Message",
      publicProfileHref: null,
      secondaryLabel: null,
      technicalRef: caseDetail.subjectId,
      tutorProfileId: null,
      tutorPublicSlug: null,
    };
  }

  return {
    appUserId: null,
    avatarSrc: null,
    kind: caseDetail.subjectKind,
    kindLabel: SUBJECT_KIND_LABELS[caseDetail.subjectKind],
    primaryLabel: SUBJECT_KIND_LABELS[caseDetail.subjectKind],
    publicProfileHref: null,
    secondaryLabel: null,
    technicalRef: caseDetail.subjectId,
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
  const identity = await loadAppUserIdentity(caseDetail.reporterAppUserId);
  return {
    appUserId: caseDetail.reporterAppUserId,
    avatarSrc: identity.avatarUrl,
    displayName: identity.displayName,
    reasonText: caseDetail.internalSummary,
  };
}
