import type { EvaluationContext, ExpressionValue } from './types';
import type { AnswerValue } from '../types/answers';

export function resolveFieldReference(
  fieldId: string,
  context: EvaluationContext
): ExpressionValue {
  if (context.formulas && context.formulas[fieldId] !== undefined) {
    return context.formulas[fieldId];
  }

  const answer = context.answers[fieldId];
  
  if (answer === undefined || answer === null) {
    return 0;
  }

  if (typeof answer === 'string') {
    return answer;
  }

  if (typeof answer === 'number') {
    const result = isNaN(answer) ? 0 : answer;
    return result;
  }

  if (Array.isArray(answer)) {
    return answer.length;
  }

  return 0;
}

export function convertToNumber(value: AnswerValue): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  return null;
}

export function extractFieldReferences(expression: string): string[] {
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

export function buildDependencyGraph<T extends { id: string; expression: string }>(
  formulas: T[]
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const formula of formulas) {
    const deps = extractFieldReferences(formula.expression);
    graph.set(formula.id, deps);
  }

  return graph;
}

export function topologicalSort<T extends { id: string }>(
  formulas: T[],
  graph: Map<string, string[]>
): T[] {
  const formulaMap = new Map<string, T>();
  for (const formula of formulas) {
    formulaMap.set(formula.id, formula);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: T[] = [];

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
