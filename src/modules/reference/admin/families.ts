import "server-only";

import type { AdminActionKey } from "@/modules/admin/actions";

// `P2-OPS-003` Editable vs read-only matrix.
//
// Every reference-data family the admin UI surfaces is registered here.
// `editableFields` is the *only* place that names columns the admin
// Server Action will accept on a `changes` payload; anything outside
// this allowlist is rejected as `forbidden` before any write. Slugs,
// keys, codes, ids, and provider-connection fields are intentionally
// absent from every allowlist because they are code-owned vocabularies
// (canonical-value-ownership-map-v1).
//
// New families require a migration in the same change that adds them
// here. The admin UI itself never creates rows or deletes rows.

export type ReferenceEditableField =
  | "display_name"
  | "display_description"
  | "display_label"
  | "helper_text"
  | "sort_order"
  | "is_active";

export type ReferenceFamilyDescriptor = {
  /** URL slug for the family sub-route. Code-owned, never editable. */
  readonly family: ReferenceFamilySlug;
  /** Display label rendered in the admin UI. */
  readonly label: string;
  /** Short description rendered in the admin UI. */
  readonly description: string;
  /** Postgres table name backing the family. */
  readonly table: ReferenceFamilyTable;
  /** Primary-key column used to scope updates. */
  readonly idColumn: "id" | "language_code" | "provider_key";
  /** Column that uniquely identifies the row in audit logs / UI. */
  readonly identifierColumn: string;
  /** Audit action key emitted on every successful edit. */
  readonly actionKey: AdminActionKey;
  /** Allowlist of editable columns — the binding security boundary. */
  readonly editableFields: readonly ReferenceEditableField[];
  /** Routes whose render depends on this vocabulary; revalidated on edit. */
  readonly revalidatePaths: readonly string[];
};

export const REFERENCE_FAMILY_SLUGS = [
  "subjects",
  "focus-areas",
  "languages",
  "meeting-providers",
  "video-media-providers",
] as const;

export type ReferenceFamilySlug = (typeof REFERENCE_FAMILY_SLUGS)[number];

type ReferenceFamilyTable =
  | "subjects"
  | "subject_focus_areas"
  | "languages"
  | "meeting_providers"
  | "video_media_providers";

export const REFERENCE_FAMILIES: Record<
  ReferenceFamilySlug,
  ReferenceFamilyDescriptor
> = {
  subjects: {
    actionKey: "reference_data.subject.update",
    description:
      "Display labels and descriptions students see in match, search, and tutor profiles.",
    editableFields: [
      "display_name",
      "display_description",
      "sort_order",
      "is_active",
    ],
    family: "subjects",
    idColumn: "id",
    identifierColumn: "subject_code",
    label: "Subjects",
    revalidatePaths: ["/match", "/results", "/tutors"],
    table: "subjects",
  },
  "focus-areas": {
    actionKey: "reference_data.subject_focus_area.update",
    description:
      "Curriculum focus areas used to narrow the subject onboarding flow.",
    editableFields: ["display_name", "sort_order", "is_active"],
    family: "focus-areas",
    idColumn: "id",
    identifierColumn: "focus_area_code",
    label: "Focus areas",
    revalidatePaths: ["/match", "/results"],
    table: "subject_focus_areas",
  },
  languages: {
    actionKey: "reference_data.language.update",
    description: "Languages tutors can teach in and students can filter by.",
    editableFields: ["display_name", "sort_order", "is_active"],
    family: "languages",
    idColumn: "language_code",
    identifierColumn: "language_code",
    label: "Languages",
    revalidatePaths: ["/match", "/results", "/tutors"],
    table: "languages",
  },
  "meeting-providers": {
    actionKey: "reference_data.meeting_provider.update",
    description: "Lesson meeting providers tutors can advertise on a profile.",
    editableFields: ["display_name", "sort_order", "is_active"],
    family: "meeting-providers",
    idColumn: "provider_key",
    identifierColumn: "provider_key",
    label: "Meeting providers",
    revalidatePaths: ["/tutor/profile"],
    table: "meeting_providers",
  },
  "video-media-providers": {
    actionKey: "reference_data.video_media_provider.update",
    description: "Video providers allowed in tutor profile media uploads.",
    editableFields: ["display_name", "sort_order", "is_active"],
    family: "video-media-providers",
    idColumn: "provider_key",
    identifierColumn: "provider_key",
    label: "Video media providers",
    revalidatePaths: ["/tutor/profile"],
    table: "video_media_providers",
  },
};

export function isReferenceFamilySlug(
  value: string,
): value is ReferenceFamilySlug {
  return (REFERENCE_FAMILY_SLUGS as readonly string[]).includes(value);
}

export function getReferenceFamily(
  slug: ReferenceFamilySlug,
): ReferenceFamilyDescriptor {
  return REFERENCE_FAMILIES[slug];
}
