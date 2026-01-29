import type { FormulaEngine, EvaluationContext, ExpressionValue } from './types';
import type { Formula, FormulaResult } from '../types/questionnaire';
import type { AnswerStore } from '../types/answers';
import { createExpressionEvaluator } from './evaluator';
import { createFunctionRegistry } from './registry';
import { buildDependencyGraph, topologicalSort, extractFieldReferences } from './utils';

function evaluateExpression(
  expression: string,
  context: EvaluationContext
): ExpressionValue {
  const evaluator = createExpressionEvaluator();
  return evaluator.evaluate(expression, context);
}

function validateFormulaExpression(expression: string): boolean {
  const evaluator = createExpressionEvaluator();
  const result = evaluator.validate(expression);
  return result.isValid;
}

export function createFormulaEngine(): FormulaEngine {
  const functionRegistry = createFunctionRegistry();

  function evaluate(expression: string, answers: AnswerStore, formulas?: Record<string, number>): ExpressionValue {
    if (!expression || expression.trim() === '') {
      throw new Error('Expression cannot be empty');
    }

    const context: EvaluationContext = {
      answers,
      formulas,
      functions: functionRegistry,
    };

    return evaluateExpression(expression, context);
  }

  function evaluateFormula(formula: Formula, answers: AnswerStore, formulas?: Record<string, number>): FormulaResult {
    if (!formula.expression || formula.expression.trim() === '') {
      throw new Error('Formula expression cannot be empty');
    }

    try {
      const context: EvaluationContext = {
        answers,
        formulas,
        functions: functionRegistry,
      };

      const value = evaluateExpression(formula.expression, context);
      const numValue = typeof value === 'number' ? value : value === true ? 1 : value === false ? 0 : 0;

      return {
        formulaId: formula.id,
        value: numValue,
      };
    } catch (error) {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.startsWith('Evaluation error: ')) {
          errorMessage = errorMessage.substring('Evaluation error: '.length);
        }
      } else {
        errorMessage = String(error);
      }
      return {
        formulaId: formula.id,
        value: 0,
        error: errorMessage,
      };
    }
  }

  function evaluateAll(formulas: Formula[], answers: AnswerStore): FormulaResult[] {
    if (formulas.length === 0) {
      return [];
    }

    const graph = buildDependencyGraph(formulas);
    const sortedFormulas = topologicalSort(formulas, graph);
    const formulaResults = new Map<string, number>();
    const results: FormulaResult[] = [];

    for (const formula of sortedFormulas) {
      const context: EvaluationContext = {
        answers,
        formulas: Object.fromEntries(formulaResults),
        functions: functionRegistry,
      };

      try {
        const value = evaluateExpression(formula.expression, context);
        const numValue = typeof value === 'number' ? value : value === true ? 1 : value === false ? 0 : 0;
        formulaResults.set(formula.id, numValue);
        results.push({
          formulaId: formula.id,
          value: numValue,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          formulaId: formula.id,
          value: 0,
          error: errorMessage,
        });
        formulaResults.set(formula.id, 0);
      }
    }

    return results;
  }

  function validateExpression(expression: string): boolean {
    return validateFormulaExpression(expression);
  }

  function getReferencedFields(expression: string): string[] {
    return extractFieldReferences(expression);
  }

  return {
    evaluate,
    evaluateFormula,
    evaluateAll,
    validateExpression,
    getReferencedFields,
  };
}
