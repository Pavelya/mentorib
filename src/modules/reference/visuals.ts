import type {
  AppLanguageFlagCode as ReferenceLanguageFlagCode,
  AppSubjectIconKey as ReferenceSubjectIconKey,
} from "@/components/ui/app-icons";

export type { ReferenceLanguageFlagCode, ReferenceSubjectIconKey };

const subjectIconKeysByCode: Record<string, ReferenceSubjectIconKey> = {
  biology: "biology",
  business_management: "business",
  chemistry: "chemistry",
  economics: "economics",
  english_a: "english",
  history: "history",
  mathematics_aa: "math_aa",
  mathematics_ai: "math_ai",
  physics: "physics",
  psychology: "psychology",
  tok: "tok",
};

const languageFlagCodesByCode: Record<string, ReferenceLanguageFlagCode> = {
  en: "gb",
  es: "es",
  fr: "fr",
  pl: "pl",
};

export function getReferenceLanguageFlagCode(languageCode: string) {
  return languageFlagCodesByCode[languageCode] ?? null;
}

export function getReferenceSubjectIconKey(subjectCode: string) {
  return subjectIconKeysByCode[subjectCode] ?? null;
}
