export const LANGUAGES = [
  { code: 'en-NG', name: 'Nigerian English', nativeName: 'Nigerian English', short: 'EN' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', short: 'YO' },
  { code: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa', short: 'HA' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', short: 'IG' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export function languageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

export const CATEGORIES: Record<string, string> = {
  financial_terminology: 'Financial terminology',
  nigerian_english: 'Nigerian English',
  education: 'Education',
  civic_information: 'Civic information',
  cultural_context: 'Cultural & linguistic context',
  translation_meaning: 'Translation & meaning',
};

export function categoryLabel(code: string): string {
  return CATEGORIES[code] ?? code;
}

export const VERDICTS = ['PASSED', 'FAILED', 'NEEDS_REVIEW', 'ERROR', 'SKIPPED'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABELS: Record<Verdict, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  NEEDS_REVIEW: 'Needs review',
  ERROR: 'Error',
  SKIPPED: 'Skipped',
};

export const NATLAS_ATTRIBUTION =
  'N-ATLaS is an initiative of the Federal Ministry of Communications, Innovation and Digital Economy, and powered by Awarri Technologies.';
