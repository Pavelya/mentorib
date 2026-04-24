import type {
  AppLanguageFlagCode as MatchLanguageFlagCode,
  AppSubjectIconKey as MatchSubjectIconKey,
} from "@/components/ui/app-icons";

export type { MatchLanguageFlagCode, MatchSubjectIconKey };

const subjectIconKeysByCode: Record<string, MatchSubjectIconKey> = {
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

const languageFlagCodesByCode: Record<string, MatchLanguageFlagCode> = {
  en: "gb",
  es: "es",
  fr: "fr",
  pl: "pl",
};

export function getLanguageFlagCode(languageCode: string) {
  return languageFlagCodesByCode[languageCode] ?? null;
}

export function getSubjectIconKey(subjectCode: string) {
  return subjectIconKeysByCode[subjectCode] ?? null;
}
