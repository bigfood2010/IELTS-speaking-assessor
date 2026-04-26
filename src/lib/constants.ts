export const SCORE_THRESHOLDS = {
  HIGH: 7.5,
  MEDIUM: 6.5,
  LOW: 5.0
} as const;

export const CRITERIA_LABELS: Record<string, string> = {
  fluency: 'Fluency & Coherence',
  lexical: 'Lexical Resource',
  grammar: 'Grammatical Range',
  pronunciation: 'Pronunciation',
  fluencyAndCoherence: 'Fluency & Coherence',
  lexicalResource: 'Lexical Resource',
  grammaticalRange: 'Grammatical Range & Accuracy'
};

export const VIETNAMESE_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;