import type { EvaluationContext, ExpressionValue } from './types';
import type { AnswerValue } from '../types/answers';

export function resolveFieldReference(
  fieldId: string,
  context: EvaluationContext
): ExpressionValue {
  if (context.formulas && context.formulas[fieldId] !== undefined) {
    console.log('[resolveFieldReference] Found formula for', fieldId, ':', context.formulas[fieldId]);
    return context.formulas[fieldId];
  }

  const answer = context.answers[fieldId];
  console.log('[resolveFieldReference] Field:', fieldId, 'Answer:', answer, 'Type:', typeof answer);
  
  if (answer === undefined || answer === null) {
    console.log('[resolveFieldReference] Returning null for', fieldId);
    return null;
  }

  if (typeof answer === 'string') {
    console.log('[resolveFieldReference] Returning string:', answer);
    return answer;
  }

  if (typeof answer === 'number') {
    const result = isNaN(answer) ? null : answer;
    console.log('[resolveFieldReference] Returning number:', result);
    return result;
  }

  console.log('[resolveFieldReference] Returning null (unknown type)');
  return null;
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
