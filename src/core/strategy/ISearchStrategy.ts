import type { SearchStep, SearchResult } from './models';

export interface ISearchStrategy {
  name: string;
  theoreticalComplexity: string;
  
  execute(text: string, pattern: string): SearchResult;
  executeStepByStep(text: string, pattern: string): Generator<SearchStep, SearchResult, unknown>;
}
