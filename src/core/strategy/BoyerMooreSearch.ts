import type { ISearchStrategy } from './ISearchStrategy';
import type { SearchStep, SearchResult } from './models';

export class BoyerMooreSearch implements ISearchStrategy {
  name = "Busca Boyer-Moore (Heurística Character Ruim)";
  theoreticalComplexity = "O(n / m) melhor caso / O(n * m) pior caso";

  private badCharHeuristic(pattern: string): Record<string, number> {
    const badChar: Record<string, number> = {};
    const m = pattern.length;

    // Initialize all occurrences as -1 is not strictly necessary if we use fallback,
    // but building the map is better.
    for (let i = 0; i < m; i++) {
      badChar[pattern[i]] = i;
    }
    return badChar;
  }

  execute(text: string, pattern: string): SearchResult {
    const start = performance.now();
    let comparisons = 0;
    const occurrences: number[] = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0) return { occurrences, comparisons, timeMs: performance.now() - start };

    const badChar = this.badCharHeuristic(pattern);
    let s = 0; // s is shift of the pattern with respect to text

    while (s <= (n - m)) {
      let j = m - 1;

      // Keep reducing index j of pattern while characters of pattern and text are matching
      while (j >= 0) {
        comparisons++;
        if (pattern[j] !== text[s + j]) break;
        j--;
      }

      if (j < 0) {
        occurrences.push(s);
        // Shift pattern so that the next character in text aligns with the last occurrence of it in pattern.
        // The condition s+m < n is necessary for the case when pattern occurs at the end of text
        const badCharIdx = (s + m < n && badChar[text[s + m]] !== undefined) ? badChar[text[s + m]] : -1;
        s += (s + m < n) ? m - badCharIdx : 1;
      } else {
        // Shift pattern so that the bad character in text aligns with the last occurrence of it in pattern.
        const badCharIdx = badChar[text[s + j]] !== undefined ? badChar[text[s + j]] : -1;
        // max() is used to make sure that we get a positive shift
        const shiftAmount = Math.max(1, j - badCharIdx);
        s += shiftAmount;
      }
    }

    return { occurrences, comparisons, timeMs: performance.now() - start };
  }

  *executeStepByStep(text: string, pattern: string): Generator<SearchStep, SearchResult, unknown> {
    const start = performance.now();
    let comparisons = 0;
    const occurrences: number[] = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0) return { occurrences, comparisons, timeMs: performance.now() - start };

    const badChar = this.badCharHeuristic(pattern);
    
    yield {
        textIndex: 0,
        patternIndex: m - 1,
        comparisonsCount: comparisons,
        compareTextChar: text[m - 1] || '',
        comparePatternChar: pattern[m - 1],
        match: false,
        found: false,
        description: `Tabela de Caracteres Ruins processada. Iniciando busca pelo fim do padrão.`,
        badCharTable: badChar,
        shift: 0
    };

    let s = 0;

    while (s <= (n - m)) {
      let j = m - 1;
      let matched = true;

      while (j >= 0) {
        comparisons++;
        const match = pattern[j] === text[s + j];
        
        yield {
          textIndex: s,
          patternIndex: j,
          comparisonsCount: comparisons,
          compareTextChar: text[s + j],
          comparePatternChar: pattern[j],
          match,
          found: false,
          description: match ? `Combinação no final da janela ('${pattern[j]}'). Voltando ponteiro (j = ${j-1}).` : `Mismatch ('${text[s + j]}' != '${pattern[j]}').`,
          badCharTable: badChar,
          shift: match ? 0 : Math.max(1, j - (badChar[text[s + j]] !== undefined ? badChar[text[s + j]] : -1))
        };

        if (!match) {
          matched = false;
          break;
        }
        j--;
      }

      if (matched) {
        occurrences.push(s);
        
        const nextChar = s + m < n ? text[s + m] : '';
        const badCharIdx = (s + m < n && badChar[nextChar] !== undefined) ? badChar[nextChar] : -1;
        const shiftAmount = (s + m < n) ? m - badCharIdx : 1;

        yield {
          textIndex: s,
          patternIndex: 0, // indicates found
          comparisonsCount: comparisons,
          compareTextChar: text[s],
          comparePatternChar: pattern[0],
          match: true,
          found: true,
          description: `Padrão encontrado na posição ${s}! Usando caractere posterior ('${nextChar}') para próximo shift (${shiftAmount}).`,
          badCharTable: badChar,
          shift: shiftAmount
        };

        s += shiftAmount;
      } else {
        const badCharIdx = badChar[text[s + j]] !== undefined ? badChar[text[s + j]] : -1;
        const shiftAmount = Math.max(1, j - badCharIdx);
        
        yield {
          textIndex: s,          
          patternIndex: j,
          comparisonsCount: comparisons,
          compareTextChar: text[s + j],
          comparePatternChar: pattern[j],
          match: false,
          found: false,
          description: `Aplicando salto Bad Character. C '${text[s+j]}' última posição no padrão é ${badCharIdx}. Saltando ${shiftAmount}.`,
          badCharTable: badChar,
          shift: shiftAmount
        };

        s += shiftAmount;
      }
    }

    return { occurrences, comparisons, timeMs: performance.now() - start };
  }
}
