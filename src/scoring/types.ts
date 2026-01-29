import type { AnswerStore } from '../types/answers';
import type { ScoreFormula, ScoreResult, ScoringConfig } from '../types/scoring';
import type { FormulaEngine } from '../formulas/types';

export interface ScoringEngine {
  calculateScores(
    config: ScoringConfig,
    answers: AnswerStore
  ): ScoreResult[];
  
  validateScoringConfig(config: ScoringConfig): boolean;
}

export interface ScoringEngineDependencies {
  formulaEngine: FormulaEngine;
}
