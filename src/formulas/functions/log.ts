import type { FormulaFunction, EvaluationContext, ExpressionValue } from '../types';
import { resolveFieldReference } from '../utils';

function toNumber(arg: number | string | null | undefined, context: EvaluationContext): number | null {
  if (typeof arg === 'number') {
    return arg;
  }
  if (typeof arg === 'string') {
    const parsed = parseFloat(arg);
    if (!isNaN(parsed)) {
      return parsed;
    }
    const fieldValue = resolveFieldReference(arg, context);
    if (fieldValue !== null && fieldValue !== undefined) {
      if (typeof fieldValue === 'number') {
        return fieldValue;
      }
      if (typeof fieldValue === 'string') {
        const parsedField = parseFloat(fieldValue);
        return isNaN(parsedField) ? null : parsedField;
      }
    }
    return null;
  }
  return null;
}

export function createLogFunction(): FormulaFunction {
  return (args: (number | string | null)[], context: EvaluationContext): ExpressionValue => {
    if (args.length !== 1) {
      throw new Error(`log() requires exactly one argument, got ${args.length}`);
    }
    const numValue = toNumber(args[0], context);
    if (numValue === null) {
      return NaN;
    }
    return Math.log(numValue);
  };
}
