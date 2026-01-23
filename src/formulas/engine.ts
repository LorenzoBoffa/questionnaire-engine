import type { FormulaEngine, EvaluationContext, ExpressionValue } from './types';
import type { Formula, FormulaResult } from '../types/questionnaire';
import type { AnswerStore } from '../types/answers';
import { createExpressionEvaluator } from './evaluator';
import { createFunctionRegistry } from './registry';

function extractFieldReferences(expression: string): string[] {
  const fieldRefs = new Set<string>();
  const fieldRefRegex = /\b([a-zA-Z_][a-zA-Z0-9_-]*)\b/g;
  const functionCallRegex = /\b([a-zA-Z_][a-zA-Z0-9_-]*)\s*\(/g;

  const functionNames = new Set<string>();
  let match;
  while ((match = functionCallRegex.exec(expression)) !== null) {
    functionNames.add(match[1]);
  }

  while ((match = fieldRefRegex.exec(expression)) !== null) {
    const identifier = match[1];
    if (!functionNames.has(identifier)) {
      fieldRefs.add(identifier);
    }
  }

  return Array.from(fieldRefs);
}

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

function buildDependencyGraph(formulas: Formula[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const formula of formulas) {
    const deps = extractFieldReferences(formula.expression);
    graph.set(formula.id, deps);
  }

  return graph;
}

function topologicalSort(formulas: Formula[], graph: Map<string, string[]>): Formula[] {
  const formulaMap = new Map<string, Formula>();
  for (const formula of formulas) {
    formulaMap.set(formula.id, formula);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: Formula[] = [];

  function visit(formulaId: string): void {
    if (visiting.has(formulaId)) {
      return;
    }
    if (visited.has(formulaId)) {
      return;
    }

    visiting.add(formulaId);
    const deps = graph.get(formulaId) || [];
    for (const dep of deps) {
      if (formulaMap.has(dep)) {
        visit(dep);
      }
    }
    visiting.delete(formulaId);
    visited.add(formulaId);

    const formula = formulaMap.get(formulaId);
    if (formula) {
      sorted.push(formula);
    }
  }

  for (const formula of formulas) {
    if (!visited.has(formula.id)) {
      visit(formula.id);
    }
  }

  return sorted;
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
