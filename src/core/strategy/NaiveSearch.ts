import type { ISearchStrategy } from './ISearchStrategy';
import type { SearchStep, SearchResult } from './models';

export class NaiveSearch implements ISearchStrategy {
  name = "Busca Naive (Força Bruta)";
  theoreticalComplexity = "O(n * m)";

  execute(text: string, pattern: string): SearchResult {
    const start = performance.now();
    let comparisons = 0;
    const occurrences: number[] = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0) return { occurrences, comparisons, timeMs: performance.now() - start };

    for (let i = 0; i <= n - m; i++) {
      let j = 0;
      while (j < m) {
        comparisons++;
        if (text[i + j] !== pattern[j]) {
          break;
        }
        j++;
      }
      if (j === m) {
        occurrences.push(i);
      }
    }

    return {
      occurrences,
      comparisons,
      timeMs: performance.now() - start,
    };
  }

  *executeStepByStep(text: string, pattern: string): Generator<SearchStep, SearchResult, unknown> {
    const start = performance.now();
    let comparisons = 0;
    const occurrences: number[] = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0) return { occurrences, comparisons, timeMs: performance.now() - start };

    for (let i = 0; i <= n - m; i++) {
      let j = 0;
      let matched = true;
      
      while (j < m) {
        comparisons++;
        const match = text[i + j] === pattern[j];
        
        yield {
          textIndex: i,
          patternIndex: j,
          comparisonsCount: comparisons,
          compareTextChar: text[i + j],
          comparePatternChar: pattern[j],
          match,
          found: false,
          description: match ? `Caracteres combinam ('${pattern[j]}').` : `Diferença encontrada ('${text[i + j]}' != '${pattern[j]}').`,
          shift: 1 // Naive always shifts by 1 in outer loop
        };

        if (!match) {
          matched = false;
          break;
        }
        j++;
      }
      
      if (matched) {
        occurrences.push(i);
        yield {
          textIndex: i,
          patternIndex: m - 1,
          comparisonsCount: comparisons,
          compareTextChar: text[i + m - 1],
          comparePatternChar: pattern[m - 1],
          match: true,
          found: true,
          description: `Padrão encontrado na posição ${i}! Movendo 1 casa para frente.`,
          shift: 1
        };
      }
    }

    return {
      occurrences,
      comparisons,
      timeMs: performance.now() - start,
    };
  }
}
