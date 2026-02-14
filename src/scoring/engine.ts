import type { ScoringEngine, ScoringEngineDependencies } from './types';
import type { ScoreResult, ScoringConfig } from '../types/scoring';
import type { AnswerStore } from '../types/answers';
import { buildDependencyGraph, topologicalSort } from '../formulas/utils';

export function createScoringEngine(
  dependencies: ScoringEngineDependencies
): ScoringEngine {
  const { formulaEngine } = dependencies;

  function calculateScores(
    config: ScoringConfig,
    answers: AnswerStore
  ): ScoreResult[] {
    if (!config.formulas || config.formulas.length === 0) {
      return [];
    }

    const graph = buildDependencyGraph(config.formulas);
    const sortedFormulas = topologicalSort(config.formulas, graph);
    const formulaResults = new Map<string, number>();
    const results: ScoreResult[] = [];

    for (const formula of sortedFormulas) {
      if (!formula.expression || formula.expression.trim() === '') {
        results.push({
          formulaId: formula.id,
          parameterName: formula.parameterName,
          value: 0,
          error: 'Formula expression cannot be empty',
        });
        formulaResults.set(formula.id, 0);
        continue;
      }

      try {
        const formulasMap = Object.fromEntries(formulaResults);
        const value = formulaEngine.evaluate(formula.expression, answers, formulasMap);
        const numValue = typeof value === 'number' ? value : value === true ? 1 : value === false ? 0 : 0;
        
        formulaResults.set(formula.id, numValue);
        results.push({
          formulaId: formula.id,
          parameterName: formula.parameterName,
          value: numValue,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          formulaId: formula.id,
          parameterName: formula.parameterName,
          value: 0,
          error: errorMessage,
        });
        formulaResults.set(formula.id, 0);
      }
    }

    return results;
  }

  function validateScoringConfig(config: ScoringConfig): boolean {
    if (!config || !config.formulas) {
      return false;
    }

    if (!Array.isArray(config.formulas)) {
      return false;
    }

    for (const formula of config.formulas) {
      if (!formula.id || !formula.parameterName || !formula.expression) {
        return false;
      }

      if (!formulaEngine.validateExpression(formula.expression)) {
        return false;
      }
    }

    return true;
  }

  return {
    calculateScores,
    validateScoringConfig,
  };
}
