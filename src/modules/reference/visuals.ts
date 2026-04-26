import type { FlagCode, IconKey } from "@/components/ui";

export type ReferenceLanguageFlagCode = FlagCode;
export type ReferenceSubjectIconKey = IconKey;

const subjectIconKeysByCode: Record<string, IconKey> = {
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

const languageFlagCodesByCode: Record<string, FlagCode> = {
  en: "GB",
  es: "ES",
  fr: "FR",
  pl: "PL",
};

export function getReferenceLanguageFlagCode(languageCode: string) {
  return languageFlagCodesByCode[languageCode] ?? null;
}

export function getReferenceSubjectIconKey(subjectCode: string) {
  return subjectIconKeysByCode[subjectCode] ?? null;
}
