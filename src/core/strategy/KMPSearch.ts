import type { ISearchStrategy } from './ISearchStrategy';
import type { SearchStep, SearchResult } from './models';

export class KMPSearch implements ISearchStrategy {
  name = "Busca KMP (Knuth-Morris-Pratt)";
  theoreticalComplexity = "O(n + m)";

  private computeLPSArray(pattern: string): number[] {
    const m = pattern.length;
    const lps = new Array(m).fill(0);
    let len = 0; // length of the previous longest prefix suffix
    let i = 1;

    // lps[0] is always 0
    while (i < m) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }
    return lps;
  }

  execute(text: string, pattern: string): SearchResult {
    const start = performance.now();
    let comparisons = 0;
    const occurrences: number[] = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0) return { occurrences, comparisons, timeMs: performance.now() - start };

    const lps = this.computeLPSArray(pattern);
    let i = 0; // index for text
    let j = 0; // index for pattern

    while (i < n) {
      comparisons++;
      if (pattern[j] === text[i]) {
        j++;
        i++;
      }

      if (j === m) {
        occurrences.push(i - j);
        j = lps[j - 1];
      } else if (i < n && pattern[j] !== text[i]) {
        comparisons++; // Counting the negative check as well, or just keeping the first check
        if (j !== 0) {
          j = lps[j - 1];
        } else {
          i++;
        }
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

    const lps = this.computeLPSArray(pattern);
    let i = 0;
    let j = 0;
    
    // Create an initial informative step about the LPS table calculation
    yield {
        textIndex: 0,
        patternIndex: 0,
        comparisonsCount: comparisons,
        compareTextChar: text[0] || '',
        comparePatternChar: pattern[0],
        match: false,
        found: false,
        description: `Tabela de prefixos/sufixos (LPS) computada: [${lps.join(', ')}]. Iniciando busca.`,
        lps,
        shift: 0
    };

    while (i < n) {
      comparisons++;
      const match = pattern[j] === text[i];
      const startI = i - j; // Starting position of pattern alignment in text for visualization
      
      yield {
        textIndex: startI,
        patternIndex: j,
        comparisonsCount: comparisons,
        compareTextChar: text[i],
        comparePatternChar: pattern[j],
        match,
        found: false,
        description: match ? `Caracteres combinam ('${text[i]}'). Avançando ambos os ponteiros i=${i+1}, j=${j+1}.` : `Diferença encontrada ('${text[i]}' != '${pattern[j]}').`,
        lps,
        shift: match ? 0 : (j !== 0 ? j - lps[j - 1] : 1)
      };

      if (match) {
        j++;
        i++;
      }

      if (j === m) {
        occurrences.push(i - j);
        yield {
          textIndex: i - j,
          patternIndex: m - 1,
          comparisonsCount: comparisons,
          compareTextChar: text[i - 1],
          comparePatternChar: pattern[m - 1],
          match: true,
          found: true,
          description: `Padrão encontrado no índice ${i - j}! Buscando próxima ocorrência saltando via LPS (j = lps[${j-1}] = ${lps[j - 1]}).`,
          lps,
          shift: j - lps[j - 1]
        };
        j = lps[j - 1];
      } else if (i < n && !match) {
        if (j !== 0) {
          const skip = j - lps[j - 1];
          yield {
            textIndex: i - j,
            patternIndex: j,
            comparisonsCount: comparisons,
            compareTextChar: text[i],
            comparePatternChar: pattern[j],
            match: false,
            found: false,
            description: `Recorrendo à tabela LPS (lps[${j - 1}] = ${lps[j - 1]}). Padrão deslizará ${skip} posições.`,
            lps,
            shift: skip
          };
          j = lps[j - 1];
        } else {
           yield {
            textIndex: i,
            patternIndex: j,
            comparisonsCount: comparisons,
            compareTextChar: text[i],
            comparePatternChar: pattern[j],
            match: false,
            found: false,
            description: `j igual a 0, tabela LPS não tem como ajudar na volta. Incrementando texto (i=${i+1}).`,
            lps,
            shift: 1
          };
          i++;
        }
      }
    }

    return { occurrences, comparisons, timeMs: performance.now() - start };
  }
}
