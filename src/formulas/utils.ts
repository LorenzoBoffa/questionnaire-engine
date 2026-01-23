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

  return null;
}
