import type { ISearchStrategy } from './ISearchStrategy';
import type { SearchStep, SearchResult } from './models';

export class SearchContext {
  private strategy: ISearchStrategy;

  constructor(strategy: ISearchStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ISearchStrategy) {
    this.strategy = strategy;
  }
  
  getStrategyName(): string {
    return this.strategy.name;
  }
  
  getTheoreticalComplexity(): string {
    return this.strategy.theoreticalComplexity;
  }

  execute(text: string, pattern: string): SearchResult {
    return this.strategy.execute(text, pattern);
  }

  executeStepByStep(text: string, pattern: string): Generator<SearchStep, SearchResult, unknown> {
    return this.strategy.executeStepByStep(text, pattern);
  }
}
