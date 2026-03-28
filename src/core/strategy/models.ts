export interface SearchStep {
  textIndex: number; // start index in text for the current window
  patternIndex: number; // current character in pattern being compared
  comparisonsCount: number; // number of comparisons performed up to this step
  compareTextChar: string; // character from text
  comparePatternChar: string; // character from pattern
  match: boolean; // did these two characters match?
  found: boolean; // did we find the whole pattern this step?
  description: string; // visual explanation
  // Optional algorithm-specific data
  lps?: number[];
  badCharTable?: Record<string, number>;
  goodSuffixTable?: number[];
  hashText?: number;
  hashPattern?: number;
  shift?: number;
}

export interface SearchResult {
  occurrences: number[];
  comparisons: number;
  timeMs: number;
}
