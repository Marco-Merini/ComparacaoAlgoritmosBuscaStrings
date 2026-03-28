import type { ISearchStrategy } from './ISearchStrategy';
import type { SearchStep, SearchResult } from './models';

export class RabinKarpSearch implements ISearchStrategy {
  name = "Busca Rabin-Karp";
  theoreticalComplexity = "O(n + m) médio / O(n * m) pior caso";

  private readonly d = 256; // Number of characters in the input alphabet
  private readonly q = 101; // A prime number

  execute(text: string, pattern: string): SearchResult {
    const start = performance.now();
    let comparisons = 0;
    const occurrences: number[] = [];
    const n = text.length;
    const m = pattern.length;

    if (m === 0) return { occurrences, comparisons, timeMs: performance.now() - start };

    let i, j;
    let p = 0; // hash value for pattern
    let t = 0; // hash value for txt
    let h = 1;

    // The value of h would be "pow(d, m-1)%q"
    for (i = 0; i < m - 1; i++) {
      h = (h * this.d) % this.q;
    }

    // Calculate the hash value of pattern and first window of text
    for (i = 0; i < m; i++) {
      p = (this.d * p + pattern.charCodeAt(i)) % this.q;
      t = (this.d * t + text.charCodeAt(i)) % this.q;
    }

    // Slide the pattern over text one by one
    for (i = 0; i <= n - m; i++) {
      // Check the hash values of current window of text
      // and pattern. If the hash values match then only
      // check for characters one by one
      comparisons++; // Compare hashes
      if (p === t) {
        // Check for characters one by one
        for (j = 0; j < m; j++) {
          comparisons++;
          if (text[i + j] !== pattern[j]) {
            break;
          }
        }

        // if p == t and pattern[0...m-1] = text[i, i+1, ...i+m-1]
        if (j === m) {
          occurrences.push(i);
        }
      }

      // Calculate hash value for next window of text
      if (i < n - m) {
        t = (this.d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % this.q;

        // We might get negative value of t, converting it
        // to positive
        if (t < 0) {
          t = t + this.q;
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

    let i, j;
    let p = 0;
    let t = 0;
    let h = 1;

    for (i = 0; i < m - 1; i++) {
      h = (h * this.d) % this.q;
    }

    for (i = 0; i < m; i++) {
      p = (this.d * p + pattern.charCodeAt(i)) % this.q;
      t = (this.d * t + text.charCodeAt(i)) % this.q;
    }

    for (i = 0; i <= n - m; i++) {
      comparisons++;
      const hashHit = p === t;
      
      yield {
        textIndex: i,
        patternIndex: 0,
        comparisonsCount: comparisons,
        compareTextChar: text[i],
        comparePatternChar: pattern[0],
        match: false,
        found: false,
        description: hashHit ? `Hash de P (${p}) e T (${t}) combinam. Verificando caracteres.` : `Hash diferente (P:${p} != T:${t}). Avançando 1 casa.`,
        hashPattern: p,
        hashText: t,
        shift: 1
      };

      if (hashHit) {
        for (j = 0; j < m; j++) {
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
            description: match ? `Caractere bate ('${pattern[j]}').` : `Colisão ou diferença ('${text[i + j]}' != '${pattern[j]}'). Abortando verificação interna.`,
            hashPattern: p,
            hashText: t,
            shift: 1
          };

          if (!match) break;
        }

        if (j === m) {
          occurrences.push(i);
          yield {
            textIndex: i,
            patternIndex: m - 1,
            comparisonsCount: comparisons,
            compareTextChar: text[i + m - 1],
            comparePatternChar: pattern[m - 1],
            match: true,
            found: true,
            description: `Padrão encontrado na posição ${i}!`,
            hashPattern: p,
            hashText: t,
            shift: 1
          };
        }
      }

      if (i < n - m) {
        t = (this.d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % this.q;
        if (t < 0) t = t + this.q;
      }
    }

    return { occurrences, comparisons, timeMs: performance.now() - start };
  }
}
