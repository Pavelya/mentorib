import {
  loadActiveReferenceLanguages,
  loadActiveReferenceSubjectFocusAreas,
  loadActiveReferenceSubjects,
} from "@/modules/reference/catalog";
import { getReferenceLanguageFlagCode } from "@/modules/reference/visuals";
import type { FlagCode } from "@/components/ui";

export type PublicTutorSearchFacetOption = {
  // Filter token stored in the URL search params and matched against the
  // record fields in `public-tutor-record.ts`.
  filterValue: string;
  // Display label for the chip surface.
  label: string;
};

export type PublicTutorSearchLanguageOption = PublicTutorSearchFacetOption & {
  flagCode: FlagCode | null;
};

export type PublicTutorSearchFilterOptions = {
  subjects: PublicTutorSearchFacetOption[];
  focusAreas: PublicTutorSearchFacetOption[];
  languages: PublicTutorSearchLanguageOption[];
};

// Server-loaded filter vocabularies, sourced exclusively from
// `src/modules/reference/**`. The `/tutors` page passes these to the
// client-rendered search panel so no filter option is hardcoded route-side.
export async function loadPublicTutorSearchFilterOptions(): Promise<
  PublicTutorSearchFilterOptions
> {
  const [subjects, focusAreas, languages] = await Promise.all([
    loadActiveReferenceSubjects(),
    loadActiveReferenceSubjectFocusAreas(),
    loadActiveReferenceLanguages(),
  ]);

  return {
    subjects: subjects.map((subject) => ({
      filterValue: subject.slug,
      label: subject.displayName,
    })),
    focusAreas: focusAreas.map((focusArea) => ({
      filterValue: focusArea.slug,
      label: focusArea.displayName,
    })),
    languages: languages.map((language) => ({
      filterValue: language.languageCode,
      label: language.displayName,
      flagCode: getReferenceLanguageFlagCode(language.languageCode),
    })),
  };
}
